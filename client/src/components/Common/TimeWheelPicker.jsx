import React, { useState, useEffect, useRef } from 'react';

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'];

const ITEM_HEIGHT = 40; // Exact 40px per row item
const VISIBLE_ROWS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS; // 200px
const HIGHLIGHT_TOP = ITEM_HEIGHT * 2; // 80px (Exact center row position)

export const TimeWheelPicker = ({ value = '10:00 AM', onChange, isOpen, onClose }) => {
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const periodRef = useRef(null);

  // Parse initial prop value on open
  useEffect(() => {
    if (value) {
      const match = value.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i);
      if (match) {
        let h = match[1].padStart(2, '0');
        let m = match[2].padStart(2, '0');
        let p = match[3].toUpperCase();
        setSelectedHour(h);
        setSelectedMinute(m);
        setSelectedPeriod(p);
      }
    }
  }, [value, isOpen]);

  // Auto scroll columns to center selected items when popover opens
  useEffect(() => {
    if (isOpen) {
      const hIdx = HOURS.indexOf(selectedHour);
      if (hIdx !== -1 && hourRef.current) {
        hourRef.current.scrollTop = hIdx * ITEM_HEIGHT;
      }
      const mIdx = MINUTES.indexOf(selectedMinute);
      if (mIdx !== -1 && minuteRef.current) {
        minuteRef.current.scrollTop = mIdx * ITEM_HEIGHT;
      }
      const pIdx = PERIODS.indexOf(selectedPeriod);
      if (pIdx !== -1 && periodRef.current) {
        periodRef.current.scrollTop = pIdx * ITEM_HEIGHT;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Dynamic Scroll Handlers
  const handleHourScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const idx = Math.min(HOURS.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (HOURS[idx] && HOURS[idx] !== selectedHour) {
      setSelectedHour(HOURS[idx]);
    }
  };

  const handleMinuteScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const idx = Math.min(MINUTES.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (MINUTES[idx] && MINUTES[idx] !== selectedMinute) {
      setSelectedMinute(MINUTES[idx]);
    }
  };

  const handlePeriodScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const idx = Math.min(PERIODS.length - 1, Math.max(0, Math.round(scrollTop / ITEM_HEIGHT)));
    if (PERIODS[idx] && PERIODS[idx] !== selectedPeriod) {
      setSelectedPeriod(PERIODS[idx]);
    }
  };

  // Direct Item Click Handlers
  const handleHourClick = (h, idx) => {
    setSelectedHour(h);
    if (hourRef.current) {
      hourRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const handleMinuteClick = (m, idx) => {
    setSelectedMinute(m);
    if (minuteRef.current) {
      minuteRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const handlePeriodClick = (p, idx) => {
    setSelectedPeriod(p);
    if (periodRef.current) {
      periodRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  // Preset Shortcuts Handler
  const handlePresetSelect = (h, m, p) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);

    const hIdx = HOURS.indexOf(h);
    if (hIdx !== -1 && hourRef.current) {
      hourRef.current.scrollTo({ top: hIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    const mIdx = MINUTES.indexOf(m);
    if (mIdx !== -1 && minuteRef.current) {
      minuteRef.current.scrollTo({ top: mIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    const pIdx = PERIODS.indexOf(p);
    if (pIdx !== -1 && periodRef.current) {
      periodRef.current.scrollTo({ top: pIdx * ITEM_HEIGHT, behavior: 'smooth' });
    }
  };

  const handleApply = () => {
    const formatted = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    onChange?.(formatted);
    onClose?.();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 1000,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '20px',
        width: '320px',
        boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.25)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: '13px', color: '#C97A13', fontWeight: '800', textTransform: 'uppercase', marginBottom: '14px', textAlign: 'center', letterSpacing: '0.5px' }}>
        ⏰ Select Event Time
      </div>

      {/* 3-Column Equal Grid Container (200px Viewport) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          height: `${CONTAINER_HEIGHT}px`,
          position: 'relative',
          backgroundColor: 'var(--bg-input)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        {/* Exact Golden Highlight Selection Bar (80px Top, 40px Height) */}
        <div
          style={{
            position: 'absolute',
            top: `${HIGHLIGHT_TOP}px`,
            left: '8px',
            right: '8px',
            height: `${ITEM_HEIGHT}px`,
            backgroundColor: 'rgba(201, 122, 19, 0.18)',
            border: '2px solid #C97A13',
            borderRadius: '10px',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Column 1: Hours Scroll Container */}
        <div
          ref={hourRef}
          onScroll={handleHourScroll}
          style={{
            height: `${CONTAINER_HEIGHT}px`,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            paddingTop: `${HIGHLIGHT_TOP}px`,
            paddingBottom: `${HIGHLIGHT_TOP}px`,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {HOURS.map((h, idx) => {
            const isSelected = h === selectedHour;
            return (
              <div
                key={h}
                onClick={() => handleHourClick(h, idx)}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  lineHeight: `${ITEM_HEIGHT}px`,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontSize: isSelected ? '20px' : '15px',
                  fontWeight: isSelected ? '800' : '500',
                  color: isSelected ? '#C97A13' : 'var(--text-secondary)',
                  opacity: isSelected ? 1 : 0.4,
                  transform: isSelected ? 'scale(1.1)' : 'scale(0.95)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {h}
              </div>
            );
          })}
        </div>

        {/* Column 2: Minutes Scroll Container */}
        <div
          ref={minuteRef}
          onScroll={handleMinuteScroll}
          style={{
            height: `${CONTAINER_HEIGHT}px`,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            paddingTop: `${HIGHLIGHT_TOP}px`,
            paddingBottom: `${HIGHLIGHT_TOP}px`,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {MINUTES.map((m, idx) => {
            const isSelected = m === selectedMinute;
            return (
              <div
                key={m}
                onClick={() => handleMinuteClick(m, idx)}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  lineHeight: `${ITEM_HEIGHT}px`,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontSize: isSelected ? '20px' : '15px',
                  fontWeight: isSelected ? '800' : '500',
                  color: isSelected ? '#C97A13' : 'var(--text-secondary)',
                  opacity: isSelected ? 1 : 0.4,
                  transform: isSelected ? 'scale(1.1)' : 'scale(0.95)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {m}
              </div>
            );
          })}
        </div>

        {/* Column 3: Period Scroll Container (AM / PM) */}
        <div
          ref={periodRef}
          onScroll={handlePeriodScroll}
          style={{
            height: `${CONTAINER_HEIGHT}px`,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            paddingTop: `${HIGHLIGHT_TOP}px`,
            paddingBottom: `${HIGHLIGHT_TOP}px`,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {PERIODS.map((p, idx) => {
            const isSelected = p === selectedPeriod;
            return (
              <div
                key={p}
                onClick={() => handlePeriodClick(p, idx)}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  lineHeight: `${ITEM_HEIGHT}px`,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontSize: isSelected ? '20px' : '15px',
                  fontWeight: isSelected ? '800' : '500',
                  color: isSelected ? '#C97A13' : 'var(--text-secondary)',
                  opacity: isSelected ? 1 : 0.4,
                  transform: isSelected ? 'scale(1.1)' : 'scale(0.95)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {p}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Presets Grid */}
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '8px' }}>
        QUICK PRESETS:
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
        {[
          { label: 'Morning', h: '09', m: '00', p: 'AM' },
          { label: 'Afternoon', h: '02', m: '00', p: 'PM' },
          { label: 'Evening', h: '06', m: '00', p: 'PM' },
          { label: 'Night', h: '10', m: '00', p: 'PM' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handlePresetSelect(item.h, item.m, item.p)}
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 8px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {item.label} ({item.h}:{item.m} {item.p})
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          style={{
            flex: 1,
            backgroundColor: '#C97A13',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(201, 122, 19, 0.3)',
          }}
        >
          Apply Time
        </button>
      </div>
    </div>
  );
};
