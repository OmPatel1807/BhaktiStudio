import React, { useState } from 'react';

export const HybridDatePicker = ({ value, onChange, minDate }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = minDate ? new Date(minDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handleSelectDay = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectedDate < today) return;

    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange(formatted);
    setShowCalendar(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="YYYY-MM-DD"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        />
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: '#D97706',
            border: '1px solid #D97706',
            borderRadius: '12px',
            padding: '0 18px',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          📅
        </button>
      </div>

      {/* Interactive Calendar Popover */}
      {showCalendar && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '20px',
            zIndex: 999,
            width: 'min(320px, calc(100vw - 32px), 100%)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#D97706', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              ◀
            </button>
            <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#D97706', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              ▶
            </button>
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {Array.from({ length: startDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
              const isPast = dateObj < today;
              const y = dateObj.getFullYear();
              const m = String(dateObj.getMonth() + 1).padStart(2, '0');
              const d = String(dateObj.getDate()).padStart(2, '0');
              const localDateStr = `${y}-${m}-${d}`;
              const isSelected = value === localDateStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDay(dayNum)}
                  style={{
                    padding: '8px 0',
                    backgroundColor: isSelected ? '#D97706' : 'transparent',
                    color: isSelected ? '#FFFFFF' : isPast ? 'var(--text-secondary)' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isSelected ? '700' : '500',
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    opacity: isPast ? 0.4 : 1,
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
