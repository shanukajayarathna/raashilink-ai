# RaashiLink.ai

RaashiLink.ai is a full-stack Sri Lankan matchmaking platform that combines profile-based recommendations, Vedic compatibility logic, horoscope generation, real-time chat, wedding planning tools, and vendor marketplace workflows.

This repository contains:
- React + Vite frontend
- Node.js + Express API backend
- MongoDB persistence
- Optional Redis caching layer
- Python engines for recommendation and horoscope-related computations

## Core Features

- Hybrid matchmaking with compatibility scoring
- Vedic compatibility using Ashtakoota (8-factor Guna Milan)
- Horoscope generation and personalized guidance endpoints
- JWT authentication and role-aware access
- Real-time chat and notifications
- Vendor onboarding with document upload and optional S3 storage
- Admin workflows for moderation and management

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Redux Toolkit, MUI
- Backend: Node.js, Express, Mongoose, Socket.IO
- Database: MongoDB
- Cache: Redis (optional, graceful fallback when unavailable)
- Python services: compatibility and recommendation engines

## Project Structure

- Frontend app: src/
- Backend API: server/
- Python engines: server/python/
- Utility scripts: scripts/
- Public assets: public/
- Additional docs: docs/

Detailed structure reference: docs/PROJECT_STRUCTURE.md

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+ (recommended 3.11+)
- MongoDB (local or Atlas)
- Redis (optional, recommended for performance)

## Quick Start (Development)

1. Install JavaScript dependencies

```bash
npm install
```

2. Install Python dependencies

```bash
pip install -r server/python/requirements.txt
```

3. Create environment files

- Backend env file: .env or .env.local
- Frontend env file: .env.local

4. Start full stack (frontend + backend)

```bash
npm run dev
```

5. Verify API health

```bash
curl http://localhost:5000/api/v1/health
```

Frontend runs on port 3000. Backend runs on port 5000 by default.

## Environment Variables

### Required (Backend)

| Variable | Description | Example |
|---|---|---|
| MONGODB_URI | MongoDB connection URI | mongodb://127.0.0.1:27017/raashilink |
| JWT_SECRET | JWT signing secret | change-this-secret |
| PORT | Backend port | 5000 |
| FRONTEND_URL | Allowed CORS frontend URL | http://localhost:3000 |

### Optional (Backend)

| Variable | Description | Example |
|---|---|---|
| REDIS_ENABLED | Force enable/disable Redis | true |
| REDIS_URL | Redis connection string | redis://127.0.0.1:6379 |
| PYTHON_BIN | Python binary path override | python |
| GOOGLE_CLIENT_ID | Google OAuth client ID | your-google-client-id |
| DEV_ADMIN_EMAIL | Development admin seed email | admin@gmail.com |
| DEV_ADMIN_PASSWORD | Development admin seed password | 11111111 |

### Optional AI Provider Configuration (Backend)

| Variable | Description | Example |
|---|---|---|
| AI_PROVIDER | ai provider selection (auto, gemini, groq) | auto |
| GEMINI_API_KEY | Gemini API key | your-key |
| GEMINI_MODEL | Gemini model name | gemini-1.5-flash |
| GROQ_API_KEY | Groq API key | your-key |
| GROQ_MODEL | Groq model name | llama-3.1-8b-instant |

### Optional Vendor Document S3 Storage (Backend)

If VENDOR_DOCUMENT_STORAGE is not set to s3, uploads fall back to local disk under server/uploads/vendor-documents.

| Variable | Description | Example |
|---|---|---|
| VENDOR_DOCUMENT_STORAGE | Storage mode (local or s3) | s3 |
| AWS_REGION | AWS region | ap-south-1 |
| AWS_ACCESS_KEY_ID | AWS access key | your-access-key |
| AWS_SECRET_ACCESS_KEY | AWS secret key | your-secret-key |
| AWS_S3_BUCKET | S3 bucket name | raashilink-vendor-docs |
| AWS_S3_PUBLIC_BASE_URL | Optional public base URL | https://cdn.example.com |

### Frontend Variables

| Variable | Description | Example |
|---|---|---|
| VITE_API_URL | API base URL used by frontend | http://localhost:5000/api/v1 |
| VITE_GOOGLE_CLIENT_ID | Google OAuth client ID for frontend | your-google-client-id |

## Useful Scripts

| Command | Purpose |
|---|---|
| npm run dev | Run frontend + backend in development |
| npm run dev:web | Run frontend only |
| npm run dev:api | Run backend only |
| npm run build | Build frontend for production |
| npm run preview | Preview production build locally |
| npm run lint | Type-check project |
| npm run cleanup-users | Cleanup local test users |

## API Overview

Base path: /api/v1

Main route groups:
- /auth
- /users
- /matches
- /chat
- /vendors
- /wedding
- /honeymoon
- /horoscope
- /admin
- /notifications

Health endpoints:
- /health
- /api/v1/health

## Deployment Notes

### Frontend

- Build with npm run build
- Deploy dist/ to static hosting (for example Vercel, Netlify, CloudFront, Nginx)
- Set VITE_API_URL to your deployed backend API base

### Backend

- Deploy Node.js API as a long-running service (for example Render, Railway, EC2, or container platform)
- Provide required environment variables
- Ensure MongoDB network access and credentials are configured
- Configure FRONTEND_URL for CORS in production

### Redis (Recommended)

- Enable Redis in production for lower latency on repeated recommendation/compatibility paths
- If Redis is down, API continues with cache bypass/fallback behavior

### Python Runtime Limitation and Planned Upgrade

The current backend triggers Python computations through subprocess execution. This is reliable for development and moderate load, but cold-start overhead can increase latency for compute-heavy endpoints.

Recommended production evolution:
- Migrate to a persistent Python microservice (for example FastAPI)
- Keep workers warm for predictable response times
- Use message queues for heavy async jobs where appropriate

## Development Notes

- The development runner reuses an already-running API instance when available
- The backend exposes readiness state via /api/v1/health
- Demo users are seeded during startup when applicable

## Security Baseline

- JWT-based authentication
- Password hashing with bcrypt
- Role-aware endpoint protection
- Controlled CORS with environment-based origin settings

Before production release, add:
- HTTPS enforcement
- secret rotation policy
- security headers and rate limiting
- backup and retention policy

## License

Private project repository. Use according to institutional and team guidelines.
