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
const MAX_IMAGE_SIZE_BYTES = (6 * 1024 * 1024) - 1;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (file?.mimetype?.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image files are allowed.'));
  },
});

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/cover-photo', upload.single('coverPhoto'), uploadCoverPhoto);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/account', deleteAccount);
router.post('/verification/request', requestContactVerification);
router.post('/verification/confirm', confirmContactVerification);

export default router;
