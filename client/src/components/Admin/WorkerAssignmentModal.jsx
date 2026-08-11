import React, { useState, useEffect } from 'react';
import { WORKER_SKILLS } from '../../types';

export const WorkerAssignmentModal = ({ order, isOpen, onClose, onAssignmentsDispatched }) => {
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const token = localStorage.getItem('bs_auth_token');
        const res = await fetch('/api/v1/workers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setWorkers(json.data);
      } catch (err) {
        console.error('Failed to load workers:', err);
      } finally {
        setLoadingWorkers(false);
      }
    };

    if (isOpen) fetchWorkers();
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const requiredRoles = ['LED_TECHNICIAN', 'SOUND_ENGINEER', 'CAMERA_OPERATOR'];

  const handleWorkerSelect = (roleKey, workerId) => {
    setSelectedAssignments({
      ...selectedAssignments,
      [roleKey]: workerId,
    });
  };

  const handleDispatchAssignments = async () => {
    const dispatchList = Object.entries(selectedAssignments).map(([role, workerId]) => ({
      workerId,
      assignedRole: WORKER_SKILLS[role] || role,
    }));

    if (dispatchList.length === 0) return;

    setSubmitting(true);
    setWarnings([]);

    try {
      const token = localStorage.getItem('bs_auth_token');
      const res = await fetch('/api/v1/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          assignments: dispatchList,
        }),
      });

      const json = await res.json();
      setSubmitting(false);

      if (json.success) {
        if (json.data.conflictWarnings && json.data.conflictWarnings.length > 0) {
          setWarnings(json.data.conflictWarnings);
        } else {
          onAssignmentsDispatched?.();
          onClose();
        }
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Failed to dispatch assignments:', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '24px',
          border: '1px solid #334155',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          color: '#F8FAFC',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase' }}>
              Worker Crew Assignment Engine
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0 0 0' }}>
              Order #{order.orderNumber} ({order.eventType})
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Warnings Alert */}
        {warnings.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <strong>⚠️ Scheduling Conflict Warnings:</strong>
            {warnings.map((w, idx) => (
              <div key={idx}>• {w.workerName}: {w.reason}</div>
            ))}
          </div>
        )}

        {/* Role Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          {requiredRoles.map((roleKey) => {
            const roleName = WORKER_SKILLS[roleKey] || roleKey;
            const eligibleWorkers = workers.filter((w) => w.specialization.includes(roleKey));

            return (
              <div key={roleKey} style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#F59E0B', fontWeight: '700', marginBottom: '6px' }}>
                  Required Role: {roleName}
                </label>
                <select
                  value={selectedAssignments[roleKey] || ''}
                  onChange={(e) => handleWorkerSelect(roleKey, e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">-- Assign Qualified Worker --</option>
                  {eligibleWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.user.name} ({w.experienceYrs} yrs exp • {w.assignments.length} active jobs)
                    </option>
                  ))}
                  {eligibleWorkers.length === 0 && (
                    <option disabled value="">No specialized workers registered</option>
                  )}
                </select>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              color: '#F8FAFC',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleDispatchAssignments}
            style={{
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              fontWeight: '800',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            }}
          >
            {submitting ? 'Dispatching...' : 'Dispatch Worker Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};
