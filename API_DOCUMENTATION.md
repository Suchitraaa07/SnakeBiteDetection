# 📡 SylvanGuard API Documentation

Complete API reference for the SylvanGuard backend service.

**Base URL**: `http://localhost:5000/api`

---

## 🏥 Health Check

### GET `/api/health`

Check system health and service availability.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2026-03-02T10:30:00.000Z",
  "services": {
    "api": "operational",
    "database": "operational",
    "aiService": "operational"
  }
}
```

---

## 📝 Reports Endpoints

### POST `/api/reports/create`

Create a new bite incident report with image analysis.

**Content-Type**: `multipart/form-data`

**Request Body**:

```
image: File (required) - Image of the bite (JPEG, PNG, WebP, max 10MB)
latitude: Float (required) - GPS latitude
longitude: Float (required) - GPS longitude
address_text: String (optional) - Human-readable address
victim_name: String (optional) - Name of victim
victim_age: Integer (optional) - Age of victim
victim_phone: String (optional) - Contact phone number
symptoms: JSON Array (optional) - Array of symptom IDs
incident_type: String (optional) - 'snake_bite' or 'monkey_bite'
notes: String (optional) - Additional information
```

**Example with curl**:

```bash
curl -X POST http://localhost:5000/api/reports/create \
  -F "image=@bite_photo.jpg" \
  -F "latitude=19.0760" \
  -F "longitude=72.8777" \
  -F "address_text=Mumbai, Maharashtra" \
  -F "victim_name=John Doe" \
  -F "victim_age=35" \
  -F "victim_phone=+919876543210" \
  -F "symptoms=[\"swelling\",\"pain\",\"nausea\"]" \
  -F "incident_type=snake_bite" \
  -F "notes=Bite occurred while trekking"
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "message": "Report created successfully",
  "report": {
    "id": "uuid-here",
    "incident_type": "snake_bite",
    "severity_level": "severe",
    "created_at": "2026-03-02T10:30:00.000Z"
  },
  "aiAnalysis": {
    "prediction": "snake_bite",
    "confidence": 0.95,
    "species": "Indian Cobra",
    "recommendations": [
      "SEEK IMMEDIATE MEDICAL ATTENTION",
      "Keep victim calm",
      "..."
    ]
  },
  "nearbyHospitals": [
    {
      "id": "uuid",
      "name": "KEM Hospital",
      "distance_km": 2.5,
      "phone": "+912224107000",
      "has_snake_antivenom": true
    }
  ],
  "emergencyInstructions": [
    "Keep the victim calm and still",
    "Remove jewelry and tight clothing",
    "..."
  ]
}
```

**Error Response** (400 Bad Request):

```json
{
  "error": "Image file is required"
}
```

---

### GET `/api/reports/recent`

Get recent bite incident reports.

**Query Parameters**:

- `limit` (Integer, optional) - Number of reports to return (default: 50, max: 1000)

**Example**:

```bash
GET /api/reports/recent?limit=20
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "count": 20,
  "reports": [
    {
      "id": "uuid",
      "incident_type": "snake_bite",
      "species_detected": "Indian Cobra",
      "confidence_score": 0.95,
      "image_url": "https://...",
      "severity_level": "severe",
      "created_at": "2026-03-02T10:30:00.000Z",
      "status": "pending"
    }
  ]
}
```

---

### PATCH `/api/reports/:id/status`

Update the status of a report.

**URL Parameters**:

- `id` (UUID, required) - Report ID

**Request Body**:

```json
{
  "status": "verified"
}
```

**Valid Status Values**:

- `pending` - Initial status
- `verified` - Report verified by authorities
- `responded` - Emergency services dispatched
- `resolved` - Case closed

**Success Response** (200 OK):

```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "status": "verified",
    "updated_at": "2026-03-02T11:00:00.000Z"
  }
}
```

---

## 🗺 Heatmap Endpoints

### GET `/api/heatmap`

Get heatmap data for visualization.

**Query Parameters**:

- `days` (Integer, optional) - Number of days to look back (default: 30)
- `type` (String, optional) - Filter by incident type: 'snake_bite' or 'monkey_bite'

**Example**:

```bash
GET /api/heatmap?days=7&type=snake_bite
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "latitude": 19.076,
      "longitude": 72.8777,
      "intensity": 0.75,
      "incident_type": "snake_bite",
      "created_at": "2026-03-01T15:30:00.000Z"
    }
  ]
}
```

**Intensity Values**:

- `0.25` - Mild severity
- `0.50` - Moderate severity
- `0.75` - Severe severity
- `1.00` - Critical severity

---

## 🏥 Hospital Endpoints

### GET `/api/hospitals/nearest`

Find nearest hospitals with anti-venom availability.

**Query Parameters**:

- `latitude` (Float, required) - GPS latitude
- `longitude` (Float, required) - GPS longitude
- `type` (String, optional) - Incident type: 'snake_bite' or 'monkey_bite' (default: 'snake_bite')
- `radius` (Float, optional) - Search radius in kilometers (default: 50)
- `limit` (Integer, optional) - Maximum number of results (default: 10)

**Example**:

```bash
GET /api/hospitals/nearest?latitude=19.0760&longitude=72.8777&type=snake_bite&radius=25&limit=5
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "count": 5,
  "hospitals": [
    {
      "id": "uuid",
      "name": "KEM Hospital",
      "address": "Acharya Donde Marg, Parel, Mumbai",
      "phone": "+912224107000",
      "emergency_phone": "+912224107777",
      "distance_km": 2.5,
      "has_treatment": true,
      "is_24x7": true,
      "rating": 4.5,
      "latitude": 18.9894,
      "longitude": 72.8311
    }
  ]
}
```

---

### GET `/api/hospitals`

Get all active hospitals.

**Success Response** (200 OK):

```json
{
  "success": true,
  "count": 150,
  "hospitals": [
    {
      "id": "uuid",
      "name": "KEM Hospital",
      "hospital_type": "government",
      "address": "Acharya Donde Marg, Parel, Mumbai",
      "city": "Mumbai",
      "state": "Maharashtra",
      "phone": "+912224107000",
      "emergency_phone": "+912224107777",
      "has_snake_antivenom": true,
      "has_monkey_treatment": true,
      "is_24x7": true,
      "rating": 4.5,
      "is_active": true
    }
  ]
}
```

---

## 📞 Emergency Contact Endpoints

### GET `/api/emergency-contacts`

Get emergency contact numbers by region.

**Query Parameters**:

- `city` (String, optional) - Filter by city
- `state` (String, optional) - Filter by state

**Example**:

```bash
GET /api/emergency-contacts?state=Maharashtra
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "count": 8,
  "contacts": [
    {
      "id": "uuid",
      "name": "Maharashtra Ambulance Service",
      "contact_type": "ambulance",
      "phone": "108",
      "city": null,
      "state": "Maharashtra",
      "is_24x7": true,
      "languages_supported": ["English", "Hindi", "Marathi"]
    },
    {
      "id": "uuid",
      "name": "Poison Control Center - Mumbai",
      "contact_type": "poison_control",
      "phone": "+912226754000",
      "city": "Mumbai",
      "state": "Maharashtra",
      "is_24x7": true,
      "languages_supported": ["English", "Hindi"]
    }
  ]
}
```

**Contact Types**:

- `ambulance` - Emergency ambulance services
- `poison_control` - Poison control centers
- `forest_dept` - Forest department
- `wildlife_rescue` - Wildlife rescue organizations
- `police` - Police emergency

---

## ⚠️ Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional details (in development mode)"
}
```

