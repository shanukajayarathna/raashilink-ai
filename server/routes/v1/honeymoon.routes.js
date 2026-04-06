import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { listDestinations, getDestination } from '../../controllers/honeymoon.controller.js';

const router = Router();

router.use(authenticate);
router.get('/destinations', listDestinations);
router.get('/destinations/:id', getDestination);

export default router;
