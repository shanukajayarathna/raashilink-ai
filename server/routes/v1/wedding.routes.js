import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getProject,
  updateProject,
  addTask,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudget,
  getWeddingVendors,
  requestQuote,
  updateVendorStatus,
  toggleTask,
  invitePartner,
  acceptInvite,
  getPendingInvite,
  resetWedding,
} from '../../controllers/wedding.controller.js';

const router = Router();

router.use(authenticate);
router.get('/project', getProject);
router.put('/project', updateProject);
router.post('/tasks', addTask);
router.patch('/tasks/:index/toggle', toggleTask);
router.post('/expenses', addExpense);
router.patch('/expenses/:index', updateExpense);
router.delete('/expenses/:index', deleteExpense);
router.get('/budget', getBudget);
router.get('/vendors', getWeddingVendors);
router.post('/quotes/request', requestQuote);
router.patch('/vendors/status', updateVendorStatus);
router.post('/couple/invite', invitePartner);
router.post('/couple/accept', acceptInvite);
router.post('/couple/reset', resetWedding);
router.get('/couple/pending-invite', getPendingInvite);

export default router;

