# 📁 SylvanGuard Project Structure

Complete directory tree for the SylvanGuard project.

```
palloti-hthon/
│
├── 📄 README.md                    # Main project documentation
├── 📄 SETUP_GUIDE.md              # Step-by-step setup instructions
├── 📄 API_DOCUMENTATION.md        # Complete API reference
├── 📄 .gitignore                  # Git ignore rules
├── 📄 package.json                # Root package.json (workspace config)
│
├── 📂 backend/                    # Node.js Backend Service
│   ├── 📄 package.json            # Backend dependencies
│   ├── 📄 .env.example            # Environment variables template
│   ├── 📄 .env                    # Actual environment variables (git-ignored)
│   │
│   ├── 📄 server.js               # Main Express server
│   │   ├── Express setup & middleware
│   │   ├── Multer file upload configuration
│   │   ├── CORS configuration
│   │   ├── API route handlers:
│   │   │   ├── POST /api/reports/create
│   │   │   ├── GET /api/reports/recent
│   │   │   ├── PATCH /api/reports/:id/status
│   │   │   ├── GET /api/heatmap
│   │   │   ├── GET /api/hospitals/nearest
│   │   │   ├── GET /api/hospitals
│   │   │   ├── GET /api/emergency-contacts
│   │   │   └── GET /api/health
│   │   └── Error handling & server startup
│   │
│   ├── 📄 supabaseClient.js       # Supabase Integration
│   │   ├── Supabase client initialization
│   │   ├── Helper functions:
│   │   │   ├── createReport()
│   │   │   ├── getHeatmapData()
│   │   │   ├── findNearestHospitals()
│   │   │   ├── getAllHospitals()
│   │   │   ├── getEmergencyContacts()
│   │   │   ├── getRecentReports()
│   │   │   └── updateReportStatus()
│   │   └── Database query wrappers
│   │
│   ├── 📄 aiService.js            # AI Service Bridge
│   │   ├── predictBiteType() - Forward images to Python AI
│   │   ├── checkAIServiceHealth() - Health check
│   │   ├── validateImage() - Image validation
│   │   ├── getSupportedImageFormats()
│   │   └── Error handling for AI service
│   │
│   └── 📂 supabase/
│       └── 📂 migrations/
│           └── 📄 001_initial_schema.sql    # Database Schema
│               ├── PostGIS extension setup
│               ├── reports table (with GEOGRAPHY)
│               ├── hospitals table (with GEOGRAPHY)
│               ├── emergency_contacts table
│               ├── Spatial indexes (GIST)
│               ├── RPC functions:
│               │   ├── find_nearest_hospitals()
│               │   └── get_heatmap_data()
│               ├── Triggers for timestamps
│               ├── Row Level Security policies
│               ├── Views for active incidents
│               └── Sample data (hospitals, contacts)
│
├── 📂 frontend/                   # React Frontend Application
│   ├── 📄 package.json            # Frontend dependencies
│   ├── 📄 vite.config.js          # Vite configuration
│   ├── 📄 tailwind.config.js      # Tailwind CSS config (Deep Forest theme)
│   ├── 📄 postcss.config.js       # PostCSS configuration
│   ├── 📄 index.html              # HTML entry point
│   │
│   ├── 📂 src/
│   │   ├── 📄 main.jsx            # React entry point
│   │   │   └── ReactDOM.createRoot()
│   │   │
│   │   ├── 📄 App.jsx             # Main Application Component
│   │   │   ├── Navigation tabs (Report, Heatmap, Hospitals)
│   │   │   ├── Header with logo
│   │   │   ├── Emergency banner
│   │   │   ├── Tab content rendering
│   │   │   ├── Quick stats cards
│   │   │   ├── Emergency instructions
│   │   │   └── Footer
│   │   │
│   │   ├── 📄 index.css           # Global Styles
│   │   │   ├── Tailwind directives
│   │   │   ├── Deep Forest theme variables
│   │   │   ├── Glassmorphism classes:
│   │   │   │   ├── .glass-card
│   │   │   │   ├── .glass-card-sm
│   │   │   │   ├── .btn-primary
│   │   │   │   ├── .btn-secondary
│   │   │   │   ├── .btn-danger
│   │   │   │   ├── .input-field
│   │   │   │   └── .alert-* classes
│   │   │   ├── Custom scrollbar styles
│   │   │   ├── Leaflet map customizations
│   │   │   └── Animation keyframes
│   │   │
│   │   └── 📂 components/
│   │       │
│   │       ├── 📄 ReportForm.jsx  # Multi-Step Bite Report Form
│   │       │   ├── State management for 4-step form
│   │       │   ├── Step 1: Incident type + Image upload
│   │       │   │   ├── Snake/Monkey selection
│   │       │   │   └── Image preview with drag-drop
│   │       │   ├── Step 2: Location capture
│   │       │   │   ├── Geolocation API integration
│   │       │   │   └── Reverse geocoding via Nominatim
│   │       │   ├── Step 3: Symptoms checklist
│   │       │   │   ├── Dynamic symptoms by incident type
│   │       │   │   └── Multi-select checkboxes
│   │       │   ├── Step 4: Victim information
│   │       │   │   ├── Name, age, phone (optional)
│   │       │   │   └── Additional notes
│   │       │   ├── Form validation
│   │       │   ├── Progress indicator
│   │       │   ├── API submission to /api/reports/create
│   │       │   └── Success screen with recommendations
│   │       │
│   │       ├── 📄 HeatMap.jsx     # Incident Heatmap Visualization
│   │       │   ├── Leaflet MapContainer
│   │       │   ├── HeatmapLayer component (leaflet.heat)
│   │       │   ├── Filters:
│   │       │   │   ├── Date range selector
│   │       │   │   └── Incident type filter
│   │       │   ├── Color gradient (green → yellow → orange → red)
│   │       │   ├── Statistics overlay card
│   │       │   ├── Legend for severity levels
│   │       │   ├── Real-time data fetch from /api/heatmap
│   │       │   └── Auto-fit bounds to data points
│   │       │
│   │       └── 📄 HospitalLocator.jsx    # Hospital Finder
│   │           ├── Leaflet MapContainer
│   │           ├── Custom hospital markers (red cross icons)
│   │           ├── User location marker (green dot)
│   │           ├── Filters:
│   │           │   ├── Incident type selector
│   │           │   └── Search radius selector
│   │           ├── Hospital markers with popups:
│   │           │   ├── Name, address, distance
│   │           │   ├── Phone numbers
│   │           │   ├── 24/7 availability badge
│   │           │   ├── Rating stars
│   │           │   └── "Get Directions" button
│   │           ├── Hospital list view (sortable by distance)
│   │           ├── Click-to-call functionality
│   │           ├── Google Maps integration
│   │           └── Real-time distance calculations
│   │
│   └── 📂 public/
│       └── (Static assets like logo.svg)
│
└── 📂 python-ai-service/          # Python FastAPI AI Service
    ├── 📄 README.md               # AI service documentation
    ├── 📄 requirements.txt        # Python dependencies
    │   ├── fastapi
    │   ├── uvicorn
    │   ├── pillow (image processing)
    │   ├── numpy
    │   └── (TensorFlow or PyTorch - optional)
    │
    └── 📄 main.py                 # FastAPI Application
        ├── FastAPI app initialization
        ├── CORS middleware
        ├── Image preprocessing:
        │   ├── Resize to 224x224
        │   ├── RGB conversion
        │   └── Normalization
        ├── CNN model loading (placeholder)
        ├── Endpoints:
        │   ├── GET / - Service info
        │   ├── GET /health - Health check
        │   ├── POST /predict - Single image prediction
        │   └── POST /predict/batch - Batch prediction
        ├── Prediction logic:
        │   ├── Mock predictions (demo mode)
        │   ├── Species identification
        │   ├── Confidence scoring
        │   └── Severity assessment
        ├── Recommendation generation
        └── Error handling

```

