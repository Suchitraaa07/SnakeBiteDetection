import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false
    }
});

// Helper function to create a report
export async function createReport(reportData) {
    const { data, error } = await supabase
        .from('reports')
        .insert([{
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
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Helper function to get heatmap data
export async function getHeatmapData(daysBack = 30, incidentType = null) {
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
