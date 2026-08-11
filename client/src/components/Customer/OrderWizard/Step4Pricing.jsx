import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export const Step4Pricing = ({ calculatingEstimate, estimation, selectedServices = [] }) => {
  const isSelectionEmpty = selectedServices.length === 0;

  // Fallback financial summary object evaluating strictly to 0 when no services selected
  const summary = isSelectionEmpty
    ? {
        servicesSubtotal: 0,
        setupFeeTotal: 0,
        transportFee: 0,
        taxPercentage: 18,
        taxAmount: 0,
        grandTotal: 0,
      }
    : estimation || {
        servicesSubtotal: 0,
        setupFeeTotal: 0,
        transportFee: 0,
        taxPercentage: 18,
        taxAmount: 0,
        grandTotal: 0,
      };

  return (
    <div>
      <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 28px 0', color: 'var(--text-primary)' }}>
        Step 4: Live Estimated Pricing Breakdown
      </h2>

      {calculatingEstimate ? (
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Calculating live estimate...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Services & Equipment Subtotal:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.servicesSubtotal)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Estimated Setup Charge:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.setupFeeTotal)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Transportation Charge:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.transportFee)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>GST ({summary.taxPercentage}%):</span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.taxAmount)}</strong>
          </div>

          <div
            style={{
              borderTop: '2px solid var(--border-color)',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '800',
              fontSize: '22px',
              color: '#C97A13',
            }}
          >
            <span>Estimated Total:</span>
            <span>{formatCurrency(summary.grandTotal)}</span>
          </div>

          {isSelectionEmpty && (
            <p style={{ fontSize: '14px', color: '#DC2626', marginTop: '8px', fontWeight: '600' }}>
              ℹ️ No services selected. Please select at least one service in Step 2 to receive a valid estimate.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
