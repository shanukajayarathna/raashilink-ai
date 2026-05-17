# Render Backend Deployment Guide

This guide is for deploying the backend API to Render.

Best paired setup:

- Frontend: Vercel or Cloudflare Pages
- Backend API: Render Web Service
- Database: MongoDB Atlas
- Cache: disabled initially with `REDIS_ENABLED=false`

## Important Note About Render Free

Render currently offers a free web service plan, but free services have limits and can sleep when inactive. That is acceptable for testing, demos, and light personal use, but not ideal for production-grade uptime.

## Why Render Needs Docker Here

This backend is not just Node.js. It also shells out to Python for horoscope and compatibility work. The safest Render deployment is a Docker web service so Node and Python are available in the same runtime.

Files added for this path:

- `Dockerfile.render`
- `render.yaml`

## 1. Prepare MongoDB Atlas

1. Create or reuse your Atlas cluster.
2. Create a database user with a strong password.
3. Add Render outbound access temporarily using `0.0.0.0/0` if needed for first deploy.
4. Once stable, tighten access according to your risk tolerance.

## 2. Create the Render Web Service

1. Go to Render Dashboard.
2. Click `New +` -> `Blueprint` or `Web Service`.
3. Connect the GitHub repo: `shanukajayarathna/raashilink-ai`.
4. If using Blueprint, Render will pick up `render.yaml`.
5. If using manual Web Service setup:

- Environment: `Docker`
- Dockerfile Path: `./Dockerfile.render`
- Branch: `main`
- Plan: `Free`
- Health Check Path: `/api/v1/health`

## 3. Backend Environment Variables on Render

Set these in the Render service environment:

- `NODE_ENV=production`
- `MONGODB_URI=your_atlas_connection_string`
- `JWT_SECRET=your_long_random_secret`
- `FRONTEND_URL=https://your-frontend-domain`
- `PYTHON_BIN=python3`
- `REDIS_ENABLED=false`

Optional only if you use them:

- `GOOGLE_CLIENT_ID`
- `AI_PROVIDER`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `FIREBASE_*`
- `VENDOR_DOCUMENT_STORAGE`
- `AWS_*`

## 4. Frontend Environment Variable

After Render creates the backend service, you will get a URL like:

`https://raashilink-api.onrender.com`

Set your frontend env to:

`VITE_API_URL=https://raashilink-api.onrender.com/api/v1`

If you attach a custom backend domain later, replace it there.

## 5. First Checks

After deploy finishes, test:

```bash
curl https://raashilink-api.onrender.com/api/v1/health
```

Expected result: JSON with `success: true` and `ready: true` once MongoDB is connected.

## 6. Known Constraints on Render Free

- Cold starts can slow the first request.
- Python-heavy routes will be slower than on a dedicated VM.
- Local uploads are ephemeral on most container platforms, including Render.

Because of that, for vendor documents you should eventually switch from local storage to S3-compatible storage if you need persistence across redeploys.

## 7. Recommended Launch Order

1. Deploy backend to Render.
2. Confirm `/api/v1/health` is healthy.
3. Deploy frontend with `VITE_API_URL` pointed at the Render URL.
4. Test login, horoscope, chat, and vendor upload flows.