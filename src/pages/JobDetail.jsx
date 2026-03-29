import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';

const TABS = ['items', 'documents', 'timeline', 'tracking'];

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [tab, setTab] = useState('items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api(`/jobs/${id}`).then(setJob),
      api(`/items?jobId=${id}`).then(d => setItems(Array.isArray(d) ? d : d?.data || [])).catch(() => setItems([])),
      api(`/documents?jobId=${id}`).then(d => setDocs(Array.isArray(d) ? d : d?.data || [])).catch(() => setDocs([])),
      api(`/tracking?jobId=${id}`).then(d => setTracking(Array.isArray(d) ? d : d?.data || [])).catch(() => setTracking([])),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>Loading...</div>;
  if (!job) return <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>Job not found</div>;

  const st = STATUS_MAP[job.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: job.status };
  const clientName = typeof job.client === 'string' ? job.client : job.client?.name || '—';

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: C.gold, fontSize: 14, fontWeight: 600,
        cursor: 'pointer', marginBottom: 12, padding: 0,
      }}>← {t('jobs')}</button>

      {/* Header */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 16, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 800, fontSize: 18, color: C.gold }}>
            {job.lscmRef || job.reference || `JOB-${String(job.id).padStart(3,'0')}`}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
            background: st.bg, color: st.color,
          }}>{st.label}</span>
        </div>
        <InfoRow label={t('client')} value={clientName} />
        <InfoRow label={t('corridor')} value={job.corridor} />
        <InfoRow label="PO" value={job.poRef} />
        <InfoRow label="Incoterm" value={job.incoterm} />
        <InfoRow label="Mode" value={job.transportMode} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: C.surface, borderRadius: 10, padding: 3 }}>
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: tab === tb ? C.gold : 'transparent',
            color: tab === tb ? C.bg : C.muted,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{t(tb)}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'items' && (
        items.length === 0 ? <Empty /> : items.map(item => (
          <div key={item.id} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 12, marginBottom: 6,
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 }}>
              {item.description || item.material || `Item #${item.id}`}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
              {item.quantity && <span>Qty: {item.quantity}</span>}
              {item.unit && <span>{item.unit}</span>}
              {item.hsCode && <span>HS: {item.hsCode}</span>}
            </div>
          </div>
        ))
      )}

      {tab === 'documents' && (
        docs.length === 0 ? <Empty /> : docs.map(doc => (
          <div key={doc.id} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.name || doc.type || `Doc #${doc.id}`}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{doc.type} · {doc.status}</div>
            </div>
          </div>
        ))
      )}

      {tab === 'timeline' && (
        <div style={{ padding: '8px 0 8px 20px', borderLeft: `2px solid ${C.gold}33` }}>
          {['RFC', 'DOCUMENT_ASSEMBLY', 'PLANNING', 'COLLECTION', 'CONSOLIDATION', 'GREEN_LIGHT', 'EXPORT_DEPARTURE', 'IN_TRANSIT', 'IMPORT_CLEARANCE', 'DELIVERED'].map((step, i) => {
            const s = STATUS_MAP[step];
            const steps = ['RFC', 'DOCUMENT_ASSEMBLY', 'PLANNING', 'COLLECTION', 'CONSOLIDATION', 'GREEN_LIGHT', 'EXPORT_DEPARTURE', 'IN_TRANSIT', 'IMPORT_CLEARANCE', 'DELIVERED'];
            const currentIdx = steps.indexOf(job.status);
            const done = i <= currentIdx;
            const current = i === currentIdx;
            return (
              <div key={step} style={{ position: 'relative', paddingBottom: 20, paddingLeft: 20 }}>
                <div style={{
                  position: 'absolute', left: -7, top: 2,
                  width: 12, height: 12, borderRadius: '50%',
                  background: done ? (current ? C.gold : C.green) : C.surface2,
                  border: `2px solid ${done ? (current ? C.gold : C.green) : C.border}`,
                }} />
                <div style={{ fontSize: 13, fontWeight: current ? 800 : 500, color: done ? C.text : C.muted }}>
                  {s?.label || step}
                </div>
                {current && <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>● Current</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'tracking' && (
        tracking.length === 0 ? <Empty /> : tracking.map(tr => (
          <div key={tr.id} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 12, marginBottom: 6,
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{tr.event || tr.description || 'Event'}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {tr.location || '—'} · {tr.createdAt ? new Date(tr.createdAt).toLocaleString() : '—'}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Empty() {
  return <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>No data</div>;
}
