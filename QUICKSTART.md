# 🚀 SylvanGuard - Quick Start (5 Minutes)

Get SylvanGuard running quickly with this condensed guide.

---

## ⚡ Fast Setup

### 1️⃣ Run Setup Script

**Windows:**

```bash
setup.bat
```

**macOS/Linux:**

```bash
chmod +x setup.sh start-dev.sh
./setup.sh
```

This installs all dependencies automatically!

---

### 2️⃣ Configure Supabase (3 minutes)

1. **Create Supabase Project**: https://app.supabase.com
2. **Get Credentials**: Settings → API → Copy URL and anon key
3. **Edit `backend/.env`**:

   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   ```

4. **Enable PostGIS**: Database → Extensions → Enable "postgis"

5. **Run Migration**: SQL Editor → Paste contents of `backend/supabase/migrations/001_initial_schema.sql` → Run

6. **Create Storage**: Storage → New Bucket → Name: `bite-images` → Public

---

### 3️⃣ Start Servers

**Terminal 1** (Backend + Frontend):

```bash
# Windows
start-dev.bat

# macOS/Linux
./start-dev.sh
```

**Terminal 2** (Python AI):

```bash
cd python-ai-service

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

python main.py
```

---

## ✅ Verify

Open in browser:

- 🌐 Frontend: http://localhost:5173
- 🔧 Backend: http://localhost:5000/api/health
- 🤖 AI Service: http://localhost:8000/health

---

## 🎯 First Test

1. Click **"Report Bite"** tab
2. Select **Snake Bite** or **Monkey Bite**
3. Upload any image (demo mode uses mock AI)
4. Click **"Get Current Location"**
5. Complete remaining steps
6. Submit!

---

## 📚 More Info

- Full setup: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- API docs: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- Structure: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

## 🆘 Quick Fixes

**"Cannot connect to Supabase"**
→ Check `.env` file has correct credentials

**"AI Service unavailable"**
→ Start Python service in Terminal 2

**"Location not working"**
→ Allow location permissions in browser

---

## 🎨 Custom Colors

Edit `frontend/tailwind.config.js` to change the theme!

---

**Ready in 5 minutes! 🌲**
