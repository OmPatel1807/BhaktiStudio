import React from 'react';

export const OrderQrModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const qrToken = order.qrCodeToken || `QR-BS-${order.orderNumber}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
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
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          color: '#F8FAFC',
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>
          Event Site Access QR Code
        </h3>
        <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px 0' }}>
          Order #{order.orderNumber} • {order.eventType}
        </p>

        {/* QR Code Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '16px',
            display: 'inline-block',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
          }}
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrToken)}`}
            alt="Site Access QR Code"
            style={{ display: 'block', width: '180px', height: '180px' }}
          />
        </div>

        <div style={{ fontSize: '12px', color: '#F59E0B', fontFamily: 'monospace', marginBottom: '24px' }}>
          TOKEN: {qrToken}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: '#F59E0B',
            color: '#0F172A',
            fontWeight: '800',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          Close QR Access
        </button>
      </div>
    </div>
  );
};
