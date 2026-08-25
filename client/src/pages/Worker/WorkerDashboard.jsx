import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED'
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, assignmentId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState(null);

  // Worker Earnings and Payouts State
  const [activeMainTab, setActiveMainTab] = useState('jobs'); // 'jobs' | 'earnings'
  const [earningsData, setEarningsData] = useState({
    totalLifetimeEarnings: 0,
    pendingSettlement: 0,
    completedEventsCount: 0,
    payouts: [],
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const downloadPayoutReceipt = (payout) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      // Styles
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 148, 210, 'F');

      doc.setDrawColor(195, 155, 90);
      doc.setLineWidth(1);
      doc.line(10, 10, 138, 10);
      doc.line(10, 10, 10, 200);
      doc.line(138, 10, 138, 200);
      doc.line(10, 200, 138, 200);

      doc.setTextColor(248, 250, 252);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('BHAKTI STUDIO', 74, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(195, 155, 90);
      doc.text('PAYMENT RECEIPT & SETTLEMENT SLIP', 74, 32, { align: 'center' });

      doc.setDrawColor(51, 65, 85);
      doc.line(20, 42, 128, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('Receipt ID:', 20, 52);
      doc.setTextColor(248, 250, 252);
      doc.text(payout.id.slice(0, 8).toUpperCase(), 60, 52);

      doc.setTextColor(148, 163, 184);
      doc.text('Date Settled:', 20, 60);
      doc.setTextColor(248, 250, 252);
      doc.text(new Date(payout.createdAt).toLocaleDateString(), 60, 60);

      doc.setTextColor(148, 163, 184);
      doc.text('Recipient Crew:', 20, 68);
      doc.setTextColor(248, 250, 252);
      doc.text(user?.name || 'Technician', 60, 68);

      doc.setTextColor(148, 163, 184);
      doc.text('Linked Event:', 20, 76);
      doc.setTextColor(248, 250, 252);
      doc.text(payout.order?.orderNumber || 'General Settlement', 60, 76);

      doc.line(20, 86, 128, 86);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(195, 155, 90);
      doc.text('Breakdown', 20, 96);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('Base Wage Amount:', 20, 108);
      doc.setTextColor(248, 250, 252);
      doc.text(`Rs. ${payout.baseAmount.toFixed(2)}`, 128, 108, { align: 'right' });

      doc.setTextColor(148, 163, 184);
      doc.text('Overtime / Bonus:', 20, 116);
      doc.setTextColor(248, 250, 252);
      doc.text(`Rs. ${payout.bonusAmount.toFixed(2)}`, 128, 116, { align: 'right' });

      doc.line(20, 124, 128, 124);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(195, 155, 90);
      doc.text('Total Settled Amount:', 20, 134);
      doc.setTextColor(16, 185, 129);
      doc.text(`Rs. ${payout.totalAmount.toFixed(2)}`, 128, 134, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Payment Mode:', 20, 150);
      doc.setTextColor(248, 250, 252);
      doc.text(payout.payoutMode, 60, 150);

      doc.setTextColor(148, 163, 184);
      doc.text('Transaction Ref:', 20, 158);
      doc.setTextColor(248, 250, 252);
      doc.text(payout.transactionRef || 'N/A', 60, 158);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('This is a digitally generated settlement voucher.', 74, 180, { align: 'center' });
      doc.text('Thank you for your outstanding contribution to Bhakti Studio!', 74, 185, { align: 'center' });

      doc.save(`Payout_Receipt_${payout.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (err) {
      console.error(err);
      showToast('Failed to download receipt', 'error');
    }
  };
  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/v1/worker/earnings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setEarningsData(json.data);
    } catch (err) {
      console.error('Failed to load earnings', err);
    }
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
    if (token) {
      fetchAssignedJobs();
      fetchEarnings();
    }
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

          {/* Main Tab Switcher */}
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginTop: '24px', paddingBottom: '2px' }}>
            <button
              onClick={() => setActiveMainTab('jobs')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeMainTab === 'jobs' ? '3px solid #C39B5A' : '3px solid transparent',
                color: activeMainTab === 'jobs' ? '#C39B5A' : 'var(--text-secondary)',
                fontWeight: '800',
                fontSize: '15px',
                padding: '10px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🛠️ Job Assignments
            </button>
            <button
              onClick={() => setActiveMainTab('earnings')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeMainTab === 'earnings' ? '3px solid #C39B5A' : '3px solid transparent',
                color: activeMainTab === 'earnings' ? '#C39B5A' : 'var(--text-secondary)',
                fontWeight: '800',
                fontSize: '15px',
                padding: '10px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              💰 Earnings & Payouts
            </button>
          </div>

          {/* Filter Tabs */}
          {activeMainTab === 'jobs' && (
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
        )}
      </div>

      {/* Jobs Feed */}
      {activeMainTab === 'jobs' && (
        loading ? (
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '700', textAlign: 'center' }}>
                          ✓ Job Confirmed
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/worker/workspace/${ord.id}`)}
                          style={{
                            backgroundColor: '#C39B5A',
                            color: '#0F172A',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontWeight: '850',
                            cursor: 'pointer',
                            fontSize: '12px',
                            width: '100%',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          📸 Site photos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Earnings & Passbook View */}
        {activeMainTab === 'earnings' && (
          <div style={{ marginTop: '24px' }}>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 Lifetime Earnings</span>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0', color: '#10B981' }}>Rs. {earningsData.totalLifetimeEarnings.toLocaleString()}</h2>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏳ Pending Settlement</span>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0', color: '#EF4444' }}>Rs. {earningsData.pendingSettlement.toLocaleString()}</h2>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📜 Completed Events</span>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0', color: '#C39B5A' }}>{earningsData.completedEventsCount} Events</h2>
              </div>
            </div>

            {/* Passbook History List */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
                📜 Crew Payout Passbook & Transaction Ledger
              </h3>

              {earningsData.payouts.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No payout records found in your passbook ledger.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800' }}>Date</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800' }}>Event Details</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800' }}>Payment Mode</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800', textAlign: 'right' }}>Base Wage</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800', textAlign: 'right' }}>Bonus</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800', textAlign: 'right' }}>Total Paid</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: '800', textAlign: 'center' }}>Voucher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earningsData.payouts.map((pay) => (
                        <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px 8px' }}>{new Date(pay.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '16px 8px' }}>
                            <div style={{ fontWeight: '700' }}>{pay.order?.orderNumber || 'General Settlement'}</div>
                            {pay.order && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pay.order.eventType}</div>}
                            {pay.notes && <div style={{ fontSize: '11px', color: '#C39B5A', marginTop: '2px', fontStyle: 'italic' }}>Note: {pay.notes}</div>}
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8' }}>{pay.payoutMode}</span>
                            {pay.transactionRef && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ref: {pay.transactionRef}</div>}
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: '600' }}>Rs. {pay.baseAmount.toFixed(2)}</td>
                          <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: '600', color: pay.bonusAmount > 0 ? '#10B981' : 'var(--text-secondary)' }}>
                            Rs. {pay.bonusAmount.toFixed(2)}
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: '800', color: '#10B981' }}>Rs. {pay.totalAmount.toFixed(2)}</td>
                          <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => downloadPayoutReceipt(pay)}
                              style={{
                                backgroundColor: 'rgba(195,155,90,0.15)',
                                color: '#C39B5A',
                                border: '1px solid #C39B5A',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '750',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              📥 PDF Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
