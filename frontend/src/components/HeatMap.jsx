import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Activity, Filter, Loader2 } from 'lucide-react';

// Component to add heatmap layer to the map
const HeatmapLayer = ({ points }) => {
    const map = useMap();
    const heatLayerRef = useRef(null);

    useEffect(() => {
        if (!points || points.length === 0) return;

        // Remove existing heat layer
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
        }

        // Convert data to leaflet.heat format: [lat, lng, intensity]
        const heatData = points.map(point => [
            point.latitude,
            point.longitude,
            point.intensity || 0.5
        ]);

        // Create heat layer
        heatLayerRef.current = L.heatLayer(heatData, {
            radius: 25,
            blur: 35,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: '#84cc16',  // moss-500
                0.3: '#eab308',  // yellow
                0.5: '#f97316',  // danger-500
                0.7: '#ef4444',  // red
                1.0: '#dc2626'   // dark red
            }
        }).addTo(map);

        // Fit bounds if we have data
        if (heatData.length > 0) {
            const bounds = L.latLngBounds(heatData.map(p => [p[0], p[1]]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
            }
        };
    }, [points, map]);

    return null;
};

const HeatMap = () => {
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        days: 30,
        incidentType: null
    });
    const [showFilters, setShowFilters] = useState(false);

    // Default center (Mumbai, India)
    const defaultCenter = [19.0760, 72.8777];
    const defaultZoom = 11;

    // Fetch heatmap data
    const fetchHeatmapData = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('days', filters.days);
            if (filters.incidentType) {
                params.append('type', filters.incidentType);
            }

            const response = await fetch(`/api/heatmap?${params}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch heatmap data');
            }

            setHeatmapData(result.data || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching heatmap data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeatmapData();
    }, [filters]);

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-danger-500/20 p-3 rounded-xl">
                        <Activity className="w-6 h-6 text-danger-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Bite Incident Heatmap</h2>
                        <p className="text-gray-300 text-sm">
                            {heatmapData.length} incidents in the last {filters.days} days
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Time Period</label>
                            <select
                                value={filters.days}
                                onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
                                className="input-field"
                            >
                                <option value="7">Last 7 days</option>
                                <option value="14">Last 14 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="180">Last 6 months</option>
                                <option value="365">Last year</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Incident Type</label>
                            <select
                                value={filters.incidentType || ''}
                                onChange={(e) => setFilters({ ...filters, incidentType: e.target.value || null })}
                                className="input-field"
                            >
                                <option value="">All Types</option>
                                <option value="snake_bite">Snake Bites Only</option>
                                <option value="monkey_bite">Monkey Bites Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-sm font-semibold text-gray-300 mb-2">Severity Legend:</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-moss-500"></div>
                                <span className="text-sm text-gray-300">Low</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-300">Moderate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-danger-500"></div>
                                <span className="text-sm text-gray-300">High</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-red-600"></div>
                                <span className="text-sm text-gray-300">Critical</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="alert-danger mb-6">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center h-96 bg-forest-900/50 rounded-xl">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-moss-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-300">Loading heatmap data...</p>
                    </div>
                </div>
            )}

            {/* Map */}
            {!loading && (
                <div className="relative">
                    <MapContainer
                        center={defaultCenter}
                        zoom={defaultZoom}
                        style={{ height: '600px', width: '100%' }}
                        className="rounded-xl shadow-glass"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <HeatmapLayer points={heatmapData} />
                    </MapContainer>

                    {/* Stats Overlay */}
                    <div className="absolute top-4 right-4 glass-card-sm p-4 z-[1000]">
                        <h3 className="font-semibold text-white mb-2">Statistics</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-300">Total Incidents:</span>
                                <span className="font-semibold text-white">{heatmapData.length}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-300">Snake Bites:</span>
                                <span className="font-semibold text-white">
                                    {heatmapData.filter(d => d.incident_type === 'snake_bite').length}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-300">Monkey Bites:</span>
                                <span className="font-semibold text-white">
                                    {heatmapData.filter(d => d.incident_type === 'monkey_bite').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Data Message */}
            {!loading && heatmapData.length === 0 && (
                <div className="text-center py-12 bg-forest-900/50 rounded-xl">
                    <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-300 text-lg">No incident data available for the selected filters</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or date range</p>
                </div>
            )}

            {/* Refresh Button */}
            {!loading && (
                <div className="mt-4 text-center">
                    <button
                        onClick={fetchHeatmapData}
                        className="btn-secondary inline-flex items-center gap-2"
                    >
                        <Activity className="w-4 h-4" />
                        Refresh Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default HeatMap;
