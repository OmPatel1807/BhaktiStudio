import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Bhakti Studio <onboarding@resend.dev>';

export const getAdminNotificationRecipients = async () => {
  const envAdmins = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_ADMIN || 'ompatel.666to18@gmail.com')
    .split(',')
    .map(e => e.trim())
    .filter(e => Boolean(e) && !e.includes('admin@bhaktistudio.com') && !e.includes('example.com'));

  if (envAdmins.length === 0) {
    envAdmins.push('ompatel.666to18@gmail.com');
  }

  try {
    const dbAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true }
    });
    const dbAdminEmails = dbAdmins
      .map(a => a.email?.trim())
      .filter(e => Boolean(e) && !e.includes('admin@bhaktistudio.com') && !e.includes('example.com'));
    
    // Merge unique valid emails
    return Array.from(new Set([...envAdmins, ...dbAdminEmails]));
  } catch (err) {
    console.warn('Failed to query DB admins, falling back to ENV:', err.message);
    return envAdmins;
  }
};

export const sendTransactionalEmail = async ({ to, subject, html, text }) => {
  const recipients = Array.isArray(to) ? to : [to];
  const primaryAdmin = process.env.ADMIN_NOTIFICATION_EMAIL || 'ompatel.666to18@gmail.com';

  if (!resend) {
    console.log(`[EMAIL_MOCK_DISPATCH] To: ${recipients.join(', ')} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  const results = [];

  for (const recipient of recipients) {
    if (!recipient || recipient.includes('admin@bhaktistudio.com') || recipient.includes('example.com')) {
      continue;
    }

    try {
      const response = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient,
        subject,
        html,
        text: text || subject,
      });

      if (response.error) {
        console.warn(`[Resend API Warning for ${recipient}]:`, response.error.message);
        
        // If Resend failed because of sandbox unverified domain (403), forward to primary verified admin!
        if (response.error.statusCode === 403 || response.error.message?.includes('testing emails')) {
          if (recipient !== primaryAdmin) {
            console.log(`[SANDBOX_FORWARD] Forwarding email to verified admin: ${primaryAdmin}`);
            const fwdResponse = await resend.emails.send({
              from: FROM_EMAIL,
              to: primaryAdmin,
              subject: `[FORWARD for ${recipient}] ${subject}`,
              html: `
                <div style="background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-family: Arial, sans-serif; font-size: 13px;">
                  ⚠️ <strong>Sandbox Notice:</strong> Original recipient was <code>${recipient}</code>. Forwarded to registered account.
                </div>
                ${html}
              `,
              text: text || subject,
            });
            results.push({ recipient, forwardedTo: primaryAdmin, success: !fwdResponse.error, data: fwdResponse });
            continue;
          }
        }
        results.push({ recipient, success: false, error: response.error.message });
      } else {
        results.push({ recipient, success: true, data: response });
      }
    } catch (error) {
      console.error(`Email Dispatch Exception for ${recipient}:`, error.message);
      results.push({ recipient, success: false, error: error.message });
    }
  }

  return { success: results.some(r => r.success), results };
};

// Reusable Branded Email Templates
export const emailTemplates = {
  orderReceived: (order) => ({
    subject: `Booking Request Received: #${order.orderNumber || order.id.slice(0, 8)} - Bhakti Studio`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #f59e0b; margin-top: 0;">Bhakti Studio & Event Production</h2>
        <p>Dear <strong>${order.customerName || 'Valued Client'}</strong>,</p>
        <p>We have received your booking request for <strong>${order.eventType}</strong>.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Order Ref:</strong> ${order.orderNumber || order.id}</p>
          <p style="margin: 4px 0;"><strong>Event Date:</strong> ${new Date(order.eventDate).toLocaleDateString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${order.venueAddress || 'Not specified'}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Our team is reviewing the equipment inventory and will issue a formalized commercial quotation shortly.</p>
      </div>
    `
  }),

  crewAssigned: (worker, order) => ({
    subject: `New Event Assignment: ${order.eventType} on ${new Date(order.eventDate).toLocaleDateString('en-IN')}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #10b981; margin-top: 0;">Crew Assignment Notification</h2>
        <p>Hi <strong>${worker.name}</strong>,</p>
        <p>You have been assigned to an upcoming event execution crew.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${order.eventType}</p>
          <p style="margin: 4px 0;"><strong>Order Ref:</strong> ${order.orderNumber || order.id}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(order.eventDate).toLocaleDateString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Venue Location:</strong> ${order.venueAddress || 'Kadi / Surat'}</p>
          <p style="margin: 4px 0;"><strong>Role Assigned:</strong> ${order.role || 'Crew'}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Please check your worker portal for setup details and site execution photo uploads.</p>
      </div>
    `
  }),

  quotationIssued: (order) => ({
    subject: `Quotation Ready for Order #${order.orderNumber || order.id.slice(0, 8)} - Bhakti Studio`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #f59e0b; margin-top: 0;">Commercial Estimate Ready</h2>
        <p>Dear <strong>${order.customerName}</strong>,</p>
        <p>The quotation for your <strong>${order.eventType}</strong> is ready for review.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0; font-size: 16px;"><strong>Grand Total:</strong> Rs. ${(order.grandTotal || order.totalAmount || 0).toLocaleString('en-IN')}</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/customer/dashboard" 
             style="background: #f59e0b; color: #0f172a; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
             Review & Approve Quotation
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 13px;">Log in to your customer dashboard to review line items, download the quotation PDF, and confirm the booking.</p>
      </div>
    `
  }),

  paymentReceived: (order) => ({
    subject: `Payment Confirmed: Order #${order.orderNumber || order.id.slice(0, 8)} - Bhakti Studio`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #10b981; margin-top: 0;">Payment Verified Successfully</h2>
        <p>Dear <strong>${order.customerName || 'Valued Client'}</strong>,</p>
        <p>We have verified your payment for event: <strong>${order.eventType}</strong>.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Order Ref:</strong> ${order.orderNumber || order.id}</p>
          <p style="margin: 4px 0;"><strong>Amount Paid:</strong> Rs. ${(order.amount || 0).toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> CONFIRMED / PAYMENT VERIFIED</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Your event execution status is updated. We are preparing logistics for the crew assignment.</p>
      </div>
    `
  }),

  payoutSettled: (payout) => ({
    subject: `Payout Settled: Rs. ${payout.totalAmount} - Bhakti Studio`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #10b981; margin-top: 0;">Wage Settlement Advice</h2>
        <p>Hi <strong>${payout.workerName || 'Crew Member'}</strong>,</p>
        <p>Bhakti Studio has processed a payout wage settlement for you.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Payout ID:</strong> ${payout.payoutId}</p>
          <p style="margin: 4px 0;"><strong>Settled Amount:</strong> Rs. ${(payout.totalAmount || 0).toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> PAID</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Wages are credited to your registered bank details. Log in to your crew portal to review earnings.</p>
      </div>
    `
  }),

  adminOrderAlert: (order) => ({
    subject: `🚨 [ALERT] New Event Booking Request Submitted - Bhakti Studio`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h2 style="color: #ef4444; margin-top: 0;">New Order Booking Request</h2>
        <p>A new customer booking request has been submitted and requires review.</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Order Ref:</strong> ${order.orderNumber}</p>
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${order.customerName}</p>
          <p style="margin: 4px 0;"><strong>Event Type:</strong> ${order.eventType}</p>
          <p style="margin: 4px 0;"><strong>Venue Address:</strong> ${order.venueAddress}</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/quotation/${order.orderId}" 
             style="background: #ef4444; color: #f8fafc; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
             Generate Commercial Quotation
          </a>
        </p>
      </div>
    `
  })
};
