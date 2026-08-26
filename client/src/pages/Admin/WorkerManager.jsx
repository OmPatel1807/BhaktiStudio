import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WORKER_SKILLS } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { WorkerAvailabilityCalendar } from './WorkerAvailabilityCalendar';

export const WorkerManager = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'pending' | 'calendar'
  const [workers, setWorkers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Worker Payout State variables
  const [payoutModal, setPayoutModal] = useState({
    isOpen: false,
    worker: null,
    baseAmount: '',
    bonusAmount: '',
    payoutMode: 'UPI',
    selectedEventId: '',
    transactionRef: '',
    notes: '',
  });
  const [completedEvents, setCompletedEvents] = useState([]);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutsSummary, setPayoutsSummary] = useState({ totalPaid: 0, unsettledDues: 0 });

  // New Worker Form State
  const [newWorker, setNewWorker] = useState({
    name: '',
    email: '',
    phone: '',
    experienceYrs: 3,
    specialization: ['LED_TECHNICIAN'],
    avatarUrl: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [photoError, setPhotoError] = useState(null);

  // Selected worker & calendar schedule state
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSchedule, setWorkerSchedule] = useState(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 7, 1));
  const [markLeaveModal, setMarkLeaveModal] = useState({ isOpen: false, dateStr: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/workers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setWorkers(json.data);
        if (json.data.length > 0 && !selectedWorkerId) {
          setSelectedWorkerId(json.data[0].id);
        }
      }
    } catch (err) {
      showToast('Failed to load workers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWorkers = async () => {
    try {
      const res = await fetch('/api/v1/workers/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setPendingWorkers(json.data);
    } catch (err) {
      console.error('Failed to load pending workers:', err);
    }
  };

  const fetchPayoutsSummary = async () => {
    try {
      const res = await fetch('/api/v1/admin/workers/payouts-summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPayoutsSummary(json.data);
      }
    } catch (err) {
      console.error('Failed to load payouts summary:', err);
    }
  };

  const fetchWorkerEvents = async (userId) => {
    try {
      const res = await fetch('/api/v1/orders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const workerEvents = json.data.filter(order => 
          order.assignments?.some(a => a.worker?.user?.id === userId) &&
          ['EVENT_COMPLETED', 'COMPLETED'].includes(order.status)
        );
        setCompletedEvents(workerEvents);
      }
    } catch (err) {
      console.error('Failed to load worker events:', err);
    }
  };

  const fetchWorkerAvailability = async (workerId) => {
    try {
      const res = await fetch(`/api/v1/workers/${workerId}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setWorkerSchedule(json.data);
    } catch (err) {
      console.error('Failed to load worker availability:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/v1/orders/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWorkers();
      fetchPendingWorkers();
      fetchPayoutsSummary();
      fetchOrders();
    }
  }, [token]);

  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  useEffect(() => {
    if (selectedWorkerId && activeTab === 'calendar') {
      fetchWorkerAvailability(selectedWorkerId);
    }
  }, [selectedWorkerId, activeTab]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setNewWorker((prev) => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();

    if (!avatarPreview && !newWorker.avatarUrl) {
      setPhotoError('Worker Profile Photo * (Required) is mandatory. Please select a profile photo.');
      showToast('Worker Profile Photo is required', 'error');
      return;
    }

    let finalSpecializations = [...newWorker.specialization];
    if (isOtherSelected && customRoleText.trim()) {
      finalSpecializations.push(customRoleText.trim());
    }

    if (finalSpecializations.length === 0) {
      showToast('Please select at least one specialization or skill.', 'error');
      return;
    }

    const payload = {
      ...newWorker,
      specialization: finalSpecializations,
    };

    try {
      const res = await fetch('/api/v1/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Worker account registered for ${newWorker.name}`);
        setShowAddWorkerModal(false);
        setNewWorker({ name: '', email: '', phone: '', experienceYrs: 3, specialization: ['LED_TECHNICIAN'], avatarUrl: '' });
        setAvatarPreview(null);
        setIsOtherSelected(false);
        setCustomRoleText('');
        setPhotoError(null);
        fetchWorkers();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to create worker profile', 'error');
    }
  };

  const handleOpenPayoutModal = (workerObj) => {
    setPayoutModal({
      isOpen: true,
      worker: workerObj,
      baseAmount: '',
      bonusAmount: '',
      payoutMode: 'UPI',
      selectedEventId: '',
      transactionRef: '',
      notes: '',
    });
    fetchWorkerEvents(workerObj.user.id);
  };

  const handleSettlePayout = async (e) => {
    e.preventDefault();
    if (!payoutModal.baseAmount || !payoutModal.payoutMode) {
      showToast('Base wage and payment mode are required', 'error');
      return;
    }

    setPayoutSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/workers/${payoutModal.worker.user.id}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseAmount: Number(payoutModal.baseAmount),
          bonusAmount: Number(payoutModal.bonusAmount || 0),
          payoutMode: payoutModal.payoutMode,
          orderId: payoutModal.selectedEventId || undefined,
          transactionRef: payoutModal.transactionRef || undefined,
          notes: payoutModal.notes || undefined,
        }),
      });

      const json = await res.json();
      setPayoutSubmitting(false);

      if (json.success) {
        showToast('Payout settled successfully!');
        setPayoutModal({
          isOpen: false,
          worker: null,
          baseAmount: '',
          bonusAmount: '',
          payoutMode: 'UPI',
          selectedEventId: '',
          transactionRef: '',
          notes: '',
        });
        fetchWorkers();
        fetchPayoutsSummary();
      } else {
        showToast(json.message || 'Failed to settle payout', 'error');
      }
    } catch (err) {
      setPayoutSubmitting(false);
      showToast('Network error settling payout', 'error');
    }
  };

  const handleApproveWorker = async (workerId, name) => {
    try {
      const res = await fetch(`/api/v1/workers/${workerId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Worker account for ${name} approved and activated!`);
        fetchWorkers();
        fetchPendingWorkers();
      } else {
        showToast(json.message || 'Failed to approve worker', 'error');
      }
    } catch (err) {
      showToast('Failed to approve worker', 'error');
    }
  };

  const handleRejectWorker = async (workerId, name) => {
    try {
      const res = await fetch(`/api/v1/workers/${workerId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Application for ${name} rejected.`);
        fetchPendingWorkers();
      } else {
        showToast(json.message || 'Failed to reject application', 'error');
      }
    } catch (err) {
      showToast('Failed to reject worker application', 'error');
    }
  };

  const handleMarkLeave = async (e) => {
    e.preventDefault();
    if (!markLeaveModal.dateStr) return;

    setLeaveSubmitting(true);
    try {
      const res = await fetch('/api/v1/workers/availability/set-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workerId: selectedWorkerId,
          date: markLeaveModal.dateStr,
          status: 'ON_LEAVE',
        }),
      });

      const json = await res.json();
      setLeaveSubmitting(false);

      if (json.success) {
        showToast('Leave recorded successfully for selected worker');
        setMarkLeaveModal({ isOpen: false, dateStr: '' });
        fetchWorkerAvailability(selectedWorkerId);
      } else {
        showToast(json.message || 'Failed to record leave', 'error');
      }
    } catch (err) {
      setLeaveSubmitting(false);
      showToast('Network error recording leave', 'error');
    }
  };

  const toggleSkillSelection = (skillKey) => {
    if (newWorker.specialization.includes(skillKey)) {
      setNewWorker({
        ...newWorker,
        specialization: newWorker.specialization.filter((s) => s !== skillKey),
      });
    } else {
      setNewWorker({
        ...newWorker,
        specialization: [...newWorker.specialization, skillKey],
      });
    }
  };

  // Monthly Calendar Math
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const selectedWorkerObj = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '48px 32px',
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

      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 32px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Worker Management & Availability
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
              Manage crew specializations, active assignments, and calendar availability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddWorkerModal(true)}
            style={{
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              fontWeight: '700',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
            }}
          >
            + Add Worker Profile
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'directory' ? '3px solid #F59E0B' : '3px solid transparent',
              color: activeTab === 'directory' ? '#F59E0B' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '15px',
              padding: '12px 16px',
              cursor: 'pointer',
            }}
          >
            👥 Worker Directory ({workers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid #F59E0B' : '3px solid transparent',
              color: activeTab === 'pending' ? '#F59E0B' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '15px',
              padding: '12px 16px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            ⏳ Pending Approvals ({pendingWorkers.length})
            {pendingWorkers.length > 0 && (
              <span
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  marginLeft: '6px',
                }}
              >
                NEW
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('calendar');
              if (workers.length > 0 && !selectedWorkerId) {
                setSelectedWorkerId(workers[0].id);
              }
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'calendar' ? '3px solid #F59E0B' : '3px solid transparent',
              color: activeTab === 'calendar' ? '#F59E0B' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '15px',
              padding: '12px 16px',
              cursor: 'pointer',
            }}
          >
            📅 Availability Calendar View
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* TAB 1: DIRECTORY */}
        {activeTab === 'directory' && (
          <div>
            {/* Global Payroll Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '750', textTransform: 'uppercase' }}>Total Paid to Crew</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: '#10B981' }}>₹{payoutsSummary.totalPaid.toLocaleString()}</h3>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '750', textTransform: 'uppercase' }}>Unsettled Crew Dues</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0 0', color: '#EF4444' }}>₹{payoutsSummary.unsettledDues.toLocaleString()}</h3>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading directory...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {workers.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <img
                          src={w.user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker'}
                          alt={w.user.name}
                          style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #F59E0B', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{w.user.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{w.user.email}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📞 {w.user.phone || 'No phone'}</div>
                        </div>
                      </div>

                      {/* Specializations Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {w.specialization.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {WORKER_SKILLS[skill] || skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                          marginBottom: '12px',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>Exp: <strong>{w.experienceYrs} yrs</strong></span>
                        <span
                          style={{
                            backgroundColor: (w.assignments || []).length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: (w.assignments || []).length > 0 ? '#EF4444' : '#10B981',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '11px',
                          }}
                        >
                          {(w.assignments || []).length > 0 ? `${w.assignments.length} ACTIVE JOBS` : 'FREE / AVAILABLE'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPayoutModal(w)}
                        style={{
                          backgroundColor: '#F59E0B',
                          color: '#0F172A',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        💳 Settle Payout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING APPROVALS QUEUE */}
        {activeTab === 'pending' && (
          <div>
            {pendingWorkers.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '24px',
                  padding: '60px',
                  textAlign: 'center',
                  color: '#94A3B8',
                }}
              >
                <div style={{ fontSize: '42px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC', margin: '0 0 8px 0' }}>
                  All Caught Up!
                </h3>
                <p style={{ fontSize: '14px', margin: 0 }}>No pending worker applications waiting for review.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {pendingWorkers.map((pw) => (
                  <div
                    key={pw.id}
                    style={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #F59E0B',
                      borderRadius: '24px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 10px 20px -5px rgba(245,158,11,0.1)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <img
                          src={pw.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=applicant'}
                          alt={pw.user?.name}
                          style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #F59E0B', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC' }}>{pw.user?.name}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>{pw.user?.email}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>📞 {pw.user?.phone || 'No phone'}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '12px' }}>
                        Experience: <strong style={{ color: '#F59E0B' }}>{pw.experienceYrs} Years</strong>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                        {pw.specialization.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 10px',
                              borderRadius: '8px',
                            }}
                          >
                            {WORKER_SKILLS[skill] || skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                      <button
                        type="button"
                        onClick={() => handleApproveWorker(pw.id, pw.user?.name)}
                        style={{
                          flex: 1,
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          fontWeight: '800',
                          fontSize: '13px',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                        }}
                      >
                        ✅ Approve & Activate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectWorker(pw.id, pw.user?.name)}
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.15)',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          fontWeight: '700',
                          fontSize: '13px',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVAILABILITY CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <WorkerAvailabilityCalendar
            workers={workers}
            orders={orders}
          />
        )}
      </div>

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
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
              padding: '32px',
              width: '90%',
              maxWidth: '540px',
              color: '#F8FAFC',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: 0, marginBottom: '20px' }}>
              Register Worker Profile
            </h3>

            <form onSubmit={handleCreateWorker} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Mandatory Profile Photo Upload */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#F59E0B', marginBottom: '10px' }}>
                  Worker Profile Photo * (Required)
                </label>
                <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 12px auto' }}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Worker Preview"
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #F59E0B' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        backgroundColor: '#0F172A',
                        border: photoError ? '2px dashed #EF4444' : '2px dashed #F59E0B',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94A3B8',
                        fontSize: '28px',
                      }}
                    >
                      📷
                    </div>
                  )}
                </div>
                <label
                  style={{
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-block',
                  }}
                >
                  📷 Upload Worker Photo *
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
                {photoError && (
                  <div style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '6px', fontWeight: '700' }}>
                    ⚠️ {photoError}
                  </div>
                )}
              </div>

              {/* Worker Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Worker Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Worker Name (e.g. Ramesh Tech)"
                  required
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Google / Access Email *
                </label>
                <input
                  type="email"
                  placeholder="Google Email (e.g. worker.led@bhaktistudio.com)"
                  required
                  value={newWorker.email}
                  onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Phone Number (+91 98765 ...)"
                  value={newWorker.phone}
                  onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Experience in Years */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Experience in Years *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  placeholder="Experience in Years (e.g. 3 Years)"
                  required
                  value={newWorker.experienceYrs}
                  onChange={(e) => setNewWorker({ ...newWorker, experienceYrs: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Skills Tags Selector + "+ Other" Option */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#CBD5E1', marginBottom: '8px', fontWeight: '600' }}>
                  Select Specializations / Skills:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {Object.entries(WORKER_SKILLS).map(([key, label]) => {
                    const isSel = newWorker.specialization.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleSkillSelection(key)}
                        style={{
                          backgroundColor: isSel ? '#F59E0B' : '#0F172A',
                          color: isSel ? '#0F172A' : '#94A3B8',
                          border: isSel ? '1px solid #F59E0B' : '1px solid #334155',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsOtherSelected(!isOtherSelected)}
                    style={{
                      backgroundColor: isOtherSelected ? '#F59E0B' : '#0F172A',
                      color: isOtherSelected ? '#0F172A' : '#F59E0B',
                      border: '1px solid #F59E0B',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    + Other
                  </button>
                </div>

                {isOtherSelected && (
                  <input
                    type="text"
                    placeholder="Enter custom role/skill (e.g. Drone Pilot, DIT Tech)..."
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      border: '1px solid #F59E0B',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  style={{
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: '800',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  Register Worker Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Leave Modal */}
      {markLeaveModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
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
              padding: '32px',
              width: '90%',
              maxWidth: '460px',
              color: '#F8FAFC',
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>
              Mark Leave / Unavailability
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: 0, marginBottom: '20px' }}>
              Block specific dates for <strong>{selectedWorkerObj?.user?.name || 'Worker'}</strong> to prevent scheduling conflicts.
            </p>

            <form onSubmit={handleMarkLeave}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#CBD5E1', marginBottom: '8px' }}>
                  Select Leave Date *
                </label>
                <input
                  type="date"
                  required
                  value={markLeaveModal.dateStr}
                  onChange={(e) => setMarkLeaveModal({ ...markLeaveModal, dateStr: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '12px',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setMarkLeaveModal({ isOpen: false, dateStr: '' })}
                  style={{
                    backgroundColor: '#334155',
                    color: '#F8FAFC',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: '800',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                  }}
                >
                  {leaveSubmitting ? 'Recording...' : 'Confirm Leave Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Settlement Modal */}
      {payoutModal.isOpen && payoutModal.worker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#F59E0B' }}>
                💳 Settle Worker Payout
              </h3>
              <button
                type="button"
                onClick={() => setPayoutModal({ ...payoutModal, isOpen: false })}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '14px', marginBottom: '20px', fontSize: '13px' }}>
              <div>👤 <strong>Worker Name:</strong> {payoutModal.worker.user.name}</div>
              <div style={{ marginTop: '4px' }}>🛡️ <strong>Role:</strong> {payoutModal.worker.specialization[0] || 'Event Crew'}</div>
              <div style={{ marginTop: '4px' }}>📱 <strong>UPI ID:</strong> {payoutModal.worker.user.phone ? `${payoutModal.worker.user.phone}@okaxis` : `${payoutModal.worker.user.name.toLowerCase().replace(/\s+/g, '')}@okaxis`}</div>
            </div>

            <form onSubmit={handleSettlePayout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Select Completed Event
                </label>
                <select
                  value={payoutModal.selectedEventId}
                  onChange={(e) => setPayoutModal({ ...payoutModal, selectedEventId: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                >
                  <option value="">General Settlement (No Event Link)</option>
                  {completedEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.orderNumber} — {evt.eventType} ({new Date(evt.eventDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                    Base Wage (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="2000"
                    value={payoutModal.baseAmount}
                    onChange={(e) => setPayoutModal({ ...payoutModal, baseAmount: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#F8FAFC',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                    Bonus / Tip (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="300"
                    value={payoutModal.bonusAmount}
                    onChange={(e) => setPayoutModal({ ...payoutModal, bonusAmount: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#F8FAFC',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Payment Mode *
                </label>
                <select
                  value={payoutModal.payoutMode}
                  onChange={(e) => setPayoutModal({ ...payoutModal, payoutMode: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                >
                  <option value="UPI">UPI Payment</option>
                  <option value="CASH">Cash Settlement</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Transaction Reference ID
                </label>
                <input
                  type="text"
                  placeholder="UPI Ref / Txn ID"
                  value={payoutModal.transactionRef}
                  onChange={(e) => setPayoutModal({ ...payoutModal, transactionRef: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginBottom: '6px' }}>
                  Private Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Performance bonus or remarks..."
                  value={payoutModal.notes}
                  onChange={(e) => setPayoutModal({ ...payoutModal, notes: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'end' }}>
                <button
                  type="button"
                  onClick={() => setPayoutModal({ ...payoutModal, isOpen: false })}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '800',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  {payoutSubmitting ? 'Processing...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
