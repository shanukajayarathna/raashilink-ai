import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getRecommendations,
  getMatchDetail,
  expressInterest,
  undoInterest,
  getTodayMatches,
} from '../../controllers/matches.controller.js';

const router = Router();

router.use(authenticate);
router.get('/today', getTodayMatches);
router.get('/recommendations', getRecommendations);
router.get('/:id', getMatchDetail);
router.post('/:id/interest', expressInterest);
router.delete('/:id/interest', undoInterest);

export default router;
