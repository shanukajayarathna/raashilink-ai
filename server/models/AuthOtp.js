import mongoose from 'mongoose';

const { Schema } = mongoose;

const authOtpSchema = new Schema(
  {
    identifier: { type: String, required: true, trim: true, index: true },
    channel: { type: String, enum: ['email', 'phone'], required: true },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset', 'email_verification', 'phone_verification'],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

authOtpSchema.index({ identifier: 1, purpose: 1 }, { unique: true });
authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthOtp = mongoose.models.AuthOtp || mongoose.model('AuthOtp', authOtpSchema);

export default AuthOtp;
