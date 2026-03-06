import axios from 'axios';
import FormData from 'form-data';

/**
 * AI Image Prediction Service Bridge
 * Forwards uploaded bite images to the Python FastAPI service for CNN-based analysis
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/predict';

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

        const raw = response.data || {};
        const normalizedPrediction =
            raw.prediction ??
            raw.class ??
            (raw.species ? `Snake (${raw.species})` : null) ??
            (typeof raw.snake_detected === 'boolean'
                ? (raw.snake_detected ? 'Snake Detected' : 'No Snake Detected')
                : null);

        return {
            success: true,
            prediction: normalizedPrediction,
            confidence: raw.confidence ?? raw.probability ?? null,
            species: raw.species ?? null,
            // include snake count if returned by Python service
            snake_count: raw.snake_count != null ? raw.snake_count : null,
            details: raw.details || null,
            recommendations: raw.recommendations || [],
            severity: raw.severity || 'unknown',
            rawResponse: raw
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
    validateImage
};
