import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export const Step6Review = ({
  eventDetails,
  customEventInput,
  isCustomEventType,
  selectedServices = [],
  specifications,
  estimation,
  submitting,
  onSubmitOrder,
}) => {
  // LOOP 24: DEFENSIVE ARRAY MAPPING & LED CHECK
  const safeServices = selectedServices || [];
  const hasLedWall = safeServices.some(
    (s) => s?.category === 'DISPLAY' || s?.name?.toUpperCase().includes('LED')
  );

  return (
    <div>
      <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 28px 0', color: 'var(--text-primary)' }}>
        Step 6: Review & Confirm Order
      </h2>
      <div
        style={{
          backgroundColor: 'var(--bg-input)',
          padding: '24px',
          borderRadius: '18px',
          marginBottom: '28px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          <strong>Event:</strong> {isCustomEventType ? customEventInput || 'Custom Event' : eventDetails?.eventType} ({eventDetails?.eventDate})
        </div>
        <div style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          <strong>Venue:</strong> {eventDetails?.venueAddress}
        </div>
        <div style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          <strong>Selected Services ({safeServices.length}):</strong>{' '}
          {safeServices.map((s) => s?.name).filter(Boolean).join(', ') || 'None selected'}
        </div>
        {hasLedWall && (
          <div style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--text-primary)' }}>
            <strong>LED Wall Dimensions:</strong> {specifications?.ledWidthFeet} x {specifications?.ledHeightFeet} ft
          </div>
        )}
        <div style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          <strong>Distance:</strong> {specifications?.transportDistanceKm} km
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#C97A13', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Estimated Grand Total: {formatCurrency(estimation?.grandTotal || 0)}</span>
          <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            30% Advance: {formatCurrency(estimation?.advanceRequired || ((estimation?.grandTotal || 0) * 0.3))}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={onSubmitOrder}
        style={{
          width: '100%',
          backgroundColor: '#C97A13',
          color: '#FFFFFF',
          fontWeight: '800',
          fontSize: '18px',
          padding: '18px 28px',
          borderRadius: '16px',
          border: 'none',
          cursor: submitting ? 'wait' : 'pointer',
          boxShadow: '0 10px 20px rgba(201, 122, 19, 0.3)',
        }}
      >
        {submitting ? 'Submitting Order...' : 'Submit Order for Admin Review'}
      </button>
    </div>
  );
};
