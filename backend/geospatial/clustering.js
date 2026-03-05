import clustering from 'density-clustering';
import { sightings } from './geoStore.js';

function getClusters(sightingDataset = sightings) {
    if (!Array.isArray(sightingDataset) || sightingDataset.length < 3) {
        return [];
    }

    const dbscan = new clustering.DBSCAN();
    const dataset = sightingDataset.map((sighting) => [sighting.lat, sighting.lng]);
    const clusters = dbscan.run(dataset, 0.01, 3);

    const result = clusters.map((cluster) => {
        const points = cluster.map((index) => sightingDataset[index]);

        const lat = points.reduce((acc, point) => acc + point.lat, 0) / points.length;
        const lng = points.reduce((acc, point) => acc + point.lng, 0) / points.length;

        return {
            lat,
            lng,
            count: points.length
        };
    });

    return result;
}

export { getClusters };
