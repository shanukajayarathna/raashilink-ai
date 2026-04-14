import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

let io = null;

const ALLOWED_ORIGINS = [
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:3001', 'http://127.0.0.1:3001',
  'http://localhost:4173', 'http://127.0.0.1:4173',
];

export function initSocket(httpServer) {
  const origins = [...ALLOWED_ORIGINS];
  if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);

  io = new Server(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.sub || decoded.userId || decoded.id);
      if (!socket.userId || socket.userId === 'undefined') {
        return next(new Error('Invalid token payload'));
      }
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} reason=${reason}`);
    });
  });

  logger.info('Socket.io initialised');
  return io;
}

export function getIo() {
  return io;
}

/**
 * Emit a real-time event to a specific user (all their active tabs/devices).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} event
 * @param {object} data
 */
export function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, data);
}
