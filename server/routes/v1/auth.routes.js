import { Router } from 'express';
import vendorDocumentsUpload from '../../middleware/vendorDocumentsUpload.js';
import {
  checkAvailability,
  getBirthPlaceSuggestions,
  requestRegistrationOtp,
  verifyOTP,
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleAuth,
} from '../../controllers/auth.controller.js';

const router = Router();

router.post('/check-availability', checkAvailability);
router.get('/birth-place-suggestions', getBirthPlaceSuggestions);
router.post('/request-registration-otp', requestRegistrationOtp);
router.post('/verify-otp', verifyOTP);
router.post('/register', vendorDocumentsUpload.array('vendorDocuments', 10), register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', ...refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);

export default router;
