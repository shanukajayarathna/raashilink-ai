import mongoose from 'mongoose';

const { Schema } = mongoose;

const planetaryPositionSchema = new Schema(
  {
    planet: {
      type: String,
      required: true,
      enum: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'],
    },
    sign: { type: String, required: true, trim: true, maxlength: 30 },
    house: { type: Number, required: true, min: 1, max: 12 },
    degree: { type: Number, required: true, min: 0, max: 360 },
  },
  { _id: false }
);

const horoscopeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    zodiacSign: { type: String, required: true, trim: true, maxlength: 30 },
    rashi: { type: String, required: true, trim: true, maxlength: 30 },
    nakshatra: { type: String, required: true, trim: true, maxlength: 30 },
    ascendant: { type: String, required: true, trim: true, maxlength: 30 },
    planetaryPositions: {
      type: [planetaryPositionSchema],
      validate: {
        validator: (positions) => Array.isArray(positions) && positions.length > 0,
        message: 'At least one planetary position is required',
      },
      default: [],
    },
    gunaScore: { type: Number, min: 0, max: 36, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

horoscopeSchema.index({ rashi: 1, nakshatra: 1 });
horoscopeSchema.index({ zodiacSign: 1, ascendant: 1 });

const Horoscope = mongoose.models.Horoscope || mongoose.model('Horoscope', horoscopeSchema);

export default Horoscope;
