import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Import custom modules
import { 
    createReport, 
    getHeatmapData, 
    findNearestHospitals, 
    getAllHospitals,
    getEmergencyContacts,
    getRecentReports,
    updateReportStatus,
    supabase 
} from './supabaseClient.js';

import { 
    predictBiteType, 
    checkAIServiceHealth, 
    validateImage 
} from './aiService.js';

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5050;
// ==============================================================================
// MIDDLEWARE
// ==============================================================================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure Multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    }
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==============================================================================
// ROUTES
// ==============================================================================

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const aiServiceHealthy = await checkAIServiceHealth();
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            api: 'operational',
            database: 'operational',
            aiService: aiServiceHealthy ? 'operational' : 'unavailable'
        }
    });
});

// ============================================
// REPORT ENDPOINTS
// ============================================

/**
<<<<<<< HEAD
=======
 * POST /api/ai/predict
 * Lightweight endpoint to run model prediction on an uploaded image
 * without creating a full report or writing to the database.
 */
app.post('/api/ai/predict', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Image file is required'
            });
        }

        const validation = validateImage(req.file.buffer, req.file.mimetype);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        console.log('Running standalone AI prediction for uploaded image...');
        const aiPrediction = await predictBiteType(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        if (!aiPrediction.success) {
            return res.status(502).json({
                error: aiPrediction.error || 'AI prediction failed',
                details: aiPrediction
            });
        }

        return res.json({
            success: true,
            aiAnalysis: {
                prediction: aiPrediction.prediction,
                confidence: aiPrediction.confidence,
                species: aiPrediction.species,
                snake_count: aiPrediction.snake_count,
                recommendations: aiPrediction.recommendations,
                severity: aiPrediction.severity
            }
        });
    } catch (error) {
        console.error('Error in /api/ai/predict:', error);
        return res.status(500).json({
            error: 'Failed to run AI prediction',
            details: error.message
        });
    }
});

/**
>>>>>>> 1f5d2b93 (Clean project commit)
 * POST /api/reports/create
 * Create a new bite incident report with image analysis
 */
app.post('/api/reports/create', upload.single('image'), async (req, res) => {
    try {
        // Validate request
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Image file is required' 
            });
        }

        // Validate image
        const validation = validateImage(req.file.buffer, req.file.mimetype);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Parse request body
        const {
            latitude,
            longitude,
            address_text,
            victim_name,
            victim_age,
            victim_phone,
            symptoms,
            notes,
            incident_type // Optional: can be overridden by AI
        } = req.body;

        // Validate required fields
        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'Location coordinates (latitude, longitude) are required' 
            });
        }

        // Step 1: Send image to AI service for prediction
        console.log('Sending image to AI service for analysis...');
        const aiPrediction = await predictBiteType(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        // Step 2: Upload image to Supabase Storage
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('bite-images')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Image upload error:', uploadError);
            // include the full error object for easier debugging during development
            return res.status(500).json({ 
                error: 'Failed to upload image',
                details: uploadError.message,
                supabaseError: uploadError
            });
        }

        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
            .from('bite-images')
            .getPublicUrl(filePath);

        // Step 3: Determine incident type and severity
        let finalIncidentType = incident_type;
        let severityLevel = 'moderate';

        if (aiPrediction.success) {
            // Override incident type if AI provides a more specific prediction
            if (aiPrediction.prediction) {
                finalIncidentType = aiPrediction.prediction.toLowerCase().includes('snake') 
                    ? 'snake_bite' 
                    : aiPrediction.prediction.toLowerCase().includes('monkey')
                    ? 'monkey_bite'
                    : finalIncidentType;
            }
            severityLevel = aiPrediction.severity || 'moderate';
        }

        // Step 4: Create report in database
        const reportData = {
            incident_type: finalIncidentType || 'snake_bite',
            species_detected: aiPrediction.success ? aiPrediction.species : null,
            confidence_score: aiPrediction.success ? aiPrediction.confidence : null,
            snake_count: aiPrediction.success ? aiPrediction.snake_count : null,
            image_url: publicUrl,
            ai_analysis: aiPrediction,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address_text,
            victim_name,
            victim_age: victim_age ? parseInt(victim_age) : null,
            victim_phone,
            symptoms: typeof symptoms === 'string' ? JSON.parse(symptoms) : symptoms || [],
            severity_level: severityLevel,
            notes
        };

        const report = await createReport(reportData);

        // Step 5: Find nearest hospitals
        const nearbyHospitals = await findNearestHospitals(
            parseFloat(latitude),
            parseFloat(longitude),
            finalIncidentType,
            50, // 50km radius
            5   // Top 5 hospitals
        );

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            report: {
                id: report.id,
                incident_type: report.incident_type,
                severity_level: report.severity_level,
                created_at: report.created_at
            },
            aiAnalysis: aiPrediction.success ? {
                prediction: aiPrediction.prediction,
                confidence: aiPrediction.confidence,
                species: aiPrediction.species,
                snake_count: aiPrediction.snake_count,
                recommendations: aiPrediction.recommendations
            } : null,
            nearbyHospitals: nearbyHospitals.slice(0, 3), // Top 3 hospitals
            emergencyInstructions: getEmergencyInstructions(finalIncidentType, severityLevel)
        });

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ 
            error: 'Failed to create report',
            details: error.message 
        });
    }
});

