import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  requestContactVerification,
  confirmContactVerification,
} from '../../controllers/users.controller.js';

const router = Router();

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/verification/request', requestContactVerification);
router.post('/verification/confirm', confirmContactVerification);

export default router;
