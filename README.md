# RaashiLink.AI

An Intelligent Web-Based System for Horoscope Compatibility Analysis and Personalized Wedding Planning.

## Project Structure

- `/backend` — Node.js + Express REST API
- `/frontend` — React.js single page application
- `/docs` — Architecture diagrams and API documentation

## Tech Stack

- **Frontend:** React.js 18, Material-UI, Redux Toolkit
- **Backend:** Node.js, Express.js, MongoDB, Redis
- **AI/ML:** TensorFlow.js, Scikit-learn, OpenAI GPT-4
- **Astrology:** PySwissEph (Swiss Ephemeris)
- **Cloud:** AWS (EC2, S3, CloudFront, Lambda)

## Getting Started

See `/backend/README.md` and `/frontend/README.md` for setup instructions.

## Author

Kotuwe Jayarathna — Plymouth Index: 10953730  
Supervisor: Ms. Sanuli Weerasinghe  
Module: PUSL3190 Computing Group Project
```

---

**`backend/.env.example`**
```
PORT=5000
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/raashilink
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development