import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { AlertTriangle, CalendarDays, Loader2, Plus } from 'lucide-react';

const timeframeOptions = [
    { id: 'today', label: 'Today', days: 1 },
    { id: 'week', label: 'This Week', days: 7 },
    { id: 'month', label: 'This Month', days: 30 }
];

const pulseHotspotIcon = L.divIcon({
    className: 'pulse-hotspot-marker',
    html: '<div class="pulse-hotspot-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

const sightingIcon = L.divIcon({
    className: 'pulse-hotspot-marker',
    html: '<div style="width:12px;height:12px;border-radius:9999px;background:#a855f7;border:2px solid #ddd6fe;"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8]
});

function parseCoordinate(value) {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function isValidCoordinate(lat, lng) {
    return (
        Number.isFinite(lat)
        && Number.isFinite(lng)
        && lat >= -90
        && lat <= 90
        && lng >= -180
        && lng <= 180
    );
}

function coerceLatLng(point) {
    const lat = parseCoordinate(point?.lat ?? point?.latitude);
    const lng = parseCoordinate(point?.lng ?? point?.lon ?? point?.longitude);

    if (!isValidCoordinate(lat, lng)) {
        return null;
    }

    return { lat, lng };
}

const HeatLayer = ({ points }) => {
    const map = useMap();
    const heatLayerRef = useRef(null);

    useEffect(() => {
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        if (!points.length) {
            return;
        }

        const heatPoints = points
            .map((point) => {
                const lat = Number.parseFloat(point.lat);
                const lng = Number.parseFloat(point.lng);
                const intensity = Number.parseFloat(point.intensity ?? 0.8);

                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                    return null;
                }

                return [lat, lng, Number.isFinite(intensity) ? intensity : 0.8];
            })
            .filter(Boolean);

        if (!heatPoints.length) {
            return;
        }

        if (typeof L.heatLayer !== 'function') {
            // Guard against plugin load mismatch that can otherwise crash the whole tab.
            console.warn('leaflet.heat plugin is not available; skipping heat layer rendering.');
            return;
        }

        try {
            heatLayerRef.current = L.heatLayer(heatPoints, {
                radius: 45,
                blur: 30,
                maxZoom: 17,
                gradient: {
                    0.2: 'blue',
                    0.4: 'lime',
                    0.6: 'yellow',
                    0.8: 'orange',
                    1: 'red'
                }
            }).addTo(map);
        } catch (layerError) {
            console.error('Failed to render heat layer:', layerError);
        }

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }
        };
    }, [points, map]);

    return null;
};

const LocalViewport = ({ points, strongestHotspot, defaultCenter }) => {
    const map = useMap();

    useEffect(() => {
        try {
            if (strongestHotspot) {
                map.flyTo([strongestHotspot.lat, strongestHotspot.lng], 14, { duration: 1.2 });
                return;
            }

            if (!points.length) {
                map.flyTo(defaultCenter, 12, { duration: 1.2 });
                return;
            }

            const safePoints = points
                .filter((point) => isValidCoordinate(point?.lat, point?.lng))
                .map((point) => [point.lat, point.lng]);

            if (!safePoints.length) {
                map.flyTo(defaultCenter, 12, { duration: 1.2 });
                return;
            }

            const bounds = L.latLngBounds(safePoints);
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
        } catch (viewportError) {
            console.error('Failed to adjust map viewport:', viewportError);
            map.flyTo(defaultCenter, 12, { duration: 1.2 });
        }
    }, [defaultCenter, map, points, strongestHotspot]);

    return null;
};

function aggregateLocalHotspots(points) {
    const buckets = new Map();

    points.forEach((point) => {
        if (!isValidCoordinate(point?.lat, point?.lng)) {
            return;
        }

        const latBucket = Math.round(point.lat * 400) / 400;
        const lngBucket = Math.round(point.lng * 400) / 400;
        const key = `${latBucket}:${lngBucket}`;
        const current = buckets.get(key) || { lat: latBucket, lng: lngBucket, count: 0, points: [] };
        current.count += 1;
        current.points.push(point);
        buckets.set(key, current);
    });

    return Array.from(buckets.values()).filter((bucket) => bucket.count >= 2).map((bucket) => ({
        ...bucket,
        riskLevel: bucket.count >= 5 ? 'HIGH' : bucket.count >= 3 ? 'MEDIUM' : 'LOW',
        commonTime: deriveCommonTimeBucket(bucket.points)
    }));
}

