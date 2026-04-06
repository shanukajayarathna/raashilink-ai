import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, alias: 'recipientId' },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    timestamp: { type: Date, default: Date.now, index: true },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, read: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, timestamp: -1 });

messageSchema.pre('save', function syncTimestamp(next) {
  if (!this.timestamp) {
    this.timestamp = this.createdAt || new Date();
  }
  next();
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
