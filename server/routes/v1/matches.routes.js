import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getRecommendations,
  getMatchDetail,
  expressInterest,
  undoInterest,
  declineInterest,
  getPendingInterests,
  getMutualMatches,
  getTodayMatches,
} from '../../controllers/matches.controller.js';

const router = Router();

router.use(authenticate);
router.get('/today', getTodayMatches);
router.get('/mutual', getMutualMatches);
router.get('/pending', getPendingInterests);
router.get('/recommendations', getRecommendations);
router.get('/:id', getMatchDetail);
router.post('/:id/interest', expressInterest);
router.delete('/:id/interest', undoInterest);
router.post('/:id/interest/decline', declineInterest);

export default router;
