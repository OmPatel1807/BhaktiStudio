import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getAdvancePercentage } from '../../services/pricingService';
import { rehydrateQuotation, computeEquipmentSubtotal } from '../../utils/quotationMath';

export const OrderDetailsModal = ({ order, isOpen, onClose, onOpenPaymentModal, onMarkCompleted }) => {
  if (!isOpen || !order) return null;

  const rawQuotation = order.quotations?.[0];

  // LOOP 40: Unified rehydration — single source of truth
  const latestQuotation = rehydrateQuotation(rawQuotation, order.orderItems);
  const equipmentTotal = computeEquipmentSubtotal(order.orderItems);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          maxWidth: '680px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--text-primary)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#C97A13', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Order Lifecycle Breakdown
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
              Order #{order.orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '22px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Status Badges Row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <span
            style={{
              backgroundColor: 'rgba(201, 122, 19, 0.15)',
              color: '#C97A13',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Status: {order.status}
          </span>
          <span
            style={{
              backgroundColor: order.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: order.paymentStatus === 'PAID' ? '#10B981' : '#EF4444',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            Payment: {order.paymentStatus}
          </span>
        </div>

        {/* Event Info Card */}
        <div style={{ backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '14px', marginBottom: '20px', fontSize: '14px' }}>
          <div>🗓️ <strong>Event Type & Date:</strong> {order.eventType} ({formatDateTime(order.eventDate)})</div>
          <div style={{ marginTop: '6px' }}>⏰ <strong>Timings:</strong> {order.startTime} - {order.endTime}</div>
          <div style={{ marginTop: '6px' }}>📍 <strong>Venue Address:</strong> {order.venueAddress}</div>
          {order.distanceKm && (
            <div style={{ marginTop: '6px', color: '#C97A13', fontWeight: '600' }}>
              🚗 <strong>Event Distance:</strong> {order.distanceKm} km {order.requiresCustomTransport && '(Outstation Surcharge Range)'}
            </div>
          )}
        </div>

        {/* Selected Services Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#C97A13', margin: '0 0 10px 0' }}>
            Selected Services & Equipment
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.orderItems?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                }}
              >
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.serviceName}</strong>
                  {item.widthFt && ` (${item.widthFt} x ${item.heightFt} ft)`}
                </span>
                <span style={{ fontWeight: '700', color: '#C97A13' }}>
                  {formatCurrency((item.finalRate || item.estimatedRate || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quotation Summary */}
        {latestQuotation && (
          <div style={{ backgroundColor: 'var(--bg-input)', padding: '18px', borderRadius: '14px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              Financial Quotation Breakdown (V{latestQuotation.versionNumber})
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Equipment & Services Subtotal:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{formatCurrency(equipmentTotal)}</span>
            </div>
            {Number(latestQuotation.setupFee || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Setup & Rigging Charges:</span>
                <span style={{ color: 'var(--text-primary)' }}>+{formatCurrency(latestQuotation.setupFee)}</span>
              </div>
            )}
            {Number(latestQuotation.transportFee || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transport & Logistics:</span>
                <span style={{ color: 'var(--text-primary)' }}>+{formatCurrency(latestQuotation.transportFee)}</span>
              </div>
            )}
            {Number(latestQuotation.technicianFee || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>On-Site Technician Support:</span>
                <span style={{ color: 'var(--text-primary)' }}>+{formatCurrency(latestQuotation.technicianFee)}</span>
              </div>
            )}
            {Number(latestQuotation.discounts || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', color: '#10B981' }}>
                <span>Discount Applied:</span>
                <span>-{formatCurrency(latestQuotation.discounts)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>GST (18%):</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(latestQuotation.taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>Grand Total:</span>
              <span style={{ fontWeight: '800', color: '#C97A13' }}>{formatCurrency(latestQuotation.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{getAdvancePercentage()}% Mandatory Advance Required:</span>
              <span style={{ fontWeight: '700', color: '#C97A13' }}>{formatCurrency(latestQuotation.advanceFee)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end w-full mt-4">
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            Close
          </button>
          {onMarkCompleted && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(order.status) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onMarkCompleted(order);
              }}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: '900',
                padding: '12px 22px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              ✅ Mark Event Completed
            </button>
          )}
          {order.paymentStatus !== 'PAID' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPaymentModal?.(order, latestQuotation);
              }}
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: '900',
                padding: '12px 22px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              💳 Pay Online Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
