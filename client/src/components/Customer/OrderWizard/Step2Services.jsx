import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export const Step2Services = ({
  loadingServices,
  availableServices = [],
  selectedServiceIds = [],
  serviceQuantities = {},
  onToggleServiceSelection,
  onUpdateQuantity,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
          {(availableServices || []).map((svc) => {
            const isSelected = selectedServiceIds.includes(svc.id);
            const isAreaBased = Boolean(
              svc.category === 'DISPLAY' ||
              svc.name?.toUpperCase().includes('LED') ||
              svc.pricingModel === 'AREA_BASED'
            );
            const qty = serviceQuantities[svc.id] || 1;
            const liveTotal = isAreaBased ? svc.baseRate : (svc.baseRate * qty);

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
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#C97A13', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {svc.category}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '12px', backgroundColor: '#C97A13', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                        SELECTED
                      </span>
                    )}
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

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Rate:</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                      {formatCurrency(svc.baseRate)} {isAreaBased ? '/ sq ft' : ''}
                    </strong>
                  </div>

                  {/* Multi-Quantity Stepper vs Selection Trigger */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {!isSelected ? (
                      <button
                        type="button"
                        onClick={() => onToggleServiceSelection(svc.id)}
                        style={{
                          width: '100%',
                          backgroundColor: '#C97A13',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        + Add to Booking
                      </button>
                    ) : isAreaBased ? (
                      <div style={{ fontSize: '13px', color: '#C97A13', fontWeight: '700' }}>
                        📐 Dimensions configured in Step 3
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Quantity:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity?.(svc.id, Math.max(1, qty - 1));
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              fontWeight: '900',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#C97A13', minWidth: '20px', textAlign: 'center' }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity?.(svc.id, qty + 1);
                            }}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              fontWeight: '900',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isSelected && !isAreaBased && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Item Total:</span>
                      <strong style={{ color: '#C97A13', fontSize: '16px' }}>{formatCurrency(liveTotal)}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