/**
 * GET /api/reports/recent
 * Get recent bite incident reports
 */
app.get('/api/reports/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const reports = await getRecentReports(limit);
        
        res.json({
            success: true,
            count: reports.length,
            reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ 
            error: 'Failed to fetch reports',
            details: error.message 
        });
    }
});

/**
 * PATCH /api/reports/:id/status
 * Update report status
 */
app.patch('/api/reports/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'verified', 'responded', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const updatedReport = await updateReportStatus(id, status);
        
        res.json({
            success: true,
            report: updatedReport
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ 
            error: 'Failed to update report status',
            details: error.message 
        });
    }
});

// ============================================
// HEATMAP ENDPOINTS
// ============================================

/**
 * GET /api/heatmap
 * Get heatmap data for visualization
 */
app.get('/api/heatmap', async (req, res) => {
    try {
        const daysBack = parseInt(req.query.days) || 30;
        const incidentType = req.query.type || null;
        
        const heatmapData = await getHeatmapData(daysBack, incidentType);
        
        res.json({
            success: true,
            count: heatmapData.length,
            data: heatmapData
        });
    } catch (error) {
        console.error('Error fetching heatmap data:', error, error && error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch heatmap data',
            details: error.message,
            stack: error.stack
        });
    }
});

// ============================================
// HOSPITAL ENDPOINTS
// ============================================

/**
 * GET /api/hospitals/nearest
 * Find nearest hospitals with anti-venom
 */
app.get('/api/hospitals/nearest', async (req, res) => {
    try {
        const { latitude, longitude, type, radius, limit } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ 
                error: 'Latitude and longitude are required' 
            });
        }

        const hospitals = await findNearestHospitals(
            parseFloat(latitude),
            parseFloat(longitude),
            type || 'snake_bite',
            parseFloat(radius) || 50,
            parseInt(limit) || 10
        );
        
        res.json({
            success: true,
            count: hospitals.length,
            hospitals
        });
    } catch (error) {
        console.error('Error finding hospitals:', error);
        res.status(500).json({ 
            error: 'Failed to find hospitals',
            details: error.message 
        });
    }
});

/**
 * GET /api/hospitals
 * Get all hospitals
 */
app.get('/api/hospitals', async (req, res) => {
    try {
        const hospitals = await getAllHospitals();
        
        res.json({
            success: true,
            count: hospitals.length,
            hospitals
        });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ 
            error: 'Failed to fetch hospitals',
            details: error.message 
        });
    }
});

// ============================================
// EMERGENCY CONTACT ENDPOINTS
// ============================================

/**
 * GET /api/emergency-contacts
 * Get emergency contact numbers
 */
app.get('/api/emergency-contacts', async (req, res) => {
    try {
        const { city, state } = req.query;
        const contacts = await getEmergencyContacts(city, state);
        
        res.json({
            success: true,
            count: contacts.length,
            contacts
        });
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        res.status(500).json({ 
            error: 'Failed to fetch emergency contacts',
            details: error.message 
        });
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getEmergencyInstructions(incidentType, severity) {
    const instructions = {
        snake_bite: [
            'Keep the victim calm and still',
            'Remove jewelry and tight clothing near the bite',
            'Position the bite below heart level if possible',
            'Clean the bite with soap and water',
            'Cover with clean, dry dressing',
            'DO NOT apply ice or tourniquet',
            'DO NOT cut the wound or try to suck out venom',
            'Get to a hospital immediately'
        ],
        monkey_bite: [
            'Wash the wound thoroughly with soap and water for 15 minutes',
            'Apply antiseptic solution',
            'Cover with sterile bandage',
            'Seek immediate medical attention for rabies prophylaxis',
            'Do not delay vaccination - get to hospital within 24 hours',
            'Save details/photo of the animal if possible'
        ]
    };

    return instructions[incidentType] || [];
}

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            error: 'File upload error',
            details: err.message 
        });
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==============================================================================
// START SERVER
// ==============================================================================

app.listen(PORT, async () => {
    console.log('\n🌲 SylvanGuard Backend Server 🌲');
    console.log('='.repeat(50));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    // Check AI service health
    const aiHealthy = await checkAIServiceHealth();
    console.log(`🤖 AI Service: ${aiHealthy ? '✅ Connected' : '⚠️  Unavailable'}`);
    
    console.log('='.repeat(50));
    console.log('Ready to accept requests!\n');
});

export default app;
