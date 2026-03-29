import { useI18n } from '../i18n';
import { logout } from '../api';
import { C, FONTS } from '../theme';

export default function Profile() {
  const { t, lang, setLang, langs } = useI18n();

  // Decode JWT for user info
  let user = { email: '—', role: '—' };
  try {
    const token = localStorage.getItem('clear-token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user = { email: payload.email || '—', role: payload.role || '—', name: payload.name || payload.email?.split('@')[0] || '—' };
    }
  } catch {}

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 20 }}>
        {t('profile')}
      </div>

      {/* User card */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: C.goldDim,
          border: `2px solid ${C.gold}`, margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, fontFamily: FONTS.display, color: C.gold,
        }}>
          {(user.name || '?')[0].toUpperCase()}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{user.name}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{user.email}</div>
        <div style={{
          display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 20,
          background: C.goldDim, border: `1px solid ${C.goldBorder}`,
          fontSize: 11, fontWeight: 700, color: C.gold, fontFamily: FONTS.mono,
        }}>{user.role}</div>
      </div>

      {/* Language selector */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 16, marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('language')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {langs.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: lang === l.code ? C.goldDim : C.surface2,
              color: lang === l.code ? C.gold : C.muted,
              border: `1px solid ${lang === l.code ? C.goldBorder : C.border}`,
              fontSize: 13, fontWeight: 600,
            }}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings rows */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        overflow: 'hidden', marginBottom: 20,
      }}>
        {[
          { icon: '🔔', label: t('notifications'), value: 'ON' },
          { icon: '☁️', label: 'Offline cache', value: navigator.onLine ? 'Synced' : 'Pending' },
          { icon: '📱', label: t('version'), value: 'v4.6' },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{row.icon}</span>
              <span style={{ fontSize: 14, color: C.text }}>{row.label}</span>
            </div>
            <span style={{ fontSize: 13, color: C.muted, fontFamily: FONTS.mono }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={logout} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: C.redDim, border: `1px solid ${C.red}33`,
        color: C.red, fontSize: 15, fontWeight: 700, fontFamily: FONTS.display,
        cursor: 'pointer',
      }}>
        {t('logout')}
      </button>

      <div style={{ textAlign: 'center', marginTop: 20, fontFamily: FONTS.mono, fontSize: 10, color: C.muted }}>
        CLEAR Field v4.6 · ≡LSCM≡ · 2026
      </div>
    </div>
  );
}
