import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2 && new Set(value.map(String)).size === 2,
        message: 'Conversation must contain exactly two unique participants',
      },
    },
    matchUsers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2 && new Set(value.map(String)).size === 2,
        message: 'Conversation must contain exactly two unique matched users',
      },
    },
    participantKey: { type: String, required: true, unique: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.pre('validate', function setParticipantKey(next) {
  if (Array.isArray(this.participants) && this.participants.length > 0) {
    this.participantKey = this.participants.map((participantId) => String(participantId)).sort().join(':');
  }
  next();
});

conversationSchema.index({ participants: 1 });

const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
