# SylvanGuard 🌲

**Health Emergency System for Snake and Monkey Bite Detection**

SylvanGuard is a comprehensive emergency response platform designed to save lives by providing rapid detection, mapping, and hospital location services for snake and monkey bite incidents.

---

## 🚀 Features

- **AI-Powered Bite Detection**: Upload bite images for instant CNN-based species identification
- **Real-time Heatmap**: Visualize bite incident hotspots using PostGIS and Leaflet.js
- **Hospital Locator**: Find nearest hospitals with anti-venom availability
- **Emergency Reporting**: Multi-step form with location tracking and symptom checklist
- **24/7 Availability**: Always-on emergency response system

---

## 🛠 Tech Stack

### Frontend

- **React.js** - UI framework
- **Tailwind CSS** - Styling with "Deep Forest" theme
- **Leaflet.js** - Interactive maps and heatmaps
- **React Leaflet** - React bindings for Leaflet
- **Leaflet.heat** - Heatmap visualization
- **Vite** - Build tool and dev server

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Axios** - HTTP client for AI service communication

### Database

- **Supabase** - PostgreSQL with real-time capabilities
- **PostGIS** - Geospatial database extension
- Geographic queries with `GEOGRAPHY(POINT, 4326)`

### AI Service

- **Python** - Programming language
- **FastAPI** - API framework
- **CNN** - Convolutional Neural Network for image classification

#### Python Backend API

The AI service exposes an endpoint that receives an image and returns
snake detection results. It loads two PyTorch models at startup
from the `models/` directory:

- `snake_species_model.pt` (classification/species) —
  legacy code will also accept `snake_model.pt` as a fallback
- `snake_count_model.pt` (regression/count)

Make sure both files are placed in `models/` before starting the server; otherwise
you’ll see a "Models not loaded" error when calling `/predict`.
Key modules:

- `load_models.py` – handles one‑time loading and caching of models
- `predict_species.py` – runs inference for species and presence
- `predict_count.py` – estimates the number of snakes
- `utils/image_preprocessing.py` – converts raw bytes to PIL images
- `api.py` – FastAPI application exposing `/predict` endpoint

The response format is:

```json
{
  "snake_detected": true,
  "species": "Venomous",
  "confidence": 0.87,
  "snake_count": 2
}
```

Run the Python AI service with Uvicorn:

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

You can verify it's up by visiting `http://localhost:8000/health` or using `curl`.

> **Note:** the Node/Express backend forwards images to this service, so it must
> be running and accessible on port 8000 (or whatever `AI_SERVICE_URL` you
> configure in `backend/.env`). If you see "Models not loaded" or connection
> refused errors, restart the AI service and ensure the model files exist.
+
+### Supabase upload troubleshooting
+
+If image submissions keep failing with "Failed to upload image":
+
+1. Confirm the backend has valid Supabase credentials. Copy `.env.example` to
+   `backend/.env` and set `SUPABASE_URL`/`SUPABASE_ANON_KEY` accordingly. The
+   server will throw an error at startup if they are missing.
+2. Ensure a storage bucket named `bite-images` exists in your Supabase project
+   (or change the name in `backend/server.js`). The bucket must allow public
+   read or have appropriate policies – a 403 error will be logged otherwise.
+3. Check the backend console log when you submit a report; it now prints the
+   full Supabase error object and returns it to the frontend for easier
+   debugging.
+4. CORS is typically not an issue since upload happens server‑side, but make
+   sure your Supabase project isn't blocking uploads due to size limits or
+   invalid MIME types.
+5. You can manually test uploading by running curl against the Express endpoint
+   and examining the JSON response.
+
You can verify it's up by visiting `http://localhost:8000/health` or using `curl`.

> **Note:** the Node/Express backend forwards images to this service, so it must
> be running and accessible on port 8000 (or whatever `AI_SERVICE_URL` you
> configure in `backend/.env`). If you see "Models not loaded" or connection
> refused errors, restart the AI service and ensure the model files exist.

---

## 📂 Project Structure

```
palloti-hthon/
├── backend/
│   ├── server.js              # Express server with all endpoints
│   ├── supabaseClient.js      # Supabase connection and helper functions
│   ├── aiService.js           # AI prediction service bridge
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment variables template
│   └── supabase/
│       └── migrations/
│           └── 001_initial_schema.sql  # Database schema with PostGIS
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ReportForm.jsx       # Multi-step bite report form
│   │   │   ├── HeatMap.jsx          # Incident heatmap visualization
│   │   │   └── HospitalLocator.jsx  # Hospital finder with maps
│   │   ├── App.jsx            # Main application component
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles with Deep Forest theme
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js     # Custom color palette
│   ├── postcss.config.js
│   └── package.json           # Frontend dependencies
│
└── package.json               # Root workspace configuration
```

---

## 🎨 UI Theme: "Deep Forest"

**Color Palette:**

