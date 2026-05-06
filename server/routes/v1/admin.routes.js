import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getOverview,
  createAdminUser,
  getPendingVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  updateVendorStatus,
  getUsers,
  deleteUser,
  getMatches,
  getWeddingProjects,
  getAnalytics,
} from '../../controllers/admin.controller.js';

const router = Router();

router.use(authenticate);
router.get('/overview', getOverview);
router.post('/users/admin', createAdminUser);
router.get('/vendors/pending', getPendingVendors);
router.get('/vendors/:id', getVendorDetail);
router.patch('/vendors/:id/approve', approveVendor);
router.patch('/vendors/:id/reject', rejectVendor);
router.patch('/vendors/:id/status', updateVendorStatus);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/matches', getMatches);
router.get('/wedding-projects', getWeddingProjects);
router.get('/analytics', getAnalytics);

export default router;
