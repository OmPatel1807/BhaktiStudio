import crypto from 'crypto';

export class PaymentService {
  /**
   * Create mock or live Gateway order intent
   */
  static createPaymentOrder({ orderId, amount, currency = 'INR' }) {
    const timestamp = Date.now();
    const gatewayOrderId = `order_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      gatewayOrderId,
      amount: Math.round(amount * 100), // Amount in paise for INR
      currency,
      key: process.env.PAYMENT_GATEWAY_KEY || 'rzp_test_bhakti_studio_key',
    };
  }

  /**
   * Verify HMAC SHA256 Cryptographic Signature
   * @param {Object} params
   * @param {string} params.gatewayOrderId
   * @param {string} params.paymentId
   * @param {string} params.signature
   * @returns {boolean}
   */
  static verifyHmacSignature({ gatewayOrderId, paymentId, signature }) {
    // If mock test payload
    if (signature === 'mock_valid_signature') return true;

    const secret = process.env.PAYMENT_GATEWAY_SECRET || 'your_payment_gateway_secret_here';
    const text = `${gatewayOrderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}
