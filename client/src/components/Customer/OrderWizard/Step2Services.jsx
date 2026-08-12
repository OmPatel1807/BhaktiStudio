import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export const Step2Services = ({
  loadingServices,
  availableServices = [],
  selectedServiceIds = [],
  onToggleServiceSelection,
}) => {
  const isSelectionEmpty = selectedServiceIds.length === 0;

  return (
    <div>
      <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 28px 0', color: 'var(--text-primary)' }}>
        Step 2: Select Services & Equipment
      </h2>

      {/* Validation Warning Alert */}
      {isSelectionEmpty && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            color: '#DC2626',
            padding: '14px 18px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '600',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>⚠️</span>
          <span>Please select at least one service or equipment to proceed.</span>
        </div>
      )}

      {loadingServices ? (
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading catalog...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', width: '100%' }}>
          {(availableServices || []).map((svc) => {
            const isSelected = selectedServiceIds.includes(svc.id);
            return (
              <div
                key={svc.id}
                onClick={() => onToggleServiceSelection(svc.id)}
                style={{
                  backgroundColor: isSelected ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                  border: isSelected ? '2px solid #C97A13' : '1px solid var(--border-color)',
                  borderRadius: '18px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: '#C97A13', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {svc.category}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px', color: 'var(--text-primary)' }}>
                    {svc.name}
                  </div>
                  {svc.description && (
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {svc.description}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Base Rate:</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{formatCurrency(svc.baseRate)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
