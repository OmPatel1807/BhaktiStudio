import React, { useState } from 'react';
import { HybridDatePicker } from './HybridDatePicker';
import { TimeWheelPicker } from '../../Common/TimeWheelPicker';

export const Step1DateVenue = ({
  eventDetails,
  setEventDetails,
  isCustomEventType,
  setIsCustomEventType,
  customEventInput,
  setCustomEventInput,
  isListening,
  handleToggleSpeechRecognition,
}) => {
  const [activePicker, setActivePicker] = useState(null); // 'start' | 'end' | null

  // Format typed time strings e.g. "0930am" -> "09:30 AM" or "830" -> "08:30 AM"
  const parseAndFormatTime = (raw) => {
    if (!raw) return '';
    const clean = raw.trim().toUpperCase();

    // Already valid 12h format e.g. "08:30 AM"
    if (/^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/.test(clean)) {
      const parts = clean.split(':');
      const hour = parts[0].padStart(2, '0');
      return `${hour}:${parts[1]}`;
    }

    // Short format e.g. "0930AM" or "930AM"
    const matchShort = clean.match(/^(\d{1,4})\s*(AM|PM)?$/);
    if (matchShort) {
      let digits = matchShort[1];
      let period = matchShort[2] || 'AM';

      if (digits.length === 3) digits = '0' + digits;
      if (digits.length === 4) {
        let h = parseInt(digits.substring(0, 2), 10);
        let m = digits.substring(2, 4);
        if (h >= 1 && h <= 12) {
          return `${h.toString().padStart(2, '0')}:${m} ${period}`;
        }
      }
    }

    return raw;
  };

  const handleTimeBlur = (field) => {
    const rawVal = eventDetails[field];
    const formatted = parseAndFormatTime(rawVal);
    setEventDetails({ ...eventDetails, [field]: formatted });
  };

  return (
    <div>
      <h2 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 28px 0', color: 'var(--text-primary)' }}>
        Step 1: Event Details & Schedule
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Category Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Select Event Category
          </label>
          <select
            value={isCustomEventType ? 'OTHER' : eventDetails.eventType}
            onChange={(e) => {
              if (e.target.value === 'OTHER') {
                setIsCustomEventType(true);
              } else {
                setIsCustomEventType(false);
                setEventDetails({ ...eventDetails, eventType: e.target.value });
              }
            }}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            <option value="Wedding / Reception">Wedding / Reception</option>
            <option value="Concert / Cultural Fest">Concert / Cultural Fest</option>
            <option value="Corporate Seminar">Corporate Seminar</option>
            <option value="Private Celebration / Party">Private Celebration / Party</option>
            <option value="OTHER">Other / Custom Event (Voice Input Enabled)</option>
          </select>
        </div>

        {/* Custom Event Name Input */}
        {isCustomEventType && (
          <div>
            <label style={{ display: 'block', fontSize: '16px', color: '#C97A13', fontWeight: '700', marginBottom: '8px' }}>
              Specify Custom Event Name (Speak or Type):
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="e.g. Mahotsav Stage Show"
                value={customEventInput}
                onChange={(e) => {
                  setCustomEventInput(e.target.value);
                  setEventDetails({ ...eventDetails, eventType: e.target.value });
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '2px solid #C97A13',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              />
              <button
                type="button"
                onClick={handleToggleSpeechRecognition}
                style={{
                  backgroundColor: isListening ? '#DC2626' : '#C97A13',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 24px',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                {isListening ? '🎙️ Listening...' : '🎤 Voice Input'}
              </button>
            </div>
          </div>
        )}

        {/* Hybrid Date & Start/End Time Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Event Date
            </label>
            <HybridDatePicker
              value={eventDetails.eventDate}
              onChange={(date) => setEventDetails({ ...eventDetails, eventDate: date })}
            />
          </div>

          {/* Start Time Field */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Start Time
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={eventDetails.startTime}
                onChange={(e) => setEventDetails({ ...eventDetails, startTime: e.target.value })}
                onBlur={() => handleTimeBlur('startTime')}
                placeholder="e.g. 09:30 AM"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px 44px 14px 18px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              />
              <button
                type="button"
                onClick={() => setActivePicker(activePicker === 'start' ? null : 'start')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ⏰
              </button>
            </div>

            <TimeWheelPicker
              isOpen={activePicker === 'start'}
              value={eventDetails.startTime}
              onChange={(time) => setEventDetails({ ...eventDetails, startTime: time })}
              onClose={() => setActivePicker(null)}
            />
          </div>

          {/* End Time Field */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              End Time
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={eventDetails.endTime}
                onChange={(e) => setEventDetails({ ...eventDetails, endTime: e.target.value })}
                onBlur={() => handleTimeBlur('endTime')}
                placeholder="e.g. 10:00 PM"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px 44px 14px 18px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              />
              <button
                type="button"
                onClick={() => setActivePicker(activePicker === 'end' ? null : 'end')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ⏰
              </button>
            </div>

            <TimeWheelPicker
              isOpen={activePicker === 'end'}
              value={eventDetails.endTime}
              onChange={(time) => setEventDetails({ ...eventDetails, endTime: time })}
              onClose={() => setActivePicker(null)}
            />
          </div>
        </div>

        {/* Venue Address */}
        <div>
          <label style={{ display: 'block', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Venue & Location Address
          </label>
          <textarea
            rows={3}
            placeholder="Enter complete venue address & landmark"
            value={eventDetails.venueAddress}
            onChange={(e) => setEventDetails({ ...eventDetails, venueAddress: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: '500',
            }}
          />
        </div>
      </div>
    </div>
  );
};
