const mongoose = require('mongoose');

const WeddingProjectSchema = new mongoose.Schema({
  couple_user_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  wedding_date:    { type: Date },
  venue_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  total_budget:    { type: Number, required: true },
  expenses: [{
    category:    String,
    vendor_id:   mongoose.Schema.Types.ObjectId,
    amount:      Number,
    description: String,
    date:        { type: Date, default: Date.now }
  }],
  checklist: [{
    task:      String,
    due_date:  Date,
    completed: { type: Boolean, default: false }
  }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeddingProject', WeddingProjectSchema);