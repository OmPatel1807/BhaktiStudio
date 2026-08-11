import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Full-screen loading spinner while restoring auth session state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--border-color)',
            borderTop: '4px solid #C97A13',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: '16px', fontSize: '16px', fontWeight: '600' }}>
          Verifying security authorization...
        </p>
      </div>
    );
  }

  // LOOP 22: STRICT UNAUTHENTICATED ROUTE GUARD
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role-specific dashboard if attempting unauthorized cross-role access
    let defaultPath = '/customer/dashboard';
    if (user.role === 'ADMIN') defaultPath = '/admin/orders';
    if (user.role === 'WORKER') defaultPath = '/worker/dashboard';

    return <Navigate to={defaultPath} replace />;
  }

  return children;
};
