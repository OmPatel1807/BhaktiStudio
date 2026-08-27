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
  const safeServices = selectedServices || [];
  const hasLedWall = safeServices.some(
    (s) => s?.category === 'DISPLAY' || s?.name?.toUpperCase().includes('LED')
  );

  const durationDays = Number(eventDetails?.totalDays || 1);
  const isMultiDay = Boolean(eventDetails?.isMultiDay || durationDays > 1);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {isCustomEventType ? customEventInput || 'Custom Event' : eventDetails?.eventType}
          </div>
          {isMultiDay ? (
            <span style={{ backgroundColor: 'rgba(201, 122, 19, 0.2)', color: '#C97A13', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>
              ⚡ Multi-Day: {durationDays} Days ({eventDetails?.eventDate} to {eventDetails?.endDate || eventDetails?.eventDate})
            </span>
          ) : (
            <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
              📅 Single-Day: {eventDetails?.eventDate}
            </span>
          )}
        </div>

        <div style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-primary)' }}>
          <strong>📍 Venue:</strong> {eventDetails?.venueAddress} ({specifications?.transportDistanceKm || 0} km)
        </div>
        <div style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          <strong>⏰ Timing:</strong> {eventDetails?.startTime} - {eventDetails?.endTime}
        </div>

        {/* Granular Line Items Breakdown Table */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#C97A13', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
            Itemized Equipment & Services ({safeServices.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeServices.map((service, idx) => {
              const isLed = service?.category === 'DISPLAY' || service?.name?.toUpperCase().includes('LED');
              const area = isLed ? Number(specifications?.ledWidthFeet || 12) * Number(specifications?.ledHeightFeet || 8) : 0;
              const unitRate = Number(service?.baseRate || service?.price || 0);
              const qty = Number(service?.quantity || 1);
              const lineTotal = isLed
                ? (unitRate > 500 && area > 1 ? unitRate : unitRate * area) * durationDays * qty
                : unitRate * qty * durationDays;

              return (
                <div
                  key={service?.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{service?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {isLed ? (
                        `${area} sq ft (${specifications?.ledWidthFeet}×${specifications?.ledHeightFeet} ft) @ ${formatCurrency(unitRate)}/sqft × ${durationDays} ${durationDays > 1 ? 'Days' : 'Day'}`
                      ) : (
                        `${qty} ${qty > 1 ? 'Units' : 'Unit'} × ${formatCurrency(unitRate)}/day × ${durationDays} ${durationDays > 1 ? 'Days' : 'Day'}`
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: '800', color: '#C97A13' }}>
                    {formatCurrency(lineTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: '20px', fontWeight: '800', color: '#C97A13', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
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
