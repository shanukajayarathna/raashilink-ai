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
    gana: { type: String, trim: true, maxlength: 20 },
    nakshatraPada: { type: Number, min: 1, max: 4 },
    ascendant: { type: String, required: true, trim: true, maxlength: 30 },
    ascendantDegree: { type: Number, min: 0, max: 360 },
    tithi: { type: String, trim: true, maxlength: 40 },
    paksha: { type: String, trim: true, maxlength: 40 },
    yoga: { type: String, trim: true, maxlength: 40 },
    karana: { type: String, trim: true, maxlength: 40 },
    vedicDay: { type: String, trim: true, maxlength: 20 },
    ayanamsa: { type: String, trim: true, maxlength: 40, default: 'Lahiri' },
    planetaryPositions: {
      type: [planetaryPositionSchema],
      validate: {
        validator: (positions) => Array.isArray(positions) && positions.length > 0,
        message: 'At least one planetary position is required',
      },
      default: [],
    },
    gunaScore: { type: Number, min: 0, max: 36, default: 0 },
    luckyColors: [{ type: String, trim: true }],
    auspiciousDays: [{ type: String, trim: true }],
    favorablePartners: [{ type: String, trim: true }],
    profileFacts: [{ type: String, trim: true }],
    dasaInfo: { type: Schema.Types.Mixed, default: null },
    antardasha: { type: Schema.Types.Mixed, default: null },
    kalaSarpaDosha: { type: Schema.Types.Mixed, default: null },
    manglik: { type: Schema.Types.Mixed, default: null },
    seventhHouseAnalysis: { type: Schema.Types.Mixed, default: null },
    sadeSati: { type: Schema.Types.Mixed, default: null },
    venusSummary: { type: Schema.Types.Mixed, default: null },
    jupiterSummary: { type: Schema.Types.Mixed, default: null },
    ascendantNavamsha: { type: String, trim: true },
    rajju: { type: String, trim: true },
    nadi: { type: String, trim: true },
    yoni: { type: String, trim: true },
    rasiLord: { type: String, trim: true },
    marriageWindow: { type: [Schema.Types.Mixed], default: [] },
    chartGrade: { type: Schema.Types.Mixed, default: null },
    generatedFrom: { type: Schema.Types.Mixed, default: null },
    generatedAt: { type: Date, default: null },
    timezone: { type: String, trim: true, default: 'Asia/Colombo' },
    calculationVersion: { type: Number, default: 1 },
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
