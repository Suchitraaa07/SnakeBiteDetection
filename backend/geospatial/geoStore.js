const incidents = [];
const sightings = [];

sightings.push({ lat: 21.145, lng: 79.089, animal: 'snake', time: Date.now() });
sightings.push({ lat: 21.146, lng: 79.088, animal: 'snake', time: Date.now() });
sightings.push({ lat: 21.147, lng: 79.09, animal: 'snake', time: Date.now() });

incidents.push({ lat: 21.145, lng: 79.089, type: 'snake_bite', severity: 'unknown', time: Date.now() });
incidents.push({ lat: 21.146, lng: 79.088, type: 'snake_bite', severity: 'unknown', time: Date.now() });
incidents.push({ lat: 21.147, lng: 79.09, type: 'snake_bite', severity: 'unknown', time: Date.now() });
incidents.push({ lat: 21.144, lng: 79.087, type: 'snake_bite', severity: 'unknown', time: Date.now() });

export { incidents, sightings };
