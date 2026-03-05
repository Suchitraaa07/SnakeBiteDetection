import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseKey);

// Initialize Supabase client

export const supabase = SUPABASE_CONFIGURED
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: false
        }
    })
    : null;

if (!SUPABASE_CONFIGURED) {
    console.warn('⚠️ Supabase credentials are missing. Database-backed endpoints will return configuration errors.');
}

function ensureSupabaseConfigured() {
    if (!supabase) {
        throw new Error('Supabase is not configured. Set SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in backend/.env');
    }
}

// Helper function to create a report
export async function createReport(reportData) {
    ensureSupabaseConfigured();
    const payload = {
        incident_type: reportData.incident_type,
        species_detected: reportData.species_detected,
        confidence_score: reportData.confidence_score,
        image_url: reportData.image_url,
        ai_analysis: reportData.ai_analysis,
        location: `POINT(${reportData.longitude} ${reportData.latitude})`,
        address_text: reportData.address_text,
        victim_name: reportData.victim_name,
        victim_age: reportData.victim_age,
        victim_phone: reportData.victim_phone,
        symptoms: reportData.symptoms,
        severity_level: reportData.severity_level,
        notes: reportData.notes
    };

    if (reportData.incident_timestamp) {
        payload.created_at = reportData.incident_timestamp;
    }

    const { data, error } = await supabase
        .from('reports')
        .insert([payload])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Helper function to get heatmap data
export async function getHeatmapData(daysBack = 30, incidentType = null) {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
        .rpc('get_heatmap_data', {
            days_back: daysBack,
            incident_type_filter: incidentType
        });

    if (error) throw error;
    return data;
}

// Helper function to find nearest hospitals
export async function findNearestHospitals(latitude, longitude, incidentType, maxDistanceKm = 50, limitCount = 10) {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
        .rpc('find_nearest_hospitals', {
            user_lat: latitude,
            user_lng: longitude,
            incident_type_param: incidentType,
            max_distance_km: maxDistanceKm,
            limit_count: limitCount
        });

    if (error) throw error;
    return data;
}

// Helper function to get all hospitals
export async function getAllHospitals() {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data;
}

// Helper function to get emergency contacts
export async function getEmergencyContacts(city = null, state = null) {
    ensureSupabaseConfigured();
    let query = supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true);

    if (city) query = query.eq('city', city);
    if (state) query = query.eq('state', state);

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

// Helper function to get recent reports
export async function getRecentReports(limit = 50) {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

// Helper function to update report status
export async function updateReportStatus(reportId, status) {
    ensureSupabaseConfigured();
    const { data, error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export default supabase;
