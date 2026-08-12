import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export const Step5Payment = ({
  paymentPreference,
  setPaymentPreference,
  paymentType,
  setPaymentType,
  estimation,
  onTriggerInstantPayment,
}) => {
  const total = estimation?.grandTotal || 0;
  const advance = estimation?.advanceRequired || total * 0.3;

  const targetAmount = paymentType === 'ADVANCE' ? advance : total;
  const isUpiEligible = targetAmount <= 100000;

  return (
    <div>
      <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
        Step 5: Select Payment Method & Preference
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 28px 0' }}>
        Choose how you would like to pay your booking advance or full event total.
      </p>

      {/* Payment Preference Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px', width: '100%' }}>
        <div
          onClick={() => setPaymentPreference('ONLINE')}
          style={{
            backgroundColor: paymentPreference === 'ONLINE' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
            border: paymentPreference === 'ONLINE' ? '2px solid #C97A13' : '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#C97A13' }}>💳 Pay Online Gateway</div>
            {paymentPreference === 'ONLINE' && <span style={{ fontSize: '18px' }}>✅</span>}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Instant confirmation via UPI (PhonePe, GPay, Paytm), Netbanking, or Credit/Debit Cards.
          </div>
        </div>

        <div
          onClick={() => setPaymentPreference('LOCATION')}
          style={{
            backgroundColor: paymentPreference === 'LOCATION' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
            border: paymentPreference === 'LOCATION' ? '2px solid #C97A13' : '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>💵 Pay at Location</div>
            {paymentPreference === 'LOCATION' && <span style={{ fontSize: '18px' }}>✅</span>}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Pay cash or UPI on-site upon equipment arrival & setup verification.
          </div>
        </div>
      </div>

      {/* Online Gateway Routing & Options Box */}
      {paymentPreference === 'ONLINE' && (
        <div
          style={{
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            Payment Amount & Smart Routing
          </h3>

          {/* Amount Type Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', width: '100%' }}>
            <div
              onClick={() => setPaymentType('ADVANCE')}
              style={{
                flex: 1,
                backgroundColor: paymentType === 'ADVANCE' ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-surface)',
                border: paymentType === 'ADVANCE' ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>30% Booking Advance</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#F59E0B', marginTop: '4px' }}>
                {formatCurrency(advance)}
              </div>
            </div>

            <div
              onClick={() => setPaymentType('FULL')}
              style={{
                flex: 1,
                backgroundColor: paymentType === 'FULL' ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-surface)',
                border: paymentType === 'FULL' ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>100% Full Total</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatCurrency(total)}
              </div>
            </div>
          </div>

          {/* Amount-Based Gateway Routing Badge */}
          <div
            style={{
              backgroundColor: isUpiEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${isUpiEligible ? '#10B981' : '#3B82F6'}`,
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '24px' }}>{isUpiEligible ? '⚡' : '🏦'}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: isUpiEligible ? '#10B981' : '#3B82F6' }}>
                {isUpiEligible ? 'Recommended: Instant UPI Payment' : 'Recommended: Netbanking & Corporate Cards'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isUpiEligible
                  ? `Amount is ${formatCurrency(targetAmount)} (<= ₹1,00,000). Direct UPI QR & App routing (PhonePe, GPay, Paytm).`
                  : `High-value transaction ${formatCurrency(targetAmount)} (> ₹1,00,000). Priority routing via HDFC/ICICI/SBI Netbanking & Credit Cards.`}
              </div>
            </div>
          </div>

          {onTriggerInstantPayment && (
            <button
              type="button"
              onClick={onTriggerInstantPayment}
              style={{
                width: '100%',
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: '900',
                fontSize: '16px',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '20px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              }}
            >
              ⚡ Pay {formatCurrency(targetAmount)} Now via Gateway
            </button>
          )}
        </div>
      )}
    </div>
  );
};