---

## 📊 Key Files Summary

### 🔴 Critical Files (Must Configure)

- `backend/.env` - **Required**: Supabase credentials
- `backend/supabase/migrations/001_initial_schema.sql` - **Must run** in Supabase
- `frontend/src/components/*.jsx` - Core UI components
- `python-ai-service/main.py` - AI prediction service

### 🟢 Configuration Files

- `tailwind.config.js` - Theme colors (Deep Forest palette)
- `vite.config.js` - Frontend build & proxy config
- `server.js` - Backend routes & middleware
- `package.json` files - Dependencies

### 🔵 Documentation Files

- `README.md` - Project overview
- `SETUP_GUIDE.md` - Installation steps
- `API_DOCUMENTATION.md` - API reference
- `PROJECT_STRUCTURE.md` - This file!

---

## 🎯 File Responsibilities

| File                     | Purpose                            | Lines of Code |
| ------------------------ | ---------------------------------- | ------------- |
| `server.js`              | API endpoints, middleware, routing | ~450          |
| `supabaseClient.js`      | Database operations wrapper        | ~150          |
| `aiService.js`           | AI service communication           | ~180          |
| `001_initial_schema.sql` | Database schema & functions        | ~500          |
| `ReportForm.jsx`         | Multi-step form UI & logic         | ~550          |
| `HeatMap.jsx`            | Heatmap visualization              | ~350          |
| `HospitalLocator.jsx`    | Hospital finder & map              | ~450          |
| `App.jsx`                | Main app layout & routing          | ~350          |
| `main.py`                | AI prediction service              | ~450          |

