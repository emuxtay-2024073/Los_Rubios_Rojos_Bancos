import { Log } from '../Models/log.model.js';

export const createAuditLog = async ({ userId = null, username = null, email = null, action, entityType = null, entityId = null, ip = null, meta = {} }) => {
  if (!action) return null;

  try {
    return await Log.create({
      userId,
      username,
      email,
      action,
      entityType,
      entityId,
      ip,
      meta,
    });
  } catch (error) {
    console.error('Error creando auditoría:', error.message);
    return null;
  }
};