function deriveCommonTimeBucket(points) {
    const counts = {
        Morning: 0,
        Afternoon: 0,
        Evening: 0,
        Night: 0
    };

    points.forEach((point) => {
        if (!point?.created_at) {
            return;
        }

        const date = new Date(point.created_at);
        if (Number.isNaN(date.getTime())) {
            return;
        }

        const hour = date.getHours();
        if (hour >= 5 && hour < 12) {
            counts.Morning += 1;
        } else if (hour >= 12 && hour < 17) {
            counts.Afternoon += 1;
        } else if (hour >= 17 && hour < 21) {
            counts.Evening += 1;
        } else {
            counts.Night += 1;
        }
    });

    const [bestBucket] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return bestBucket?.[1] > 0 ? bestBucket[0] : 'Evening';
}

function buildRiskZones(points) {
    const buckets = new Map();

    points.forEach((point) => {
        if (!isValidCoordinate(point?.lat, point?.lng)) {
            return;
        }

        const latBucket = Math.round(point.lat * 100) / 100;
        const lngBucket = Math.round(point.lng * 100) / 100;
        const key = `${latBucket}:${lngBucket}`;
        const current = buckets.get(key) || { lat: latBucket, lng: lngBucket, count: 0 };
        current.count += 1;
        buckets.set(key, current);
    });

    return Array.from(buckets.values()).filter((zone) => zone.count >= 4);
}

function countNearbySightings(sightings, lat, lng, threshold = 0.01) {
    if (!isValidCoordinate(lat, lng)) {
        return 0;
    }

    return sightings.filter((sighting) => {
        if (!isValidCoordinate(sighting?.lat, sighting?.lng)) {
            return false;
        }

        const latDiff = Math.abs(sighting.lat - lat);
        const lngDiff = Math.abs(sighting.lng - lng);
        return latDiff <= threshold && lngDiff <= threshold;
    }).length;
}

