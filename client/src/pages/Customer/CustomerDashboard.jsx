import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { resolveOrderDisplayTotal } from '../../utils/quotationMath';
import { OrderDetailsModal } from '../../components/Customer/OrderDetailsModal';
import { PaymentModal } from '../../components/Customer/PaymentModal';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentModalState, setPaymentModalState] = useState({ isOpen: false, order: null, quotation: null });
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/v1/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrders(json.data);
      } else {
        setFetchError(json.message || 'Unable to load your bookings right now.');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setFetchError('Unable to reach the server. It may be starting up — please retry in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_status') === 'success') {
      const orderRef = params.get('orderNumber') || 'BS-2026-00001';
      setPaymentSuccessMsg(`🎉 Payment Confirmed! Your booking reference #${orderRef} is now Confirmed.`);
      if (token) fetchOrders();
    }
  }, [location.search, token]);

  const handleEditOrder = (ord) => {
    navigate(`/customer/new-order?edit=${ord.id}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: 'clamp(20px, 4vw, 48px) clamp(12px, 3vw, 32px)',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {paymentSuccessMsg && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              color: '#10B981',
              padding: '20px 24px',
              borderRadius: '20px',
              marginBottom: '32px',
              fontSize: '18px',
              fontWeight: '800',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div>{paymentSuccessMsg}</div>
            <button
              type="button"
              onClick={() => setPaymentSuccessMsg(null)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#10B981', fontSize: '20px', cursor: 'pointer', fontWeight: '800' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Welcome back, {user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'Customer')} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '6px 0 0 0' }}>
              Track your studio bookings, quotations, and event execution status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/new-order')}
            style={{
              backgroundColor: '#C97A13',
              color: '#FFFFFF',
              fontWeight: '800',
              padding: '14px 28px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(201, 122, 19, 0.35)',
              fontSize: '15px',
              transition: 'transform 0.15s ease',
            }}
          >
            + Create New Order
          </button>
        </div>

        {/* Orders Grid / List Container */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px' }}>
            Loading your bookings...
          </div>
        ) : fetchError ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '24px',
              border: '1px dashed #EF4444',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Couldn't load your bookings
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
              {fetchError}
            </p>
            <button
              type="button"
              onClick={fetchOrders}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontWeight: '800',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔄 Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              border: '1px dashed var(--border-color)',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📜</div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              No active bookings found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
              You haven't submitted any event production or LED rental requests yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/customer/new-order')}
              style={{
                backgroundColor: '#C97A13',
                color: '#FFFFFF',
                fontWeight: '800',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Start Order Wizard
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: '24px',
              alignItems: 'stretch',
              width: '100%',
              marginTop: '24px'
            }}
          >
            {orders && orders.length > 0 ? (
              orders.map((ord) => {
                // Safe total and label resolution using the imported helper
                const resolved = typeof resolveOrderDisplayTotal === 'function'
                  ? resolveOrderDisplayTotal(ord)
                  : null;

                const displayTotal = Number(resolved?.displayTotal ?? ord.quotations?.[0]?.totalAmount ?? ord.quotations?.[0]?.grandTotal ?? ord.totalAmount ?? ord.grandTotal ?? 0);
                const totalLabel = resolved?.label ?? 'QUOTATION TOTAL';

                return (
                  <div
                    key={ord.id || ord._id}
                    style={{
                      backgroundColor: '#111A2E',
                      border: '1px solid #1E293B',
                      borderRadius: '20px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '20px',
                      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.4)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Card Top: Order Number & Status Pill */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '800', color: '#F59E0B', fontSize: '15px', letterSpacing: '0.5px' }}>
                          {ord.orderNumber || `BS-2026-${String(ord.id).padStart(5, '0')}`}
                        </span>
                        <span
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {ord.status || 'SUBMITTED'}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0', color: '#FFFFFF' }}>
                        {ord.eventType || 'Event Booking'}
                      </h3>

                      {/* Event Location & Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#94A3B8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📍</span>
                          <strong style={{ color: '#64748B' }}>Venue:</strong>
                          <span style={{ color: '#CBD5E1' }}>{ord.venueAddress || 'Surat'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🗓️</span>
                          <strong style={{ color: '#64748B' }}>Event Date:</strong>
                          <span style={{ color: '#CBD5E1' }}>
                            {typeof formatDateTime === 'function' ? formatDateTime(ord.eventDate) : (ord.eventDate || 'TBD')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Quotation Total & Action Buttons */}
                    <div
                      style={{
                        borderTop: '1px solid #1E293B',
                        paddingTop: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        marginTop: 'auto'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {totalLabel}
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#F59E0B', marginTop: '2px' }}>
                          ₹{displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Button Actions Group */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        {ord.paymentStatus !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => {
                              const latestQuotation = ord.quotations?.[0];
                              if (typeof setPaymentModalState === 'function') {
                                setPaymentModalState({ isOpen: true, order: ord, quotation: latestQuotation });
                              }
                            }}
                            style={{
                              width: '100%',
                              backgroundColor: '#F59E0B',
                              color: '#090D16',
                              padding: '11px 16px',
                              borderRadius: '12px',
                              fontWeight: '800',
                              fontSize: '13px',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>💳</span> Pay Online Now
                          </button>
                        )}

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: ord.status === 'SUBMITTED' ? '1fr 1fr' : '1fr',
                            gap: '10px',
                            width: '100%'
                          }}
                        >
                          {ord.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={() => typeof handleEditOrder === 'function' && handleEditOrder(ord)}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                color: '#F8FAFC',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>✏️</span> Edit Order
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => typeof setSelectedOrder === 'function' && setSelectedOrder(ord)}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#0B1120',
                              color: '#CBD5E1',
                              border: '1px solid #1E293B',
                              borderRadius: '12px',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px'
                            }}
                          >
                            <span>👁️</span> View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '48px 0', textAlign: 'center', color: '#64748B' }}>
                No active orders found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onOpenPaymentModal={(ord, quote) => {
          setPaymentModalState({ isOpen: true, order: ord, quotation: quote });
        }}
      />

      {/* Payment Gateway Modal */}
      <PaymentModal
        order={paymentModalState.order}
        quotation={paymentModalState.quotation}
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false, order: null, quotation: null })}
        onPaymentSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
};
