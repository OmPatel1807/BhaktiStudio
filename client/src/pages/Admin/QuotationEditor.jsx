import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { getAdvancePercentage } from '../../services/pricingService';

export const QuotationEditor = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Editable Form Inputs & Default Overheads
  const [setupFee, setSetupFee] = useState(2000);
  const [transportFee, setTransportFee] = useState(1000);
  const [technicianFee, setTechnicianFee] = useState(1500);
  const [discounts, setDiscounts] = useState(0);
  const [gstRate, setGstRate] = useState(18);

  // Dynamic Custom Additional Line Items
  const [customLineItems, setCustomLineItems] = useState([]);
  const [editedItems, setEditedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          const orderData = json.data;
          setOrder(orderData);

          const rawItems = orderData.orderItems || orderData.items || orderData.services || [];
          setEditedItems(
            rawItems.map((item) => ({
              id: item.id,
              serviceName: item.serviceName || item.name || item.service?.name || 'Service Item',
              widthFt: item.widthFt || item.widthFeet || null,
              heightFt: item.heightFt || item.heightFeet || null,
              quantity: Number(item.quantity) || 1,
              estimatedRate: Number(item.estimatedRate || item.finalRate || item.baseRate || item.unitRate) || 0,
              finalRate: Number(item.finalRate || item.estimatedRate || item.baseRate || item.unitRate) || 0,
            }))
          );

          // Calculate default transport fee based on distance if applicable
          if (orderData.distanceKm && Number(orderData.distanceKm) > 0) {
            const calculatedTransport = Number(orderData.distanceKm) * 50; // ₹50/km rate
            setTransportFee(calculatedTransport);
          }

          const latest = orderData.quotations?.[0];
          if (latest) {
            setSetupFee(Number(latest.setupFee) !== undefined ? Number(latest.setupFee) : 2000);
            setTransportFee(Number(latest.transportFee) !== undefined ? Number(latest.transportFee) : 1000);
            setTechnicianFee(Number(latest.technicianFee) !== undefined ? Number(latest.technicianFee) : 1500);
            setDiscounts(Number(latest.discounts) || 0);
          }
        }
      } catch (err) {
        showToast('Failed to load order details', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/quotations/${orderId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setHistory(json.data);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };

    if (token && orderId) {
      fetchOrderDetails();
      fetchHistory();
    }
  }, [orderId, token]);

  // Handlers for Custom Line Items
  const handleAddCustomCharge = () => {
    setCustomLineItems([
      ...customLineItems,
      { id: Date.now(), label: '', amount: 0 },
    ]);
  };

  const handleUpdateCustomCharge = (id, field, value) => {
    setCustomLineItems(
      customLineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveCustomCharge = (id) => {
    setCustomLineItems(customLineItems.filter((item) => item.id !== id));
  };

  const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

  const [discountType, setDiscountType] = useState('FIXED');

  // Real-Time Derived Calculations
  const itemsSubtotal = round2(
    editedItems.reduce(
      (sum, item) =>
        sum +
        (Number(item.finalRate || item.estimatedRate) || 0) *
          (Number(item.quantity) || 1) *
          (Number(item.days) || 1),
      0
    )
  );

  const customChargesSum = round2(
    customLineItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    )
  );

  const additionalFeesTotal = round2(
    Number(setupFee || 0) + Number(transportFee || 0) + Number(technicianFee || 0) + customChargesSum
  );
  const grossSubtotal = round2(itemsSubtotal + additionalFeesTotal);

  const discountVal = Number(discounts || 0);
  const discountAmount = discountType === 'PERCENT'
    ? round2(itemsSubtotal * (discountVal / 100))
    : round2(discountVal);

  const taxableAmount = Math.max(0, round2(grossSubtotal - discountAmount));
  const taxAmount = round2((taxableAmount * Number(gstRate || 0)) / 100);
  const grandTotal = round2(taxableAmount + taxAmount);
  const mandatoryAdvance = round2((grandTotal * getAdvancePercentage()) / 100);
  const remainingBalance = round2(grandTotal - mandatoryAdvance);

  const currentVersionNumber = history.length > 0 ? (history[0].versionNumber || 1) + 1 : 1;

  const handleApproveAndSendQuotation = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/quotations/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          setupFee: Number(setupFee),
          transportFee: Number(transportFee),
          technicianFee: Number(technicianFee),
          discounts: Number(discounts),
          gstRate: Number(gstRate),
          customLineItems,
          items: editedItems,
        }),
      });

      const json = await res.json();
      setSaving(false);

      if (json.success) {
        showToast(`Quotation Version V${currentVersionNumber} Approved & Sent to Customer!`);
        setTimeout(() => navigate('/admin/orders'), 1500);
      } else {
        showToast(json.message || 'Failed to update quotation.', 'error');
      }
    } catch (err) {
      setSaving(false);
      showToast('Network error saving quotation.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '18px' }}>
        Loading Quotation Studio...
      </div>
    );
  }

  const isOutstation = order?.requiresCustomTransport || (order?.distanceKm && Number(order.distanceKm) > 25);
  const orderReference = order?.orderNumber || order?.orderRef || 'BS-2026-00001';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '32px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '600',
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#C97A13', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ADMIN QUOTATION STUDIO • ORDER #{orderReference}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
              Edit & Approve Quotation (V{currentVersionNumber})
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: '#C97A13',
              border: '1px solid #C97A13',
              fontWeight: '700',
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            📜 Version History ({history.length})
          </button>
        </div>

        {/* Outstation Transport Flag Alert Banner */}
        {isOutstation && (
          <div
            style={{
              backgroundColor: 'rgba(201, 122, 19, 0.15)',
              border: '1px solid #C97A13',
              color: '#C97A13',
              padding: '16px 20px',
              borderRadius: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🚚</span>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px' }}>
                  Outstation Transport Flagged ({order?.distanceKm || '> 25'} km)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  This venue exceeds standard local delivery. Please set outstation vehicle fuel & driver surcharge under Transportation Fee.
                </div>
              </div>
            </div>
            <span style={{ backgroundColor: '#C97A13', color: '#FFFFFF', fontWeight: '800', fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}>
              OUTSTATION
            </span>
          </div>
        )}

        {/* 2 Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Line Items & Overheads Editor */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              padding: '28px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: 0, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Itemized Quotation Line Items
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <th style={{ padding: '12px 8px' }}>Service / Equipment</th>
                  <th style={{ padding: '12px 8px' }}>Dimensions</th>
                  <th style={{ padding: '12px 8px' }}>Qty</th>
                  <th style={{ padding: '12px 8px' }}>Approved Rate (₹)</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {editedItems.map((item, idx) => {
                  const rate = Number(item.finalRate || item.estimatedRate || 0);
                  const qty = Number(item.quantity || 1);
                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.serviceName}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {item.widthFt ? `${item.widthFt} x ${item.heightFt} ft` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => {
                            const updated = [...editedItems];
                            updated[idx].quantity = e.target.value;
                            setEditedItems(updated);
                          }}
                          style={{
                            width: '60px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <input
                          type="number"
                          value={rate}
                          onChange={(e) => {
                            const updated = [...editedItems];
                            updated[idx].finalRate = e.target.value;
                            setEditedItems(updated);
                          }}
                          style={{
                            width: '100px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px',
                            fontWeight: '700',
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', color: '#C97A13' }}>
                        {formatCurrency(rate * qty)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Standard Overheads Section */}
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
              Standard Overheads & Fees
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Technician & Rigging Fee (₹)
                </label>
                <input
                  type="number"
                  value={technicianFee}
                  onChange={(e) => setTechnicianFee(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontWeight: '600',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: isOutstation ? '#C97A13' : 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Transportation & Vehicle Fee (₹)</span>
                  {isOutstation && <span style={{ fontWeight: '800' }}>Outstation</span>}
                </label>
                <input
                  type="number"
                  value={transportFee}
                  onChange={(e) => setTransportFee(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    color: isOutstation ? '#C97A13' : 'var(--text-primary)',
                    border: isOutstation ? '2px solid #C97A13' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontWeight: '700',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Site Setup & Crew Logistics Fee (₹)
                </label>
                <input
                  type="number"
                  value={setupFee}
                  onChange={(e) => setSetupFee(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontWeight: '600',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Admin Promotional Discount (₹)
                </label>
                <input
                  type="number"
                  value={discounts}
                  onChange={(e) => setDiscounts(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    color: '#EF4444',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontWeight: '700',
                  }}
                />
              </div>
            </div>

            {/* Custom Additional Line Items Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                  Extra Charges & Custom Line Items
                </h4>
                <button
                  type="button"
                  onClick={handleAddCustomCharge}
                  style={{
                    backgroundColor: 'rgba(201, 122, 19, 0.15)',
                    color: '#C97A13',
                    border: '1px solid #C97A13',
                    fontWeight: '700',
                    fontSize: '13px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Extra Charge / Custom Item
                </button>
              </div>

              {customLineItems.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px 0' }}>
                  No extra charges added. Click above to add items like Generator Fuel, Permits, or Special Insurance.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {customLineItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Charge Description (e.g. Generator Fuel)"
                        value={item.label}
                        onChange={(e) => handleUpdateCustomCharge(item.id, 'label', e.target.value)}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '14px',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>₹</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => handleUpdateCustomCharge(item.id, 'amount', e.target.value)}
                          style={{
                            width: '110px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontWeight: '700',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomCharge(item.id)}
                        title="Remove Charge"
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>
                Quotation Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(itemsSubtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Technician / Setup:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(technicianFee || 0) + Number(setupFee || 0))}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isOutstation ? '#C97A13' : 'var(--text-secondary)' }}>Transport Charge:</span>
                  <span style={{ color: isOutstation ? '#C97A13' : 'var(--text-primary)', fontWeight: isOutstation ? '800' : 'normal' }}>
                    {formatCurrency(transportFee)}
                  </span>
                </div>

                {customChargesSum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C97A13' }}>
                    <span>Custom Extra Charges:</span>
                    <span style={{ fontWeight: '700' }}>{formatCurrency(customChargesSum)}</span>
                  </div>
                )}

                {Number(discounts) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(discounts)}</span>
                  </div>
                )}

                {/* Editable GST Tax Percentage Selector */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>GST Tax Rate (%):</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        style={{
                          width: '65px',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}
                      />
                      <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tax Amount:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{formatCurrency(taxAmount)}</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '2px solid var(--border-color)',
                    paddingTop: '14px',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: '800',
                    fontSize: '20px',
                    color: '#C97A13',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>{getAdvancePercentage()}% Mandatory Advance:</span>
                  <span>{formatCurrency(mandatoryAdvance)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleApproveAndSendQuotation}
              style={{
                marginTop: '24px',
                width: '100%',
                backgroundColor: '#C97A13',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '15px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(201, 122, 19, 0.3)',
              }}
            >
              {saving ? 'Saving...' : `Approve & Dispatch V${currentVersionNumber}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuotationBuilder = QuotationEditor;
