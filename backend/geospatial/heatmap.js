import { incidents } from './geoStore.js';

function getHeatmapPoints(days = 30) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return incidents
        .filter((incident) => {
            if (!incident?.time) {
                return true;
            }

            return incident.time >= cutoff;
        })
        .map((incident) => ({
            lat: incident.lat,
            lng: incident.lng,
            created_at: incident.time ? new Date(incident.time).toISOString() : null
        }));
}

export { getHeatmapPoints };
