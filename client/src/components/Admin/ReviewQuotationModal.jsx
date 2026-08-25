import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const ReviewQuotationModal = ({ order, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [setupFee, setSetupFee] = useState(2000);
  const [transportFee, setTransportFee] = useState(1000);
  const [technicianFee, setTechnicianFee] = useState(1500);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('FIXED');
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (order) {
      const rawItems = order.orderItems || order.items || order.services || [];
      setItems(
        rawItems.map((item) => ({
          id: item.id,
          name: item.serviceName || item.name || item.service?.name || 'Service Item',
          estimatedRate: Number(item.estimatedRate || item.baseRate || 0),
          finalRate: Number(item.finalRate || item.estimatedRate || item.baseRate || 0),
          quantity: Number(item.quantity) || 1,
          days: Number(item.days || 1),
        }))
      );

      // Populate distance-based transport if applicable
      if (order.distanceKm && Number(order.distanceKm) > 0) {
        setTransportFee(Number(order.distanceKm) * 50);
      }

      // Initialize from previous quotation version if exists
      const latestQuote = order.quotations?.[0];
      if (latestQuote) {
        setSetupFee(Number(latestQuote.setupFee) ?? 2000);
        setTransportFee(Number(latestQuote.transportFee) ?? 1000);
        setTechnicianFee(Number(latestQuote.technicianFee) ?? 1500);
        setDiscount(Number(latestQuote.discounts) ?? 0);
        setGstRate(18);
      }
      setErrorMsg(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  // Real-Time Math
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.finalRate * item.quantity * item.days), 0);
  const additionalFees = Number(setupFee || 0) + Number(transportFee || 0) + Number(technicianFee || 0);
  const grossSubtotal = itemsSubtotal + additionalFees;
  const discountAmount = discountType === 'PERCENT' ? (itemsSubtotal * (Number(discount || 0) / 100)) : Number(discount || 0);
  const taxableAmount = Math.max(0, grossSubtotal - discountAmount);
  const taxAmount = (taxableAmount * Number(gstRate || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleUpdateItemRate = (id, newRate) => {
    setItems(items.map(item => item.id === id ? { ...item, finalRate: Number(newRate) || 0 } : item));
  };

  const handleUpdateItemQty = (id, newQty) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity: Number(newQty) || 1 } : item));
  };

  const handleSubmitQuotation = async (actionType) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}/quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionType, // 'ACCEPT_AND_QUOTE' | 'REJECT'
          items: items.map(i => ({ id: i.id, finalRate: i.finalRate, quantity: i.quantity })),
          discount: Number(discount),
          discountType,
          setupFee: Number(setupFee),
          transportFee: Number(transportFee),
          technicianFee: Number(technicianFee),
          gstRate: Number(gstRate),
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess(
          actionType === 'REJECT'
            ? `Order #${order.orderNumber} rejected.`
            : `Quotation published & sent for Order #${order.orderNumber}!`
        );
        onClose();
      } else {
        setErrorMsg(json.message || 'Operation failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          boxSizing: 'border-box',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ color: '#F59E0B', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Order Review Engine
            </span>
            <h2 style={{ color: '#FFFFFF', margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800' }}>
              Review & Price Quotation: #{order.orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#EF4444', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Event Metadata Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', backgroundColor: '#0F172A', padding: '16px', borderRadius: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Event Type</div>
              <div style={{ fontSize: '14px', color: '#F8FAFC', fontWeight: '700', marginTop: '2px' }}>{order.eventType}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Venue</div>
              <div style={{ fontSize: '14px', color: '#F8FAFC', fontWeight: '700', marginTop: '2px' }}>{order.venueAddress}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Distance</div>
              <div style={{ fontSize: '14px', color: '#F59E0B', fontWeight: '700', marginTop: '2px' }}>{order.distanceKm ? `${order.distanceKm} km` : 'Local'}</div>
            </div>
          </div>

          {/* Service Line Items list */}
          <div>
            <h3 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '800', margin: '0 0 12px 0' }}>Adjust Service Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '14px' }}>
                    {item.name}
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Base Est: ₹{item.estimatedRate.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '700' }}>QUANTITY</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemQty(item.id, e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '6px 8px', color: '#FFFFFF', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px', fontWeight: '700' }}>RATE (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={item.finalRate}
                      onChange={(e) => handleUpdateItemRate(item.id, e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '6px 8px', color: '#FFFFFF', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>SUBTOTAL</div>
                    <div style={{ color: '#F59E0B', fontWeight: '800', fontSize: '15px', marginTop: '4px' }}>
                      ₹{(item.finalRate * item.quantity * item.days).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Add-ons & Overheads */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Setup & Rigging (₹)</label>
              <input
                type="number"
                value={setupFee}
                onChange={(e) => setSetupFee(Number(e.target.value) || 0)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Transport / Logistics (₹)</label>
              <input
                type="number"
                value={transportFee}
                onChange={(e) => setTransportFee(Number(e.target.value) || 0)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Technician Support (₹)</label>
              <input
                type="number"
                value={technicianFee}
                onChange={(e) => setTechnicianFee(Number(e.target.value) || 0)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Discount Engine */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Discount Value</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="FIXED">Flat INR (₹)</option>
                <option value="PERCENT">Percentage (%)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Quotation Notes / Terms override</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. GST inclusive, standard advance required"
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#FFFFFF', boxSizing: 'border-box' }}
            />
          </div>

          {/* Real-time Pricing Summary Box */}
          <div style={{ backgroundColor: '#0F172A', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
              <span>Items Subtotal:</span>
              <span style={{ color: '#FFFFFF', fontWeight: '700' }}>₹{itemsSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
              <span>Overheads (Setup + Transport + Tech):</span>
              <span style={{ color: '#FFFFFF', fontWeight: '700' }}>+ ₹{additionalFees.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#F87171' }}>
                <span>Discount:</span>
                <span style={{ fontWeight: '700' }}>- ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
              <span>GST (18%):</span>
              <span style={{ color: '#FFFFFF', fontWeight: '700' }}>+ ₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#FFFFFF', fontWeight: '800', fontSize: '15px' }}>Grand Payable Total:</span>
              <span style={{ color: '#F59E0B', fontWeight: '900', fontSize: '24px' }}>
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitQuotation('REJECT')}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              border: '1px solid #EF4444',
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ❌ Reject booking request
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#94A3B8',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitQuotation('ACCEPT_AND_QUOTE')}
              style={{
                backgroundColor: '#F59E0B',
                color: '#090D16',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 28px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              }}
            >
              {submitting ? 'Publishing...' : '📄 Publish & Send Quotation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
