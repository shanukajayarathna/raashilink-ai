import express from 'express';
import { getNotifications, markRead, markAllRead } from '../../controllers/notifications.controller.js';
import authenticate from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
