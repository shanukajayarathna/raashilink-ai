import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  searchVendors,
  getVendorDetail,
  submitQuote,
  getVendorQuoteInbox,
  updateQuoteRequest,
  getVendorReviews,
} from '../../controllers/vendors.controller.js';

const router = Router();

router.use(authenticate);
router.get('/quotes/inbox', getVendorQuoteInbox);
router.patch('/quotes/:id', updateQuoteRequest);
router.get('/search', searchVendors);
router.get('/:id/reviews', getVendorReviews);
router.get('/:id', getVendorDetail);
router.post('/quotes/submit', submitQuote);

export default router;
