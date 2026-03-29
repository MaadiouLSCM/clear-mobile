import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { login } from '../api';
import { C, FONTS } from '../theme';

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pwd) return;
    setLoading(true);
    setError('');
    try {
      await login(email, pwd);
      navigate('/', { replace: true });
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', padding: 32, background: C.bg,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          fontFamily: FONTS.display, fontWeight: 800, fontSize: 36,
          color: C.gold, letterSpacing: '0.08em', marginBottom: 8,
        }}>≡LSCM≡</div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: C.muted, letterSpacing: '0.15em' }}>
          CLEAR FIELD
        </div>
        <div style={{
          width: 48, height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
          margin: '16px auto 0',
        }} />
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={t('email')} autoComplete="email" autoCapitalize="none"
          style={{
            width: '100%', padding: '14px 16px', marginBottom: 12,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            color: C.text, fontSize: 15, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <input
          type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          placeholder={t('password')} autoComplete="current-password"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '14px 16px', marginBottom: 20,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            color: C.text, fontSize: 15, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = C.gold}
          onBlur={e => e.target.style.borderColor = C.border}
        />

        {error && (
          <div style={{
            background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 10,
            padding: '10px 14px', marginBottom: 16, color: C.red, fontSize: 13, fontWeight: 600,
            textAlign: 'center',
          }}>{error}</div>
        )}

        <button onClick={handleLogin} disabled={loading || !email || !pwd} style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: loading ? C.surface2 : C.gold,
          color: loading ? C.muted : C.bg,
          fontSize: 16, fontWeight: 700, fontFamily: FONTS.display,
          cursor: loading ? 'wait' : 'pointer', letterSpacing: '0.04em',
          transition: 'all 0.2s', opacity: (!email || !pwd) ? 0.5 : 1,
        }}>
          {loading ? '...' : t('loginBtn')}
        </button>
      </div>

      <div style={{
        position: 'absolute', bottom: 24, fontFamily: FONTS.mono,
        fontSize: 11, color: C.muted,
      }}>v4.6 — CLEAR Field</div>
    </div>
  );
}
