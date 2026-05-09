import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';


export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id, read: false })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const unreadCount = notifications.length;

  res.status(200).json({
    success: true,
    data: {
      notifications: notifications.map((n) => ({
        id: String(n._id),
        type: n.type,
        fromUserId: String(n.fromUserId),
        fromUserName: n.fromUserName,
        fromUserProfilePic: n.fromUserProfilePic || null,
        conversationId: n.conversationId ? String(n.conversationId) : null,
        metadata: n.metadata || null,
        preview: (['message_received', 'vendor_quote_request', 'vendor_booking_cancelled'].includes(n.type)) ? (n.metadata?.preview || '') : undefined,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount,
    },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true }
  );
  res.status(200).json({ success: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.status(200).json({ success: true });
});

export default { getNotifications, markRead, markAllRead };
