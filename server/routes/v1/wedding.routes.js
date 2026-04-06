import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import {
  getProject,
  updateProject,
  addTask,
  addExpense,
  getBudget,
  getWeddingVendors,
  requestQuote,
} from '../../controllers/wedding.controller.js';

const router = Router();

router.use(authenticate);
router.get('/project', getProject);
router.put('/project', updateProject);
router.post('/tasks', addTask);
router.post('/expenses', addExpense);
router.get('/budget', getBudget);
router.get('/vendors', getWeddingVendors);
router.post('/quotes/request', requestQuote);

export default router;
