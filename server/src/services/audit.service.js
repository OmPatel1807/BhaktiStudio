import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  /**
   * Mask sensitive keys in objects before writing to AuditLog
   */
  static maskSensitive(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = JSON.parse(JSON.stringify(obj));

    const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'signature', 'creditCard'];

    const traverse = (item) => {
      if (!item || typeof item !== 'object') return;
      Object.keys(item).forEach((key) => {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          item[key] = '***[REDACTED_SENSITIVE_DATA]***';
        } else if (typeof item[key] === 'object') {
          traverse(item[key]);
        }
      });
    };

    traverse(sanitized);
    return sanitized;
  }

  /**
   * Record structured security audit log in PostgreSQL
   * @param {Object} params
   * @param {string} [params.orderId]
   * @param {string} params.userId
   * @param {string} params.action
   * @param {Object} [params.oldValue]
   * @param {Object} [params.newValue]
   * @param {string} [params.ipAddress]
   */
  static async logEvent({ orderId, userId, action, oldValue, newValue, ipAddress = '127.0.0.1' }) {
    try {
      const maskedOld = AuditService.maskSensitive(oldValue);
      const maskedNew = AuditService.maskSensitive(newValue);

      return await prisma.auditLog.create({
        data: {
          ...(orderId && { orderId }),
          userId,
          action,
          oldValue: maskedOld ? maskedOld : undefined,
          newValue: {
            ...((maskedNew && typeof maskedNew === 'object') ? maskedNew : { value: maskedNew }),
            ipAddress,
          },
        },
      });
    } catch (err) {
      console.error('[AuditService Error]: Failed to persist audit log:', err.message);
    }
  }
}
