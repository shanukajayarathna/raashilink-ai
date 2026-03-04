const mongoose = require('mongoose');

const HoroscopeSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  zodiac_sign:{ type: String },
  moon_sign:  { type: String },
  nakshatra:  { type: String },
  ascendant:  { type: Number },
  planetary_positions: { type: Object, default: {} },
  guna_scores:         { type: Object, default: {} },
  calculated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Horoscope', HoroscopeSchema);