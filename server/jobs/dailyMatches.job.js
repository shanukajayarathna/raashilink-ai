import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import User from '../models/User.js';
import { redisClient } from '../lib/redis.js';
import logger from '../utils/logger.js';
import MatchInterest from '../models/MatchInterest.js';
import { resolvePythonCommand } from '../utils/pythonRuntime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HYBRID_ENGINE_PATH = path.resolve(__dirname, '../python/recommendation/hybrid_engine.py');

async function generateDailyMatches() {
  try {
    logger.info('Starting daily matches generation');

    // Get all verified users with role 'user'
    const users = await User.find({
      role: 'user',
      'verification.emailVerified': true // assuming emailVerified field tracks verified status
    }).lean();

    logger.info(`Processing ${users.length} verified users for daily matches`);

    for (const user of users) {
      try {
        // Get interaction count
        const interactionCount = await MatchInterest.countDocuments({
          fromUser: user._id
        });

        // Build user profile
        const userProfile = {
          id: String(user._id),
          personalInfo: {
            firstName: user.personalInfo?.firstName || '',
            lastName: user.personalInfo?.lastName || '',
            age: user.personalInfo?.age || 28,
            gender: user.personalInfo?.gender || 'male',
            location: user.personalInfo?.location || 'Colombo'
          },
          personality: user.personality || {},
          lifestyle: user.lifestyle || {},
          interactions: {
            interestsSent: interactionCount,
            interestsReceived: await MatchInterest.countDocuments({
              toUser: user._id
            })
          }
        };

        // Get exclude IDs (already sent interests or mutual)
        const existingInterests = await MatchInterest.find({
          fromUser: user._id
        }).select('toUser').lean();
        const excludeIds = existingInterests.map(i => String(i.toUser));

        // Call hybrid engine using the shared workspace Python runtime
        const pythonCmd = resolvePythonCommand();
        const engineOutput = await new Promise((resolve, reject) => {
          const child = spawn(pythonCmd, [HYBRID_ENGINE_PATH, JSON.stringify({
            userProfile,
            topN: 10,
            excludeIds,
            interactionCount
          })], {
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 10000
          });

          let stdout = '';
          let stderr = '';

          child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
          });

          child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
          });

          child.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Engine failed with code ${code}: ${stderr}`));
            } else {
              try {
                const result = JSON.parse(stdout.trim());
                resolve(result);
              } catch (e) {
                reject(new Error(`Failed to parse result: ${e.message}`));
              }
            }
          });

          child.on('error', (error) => {
            reject(new Error(`Process error: ${error.message}`));
          });
        });

        if (engineOutput.success && engineOutput.recommendations.length > 0) {
          // Cache the results
          const cacheKey = `matches:today:${user._id}`;
          await redisClient.setEx(
            cacheKey,
            86400, // 24 hours
            JSON.stringify({
              recommendations: engineOutput.recommendations,
              generatedAt: new Date().toISOString()
            })
          );
        }
      } catch (err) {
        logger.warn(`Failed to generate matches for user ${user._id}`, {
          message: err.message
        });
      }
    }

    logger.info('Daily matches generation completed');
  } catch (err) {
    logger.error('Daily matches generation failed', {
      message: err.message,
      stack: err.stack
    });
  }
}

// Schedule: 2 AM daily
cron.schedule('0 2 * * *', () => {
  generateDailyMatches();
});

logger.info('Daily matches cron job scheduled (2 AM daily)');

export default {
  generateDailyMatches
};
