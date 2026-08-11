import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

export const AnalyticsDashboard = () => {
  const { token } = useAuth();
  const [timeframe, setTimeframe] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, trendsRes, pipelineRes, workloadRes] = await Promise.all([
        fetch('/api/v1/analytics/overview', { headers }),
        fetch(`/api/v1/analytics/revenue-chart?timeframe=${timeframe}`, { headers }),
        fetch('/api/v1/analytics/orders-breakdown', { headers }),
        fetch('/api/v1/analytics/workload', { headers }),
      ]);

      const [overviewJson, trendsJson, pipelineJson, workloadJson] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        pipelineRes.json(),
        workloadRes.json(),
      ]);

      if (overviewJson.success) setOverview(overviewJson.data);
      if (trendsJson.success) setRevenueTrends(trendsJson.data);
      if (pipelineJson.success) setPipeline(pipelineJson.data);
      if (workloadJson.success) setWorkload(workloadJson.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnalyticsData();
  }, [token, timeframe]);

  const maxRevenue = Math.max(...revenueTrends.map((t) => t.revenue), 1000);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '32px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header & Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
              Executive Analytics & Revenue Intelligence
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
              Real-time financial performance, pipeline status, and resource utilization.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '6m', label: '6 Months' },
              { id: '1y', label: '1 Year' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                style={{
                  backgroundColor: timeframe === tf.id ? '#F59E0B' : 'transparent',
                  color: timeframe === tf.id ? '#0F172A' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            {
              title: 'Total Revenue Collected',
              value: formatCurrency(overview?.totalRevenueCollected || 0),
              sub: `Growth: +${overview?.monthlyGrowthPercentage || 0}% vs last month`,
              icon: '💰',
            },
            {
              title: 'Pending Receivables',
              value: formatCurrency(overview?.pendingReceivables || 0),
              sub: 'Unpaid balance across quotations',
              icon: '⏳',
            },
            {
              title: 'Total Orders Count',
              value: overview?.totalOrdersCount || 0,
              sub: 'All-time client bookings',
              icon: '📜',
            },
            {
              title: 'Active Field Executions',
              value: overview?.activeExecutionsCount || 0,
              sub: 'Events in progress currently',
              icon: '⚡',
            },
          ].map((card, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{card.title}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', margin: '2px 0' }}>{card.value}</div>
                <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '600' }}>{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Trend Chart & Order Breakdown Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
          {/* Bar Chart Visualizer */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>
              Revenue Collected vs. Quoted Trends
            </h3>

            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
              {revenueTrends.map((point, i) => {
                const heightPct = Math.round((point.revenue / maxRevenue) * 100) || 10;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        backgroundColor: '#F59E0B',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease',
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px' }}>{point.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pipeline Order Status Distribution */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>
              Order Lifecycle Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pipeline.map((item) => (
                <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.status}:</span>
                  <span style={{ fontWeight: '800', color: '#F59E0B' }}>{item.count ?? item._count?.status ?? item._count?.id ?? 0} orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
