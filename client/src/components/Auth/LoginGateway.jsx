import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../types';
import { Logo } from '../Common/Logo';

export const LoginGateway = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.CUSTOMER);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { loginWithGoogleToken, logout, isAuthenticated, user } = useAuth();
  const googleBtnRef = useRef(null);

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '871965050422-hgt53cj9m38hu6o392ffntcm3t9c9rs5.apps.googleusercontent.com';

  // Helper function to navigate user to role-specific dashboard
  const redirectUserToDashboard = (userRole) => {
    if (userRole === USER_ROLES.ADMIN) {
      navigate('/admin/orders');
    } else if (userRole === USER_ROLES.WORKER) {
      navigate('/worker/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
  };

  // LOOP 21: AUTOMATIC REDIRECT GUARD FOR ALREADY AUTHENTICATED USERS
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      redirectUserToDashboard(user.role);
    }
  }, [isAuthenticated, user]);

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Load Google Identity Services script & render official Google SSO button
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            setLoading(true);
            setErrorMsg(null);
            try {
              const loggedUser = await loginWithGoogleToken(response.credential, selectedRole);
              setLoading(false);
              onLoginSuccess?.(loggedUser);
              redirectUserToDashboard(loggedUser.role);
            } catch (err) {
              setLoading(false);
              setErrorMsg(err.message || 'Google Authentication failed.');
            }
          },
        });

        // Render official Google Sign-In Button with standardized 320px width & filled_blue theme
        try {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'continue_with',
            logo_alignment: 'left',
          });
          setIsGoogleLoaded(true);
        } catch (e) {
          console.warn('Failed rendering GIS button:', e);
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [selectedRole]);

  // LOOP 21: DEV QUICK LOGIN HANDLER WITH IMMEDIATE DASHBOARD REDIRECT
  const handleDevFastLogin = async (overrideRole) => {
    const roleToLogin = overrideRole || selectedRole;
    setLoading(true);
    setErrorMsg(null);

    let mockEmail = 'customer@example.com';
    if (roleToLogin === USER_ROLES.WORKER) mockEmail = 'worker.led@bhaktistudio.com';
    if (roleToLogin === USER_ROLES.ADMIN) mockEmail = 'admin@bhaktistudio.com';

    try {
      const mockIdToken = `mock_token_${mockEmail}_${roleToLogin}`;
      const loggedUser = await loginWithGoogleToken(mockIdToken, roleToLogin);
      setLoading(false);
      onLoginSuccess?.(loggedUser);
      redirectUserToDashboard(loggedUser.role);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Login failed.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '28px',
          border: '1px solid var(--border-color)',
          padding: '44px 36px',
          boxShadow: '0 25px 40px -10px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header Branding with Custom Vector Emblem Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <Logo size="large" layout="vertical" />
          </div>
          <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-secondary)', margin: 0 }}>
            Select your account portal to proceed
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#DC2626',
              padding: '14px 18px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '28px',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Role Selection Label */}
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '800',
            color: '#C97A13',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          Select Role Portal:
        </label>

        {/* Role Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { role: USER_ROLES.CUSTOMER, label: 'Customer', icon: '👤' },
            { role: USER_ROLES.WORKER, label: 'Worker', icon: '🛠️' },
            { role: USER_ROLES.ADMIN, label: 'Admin', icon: '👑' },
          ].map((item) => {
            const isSelected = selectedRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  setSelectedRole(item.role);
                  setErrorMsg(null);
                }}
                style={{
                  backgroundColor: isSelected ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                  border: isSelected ? '2px solid #C97A13' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '18px 10px',
                  cursor: 'pointer',
                  color: isSelected ? '#C97A13' : 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Official Google Sign-In Button Container */}
        <div
          className="w-full flex items-center justify-center my-5 min-h-[50px] overflow-visible"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px 0',
            minHeight: '50px',
            overflow: 'visible',
          }}
        >
          <div
            ref={googleBtnRef}
            id="google-login-btn"
            className="w-full flex justify-center scale-100 sm:scale-105 transition-transform"
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          />
        </div>

        {/* Custom Branded Fallback / Direct Button Option */}
        <button
          type="button"
          onClick={() => handleDevFastLogin()}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            fontWeight: '600',
            fontSize: '14px',
            borderRadius: '12px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginTop: '8px',
          }}
        >
          <svg className="w-5 h-5 shrink-0" style={{ width: '20px', height: '20px', flexShrink: 0 }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>


        {/* LOOP 59: WORKER SELF-REGISTRATION CALLOUT BOX */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'var(--bg-input)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
            Interested in joining Bhakti Studio as Event Crew?
          </div>
          <button
            type="button"
            onClick={() => navigate('/join-crew')}
            style={{
              backgroundColor: 'transparent',
              color: '#C39B5A',
              border: '1px solid #C39B5A',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            💼 Apply for Work / Register Here ➔
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '20px', marginBottom: 0 }}>
          Protected by server-side Role-Based Access Control (RBAC).
        </p>
      </div>
    </div>
  );
};
