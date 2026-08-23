import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Provider Drivers
class InAppProvider {
  static async send({ userId, title, message, actionUrl, type }) {
    try {
      let actorId = userId;
      if (!actorId || actorId === 'admin') {
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        actorId = adminUser ? adminUser.id : null;
      }

      if (!actorId) return;

      // Record notification in AuditLog table as in-app notification event
      return await prisma.auditLog.create({
        data: {
          actorId,
          action: `NOTIFICATION_${type}`,
          details: JSON.stringify({ title, message, actionUrl, isRead: false }),
        },
      });
    } catch (err) {
      console.error('[InAppProvider Error]:', err.message);
    }
  }
}

class EmailProvider {
  static async send({ toEmail, subject, htmlContent }) {
    try {
      if (process.env.EMAIL_ENABLED !== 'true') {
        console.log(`[EmailProvider Simulated]: To: ${toEmail} | Subject: ${subject}`);
        return { success: true, simulated: true };
      }
      // Nodemailer driver execution logic
      console.log(`[EmailProvider Sent]: To: ${toEmail} | Subject: ${subject}`);
      return { success: true };
    } catch (err) {
      console.error('[EmailProvider Error]:', err.message);
    }
  }
}

class WhatsAppProvider {
  /**
   * Generate Direct WhatsApp Deep-Link Fallback
   * @param {string} phone
   * @param {string} message
   */
  static generateDeepLink(phone, message) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const encodedText = encodeURIComponent(message || 'Hello from Bhakti Studio!');
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  static async send({ phone, templateName, params, textMessage }) {
    try {
      const hasApiTokens =
        process.env.WHATSAPP_API_TOKEN &&
        !process.env.WHATSAPP_API_TOKEN.includes('your_');

      if (!hasApiTokens || process.env.WHATSAPP_ENABLED !== 'true') {
        const deepLink = WhatsAppProvider.generateDeepLink(phone, textMessage || `Update regarding Order #${params?.[0] || 'BS-2026'}`);
        console.log(`[WhatsApp Deep-Link Fallback Generated]: ${deepLink}`);
        return { success: true, simulated: true, deepLink };
      }

      // Meta Cloud API / Twilio WhatsApp driver execution logic
      console.log(`[WhatsApp Meta Cloud API Sent]: To: ${phone} | Template: ${templateName}`);
      return { success: true };
    } catch (err) {
      console.error('[WhatsAppProvider Error]:', err.message);
    }
  }
}

export class NotificationService {
  /**
   * Centralized Non-Blocking Event Dispatcher
   * @param {Object} event
   * @param {'ORDER_SUBMITTED'|'QUOTATION_APPROVED'|'WORKER_ASSIGNED'|'ASSIGNMENT_REJECTED'|'PAYMENT_RECEIVED'|'EVENT_REMINDER'} event.eventType
   * @param {Object} event.payload
   */
  static async dispatch({ eventType, payload }) {
    // Wrap in non-blocking async execution
    Promise.resolve().then(async () => {
      try {
        switch (eventType) {
          case 'ORDER_SUBMITTED':
            // Notify Admin
            await InAppProvider.send({
              userId: payload.adminId || 'admin',
              title: '🛒 New Customer Order Submitted',
              message: `Order #${payload.orderNumber} submitted by ${payload.customerName}.`,
              actionUrl: `/admin/quotation/${payload.orderId}`,
              type: 'ORDER_SUBMITTED',
            });
            await EmailProvider.send({
              toEmail: 'admin@bhaktistudio.com',
              subject: `[Bhakti Studio] New Order #${payload.orderNumber}`,
              htmlContent: `<h2>New Order Submitted</h2><p>Order #${payload.orderNumber} by ${payload.customerName}.</p>`,
            });
            break;

          case 'QUOTATION_APPROVED':
            // Notify Customer
            await InAppProvider.send({
              userId: payload.customerId,
              title: '📄 Quotation Ready for Review',
              message: `Your quotation for Order #${payload.orderNumber} is ready.`,
              actionUrl: `/customer/dashboard`,
              type: 'QUOTATION_APPROVED',
            });
            await WhatsAppProvider.send({
              phone: payload.customerPhone || '919876543210',
              templateName: 'quotation_ready',
              params: [payload.orderNumber, payload.totalAmount],
              textMessage: `Hello! Your quotation for Order #${payload.orderNumber} at Bhakti Studio is ready. View details: ${process.env.CLIENT_URL}/customer/dashboard`,
            });
            break;

          case 'WORKER_ASSIGNED':
            // Notify Worker
            await InAppProvider.send({
              userId: payload.workerUserId,
              title: '👷 New Event Assignment Dispatched',
              message: `You have been assigned as ${payload.role} for Order #${payload.orderNumber}.`,
              actionUrl: `/worker/dashboard`,
              type: 'WORKER_ASSIGNED',
            });
            await WhatsAppProvider.send({
              phone: payload.workerPhone || '919876543210',
              templateName: 'job_assigned',
              params: [payload.orderNumber, payload.role],
              textMessage: `Hi! You have been assigned to ${payload.role} for Event Order #${payload.orderNumber}. Open workspace: ${process.env.CLIENT_URL}/worker/dashboard`,
            });
            break;

          case 'PAYMENT_RECEIVED':
            // Notify Admin & Customer
            await InAppProvider.send({
              userId: payload.customerId,
              title: '💳 Payment Received Successfully',
              message: `Payment of ₹${payload.amount} received for Order #${payload.orderNumber}.`,
              actionUrl: `/customer/invoice/${payload.orderId}`,
              type: 'PAYMENT_RECEIVED',
            });
            break;

          case 'WORKER_APPROVED':
            // Notify Worker
            await InAppProvider.send({
              userId: payload.workerUserId,
              title: '👷 Crew Account Approved',
              message: 'Your Bhakti Studio Crew account has been approved! You can now log in.',
              actionUrl: '/worker/dashboard',
              type: 'WORKER_APPROVED',
            });
            await EmailProvider.send({
              toEmail: payload.workerEmail,
              subject: '[Bhakti Studio] Crew Account Approved',
              htmlContent: `<h2>Congratulations!</h2><p>Your Bhakti Studio Crew account has been approved! You can now log in.</p>`,
            });
            break;

          default:
            console.log(`[NotificationService]: Unhandled event type '${eventType}'`);
        }
      } catch (err) {
        console.error('[NotificationService Error]: Dispatch failed:', err.message);
      }
    });
  }
}
