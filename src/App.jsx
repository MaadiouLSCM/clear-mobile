import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from './i18n';
import { isAuthenticated } from './api';
import { C, FONTS } from './theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Scan from './pages/Scan';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Alerts from './pages/Alerts';
import Tracking from './pages/Tracking';
import { useState, useEffect, Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#E8EAF0', background: '#0D0F14', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#F5A800' }}>CLEAR Field Error</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, maxWidth: 300, wordBreak: 'break-word' }}>
            {String(this.state.error?.message || 'Unknown error')}
          </div>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{ background: '#F5A800', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#0D0F14', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const tabs = [
    { key: '/', icon: '◧', label: t('dashboard') },
    { key: '/jobs', icon: '⬡', label: t('jobs') },
    { key: '/scan', icon: '⊙', label: t('scan'), accent: true },
    { key: '/reports', icon: '◫', label: t('reports') },
    { key: '/profile', icon: '◉', label: t('profile') },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: C.surface, borderTop: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: 6,
    }}>
      {tabs.map(tab => {
        const active = tab.key === '/' ? path === '/' : path.startsWith(tab.key);
        return (
          <button key={tab.key} onClick={() => navigate(tab.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 12px', minWidth: 56,
          }}>
            {tab.accent ? (
              <div style={{
                fontSize: 22, lineHeight: '44px', textAlign: 'center',
                background: active ? C.gold : C.surface2,
                borderRadius: '50%', width: 44, height: 44,
                color: active ? C.bg : C.muted,
                border: active ? 'none' : `2px solid ${C.border}`,
              }}>{tab.icon}</div>
            ) : (
              <div style={{ fontSize: 20, color: active ? C.gold : C.muted, lineHeight: '24px', height: 24 }}>{tab.icon}</div>
            )}
            <span style={{
              fontSize: 10, fontWeight: active ? 700 : 500,
              color: active ? C.gold : C.muted,
              fontFamily: FONTS.body,
            }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function StatusBar() {
  const { t } = useI18n();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    try {
      setOnline(navigator.onLine);
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: C.bg, borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 52,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 18, color: C.gold, letterSpacing: '0.05em' }}>
          ≡LSCM≡
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.muted }}>CLEAR Field</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 20,
        background: online ? C.greenDim : C.redDim,
        border: `1px solid ${online ? C.green : C.red}33`,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: online ? C.green : C.red }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: online ? C.green : C.red, fontFamily: FONTS.mono }}>
          {t(online ? 'online' : 'offline')}
        </span>
      </div>
    </header>
  );
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function App() {
  const { isRtl } = useI18n();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <ErrorBoundary>
      <div dir={isRtl ? 'rtl' : 'ltr'} style={{ height: '100%', background: C.bg }}>
        {!isLogin && <StatusBar />}
        <main style={{
          height: '100%',
          paddingTop: isLogin ? 0 : 52,
          paddingBottom: isLogin ? 0 : 72,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!isLogin && <BottomNav />}
      </div>
    </ErrorBoundary>
  );
}
