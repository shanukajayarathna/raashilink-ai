import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  searchVendors,
  getVendorDetail,
  submitQuote,
  getVendorReviews,
} from '../../controllers/vendors.controller.js';

const router = Router();

router.use(authenticate);
router.get('/search', searchVendors);
router.get('/:id/reviews', getVendorReviews);
router.get('/:id', getVendorDetail);
router.post('/quotes/submit', submitQuote);

export default router;
