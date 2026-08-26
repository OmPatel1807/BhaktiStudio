import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safely writes an immutable audit record to the database AuditLog model
 */
export const logAuditEvent = async ({
  userId,
  actorId,
  orderId = null,
  action,
  category = 'SYSTEM',
  details = {},
  ipAddress = '127.0.0.1',
  status = 'SUCCESS'
}) => {
  try {
    const finalActorId = actorId || userId;
    if (!finalActorId) {
      console.warn('Skipping audit log: actorId/userId is missing');
      return;
    }

    const detailsObj = {
      category,
      ipAddress,
      status,
      ...(typeof details === 'object' ? details : { message: String(details) })
    };

    await prisma.auditLog.create({
      data: {
        actorId: finalActorId,
        orderId: orderId || null,
        action,
        details: JSON.stringify(detailsObj),
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};
