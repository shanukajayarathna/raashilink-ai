import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { sendMessage, sendAssistantMessage, streamMessage, getChatHistory } from '../../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);
router.post('/messages', sendMessage);
router.post('/stream', streamMessage);
router.post('/assistant', sendAssistantMessage);
router.get('/:chatId/history', getChatHistory);

export default router;
