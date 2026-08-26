import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/v1/audit-logs
 * ADMIN ONLY: Searchable, filterable audit log inspector
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, search, limit = 50, page = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { actor: { name: { contains: search, mode: 'insensitive' } } },
        { actor: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
          order: { select: { id: true, orderNumber: true, eventType: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const mappedLogs = logs.map(log => ({
      ...log,
      user: log.actor
    }));

    return res.json({
      success: true,
      data: {
        logs: mappedLogs,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
