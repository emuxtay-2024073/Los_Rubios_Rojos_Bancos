import mongoose from 'mongoose';

const reactivateAccountRequestSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, index: true },
    requestedBy: { type: String, required: true, index: true },
    dpi: { type: String, required: true, maxlength: 20 },
    description: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], default: 'PENDING', index: true },
    responseReason: { type: String, default: '', maxlength: 300 },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    requestedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

reactivateAccountRequestSchema.index({ accountId: 1, requestedBy: 1, status: 1 });

export const ReactivateAccountRequest = mongoose.model('ReactivateAccountRequest', reactivateAccountRequestSchema);
