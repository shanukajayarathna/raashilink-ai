import http from 'node:http';
import path from 'node:path';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { initSocket } from './lib/socket.js';
import authRoutes from './routes/v1/auth.routes.js';
import usersRoutes from './routes/v1/users.routes.js';
import matchesRoutes from './routes/v1/matches.routes.js';
import chatRoutes from './routes/v1/chat.routes.js';
import vendorsRoutes from './routes/v1/vendors.routes.js';
import weddingRoutes from './routes/v1/wedding.routes.js';
import honeymoonRoutes from './routes/v1/honeymoon.routes.js';
import horoscopeRoutes from './routes/v1/horoscope.routes.js';
import adminRoutes from './routes/v1/admin.routes.js';
import notificationsRoutes from './routes/v1/notifications.routes.js';
import { connectRedis } from './lib/redis.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { seedDemoUsers } from './services/demoData.service.js';
import './jobs/dailyMatches.job.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRootDir = path.resolve(__dirname, 'uploads');

const app = express();
app.locals.isReady = false;
app.locals.startupPhase = 'booting';

app.use((req, res, next) => {
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    process.env.FRONTEND_URL,
  ].filter(Boolean));

  const requestOrigin = req.headers.origin;
  const isDevOrigin = (() => {
    if (!requestOrigin || process.env.NODE_ENV === 'production') {
      return false;
    }

    try {
      const parsed = new URL(requestOrigin);
      const hostname = parsed.hostname.toLowerCase();
      const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
      const isPrivateIpv4 =
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
      const isLocalDomain = hostname.endsWith('.local');

      return isLoopback || isPrivateIpv4 || isLocalDomain;
    } catch {
      return false;
    }
  })();

  if (requestOrigin && (allowedOrigins.has(requestOrigin) || isDevOrigin)) {
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
app.use('/uploads', express.static(uploadsRootDir));

app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({
    success: true,
    ready: Boolean(req.app.locals.isReady),
    phase: req.app.locals.startupPhase || 'booting',
    message: req.app.locals.isReady ? 'RaashiLink API healthy' : 'RaashiLink API is starting',
  });
});

app.use((req, res, next) => {
  if (req.app.locals.isReady) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: 'RaashiLink API is still starting. Please try again in a few seconds.',
    phase: req.app.locals.startupPhase || 'booting',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/vendors', vendorsRoutes);
app.use('/api/v1/wedding', weddingRoutes);
app.use('/api/v1/honeymoon', honeymoonRoutes);
app.use('/api/v1/horoscope', horoscopeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use(errorHandler);

export async function startServer() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raashilink';
  const port = Number(process.env.PORT || 5000);

  // Keep API readiness in sync with actual MongoDB connection state.
  mongoose.connection.on('connected', () => {
    app.locals.isReady = true;
    if (app.locals.startupPhase !== 'warming-services') {
      app.locals.startupPhase = 'ready';
    }
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('reconnected', () => {
    app.locals.isReady = true;
    app.locals.startupPhase = 'ready';
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    app.locals.isReady = false;
    app.locals.startupPhase = 'degraded';
    logger.warn('MongoDB connection lost');
  });

  mongoose.connection.on('error', (error) => {
    app.locals.startupPhase = 'degraded';
    logger.error('MongoDB connection error', { message: error.message });
  });

  const server = http.createServer(app);
  initSocket(server);
  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });

  // Add server error handler
  server.on('error', (error) => {
    logger.error('Server error', { message: error.message, code: error.code });
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use`);
      process.exit(1);
    }
  });

  try {
    app.locals.startupPhase = 'connecting-database';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    app.locals.isReady = true;
    app.locals.startupPhase = 'ready';
    logger.info('API ready for requests');

    void (async () => {
      try {
        app.locals.startupPhase = 'warming-services';
        await Promise.allSettled([seedDemoUsers(), connectRedis()]);
        if (mongoose.connection.readyState === 1) {
          app.locals.startupPhase = 'ready';
        } else {
          app.locals.isReady = false;
          app.locals.startupPhase = 'degraded';
        }
        logger.info('Background startup tasks completed');
      } catch (backgroundError) {
        app.locals.startupPhase = 'degraded';
        logger.error('Background startup tasks failed', {
          message: backgroundError instanceof Error ? backgroundError.message : String(backgroundError),
        });
      }
    })();
  } catch (error) {
    app.locals.startupPhase = 'startup-failed';
    server.close();
    throw error;
  }

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error('Server startup failed', { message: error.message });
    process.exit(1);
  });

  // Global error handlers to prevent server crashes
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    // Give time for logs to flush before exit
    setTimeout(() => process.exit(1), 1000);
  });
}

export default app;
