import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const OrdersCalendarView = ({ orders = [], onSelectOrder }) => {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inspectOrder, setInspectOrder] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper: Format to local YYYY-MM-DD
  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const dateObj = new Date(dateInput);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Group orders by local date
  const ordersByDate = {};
  orders.forEach((ord) => {
    if (ord.eventDate) {
      const dateKey = getLocalDateString(ord.eventDate);
      if (!ordersByDate[dateKey]) {
        ordersByDate[dateKey] = [];
      }
      ordersByDate[dateKey].push(ord);
    }
  });

  // Calendar Grid Calculations (Sunday-first)
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);

  const handlePrevMonth = () => setCurrentDate(prevMonthDate);
  const handleNextMonth = () => setCurrentDate(nextMonthDate);
  const handleToday = () => setCurrentDate(new Date());

  // Determine event card status style
  const getEventStyle = (ord) => {
    const todayStr = getLocalDateString(new Date());
    const eventStr = getLocalDateString(ord.eventDate);

    // Completed
    if (['COMPLETED', 'EVENT_COMPLETED'].includes(ord.status)) {
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid #10B981',
        text: '#10B981',
        label: 'Done'
      };
    }

    // Today / Live Execution
    const isLiveStatus = ['SETUP_IN_PROGRESS', 'EVENT_IN_PROGRESS', 'IN_EXECUTION'].includes(ord.status);
    if (isLiveStatus || eventStr === todayStr) {
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid #F59E0B',
        text: '#F59E0B',
        label: 'Live'
      };
    }

    // Upcoming
    return {
      bg: 'rgba(59, 130, 246, 0.15)',
      border: '1px solid #3B82F6',
      text: '#3B82F6',
      label: 'Upcoming'
    };
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: isDark ? '0 20px 25px -5px rgba(0,0,0,0.3)' : '0 10px 25px -5px rgba(0,0,0,0.05)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Month Switcher Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
            {monthNames[month]} {year}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Timeline Schedule of Venue Event Bookings
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ◀ Prev Month
          </button>
          <button
            type="button"
            onClick={handleToday}
            style={{
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Next Month ▶
          </button>
        </div>
      </div>

      {/* Week Days Header Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '10px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: '800',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '8px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {/* Leading Offset Cells */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div
            key={`offset-${idx}`}
            style={{
              backgroundColor: 'rgba(0,0,0,0.02)',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
              minHeight: '120px',
              opacity: 0.4,
            }}
          />
        ))}

        {/* Days of Selected Month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dayDate = new Date(year, month, dayNum);
          const dateStr = getLocalDateString(dayDate);
          const dayOrders = ordersByDate[dateStr] || [];

          const isToday = getLocalDateString(new Date()) === dateStr;

          return (
            <div
              key={dayNum}
              style={{
                backgroundColor: isToday ? 'var(--bg-primary)' : 'var(--bg-primary)',
                border: isToday ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '10px',
                minHeight: '130px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: isToday ? '0 0 12px rgba(245,158,11,0.2)' : 'none',
              }}
            >
              {/* Day Number Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: isToday ? '#F59E0B' : 'transparent',
                    color: isToday ? '#0F172A' : 'var(--text-secondary)',
                    fontWeight: '800',
                    fontSize: '13px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {dayNum}
                </span>
                {dayOrders.length > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                    {dayOrders.length} Event{dayOrders.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Event Cards inside cell */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
                {dayOrders.map((ord) => {
                  const styleOpts = getEventStyle(ord);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setInspectOrder(ord)}
                      style={{
                        backgroundColor: styleOpts.bg,
                        border: styleOpts.border,
                        borderRadius: '10px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '800',
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ord.eventType}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '9px', fontWeight: '750', color: 'var(--text-secondary)' }}>
                        <span>⏱️ {ord.startTime || 'All Day'}</span>
                        <span style={{ color: styleOpts.text, fontWeight: '800' }}>
                          Rs. {Math.round(ord.grandTotal || ord.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick-Inspect Interactive Drawer / Popover Modal */}
      {inspectOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '460px',
              width: '90%',
              color: '#F8FAFC',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>
                🔍 Event Quick Inspection
              </h3>
              <button
                type="button"
                onClick={() => setInspectOrder(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Order ID:</span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC', marginTop: '2px' }}>
                  {inspectOrder.orderNumber}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Client Name:</span>
                <div style={{ fontWeight: '700', color: '#F8FAFC' }}>
                  {inspectOrder.customer?.name || 'Walk-in Customer'}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {inspectOrder.customer?.email || inspectOrder.customer?.phone || '-'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Venue Address:</span>
                <div style={{ color: '#F8FAFC' }}>
                  📍 {inspectOrder.venueAddress}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Event Time:</span>
                  <div style={{ color: '#F8FAFC' }}>
                    ⏱️ {inspectOrder.startTime || 'Not set'} - {inspectOrder.endTime || 'Not set'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Crew Count:</span>
                  <div style={{ color: '#F8FAFC', fontWeight: '700' }}>
                    👥 {(inspectOrder.assignments || []).length} Assigned
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Grand Total:</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981' }}>
                    Rs. {Math.round(inspectOrder.grandTotal || inspectOrder.totalAmount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Status:</span>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', marginTop: '2px' }}>
                    {inspectOrder.status}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInspectOrder(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  color: '#94A3B8',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectOrder(inspectOrder);
                  setInspectOrder(null);
                }}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                }}
              >
                🔍 Open Detailed Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
