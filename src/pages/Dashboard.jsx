import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';

function KpiCard({ icon, label, value, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '14px 16px', cursor: onClick ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'border-color 0.2s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: bg || C.goldDim,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: color || C.text, fontFamily: FONTS.display }}>{value}</div>
      </div>
    </div>
  );
}

function JobRow({ job, onClick }) {
  const st = STATUS_MAP[job.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: job.status };
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: `1px solid ${C.border}`,
      cursor: 'pointer',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: FONTS.mono }}>
          {job.lscmRef || job.reference || `JOB-${String(job.id).padStart(3,'0')}`}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {typeof job.client === 'string' ? job.client : job.client?.name || '—'} · {job.corridor || '—'}
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
        background: st.bg, color: st.color, whiteSpace: 'nowrap',
      }}>{st.label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ active: 0, tasks: 0, docs: 0, alerts: 0 });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api('/jobs').then(d => {
        const list = Array.isArray(d) ? d : d?.data || [];
        setJobs(list.slice(0, 8));
        const active = list.filter(j => !['CLOSED','DELIVERED','ABORTED','INVOICED'].includes(j.status)).length;
        setStats(s => ({ ...s, active }));
      }),
      api('/tasks').then(d => {
        const list = Array.isArray(d) ? d : d?.data || [];
        setStats(s => ({ ...s, tasks: list.filter(t => t.status !== 'DONE').length }));
      }),
      api('/documents').then(d => {
        const list = Array.isArray(d) ? d : d?.data || [];
        setStats(s => ({ ...s, docs: list.filter(doc => doc.status === 'PENDING' || doc.status === 'DRAFT').length }));
      }),
      api('/copq').then(d => {
        const list = Array.isArray(d) ? d : d?.data || [];
        setStats(s => ({ ...s, alerts: list.filter(c => c.status === 'OPEN').length }));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text }}>
          {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤' : '🌙'}{' '}
          {t('dashboard')}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>CLEAR ERP v4.6 — LSCM</div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <KpiCard icon="⬡" label={t('activeJobs')} value={loading ? '—' : stats.active} color={C.gold} bg={C.goldDim} onClick={() => navigate('/jobs')} />
        <KpiCard icon="✓" label={t('myTasks')} value={loading ? '—' : stats.tasks} color={C.blue} bg={C.blueDim} />
        <KpiCard icon="◫" label={t('docsToReview')} value={loading ? '—' : stats.docs} color={C.orange} bg={C.orangeDim} />
        <KpiCard icon="▲" label={t('alerts')} value={loading ? '—' : stats.alerts} color={C.red} bg={C.redDim} />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.mid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('quickActions')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: '📋', label: t('newRfc'), to: '/reports' },
            { icon: '📷', label: t('scanQr'), to: '/scan' },
            { icon: '📝', label: t('fieldReport'), to: '/reports' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.to)} style={{
              flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('recentJobs')}
          </span>
          <button onClick={() => navigate('/jobs')} style={{
            background: 'none', border: 'none', color: C.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>{t('viewAll')} →</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No jobs yet</div>
        ) : (
          jobs.map(j => <JobRow key={j.id} job={j} onClick={() => navigate(`/jobs/${j.id}`)} />)
        )}
      </div>
    </div>
  );
}
