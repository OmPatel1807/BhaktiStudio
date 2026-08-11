import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Runtime Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#1E293B',
              borderRadius: '24px',
              border: '1px solid #EF4444',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', color: '#F8FAFC' }}>
              Something Went Wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 20px 0' }}>
              An uncaught component error occurred. Our security monitors have logged this event.
            </p>

            <div
              style={{
                backgroundColor: '#0F172A',
                padding: '12px',
                borderRadius: '10px',
                color: '#FCA5A5',
                fontSize: '12px',
                textAlign: 'left',
                marginBottom: '24px',
                maxHeight: '140px',
                overflowY: 'auto',
              }}
            >
              {this.state.error?.toString()}
            </div>

            <button
              onClick={() => (window.location.href = '/')}
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontWeight: '800',
                fontSize: '14px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              }}
            >
              Return to Home Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
