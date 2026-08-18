import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SplashScreen } from './components/Splash/SplashScreen';
import { LoginGateway } from './components/Auth/LoginGateway';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { OrderWizard } from './pages/Customer/OrderWizard';
import { CustomerDashboard } from './pages/Customer/CustomerDashboard';
import { CatalogManager } from './pages/Admin/CatalogManager';
import { QuotationEditor } from './pages/Admin/QuotationEditor';
import { WorkerManager } from './pages/Admin/WorkerManager';
import { WorkerRegistration } from './pages/Public/WorkerRegistration';
import { WorkerDashboard } from './pages/Worker/WorkerDashboard';
import { EventWorkspace } from './pages/Worker/EventWorkspace';
import { InvoiceView } from './pages/Customer/InvoiceView';
import { AnalyticsDashboard } from './pages/Admin/AnalyticsDashboard';
import { AuditLogViewer } from './pages/Admin/AuditLogViewer';
import { AdminOrderManager } from './pages/Admin/AdminOrderManager';
import { NotificationBell } from './components/Notifications/NotificationBell';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { Logo } from './components/Common/Logo';

function NavigationBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // LOOP 20/22: AUTH PAGE CHECK (Hides internal links like Order Wizard on / and /login)
  const isAuthPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/auth');

  // LOOP 22: CLEAN SIGN-OUT HANDLER WITH IMMEDIATE LOGIN REDIRECT
  const handleSignOut = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" onClick={closeMobileMenu} style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            <Logo size="medium" />
          </Link>

          {/* DESKTOP ROLE-BASED NAVIGATION LINKS */}
          {!isAuthPage && (
            <nav className="hidden-mobile" style={{ alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
              {/* CUSTOMER & PUBLIC LINKS */}
              {(!isAuthenticated || user?.role === 'CUSTOMER') && (
                <>
                  {location.pathname !== '/join-crew' && (
                    <Link
                      to="/customer/new-order"
                      style={{
                        color: location.pathname === '/customer/new-order' ? '#C97A13' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '15px',
                        fontWeight: '700',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        backgroundColor: location.pathname === '/customer/new-order' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🛒 Order Wizard
                    </Link>
                  )}
                  {isAuthenticated && location.pathname !== '/join-crew' && (
                    <Link
                      to="/customer/dashboard"
                      style={{
                        color: location.pathname === '/customer/dashboard' ? '#C97A13' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '15px',
                        fontWeight: '700',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        backgroundColor: location.pathname === '/customer/dashboard' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📜 Customer Portal
                    </Link>
                  )}
                  <Link
                    to="/join-crew"
                    style={{
                      color: location.pathname === '/join-crew' ? '#FFFFFF' : '#C39B5A',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '800',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/join-crew' ? '#C39B5A' : 'rgba(195, 155, 90, 0.12)',
                      border: '1px solid #C39B5A',
                      boxShadow: location.pathname === '/join-crew' ? '0 4px 12px rgba(195, 155, 90, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    💼 Join as Crew
                  </Link>
                </>
              )}

              {/* WORKER LINKS */}
              {user?.role === 'WORKER' && (
                <Link
                  to="/worker/dashboard"
                  style={{
                    color: location.pathname === '/worker/dashboard' ? '#C97A13' : 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '700',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: location.pathname === '/worker/dashboard' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  👷 Worker Portal
                </Link>
              )}

              {/* ADMIN LINKS */}
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/analytics"
                    style={{
                      color: location.pathname === '/admin/analytics' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/analytics' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📊 Analytics
                  </Link>
                  <Link
                    to="/admin/orders"
                    style={{
                      color: location.pathname === '/admin/orders' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/orders' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📦 Orders
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    style={{
                      color: location.pathname === '/admin/audit-logs' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/audit-logs' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🛡️ Audit Logs
                  </Link>
                  <Link
                    to="/admin/catalog"
                    style={{
                      color: location.pathname === '/admin/catalog' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/catalog' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    👑 Catalog
                  </Link>
                  <Link
                    to="/admin/workers"
                    style={{
                      color: location.pathname === '/admin/workers' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/workers' ? 'rgba(201, 122, 19, 0.15)' : 'transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🛠️ Workers
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* RIGHT DESKTOP CONTROLS */}
        <div className="hidden-mobile" style={{ alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '140px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', textAlign: 'right' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(201, 122, 19, 0.2)',
                    color: '#C97A13',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            !isAuthPage && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: '#C97A13',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign In
              </button>
            )
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON & TOP BAR CONTROLS */}
        <div className="show-mobile-only" style={{ alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {isAuthenticated && <NotificationBell />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '18px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {mobileMenuOpen ? '✕' : '🍔'}
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN NAVIGATION DRAWER MENU */}
      {mobileMenuOpen && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {!isAuthPage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!isAuthenticated || user?.role === 'CUSTOMER') && (
                <>
                  {location.pathname !== '/join-crew' && (
                    <Link
                      to="/customer/new-order"
                      onClick={closeMobileMenu}
                      style={{
                        color: location.pathname === '/customer/new-order' ? '#C97A13' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '700',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: location.pathname === '/customer/new-order' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                      }}
                    >
                      🛒 Order Wizard
                    </Link>
                  )}
                  {isAuthenticated && location.pathname !== '/join-crew' && (
                    <Link
                      to="/customer/dashboard"
                      onClick={closeMobileMenu}
                      style={{
                        color: location.pathname === '/customer/dashboard' ? '#C97A13' : 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '700',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: location.pathname === '/customer/dashboard' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                      }}
                    >
                      📜 Customer Portal
                    </Link>
                  )}
                  <Link
                    to="/join-crew"
                    onClick={closeMobileMenu}
                    style={{
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: '800',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#C39B5A',
                      textAlign: 'center',
                    }}
                  >
                    💼 Join as Crew
                  </Link>
                </>
              )}

              {user?.role === 'WORKER' && (
                <Link
                  to="/worker/dashboard"
                  onClick={closeMobileMenu}
                  style={{
                    color: location.pathname === '/worker/dashboard' ? '#C97A13' : 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: '700',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: location.pathname === '/worker/dashboard' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                  }}
                >
                  👷 Worker Portal
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/analytics"
                    onClick={closeMobileMenu}
                    style={{
                      color: location.pathname === '/admin/analytics' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '700',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/analytics' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                    }}
                  >
                    📊 Analytics
                  </Link>
                  <Link
                    to="/admin/orders"
                    onClick={closeMobileMenu}
                    style={{
                      color: location.pathname === '/admin/orders' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '700',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/orders' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                    }}
                  >
                    📦 Orders
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={closeMobileMenu}
                    style={{
                      color: location.pathname === '/admin/audit-logs' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '700',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/audit-logs' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                    }}
                  >
                    🛡️ Audit Logs
                  </Link>
                  <Link
                    to="/admin/catalog"
                    onClick={closeMobileMenu}
                    style={{
                      color: location.pathname === '/admin/catalog' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '700',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/catalog' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                    }}
                  >
                    👑 Catalog
                  </Link>
                  <Link
                    to="/admin/workers"
                    onClick={closeMobileMenu}
                    style={{
                      color: location.pathname === '/admin/workers' ? '#C97A13' : 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '16px',
                      fontWeight: '700',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: location.pathname === '/admin/workers' ? 'rgba(201, 122, 19, 0.15)' : 'var(--bg-input)',
                    }}
                  >
                    🛠️ Workers
                  </Link>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  border: '1px solid #EF4444',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            ) : (
              !isAuthPage && (
                <button
                  onClick={() => { closeMobileMenu(); navigate('/login'); }}
                  style={{
                    backgroundColor: '#C97A13',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MainApp() {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <>
      {!splashFinished && <SplashScreen onComplete={() => setSplashFinished(true)} />}
      <NavigationBar />
      <main>
        <Routes>
          <Route path="/" element={<LoginGateway />} />
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/join-crew" element={<WorkerRegistration />} />

          {/* LOOP 22: STRICT PROTECTED ROUTE GUARDS */}
          <Route
            path="/customer/new-order"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <OrderWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/invoice/:quotationId"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <InvoiceView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/workspace/:orderId"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <EventWorkspace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOrderManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotation/:orderId"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QuotationEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CatalogManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <WorkerManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditLogViewer />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <style>{`
        html, body, #root {
          max-width: 100vw !important;
          overflow-x: hidden !important;
          position: relative;
          box-sizing: border-box;
        }

        *, *:before, *:after {
          box-sizing: inherit;
        }

        @media (max-width: 1023px) {
          .hidden-mobile {
            display: none !important;
          }
          .show-mobile-only {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .hidden-mobile {
            display: flex !important;
          }
          .show-mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <MainApp />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