**Total Project**: ~3,430 lines of code (excluding comments & docs)

---

## 🔄 Data Flow

```
User Browser
    ↓
[ReportForm.jsx]
    ↓ (FormData with image)
[POST /api/reports/create]
    ↓
[server.js] → Multer → Parse multipart data
    ↓
[aiService.js] → Forward image
    ↓
[Python AI Service] → CNN Prediction
    ↓ (Return prediction)
[server.js] → Upload to Supabase Storage
    ↓
[supabaseClient.js] → Insert into reports table
    ↓
[PostGIS Functions] → Calculate nearest hospitals
    ↓
[Response JSON] → Back to frontend
    ↓
[Success Screen] → Show recommendations & hospitals
```

---

## 🗃 Database Structure

```
Supabase Database
├── 📊 Tables
│   ├── reports (incident reports with GEOGRAPHY)
│   ├── hospitals (hospital data with GEOGRAPHY)
│   └── emergency_contacts (contact information)
│
├── 🔧 Functions (RPC)
│   ├── find_nearest_hospitals(lat, lng, type, radius, limit)
│   └── get_heatmap_data(days_back, incident_type_filter)
│
├── 📐 Indexes
│   ├── idx_reports_location (GIST spatial index)
│   ├── idx_hospitals_location (GIST spatial index)
│   └── Additional B-tree indexes
│
├── 🔐 Row Level Security
│   ├── Public read access (reports, hospitals, contacts)
│   └── Public insert access (reports)
│
└── 📦 Storage
    └── bite-images (public bucket)
```

---

## 🎨 Component Hierarchy

```
<App>
  ├── <Header>
  │   ├── Logo
  │   ├── Desktop Navigation
  │   └── Mobile Menu
  │
  ├── <EmergencyBanner>
  │
  ├── <MainContent>
  │   ├── activeTab === 'report'
  │   │   └── <ReportForm>
  │   │       ├── Step1: IncidentType + ImageUpload
  │   │       ├── Step2: LocationCapture
  │   │       ├── Step3: SymptomChecklist
  │   │       └── Step4: VictimInfo
  │   │
  │   ├── activeTab === 'map'
  │   │   └── <HeatMap>
  │   │       ├── <MapContainer>
  │   │       │   ├── <TileLayer>
  │   │       │   └── <HeatmapLayer>
  │   │       └── <FiltersPanel>
  │   │
  │   └── activeTab === 'hospitals'
  │       └── <HospitalLocator>
  │           ├── <MapContainer>
  │           │   ├── <TileLayer>
  │           │   ├── <Marker> (user)
  │           │   └── <Marker>[] (hospitals)
  │           └── <HospitalList>
  │
  ├── <QuickStats>
  ├── <EmergencyInstructions>
  └── <Footer>
```

---

## 📦 Dependencies Overview

### Backend

- `express` - Web framework
- `@supabase/supabase-js` - Database client
- `multer` - File uploads
- `axios` - HTTP client
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Frontend

- `react` - UI library
- `react-dom` - React renderer
- `react-leaflet` - Map components
- `leaflet` - Mapping library
- `leaflet.heat` - Heatmap plugin
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `axios` - HTTP client

### Python AI

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pillow` - Image processing
- `numpy` - Numerical computing
- (Optional) `tensorflow` or `pytorch` - Deep learning

---

**Total Files**: 30+ source files  
**Languages**: JavaScript, SQL, Python, HTML, CSS  
**Frameworks**: React, Express, FastAPI  
**Database**: PostgreSQL + PostGIS
