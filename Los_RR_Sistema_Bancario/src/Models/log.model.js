import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userId: {
    type: String,
    index: true,
    default: null,
  },
  username: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  entityType: {
    type: String,
    default: null,
  },
  entityId: {
    type: String,
    default: null,
    index: true,
  },
  ip: {
    type: String,
    default: null,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

logSchema.index({ action: 1, userId: 1, createdAt: -1 });

export const Log = mongoose.model('Log', logSchema);
