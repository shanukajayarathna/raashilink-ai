const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true, minlength: 8 },
  name:        { type: String, required: true },
  gender:      { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: { type: Date },
  birthTime:   { type: String },
  birthPlace:  { type: String },
  location:    { type: String },
  occupation:  { type: String },
  preferences: { type: Object, default: {} },
  bigFiveVector: { type: [Number], default: [] },
  role:        { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
  isVerified:  { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);