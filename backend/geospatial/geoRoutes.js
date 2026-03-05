import express from 'express';

import { incidents, sightings } from './geoStore.js';
import { getHeatmapPoints } from './heatmap.js';
import { getClusters } from './clustering.js';
import { supabase, SUPABASE_CONFIGURED } from '../supabaseClient.js';

const router = express.Router();

function parseCoordinate(value) {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSeverity(severity) {
    const normalized = (severity || 'unknown').toString().toLowerCase();
    return normalized || 'unknown';
}

function normalizeTimestamp(value) {
    if (!value) {
        return new Date().toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function parseDays(value, defaultDays = 30) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return defaultDays;
    }

    return Math.min(parsed, 365);
}

function sinceIsoFromDays(days) {
    const now = Date.now();
    const windowMs = days * 24 * 60 * 60 * 1000;
    return new Date(now - windowMs).toISOString();
}

router.post('/incident', async (req, res) => {
    const { lat, lng, type, severity, created_at, timestamp } = req.body;

    const parsedLat = parseCoordinate(lat);
    const parsedLng = parseCoordinate(lng);

    if (parsedLat === null || parsedLng === null) {
        return res.status(400).json({ error: 'Valid lat/lng are required' });
    }

    const incidentRecord = {
        type: type || 'snake_bite',
        lat: parsedLat,
        lng: parsedLng,
        severity: normalizeSeverity(severity),
        created_at: normalizeTimestamp(created_at || timestamp)
    };

    if (SUPABASE_CONFIGURED && supabase) {
        const { error } = await supabase
            .from('incidents')
            .insert([incidentRecord]);

        if (!error) {
            incidents.push({
                lat: incidentRecord.lat,
                lng: incidentRecord.lng,
                type: incidentRecord.type,
                severity: incidentRecord.severity,
                time: Date.parse(incidentRecord.created_at)
            });

            return res.json({ success: true, source: 'supabase' });
        }
    }

    incidents.push({
        lat: incidentRecord.lat,
        lng: incidentRecord.lng,
        type: incidentRecord.type,
        severity: incidentRecord.severity,
        time: Date.parse(incidentRecord.created_at)
    });

    return res.json({ success: true, source: 'memory' });
});

router.post('/sighting', async (req, res) => {
    const { lat, lng, animal, created_at, timestamp } = req.body;

    const parsedLat = parseCoordinate(lat);
    const parsedLng = parseCoordinate(lng);

    if (parsedLat === null || parsedLng === null) {
        return res.status(400).json({ error: 'Valid lat/lng are required' });
    }

    const sightingRecord = {
        animal: animal || 'unknown',
        lat: parsedLat,
        lng: parsedLng,
        created_at: normalizeTimestamp(created_at || timestamp)
    };

    if (SUPABASE_CONFIGURED && supabase) {
        const { error } = await supabase
            .from('sightings')
            .insert([sightingRecord]);

        if (!error) {
            sightings.push({
                ...sightingRecord,
                time: Date.parse(sightingRecord.created_at)
            });
            return res.json({ success: true, source: 'supabase' });
        }
    }

    sightings.push({
        ...sightingRecord,
        time: Date.parse(sightingRecord.created_at)
    });

    return res.json({ success: true, source: 'memory' });
});

router.get('/heatmap', async (req, res) => {
    const days = parseDays(req.query.days, 30);
    const sinceIso = sinceIsoFromDays(days);

    if (SUPABASE_CONFIGURED && supabase) {
        const { data, error } = await supabase
            .from('incidents')
            .select('lat,lng,created_at')
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(5000);

        if (!error) {
            return res.json(data || []);
        }
    }

    return res.json(getHeatmapPoints(days));
});

router.get('/clusters', async (req, res) => {
    const days = parseDays(req.query.days, 30);
    const sinceIso = sinceIsoFromDays(days);

    if (SUPABASE_CONFIGURED && supabase) {
        const { data, error } = await supabase
            .from('sightings')
            .select('lat,lng,animal')
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(5000);

        if (!error) {
            return res.json(getClusters(Array.isArray(data) ? data : []));
        }
    }

    return res.json(getClusters());
});

router.get('/sightings', async (req, res) => {
    const days = parseDays(req.query.days, 30);
    const sinceIso = sinceIsoFromDays(days);

    if (SUPABASE_CONFIGURED && supabase) {
        const { data, error } = await supabase
            .from('sightings')
            .select('lat,lng,animal,created_at')
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(5000);

        if (!error) {
            return res.json(data || []);
        }
    }

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return res.json(
        sightings.filter((sighting) => {
            if (!sighting?.time) {
                return true;
            }

            return sighting.time >= cutoff;
        })
    );
});

export default router;
