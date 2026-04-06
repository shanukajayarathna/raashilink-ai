import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { getMyChart, postCompatibility } from '../../controllers/horoscope.controller.js';

const router = Router();

router.get('/my-chart', authenticate, getMyChart);
router.post('/compatibility', authenticate, postCompatibility);

export default router;
