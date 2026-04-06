import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    matchUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ],
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.index({ participants: 1 });

const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
