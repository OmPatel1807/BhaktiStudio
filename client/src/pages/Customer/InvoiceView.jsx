import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const InvoiceView = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/v1/payments/${orderId}/invoice`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setInvoice(json.data);
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token && orderId) fetchInvoice();
  }, [orderId, token]);

  if (loading) {
    return <div style={{ padding: '40px', color: '#94A3B8', textAlign: 'center' }}>Generating GST Invoice...</div>;
  }

  if (!invoice) {
    return <div style={{ padding: '40px', color: '#EF4444', textAlign: 'center' }}>Invoice not found.</div>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A', // Obsidian Dark
        color: '#F8FAFC',
        padding: '40px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              fontWeight: '700',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
            }}
          >
            🖨️ Print / Download PDF
          </button>
        </div>

        {/* Invoice Printable Card */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '24px',
            border: '1px solid #334155',
            padding: '40px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '24px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                BHAKTI <span style={{ color: '#F59E0B' }}>STUDIO</span>
              </h1>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
                Professional Event Production & LED Wall Rentals
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                GSTIN: 29AAAAA0000A1Z5 • Email: billing@bhaktistudio.com
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B' }}>
                {invoice.invoiceNumber}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                Date: {formatDateTime(invoice.invoiceDate)}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                OrderRef: <strong>{invoice.orderNumber}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Event Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>Billed To:</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px' }}>{invoice.customer?.name}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>{invoice.customer?.email}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>{invoice.customer?.phone || 'No phone'}</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>Event Details:</div>
              <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '4px' }}>{invoice.eventDetails?.eventType}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>📍 {invoice.eventDetails?.venueAddress}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>🗓️ {formatDateTime(invoice.eventDetails?.eventDate)}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '32px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: '13px' }}>
                <th style={{ padding: '12px 8px' }}>Item Description</th>
                <th style={{ padding: '12px 8px' }}>Qty / Specs</th>
                <th style={{ padding: '12px 8px' }}>Rate (₹)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.orderItems?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '600' }}>{item.serviceName}</td>
                  <td style={{ padding: '12px 8px', color: '#94A3B8' }}>
                    {item.widthFt ? `${item.widthFt} x ${item.heightFt} ft` : `Qty: ${item.quantity}`}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{formatCurrency(item.finalRate || item.estimatedRate)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700' }}>
                    {formatCurrency((item.finalRate || item.estimatedRate) * (item.quantity || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Services Subtotal:</span>
                <span>{formatCurrency(invoice.financialSummary?.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Setup Charge:</span>
                <span>{formatCurrency(invoice.financialSummary?.setupFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Transport Fee:</span>
                <span>{formatCurrency(invoice.financialSummary?.transportFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                <span>Discounts:</span>
                <span>-{formatCurrency(invoice.financialSummary?.discounts)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>GST Tax:</span>
                <span>{formatCurrency(invoice.financialSummary?.taxAmount)}</span>
              </div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', color: '#F59E0B' }}>
                <span>Grand Total:</span>
                <span>{formatCurrency(invoice.financialSummary?.grandTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: '700' }}>
                <span>Total Paid:</span>
                <span>{formatCurrency(invoice.financialSummary?.totalPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444', fontWeight: '700' }}>
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.financialSummary?.balanceDue)}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '20px', fontSize: '12px', color: '#64748B' }}>
            Thank you for choosing Bhakti Studio for your event production needs.
          </div>
        </div>
      </div>
    </div>
  );
};