const RiskMap = () => {
    const [heatData, setHeatData] = useState([]);
    const [sightings, setSightings] = useState([]);
    const [timeframe, setTimeframe] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reportingSighting, setReportingSighting] = useState(false);
    const [layerVisibility, setLayerVisibility] = useState({
        heatmap: true,
        sightings: true,
        hotspots: true
    });

    const selectedWindow = useMemo(
        () => timeframeOptions.find((option) => option.id === timeframe) || timeframeOptions[1],
        [timeframe]
    );

    const defaultCenter = [21.1458, 79.0882];
    const safeHeatData = useMemo(
        () => heatData.filter((point) => isValidCoordinate(point?.lat, point?.lng)),
        [heatData]
    );
    const safeSightings = useMemo(
        () => sightings.filter((point) => isValidCoordinate(point?.lat, point?.lng)),
        [sightings]
    );
    const allPoints = useMemo(
        () => [
            ...safeHeatData,
            ...safeSightings.map((sighting) => ({ lat: sighting.lat, lng: sighting.lng }))
        ],
        [safeHeatData, safeSightings]
    );
    const localHotspots = useMemo(() => aggregateLocalHotspots(safeHeatData), [safeHeatData]);
    const riskZones = useMemo(() => buildRiskZones(safeHeatData), [safeHeatData]);
    const strongestHotspot = useMemo(() => {
        if (!localHotspots.length) {
            return null;
        }

        return [...localHotspots].sort((a, b) => b.count - a.count)[0];
    }, [localHotspots]);
    const highRiskZones = useMemo(
        () => localHotspots.filter((hotspot) => hotspot.riskLevel === 'HIGH').length,
        [localHotspots]
    );

    const incidentsToday = useMemo(() => {
        const now = Date.now();
        const cutoff = now - 24 * 60 * 60 * 1000;

        return safeHeatData.filter((point) => {
            if (!point?.created_at) {
                return false;
            }

            const time = new Date(point.created_at).getTime();
            return Number.isFinite(time) && time >= cutoff;
        }).length;
    }, [safeHeatData]);

    const normalizeGeoHeatPoints = (data) => {
        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .map((point) => {
                const coords = coerceLatLng(point);

                if (!coords) {
                    return null;
                }

                return { lat: coords.lat, lng: coords.lng, intensity: 0.8, created_at: point?.created_at || null };
            })
            .filter(Boolean);
    };

    const normalizeApiHeatPoints = (payload) => {
        const rows = Array.isArray(payload) ? payload : payload?.data;
        if (!Array.isArray(rows)) {
            return [];
        }

        return rows
            .map((point) => {
                const coords = coerceLatLng(point);
                const intensity = Number.parseFloat(point?.intensity ?? 0.8);

                if (!coords) {
                    return null;
                }

                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    intensity: Number.isFinite(intensity) ? intensity : 0.8,
                    created_at: point?.created_at || null
                };
            })
            .filter(Boolean);
    };

    const normalizeSightings = (data) => {
        const rows = Array.isArray(data) ? data : data?.data;
        if (!Array.isArray(rows)) {
            return [];
        }

        return rows
            .map((point) => {
                const coords = coerceLatLng(point);

                if (!coords) {
                    return null;
                }

                return {
                    lat: coords.lat,
                    lng: coords.lng,
                    animal: point?.animal || 'snake',
                    created_at: point?.created_at || null
                };
            })
            .filter(Boolean);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const days = selectedWindow.days;

            const heatRes = await fetch(`/geo/heatmap?days=${days}`);
            const heatJson = await heatRes.json();
            if (!heatRes.ok) {
                throw new Error('Failed to fetch heatmap data');
            }

            const geoHeatPoints = normalizeGeoHeatPoints(heatJson);

            // Fallback: reports-based heatmap endpoint if geo incidents are empty.
            let finalHeatPoints = geoHeatPoints;
            if (!finalHeatPoints.length) {
                const apiHeatRes = await fetch(`/api/heatmap?type=snake_bite&days=${days}`);
                const apiHeatJson = await apiHeatRes.json();

                if (apiHeatRes.ok) {
                    finalHeatPoints = normalizeApiHeatPoints(apiHeatJson);
                }
            }

            const sightingsRes = await fetch(`/geo/sightings?days=${days}`);
            const sightingsJson = await sightingsRes.json();
            if (!sightingsRes.ok) {
                throw new Error('Failed to fetch sightings data');
            }

            setHeatData(finalHeatPoints);
            setSightings(normalizeSightings(sightingsJson));
        } catch (err) {
            setError(err.message || 'Failed to load risk map');
        } finally {
            setLoading(false);
        }
    }, [selectedWindow.days]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReportSighting = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setReportingSighting(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    const response = await fetch('/geo/sighting', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            animal: 'snake',
                            lat,
                            lng
                        })
                    });

                    if (!response.ok) {
                        const body = await response.text();
                        throw new Error(body || 'Failed to save sighting');
                    }

                    await fetchData();
                } catch (err) {
                    setError(err.message || 'Failed to report sighting');
                } finally {
                    setReportingSighting(false);
                }
            },
            () => {
                setError('Unable to get your location. Please enable location access.');
                setReportingSighting(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const toggleLayer = (layer) => {
        setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
    };

    return (
        <div className="glass-card p-6">
            <div className="mb-4">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Live Snake Activity Map</h2>
                        <p className="text-gray-300 text-sm">Heat zones, sightings, and active hotspots by selected timeframe</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleReportSighting}
                        disabled={reportingSighting}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {reportingSighting ? 'Saving Sighting...' : 'Report Snake Sighting'}
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {timeframeOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setTimeframe(option.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                                timeframe === option.id
                                    ? 'bg-moss-600 border-moss-500 text-white'
                                    : 'bg-white/5 border-white/20 text-gray-200 hover:bg-white/10'
                            }`}
                        >
                            <span className="inline-flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                {option.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="glass-card-sm p-3">
                        <p className="text-xs text-gray-300">🐍 Snake incidents today</p>
                        <p className="text-xl font-bold text-white">{incidentsToday}</p>
                    </div>
                    <div className="glass-card-sm p-3">
                        <p className="text-xs text-gray-300">🔥 Active hotspots</p>
                        <p className="text-xl font-bold text-white">{localHotspots.length}</p>
                    </div>
                    <div className="glass-card-sm p-3">
                        <p className="text-xs text-gray-300">🐍 Sightings reported</p>
                        <p className="text-xl font-bold text-white">{safeSightings.length}</p>
                    </div>
                    <div className="glass-card-sm p-3">
                        <p className="text-xs text-gray-300">🔥 High-risk zones</p>
                        <p className="text-xl font-bold text-white">{highRiskZones}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => toggleLayer('heatmap')}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                            layerVisibility.heatmap
                                ? 'bg-red-600/30 border-red-400/60 text-white'
                                : 'bg-white/5 border-white/20 text-gray-300'
                        }`}
                    >
                        {layerVisibility.heatmap ? '☑' : '☐'} Show Bite Heatmap
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleLayer('sightings')}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                            layerVisibility.sightings
                                ? 'bg-violet-600/30 border-violet-400/60 text-white'
                                : 'bg-white/5 border-white/20 text-gray-300'
                        }`}
                    >
                        {layerVisibility.sightings ? '☑' : '☐'} Show Sightings
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleLayer('hotspots')}
                        className={`px-3 py-1.5 rounded-lg text-xs border ${
                            layerVisibility.hotspots
                                ? 'bg-orange-600/30 border-orange-400/60 text-white'
                                : 'bg-white/5 border-white/20 text-gray-300'
                        }`}
                    >
                        {layerVisibility.hotspots ? '☑' : '☐'} Show Hotspots
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert-danger mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="h-[520px] rounded-xl bg-forest-900/50 flex items-center justify-center">
                    <div className="text-center text-gray-300">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-moss-500" />
                        Loading risk map...
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <MapContainer
                        center={defaultCenter}
                        zoom={14}
                        style={{ height: '520px', width: '100%' }}
                        className="rounded-xl"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <LocalViewport points={allPoints} strongestHotspot={strongestHotspot} defaultCenter={defaultCenter} />
                        {layerVisibility.heatmap && <HeatLayer points={safeHeatData} />}

                        {layerVisibility.hotspots && riskZones.map((zone, index) => (
                            <Circle
                                key={`risk-zone-${zone.lat}-${zone.lng}-${index}`}
                                center={[zone.lat, zone.lng]}
                                radius={400}
                                pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.25, weight: 2 }}
                            >
                                <Popup>
                                    ⚠️ Risk zone detected
                                    <br />
                                    Incidents: {zone.count}
                                    <br />
                                    Radius: 0.4 km
                                </Popup>
                            </Circle>
                        ))}

                        {layerVisibility.hotspots && localHotspots.map((hotspot, index) => (
                            <React.Fragment key={`hotspot-${hotspot.lat}-${hotspot.lng}-${index}`}>
                                <Circle
                                    center={[hotspot.lat, hotspot.lng]}
                                    radius={Math.min(80 + hotspot.count * 20, 180)}
                                    pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.18, weight: 1.5 }}
                                >
                                    <Popup>
                                        🔥 Snake Activity Hotspot
                                        <br />
                                        Incidents this week: {hotspot.count}
                                        <br />
                                        Sightings reported: {countNearbySightings(safeSightings, hotspot.lat, hotspot.lng)}
                                        <br />
                                        Risk level: {hotspot.riskLevel}
                                        <br />
                                        Common time: {hotspot.commonTime}
                                    </Popup>
                                </Circle>
                                <Marker position={[hotspot.lat, hotspot.lng]} icon={pulseHotspotIcon}>
                                    <Popup>
                                        🔥 Snake Activity Hotspot
                                        <br />
                                        Incidents this week: {hotspot.count}
                                        <br />
                                        Sightings reported: {countNearbySightings(safeSightings, hotspot.lat, hotspot.lng)}
                                        <br />
                                        Risk level: {hotspot.riskLevel}
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        ))}

                        {layerVisibility.sightings && safeSightings.map((sighting, index) => {
                            if (!isValidCoordinate(sighting?.lat, sighting?.lng)) {
                                return null;
                            }

                            return (
                                <Marker
                                    key={`sighting-${sighting.lat}-${sighting.lng}-${index}`}
                                    position={[sighting.lat, sighting.lng]}
                                    icon={sightingIcon}
                                >
                                    <Popup>
                                        🐍 Snake sighted
                                        <br />
                                        Type: {sighting.animal}
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    <div className="absolute bottom-4 right-4 z-[500]">
                        <div className="p-3 w-56 rounded-xl border border-white/35 bg-slate-900/85 backdrop-blur-sm shadow-xl">
                            <p className="text-sm font-semibold text-white mb-2">Legend</p>
                            <div className="space-y-1 text-xs text-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                                    <span>High snake activity</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
                                    <span>Medium activity</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3 w-3 rounded-full bg-yellow-300" />
                                    <span>Low activity</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3 w-3 rounded-full bg-violet-500" />
                                    <span>Purple sightings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskMap;
