import React, { useState, useEffect, useMemo } from 'react';

// Real dynamic local date computation
const getLocalDateString = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const OrdersCalendarView = ({ orders = [], onSelectOrder }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // Dynamic current system month
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const todayDateStr = useMemo(() => getLocalDateString(new Date()), []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Group orders by date (YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const map = {};
    (orders || []).forEach((ord) => {
      if (!ord.eventDate) return;
      const dateKey = getLocalDateString(new Date(ord.eventDate));
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
    setSelectedDate(getLocalDateString(now));
  };

  // Calendar cells data
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

  // Theme Constants (Glassmorphism & Dark Mode Accent Colors)
  const colors = {
    bgSurface: '#0f172a',
    bgInput: '#1e293b',
    border: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accentGold: '#f59e0b',
    accentBlue: '#3b82f6',
    accentGreen: '#10b981',
    bgPill: '#1e293b',
    borderPill: '#334155',
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. Month Navigation Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: colors.bgSurface,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: colors.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅</span> {monthNames[month]} {year}
          </h2>
          <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '2px 0 0 0' }}>
            Master Schedule of Venue Event Bookings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            style={{
              padding: '8px 14px',
              backgroundColor: colors.bgInput,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ◀ Prev Month
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.accentGold,
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            style={{
              padding: '8px 14px',
              backgroundColor: colors.bgInput,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Next Month ▶
          </button>
        </div>
      </div>

      {/* 2. CONDITIONAL VIEWPORTS USING THE isMobile STATE (Purge-Immune Responsive Engine) */}
      {!isMobile ? (
        /* DESKTOP VIEW */
        <div style={{
          backgroundColor: '#0b1120',
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          {/* Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '10px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: '800',
            color: colors.textSecondary,
            letterSpacing: '0.05em'
          }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <div key={d} style={{ padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Grid Cells */}
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
                      minHeight: '95px',
                      maxHeight: '115px',
                      padding: '8px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.2)',
                      border: '1px solid rgba(30, 41, 59, 0.3)',
                      opacity: 0.3,
                      color: colors.textSecondary,
                      fontSize: '12px',
                      userSelect: 'none'
                    }}
                  >
                    {cell.dayNumber}
                  </div>
                );
              }

              const isToday = cell.dateKey === todayDateStr;
              const isSelected = selectedDate === cell.dateKey;
              const hasEvents = cell.events && cell.events.length > 0;

              const borderStyle = isToday
                ? '2px solid #f59e0b'
                : isSelected
                ? '2px solid #475569'
                : `1px solid ${colors.border}`;

              const shadowStyle = isToday
                ? isSelected ? '0 0 0 2px #3b82f6, 0 0 12px rgba(245, 158, 11, 0.4)' : '0 0 12px rgba(245, 158, 11, 0.3)'
                : isSelected
                ? '0 0 0 2px #3b82f6'
                : 'none';

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => setSelectedDate(cell.dateKey)}
                  style={{
                    minHeight: '95px',
                    maxHeight: '115px',
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: isToday ? 'rgba(245, 158, 11, 0.08)' : isSelected ? colors.bgInput : '#0f172a',
                    border: borderStyle,
                    boxShadow: shadowStyle,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: isToday ? colors.accentGold : colors.textPrimary }}>
                        {cell.dayNumber}
                      </span>
                      {isToday && (
                        <span style={{
                          fontSize: '8px',
                          fontWeight: '950',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          backgroundColor: colors.accentGold,
                          color: '#0f172a',
                          letterSpacing: '0.05em'
                        }}>
                          TODAY
                        </span>
                      )}
                    </div>
                    {hasEvents && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: colors.accentGold,
                        border: `1px solid rgba(245, 158, 11, 0.3)`
                      }}>
                        {cell.events.length} {cell.events.length === 1 ? 'Event' : 'Events'}
                      </span>
                    )}
                  </div>

                  {/* Event list (proportional height, overflow protection) */}
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
                          backgroundColor: colors.bgPill,
                          borderRadius: '6px',
                          border: `1px solid ${colors.borderPill}`,
                          fontSize: '10px',
                          color: colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                        title={ev.eventType}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.accentGold, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                          {ev.eventType || 'Event'}
                        </span>
                      </div>
                    ))}
                    {cell.events.length > 2 && (
                      <div style={{ fontSize: '9px', color: colors.textSecondary, textAlign: 'center', fontWeight: '500' }}>
                        +{cell.events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MOBILE TWO-TIER VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Tier: Compact tap-grid */}
          <div style={{
            backgroundColor: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: '800',
              color: colors.textSecondary,
              marginBottom: '6px'
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}>
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <div key={`m-pad-${idx}`} style={{ height: '36px', opacity: 0.1 }} />;
                }

                const isToday = cell.dateKey === todayDateStr;
                const isSelected = selectedDate === cell.dateKey;
                const hasEvents = cell.events && cell.events.length > 0;

                let btnBg = 'rgba(30, 41, 59, 0.4)';
                let btnBorder = `1px solid ${colors.border}`;
                let btnColor = colors.textPrimary;
                let btnShadow = 'none';

                if (isSelected) {
                  btnBg = '#3b82f6';
                  btnBorder = '1px solid #3b82f6';
                  btnColor = '#ffffff';
                  btnShadow = '0 0 8px rgba(59, 130, 246, 0.4)';
                } else if (isToday) {
                  btnBg = 'rgba(245, 158, 11, 0.08)';
                  btnBorder = '1px solid #f59e0b';
                  btnColor = '#f59e0b';
                  btnShadow = '0 0 8px rgba(245, 158, 11, 0.3)';
                } else if (hasEvents) {
                  btnBg = 'rgba(245, 158, 11, 0.15)';
                  btnBorder = '1px solid rgba(245, 158, 11, 0.3)';
                  btnColor = colors.textPrimary;
                }

                return (
                  <button
                    type="button"
                    key={`m-${cell.dateKey}`}
                    onClick={() => setSelectedDate(cell.dateKey)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: btnBorder,
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: btnBg,
                      color: btnColor,
                      boxShadow: btnShadow,
                      fontWeight: isSelected || isToday ? '800' : '500'
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>{cell.dayNumber}</span>
                    {hasEvents && (
                      <span style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        marginTop: '2px',
                        backgroundColor: isSelected ? '#ffffff' : colors.accentGold
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Tier: Agenda list details */}
          <div style={{
            backgroundColor: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              marginBottom: '12px',
              borderBottom: `1px solid ${colors.border}`
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: colors.textPrimary, margin: 0 }}>
                Agenda for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selected Date'}
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: colors.accentGold
              }}>
                {selectedDateEvents.length} Booked
              </span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: colors.textSecondary }}>
                No event orders booked on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectOrder && onSelectOrder(ev)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#0f172a',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: colors.textPrimary, margin: 0 }}>
                        {ev.eventType || 'Event Setup'}
                      </h4>
                      <p style={{ fontSize: '10px', color: colors.textSecondary, margin: 0 }}>
                        📍 {ev.venueAddress || 'Surat'}
                      </p>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '9px',
                          fontWeight: '700',
                          color: colors.accentGold,
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: `1px solid rgba(245, 158, 11, 0.2)`
                        }}>
                          {ev.orderNumber || 'BS-2026'}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', fontWeight: '800', color: colors.accentGold, margin: 0 }}>
                        Rs.{(ev.grandTotal || ev.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <span style={{ fontSize: '10px', color: colors.textSecondary }}>View ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};