const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business_name:   { type: String, required: true },
  category:        { type: String, enum: ['decorator','caterer','photographer','makeup','florist','venue','entertainment'] },
  service_area:    [String],
  pricing_range:   { min: Number, max: Number },
  portfolio_images:[String],
  ratings:         { type: Number, default: 0 },
  reviews:         [{ user_id: mongoose.Schema.Types.ObjectId, comment: String, rating: Number, date: Date }],
  verified:        { type: Boolean, default: false },
  created_at:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', VendorSchema);