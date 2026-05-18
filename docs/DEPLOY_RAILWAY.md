# Railway Deployment (Backend)

This repo contains:

- Frontend: Vite (deploy separately, e.g. Vercel/Cloudflare Pages)
- Backend: Node/Express + Socket.IO + MongoDB + Python subprocesses (deploy to Railway)

## 1) Create MongoDB Atlas (required)

1. Create a MongoDB Atlas cluster.
2. Create a DB user.
3. Add Railway outbound IP rules as needed (or temporarily allow `0.0.0.0/0` while testing).
4. Copy your connection string as `MONGODB_URI`.

## 2) Create a Railway project (backend)

1. Railway → New Project → Deploy from GitHub Repo.
2. Select this repository.
3. Choose the service that builds from the repo root.

This repository includes a `Dockerfile`, so Railway will build a container that includes:

- Node.js 20
- Python 3 + `server/python/requirements.txt` dependencies
- Starts the API with `npm run api`

## 3) Railway environment variables (backend)

Set these in Railway → Service → Variables:

- `NODE_ENV=production`
- `MONGODB_URI=...` (Atlas connection string)
- `JWT_SECRET=...` (long random secret)
- `FRONTEND_URL=https://<your-frontend-domain>` (used for CORS)
- `REDIS_ENABLED=false` (recommended until you add Redis)

Optional (only if you use the feature):

- `GOOGLE_CLIENT_ID=...`
- `OPENAI_API_KEY=...` / `GEMINI_API_KEY=...` / `GROQ_API_KEY=...`
- `AWS_*` variables if you move uploads to S3

Notes:

- Railway automatically provides `PORT`. Do not hardcode it.
- Do not set `PYTHON_BIN` on Railway unless you know the exact path; default `python3` works.

## 4) Deploy and verify

After the first deploy, open the Railway-generated public URL and verify:

- `GET /api/v1/health` returns JSON with `success: true`

If you see `503` for a short time, the app is still connecting to MongoDB.

## 5) Frontend config

Deploy the frontend (Vercel/Cloudflare Pages) and set:

- `VITE_API_URL=https://<your-railway-backend-domain>`

## 6) Uploads on Railway (important)

Railway containers have ephemeral disk. If you need persistent user uploads, switch to S3 (set `VENDOR_DOCUMENT_STORAGE=s3` and the `AWS_*` variables) before going live.

