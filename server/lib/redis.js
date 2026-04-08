import { createClient } from 'redis';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || '';
const redisEnabled =
  process.env.REDIS_ENABLED === 'true' ||
  (redisUrl && process.env.REDIS_ENABLED !== 'false');

const noopRedisClient = {
  isOpen: false,
  async get() {
    return null;
  },
  async set() {
    return null;
  },
  async setEx() {
    return null;
  },
  async del() {
    return null;
  },
};

export const redisClient = redisEnabled
  ? createClient({
      url: redisUrl,
    })
  : noopRedisClient;

if (redisEnabled) {
  redisClient.on('error', (error) => {
    logger.warn('Redis client unavailable, continuing without cache', {
      message: error.message,
    });
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });
} else {
  logger.info('Redis disabled; running without cache');
}

export async function connectRedis() {
  if (!redisEnabled) {
    return;
  }

  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
      logger.warn('Redis unavailable, continuing without cache', {
        message: error.message,
      });
    }
  }
}

export default redisClient;
