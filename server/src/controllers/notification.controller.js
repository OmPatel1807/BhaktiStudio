import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/v1/notifications
 * Get authenticated user's notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await prisma.auditLog.findMany({
      where: {
        userId,
        action: { startsWith: 'NOTIFICATION_' },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.newValue?.title || n.action,
      message: n.newValue?.message || '',
      actionUrl: n.newValue?.actionUrl || '#',
      isRead: Boolean(n.newValue?.isRead),
      createdAt: n.createdAt,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await prisma.auditLog.findUnique({ where: { id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });

    const updated = await prisma.auditLog.update({
      where: { id },
      data: {
        newValue: {
          ...notif.newValue,
          isRead: true,
        },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all user notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userNotifs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: { startsWith: 'NOTIFICATION_' },
      },
    });

    for (const n of userNotifs) {
      await prisma.auditLog.update({
        where: { id: n.id },
        data: {
          newValue: {
            ...n.newValue,
            isRead: true,
          },
        },
      });
    }

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
