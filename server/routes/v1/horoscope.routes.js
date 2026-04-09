import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { getMyChart, postCompatibility, calculateCompatibility, generateChart } from '../../controllers/horoscope.controller.js';

const router = Router();

router.get('/my-chart', authenticate, getMyChart);
router.post('/compatibility', authenticate, calculateCompatibility);
router.post('/generate', authenticate, generateChart);

export default router;
