import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS } from '../theme';
import { arr, str } from '../safe';

const SEVERITY_STYLE = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: '🔴' },
  HIGH: { color: '#F97316', bg: 'rgba(249,115,22,0.12)', icon: '🟠' },
  MEDIUM: { color: '#F5A800', bg: 'rgba(245,168,0,0.12)', icon: '🟡' },
  LOW: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: '🟢' },
};

export default function Alerts() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [copq, setCopq] = useState([]);
  const [ncrs, setNcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('copq');

  useEffect(() => {
    Promise.allSettled([
      api('/copq').then(d => setCopq(arr(d))).catch(() => {}),
      api('/ncr').then(d => setNcrs(arr(d))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← {t('dashboard')}</button>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 16 }}>{t('alerts')}</div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: C.surface, borderRadius: 10, padding: 3 }}>
        {[
          { key: 'copq', label: 'COPQ (' + copq.length + ')' },
          { key: 'ncr', label: 'NCR (' + ncrs.length + ')' },
        ].map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: tab === tb.key ? C.gold : 'transparent',
            color: tab === tb.key ? C.bg : C.muted,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{tb.label}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>Loading...</div> : tab === 'copq' ? (
        copq.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>No COPQ events</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Operations are running clean</div>
          </div>
        ) : copq.map(c => {
          const sev = SEVERITY_STYLE[c.severity] || SEVERITY_STYLE.MEDIUM;
          return (
            <div key={c.id} onClick={() => c.jobId ? nav('/jobs/' + c.jobId) : null} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 14, marginBottom: 8, cursor: c.jobId ? 'pointer' : 'default',
              borderLeft: `3px solid ${sev.color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{sev.icon + ' ' + str(c.type || c.category)}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: sev.bg, color: sev.color }}>{str(c.status)}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{str(c.description)}</div>
              {c.costUsd != null && <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginTop: 4 }}>{'Cost: $' + Number(c.costUsd).toLocaleString()}</div>}
            </div>
          );
        })
      ) : (
        ncrs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>No NCRs</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Quality compliance is strong</div>
          </div>
        ) : ncrs.map(n => {
          const sev = SEVERITY_STYLE[n.severity] || SEVERITY_STYLE.MEDIUM;
          return (
            <div key={n.id} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 14, marginBottom: 8, borderLeft: `3px solid ${sev.color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{str(n.title || n.ncrNumber || n.type)}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: sev.bg, color: sev.color }}>{str(n.status)}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{str(n.description)}</div>
              {n.rootCause && <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>{'Root cause: ' + str(n.rootCause)}</div>}
            </div>
          );
        })
      )}
    </div>
  );
}
