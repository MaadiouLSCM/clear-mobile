import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';
import { arr, str, jobRef, clientStr, corridorStr } from '../safe';

const TABS = ['items', 'documents', 'timeline', 'tracking'];

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

const LIFECYCLE = ['RFC', 'DOCUMENT_ASSEMBLY', 'PLANNING', 'COLLECTION', 'CONSOLIDATION', 'GREEN_LIGHT', 'EXPORT_DEPARTURE', 'IN_TRANSIT', 'IMPORT_CLEARANCE', 'DELIVERED'];

export default function JobDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]);
  const [docs, setDocs] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [tab, setTab] = useState('items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api('/jobs/' + id).then(setJob),
      api('/items?jobId=' + id).then(d => setItems(arr(d))).catch(() => {}),
      api('/documents?jobId=' + id).then(d => setDocs(arr(d))).catch(() => {}),
      api('/tracking?jobId=' + id).then(d => setTracking(arr(d))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>Loading...</div>;
  if (!job) return <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>Job not found</div>;

  const st = STATUS_MAP[job.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: job.status || '?' };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12, padding: 0 }}>{'← ' + t('jobs')}</button>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.mono, fontWeight: 800, fontSize: 18, color: C.gold }}>{jobRef(job)}</div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <InfoRow label={t('client')} value={clientStr(job)} />
        <InfoRow label={t('corridor')} value={corridorStr(job)} />
        <InfoRow label="PO" value={str(job.poNumber)} />
        <InfoRow label="Incoterm" value={str(job.incoterm)} />
        <InfoRow label="Mode" value={str(job.transportMode)} />
        <InfoRow label="Progress" value={job.progress ? job.progress + '%' : '—'} />
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: C.surface, borderRadius: 10, padding: 3 }}>
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: tab === tb ? C.gold : 'transparent', color: tab === tb ? C.bg : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t(tb)}</button>
        ))}
      </div>

      {tab === 'items' && (items.length === 0 ? <Empty /> : items.map(item => (
        <div key={item.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 4 }}>{str(item.description || item.materialNumber || item.itemNumber)}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
            {item.quantity != null && <span>{'Qty: ' + item.quantity}</span>}
            {item.unit && <span>{String(item.unit)}</span>}
            {item.hsCode && <span>{'HS: ' + String(item.hsCode)}</span>}
            {item.weightKg && <span>{item.weightKg + ' kg'}</span>}
          </div>
        </div>
      )))}

      {tab === 'documents' && (docs.length === 0 ? <Empty /> : docs.map(doc => (
        <div key={doc.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{str(doc.name || doc.type)}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{str(doc.type)} · {str(doc.status)}</div>
          </div>
        </div>
      )))}

      {tab === 'timeline' && (
        <div style={{ padding: '8px 0 8px 20px', borderLeft: `2px solid ${C.gold}33` }}>
          {LIFECYCLE.map((step, i) => {
            const s = STATUS_MAP[step] || { label: step };
            const ci = LIFECYCLE.indexOf(job.status);
            const done = ci >= 0 ? i <= ci : false;
            const current = ci >= 0 && i === ci;
            return (
              <div key={step} style={{ position: 'relative', paddingBottom: 20, paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: -7, top: 2, width: 12, height: 12, borderRadius: '50%', background: done ? (current ? C.gold : C.green) : C.surface2, border: `2px solid ${done ? (current ? C.gold : C.green) : C.border}` }} />
                <div style={{ fontSize: 13, fontWeight: current ? 800 : 500, color: done ? C.text : C.muted }}>{s.label || step}</div>
                {current && <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>● Current</div>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'tracking' && (tracking.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>No tracking events yet</div> : tracking.map(tr => (
        <div key={tr.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{str(tr.event || tr.description)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{str(tr.location)} · {tr.createdAt ? new Date(tr.createdAt).toLocaleString() : '—'}</div>
        </div>
      )))}
    </div>
  );
}

function Empty() { return <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>No data</div>; }
