import { Router } from 'express';
import multer from 'multer';
import authenticate from '../../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  uploadCoverPhoto,
  uploadProfilePhoto,
  requestContactVerification,
  confirmContactVerification,
  deleteAccount,
} from '../../controllers/users.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/cover-photo', upload.single('coverPhoto'), uploadCoverPhoto);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/account', deleteAccount);
router.post('/verification/request', requestContactVerification);
router.post('/verification/confirm', confirmContactVerification);

export default router;
