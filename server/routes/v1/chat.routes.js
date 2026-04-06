import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { sendMessage, getChatHistory } from '../../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);
router.post('/messages', sendMessage);
router.get('/:chatId/history', getChatHistory);

export default router;
