import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WORKER_SKILLS } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const WorkerManager = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'pending' | 'calendar'
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (token) {
      fetchWorkers();
      fetchPendingWorkers();
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

                    <div
                      style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
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
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
            {/* Worker Selector Sidebar */}
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '24px',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginTop: 0, marginBottom: '16px', color: '#F8FAFC' }}>
                Select Worker Profile
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workers.map((w) => {
                  const isSel = selectedWorkerId === w.id;
                  const activeJobs = (w.assignments || []).length;

                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkerId(w.id)}
                      style={{
                        backgroundColor: isSel ? 'rgba(245,158,11,0.15)' : '#0F172A',
                        border: isSel ? '2px solid #F59E0B' : '1px solid #334155',
                        borderRadius: '16px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img
                        src={w.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=worker'}
                        alt={w.user?.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: isSel ? '2px solid #F59E0B' : '1px solid #334155', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: isSel ? '#F59E0B' : '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {w.user?.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                          {w.specialization[0] || 'Technician'}
                        </div>
                      </div>
                      <span
                        style={{
                          backgroundColor: activeJobs > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: activeJobs > 0 ? '#EF4444' : '#10B981',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {activeJobs > 0 ? `${activeJobs} Jobs` : 'Free'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Monthly Calendar Grid & Schedule View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '24px',
                  padding: '28px',
                }}
              >
                {/* Month Switcher Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#F8FAFC' }}>
                      📅 {selectedWorkerObj?.user?.name || 'Worker'}'s Schedule
                    </h2>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                      {monthNames[month]} {year} Availability Grid
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
                      style={{ backgroundColor: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ◀ Prev Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMonthDate(new Date(2026, 7, 1))}
                      style={{ backgroundColor: '#F59E0B', color: '#0F172A', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Current Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
                      style={{ backgroundColor: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Next Month ▶
                    </button>
                  </div>
                </div>

                {/* 7 Columns Days Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: '800', fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', padding: '8px' }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid Cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {/* Empty Leading Offset Cells */}
                  {Array.from({ length: startDayIndex }).map((_, idx) => (
                    <div key={`offset-${idx}`} style={{ backgroundColor: '#0F172A', opacity: 0.3, borderRadius: '14px', minHeight: '80px' }} />
                  ))}

                  {/* Days of Current Month */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateObj = new Date(year, month, dayNum);
                    const dateStr = dateObj.toDateString();

                    // Find matching assigned jobs for this date
                    const dayAssignments = (workerSchedule?.assignments || []).filter(
                      (asg) => asg.order?.eventDate && new Date(asg.order.eventDate).toDateString() === dateStr
                    );

                    // Find matching leaves for this date
                    const dayLeaves = (workerSchedule?.availabilities || []).filter(
                      (av) => (av.status === 'ON_LEAVE' || av.status === 'UNAVAILABLE') && new Date(av.date).toDateString() === dateStr
                    );

                    const isBooked = dayAssignments.length > 0;
                    const isLeave = dayLeaves.length > 0;

                    return (
                      <div
                        key={dayNum}
                        style={{
                          backgroundColor: isBooked ? 'rgba(239, 68, 68, 0.15)' : isLeave ? 'rgba(245, 158, 11, 0.15)' : '#0F172A',
                          border: isBooked ? '1px solid #EF4444' : isLeave ? '1px solid #F59E0B' : '1px solid #334155',
                          borderRadius: '14px',
                          padding: '10px',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '900', fontSize: '14px', color: isBooked ? '#EF4444' : isLeave ? '#F59E0B' : '#F8FAFC' }}>
                            {dayNum}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: isBooked ? '#EF4444' : isLeave ? '#F59E0B' : '#10B981' }}>
                            {isBooked ? '🔴 Booked' : isLeave ? '🟡 Leave' : '🟢 Free'}
                          </span>
                        </div>

                        <div>
                          {dayAssignments.map((asg) => (
                            <div
                              key={asg.id}
                              style={{
                                backgroundColor: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                marginTop: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              #{asg.order?.orderNumber} • {asg.order?.eventType}
                            </div>
                          ))}

                          {dayLeaves.map((l) => (
                            <div
                              key={l.id}
                              style={{
                                backgroundColor: '#F59E0B',
                                color: '#0F172A',
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                marginTop: '4px',
                              }}
                            >
                              On Leave
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Schedule Breakdown & Leave Action Button */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '24px',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#F8FAFC' }}>
                    📋 Upcoming Assigned Jobs & Leaves
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMarkLeaveModal({ isOpen: true, dateStr: new Date().toISOString().split('T')[0] })}
                    style={{
                      backgroundColor: '#F59E0B',
                      color: '#0F172A',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    + Mark Leave / Unavailability
                  </button>
                </div>

                {workerSchedule ? (
                  <div>
                    {(workerSchedule.assignments || []).length === 0 && (workerSchedule.availabilities || []).length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#0F172A', borderRadius: '16px' }}>
                        No active jobs assigned or leaves marked for this worker.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(workerSchedule.assignments || []).map((asg) => (
                          <div
                            key={asg.id}
                            style={{
                              backgroundColor: '#0F172A',
                              padding: '16px 20px',
                              borderRadius: '16px',
                              borderLeft: '5px solid #10B981',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontWeight: '900', color: '#F59E0B', fontSize: '16px' }}>
                                  #{asg.order?.orderNumber}
                                </span>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC' }}>
                                  {asg.order?.eventType}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
                                📍 Venue: {asg.order?.venueAddress || 'Main Venue'}
                              </div>
                              <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
                                🗓️ Date: {formatDateTime(asg.order?.eventDate)} ({asg.order?.startTime} - {asg.order?.endTime})
                              </div>
                            </div>
                            <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: '800', fontSize: '12px', padding: '6px 12px', borderRadius: '10px' }}>
                              Role: {asg.assignedRole || 'Event Technician'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#94A3B8' }}>Select worker profile from left list.</div>
                )}
              </div>
            </div>
          </div>
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
    </div>
  );
};
