import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const NotificationBell = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      await fetch(`/api/v1/notifications/${n.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
    setIsOpen(false);
    if (n.actionUrl && n.actionUrl !== '#') {
      navigate(n.actionUrl);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Trigger Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          color: '#F8FAFC',
          borderRadius: '10px',
          padding: '8px 12px',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          position: 'relative',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: '800',
              borderRadius: '10px',
              padding: '2px 6px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: '16px',
            top: '62px',
            width: 'min(340px, calc(100vw - 32px))',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            zIndex: 9999,
            color: '#F8FAFC',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: '700', fontSize: '14px' }}>Notifications ({unreadCount} unread)</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#F59E0B',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Mark All Read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #334155',
                    cursor: 'pointer',
                    backgroundColor: n.isRead ? 'transparent' : 'rgba(245,158,11,0.08)',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#F8FAFC', marginBottom: '2px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{n.message}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{formatDateTime(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
