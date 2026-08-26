import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const AssignCrewModal = ({ order, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && order) {
      fetchWorkers();
      // Pre-select existing assigned workers if any
      const existing = (order.assignments || []).map(
        (asg) => asg.workerProfile?.id || asg.workerProfileId || asg.workerId
      );
      setSelectedWorkerIds(existing.filter(Boolean));
    }
  }, [isOpen, order]);

  const fetchWorkers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/workers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setWorkers(json.data);
      } else {
        setErrorMsg(json.message || 'Failed to load technicians');
      }
    } catch (err) {
      setErrorMsg('Network error fetching worker list');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const toggleWorker = (id) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedWorkerIds.length === 0) {
      setErrorMsg('Please select at least one crew member.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/orders/${order.id}/assign-workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workerIds: selectedWorkerIds }),
      });
      const json = await res.json();
      setSubmitting(false);

      if (json.success) {
        onSuccess?.(json.message);
        onClose();
      } else {
        setErrorMsg(json.message || 'Failed to assign crew');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Network error assigning crew');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: isMobile ? '0' : '24px',
          borderBottomRightRadius: isMobile ? '0' : '24px',
          border: '1px solid #334155',
          padding: isMobile ? '20px 16px' : '32px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: isMobile ? '92vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflowY: 'auto',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CREW & WORKER MANAGEMENT
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 0 0' }}>
              Assign Crew • Order #{order.orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: 0, marginBottom: '20px' }}>
          Select available onboarded technicians to deploy for event setup, live operation, and teardown.
        </p>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            Fetching active technician catalog...
          </div>
        ) : workers.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#0F172A', borderRadius: '16px' }}>
            No registered active workers found. Add workers in Worker Management tab.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ maxHeight: isMobile ? '300px' : '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: '24px' }}>
              {workers.map((w) => {
                const isSelected = selectedWorkerIds.includes(w.id);
                const user = w.user || {};
                const specs = w.specialization || [];

                return (
                  <div
                    key={w.id}
                    onClick={() => toggleWorker(w.id)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#0F172A',
                      border: isSelected ? '2px solid #F59E0B' : '1px solid #334155',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div click
                        style={{ width: '22px', height: '22px', accentColor: '#F59E0B', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#F8FAFC' }}>
                          👤 {user.name || 'Technician'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', wordBreak: 'break-all' }}>
                          📞 {user.phone || 'No phone'} • 📧 {user.email}
                        </div>
                        {specs.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {specs.map((s) => (
                              <span
                                key={s}
                                style={{
                                  backgroundColor: '#1E293B',
                                  color: '#F59E0B',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #334155',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '900',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                }}
              >
                {submitting ? 'Dispatching...' : `Assign ${selectedWorkerIds.length} Crew ➔`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
