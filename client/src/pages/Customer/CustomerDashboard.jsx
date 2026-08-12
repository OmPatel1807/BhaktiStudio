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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '48px 32px',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
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
              Welcome back, {user?.name || 'Customer'} 👋
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              width: '100%',
            }}
          >
            {orders.map((ord) => {
              // LOOP 40: Unified display total resolution
              const { displayTotal, label: totalLabel } = resolveOrderDisplayTotal(ord);

              return (
                <div
                  key={ord.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '24px',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '24px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  {/* Card Header Row: Order Number & Status Pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', color: '#C97A13', fontSize: '20px' }}>
                      {ord.orderNumber}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'rgba(201, 122, 19, 0.15)',
                        color: '#C97A13',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '800',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {ord.status}
                    </span>
                  </div>

                  {/* Card Main Body: Event Title & Location Details */}
                  <div>
                    <h3 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                      {ord.eventType}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      <div>📍 <strong style={{ color: 'var(--text-secondary)' }}>Venue:</strong> {ord.venueAddress}</div>
                      <div>🗓️ <strong style={{ color: 'var(--text-secondary)' }}>Event Date:</strong> {formatDateTime(ord.eventDate)}</div>
                    </div>
                  </div>

                  {/* LOOP 75: Card Footer Row (Responsive Stacking on Mobile) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '20px',
                      marginTop: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {totalLabel}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: '#C97A13', marginTop: '2px' }}>
                        {formatCurrency(displayTotal)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                      {ord.paymentStatus !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => {
                            const latestQuotation = ord.quotations?.[0];
                            setPaymentModalState({ isOpen: true, order: ord, quotation: latestQuotation });
                          }}
                          style={{
                            flex: 1,
                            minWidth: '140px',
                            backgroundColor: '#F59E0B',
                            color: '#0F172A',
                            padding: '12px 18px',
                            borderRadius: '14px',
                            fontWeight: '900',
                            fontSize: '15px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                          }}
                        >
                          💳 Pay Online Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          padding: '12px 18px',
                          borderRadius: '14px',
                          fontWeight: '700',
                          fontSize: '15px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
