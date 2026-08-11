import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../types';

export const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading access credentials...</div>;
  if (!isAuthenticated || user?.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export const WorkerRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading access credentials...</div>;
  if (!isAuthenticated || user?.role !== USER_ROLES.WORKER) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export const CustomerRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading access credentials...</div>;
  if (!isAuthenticated || user?.role !== USER_ROLES.CUSTOMER) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
