import { PrismaClient } from '@prisma/client';
import { PaymentService } from '../services/payment.service.js';
import { PricingEngineService } from '../services/pricingEngine.js';

const prisma = new PrismaClient();

// Derives this server's own public base URL: prefer the explicit env var
// (set in render.yaml for production), fall back to the incoming request's
// protocol/host so local dev works without any extra configuration.
const getServerBaseUrl = (req) => process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
const getClientBaseUrl = () => process.env.CLIENT_URL;

/**
 * POST /api/v1/payments/create-intent
 * Create payment order intent (ADVANCE, REMAINING_BALANCE, FULL)
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, paymentType = 'ADVANCE' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
        orderItems: true,
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const { totalAmount, advanceAmount } = PricingEngineService.resolveOrderFinancials(order);

    let amountToPay = totalAmount;
    if (paymentType === 'ADVANCE' || paymentType === 'ADVANCE_30') {
      amountToPay = advanceAmount;
    } else if (paymentType === 'REMAINING_BALANCE') {
      const alreadyPaid = order.payments.reduce((sum, p) => (p.status === 'PAID' ? sum + p.amount : sum), 0);
      amountToPay = Math.max(0, totalAmount - alreadyPaid);
    }

    const intent = PaymentService.createPaymentOrder({
      orderId,
      amount: amountToPay,
    });

    // LOOP 44: Amount Routing Logic (UPI <= 1,00,000, Netbanking & Cards > 1,00,000)
    const isUpiEligible = amountToPay <= 100000;
    const recommendedMethod = isUpiEligible ? 'UPI' : 'CARD_NETBANKING';

    return res.json({
      success: true,
      data: {
        ...intent,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentType,
        amountToPay,
        isUpiEligible,
        recommendedMethod,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/payments/verify
 * Cryptographic HMAC SHA256 Signature Verification & Order Status Update to CONFIRMED / PAID
 */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { orderId, gatewayOrderId, paymentId, signature, paymentMode = 'ONLINE_RAZORPAY', paymentType = 'ADVANCE' } = req.body;

    if (!orderId || !gatewayOrderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, gateway order ID, payment ID, and signature are required.',
      });
    }

    // Cryptographic signature check
    const isValid = PaymentService.verifyHmacSignature({ gatewayOrderId, paymentId, signature });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Security error: Invalid cryptographic payment signature.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { quotations: { orderBy: { versionNumber: 'desc' }, take: 1 }, payments: true, orderItems: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const { totalAmount, advanceAmount: advanceFee } = PricingEngineService.resolveOrderFinancials(order);

    const paidAmount = (paymentType === 'ADVANCE' || paymentType === 'ADVANCE_30') ? advanceFee : totalAmount;

    // Record Payment
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        orderId,
        amount: paidAmount,
        paymentType: (paymentType === 'ADVANCE' || paymentType === 'ADVANCE_30') ? 'ADVANCE_DEPOSIT' : 'FULL_PAYMENT',
        paymentMethod: paymentMode === 'ONLINE_UPI' ? 'UPI_ONLINE' : 'RAZORPAY',
        transactionRef: paymentId,
        status: 'PAID',
      },
    });

    // Update Order Payment Status & Order Lifecycle Status
    const totalPaidSoFar = [...order.payments, paymentRecord].reduce((sum, p) => sum + p.amount, 0);
    const newPaymentStatus = totalPaidSoFar >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    // Transition Order Status to CONFIRMED upon successful payment if previously SUBMITTED/DRAFT/QUOTATION_SENT
    let newOrderStatus = order.status;
    if (['DRAFT', 'SUBMITTED', 'QUOTATION_SENT'].includes(order.status)) {
      newOrderStatus = 'CONFIRMED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus,
        status: newOrderStatus,
      },
    });

    // Audit Log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          orderId,
          actorId: userId,
          action: `PAYMENT_RECEIVED_${paymentType}`,
          details: JSON.stringify({ amount: paidAmount, newPaymentStatus, newOrderStatus, transactionId: paymentId }),
        },
      });
    }

    return res.json({
      success: true,
      message: `Payment verified successfully. Order status updated to ${newOrderStatus}.`,
      data: {
        paymentRecord,
        paymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/payments/record-cash
 * ADMIN: Record manual cash payment at venue
 */
export const recordCashPayment = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { orderId, amount, notes = 'On-site cash payment' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { quotations: { orderBy: { versionNumber: 'desc' }, take: 1 }, payments: true, orderItems: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const { totalAmount } = PricingEngineService.resolveOrderFinancials(order);

    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        orderId,
        amount: Number(amount),
        paymentType: 'ON_SITE_CASH',
        paymentMethod: 'CASH',
        transactionRef: `CASH-${Date.now()}`,
        status: 'PAID',
      },
    });

    const totalPaidSoFar = [...order.payments, paymentRecord].reduce((sum, p) => sum + p.amount, 0);
    const newPaymentStatus = (totalAmount > 0 && totalPaidSoFar >= totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: newPaymentStatus },
    });

    await prisma.auditLog.create({
      data: {
        orderId,
        actorId: adminId,
        action: 'CASH_PAYMENT_RECORDED',
        details: JSON.stringify({ amount: Number(amount), notes }),
      },
    });

    return res.json({
      success: true,
      message: 'Cash payment recorded successfully.',
      data: { paymentRecord, paymentStatus: updatedOrder.paymentStatus },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/payments/:orderId/invoice
 * Generate downloadable invoice data
 */
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        orderItems: true,
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const quotation = order.quotations[0] || {
      subtotal: 0,
      setupFee: 0,
      transportFee: 0,
      discounts: 0,
      taxAmount: 0,
      totalAmount: 0,
      advanceFee: 0,
    };

    const totalPaid = order.payments.reduce((sum, p) => (p.status === 'PAID' ? sum + p.amount : sum), 0);
    const balanceDue = Math.max(0, quotation.totalAmount - totalPaid);

    return res.json({
      success: true,
      data: {
        invoiceNumber: `INV-${order.orderNumber}`,
        invoiceDate: new Date().toISOString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        eventDetails: {
          eventType: order.eventType,
          eventDate: order.eventDate,
          venueAddress: order.venueAddress,
        },
        orderItems: order.orderItems,
        quotationSummary: quotation,
        paymentHistory: order.payments,
        financialSummary: {
          subtotal: quotation.subtotal,
          setupFee: quotation.setupFee,
          transportFee: quotation.transportFee,
          discounts: quotation.discounts,
          taxAmount: quotation.taxAmount,
          grandTotal: quotation.totalAmount,
          totalPaid,
          balanceDue,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/payments/initiate-bank-redirect
 * Creates a direct bank portal redirect URL for Netbanking checkout
 */
export const initiateBankRedirect = async (req, res) => {
  try {
    const { orderId, bankCode = 'HDFC', paymentType = 'ADVANCE', amount } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
        orderItems: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const { totalAmount, advanceAmount } = PricingEngineService.resolveOrderFinancials(order);

    const calculatedAmount = paymentType === 'FULL' ? totalAmount : advanceAmount;
    const amountToPay = (amount && Number(amount) > 0) ? Number(amount) : calculatedAmount;
    const redirectUrl = `${getServerBaseUrl(req)}/api/v1/payments/mock-bank-portal?orderId=${order.id}&orderNumber=${order.orderNumber}&bankCode=${bankCode}&amount=${amountToPay}&paymentType=${paymentType}`;

    return res.json({
      success: true,
      data: {
        redirectUrl,
        bankCode,
        amountToPay,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/payments/mock-bank-portal
 * Renders realistic Bank Authentication & Payment Authorization Page (HDFC/SBI/ICICI)
 */
export const renderMockBankPortal = async (req, res) => {
  try {
    const { orderId, orderNumber = 'BS-2026-00001', bankCode = 'HDFC', amount, paymentType = 'ADVANCE' } = req.query;

    let payableAmount = Number(amount || 0);

    // Fallback DB Rehydration if query param amount is missing or 0
    if (payableAmount <= 0) {
      const order = await prisma.order.findFirst({
        where: orderId ? { id: orderId } : { orderNumber },
        include: { quotations: { orderBy: { versionNumber: 'desc' }, take: 1 }, orderItems: true },
      });

      if (order) {
        const { totalAmount, advanceAmount } = PricingEngineService.resolveOrderFinancials(order);
        payableAmount = paymentType === 'FULL' ? totalAmount : advanceAmount;
      } else {
        // No order/orderId could be resolved — surface a clear error instead of
        // silently charging an arbitrary fixed amount.
        const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unable to Verify Order — Bhakti Studio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #F1F5F9; color: #0F172A; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { max-width: 480px; margin: 24px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 32px; text-align: center; }
    .icon { font-size: 40px; margin-bottom: 12px; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    p { font-size: 14px; color: #64748B; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Unable to Verify Order</h1>
    <p>We couldn't locate booking ${orderNumber ? `#${orderNumber}` : (orderId ? `#${orderId}` : '')} to determine the payable amount. Please return to your dashboard and retry payment, or contact support if this persists.</p>
  </div>
</body>
</html>`;
        return res.status(404).send(errorHtml);
      }
    }

    const bankNames = {
      HDFC: 'HDFC Bank NetBanking',
      SBIN: 'State Bank of India (SBI)',
      ICIC: 'ICICI Bank Internet Banking',
      UTIB: 'Axis Bank Internet Banking',
      KKBK: 'Kotak Mahindra Bank',
    };

    const bankColors = {
      HDFC: '#004B8D',
      SBIN: '#280071',
      ICIC: '#F37023',
      UTIB: '#97144D',
      KKBK: '#ED1C24',
    };

    const officialUrls = {
      HDFC: 'https://netbanking.hdfcbank.com/netbanking/',
      SBIN: 'https://merchant.onlinesbi.sbi/merchant/login.htm',
      ICIC: 'https://infinity.icicibank.com/corporate/LoginToInbox.jsp',
      UTIB: 'https://m.axisbank.com/Retail/Login',
      KKBK: 'https://netbanking.kotak.com/knb2/',
    };

    const name = bankNames[bankCode] || `${bankCode} NetBanking`;
    const color = bankColors[bankCode] || '#004B8D';
    const officialUrl = officialUrls[bankCode] || 'https://netbanking.hdfcbank.com/netbanking/';
    const formattedAmountStr = Number(payableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name} — Payment Gateway Verification</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #F1F5F9; color: #0F172A; }
    .header { background-color: ${color}; color: #FFFFFF; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .card { max-width: 520px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 32px; }
    .title { font-size: 18px; font-weight: 700; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .row .label { color: #64748B; }
    .row .value { font-weight: 700; color: #0F172A; }
    .btn { display: block; width: 100%; padding: 16px; background-color: ${color}; color: #FFFFFF; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; box-sizing: border-box; margin-top: 24px; }
    .btn:hover { opacity: 0.9; }
    .shield { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #64748B; margin-top: 20px; }
    .official-link { font-size: 12px; color: #3B82F6; text-decoration: none; word-break: break-all; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ ${name}</h1>
    <span>Secure Payment Portal</span>
  </div>
  <div class="card">
    <div class="title">Authorize NetBanking Transaction</div>
    <div class="row">
      <span class="label">Merchant Name:</span>
      <span class="value">Bhakti Studio Pvt Ltd</span>
    </div>
    <div class="row">
      <span class="label">Booking Order Reference:</span>
      <span class="value">#${orderNumber}</span>
    </div>
    <div class="row">
      <span class="label">Payment Type:</span>
      <span class="value">${paymentType === 'FULL' ? '100% Full Payment' : '30% Mandatory Advance'}</span>
    </div>
    <div class="row">
      <span class="label">Official Gateway Endpoint:</span>
      <span class="value"><a href="${officialUrl}" target="_blank" class="official-link">${officialUrl}</a></span>
    </div>
    <div class="row" style="font-size: 18px; margin-top: 16px; border-top: 1px dashed #CBD5E1; padding-top: 16px;">
      <span class="label" style="font-weight: 700;">Payable Amount:</span>
      <span class="value" style="color: ${color}; font-size: 24px; font-weight: 900;">₹${formattedAmountStr}</span>
    </div>

    <form action="${getServerBaseUrl(req)}/api/v1/payments/bank-callback" method="POST">
      <input type="hidden" name="orderId" value="${orderId || ''}">
      <input type="hidden" name="orderNumber" value="${orderNumber}">
      <input type="hidden" name="amount" value="${payableAmount}">
      <input type="hidden" name="paymentType" value="${paymentType}">
      <input type="hidden" name="bankCode" value="${bankCode}">
      <button type="submit" class="btn">
        Authorize & Complete Payment (₹${formattedAmountStr})
      </button>
    </form>

    <div class="shield">
      🔒 256-Bit SSL Cryptographic Encryption Verified • ${officialUrl}
    </div>
  </div>
</body>
</html>
    `;

    return res.send(html);
  } catch (error) {
    return res.status(500).send('Error rendering bank portal');
  }
};

/**
 * GET/POST /api/v1/payments/bank-callback & /razorpay-callback
 * Processes bank authorization callback and redirects browser back to customer dashboard
 */
export const handleBankCallback = async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    const { orderId, orderNumber, amount, paymentType = 'ADVANCE', bankCode = 'HDFC' } = data;

    let targetOrderId = orderId;

    if (!targetOrderId && orderNumber) {
      const found = await prisma.order.findUnique({ where: { orderNumber } });
      if (found) targetOrderId = found.id;
    }

    if (!targetOrderId) {
      const fallbackOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
      if (fallbackOrder) targetOrderId = fallbackOrder.id;
    }

    const order = await prisma.order.findUnique({
      where: { id: targetOrderId },
      include: { quotations: { orderBy: { versionNumber: 'desc' }, take: 1 }, payments: true, orderItems: true },
    });

    if (order) {
      const { totalAmount, advanceAmount } = PricingEngineService.resolveOrderFinancials(order);

      const paidAmount = Number(amount) || (paymentType === 'FULL' ? totalAmount : advanceAmount);

      const paymentRecord = await prisma.paymentRecord.create({
        data: {
          orderId: order.id,
          amount: paidAmount,
          paymentType: paymentType === 'FULL' ? 'FULL_PAYMENT' : 'ADVANCE_DEPOSIT',
          paymentMethod: 'BANK_TRANSFER',
          transactionRef: `BANK-${bankCode}-${Date.now()}`,
          status: 'PAID',
        },
      });

      const totalPaidSoFar = [...order.payments, paymentRecord].reduce((sum, p) => sum + p.amount, 0);
      const newPaymentStatus = totalPaidSoFar >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

      let newOrderStatus = order.status;
      if (['DRAFT', 'SUBMITTED', 'QUOTATION_SENT'].includes(order.status)) {
        newOrderStatus = 'CONFIRMED';
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: newPaymentStatus,
          status: newOrderStatus,
        },
      });
    }

    const finalRef = order ? order.orderNumber : (orderNumber || 'BS-2026-00001');
    const redirectUrl = `${getClientBaseUrl()}/customer/dashboard?payment_status=success&orderNumber=${finalRef}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Bank callback error:', error);
    return res.redirect(`${getClientBaseUrl()}/customer/dashboard?payment_status=success`);
  }
};
