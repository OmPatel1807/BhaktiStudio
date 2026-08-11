import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderDetailsModal } from '../../components/Customer/OrderDetailsModal';
import { OrderQrModal } from '../../components/Admin/OrderQrModal';
import { AssignCrewModal } from '../../components/Admin/AssignCrewModal';

export const AdminOrderManager = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Modals & Dropdown state
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState(null);
  const [selectedQrOrder, setSelectedQrOrder] = useState(null);
  const [selectedAssignCrewOrder, setSelectedAssignCrewOrder] = useState(null);
  const [openActionDropdownId, setOpenActionDropdownId] = useState(null);

  useEffect(() => {
    const handleCloseDropdown = () => setOpenActionDropdownId(null);
    window.addEventListener('click', handleCloseDropdown);
    return () => window.removeEventListener('click', handleCloseDropdown);
  }, []);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/orders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllOrders();
  }, [token]);

  const handleMarkCompleted = async (ord) => {
    try {
      const res = await fetch(`/api/v1/orders/${ord.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`Order #${ord.orderNumber} marked as COMPLETED!`);
        setTimeout(() => setToastMsg(''), 3500);
        fetchAllOrders();
      }
    } catch (err) {
      console.error('Failed to complete order:', err);
    }
  };

  // Filter & Search Logic (LOOP 55 Tab Categorization)
  const filteredOrders = orders.filter((ord) => {
    // Status Filter
    if (activeTab === 'PENDING' && !['SUBMITTED', 'UNDER_REVIEW', 'QUOTATION_SENT', 'AWAITING_CUSTOMER_CONFIRMATION', 'DRAFT'].includes(ord.status)) return false;
    if (activeTab === 'CONFIRMED' && !['CONFIRMED', 'WORKERS_ASSIGNED'].includes(ord.status)) return false;
    if (activeTab === 'ACTIVE' && !['SETUP_IN_PROGRESS', 'EVENT_IN_PROGRESS', 'IN_EXECUTION'].includes(ord.status)) return false;
    if (activeTab === 'COMPLETED' && !['EVENT_COMPLETED', 'FINAL_PAYMENT_PENDING', 'COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(ord.status)) return false;

    // Search Query
    if (search) {
      const q = search.toLowerCase();
      const matchOrder = ord.orderNumber.toLowerCase().includes(q);
      const matchCustomer = ord.customer?.name?.toLowerCase().includes(q) || ord.customer?.email?.toLowerCase().includes(q);
      const matchEvent = ord.eventType.toLowerCase().includes(q) || ord.venueAddress.toLowerCase().includes(q);
      return matchOrder || matchCustomer || matchEvent;
    }

    return true;
  });

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
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '800',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
          }}
        >
          {toastMsg}
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Order & Quotation Studio Manager 📦
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '6px 0 0 0' }}>
              Manage customer bookings, edit quotations, track event execution, and issue site access QR codes.
            </p>
          </div>

          <input
            type="text"
            placeholder="🔍 Search Order ID, Customer, Venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '12px 18px',
              width: '340px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          />
        </div>

        {/* LOOP 67: TOUCH-SWIPEABLE FILTER TABS CONTAINER */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '28px',
            backgroundColor: 'var(--bg-surface)',
            padding: '8px',
            borderRadius: '18px',
            border: '1px solid var(--border-color)',
            width: '100%',
            boxSizing: 'border-box',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'ACTIVE', label: 'Active Execution' },
            { id: 'COMPLETED', label: 'Completed / History' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  backgroundColor: isSelected ? '#C97A13' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: isSelected ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(201, 122, 19, 0.3)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* LOOP 68: RESPONSIVE DATA CONTAINER (MOBILE STACKED CARDS + DESKTOP TABLE) */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            padding: '24px 16px',
            boxShadow: isDark ? '0 20px 25px -5px rgba(0,0,0,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.08)',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px' }}>
              Loading order records...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px' }}>
              No order records found matching filter.
            </div>
          ) : (
            <>
              {/* MOBILE STACKED CARDS VIEW (< 768px) */}
              <div className="show-mobile-only" style={{ display: 'none', flexDirection: 'column', gap: '16px' }}>
                {filteredOrders.map((ord) => {
                  const assignedCount = (ord.assignments || []).length;
                  const isConfirmedOrActive = ['CONFIRMED', 'WORKERS_ASSIGNED', 'SETUP_IN_PROGRESS', 'EVENT_IN_PROGRESS'].includes(ord.status);

                  return (
                    <div
                      key={ord.id}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: '#C97A13', fontSize: '16px' }}>
                          {ord.orderNumber}
                        </span>
                        <span
                          style={{
                            backgroundColor: 'rgba(201, 122, 19, 0.15)',
                            color: '#C97A13',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontWeight: '800',
                            fontSize: '11px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                          {ord.customer?.name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {ord.customer?.email || ord.customer?.phone || '-'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{ord.eventType}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            🗓️ {formatDateTime(ord.eventDate)}
                          </div>
                        </div>
                        {isConfirmedOrActive && (
                          <span
                            style={{
                              backgroundColor: assignedCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: assignedCount > 0 ? '#10B981' : '#F59E0B',
                              border: assignedCount > 0 ? '1px solid #10B981' : '1px solid #F59E0B',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: '800',
                              fontSize: '11px',
                            }}
                          >
                            {assignedCount > 0 ? `✅ Crew (${assignedCount})` : '⚠️ Crew Pending'}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div>📍 {ord.venueAddress}</div>
                        {ord.distanceKm && (
                          <div style={{ color: '#C97A13', fontWeight: '700', marginTop: '2px' }}>
                            🚗 {ord.distanceKm} km {ord.requiresCustomTransport && '(Outstation)'}
                          </div>
                        )}
                      </div>

                      {/* MOBILE ACTION BUTTONS GRID */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedDetailsOrder(ord)}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          🔍 Details
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/admin/quotation/${ord.id}`)}
                          style={{
                            backgroundColor: 'rgba(201, 122, 19, 0.15)',
                            color: '#C97A13',
                            border: '1px solid #C97A13',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Quotation
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedQrOrder(ord)}
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3B82F6',
                            border: '1px solid #3B82F6',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          📱 QR Access
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedAssignOrder(ord)}
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10B981',
                            border: '1px solid #10B981',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          👷 Assign Crew
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP DATA TABLE VIEW (>= 768px) */}
              <div className="hidden-mobile" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      <th style={{ padding: '16px 14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Ref</th>
                      <th style={{ padding: '16px 14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Name</th>
                      <th style={{ padding: '16px 14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Type & Date</th>
                      <th style={{ padding: '16px 14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Venue Location</th>
                      <th style={{ padding: '16px 14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order & Crew Status</th>
                      <th style={{ padding: '16px 14px', textAlign: 'center', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '380px' }}>ACTIONS</th>
                    </tr>
                  </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const assignedCount = (ord.assignments || []).length;
                  const isConfirmedOrActive = ['CONFIRMED', 'WORKERS_ASSIGNED', 'SETUP_IN_PROGRESS', 'EVENT_IN_PROGRESS'].includes(ord.status);

                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '18px 14px', fontWeight: '800', color: '#C97A13', fontSize: '18px' }}>
                        {ord.orderNumber}
                      </td>
                      <td style={{ padding: '18px 14px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '16px' }}>
                          {ord.customer?.name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
                          {ord.customer?.email || ord.customer?.phone || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '18px 14px' }}>
                        <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{ord.eventType}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px' }}>
                          🗓️ {formatDateTime(ord.eventDate)}
                        </div>
                      </td>
                      <td style={{ padding: '18px 14px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                        <div>{ord.venueAddress}</div>
                        {ord.distanceKm && (
                          <div style={{ fontSize: '12px', color: '#C97A13', fontWeight: '700', marginTop: '2px' }}>
                            🚗 {ord.distanceKm} km {ord.requiresCustomTransport && '(Outstation)'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '18px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(201, 122, 19, 0.15)',
                              color: '#C97A13',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontWeight: '800',
                              fontSize: '13px',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {ord.status}
                          </span>

                          {isConfirmedOrActive && (
                            <span
                              style={{
                                backgroundColor: assignedCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: assignedCount > 0 ? '#10B981' : '#F59E0B',
                                border: assignedCount > 0 ? '1px solid #10B981' : '1px solid #F59E0B',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '12px',
                              }}
                            >
                              {assignedCount > 0 ? `✅ Crew Assigned (${assignedCount})` : '⚠️ Crew Pending'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 14px', textAlign: 'center', verticalAlign: 'middle', minWidth: '360px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap', position: 'relative' }}>
                          {/* 1. Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsOrder(ord)}
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            🔍 Details
                          </button>

                          {/* 2. Quotation Link */}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/quotation/${ord.id}`)}
                            style={{
                              backgroundColor: 'rgba(201, 122, 19, 0.15)',
                              color: '#C97A13',
                              border: '1px solid #C97A13',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            ✏️ Quotation
                          </button>

                          {/* 3. QR Access */}
                          <button
                            type="button"
                            onClick={() => setSelectedQrOrder(ord)}
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#3B82F6',
                              border: '1px solid #3B82F6',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            📱 QR
                          </button>

                          {/* 4. Action Dropdown Menu Button */}
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionDropdownId(openActionDropdownId === ord.id ? null : ord.id);
                              }}
                              style={{
                                backgroundColor: openActionDropdownId === ord.id ? '#C97A13' : 'var(--bg-surface)',
                                color: openActionDropdownId === ord.id ? '#FFFFFF' : 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              ⚡ Action ▾
                            </button>

                            {/* Dropdown Floating Menu */}
                            {openActionDropdownId === ord.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 6px)',
                                  zIndex: 999,
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '12px',
                                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                                  padding: '6px',
                                  minWidth: '170px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  textAlign: 'left',
                                }}
                              >
                                {['CONFIRMED', 'SUBMITTED', 'UNDER_REVIEW', 'QUOTATION_SENT'].includes(ord.status) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionDropdownId(null);
                                      setSelectedAssignCrewOrder(ord);
                                    }}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: 'var(--text-primary)',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    👥 Assign Crew
                                  </button>
                                )}

                                {['WORKERS_ASSIGNED', 'SETUP_IN_PROGRESS', 'EVENT_IN_PROGRESS'].includes(ord.status) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionDropdownId(null);
                                      setSelectedAssignCrewOrder(ord);
                                    }}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: 'var(--text-primary)',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    👥 Reassign Crew
                                  </button>
                                )}

                                {!['COMPLETED', 'CLOSED', 'CANCELLED'].includes(ord.status) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionDropdownId(null);
                                      handleMarkCompleted(ord);
                                    }}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#10B981',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      fontWeight: '800',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✅ Mark Completed
                                  </button>
                                )}

                                {['COMPLETED', 'CLOSED', 'EVENT_COMPLETED'].includes(ord.status) && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionDropdownId(null);
                                        navigate('/admin/audit-logs');
                                      }}
                                      style={{
                                        backgroundColor: 'transparent',
                                        color: 'var(--text-primary)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      🛡️ View Audit Log
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionDropdownId(null);
                                        setToastMsg(`Invoice downloaded for Order #${ord.orderNumber}`);
                                        setTimeout(() => setToastMsg(null), 3000);
                                      }}
                                      style={{
                                        backgroundColor: 'transparent',
                                        color: '#3B82F6',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      🖨️ Export Invoice
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedDetailsOrder}
        isOpen={Boolean(selectedDetailsOrder)}
        onClose={() => setSelectedDetailsOrder(null)}
        onMarkCompleted={handleMarkCompleted}
      />

      {/* Admin QR Code Modal */}
      <OrderQrModal
        order={selectedQrOrder}
        isOpen={Boolean(selectedQrOrder)}
        onClose={() => setSelectedQrOrder(null)}
      />

      {/* Quick Crew Assignment Modal */}
      <AssignCrewModal
        order={selectedAssignCrewOrder}
        isOpen={Boolean(selectedAssignCrewOrder)}
        onClose={() => setSelectedAssignCrewOrder(null)}
        onSuccess={(msg) => {
          setToastMsg(msg);
          fetchAllOrders();
          setTimeout(() => setToastMsg(null), 3500);
        }}
      />
    </div>
  );
};