### 404 Not Found

```json
{
  "error": "Route not found",
  "path": "/api/invalid-endpoint"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "Error details (in development mode only)"
}
```

---

## 🔐 Rate Limiting

**Current Limits** (Development):

- No rate limiting implemented
- **Production Recommendation**:
  - 100 requests per 15 minutes per IP
  - 10 image uploads per hour per IP

---

## 📊 Response Times

**Expected Response Times** (Development):

- Health Check: < 50ms
- GET Requests: < 200ms
- Image Upload + AI Analysis: 2-5 seconds
- Hospital Search: < 500ms

---

## 🧪 Testing with Postman

1. Import this collection: [Download Postman Collection](#)
2. Set environment variables:
   - `baseUrl`: `http://localhost:5000`
   - `apiKey`: (if authentication is implemented)

---

## 🔄 Database Functions (Direct SQL)

If you need to call Supabase functions directly:

### find_nearest_hospitals()

```sql
SELECT * FROM find_nearest_hospitals(
  19.0760,              -- user_lat
  72.8777,              -- user_lng
  'snake_bite',         -- incident_type_param
  50.0,                 -- max_distance_km
  10                    -- limit_count
);
```

### get_heatmap_data()

```sql
SELECT * FROM get_heatmap_data(
  30,                   -- days_back
  'snake_bite'          -- incident_type_filter (or NULL for all)
);
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Coordinates use WGS84 (EPSG:4326) geographic coordinate system
- Distances are calculated using PostGIS ST_Distance (great-circle distance)
- Image uploads are stored in Supabase Storage with public URLs
- AI analysis results are cached in the `ai_analysis` JSONB field

---

## 🔗 Related Documentation

- [Main README](../README.md)
- [Setup Guide](../SETUP_GUIDE.md)
- [Python AI Service API](../python-ai-service/README.md)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: March 2, 2026  
**API Version**: 1.0.0
