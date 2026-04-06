import mongoose from 'mongoose';

const matchInterestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'mutual'], default: 'pending' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

matchInterestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

const MatchInterest =
  mongoose.models.MatchInterest || mongoose.model('MatchInterest', matchInterestSchema);

export default MatchInterest;
