import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS } from '../theme';
import { arr, str } from '../safe';

const DOC_ICON = { RFC: '📋', INVOICE: '💰', BL: '🚢', AWB: '✈️', POD: '📦', POC: '📦', VPL: '📊', SURVEY_REPORT: '🔍', PACKING_LIST: '📦', OSD_REPORT: '⚠️', CUSTOMS_DEC: '🛂', SI: '📝' };
const STATUS_STYLE = {
  DRAFT: { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: 'Draft' },
  PENDING: { color: C.orange, bg: C.orangeDim, label: 'Pending' },
  GENERATED: { color: C.blue, bg: C.blueDim, label: 'Generated' },
  APPROVED: { color: C.green, bg: C.greenDim, label: 'Approved' },
  SIGNED: { color: C.green, bg: C.greenDim, label: 'Signed' },
  UPLOADED: { color: C.purple, bg: C.purpleDim, label: 'Uploaded' },
};

export default function Documents() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { api('/documents').then(d => setDocs(arr(d))).catch(() => {}).finally(() => setLoading(false)); }, []);

  const types = ['ALL', ...new Set(docs.map(d => d?.type).filter(Boolean))];

  const filtered = docs.filter(d => {
    if (!d) return false;
    if (filter !== 'ALL' && d.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!str(d.name).toLowerCase().includes(q) && !str(d.type).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← {t('dashboard')}</button>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 16 }}>{t('documents')} ({docs.length})</div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  RFC, Invoice, OS&D…" style={{ width: '100%', padding: '12px 14px', marginBottom: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none' }} />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 8 }}>
        {types.slice(0, 8).map(tp => {
          const active = filter === tp;
          return (
            <button key={tp} onClick={() => setFilter(tp)} style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 20,
              background: active ? C.goldDim : C.surface,
              color: active ? C.gold : C.muted,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${active ? C.gold + '33' : C.border}`,
            }}>{tp === 'ALL' ? 'All' : tp.replace(/_/g, ' ')}</button>
          );
        })}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>Loading...</div> :
        filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>No documents</div> :
        filtered.map(doc => {
          const st = STATUS_STYLE[doc.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: doc.status || '?' };
          const icon = DOC_ICON[doc.type] || '📄';
          return (
            <div key={doc.id} onClick={() => doc.jobId ? nav('/jobs/' + doc.jobId) : null} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 14, marginBottom: 8, cursor: doc.jobId ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{str(doc.name)}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: C.muted, marginTop: 3 }}>
                  <span style={{ fontFamily: FONTS.mono }}>{str(doc.type)}</span>
                  {doc.kit && <span>{str(doc.kit)}</span>}
                  {doc.generatedAt && <span>{new Date(doc.generatedAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
            </div>
          );
        })}
    </div>
  );
}
