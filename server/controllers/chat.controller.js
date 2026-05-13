import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import MatchInterest from '../models/MatchInterest.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../lib/socket.js';
import assistantService from '../services/assistant.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { detectChatLanguage } from '../utils/languageDetect.js';

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

async function isMutualMatch(userId, recipientId) {
  const mutual = await MatchInterest.findOne({
    $or: [
      { fromUser: userId, toUser: recipientId, status: 'mutual' },
      { fromUser: recipientId, toUser: userId, status: 'mutual' },
    ],
  }).lean();

  return Boolean(mutual);
}

function resolveWhoCanMessage(recipient) {
  return recipient?.privacySettings?.whoCanMessage || 'Matches Only';
}

async function ensureMessagingAllowed(senderId, recipient) {
  const policy = resolveWhoCanMessage(recipient);

  if (policy === 'No One') {
    throw new ApiError(403, 'This user is not accepting new messages');
  }

  if (policy === 'Matches Only') {
    const mutual = await isMutualMatch(senderId, recipient._id);
    if (!mutual) {
      throw new ApiError(403, 'Messaging unlocks only after a mutual match');
    }
  }
}

async function findOrCreateConversation(userId, recipientId) {
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

async function findMutualConversation(userId, recipientId) {
  const mutual = await isMutualMatch(userId, recipientId);
  if (!mutual) {
    throw new ApiError(403, 'Messaging unlocks only after a mutual match');
  }

  return findOrCreateConversation(userId, recipientId);
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

  await ensureMessagingAllowed(req.user._id, recipient);

  const conversation = await findOrCreateConversation(req.user._id, recipientId);

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user._id,
    receiverId: recipientId,
    content: content.trim(),
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  const sender = await User.findById(req.user._id)
    .select('personalInfo.firstName personalInfo.lastName personalInfo.profilePic name profilePic')
    .lean();
  const senderName =
    [sender?.personalInfo?.firstName, sender?.personalInfo?.lastName].filter(Boolean).join(' ') ||
    sender?.name ||
    'Someone';
  const senderProfilePic = sender?.personalInfo?.profilePic || sender?.profilePic || null;

  // Emit real-time message event to both parties for live chat updates
  const messagePayload = {
    id: String(message._id),
    conversationId: String(conversation._id),
    senderId: String(req.user._id),
    receiverId: String(recipientId),
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };

  // Emit to recipient so they see the message appear in real-time
  emitToUser(recipientId, 'message_sent', messagePayload);
  
  // Emit to sender so they can confirm message delivery (replace optimistic message)
  emitToUser(req.user._id, 'message_sent', messagePayload);

  // Create notification (separate from real-time message event)
  try {
    const notification = await Notification.create({
      userId: recipientId,
      type: 'message_received',
      fromUserId: req.user._id,
      fromUserName: senderName,
      fromUserProfilePic: senderProfilePic,
      conversationId: conversation._id,
      metadata: {
        preview: message.content,
        messageId: String(message._id),
      },
    });

    emitToUser(recipientId, 'notification', {
      id: String(notification._id),
      type: notification.type,
      fromUserId: String(req.user._id),
      fromUserName: senderName,
      fromUserProfilePic: senderProfilePic,
      conversationId: String(conversation._id),
      metadata: notification.metadata || null,
      read: false,
      createdAt: notification.createdAt,
      preview: message.content,
    });
  } catch {
    // Notification failure should never block chat message delivery.
  }

  res.status(201).json({
    success: true,
    data: {
      conversationId: String(conversation._id),
      message: {
        id: String(message._id),
        senderId: String(message.senderId),
        receiverId: String(message.receiverId),
        content: message.content,
        createdAt: message.createdAt,
      },
    },
  });
});

export const sendAssistantMessage = asyncHandler(async (req, res) => {
  const { message, language, history = [] } = req.body ?? {};

  if (!message || !String(message).trim()) {
    throw new ApiError(400, 'Message content is required');
  }

  const user = await User.findById(req.user._id).lean();
  if (!user) {
    throw new ApiError(404, 'Authenticated user not found');
  }

  const resolvedLanguage = detectChatLanguage({ message, requestedLanguage: language });

  const reply = await assistantService.generateAssistantReply({
    user,
    message: String(message).trim(),
    language: resolvedLanguage,
    history: Array.isArray(history) ? history : [],
  });

  res.status(200).json({
    success: true,
    data: {
      reply,
    },
  });
});

export const streamMessage = asyncHandler(async (req, res) => {
  const { message, language, history = [] } = req.body ?? {};

  // Validate input
  if (!message || String(message).trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  if (String(message).length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message must be under 1000 characters'
    });
  }

  const user = await User.findById(req.user._id).lean();
  if (!user) {
    if (!res.headersSent) {
      return res.status(404).json({
        success: false,
        message: 'Authenticated user not found'
      });
    }
    return res.end();
  }

  // Call streaming chat
  try {
    const resolvedLanguage = detectChatLanguage({ message, requestedLanguage: language });
    await assistantService.streamChat({
      user,
      history,
      userMessage: String(message).trim(),
      language: resolvedLanguage,
      res,
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Stream error: ' + error.message
      });
    }
  }
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

  const hiddenEntry = (conversation.hiddenFor || []).find(
    (entry) => String(entry.userId) === String(req.user._id)
  );

  const messagesQuery = { conversationId: req.params.chatId };
  if (hiddenEntry?.clearedAt) {
    messagesQuery.createdAt = { $gt: new Date(hiddenEntry.clearedAt) };
  }

  const messages = await Message.find(messagesQuery)
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

