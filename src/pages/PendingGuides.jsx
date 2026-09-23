import { useEffect, useState } from 'react';
import { api } from '../api';
import { API_BASE } from '../theme';

/** S161 — SOPs published for field agents (LSCM-PRO-SCM-008/009) that this user has not confirmed: read, then confirm. */
export default function PendingGuides() {
  const [docs, setDocs] = useState([]);
  const load = () => api('/qms-documents/external/pending').then((r) => setDocs(r?.documents || [])).catch(() => setDocs([]));
  useEffect(() => { load(); }, []);
  if (!docs.length) return null;
  const open = async (d) => {
    const w = window.open('', '_blank'); // inside the tap (iOS)
    try {
      const r = await api('/files/link', { method: 'POST', body: { path: `/qms-documents/${d.id}/download`, filename: `${d.code}.pdf` } });
      const url = API_BASE.replace(/\/api$/, '') + r.url;
      if (w) w.location.href = url; else window.location.href = url;
    } catch { if (w) w.close(); }
  };
  const ack = async (d) => { await api(`/qms-documents/${d.id}/acknowledge`, { method: 'POST', body: {} }).catch(() => {}); load(); };
  return (
    <div style={{ background: '#FFF4DB', border: '1px solid #F5A800', borderRadius: 14, padding: 14, marginBottom: 16, color: '#111' }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Please read and confirm</div>
      {docs.map((d) => (
        <div key={d.id} style={{ padding: '6px 0' }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>{d.title} <span style={{ color: '#6B7280' }}>({d.code} v{d.version})</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => open(d)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #111', background: '#fff', fontWeight: 700 }}>Read</button>
            <button onClick={() => ack(d)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 0, background: '#F5A800', fontWeight: 800 }}>I have read it</button>
          </div>
        </div>
      ))}
    </div>
  );
}
