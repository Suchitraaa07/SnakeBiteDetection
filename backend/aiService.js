import axios from 'axios';
import FormData from 'form-data';
import { incidents, sightings } from './geospatial/geoStore.js';
import { getClusters } from './geospatial/clustering.js';

/**
 * AI Image Prediction Service Bridge
 * Forwards uploaded bite images to the Python FastAPI service for CNN-based analysis
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/predict';

function toRadians(value) {
    return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function getSeverityWeight(severity) {
    const severityMap = {
        mild: 0.25,
        moderate: 0.5,
        severe: 0.75,
        critical: 1
    };

    return severityMap[severity] ?? 0.5;
}

export function assessGeoRisk({
    latitude,
    longitude,
    incidentType,
    severity,
    animalPresent,
    animal
}) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
            geoRiskScore: 0,
            clusterId: null,
            nearbyIncidentCount: 0,
            clusterCount: 0
        };
    }

    incidents.push({
        lat,
        lng,
        type: incidentType,
        severity,
        time: Date.now()
    });

    if (animalPresent) {
        sightings.push({
            lat,
            lng,
            animal: animal || incidentType || 'unknown'
        });
    }

    const clusters = getClusters();

    let nearestCluster = null;
    let nearestClusterIndex = -1;
    let nearestDistanceKm = Number.POSITIVE_INFINITY;

    clusters.forEach((cluster, index) => {
        const distanceKm = getDistanceKm(lat, lng, cluster.lat, cluster.lng);
        if (distanceKm < nearestDistanceKm) {
            nearestDistanceKm = distanceKm;
            nearestCluster = cluster;
            nearestClusterIndex = index;
        }
    });

    const clusterDistanceThresholdKm = 2;
    const clusterId =
        nearestCluster && nearestDistanceKm <= clusterDistanceThresholdKm
            ? `cluster-${nearestClusterIndex + 1}`
            : null;

    const nearbyIncidentCount = incidents.filter((incident) => {
        const distanceKm = getDistanceKm(lat, lng, incident.lat, incident.lng);
        return distanceKm <= 2;
    }).length;

    const incidentDensityFactor = Math.min(nearbyIncidentCount / 8, 1);
    const clusterDensityFactor = nearestCluster ? Math.min(nearestCluster.count / 10, 1) : 0;
    const severityWeight = getSeverityWeight(severity);

    const rawRisk =
        0.45 * incidentDensityFactor +
        0.35 * clusterDensityFactor +
        0.2 * severityWeight;

    return {
        geoRiskScore: Math.round(rawRisk * 100),
        clusterId,
        nearbyIncidentCount,
        clusterCount: clusters.length
    };
}

/**
 * Send image to Python AI service for prediction
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type of the image
 * @returns {Promise<Object>} AI prediction results
 */
export async function predictBiteType(imageBuffer, filename, mimetype) {
    try {
        // Create form data for multipart upload
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: filename,
            contentType: mimetype
        });

        // Send request to Python AI service
        const response = await axios.post(AI_SERVICE_URL, formData, {
            headers: {
                ...formData.getHeaders(),
                'Accept': 'application/json'
            },
            timeout: 30000, // 30 seconds timeout
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        return {
            success: true,
            prediction: response.data.prediction || response.data.class,
            confidence: response.data.confidence || response.data.probability,
            species: response.data.species || null,
            details: response.data.details || null,
            recommendations: response.data.recommendations || [],
            severity: response.data.severity || 'unknown',
            urgency: response.data.urgency || null,
            woundAnalysis: response.data.wound_analysis || null,
            woundDetections: response.data.wound_detections || [],
            rawResponse: response.data
        };

    } catch (error) {
        console.error('AI Service Error:', error.message);

        // Handle different types of errors
        if (error.code === 'ECONNREFUSED') {
            return {
                success: false,
                error: 'AI service is not available. Please ensure the Python service is running on port 8000.',
                fallback: true
            };
        }

        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            return {
                success: false,
                error: error.response.data.detail || error.response.data.error || 'AI prediction failed',
                statusCode: error.response.status
            };
        }

        if (error.request) {
            // The request was made but no response was received
            return {
                success: false,
                error: 'No response from AI service. Request timeout.',
                timeout: true
            };
        }

        // Something happened in setting up the request
        return {
            success: false,
            error: error.message || 'Unknown error occurred during AI prediction'
        };
    }
}

/**
 * Check if AI service is available
 * @returns {Promise<boolean>}
 */
export async function checkAIServiceHealth() {
    try {
        const healthUrl = AI_SERVICE_URL.replace('/predict', '/health');
        const response = await axios.get(healthUrl, { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        console.error('AI Service health check failed:', error.message);
        return false;
    }
}

/**
 * Get supported image formats from AI service
 * @returns {Array<string>} List of supported MIME types
 */
export function getSupportedImageFormats() {
    return [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];
}

/**
 * Validate image before sending to AI service
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimetype - MIME type of the image
 * @returns {Object} Validation result
 */
export function validateImage(imageBuffer, mimetype) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedFormats = getSupportedImageFormats();

    if (!imageBuffer || imageBuffer.length === 0) {
        return {
            valid: false,
            error: 'Image buffer is empty'
        };
    }

    if (imageBuffer.length > maxSize) {
        return {
            valid: false,
            error: `Image size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`
        };
    }

    if (!supportedFormats.includes(mimetype)) {
        return {
            valid: false,
            error: `Unsupported image format. Supported formats: ${supportedFormats.join(', ')}`
        };
    }

    return { valid: true };
}

export default {
    predictBiteType,
    checkAIServiceHealth,
    getSupportedImageFormats,
    validateImage,
    assessGeoRisk
};
