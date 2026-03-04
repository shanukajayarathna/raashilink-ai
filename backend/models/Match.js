const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  user_a_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_b_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  compatibility_score: { type: Number, required: true },
  dimension_scores: {
    astrological: Number,
    personality:  Number,
    lifestyle:    Number,
    familyValues: Number
  },
  band:            { type: String, enum: ['Excellent', 'Good', 'Moderate', 'Low'] },
  mutual_interest: { type: Boolean, default: false },
  created_at:      { type: Date, default: Date.now }
});

MatchSchema.index({ user_a_id: 1, compatibility_score: -1 });
MatchSchema.index({ user_b_id: 1, compatibility_score: -1 });

module.exports = mongoose.model('Match', MatchSchema);