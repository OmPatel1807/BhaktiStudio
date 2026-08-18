import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const WorkerDashboard = () => {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED'
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, assignmentId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAssignedJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/assignments/my-jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setJobs(json.data);
    } catch (err) {
      showToast('Failed to load assigned jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAssignedJobs();
  }, [token]);

  const handleRespondJob = async (id, action, reason = '') => {
    try {
      const res = await fetch(`/api/v1/assignments/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Job assignment ${action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'}`);
        setRejectionModal({ isOpen: false, assignmentId: null });
        setRejectionReason('');
        fetchAssignedJobs();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to record job response', 'error');
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'PENDING') return j.status === 'PENDING';
    if (filter === 'ACCEPTED') return j.status === 'ACCEPTED';
    return true;
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '40px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '600',
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Worker Operations Portal • {user?.name || 'Technician'} 🛠️
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Review assigned event production jobs, check venue details, and update execution status.
          </p>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            {[
              { id: 'ALL', label: 'All Jobs' },
              { id: 'PENDING', label: '⏳ Pending Confirmation' },
              { id: 'ACCEPTED', label: '✅ Accepted Assignments' },
            ].map((tab) => {
              const isSel = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    backgroundColor: isSel ? 'rgba(195,155,90,0.18)' : 'var(--bg-surface)',
                    border: isSel ? '2px solid #C39B5A' : '1px solid var(--border-color)',
                    color: isSel ? '#C39B5A' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Jobs Feed */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading assignments...</div>
        ) : filteredJobs.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '20px',
              border: '1px dashed var(--border-color)',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            No assigned jobs matching selected filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredJobs.map((asg) => {
              const ord = asg.order;
              return (
                <div
                  key={asg.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '800', color: '#C39B5A', fontSize: '15px' }}>
                        {ord.orderNumber}
                      </span>
                      <span
                        style={{
                          backgroundColor:
                            asg.status === 'ACCEPTED'
                              ? 'rgba(16,185,129,0.15)'
                              : asg.status === 'REJECTED'
                              ? 'rgba(239,68,68,0.15)'
                              : 'rgba(245,158,11,0.15)',
                          color:
                            asg.status === 'ACCEPTED'
                              ? '#10B981'
                              : asg.status === 'REJECTED'
                              ? '#EF4444'
                              : '#F59E0B',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}
                      >
                        {asg.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '4px 0', color: 'var(--text-primary)' }}>
                      {ord.eventType} • <span style={{ color: '#C39B5A' }}>Role: {asg.assignedRole}</span>
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      📍 Venue: {ord.venueAddress}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      🗓️ Date: {formatDateTime(ord.eventDate)} ({ord.startTime} - {ord.endTime})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      👤 Customer: {ord.customer?.name} ({ord.customer?.phone || 'No phone'})
                    </div>

                    {/* Equipment Checklist */}
                    {ord.orderItems && ord.orderItems.length > 0 && (
                      <div style={{ marginTop: '12px', backgroundColor: 'var(--bg-input)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', marginBottom: '6px' }}>
                          🛠️ Required Equipment Checklist:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {ord.orderItems.map((item) => {
                            const hasDimensions = Boolean(item.widthFt && item.heightFt);
                            const area = hasDimensions ? (item.widthFt * item.heightFt) : null;
                            const estPanels = area ? Math.ceil(area / 4) : null;
                            const dimText = hasDimensions
                              ? `${item.widthFt}×${item.heightFt}ft = ${area} sq ft${estPanels ? ` (~${estPanels} panels)` : ''}`
                              : '';

                            return (
                              <span
                                key={item.id}
                                style={{
                                  backgroundColor: '#1E293B',
                                  color: '#CBD5E1',
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #475569',
                                }}
                              >
                                • {item.serviceName} ({item.quantity}x {dimText})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '140px' }}>
                    {asg.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespondJob(asg.id, 'ACCEPT')}
                          style={{
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Accept Job
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectionModal({ isOpen: true, assignmentId: asg.id })}
                          style={{
                            backgroundColor: '#334155',
                            color: '#FCA5A5',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {asg.status === 'ACCEPTED' && (
                      <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '700', textAlign: 'center' }}>
                        ✓ Job Confirmed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {rejectionModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
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
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '460px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: 0, color: '#F8FAFC' }}>
              Decline Job Assignment
            </h3>
            <textarea
              rows={3}
              placeholder="Please state reason for declining job..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, assignmentId: null })}
                style={{
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRespondJob(rejectionModal.assignmentId, 'REJECT', rejectionReason)}
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