export const getConversations = asyncHandler(async (req, res) => {
  const allConversations = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .limit(20)
    .lean();

  const pairs = allConversations
    .map((conversation) => {
      const otherUserId = (conversation.participants || [])
        .find((participantId) => String(participantId) !== String(req.user._id));
      return otherUserId ? { conversation, otherUserId: String(otherUserId) } : null;
    })
    .filter(Boolean);

  const conversations = pairs.map((pair) => pair.conversation);

  const otherUserIds = [...new Set(
    conversations.flatMap((conversation) =>
      (conversation.participants || [])
        .filter((participantId) => String(participantId) !== String(req.user._id))
        .map((participantId) => String(participantId))
    )
  )];

  const users = otherUserIds.length > 0
    ? await User.find({ _id: { $in: otherUserIds } })
        .select('personalInfo.firstName personalInfo.lastName personalInfo.profilePic personalInfo.photos')
        .lean()
    : [];

  const userNameMap = new Map(
    users.map((user) => [
      String(user._id),
      [user.personalInfo?.firstName, user.personalInfo?.lastName].filter(Boolean).join(' ').trim() || 'Conversation',
    ])
  );

  const userImgMap = new Map(
    users.map((user) => {
      const photos = Array.isArray(user.personalInfo?.photos) ? user.personalInfo.photos : [];
      const mainPhoto = photos.find((p) => p?.isMain)?.url || photos[0]?.url || null;
      const img = user.personalInfo?.profilePic || mainPhoto || null;
      return [String(user._id), img];
    })
  );

  const rawItems = await Promise.all(
    conversations.map(async (conversation) => {
      const lastMessage = await Message.findOne({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .lean();

      const hiddenEntry = (conversation.hiddenFor || []).find(
        (entry) => String(entry.userId) === String(req.user._id)
      );
      if (hiddenEntry?.clearedAt && (!lastMessage || new Date(lastMessage.createdAt) <= new Date(hiddenEntry.clearedAt))) {
        return null;
      }

      const title = (conversation.participants || [])
        .filter((participantId) => String(participantId) !== String(req.user._id))
        .map((participantId) => userNameMap.get(String(participantId)) || 'Conversation')
        .join(', ') || 'Recent conversation';

      const otherUserId = (conversation.participants || [])
        .find((participantId) => String(participantId) !== String(req.user._id));

      return {
        id: String(conversation._id),
        title,
        otherUserId: otherUserId ? String(otherUserId) : null,
        img: otherUserId ? (userImgMap.get(String(otherUserId)) || null) : null,
        date: conversation.lastMessageAt
          ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(conversation.lastMessageAt))
          : 'Recently',
        preview: lastMessage?.content || 'No messages yet',
        lastSenderId: lastMessage ? String(lastMessage.senderId) : null,
      };
    })
  );

  const items = rawItems.filter(Boolean);

  res.status(200).json({
    success: true,
    data: {
      items,
    },
  });
});

/**
 * GET-or-CREATE conversation with a user based on recipient privacy policy.
 * Safe to call multiple times — never creates duplicates.
 */
export const openConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body ?? {};
  ensureObjectId(userId, 'userId');

  if (String(req.user._id) === String(userId)) {
    throw new ApiError(400, 'Cannot open conversation with yourself');
  }

  const recipient = await User.findById(userId)
    .select('privacySettings.whoCanMessage personalInfo.firstName personalInfo.lastName personalInfo.profilePic personalInfo.photos')
    .lean();
  if (!recipient) {
    throw new ApiError(404, 'Recipient not found');
  }

  await ensureMessagingAllowed(req.user._id, recipient);
  const conversation = await findOrCreateConversation(req.user._id, userId);

  const hiddenEntry = (conversation.hiddenFor || []).find(
    (entry) => String(entry.userId) === String(req.user._id)
  );

  const title =
    [recipient?.personalInfo?.firstName, recipient?.personalInfo?.lastName]
      .filter(Boolean)
      .join(' ') || 'Conversation';
  const partnerPhotos = Array.isArray(recipient?.personalInfo?.photos) ? recipient.personalInfo.photos : [];
  const partnerMainPhoto = partnerPhotos.find((p) => p?.isMain)?.url || partnerPhotos[0]?.url || null;
  const partnerImg = recipient?.personalInfo?.profilePic || partnerMainPhoto || null;

  const lastMessage = await Message.findOne({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .lean();

  const visibleLastMessage = hiddenEntry?.clearedAt && lastMessage && new Date(lastMessage.createdAt) <= new Date(hiddenEntry.clearedAt)
    ? null
    : lastMessage;

  res.status(200).json({
    success: true,
    data: {
      conversation: {
        id: String(conversation._id),
        title,
        otherUserId: String(userId),
        img: partnerImg,
        date: conversation.lastMessageAt
          ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
              new Date(conversation.lastMessageAt)
            )
          : 'Now',
        preview: visibleLastMessage?.content || 'Start the conversation!',
        lastSenderId: visibleLastMessage ? String(visibleLastMessage.senderId) : null,
      },
    },
  });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const { convId } = req.params;
  ensureObjectId(convId, 'convId');

  // Only allow participants of this conversation to delete it
  const conversation = await Conversation.findOne({
    _id: convId,
    participants: req.user._id,
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  // User-specific clear: hide existing messages only for this user.
  const now = new Date();
  const existing = (conversation.hiddenFor || []).find(
    (entry) => String(entry.userId) === String(req.user._id)
  );

  if (existing) {
    existing.clearedAt = now;
  } else {
    conversation.hiddenFor.push({ userId: req.user._id, clearedAt: now });
  }

  await conversation.save();

  res.status(200).json({ success: true });
});

export default {
  sendMessage,
  sendAssistantMessage,
  streamMessage,
  getChatHistory,
  getConversations,
  openConversation,
};
