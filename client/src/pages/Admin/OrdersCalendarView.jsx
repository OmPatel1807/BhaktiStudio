import React, { useState, useMemo } from 'react';

export const OrdersCalendarView = ({ orders = [], onSelectOrder }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Default Aug 2026
  const [selectedDate, setSelectedDate] = useState('2026-08-20'); // Default selected date in Aug 2026

  // Calendar Engine calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Group orders by YYYY-MM-DD
  const ordersByDate = useMemo(() => {
    const map = {};
    orders.forEach((ord) => {
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

  // Build grid calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        dateKey: null
      });
    }
    // Current month days
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
    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        dayNumber: n,
        isCurrentMonth: false,
        dateKey: null
      });
    }
    return days;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, ordersByDate]);

  const selectedDateEvents = ordersByDate[selectedDate] || [];

  return (
    <div className="space-y-4" style={{ color: 'var(--text-primary)' }}>
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>📅</span> {monthNames[month]} {year}
          </h2>
          <p className="text-xs text-slate-400">Master Schedule & Order Timeline</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* 2. DESKTOP GRID (Hidden on mobile < md) */}
      <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 tracking-wider">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* 7-Column Balanced Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[95px] p-2 rounded-xl bg-slate-950/30 border border-slate-900/50 opacity-30 text-xs text-slate-500"
                >
                  {cell.dayNumber}
                </div>
              );
            }

            const isToday = cell.dateKey === new Date().toISOString().split('T')[0];
            const hasEvents = cell.events && cell.events.length > 0;

            return (
              <div
                key={cell.dateKey}
                onClick={() => setSelectedDate(cell.dateKey)}
                className={`min-h-[100px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isToday
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/10'
                    : selectedDate === cell.dateKey
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isToday ? 'text-amber-400' : 'text-slate-300'}`}>
                    {cell.dayNumber}
                  </span>
                  {hasEvents && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {cell.events.length} {cell.events.length === 1 ? 'Event' : 'Events'}
                    </span>
                  )}
                </div>

                {/* Event Pills (Max 2 per cell + overflow tag) */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {cell.events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectOrder) onSelectOrder(ev);
                      }}
                      className="px-1.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-200 truncate cursor-pointer transition flex items-center gap-1"
                      title={ev.eventType}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate font-medium">{ev.eventType || 'Event'}</span>
                    </div>
                  ))}
                  {cell.events.length > 2 && (
                    <div className="text-[9px] text-slate-400 font-medium text-center">
                      +{cell.events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MOBILE HCI TWO-TIER VIEW (Shown only on < md) */}
      <div className="block md:hidden space-y-4">
        {/* Compact Mini-Grid */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={`m-pad-${idx}`} className="h-9 opacity-20" />;
              }

              const isSelected = selectedDate === cell.dateKey;
              const hasEvents = cell.events && cell.events.length > 0;

              return (
                <button
                  type="button"
                  key={`m-${cell.dateKey}`}
                  onClick={() => setSelectedDate(cell.dateKey)}
                  className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-950/60 text-slate-300 border border-slate-800/60'
                  }`}
                >
                  <span className="text-xs">{cell.dayNumber}</span>
                  {hasEvents && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-slate-950' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda Details */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Agenda for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selected Date'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event scheduled' : 'events scheduled'}
              </p>
            </div>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No event orders booked on this date.
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDateEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onSelectOrder && onSelectOrder(ev)}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{ev.eventType || 'Event Setup'}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">📍 {ev.venueAddress || 'Surat'}</p>
                    <span className="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {ev.orderNumber || 'BS-2026'}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-amber-400">
                      ₹{(ev.grandTotal || ev.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-400">Inspect ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
