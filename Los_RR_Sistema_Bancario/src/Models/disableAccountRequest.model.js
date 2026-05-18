import mongoose from 'mongoose';

const disableAccountRequestSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    requestedBy: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 300,
    },
    additionalInfo: {
      type: String,
      default: '',
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    responseReason: {
      type: String,
      default: '',
      maxlength: 300,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

disableAccountRequestSchema.index({ accountId: 1, requestedBy: 1, status: 1 });

export const DisableAccountRequest = mongoose.model(
  'DisableAccountRequest',
  disableAccountRequestSchema,
);
