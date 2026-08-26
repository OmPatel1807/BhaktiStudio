import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Utility to compute the difference (delta) between two objects.
 * Returns an object containing only the keys that have changed.
 */
export const computeDelta = (prev = {}, next = {}) => {
  const delta = {};
  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  
  for (const key of allKeys) {
    // Skip metadata/auto-generated properties
    if (['updatedAt', 'createdAt', 'id'].includes(key)) continue;

    const prevVal = prev ? prev[key] : undefined;
    const nextVal = next ? next[key] : undefined;

    // Fast comparison for simple values
    if (prevVal === nextVal) continue;

    // Deep equality check helper for values (simple JSON-stringify for nested objects)
    const prevStr = typeof prevVal === 'object' && prevVal !== null ? JSON.stringify(prevVal) : String(prevVal);
    const nextStr = typeof nextVal === 'object' && nextVal !== null ? JSON.stringify(nextVal) : String(nextVal);

    if (prevStr !== nextStr) {
      delta[key] = {
        old: prevVal === undefined ? null : prevVal,
        new: nextVal === undefined ? null : nextVal
      };
    }
  }
  return delta;
};

/**
 * Fully generalized helper to audit log diff changes with user context
 */
export const logGenericDiffEvent = async ({
  req,
  action,
  category = 'SYSTEM',
  orderId = null,
  previous = {},
  updated = {},
  metadata = {}
}) => {
  try {
    const userId = req?.user?.userId || req?.user?.id || null;
    if (!userId) {
      console.warn(`Skipping audit log for action ${action}: user context missing`);
      return;
    }

    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip || '127.0.0.1';

    // Compute dynamic delta diff
    const delta = computeDelta(previous, updated);

    const detailsObj = {
      category,
      ipAddress,
      status: 'SUCCESS',
      previous,
      updated,
      delta,
      metadata: {
        ...metadata,
        actorEmail: req.user?.email || null,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      }
    };

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        orderId: orderId || null,
        action,
        details: JSON.stringify(detailsObj),
      }
    });
  } catch (err) {
    console.error('Failed to write generic diff audit log:', err.message);
  }
};

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
