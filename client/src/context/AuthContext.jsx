import React, { createContext, useContext, useState, useEffect } from 'react';
import { parseJsonResponse } from '../utils/apiHelper';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const storedToken = localStorage.getItem('bs_auth_token');
    const storedUser = localStorage.getItem('bs_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user session:', err);
      }
    }
    setLoading(false);
  }, []);

  /**
   * Google OAuth Login Request to Backend API
   * @param {string|Object} payload - Token string or payload object containing { accessToken, idToken, role, mode }
   * @param {'CUSTOMER' | 'WORKER' | 'ADMIN'} requestedRole 
   */
  const loginWithGoogleToken = async (payload, requestedRole = 'CUSTOMER') => {
    let body = {};
    if (typeof payload === 'object' && payload !== null) {
      body = {
        accessToken: payload.accessToken,
        idToken: payload.idToken || payload.credential,
        requestedRole: payload.role || requestedRole,
        mode: payload.mode || 'LOGIN',
      };
    } else {
      body = {
        idToken: payload,
        requestedRole,
        mode: 'LOGIN',
      };
    }

    const response = await fetch('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await parseJsonResponse(response);
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Google authentication failed.');
    }

    const { user: authUser, token: authToken } = data.data;
    localStorage.setItem('bs_auth_token', authToken);
    localStorage.setItem('bs_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);

    return authUser;
  };

  // LOOP 22: ABSOLUTE SIGN-OUT STATE PURGE
  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        loginWithGoogleToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
