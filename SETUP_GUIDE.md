# 🚀 SylvanGuard - Quick Setup Guide

Follow these steps to get SylvanGuard running on your local machine.

---

## ✅ Prerequisites Checklist

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Python 3.9+ installed ([Download](https://www.python.org/downloads/))
- [ ] Supabase account ([Sign up](https://supabase.com))
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

---

## 📦 Installation Steps

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd palloti-hthon

# Install all dependencies at once
npm run install:all

# Or install individually:
cd backend && npm install
cd ../frontend && npm install
```

---

### 2. Setup Supabase Database

#### A. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created (2-3 minutes)

#### B. Enable PostGIS Extension

1. In Supabase Dashboard, go to **Database → Extensions**
2. Search for "postgis"
3. Enable PostGIS extension
4. Enable pg_trgm (for text search)

#### C. Run Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Copy the entire contents of `backend/supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. Wait for completion (should see: "Success. No rows returned")

#### D. Setup Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Create new bucket: `bite-images`
3. Set bucket to **Public** (or configure RLS policies)
4. Save bucket settings

#### E. Get API Credentials

1. Go to **Settings → API**
2. Copy your:
   - **Project URL** (something like: https://xxxxx.supabase.co)
   - **anon/public key** (long string starting with "eyJ...")

---

### 3. Configure Environment Variables

#### Backend Configuration

Create `backend/.env` file:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000/predict
```

**⚠️ Important**: Replace `your-project-id` and `your-anon-key-here` with actual values from Supabase!

---

### 4. Setup Python AI Service

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Place model files in `models/`:

- `snake_species_model.pt` (or fallback `snake_model.pt`)
- `snake_count_model.pt` (optional)

---

### 5. Start All Services

#### Option A: Start All at Once (Recommended)

From the root directory:

```bash
# Terminal 1: Start backend and frontend concurrently
npm run dev
```

```bash
# Terminal 2: Start Python AI service
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # macOS/Linux
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

#### Option B: Start Individually

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Python AI Service
venv\Scripts\activate  # Windows
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

---

### 6. Verify Installation

✅ **Check all services are running:**

1. **Frontend**: Open http://localhost:5173
   - You should see the SylvanGuard homepage

2. **Backend**: Open http://localhost:5000/api/health
   - You should see JSON: `{"status": "ok", ...}`

3. **AI Service**: Open http://localhost:8000/health
   - You should see JSON: `{"status": "healthy", ...}`

✅ **Check Supabase Connection:**

Open browser console on http://localhost:5173 and check for any errors.

---

## 🎉 You're Ready!

Try these actions to test the system:

1. **Report a Bite**:
   - Click "Report Bite" tab
   - Select incident type (Snake/Monkey)
   - Upload a test image
   - Allow location access
   - Complete the form

2. **View Heatmap**:
   - Click "Heatmap" tab
   - Adjust filters (date range, incident type)
   - View incident hotspots

3. **Find Hospitals**:
   - Click "Find Hospitals" tab
   - Allow location access
   - View nearest hospitals on map
   - Click for directions or to call

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solution**:

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env`
- Check if Supabase project is active
- Ensure PostGIS extension is enabled

### Issue: "AI Service not available"

**Solution**:

- Check if Python service is running on port 8000
- Verify virtual environment is activated
- Check terminal logs from `uvicorn api:app --reload --host 0.0.0.0 --port 8000`

### Issue: "Location not working"

**Solution**:

- Ensure HTTPS or localhost (Geolocation API requirement)
- Allow location permissions in browser
- Check browser console for errors

### Issue: "Image upload fails"

**Solution**:

- Verify Supabase storage bucket `bite-images` exists
- Check bucket is set to public or has proper RLS policies
- Ensure image is under 10MB and in supported format (JPEG, PNG, WebP)

### Issue: "CORS errors"

**Solution**:

- Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Restart backend server after changing `.env`

### Issue: "Heatmap not loading"

**Solution**:

- Check browser console for JavaScript errors
- Ensure Leaflet CSS is loaded (check `frontend/index.html`)
- Verify sample data exists in Supabase `reports` table

---

## 📚 Next Steps

1. **Add Sample Data**:
   - Use the SQL editor to insert sample hospitals
   - Submit test reports through the UI

2. **Train AI Model**:
   - Improve inference logic in `api.py`, `predict_species.py`, and `predict_count.py`
   - Train CNN on actual bite images
   - Update model loading code

3. **Customize**:
   - Adjust colors in `frontend/tailwind.config.js`
   - Modify hospital search radius
   - Add more symptom options

4. **Deploy**:
   - See deployment section in main README.md
   - Configure production environment variables
   - Set up CI/CD pipeline

---

## 📞 Need Help?

- Check the main [README.md](../README.md) for detailed documentation
- Review API endpoints and database schema
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Happy Coding! 🌲**
