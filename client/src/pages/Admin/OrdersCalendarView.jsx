import React, { useState, useMemo } from 'react';

export const OrdersCalendarView = ({ orders = [], onSelectOrder }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Default Aug 2026
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Group orders by YYYY-MM-DD
  const ordersByDate = useMemo(() => {
    const map = {};
    (orders || []).forEach((ord) => {
      if (!ord.eventDate) return;
      const dateKey = new Date(ord.eventDate).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ord);
    });
    return map;
  }, [orders]);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now.toISOString().split('T')[0]);
  };

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ dayNumber: prevMonthDays - i, isCurrentMonth: false, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(d).padStart(2, '0');
      const dateKey = `${year}-${formattedMonth}-${formattedDay}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateKey,
        events: ordersByDate[dateKey] || []
      });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({ dayNumber: n, isCurrentMonth: false, dateKey: null });
    }
    return days;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, ordersByDate]);

  const selectedDateEvents = ordersByDate[selectedDate] || [];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Month Navigation Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅</span> {monthNames[month]} {year}
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Master Schedule of Venue Event Bookings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            style={{ padding: '8px 14px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            ◀ Prev Month
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            style={{ padding: '8px 14px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Next Month ▶
          </button>
        </div>
      </div>

      {/* 2. Desktop Calendar Grid */}
      <div style={{
        backgroundColor: '#0b1120',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        padding: '16px'
      }}>
        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '10px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: '700',
          color: '#64748b'
        }}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} style={{ padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* 7-Column Days Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px'
        }}>
          {calendarDays.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`pad-${idx}`}
                  style={{
                    minHeight: '90px',
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(30, 41, 59, 0.4)',
                    opacity: 0.3,
                    color: '#475569',
                    fontSize: '12px'
                  }}
                >
                  {cell.dayNumber}
                </div>
              );
            }

            const isToday = cell.dateKey === new Date().toISOString().split('T')[0];
            const isSelected = selectedDate === cell.dateKey;
            const hasEvents = cell.events && cell.events.length > 0;

            return (
              <div
                key={cell.dateKey}
                onClick={() => setSelectedDate(cell.dateKey)}
                style={{
                  minHeight: '90px',
                  padding: '8px',
                  borderRadius: '10px',
                  backgroundColor: isToday ? 'rgba(245, 158, 11, 0.08)' : isSelected ? '#1e293b' : '#0f172a',
                  border: isToday ? '1px solid #f59e0b' : isSelected ? '1px solid #64748b' : '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isToday ? '#f59e0b' : '#cbd5e1' }}>
                    {cell.dayNumber}
                  </span>
                  {hasEvents && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      {cell.events.length} {cell.events.length === 1 ? 'Event' : 'Events'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0', overflow: 'hidden' }}>
                  {cell.events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectOrder) onSelectOrder(ev);
                      }}
                      style={{
                        padding: '4px 6px',
                        backgroundColor: '#1e293b',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        fontSize: '10px',
                        color: '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                        {ev.eventType || 'Event'}
                      </span>
                    </div>
                  ))}
                  {cell.events.length > 2 && (
                    <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
                      +{cell.events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};