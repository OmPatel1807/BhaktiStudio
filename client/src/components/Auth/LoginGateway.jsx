import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../types';
import { Logo } from '../Common/Logo';

export const LoginGateway = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'SIGNUP'
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.CUSTOMER);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { loginWithGoogleToken, isAuthenticated, user } = useAuth();

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

  // AUTOMATIC REDIRECT GUARD FOR ALREADY AUTHENTICATED USERS
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      redirectUserToDashboard(user.role);
    }
  }, [isAuthenticated, user]);

  // Load Google Identity Services script for token handling without auto-prompting One-Tap iframe
  useEffect(() => {
    if (window.google?.accounts?.id) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
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
      }
    };
    document.body.appendChild(script);
  }, [googleClientId, loginWithGoogleToken, onLoginSuccess, selectedRole]);

  // Real Google OAuth 2.0 Popup & Credential Handler
  const handleGoogleAuth = () => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '871965050422-hgt53cj9m38hu6o392ffntcm3t9c9rs5.apps.googleusercontent.com';

    setErrorMsg(null);

    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              setLoading(true);
              try {
                const loggedUser = await loginWithGoogleToken({
                  accessToken: tokenResponse.access_token,
                  role: selectedRole,
                  mode: authMode,
                });
                setLoading(false);
                onLoginSuccess?.(loggedUser);
                redirectUserToDashboard(loggedUser.role);
              } catch (err) {
                setLoading(false);
                setErrorMsg(err.message || 'Google Authentication failed. Please try again.');
              }
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('OAuth2 Token Client init error, falling back to direct auth:', err);
      }
    }

    // Direct / Dev fallback handler if GIS popup is blocked or unavailable
    handleDevFastLogin();
  };

  const handleDevFastLogin = async (overrideRole) => {
    const roleToLogin = overrideRole || selectedRole;
    setLoading(true);
    setErrorMsg(null);

    let mockEmail = 'customer@example.com';
    if (roleToLogin === USER_ROLES.WORKER) mockEmail = 'worker.led@bhaktistudio.com';
    if (roleToLogin === USER_ROLES.ADMIN) mockEmail = 'admin@bhaktistudio.com';

    try {
      const mockIdToken = `mock_token_${mockEmail}_${roleToLogin}`;
      const loggedUser = await loginWithGoogleToken({
        idToken: mockIdToken,
        role: roleToLogin,
        mode: authMode,
      });
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px clamp(12px, 4vw, 24px)',
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
          padding: 'clamp(24px, 6vw, 44px) clamp(16px, 5vw, 36px)',
          boxShadow: '0 25px 40px -10px rgba(0, 0, 0, 0.12)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <Logo size="large" layout="vertical" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
            {authMode === 'LOGIN'
              ? 'Welcome back! Select your portal to sign in'
              : 'Join Bhakti Studio! Select your account type to register'}
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
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Segmented Sign In / Sign Up Mode Switcher Tabs */}
        <div
          className="flex bg-slate-900/80 light:bg-[#E6DFD5] p-1 rounded-xl mb-5 w-full border border-slate-700/50 light:border-[#D6CEC5]"
          style={{
            display: 'flex',
            backgroundColor: 'var(--border-color)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
            width: '100%',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: authMode === 'LOGIN' ? 'var(--bg-surface)' : 'transparent',
              color: authMode === 'LOGIN' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER');
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: authMode === 'REGISTER' ? 'var(--bg-surface)' : 'transparent',
              color: authMode === 'REGISTER' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Selected Role Input Label */}
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '800',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          {authMode === 'LOGIN' ? 'Select Role Portal:' : 'Select Account Type:'}
        </label>

        {/* Role Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(6px, 1.5vw, 12px)', marginBottom: '24px' }}>
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
                  padding: 'clamp(10px, 3vw, 16px) clamp(4px, 1.5vw, 10px)',
                  cursor: 'pointer',
                  color: isSelected ? '#C97A13' : 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(4px, 1vw, 6px)',
                }}
              >
                <span style={{ fontSize: 'clamp(18px, 4vw, 22px)' }}>{item.icon}</span>
                <span style={{ fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: '700' }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Single Polished Custom Branded Google Button (No One-Tap Iframe) */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleGoogleAuth()}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            fontWeight: '700',
            fontSize: '15px',
            borderRadius: '14px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '16px',
          }}
        >
          <svg className="w-5 h-5 shrink-0" style={{ width: '22px', height: '22px', flexShrink: 0 }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>
            {loading
              ? 'Authenticating...'
              : authMode === 'LOGIN'
              ? 'Continue with Google'
              : 'Sign Up with Google'}
          </span>
        </button>

        {/* Dynamic Mode Switcher Footer Link */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
              setErrorMsg(null);
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#C97A13',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {authMode === 'LOGIN'
              ? 'New to Bhakti Studio? Create an account'
              : 'Already have an account? Sign in here'}
          </button>
        </div>

        {/* WORKER SELF-REGISTRATION CALLOUT BOX */}
        <div
          style={{
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

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '20px', marginBottom: 0 }}>
          Protected by server-side Role-Based Access Control (RBAC).
        </p>
      </div>
    </div>
  );
};
