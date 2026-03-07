-- ==============================================================================
-- SYLVANGUARD DATABASE SCHEMA
-- Health Emergency System for Snake and Monkey Bite Detection
-- ==============================================================================

-- Enable PostGIS extension for geographical data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==============================================================================
-- REPORTS TABLE
-- Stores bite incident reports with location data
-- ==============================================================================

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Incident Details
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('snake_bite', 'monkey_bite')),
    species_detected VARCHAR(100),
    confidence_score DECIMAL(5, 2),
    
    -- Image Data
    image_url TEXT NOT NULL,
    ai_analysis JSONB,
    
    -- Location Data (PostGIS)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address_text TEXT,
    
    -- Victim Information
    victim_name VARCHAR(100),
    victim_age INTEGER,
    victim_phone VARCHAR(20),
    
    -- Symptoms Checklist
    symptoms JSONB DEFAULT '[]'::jsonb,
    severity_level VARCHAR(20) CHECK (severity_level IN ('mild', 'moderate', 'severe', 'critical')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status Tracking
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'responded', 'resolved')),
    
    -- Additional Notes
    notes TEXT
);

-- Create spatial index for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST(location);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_incident_type ON reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity_level);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ==============================================================================
-- HOSPITALS TABLE
-- Stores hospital information with anti-venom availability
-- ==============================================================================

CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Hospital Details
    name VARCHAR(200) NOT NULL,
    hospital_type VARCHAR(50) CHECK (hospital_type IN ('government', 'private', 'clinic', 'trauma_center')),
    
    -- Location Data (PostGIS)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Contact Information
    phone VARCHAR(20),
    emergency_phone VARCHAR(20),
    email VARCHAR(100),
    website TEXT,
    
    -- Anti-venom Availability
    has_snake_antivenom BOOLEAN DEFAULT false,
    has_monkey_treatment BOOLEAN DEFAULT false,
    antivenom_stock JSONB DEFAULT '{}'::jsonb,
    
    -- Operational Details
    is_24x7 BOOLEAN DEFAULT true,
    has_emergency_room BOOLEAN DEFAULT true,
    avg_response_time INTEGER, -- in minutes
    
    -- Ratings and Reviews
    rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
    total_cases_handled INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true
);

-- Create spatial index for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals USING GIST(location);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hospitals_antivenom ON hospitals(has_snake_antivenom) WHERE has_snake_antivenom = true;
CREATE INDEX IF NOT EXISTS idx_hospitals_monkey_treatment ON hospitals(has_monkey_treatment) WHERE has_monkey_treatment = true;
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON hospitals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hospitals_24x7 ON hospitals(is_24x7) WHERE is_24x7 = true;

-- ==============================================================================
-- EMERGENCY_CONTACTS TABLE
-- Stores emergency contact numbers by region
-- ==============================================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contact Details
    name VARCHAR(200) NOT NULL,
    contact_type VARCHAR(50) CHECK (contact_type IN ('ambulance', 'poison_control', 'forest_dept', 'wildlife_rescue', 'police')),
    phone VARCHAR(20) NOT NULL,
    
    -- Location Coverage
    city VARCHAR(100),
    state VARCHAR(100),
    coverage_area GEOGRAPHY(POLYGON, 4326),
    
    -- Availability
    is_24x7 BOOLEAN DEFAULT true,
    languages_supported TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_type ON emergency_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_location ON emergency_contacts USING GIST(coverage_area) WHERE coverage_area IS NOT NULL;

