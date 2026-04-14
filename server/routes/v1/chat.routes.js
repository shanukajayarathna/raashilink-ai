import { Router } from 'express';
import authenticate from '../../middleware/auth.js';
import { sendMessage, sendAssistantMessage, streamMessage, getChatHistory, getConversations, deleteConversation } from '../../controllers/chat.controller.js';

const router = Router();

router.use(authenticate);
router.get('/conversations', getConversations);
router.post('/messages', sendMessage);
router.post('/stream', streamMessage);
router.post('/assistant', sendAssistantMessage);
router.get('/:chatId/history', getChatHistory);
router.delete('/conversations/:convId', deleteConversation);

export default router;
