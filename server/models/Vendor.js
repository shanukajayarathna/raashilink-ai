import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const pricingRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, default: 'LKR', maxlength: 10 },
  },
  { _id: false }
);

const ratingsSchema = new Schema(
  {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const availabilityEntrySchema = new Schema(
  {
    date: { type: Date, required: true },
    status: { type: String, enum: ['available', 'booked', 'blocked'], default: 'available' },
  },
  { _id: false }
);

const vendorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true, maxlength: 160 },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Photography', 'Catering', 'Venue', 'Attire', 'Music', 'Decor', 'Planner', 'Travel'],
    },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    serviceArea: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one service area is required',
      },
      default: [],
    },
    pricingRange: { type: pricingRangeSchema, required: true },
    portfolioImages: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => value.every((image) => /^https?:\/\/.+/i.test(image)),
        message: 'Portfolio images must be valid URLs',
      },
    },
    ratings: { type: ratingsSchema, default: () => ({}) },
    reviews: { type: [reviewSchema], default: [] },
    verified: { type: Boolean, default: false, index: true },
    availabilityCalendar: { type: [availabilityEntrySchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

vendorSchema.pre('validate', function validatePricing(next) {
  if (this.pricingRange && this.pricingRange.max < this.pricingRange.min) {
    this.invalidate('pricingRange.max', 'Pricing range max must be greater than or equal to min');
  }
  next();
});

vendorSchema.index({ category: 1, verified: 1 });
vendorSchema.index({ serviceArea: 1, verified: 1, 'ratings.average': -1 });

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

export default Vendor;
