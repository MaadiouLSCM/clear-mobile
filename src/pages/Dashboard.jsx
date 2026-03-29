import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';
import { arr, jobRef, clientStr, corridorStr } from '../safe';

function KpiCard({ icon, label, value, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: color, fontFamily: FONTS.display }}>{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [stats, setStats] = useState({ active: 0, tasks: 0, docs: 0, alerts: 0 });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    Promise.allSettled([
      api('/jobs').catch(() => []),
      api('/tasks').catch(() => []),
      api('/documents').catch(() => []),
      api('/copq').catch(() => []),
    ]).then(([jr, tr, dr, cr]) => {
      if (!ok) return;
      const jl = arr(jr.value); const tl = arr(tr.value); const dl = arr(dr.value); const cl = arr(cr.value);
      setJobs(jl.slice(0, 8));
      setStats({
        active: jl.filter(j => !['CLOSED','DELIVERED','ABORTED','INVOICED'].includes(j?.status)).length,
        tasks: tl.filter(t => t?.status !== 'DONE').length,
        docs: dl.filter(d => d?.status === 'PENDING' || d?.status === 'DRAFT').length,
        alerts: cl.filter(c => c?.status === 'OPEN').length,
      });
    }).finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, []);

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text }}>
          {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙'} {t('dashboard')}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>CLEAR ERP v4.6 — LSCM</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <KpiCard icon="⬡" label={t('activeJobs')} value={loading ? '—' : stats.active} color={C.gold} bg={C.goldDim} onClick={() => nav('/jobs')} />
        <KpiCard icon="✓" label={t('myTasks')} value={loading ? '—' : stats.tasks} color={C.blue} bg={C.blueDim} onClick={() => nav('/jobs')} />
        <KpiCard icon="◫" label={t('docsToReview')} value={loading ? '—' : stats.docs} color={C.orange} bg={C.orangeDim} onClick={() => nav('/jobs')} />
        <KpiCard icon="▲" label={t('alerts')} value={loading ? '—' : stats.alerts} color={C.red} bg={C.redDim} onClick={() => nav('/jobs')} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.mid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('quickActions')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ icon: '📋', label: t('newRfc'), to: '/reports' }, { icon: '📷', label: t('scanQr'), to: '/scan' }, { icon: '📝', label: t('fieldReport'), to: '/reports' }].map(a => (
            <button key={a.to + a.label} onClick={() => nav(a.to)} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: C.text }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('recentJobs')}</span>
          <button onClick={() => nav('/jobs')} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t('viewAll')} →</button>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>...</div> :
          jobs.map(j => { if (!j) return null; const st = STATUS_MAP[j.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: j.status || '?' };
            return (
              <div key={j.id} onClick={() => nav('/jobs/' + j.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: FONTS.mono }}>{jobRef(j)}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientStr(j)} · {corridorStr(j)}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: st.bg, color: st.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{st.label}</span>
              </div>);
          })}
      </div>
    </div>
  );
}