- **Background**: `emerald-950` (#052e16)
- **Accents**: `moss-600` (#65a30d)
- **Earth Tones**: Browns and natural greens
- **Danger Alerts**: `danger-orange` (#f97316)

**Aesthetic:**

- Glassmorphism effects with `backdrop-blur`
- Rounded UI components with smooth transitions
- High-readability typography (Inter font)
- Accessible contrast ratios

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for AI service)
- Supabase account
- PostgreSQL with PostGIS extension

### 1. Clone the Repository

```bash
git clone <repository-url>
cd palloti-hthon
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Or install individually
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000/predict
```

### 4. Setup Database

1. Create a new Supabase project
2. Enable PostGIS extension in your Supabase dashboard
3. Run the migration script:
   ```bash
   # Copy contents of backend/supabase/migrations/001_initial_schema.sql
   # and run it in Supabase SQL editor
   ```

### 5. Setup Supabase Storage

1. Create a storage bucket named `bite-images`
2. Set the bucket to public or configure appropriate access policies
3. Update the CORS settings if needed

### 6. Start Development Servers

**Option 1: Start all services concurrently**

```bash
npm run dev
```

**Option 2: Start services individually**

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Python AI Service (run from repo root):

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000

---

## 🗺 Database Schema

### Reports Table

Stores bite incident reports with geospatial data.

**Key Fields:**

- `id` - UUID primary key
- `incident_type` - 'snake_bite' or 'monkey_bite'
- `location` - PostGIS GEOGRAPHY(POINT) for geolocation
- `image_url` - Supabase storage URL
- `ai_analysis` - JSONB with CNN predictions
- `symptoms` - JSONB array of symptoms
- `severity_level` - 'mild', 'moderate', 'severe', 'critical'

### Hospitals Table

Hospitals with anti-venom availability.

**Key Fields:**

- `id` - UUID primary key
- `location` - PostGIS GEOGRAPHY(POINT)
- `has_snake_antivenom` - Boolean
- `has_monkey_treatment` - Boolean
- `is_24x7` - Boolean
- `rating` - Decimal (0-5)

### RPC Functions

- `find_nearest_hospitals()` - Find hospitals by distance
- `get_heatmap_data()` - Get incident data for visualization

---

## 🔌 API Endpoints

### Reports

- `POST /api/reports/create` - Create new bite report with image
- `GET /api/reports/recent` - Get recent reports
- `PATCH /api/reports/:id/status` - Update report status

### Heatmap

- `GET /api/heatmap` - Get heatmap data with filters

### Hospitals

- `GET /api/hospitals/nearest` - Find nearest hospitals
- `GET /api/hospitals` - Get all active hospitals

### Emergency

- `GET /api/emergency-contacts` - Get emergency contact numbers

### Health

- `GET /api/health` - System health check

---

## 🤖 AI Service Integration

The backend forwards uploaded images to a Python FastAPI service running on `http://localhost:8000/predict`.

**Expected Request:**

```
POST /predict
Content-Type: multipart/form-data
Body: image file
```

**Expected Response:**

```json
{
  "snake_detected": true,
  "species": "Venomous",
  "confidence": 0.87,
  "snake_count": 2
}
```

---

## 📱 Features Detail

### 1. Report Form (Multi-Step)

**Step 1**: Incident type selection (snake/monkey) + image upload  
**Step 2**: Location capture using Geolocation API  
**Step 3**: Symptom checklist (customized per incident type)  
**Step 4**: Victim information and additional notes

### 2. Heatmap Visualization

- Interactive Leaflet map with heatmap overlay
- Filters by date range and incident type
- Color-coded severity (green to red gradient)
- Real-time statistics overlay

### 3. Hospital Locator

- Interactive map with hospital markers
- Distance calculation from user location
- Click-to-call emergency numbers
- Google Maps integration for directions
- Sortable list view with ratings

---

## 🎨 Glassmorphism Components

Custom CSS classes for the "Deep Forest" aesthetic:

```css
.glass-card       /* Main cards with backdrop blur */
.glass-card-sm    /* Smaller glass effect cards */
.btn-primary      /* Moss-green action buttons */
.btn-secondary    /* Transparent glass buttons */
.btn-danger       /* Emergency/danger buttons */
.input-field      /* Glass-style form inputs */
.alert-danger     /* Red alert notifications */
.alert-success    /* Green success messages */
```

---

## 🔒 Security Considerations

- **Row Level Security (RLS)** enabled on Supabase tables
- Environment variables for sensitive data
- Input validation on all endpoints
- File type and size restrictions for uploads
- CORS configuration for frontend-backend communication
- Rate limiting recommended for production

---

## 🚀 Deployment

### Backend Deployment

- Deploy to platforms like Heroku, Render, or Railway
- Ensure environment variables are set
- Configure production database URL

### Frontend Deployment

- Build: `npm run build`
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Update API proxy configuration in `vite.config.js`

### Database

- Use Supabase managed PostgreSQL
- Enable PostGIS extension
- Configure backups and monitoring

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Emergency Contacts (India)

- **Ambulance**: 108 / 102
- **Police**: 100
- **Fire**: 101
- **Disaster Management**: 108
- **Women Helpline**: 1091

---

## 👨‍💻 Support

For issues and questions:

- Open a GitHub issue
- Contact: [your-email@example.com]

---

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Leaflet.js for mapping capabilities
- Supabase for backend infrastructure
- The open-source community

---

**Built with ❤️ for community safety** 🌲
