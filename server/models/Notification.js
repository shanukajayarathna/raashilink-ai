import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['interest_received', 'mutual_match', 'message_received', 'interest_accepted', 'interest_declined', 'wedding_invite', 'wedding_accepted', 'wedding_planning_unlocked', 'wedding_cancelled', 'match_removed'],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fromUserName: {
      type: String,
      required: true,
    },
    fromUserProfilePic: {
      type: String,
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
