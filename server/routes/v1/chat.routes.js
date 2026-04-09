import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { sendMessage, sendAssistantMessage, getChatHistory } from '../../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);
router.post('/messages', sendMessage);
router.post('/assistant', sendAssistantMessage);
router.get('/:chatId/history', getChatHistory);

export default router;
