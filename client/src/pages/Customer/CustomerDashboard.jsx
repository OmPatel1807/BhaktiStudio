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
            className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: '24px',
              alignItems: 'start',
              width: '100%',
            }}
          >
            {orders.map((ord) => {
              // Use existing resolution helper with comprehensive fallbacks
              const { displayTotal, label: totalLabel } = typeof resolveOrderDisplayTotal === 'function'
                ? resolveOrderDisplayTotal(ord)
                : {
                    displayTotal: Number(ord.quotations?.[0]?.grandTotal || ord.quotations?.[0]?.totalAmount || ord.totalAmount || ord.grandTotal || 0),
                    label: 'Quotation Total'
                  };

              const finalAmount = Number(displayTotal || ord.quotations?.[0]?.grandTotal || ord.totalAmount || 0);

              return (
                <div
                  key={ord.id || ord._id}
                  className="w-full bg-[#111A2E] light:bg-[#FAF9F6] border border-slate-800 light:border-[#E6DFD5] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-lg hover:border-amber-500/40 transition-all h-full"
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-extrabold tracking-wider text-amber-400">
                        {ord.orderNumber || `BS-2026-${String(ord.id).padStart(5, '0')}`}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {ord.status || 'SUBMITTED'}
                      </span>
                    </div>

                    {/* Event Details */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 light:text-[#2B2B2B] mb-2">
                      {ord.eventType || 'Event Booking'}
                    </h3>
                    <div className="space-y-1 text-xs text-slate-400 mb-6">
                      <p className="flex items-center gap-1.5 truncate">
                        <span>📍 Venue:</span> <span className="text-slate-300 font-medium">{ord.venueAddress || 'Not specified'}</span>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <span>🗓 Event Date:</span> <span className="text-slate-300 font-medium">{typeof formatDateTime === 'function' ? formatDateTime(ord.eventDate) : (ord.eventDate || 'TBD')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Real Resolved Quotation Total & Responsive Actions */}
                  <div className="pt-4 border-t border-slate-800/80 light:border-[#E6DFD5] flex flex-col gap-3.5 mt-auto">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {totalLabel || 'QUOTATION TOTAL'}
                      </span>
                      <span className="text-2xl font-black text-amber-400 light:text-[#2B2B2B]">
                        ₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5 w-full">
                      {ord.paymentStatus !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => {
                            const latestQuotation = ord.quotations?.[0];
                            if (typeof setPaymentModalState === 'function') {
                              setPaymentModalState({ isOpen: true, order: ord, quotation: latestQuotation });
                            }
                          }}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>💳</span> Pay Online Now
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2.5 w-full">
                        {ord.status === 'SUBMITTED' ? (
                          <button
                            type="button"
                            onClick={() => typeof handleEditOrder === 'function' && handleEditOrder(ord)}
                            className="w-full py-2 bg-slate-800/70 hover:bg-slate-700 light:bg-[#FAF9F6] text-slate-200 light:text-[#2B2B2B] border border-slate-700 light:border-[#E6DFD5] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>✏️</span> Edit Order
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => typeof setSelectedOrder === 'function' && setSelectedOrder(ord)}
                          className={`w-full py-2 bg-[#0B1120] hover:bg-slate-900 light:bg-[#FAF9F6] text-slate-300 light:text-[#2B2B2B] border border-slate-800 light:border-[#E6DFD5] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${ord.status !== 'SUBMITTED' ? 'col-span-2' : ''}`}
                        >
                          <span>👁️</span> View Details
                        </button>
                      </div>
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
