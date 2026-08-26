import React, { useState, useMemo, useEffect } from 'react';

// Real dynamic local date computation
const getLocalDateString = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const WorkerAvailabilityCalendar = ({ workers = [], orders = [] }) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || null);
  const [currentDate, setCurrentDate] = useState(new Date()); // Dynamic current system month
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId) || workers[0] || null;
  }, [workers, selectedWorkerId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Find worker assigned dates
  const workerBookings = useMemo(() => {
    if (!selectedWorker) return {};
    const map = {};
    (orders || []).forEach(ord => {
      const isAssigned = 
        (ord.assignments || []).some(a => (a.workerId || a.worker?.id) === selectedWorker.id) ||
        (ord.assignedWorkers || []).some(w => (w.id || w.workerId) === selectedWorker.id) ||
        (ord.workerIds || []).includes(selectedWorker.id);
      if (isAssigned && ord.eventDate) {
        const d = getLocalDateString(new Date(ord.eventDate));
        map[d] = ord;
      }
    });
    return map;
  }, [selectedWorker, orders]);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ dayNumber: prevMonthDays - i, isCurrentMonth: false, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateKey = `${year}-${mm}-${dd}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateKey,
        assignedOrder: workerBookings[dateKey] || null
      });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({ dayNumber: n, isCurrentMonth: false, dateKey: null });
    }
    return days;
  }, [year, month, firstDayIndex, daysInMonth, prevMonthDays, workerBookings]);

  const handleWorkerSelect = (worker) => {
    setSelectedWorkerId(worker.id);
    if (isMobile) {
      setShowMobileModal(true);
    }
  };

  // Reusable Calendar Content
  const renderCalendarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Calendar Top Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#090d16', borderRadius: '12px', border: '1px solid #1e293b', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
            📅 {selectedWorker ? `${selectedWorker.user?.name || selectedWorker.name}'s Schedule` : 'Worker Schedule'}
          </h3>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            {monthNames[month]} {year} Availability Grid
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            style={{ padding: '6px 12px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
          >
            ◀ Prev
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: '#090d16', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
          >
            Current
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            style={{ padding: '6px 12px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#64748b' }}>
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
          <div key={d} style={{ padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {calendarDays.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={`p-${idx}`}
                style={{ height: isMobile ? '44px' : '52px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.2)', border: '1px solid rgba(30, 41, 59, 0.2)', opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#475569' }}
              >
                {cell.dayNumber}
              </div>
            );
          }

          const isBusy = !!cell.assignedOrder;

          return (
            <div
              key={cell.dateKey}
              style={{
                height: isMobile ? '48px' : '56px',
                padding: '4px',
                borderRadius: '8px',
                backgroundColor: isBusy ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                border: isBusy ? '1px solid #ef4444' : '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '700', color: isBusy ? '#fca5a5' : '#cbd5e1' }}>
                {cell.dayNumber}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isBusy ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '9px', fontWeight: '700', color: isBusy ? '#ef4444' : '#10b981' }}>
                  {isBusy ? 'Busy' : 'Free'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* DESKTOP LAYOUT (>= 768px): Side-by-Side */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
          {/* Left Worker List */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: '0 0 4px 4px', textTransform: 'uppercase' }}>
              Select Worker Profile
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
              {workers.map((w) => {
                const isSelected = selectedWorker?.id === w.id;
                const activeJobs = (w.assignments || []).length;
                return (
                  <div
                    key={w.id}
                    onClick={() => handleWorkerSelect(w)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.1)' : '#090d16',
                      border: isSelected ? '1.5px solid #f59e0b' : '1px solid #1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={w.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker'}
                        alt={w.user?.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: isSelected ? '2px solid #F59E0B' : '1px solid #334155', objectFit: 'cover' }}
                      />
                      <div>
                        <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>{w.user?.name || w.name}</h5>
                        <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>{w.role || w.specialization?.[0] || 'Crew'}</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: activeJobs > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: activeJobs > 0 ? '#EF4444' : '#10b981'
                    }}>
                      {activeJobs > 0 ? `${activeJobs} Jobs` : 'Free'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Calendar View */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '16px' }}>
            {renderCalendarContent()}
          </div>
        </div>
      )}

      {/* MOBILE LAYOUT (< 768px): Full Width Worker Cards */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '0 4px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>
              Tap a worker to inspect calendar
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {workers.map((w) => {
              const activeJobs = (w.assignments || []).length;
              return (
                <div
                  key={w.id}
                  onClick={() => handleWorkerSelect(w)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={w.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker'}
                      alt={w.user?.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #334155', objectFit: 'cover' }}
                    />
                    <div>
                      <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>{w.user?.name || w.name}</h5>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{w.role || w.specialization?.[0] || 'Crew'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: activeJobs > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: activeJobs > 0 ? '#EF4444' : '#10b981'
                    }}>
                      {activeJobs > 0 ? `${activeJobs} Jobs` : 'Free'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>➔</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Calendar Modal Popup */}
          {showMobileModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxHeight: '90vh', backgroundColor: '#0f172a', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', border: '1px solid #334155', padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={selectedWorker?.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker'}
                      alt={selectedWorker?.user?.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>{selectedWorker?.user?.name || selectedWorker?.name}</h4>
                      <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>{selectedWorker?.role || selectedWorker?.specialization?.[0] || 'Crew'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMobileModal(false)}
                    style={{ padding: '6px 14px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    ← Back to Workers
                  </button>
                </div>

                {renderCalendarContent()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
