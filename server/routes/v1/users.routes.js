import { Router } from 'express';
import multer from 'multer';
import authenticate from '../../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  uploadCoverPhoto,
  removeCoverPhoto,
  uploadProfilePhoto,
  removeProfilePhoto,
  uploadGalleryPhoto,
  removeGalleryPhoto,
  requestContactVerification,
  confirmContactVerification,
  exportUserData,
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
router.delete('/profile/cover-photo', removeCoverPhoto);
router.post('/profile/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/profile/photo', removeProfilePhoto);
router.post('/profile/photos', upload.single('photo'), uploadGalleryPhoto);
router.delete('/profile/photos/:photoId', removeGalleryPhoto);
router.get('/export', exportUserData);
router.delete('/account', deleteAccount);
router.post('/verification/request', requestContactVerification);
router.post('/verification/confirm', confirmContactVerification);

export default router;
