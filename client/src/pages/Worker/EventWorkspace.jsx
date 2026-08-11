import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const EventWorkspace = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoTab, setActivePhotoTab] = useState('BEFORE_SETUP'); // 'BEFORE_SETUP' | 'AFTER_SETUP'
  const [uploading, setUploading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrderWorkspace = async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setOrder(json.data);
    } catch (err) {
      showToast('Failed to load event workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && orderId) fetchOrderWorkspace();
  }, [orderId, token]);

  const handleStatusTransition = async (nextStatus) => {
    try {
      const res = await fetch(`/api/v1/events/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nextStatus }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Milestone updated to ${nextStatus}`);
        fetchOrderWorkspace();
      } else {
        showToast(json.message, 'error');
      }
    } catch (err) {
      showToast('Failed to update execution status', 'error');
    }
  };

  const handleSimulatedPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`/api/v1/events/${orderId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            photoType: activePhotoTab,
            photoData: reader.result,
            fileName: file.name,
          }),
        });

        const json = await res.json();
        setUploading(false);

        if (json.success) {
          showToast(`${activePhotoTab} photo uploaded successfully!`);
          fetchOrderWorkspace();
        } else {
          showToast(json.message, 'error');
        }
      } catch (err) {
        setUploading(false);
        showToast('Photo upload failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#94A3B8', textAlign: 'center' }}>Loading Event Workspace...</div>;
  }

  if (!order) {
    return <div style={{ padding: '40px', color: '#EF4444', textAlign: 'center' }}>Event not found.</div>;
  }

  const photosFiltered = (order.photos || []).filter((p) => p.photoType === activePhotoTab);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A', // Obsidian Dark
        color: '#F8FAFC',
        padding: '24px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
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

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase' }}>
              On-Site Execution Workspace
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0 0 0' }}>
              {order.eventType}
            </h1>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>Order #{order.orderNumber}</div>
          </div>
          <button
            onClick={() => setShowQrModal(true)}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #F59E0B',
              color: '#F59E0B',
              borderRadius: '12px',
              padding: '10px 14px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            📱 QR Code
          </button>
        </div>

        {/* Milestone Stepper Card */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '20px',
            border: '1px solid #334155',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 14px 0', color: '#F59E0B' }}>
            Execution Milestone Actions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {order.status === 'WORKERS_ASSIGNED' && (
              <button
                type="button"
                onClick={() => handleStatusTransition('SETUP_IN_PROGRESS')}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  fontWeight: '800',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ▶️ Arrived On Site & Start Setup
              </button>
            )}

            {order.status === 'SETUP_IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => handleStatusTransition('EVENT_IN_PROGRESS')}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ⚡ Setup Completed — Start Event
              </button>
            )}

            {order.status === 'EVENT_IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => handleStatusTransition('EVENT_COMPLETED')}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🏁 Mark Event & Dismantling Completed
              </button>
            )}

            {order.status === 'EVENT_COMPLETED' && (
              <div style={{ color: '#10B981', fontWeight: '700', textAlign: 'center', padding: '10px' }}>
                ✅ Event Execution Completed
              </div>
            )}
          </div>
        </div>

        {/* Event Details Card */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '20px',
            border: '1px solid #334155',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0', color: '#F8FAFC' }}>
            Site & Customer Info
          </h3>
          <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>📍 <strong>Venue Address:</strong> {order.venueAddress}</div>
            <div>🗓️ <strong>Date & Time:</strong> {formatDateTime(order.eventDate)} ({order.startTime} - {order.endTime})</div>
            <div>👤 <strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone || 'No phone'})</div>
            <div>🖥️ <strong>LED Dimensions:</strong> {order.ledWidthFeet || 12} x {order.ledHeightFeet || 8} ft</div>
          </div>
        </div>

        {/* Site Photo Upload Gallery */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '20px',
            border: '1px solid #334155',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              On-Site Photo Verification
            </h3>
            {/* Upload File Input */}
            <label
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: '700',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {uploading ? 'Uploading...' : '📷 Take / Upload Photo'}
              <input type="file" accept="image/*" onChange={handleSimulatedPhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Photo Category Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActivePhotoTab('BEFORE_SETUP')}
              style={{
                backgroundColor: activePhotoTab === 'BEFORE_SETUP' ? 'rgba(245,158,11,0.15)' : '#0F172A',
                border: activePhotoTab === 'BEFORE_SETUP' ? '1px solid #F59E0B' : '1px solid #334155',
                color: activePhotoTab === 'BEFORE_SETUP' ? '#F59E0B' : '#94A3B8',
                fontWeight: '700',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Before Setup Photos
            </button>
            <button
              type="button"
              onClick={() => setActivePhotoTab('AFTER_SETUP')}
              style={{
                backgroundColor: activePhotoTab === 'AFTER_SETUP' ? 'rgba(245,158,11,0.15)' : '#0F172A',
                border: activePhotoTab === 'AFTER_SETUP' ? '1px solid #F59E0B' : '1px solid #334155',
                color: activePhotoTab === 'AFTER_SETUP' ? '#F59E0B' : '#94A3B8',
                fontWeight: '700',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              After Setup Photos (Mandatory)
            </button>
          </div>

          {/* Photos Grid */}
          {photosFiltered.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              No {activePhotoTab} photos uploaded yet. Tap 'Take / Upload Photo' above.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {photosFiltered.map((p) => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #334155',
                  }}
                >
                  <img
                    src={p.photoUrl}
                    alt={p.photoType}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '8px', fontSize: '11px', color: '#94A3B8' }}>
                    Uploaded by {p.uploader?.name || 'Worker'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
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
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              maxWidth: '360px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginTop: 0, color: '#F8FAFC' }}>
              On-Site QR Token Access
            </h3>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '20px',
                borderRadius: '16px',
                margin: '20px auto',
                display: 'inline-block',
              }}
            >
              {/* QR Code Simulation */}
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  background: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #fff 10px, #fff 20px)',
                  borderRadius: '8px',
                }}
              />
            </div>
            <div style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '700' }}>
              {order.qrCodeToken}
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                marginTop: '20px',
                backgroundColor: '#334155',
                color: '#F8FAFC',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
