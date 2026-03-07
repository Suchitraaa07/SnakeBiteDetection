import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, Navigation, Clock, Star, Loader2, AlertCircle } from 'lucide-react';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom hospital marker icon
const hospitalIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="32" height="32">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.88c0 4.35-2.92 8.55-8 9.92-5.08-1.37-8-5.57-8-9.92V7.78l8-3.6zM11 8v3H8v2h3v3h2v-3h3v-2h-3V8h-2z"/>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// User location marker icon
const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#84cc16" width="32" height="32">
            <circle cx="12" cy="12" r="8" fill="#84cc16" opacity="0.5"/>
            <circle cx="12" cy="12" r="4" fill="#84cc16"/>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// Component to update map view
const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    
    return null;
};

const HospitalLocator = () => {
    const [snakebiteHospitals, setSnakebiteHospitals] = useState([]);
    const [generalHospitals, setGeneralHospitals] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [incidentType, setIncidentType] = useState('snake_bite'); // default for filter, but we fetch both
    const [radius, setRadius] = useState(50);
    const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Default: Mumbai
    const [mapZoom, setMapZoom] = useState(11);

    // Get user location
    const getUserLocation = () => {
        setLoading(true);
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const location = { latitude, longitude };
                setUserLocation(location);
                setMapCenter([latitude, longitude]);
                setMapZoom(13);
                fetchNearbyHospitals(latitude, longitude);
            },
            (error) => {
                setError('Unable to get your location. Please enable location access.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Fetch both snakebite and general hospitals in parallel
    const fetchNearbyHospitals = async (lat, lng) => {
        setLoading(true);
        setError('');
        try {
            // Snakebite hospitals (with antivenin)
            const snakeParams = new URLSearchParams({
                latitude: lat,
                longitude: lng,
                type: 'snake_bite',
                radius: radius,
                limit: 5
            });
            // General hospitals (any type)
            const generalParams = new URLSearchParams({
                latitude: lat,
                longitude: lng,
                radius: radius,
                limit: 5
            });
            const [snakeRes, generalRes] = await Promise.all([
                fetch(`/api/hospitals/nearest?${snakeParams}`),
                fetch(`/api/hospitals/nearest?${generalParams}`)
            ]);
            const [snakeData, generalData] = await Promise.all([
                snakeRes.json(),
                generalRes.json()
            ]);
            if (!snakeRes.ok) throw new Error(snakeData.error || 'Failed to fetch snakebite hospitals');
            if (!generalRes.ok) throw new Error(generalData.error || 'Failed to fetch general hospitals');
            setSnakebiteHospitals(snakeData.hospitals || []);
            setGeneralHospitals(generalData.hospitals || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching hospitals:', err);
        } finally {
            setLoading(false);
        }
    };

    // Open directions in Google Maps
    const openDirections = (hospital) => {
        if (userLocation) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${hospital.latitude},${hospital.longitude}`;
            window.open(url, '_blank');
        }
    };

    // Call phone number
    const callHospital = (phone) => {
        window.location.href = `tel:${phone}`;
    };

    useEffect(() => {
        getUserLocation();
    }, []);

    useEffect(() => {
        if (userLocation) {
            fetchNearbyHospitals(userLocation.latitude, userLocation.longitude);
        }
    }, [radius, userLocation]);

    // Filter generalHospitals to exclude any hospital already in snakebiteHospitals
    const snakebiteIds = new Set(snakebiteHospitals.map(h => h.id));
    const filteredGeneralHospitals = generalHospitals.filter(h => !snakebiteIds.has(h.id));

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-danger-500/20 p-3 rounded-xl">
                        <MapPin className="w-6 h-6 text-danger-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">Nearest Hospitals</h2>
                        <p className="text-gray-300 text-sm">
                            Find hospitals with anti-venom and emergency treatment
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">Incident Type</label>
                        <select
                            value={incidentType}
                            onChange={(e) => setIncidentType(e.target.value)}
                            className="input-field"
                        >
                            <option value="snake_bite">Snake Bite</option>
                            <option value="monkey_bite">Monkey Bite</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Search Radius</label>
                        <select
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value))}
                            className="input-field"
                        >
                            <option value="10">10 km</option>
                            <option value="25">25 km</option>
                            <option value="50">50 km</option>
                            <option value="100">100 km</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={getUserLocation}
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Navigation className="w-4 h-4" />
                                    Update Location
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert-danger mt-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="glass-card p-6">
                <div className="relative">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: '500px', width: '100%' }}
                        className="rounded-xl shadow-glass"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapUpdater center={mapCenter} zoom={mapZoom} />

                        {/* User Location Marker */}
                        {userLocation && (
                            <Marker
                                position={[userLocation.latitude, userLocation.longitude]}
                                icon={userIcon}
                            >
                                <Popup>
                                    <div className="text-sm">
                                        <strong>Your Location</strong>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Hospital Markers */}
                        {/* Show both types of hospitals on the map */}
                        {snakebiteHospitals.map((hospital) => (
                            <Marker
                                key={`marker-snakebite-${hospital.id}`}
                                position={[hospital.latitude, hospital.longitude]}
                                icon={hospitalIcon}
                            >
                                <Popup maxWidth={300}>
                                    <div className="p-2">
                                        <h3 className="font-bold text-lg mb-2">{hospital.name}</h3>
                                        <div className="space-y-1 text-sm">
                                            <p className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {hospital.distance_km} km away
                                            </p>
                                            {hospital.phone && (
                                                <p className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {hospital.phone}
                                                </p>
                                            )}
                                            {hospital.is_24x7 && (
                                                <p className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    24/7 Available
                                                </p>
                                            )}
                                            {hospital.rating && (
                                                <p className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    {hospital.rating} / 5
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => openDirections(hospital)}
                                            className="mt-3 w-full bg-moss-600 hover:bg-moss-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                                        >
                                            Get Directions
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {filteredGeneralHospitals.map((hospital) => (
                            <Marker
                                key={`marker-general-${hospital.id}`}
                                position={[hospital.latitude, hospital.longitude]}
                                icon={hospitalIcon}
                            >
                                <Popup maxWidth={300}>
                                    <div className="p-2">
                                        <h3 className="font-bold text-lg mb-2">{hospital.name}</h3>
                                        <div className="space-y-1 text-sm">
                                            <p className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {hospital.distance_km} km away
                                            </p>
                                            {hospital.phone && (
                                                <p className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {hospital.phone}
                                                </p>
                                            )}
                                            {hospital.is_24x7 && (
                                                <p className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    24/7 Available
                                                </p>
                                            )}
                                            {hospital.rating && (
                                                <p className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    {hospital.rating} / 5
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => openDirections(hospital)}
                                            className="mt-3 w-full bg-moss-600 hover:bg-moss-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                                        >
                                            Get Directions
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Hospital Lists */}
            <div className="glass-card p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Nearest Hospitals with Anti-venom</h3>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-moss-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-300">Loading hospitals...</p>
                    </div>
                ) : snakebiteHospitals.length === 0 ? (
                    <div className="text-center py-8 bg-forest-900/50 rounded-xl">
                        <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-300 text-base">No snakebite treatment hospitals found in this radius</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {snakebiteHospitals.map((hospital, index) => (
                            <div
                                key={`snakebite-${hospital.id}`}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-moss-500/50 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg"
                                onClick={() => {
                                    setMapCenter([hospital.latitude, hospital.longitude]);
                                    setMapZoom(15);
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-moss-500/20 text-moss-300 px-3 py-1 rounded-full text-sm font-semibold">
                                                #{index + 1}
                                            </span>
                                            <h4 className="text-lg font-bold text-white">{hospital.name}</h4>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-3">{hospital.address}</p>
                                        <div className="flex flex-wrap gap-3 text-sm">
                                            <span className="flex items-center gap-1 text-moss-300">
                                                <MapPin className="w-4 h-4" />
                                                {hospital.distance_km} km
                                            </span>
                                            {hospital.is_24x7 && (
                                                <span className="flex items-center gap-1 text-forest-300">
                                                    <Clock className="w-4 h-4" />
                                                    24/7
                                                </span>
                                            )}
                                            {hospital.rating && (
                                                <span className="flex items-center gap-1 text-yellow-400">
                                                    <Star className="w-4 h-4 fill-yellow-400" />
                                                    {hospital.rating}
                                                </span>
                                            )}
                                            {hospital.has_treatment && (
                                                <span className="bg-moss-500/20 text-moss-300 px-2 py-1 rounded-full text-xs font-semibold">
                                                    ✓ Anti-venom Available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {hospital.emergency_phone && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    callHospital(hospital.emergency_phone);
                                                }}
                                                className="btn-danger px-4 py-2 text-sm whitespace-nowrap"
                                            >
                                                <Phone className="w-4 h-4 inline mr-2" />
                                                Emergency Call
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDirections(hospital);
                                            }}
                                            className="btn-secondary px-4 py-2 text-sm whitespace-nowrap"
                                        >
                                            <Navigation className="w-4 h-4 inline mr-2" />
                                            Directions
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4">Nearest General Hospitals</h3>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-moss-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-300">Loading hospitals...</p>
                    </div>
                ) : generalHospitals.length === 0 ? (
                    <div className="text-center py-8 bg-forest-900/50 rounded-xl">
                        <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-300 text-base">No general hospitals found in this radius</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {generalHospitals.map((hospital, index) => (
                            <div
                                key={`general-${hospital.id}`}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-moss-500/50 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:shadow-lg"
                                onClick={() => {
                                    setMapCenter([hospital.latitude, hospital.longitude]);
                                    setMapZoom(15);
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-moss-500/20 text-moss-300 px-3 py-1 rounded-full text-sm font-semibold">
                                                #{index + 1}
                                            </span>
                                            <h4 className="text-lg font-bold text-white">{hospital.name}</h4>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-3">{hospital.address}</p>
                                        <div className="flex flex-wrap gap-3 text-sm">
                                            <span className="flex items-center gap-1 text-moss-300">
                                                <MapPin className="w-4 h-4" />
                                                {hospital.distance_km} km
                                            </span>
                                            {hospital.is_24x7 && (
                                                <span className="flex items-center gap-1 text-forest-300">
                                                    <Clock className="w-4 h-4" />
                                                    24/7
                                                </span>
                                            )}
                                            {hospital.rating && (
                                                <span className="flex items-center gap-1 text-yellow-400">
                                                    <Star className="w-4 h-4 fill-yellow-400" />
                                                    {hospital.rating}
                                                </span>
                                            )}
                                            {hospital.has_treatment && (
                                                <span className="bg-moss-500/20 text-moss-300 px-2 py-1 rounded-full text-xs font-semibold">
                                                    ✓ Anti-venom Available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {hospital.emergency_phone && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    callHospital(hospital.emergency_phone);
                                                }}
                                                className="btn-danger px-4 py-2 text-sm whitespace-nowrap"
                                            >
                                                <Phone className="w-4 h-4 inline mr-2" />
                                                Emergency Call
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDirections(hospital);
                                            }}
                                            className="btn-secondary px-4 py-2 text-sm whitespace-nowrap"
                                        >
                                            <Navigation className="w-4 h-4 inline mr-2" />
                                            Directions
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalLocator;