-- ==============================================================================
-- FUNCTIONS
-- Helper functions for common operations
-- ==============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to find nearest hospitals with anti-venom
CREATE OR REPLACE FUNCTION find_nearest_hospitals(
    user_lat FLOAT,
    user_lng FLOAT,
    incident_type_param VARCHAR(50),
    max_distance_km FLOAT DEFAULT 50,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    address TEXT,
    phone VARCHAR,
    emergency_phone VARCHAR,
    distance_km FLOAT,
    has_treatment BOOLEAN,
    is_24x7 BOOLEAN,
    rating DECIMAL,
    latitude FLOAT,
    longitude FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.city,
        h.state,
        h.phone,
        h.emergency_phone,
        ROUND(
            ST_Distance(
                h.location::geography,
                ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
            )::numeric / 1000, 2
        )::FLOAT AS distance_km,
        CASE 
            WHEN incident_type_param = 'snake_bite' THEN h.has_snake_antivenom
            WHEN incident_type_param = 'monkey_bite' THEN h.has_monkey_treatment
            ELSE false
        END AS has_treatment,
        h.is_24x7,
        h.rating,
        ST_Y(h.location::geometry)::FLOAT AS latitude,
        ST_X(h.location::geometry)::FLOAT AS longitude
    FROM hospitals h
    WHERE 
        h.is_active = true
        AND ST_DWithin(
            h.location::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            max_distance_km * 1000
        )
        AND (
            (incident_type_param = 'snake_bite' AND h.has_snake_antivenom = true)
            OR (incident_type_param = 'monkey_bite' AND h.has_monkey_treatment = true)
            OR (incident_type_param IS NULL OR incident_type_param = '')
        )
    ORDER BY distance_km ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get heatmap data for bite incidents
CREATE OR REPLACE FUNCTION get_heatmap_data(
    days_back INTEGER DEFAULT 30,
    incident_type_filter VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    latitude FLOAT,
    longitude FLOAT,
    intensity FLOAT,
    incident_type VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_Y(r.location::geometry)::FLOAT AS latitude,
        ST_X(r.location::geometry)::FLOAT AS longitude,
        CASE r.severity_level
            WHEN 'critical' THEN 1.0
            WHEN 'severe' THEN 0.75
            WHEN 'moderate' THEN 0.5
            WHEN 'mild' THEN 0.25
            ELSE 0.5
        END::FLOAT AS intensity,
        r.incident_type,
        r.created_at
    FROM reports r
    WHERE 
        r.created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND (incident_type_filter IS NULL OR r.incident_type = incident_type_filter)
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ==============================================================================

-- Insert sample hospitals (Mumbai region)
INSERT INTO hospitals (name, hospital_type, location, address, city, state, pincode, phone, emergency_phone, has_snake_antivenom, has_monkey_treatment, is_24x7, rating) VALUES
('KEM Hospital', 'government', ST_SetSRID(ST_MakePoint(72.8311, 18.9894), 4326)::geography, 'Acharya Donde Marg, Parel, Mumbai', 'Mumbai', 'Maharashtra', '400012', '+912224107000', '+912224107777', true, true, true, 4.5),
('Sion Hospital', 'government', ST_SetSRID(ST_MakePoint(72.8622, 19.0433), 4326)::geography, 'Sion, Mumbai', 'Mumbai', 'Maharashtra', '400022', '+912224076666', '+912224076777', true, true, true, 4.2),
('Lilavati Hospital', 'private', ST_SetSRID(ST_MakePoint(72.8311, 19.0544), 4326)::geography, 'A-791, Bandra Reclamation, Bandra West, Mumbai', 'Mumbai', 'Maharashtra', '400050', '+912226567000', '+912226567890', true, true, true, 4.7),
('Hinduja Hospital', 'private', ST_SetSRID(ST_MakePoint(72.8081, 19.0522), 4326)::geography, 'Veer Savarkar Marg, Mahim, Mumbai', 'Mumbai', 'Maharashtra', '400016', '+912224447777', '+912224447800', true, true, true, 4.6);

-- Insert sample emergency contacts
INSERT INTO emergency_contacts (name, contact_type, phone, city, state, is_24x7) VALUES
('Maharashtra Ambulance Service', 'ambulance', '108', NULL, 'Maharashtra', true),
('Poison Control Center - Mumbai', 'poison_control', '+912226754000', 'Mumbai', 'Maharashtra', true),
('Forest Department - Mumbai', 'forest_dept', '+912222694601', 'Mumbai', 'Maharashtra', false),
('Wildlife Rescue - RAWW', 'wildlife_rescue', '+919920041345', 'Mumbai', 'Maharashtra', true);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended for production
-- ==============================================================================

-- Enable RLS on tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read hospitals and emergency contacts
CREATE POLICY "Public hospitals read access" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Public emergency contacts read access" ON emergency_contacts FOR SELECT USING (true);

-- Policy: Anyone can insert reports (for public reporting)
CREATE POLICY "Public reports insert access" ON reports FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read reports (for heatmap visualization)
CREATE POLICY "Public reports read access" ON reports FOR SELECT USING (true);

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- View for active incidents summary
CREATE OR REPLACE VIEW active_incidents_summary AS
SELECT 
    incident_type,
    severity_level,
    COUNT(*) as count,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude
FROM reports
WHERE 
    created_at >= NOW() - INTERVAL '7 days'
    AND status IN ('pending', 'verified', 'responded')
GROUP BY incident_type, severity_level, location;

-- ==============================================================================
-- GRANTS (Adjust based on your Supabase setup)
-- ==============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON hospitals TO anon, authenticated;
GRANT SELECT ON emergency_contacts TO anon, authenticated;
GRANT SELECT, INSERT ON reports TO anon, authenticated;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION find_nearest_hospitals TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_heatmap_data TO anon, authenticated;

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
