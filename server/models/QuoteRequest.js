import mongoose from 'mongoose';

const { Schema } = mongoose;

const budgetRangeSchema = new Schema(
  {
    min: { type: Number, min: 0, default: 0 },
    max: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: 'LKR', maxlength: 10 },
  },
  { _id: false }
);

const quoteRequestDetailsSchema = new Schema(
  {
    eventType: { type: String, trim: true, maxlength: 80, default: 'Wedding' },
    weddingDate: { type: Date },
    guestCount: { type: Number, min: 0, default: 0 },
    location: { type: String, trim: true, maxlength: 160 },
    venueName: { type: String, trim: true, maxlength: 160 },
    preferredPackage: { type: String, trim: true, maxlength: 160 },
    coverageHours: { type: Number, min: 0, default: 0 },
    budgetRange: { type: budgetRangeSchema, default: () => ({}) },
    contactName: { type: String, trim: true, maxlength: 160 },
    contactEmail: { type: String, trim: true, maxlength: 160 },
    contactPhone: { type: String, trim: true, maxlength: 40 },
    preferredContactMethod: {
      type: String,
      enum: ['platform', 'phone', 'email', 'whatsapp'],
      default: 'platform',
    },
    requirements: { type: String, trim: true, maxlength: 4000 },
  },
  { _id: false }
);

const quoteResponseSchema = new Schema(
  {
    price: { type: Number, min: 0, default: 0 },
    packageName: { type: String, trim: true, maxlength: 160 },
    message: { type: String, trim: true, maxlength: 4000 },
    respondedAt: { type: Date },
  },
  { _id: false }
);

const quoteRequestSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'WeddingProject', required: true, index: true },
    category: { type: String, trim: true, maxlength: 80 },
    status: {
      type: String,
      enum: ['new', 'responded', 'accepted', 'declined'],
      default: 'new',
      index: true,
    },
    requestDetails: { type: quoteRequestDetailsSchema, required: true },
    response: { type: quoteResponseSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

quoteRequestSchema.index({ vendorUserId: 1, status: 1, createdAt: -1 });
quoteRequestSchema.index({ requesterUserId: 1, createdAt: -1 });

const QuoteRequest =
  mongoose.models.QuoteRequest || mongoose.model('QuoteRequest', quoteRequestSchema);

export default QuoteRequest;
