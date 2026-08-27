import 'dotenv/config';
import { sendTransactionalEmail, emailTemplates, getAdminNotificationRecipients } from '../services/email.service.js';

async function testEmail() {
  console.log('Testing Resend email service...');
  const admins = await getAdminNotificationRecipients();
  console.log('Admin Recipients:', admins);

  const mockOrder = {
    orderNumber: 'BS-2026-00014',
    customerName: 'Om Patel',
    eventType: 'Wedding / Reception (3 Days)',
    venueAddress: 'Shyam Residency, Niko',
    eventDate: new Date(),
    grandTotal: 213816,
  };

  console.log('\n1. Sending Admin Order Alert...');
  const alertTemplate = emailTemplates.adminOrderAlert(mockOrder);
  const adminResult = await sendTransactionalEmail({
    to: admins,
    subject: alertTemplate.subject,
    html: alertTemplate.html,
  });
  console.log('Admin Alert Result:', JSON.stringify(adminResult, null, 2));

  console.log('\n2. Sending Quotation Issued Notification...');
  const quoteTemplate = emailTemplates.quotationIssued(mockOrder);
  const quoteResult = await sendTransactionalEmail({
    to: 'ompatel.666to18@gmail.com',
    subject: quoteTemplate.subject,
    html: quoteTemplate.html,
  });
  console.log('Quotation Notification Result:', JSON.stringify(quoteResult, null, 2));
}

testEmail();
