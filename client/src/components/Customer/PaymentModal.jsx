import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { POPULAR_BANKS } from '../../constants/bankUrls';
import { getAdvancePercentage } from '../../services/pricingService';
import { rehydrateQuotation } from '../../utils/quotationMath';

const ADVANCE_PERCENTAGE = getAdvancePercentage();

export const PaymentModal = ({ order, quotation: rawQuotation, isOpen, onClose, onPaymentSuccess }) => {
  const [paymentType, setPaymentType] = useState('ADVANCE'); // 'ADVANCE' | 'FULL'
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // 'UPI' | 'NETBANKING_CARD'
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [showQrCode, setShowQrCode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('SELECT'); // 'SELECT' | 'PROCESSING' | 'SUCCESS'
  const [errorMsg, setErrorMsg] = useState(null);

  const quotation = useMemo(() => {
    return rehydrateQuotation(rawQuotation || order?.latestQuotation || order?.approvedQuotation, order?.orderItems);
  }, [rawQuotation, order]);

  useEffect(() => {
    if (order && quotation) {
      const adv = quotation.advanceFee || (quotation.totalAmount * ADVANCE_PERCENTAGE) / 100;
      const amount = paymentType === 'ADVANCE' ? adv : quotation.totalAmount;
      if (amount <= 100000) {
        setSelectedMethod('UPI');
      } else {
        setSelectedMethod('NETBANKING_CARD');
      }
    }
  }, [order, quotation, paymentType, isOpen]);

  if (!isOpen || !order) return null;

  const totalAmount =
    quotation?.totalAmount ||
    order?.latestQuotation?.totalAmount ||
    order?.approvedQuotation?.totalAmount ||
    order?.estimatedTotal ||
    order?.totalAmount ||
    0;

  const advanceAmount =
    quotation?.advanceFee ||
    order?.latestQuotation?.advanceFee ||
    order?.approvedQuotation?.advanceFee ||
    (totalAmount * ADVANCE_PERCENTAGE) / 100;

  const fullAmount = totalAmount;
  const targetAmount = (paymentType === 'ADVANCE' || paymentType === 'ADVANCE_30') ? advanceAmount : fullAmount;
  const isUpiEligible = targetAmount <= 100000;

  // Initiate direct Bank Portal browser redirect
  const handleBankRedirect = async (bankCodeToUse) => {
    const bankCode = bankCodeToUse || selectedBank;
    setProcessing(true);
    setStep('PROCESSING');
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('bs_auth_token');
      const res = await fetch('/api/v1/payments/initiate-bank-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          bankCode,
          paymentType,
          amount: targetAmount,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.redirectUrl) {
        // Direct browser window redirect to Bank Portal / Sandbox
        window.location.href = json.data.redirectUrl;
      } else {
        setProcessing(false);
        setStep('SELECT');
        setErrorMsg(json.message || 'Failed to initiate bank redirect.');
      }
    } catch (err) {
      setProcessing(false);
      setStep('SELECT');
      setErrorMsg('Network error starting bank portal redirect.');
    }
  };

  // Instant UPI / Gateway Payment Verification
  const handleInitiatePayment = async () => {
    if (selectedMethod === 'NETBANKING_CARD') {
      return handleBankRedirect(selectedBank);
    }

    setProcessing(true);
    setStep('PROCESSING');
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('bs_auth_token');

      const intentRes = await fetch('/api/v1/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id, paymentType }),
      });
      const intentJson = await intentRes.json();

      if (!intentJson.success) {
        throw new Error(intentJson.message || 'Failed to create payment intent');
      }

      const gatewayOrderId = intentJson.data.gatewayOrderId;
      const paymentId = `pay_${Date.now()}`;
      const mockSignature = 'mock_valid_signature';

      setTimeout(async () => {
        try {
          const verifyRes = await fetch('/api/v1/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId: order.id,
              gatewayOrderId,
              paymentId,
              signature: mockSignature,
              paymentMode: 'ONLINE_UPI',
              paymentType,
            }),
          });

          const verifyJson = await verifyRes.json();
          setProcessing(false);

          if (verifyJson.success) {
            setStep('SUCCESS');
            setTimeout(() => {
              onPaymentSuccess?.(verifyJson.data);
              onClose();
              setStep('SELECT');
            }, 1800);
          } else {
            setStep('SELECT');
            setErrorMsg(verifyJson.message || 'Payment verification failed.');
          }
        } catch (err) {
          setProcessing(false);
          setStep('SELECT');
          setErrorMsg('Network error verifying payment.');
        }
      }, 1500);
    } catch (err) {
      setProcessing(false);
      setStep('SELECT');
      setErrorMsg(err.message || 'Payment initialization failed.');
    }
  };

  const upiDeepLink = `upi://pay?pa=bhaktistudio@upi&pn=BhaktiStudio&am=${targetAmount}&tn=Booking_${order.orderNumber}&cu=INR`;
  const activeBankObj = POPULAR_BANKS.find((b) => b.code === selectedBank) || POPULAR_BANKS[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '28px',
          border: '1px solid #334155',
          padding: '32px',
          maxWidth: '540px',
          width: '92%',
          color: '#F8FAFC',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PAYMENT GATEWAY CHECKOUT
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0' }}>
              Order #{order.orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {step === 'SELECT' && (
          <div>
            {/* Amount Type Selection */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div
                onClick={() => setPaymentType('ADVANCE')}
                style={{
                  flex: 1,
                  backgroundColor: paymentType === 'ADVANCE' ? 'rgba(245, 158, 11, 0.15)' : '#0F172A',
                  border: paymentType === 'ADVANCE' ? '2px solid #F59E0B' : '1px solid #334155',
                  borderRadius: '18px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{ADVANCE_PERCENTAGE}% Booking Advance</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#F59E0B', marginTop: '4px' }}>
                  {formatCurrency(advanceAmount)}
                </div>
              </div>

              <div
                onClick={() => setPaymentType('FULL')}
                style={{
                  flex: 1,
                  backgroundColor: paymentType === 'FULL' ? 'rgba(245, 158, 11, 0.15)' : '#0F172A',
                  border: paymentType === 'FULL' ? '2px solid #F59E0B' : '1px solid #334155',
                  borderRadius: '18px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>100% Full Payment</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#F8FAFC', marginTop: '4px' }}>
                  {formatCurrency(fullAmount)}
                </div>
              </div>
            </div>

            {/* Smart Method Selector */}
            <div style={{ backgroundColor: '#0F172A', padding: '20px', borderRadius: '20px', marginBottom: '24px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8' }}>Select Payment Channel</span>
                <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', backgroundColor: isUpiEligible ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: isUpiEligible ? '#10B981' : '#60A5FA' }}>
                  {isUpiEligible ? '⚡ UPI Recommended (<= ₹1L)' : '🏦 Netbanking Primary (> ₹1L)'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: selectedMethod === 'UPI' ? '2px solid #10B981' : '1px solid #334155',
                    backgroundColor: selectedMethod === 'UPI' ? 'rgba(16, 185, 129, 0.15)' : '#1E293B',
                    color: selectedMethod === 'UPI' ? '#10B981' : '#94A3B8',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ UPI Apps & QR
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('NETBANKING_CARD')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: selectedMethod === 'NETBANKING_CARD' ? '2px solid #3B82F6' : '1px solid #334155',
                    backgroundColor: selectedMethod === 'NETBANKING_CARD' ? 'rgba(59, 130, 246, 0.15)' : '#1E293B',
                    color: selectedMethod === 'NETBANKING_CARD' ? '#60A5FA' : '#94A3B8',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  🏛️ Popular Banks
                </button>
              </div>

              {/* NETBANKING POPULAR BANKS GRID */}
              {selectedMethod === 'NETBANKING_CARD' && (
                <div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', marginBottom: '12px' }}>
                    Select Bank for Direct Portal Redirection:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {POPULAR_BANKS.map((bank) => {
                      const isSelected = selectedBank === bank.code;
                      return (
                        <div
                          key={bank.id}
                          onClick={() => {
                            setSelectedBank(bank.code);
                            handleBankRedirect(bank.code);
                          }}
                          style={{
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#1E293B',
                            border: isSelected ? `2px solid ${bank.color}` : '1px solid #334155',
                            borderRadius: '14px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{bank.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#FFFFFF' : '#CBD5E1' }}>
                              {bank.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: '800' }}>Redirect ➔</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* UPI INTENT & QR CODE ENGINE */}
              {selectedMethod === 'UPI' && (
                <div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', marginBottom: '10px' }}>
                    Supported Native UPI Apps:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                      <span
                        key={app}
                        style={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#10B981',
                        }}
                      >
                        📱 {app}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href={upiDeepLink}
                      style={{
                        flex: 1,
                        backgroundColor: '#10B981',
                        color: '#0F172A',
                        textDecoration: 'none',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      📱 Open Native UPI App
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      style={{
                        flex: 1,
                        backgroundColor: '#1E293B',
                        color: '#F59E0B',
                        border: '1px solid #F59E0B',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '12px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {showQrCode ? 'Hide QR Code' : '📷 Show Dynamic QR'}
                    </button>
                  </div>

                  {showQrCode && (
                    <div style={{ marginTop: '16px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '16px', textAlign: 'center', color: '#0F172A' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>
                        Scan to Pay {formatCurrency(targetAmount)}
                      </div>
                      <div style={{ width: '140px', height: '140px', margin: '0 auto', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '32px' }}>
                        📱 QR
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
                        Scan with any UPI App (GPay, PhonePe, Paytm)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedMethod === 'NETBANKING_CARD' ? (
              <button
                type="button"
                onClick={() => handleBankRedirect(selectedBank)}
                style={{
                  width: '100%',
                  backgroundColor: activeBankObj.color || '#3B82F6',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                }}
              >
                Proceed to {activeBankObj.name} NetBanking (₹{targetAmount.toLocaleString('en-IN')}) ➔
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInitiatePayment}
                style={{
                  width: '100%',
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: '900',
                  fontSize: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                }}
              >
                ⚡ Instant UPI Intent Pay ({formatCurrency(targetAmount)})
              </button>
            )}
          </div>
        )}

        {step === 'PROCESSING' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' }}>
              Redirecting to {activeBankObj.name}...
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
              Connecting to Bank Gateway & verifying security credentials.
            </p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#10B981', margin: '0 0 8px 0' }}>
              Payment Verified & Booking Confirmed!
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 16px 0' }}>
              Transaction recorded. Order status set to CONFIRMED.
            </p>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#F59E0B' }}>
              Amount Received: {formatCurrency(targetAmount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
