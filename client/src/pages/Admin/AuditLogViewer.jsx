import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogViewer = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLogDiff, setSelectedLogDiff] = useState(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/v1/audit-logs', window.location.origin);
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setLogs(json.data.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAuditLogs();
  }, [token, search]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A', // Obsidian Dark
        color: '#F8FAFC',
        padding: '32px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
              System Security & Audit Trail
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: '4px 0 0 0' }}>
              Immutable record of security events, role changes, quotation edits, and payment verifications.
            </p>
          </div>

          <input
            type="text"
            placeholder="🔍 Search action, user, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '10px 16px',
              width: '280px',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Audit Table */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '24px',
            border: '1px solid #334155',
            padding: '24px',
          }}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading security logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No audit logs recorded yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '12px' }}>Timestamp</th>
                  <th style={{ padding: '12px' }}>Actor / User</th>
                  <th style={{ padding: '12px' }}>Action Type</th>
                  <th style={{ padding: '12px' }}>Order Ref</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Payload Diff</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', color: '#94A3B8' }}>{formatDateTime(log.createdAt)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '700', color: '#F8FAFC' }}>{log.user?.name || 'System / Guest'}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{log.user?.email || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          backgroundColor:
                            log.action.includes('REJECTED') || log.action.includes('SECURITY')
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            log.action.includes('REJECTED') || log.action.includes('SECURITY')
                              ? '#EF4444'
                              : '#F59E0B',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '11px',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#3B82F6', fontWeight: '700' }}>
                      {log.order?.orderNumber || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedLogDiff(log)}
                        style={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          color: '#F59E0B',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        🔍 View Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLogDiff && (
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
              padding: '28px',
              maxWidth: '720px',
              width: '90%',
              color: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '700' }}>{selectedLogDiff.action}</span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0' }}>
                  Payload JSON Diff Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogDiff(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {(() => {
              let detailsObj = {};
              try {
                detailsObj = JSON.parse(selectedLogDiff.details || '{}');
              } catch (e) {
                detailsObj = { rawText: selectedLogDiff.details };
              }

              const previousState = detailsObj.previous || detailsObj.oldValue || null;
              const updatedState = detailsObj.updated || detailsObj.newValue || null;
              const delta = detailsObj.delta || null;
              const isDiffFormat = previousState !== null || updatedState !== null || delta !== null;

              if (!isDiffFormat) {
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700' }}>Event Details Payload:</label>
                    <pre
                      style={{
                        backgroundColor: '#0F172A',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        color: '#F8FAFC',
                        maxHeight: '340px',
                        overflowY: 'auto',
                        marginTop: '6px',
                      }}
                    >
                      {JSON.stringify(detailsObj, null, 2)}
                    </pre>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Dynamic Delta Table */}
                  {delta && Object.keys(delta).length > 0 && (
                    <div style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '12px', border: '1px solid #334155', maxHeight: '200px', overflowY: 'auto' }}>
                      <label style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '800' }}>Detected Changes (Field-Level Delta):</label>
                      <div style={{ marginTop: '8px', fontSize: '11px' }}>
                        {Object.entries(delta).map(([field, values]) => (
                          <div key={field} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '12px', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
                            <span style={{ fontWeight: '700', color: '#94A3B8', wordBreak: 'break-all' }}>{field}</span>
                            <span style={{ color: '#EF4444', textDecoration: values.old ? 'line-through' : 'none', wordBreak: 'break-all' }}>{String(values.old ?? 'None')}</span>
                            <span style={{ color: '#10B981', fontWeight: '700', wordBreak: 'break-all' }}>{String(values.new ?? 'None')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous vs Updated State Codeblocks */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700' }}>Old Value (Previous State):</label>
                      <pre
                        style={{
                          backgroundColor: '#0F172A',
                          padding: '12px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: '#F8FAFC',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          marginTop: '6px',
                        }}
                      >
                        {JSON.stringify(previousState || {}, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#10B981', fontWeight: '700' }}>New Value (Updated State):</label>
                      <pre
                        style={{
                          backgroundColor: '#0F172A',
                          padding: '12px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: '#F8FAFC',
                          maxHeight: '240px',
                          overflowY: 'auto',
                          marginTop: '6px',
                        }}
                      >
                        {JSON.stringify(updatedState || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLogDiff(null)}
                style={{
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
