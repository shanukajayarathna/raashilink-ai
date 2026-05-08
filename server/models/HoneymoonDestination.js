import mongoose from 'mongoose';

const { Schema } = mongoose;

const honeymoonDestinationSchema = new Schema(
  {
    country: { type: String, required: true, trim: true, maxlength: 120, index: true },
    region: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    activityTags: { type: [String], default: [], index: true },
    budgetTier: { type: String, required: true, enum: ['budget', 'mid-range', 'luxury'], index: true },
    bestSeason: { type: String, required: true, trim: true, maxlength: 80 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => value.every((image) => /^https?:\/\/.+/i.test(image)),
        message: 'Images must be valid URLs',
      },
    },
    highlights: { type: [String], default: [] },
    contact: {
      name: { type: String, trim: true, maxlength: 160 },
      phone: { type: String, trim: true, maxlength: 60 },
      email: { type: String, trim: true, maxlength: 160 },
      website: {
        type: String,
        trim: true,
        maxlength: 300,
        validate: {
          validator: (value) => !value || /^https?:\/\/.+/i.test(value),
          message: 'Website must be a valid URL',
        },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

honeymoonDestinationSchema.index({ country: 1, region: 1 }, { unique: true });
honeymoonDestinationSchema.index({ budgetTier: 1, activityTags: 1 });

const HoneymoonDestination =
  mongoose.models.HoneymoonDestination ||
  mongoose.model('HoneymoonDestination', honeymoonDestinationSchema);

export default HoneymoonDestination;
