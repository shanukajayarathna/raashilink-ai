import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getOverview,
  getPendingVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  getUsers,
  getMatches,
  getWeddingProjects,
  getAnalytics,
} from '../../controllers/admin.controller.js';

const router = Router();

router.use(authenticate);
router.get('/overview', getOverview);
router.get('/vendors/pending', getPendingVendors);
router.get('/vendors/:id', getVendorDetail);
router.patch('/vendors/:id/approve', approveVendor);
router.patch('/vendors/:id/reject', rejectVendor);
router.get('/users', getUsers);
router.get('/matches', getMatches);
router.get('/wedding-projects', getWeddingProjects);
router.get('/analytics', getAnalytics);

export default router;
