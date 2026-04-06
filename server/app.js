import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/v1/auth.routes.js';
import usersRoutes from './routes/v1/users.routes.js';
import matchesRoutes from './routes/v1/matches.routes.js';
import chatRoutes from './routes/v1/chat.routes.js';
import vendorsRoutes from './routes/v1/vendors.routes.js';
import weddingRoutes from './routes/v1/wedding.routes.js';
import honeymoonRoutes from './routes/v1/honeymoon.routes.js';
import horoscopeRoutes from './routes/v1/horoscope.routes.js';
import { connectRedis } from './lib/redis.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { seedDemoUsers } from './services/demoData.service.js';

dotenv.config();

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean));

  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json({ limit: '10mb' }));

app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({ success: true, message: 'RaashiLink API healthy' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/vendors', vendorsRoutes);
app.use('/api/v1/wedding', weddingRoutes);
app.use('/api/v1/honeymoon', honeymoonRoutes);
app.use('/api/v1/horoscope', horoscopeRoutes);
app.use(errorHandler);

export async function startServer() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raashilink';
  const port = Number(process.env.PORT || 5000);

  await mongoose.connect(mongoUri);
  logger.info('MongoDB connected');

  await seedDemoUsers();
  await connectRedis();

  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error('Server startup failed', { message: error.message });
    process.exit(1);
  });
}

export default app;
