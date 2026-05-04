import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  searchVendors,
  getVendorDetail,
  submitQuote,
  getVendorQuoteInbox,
  updateQuoteRequest,
  getVendorReviews,
  getVendorProfile,
  updateVendorProfile,
  uploadPortfolioImages,
  removePortfolioImage,
  portfolioUpload,
} from '../../controllers/vendors.controller.js';

const router = Router();

router.use(authenticate);
router.get('/profile', getVendorProfile);
router.patch('/profile', updateVendorProfile);
router.get('/quotes/inbox', getVendorQuoteInbox);
router.patch('/quotes/:id', updateQuoteRequest);
router.post('/portfolio/upload', portfolioUpload.array('images', 20), uploadPortfolioImages);
router.delete('/portfolio/image', removePortfolioImage);
router.get('/search', searchVendors);
router.get('/:id/reviews', getVendorReviews);
router.get('/:id', getVendorDetail);
router.post('/quotes/submit', submitQuote);

export default router;
