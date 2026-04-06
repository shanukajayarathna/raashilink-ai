import mongoose from 'mongoose';

const { Schema } = mongoose;

const dimensionScoresSchema = new Schema(
  {
    astro: { type: Number, required: true, min: 0, max: 100 },
    personality: { type: Number, required: true, min: 0, max: 100 },
    lifestyle: { type: Number, required: true, min: 0, max: 100 },
    family: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const matchSchema = new Schema(
  {
    userAId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userBId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    compatibilityScore: { type: Number, required: true, min: 0, max: 100, index: true },
    dimensionScores: { type: dimensionScoresSchema, required: true },
    mutualInterest: { type: Boolean, default: false, index: true },
    explanation: { type: String, trim: true, maxlength: 4000 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

matchSchema.index({ userAId: 1, userBId: 1 }, { unique: true });
matchSchema.index({ userAId: 1, mutualInterest: 1, compatibilityScore: -1 });
matchSchema.index({ userBId: 1, mutualInterest: 1, compatibilityScore: -1 });

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

export default Match;
