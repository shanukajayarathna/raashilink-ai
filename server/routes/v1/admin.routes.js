import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { getOverview } from '../../controllers/admin.controller.js';

const router = Router();

router.use(authenticate);
router.get('/overview', getOverview);

export default router;
