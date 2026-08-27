import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { getAdvancePercentage } from '../../services/pricingService';
import { rehydrateQuotation } from '../../utils/quotationMath';

export const QuotationViewModal = ({ order, quotation: rawQuotation, isOpen, onClose, onResponseSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!isOpen || !rawQuotation) return null;

  const durationDays = Number(order?.durationDays || order?.totalDays || 1);
  const itemsList = order?.orderItems || order?.items || order?.selectedServices || [];
  const quotation = rehydrateQuotation(rawQuotation, itemsList, durationDays);

  const handleResponse = async (action) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('bs_auth_token');
      const res = await fetch(`/api/v1/quotations/orders/${order.id}/quotation-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason: rejectionReason }),
      });

      const json = await res.json();
      setLoading(false);
      if (json.success) {
        onResponseSubmitted?.(action);
        onClose();
      }
    } catch (err) {
      setLoading(false);
      console.error('Failed to submit quotation response:', err);
    }
  };

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
          borderRadius: '24px',
          border: '1px solid #334155',
          padding: '32px',
          maxWidth: '560px',
          width: '90%',
          color: '#F8FAFC',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase' }}>
              Approved Official Quotation (V{quotation.versionNumber})
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0 0 0' }}>
              Order #{order.orderNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Pricing Breakdown */}
        <div style={{ backgroundColor: '#0F172A', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: '#94A3B8' }}>Equipment & Services Subtotal:</span>
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: '#94A3B8' }}>Setup & Logistics Charge:</span>
            <span>{formatCurrency(quotation.setupFee + quotation.transportFee)}</span>
          </div>
          {quotation.discounts > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#10B981' }}>
              <span>Special Discount Applied:</span>
              <span>-{formatCurrency(quotation.discounts)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: '#94A3B8' }}>GST Tax:</span>
            <span>{formatCurrency(quotation.taxAmount)}</span>
          </div>

          <div
            style={{
              borderTop: '1px solid #334155',
              paddingTop: '12px',
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '20px',
              fontWeight: '800',
              color: '#F59E0B',
            }}
          >
            <span>Approved Total:</span>
            <span>{formatCurrency(quotation.totalAmount)}</span>
          </div>
        </div>

        {/* Advance Payment Callout */}
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '13px',
            color: '#F59E0B',
            marginBottom: '24px',
          }}
        >
          💳 Advance Payable upon Confirmation ({getAdvancePercentage()}%): <strong>{formatCurrency(quotation.advanceFee)}</strong>
        </div>

        {showRejectInput && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              rows={2}
              placeholder="Reason for declining or revision request..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px',
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {!showRejectInput ? (
            <>
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                style={{
                  flex: 1,
                  backgroundColor: '#334155',
                  color: '#FCA5A5',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Decline / Request Change
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleResponse('ACCEPT')}
                style={{
                  flex: 1.5,
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                }}
              >
                {loading ? 'Processing...' : 'Accept Quotation & Confirm'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleResponse('REJECT')}
              style={{
                width: '100%',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Submit Decline Reason
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
