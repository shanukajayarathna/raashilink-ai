import mongoose from 'mongoose';

const { Schema } = mongoose;

const expenseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    amount: { type: Number, required: true, min: 0 },
    paid: { type: Boolean, default: false },
    dueDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const checklistItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    assignedTo: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const bookedVendorSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    category: { type: String, trim: true, maxlength: 80 },
    quotedAmount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['shortlisted', 'requested', 'booked', 'cancelled'],
      default: 'shortlisted',
    },
  },
  { _id: false }
);

const weddingProjectSchema = new Schema(
  {
    coupleUserIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1 && value.length <= 2,
        message: 'Wedding project must contain one or two linked users',
      },
      required: true,
    },
    weddingDate: { type: Date, required: true, index: true },
    venueId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    totalBudget: { type: Number, required: true, min: 0 },
    expenses: { type: [expenseSchema], default: [] },
    checklist: { type: [checklistItemSchema], default: [] },
    vendors: { type: [bookedVendorSchema], default: [] },
    pendingInvite: {
      inviteeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'declined' },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

weddingProjectSchema.index({ coupleUserIds: 1, weddingDate: 1 });
weddingProjectSchema.index({ venueId: 1, weddingDate: 1 });

const WeddingProject =
  mongoose.models.WeddingProject || mongoose.model('WeddingProject', weddingProjectSchema);

export default WeddingProject;
