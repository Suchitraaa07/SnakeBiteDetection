# SylvanGuard Quickstart (Contributors)

This guide is for new contributors cloning this repo.

## 1. Prerequisites

- Node.js 18+
- Python 3.9+
- Git
- Supabase project (for backend DB + storage)

## 2. Clone and Install

```bash
git clone <your-repo-url>
cd SnakeBiteDetection
```

Windows:

```bash
setup.bat
```

macOS/Linux:

```bash
chmod +x setup.sh start-dev.sh
./setup.sh
```

## 3. Configure Backend Env

Copy `backend/.env.example` to `backend/.env` and fill real values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000/predict
```

## 4. Setup Supabase

0. If this repository or its history was ever shared with real keys, rotate Supabase `anon` and `service_role` keys first.
1. Run SQL migration from `backend/supabase/migrations/001_initial_schema.sql`.
2. Create storage bucket `bite-images` (public or with suitable policies).

## 5. Add Model Files

Place model files inside `models/`:

- Preferred species model: `snake_species_model.pt`
- Fallback species model: `snake_model.pt` (already supported)
- Optional count model: `snake_count_model.pt`

If count model is missing, API falls back to count `1`.

## 6. Run Services

Terminal 1 (Node backend + frontend):

```bash
npm run dev
```

Terminal 2 (Python AI service):

Windows:

```bash
venv\Scripts\activate
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

macOS/Linux:

```bash
source venv/bin/activate
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

## 7. Verify

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health
- AI health: http://localhost:8000/health

## 8. Common Issues

- `502` on `/api/ai/predict`: Python AI service not running or crashed.
- `Species model not loaded`: missing `models/snake_species_model.pt` and `models/snake_model.pt`.
- Supabase upload errors: verify `backend/.env` keys and `bite-images` bucket.
