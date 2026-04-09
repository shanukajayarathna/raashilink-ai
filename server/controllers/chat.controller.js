import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import MatchInterest from '../models/MatchInterest.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import assistantService from '../services/assistant.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

async function findMutualConversation(userId, recipientId) {
  const mutual = await MatchInterest.findOne({
    $or: [
      { fromUser: userId, toUser: recipientId, status: 'mutual' },
      { fromUser: recipientId, toUser: userId, status: 'mutual' },
    ],
  });

  if (!mutual) {
    throw new ApiError(403, 'Messaging unlocks only after a mutual match');
  }

  let conversation = await Conversation.findOne({
    matchUsers: { $all: [userId, recipientId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipientId],
      matchUsers: [userId, recipientId],
      lastMessageAt: new Date(),
    });
  }

  return conversation;
}

export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, content } = req.body ?? {};

  ensureObjectId(recipientId, 'recipientId');

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Message content is required');
  }

  const recipient = await User.findById(recipientId).lean();
  if (!recipient) {
    throw new ApiError(404, 'Recipient not found');
  }

  const conversation = await findMutualConversation(req.user._id, recipientId);

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user._id,
    receiverId: recipientId,
    content: content.trim(),
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  res.status(201).json({
    success: true,
    data: {
      conversationId: String(conversation._id),
      message: {
        id: String(message._id),
        content: message.content,
        createdAt: message.createdAt,
      },
    },
  });
});

export const sendAssistantMessage = asyncHandler(async (req, res) => {
  const { message, language = 'en' } = req.body ?? {};

  if (!message || !String(message).trim()) {
    throw new ApiError(400, 'Message content is required');
  }

  const user = await User.findById(req.user._id).lean();
  if (!user) {
    throw new ApiError(404, 'Authenticated user not found');
  }

  const reply = await assistantService.generateAssistantReply({
    user,
    message: String(message).trim(),
    language,
  });

  res.status(200).json({
    success: true,
    data: {
      reply,
    },
  });
});

export const getChatHistory = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.chatId, 'chatId');

  const conversation = await Conversation.findById(req.params.chatId).lean();
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const isParticipant = conversation.participants.some(
    (participantId) => String(participantId) === String(req.user._id)
  );

  if (!isParticipant) {
    throw new ApiError(403, 'You cannot access this conversation');
  }

  const messages = await Message.find({ conversationId: req.params.chatId })
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      conversationId: req.params.chatId,
      messages: messages.map((message) => ({
        id: String(message._id),
        senderId: String(message.senderId),
        recipientId: String(message.receiverId),
        content: message.content,
        createdAt: message.createdAt,
      })),
    },
  });
});

export default {
  sendMessage,
  getChatHistory,
};
