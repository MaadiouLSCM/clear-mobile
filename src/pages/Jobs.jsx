import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';

const FILTERS = ['ALL', 'RFC', 'COLLECTION', 'IN_TRANSIT', 'GREEN_LIGHT', 'DELIVERED', 'CLOSED'];

export default function Jobs() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api('/jobs').then(d => {
      setJobs(Array.isArray(d) ? d : d?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    if (filter !== 'ALL' && j.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const ref = (j.lscmRef || j.reference || '').toLowerCase();
      const client = (typeof j.client === 'string' ? j.client : j.client?.name || '').toLowerCase();
      if (!ref.includes(q) && !client.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 16 }}>
        {t('jobs')}
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  JOB-001, SNEPCO…"
        style={{
          width: '100%', padding: '12px 14px', marginBottom: 12,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          color: C.text, fontSize: 14, outline: 'none',
        }}
      />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 8 }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const st = STATUS_MAP[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none',
              background: active ? (st?.bg || C.goldDim) : C.surface,
              color: active ? (st?.color || C.gold) : C.muted,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              ...(active ? { border: `1px solid ${(st?.color || C.gold)}33` } : { border: `1px solid ${C.border}` }),
            }}>
              {f === 'ALL' ? `All (${jobs.length})` : `${st?.label || f} (${jobs.filter(j => j.status === f).length})`}
            </button>
          );
        })}
      </div>

      {/* Job list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>No jobs found</div>
      ) : (
        filtered.map(job => {
          const st = STATUS_MAP[job.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: job.status };
          return (
            <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 14, marginBottom: 8, cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 14, color: C.gold }}>
                  {job.lscmRef || job.reference || `JOB-${String(job.id).padStart(3,'0')}`}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: st.bg, color: st.color,
                }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
                <span>👤 {typeof job.client === 'string' ? job.client : job.client?.name || '—'}</span>
                <span>🛣️ {job.corridor || '—'}</span>
              </div>
              {job.poRef && (
                <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>
                  PO: {job.poRef}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
