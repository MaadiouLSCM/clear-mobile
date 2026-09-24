import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { C } from '../theme';

/**
 * S181 — field actions on a job, aligned with CLEAR (S156–S180): next step with the evidence each gate still needs,
 * supplier originals (commercial invoice, packing list) photographed or picked as PDF, HS codes verified, customs
 * holds classified by cause, proof of delivery with signature, pieces and GPS.
 */
const CAUSES = ['AUTHORITY_DISCRETIONARY', 'CLIENT_SUPPLIER_DOCUMENTS', 'HS_MISCLASSIFICATION', 'LSCM_DOCUMENTATION', 'GL_OBSERVATION_NOT_ADDRESSED', 'PERMIT_LICENCE_MISSING', 'VALUATION', 'OTHER'];
const box = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 12 };
const btn = (bg = C.gold) => ({ padding: '10px 14px', border: 'none', borderRadius: 10, background: bg, color: bg === C.gold ? C.bg : C.text, fontWeight: 800, fontSize: 13, cursor: 'pointer' });
const inp = { padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.borderHi}`, background: C.surface2, color: C.text, fontSize: 14, width: '100%', boxSizing: 'border-box' };
const toB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });

export default function JobField({ job, items, docs, reload }) {
  const [legal, setLegal] = useState(null); const [holds, setHolds] = useState([]); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const [hs, setHs] = useState({}); const [cls, setCls] = useState({});
  const [pod, setPod] = useState({ receiverName: '', itemsDelivered: '', condition: 'GOOD' }); const canvas = useRef(null); const drawing = useRef(false);
  const load = () => {
    api(`/jobs/${job.id}/legal-transitions`).then(setLegal).catch(() => setLegal(null));
    api(`/customs-compliance/holds?jobId=${job.id}`).then((r) => setHolds(Array.isArray(r) ? r : [])).catch(() => setHolds([]));
  };
  useEffect(() => { load(); }, [job.id, job.status]);
  const run = async (fn, ok) => { setBusy(true); setMsg(''); try { await fn(); setMsg(`✓ ${ok}`); load(); reload && reload(); } catch (e) { setMsg(`✗ ${e.message}`); } finally { setBusy(false); } };

  const move = (s) => run(() => api(`/jobs/${job.id}/transition`, { method: 'POST', body: { status: s, ...(s === 'DELIVERED' ? { deliveryDate: new Date().toISOString() } : {}) } }), `moved to ${s.replace(/_/g, ' ').toLowerCase()}`);
  const original = (type) => async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    await run(async () => {
      const up = await api('/uploads/base64', { method: 'POST', body: { base64: await toB64(f), fileName: f.name || `${type}.jpg`, mimeType: f.type || 'image/jpeg', folder: 'documents' } });
      let doc = docs.find((d) => (d.type || d.docType) === type);
      if (!doc) doc = await api('/documents', { method: 'POST', body: { jobId: job.id, docType: type, fileUrl: up.fileUrl, fileName: up.fileName } });
      await api(`/documents/${doc.id}`, { method: 'PATCH', body: { fileUrl: up.fileUrl, fileName: up.fileName, status: 'ORIGINAL_UPLOADED' } });
    }, `${type === 'VPL' ? 'packing list' : 'commercial invoice'} original recorded`);
  };
  const pt = (ev) => { const r = canvas.current.getBoundingClientRect(); const t = ev.touches ? ev.touches[0] : ev; return [t.clientX - r.left, t.clientY - r.top]; };
  const start = (ev) => { drawing.current = true; const ctx = canvas.current.getContext('2d'); const [x, y] = pt(ev); ctx.beginPath(); ctx.moveTo(x, y); ev.preventDefault(); };
  const draw = (ev) => { if (!drawing.current) return; const ctx = canvas.current.getContext('2d'); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'; const [x, y] = pt(ev); ctx.lineTo(x, y); ctx.stroke(); ev.preventDefault(); };
  const clearSig = () => { const c = canvas.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); };
  const capturePod = () => run(async () => {
    if (!pod.receiverName.trim()) throw new Error('receiver name required');
    const signatureData = canvas.current.toDataURL('image/png');
    const gps = await new Promise((res) => (navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => res({}), { timeout: 6000 }) : res({})));
    await api('/pod/capture', { method: 'POST', body: { jobId: job.id, receiverName: pod.receiverName.trim(), signatureData, condition: pod.condition, itemsDelivered: pod.itemsDelivered ? Number(pod.itemsDelivered) : undefined, deliveryDate: new Date().toISOString(), ...gps } });
  }, 'proof of delivery captured');

  const ok = (d) => ['ORIGINAL_UPLOADED', 'SIGNED_UPLOADED', 'VERIFIED'].includes(d?.status);
  const ci = docs.find((d) => (d.type || d.docType) === 'COMMERCIAL_INVOICE'), vpl = docs.find((d) => (d.type || d.docType) === 'VPL');
  const deliverable = ['DELIVERY_SCHEDULED', 'DELIVERED', 'CUSTOMS_CLEARED'].includes(job.status);
  return (
    <div>
      {msg && <div style={{ ...box, color: msg.startsWith('✓') ? '#34d399' : '#fb7185', fontSize: 13 }}>{msg}</div>}
      {legal && <div style={box}>
        <div style={{ fontWeight: 800, color: C.gold, marginBottom: 8 }}>Next step</div>
        {legal.nextStates.map((n) => <div key={n.status} style={{ padding: '8px 0', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><b style={{ flex: 1, fontSize: 13 }}>{n.status.replace(/_/g, ' ').toLowerCase()}</b>
            <button disabled={busy || n.missingEvidence.length > 0} onClick={() => move(n.status)} style={{ ...btn(n.missingEvidence.length ? C.surface3 : C.gold), opacity: n.missingEvidence.length ? 0.6 : 1 }}>Move</button></div>
          {n.missingEvidence.map((m, i) => <div key={i} style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>• {m}</div>)}
        </div>)}
        {!legal.nextStates.length && <div style={{ fontSize: 12, color: C.muted }}>No further step.</div>}
      </div>}
      <div style={box}>
        <div style={{ fontWeight: 800, color: C.gold, marginBottom: 8 }}>Supplier originals</div>
        {[['COMMERCIAL_INVOICE', 'Commercial invoice', ci], ['VPL', 'Packing list (VPL)', vpl]].map(([type, label, d]) => <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
          <span style={{ flex: 1, fontSize: 13 }}>{label} {ok(d) ? <span style={{ color: '#34d399' }}>✓ original</span> : <span style={{ color: '#fbbf24' }}>{d ? 'draft only' : 'missing'}</span>}</span>
          <label style={btn()}>{ok(d) ? 'Replace' : 'Photo / PDF'}<input type="file" accept="image/*,application/pdf" capture="environment" onChange={original(type)} style={{ display: 'none' }} /></label></div>)}
      </div>
      {items.length > 0 && <div style={box}>
        <div style={{ fontWeight: 800, color: C.gold, marginBottom: 8 }}>HS codes (verified by LSCM)</div>
        {items.map((it) => <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderTop: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, fontSize: 12 }}>{it.itemNumber} · {String(it.description || '').slice(0, 24)}</span>
          {it.hsVerifiedAt ? <span style={{ fontSize: 12, color: '#34d399' }}>✓ {it.hsCode}</span> : <>
            <input defaultValue={it.hsCode || ''} onChange={(e) => setHs({ ...hs, [it.id]: e.target.value })} placeholder="HS" inputMode="numeric" style={{ ...inp, width: 100 }} />
            <button disabled={busy} onClick={() => run(() => api(`/customs-compliance/items/${it.id}/hs-verify`, { method: 'POST', body: hs[it.id] ? { hsCode: hs[it.id] } : {} }), 'HS verified')} style={btn()}>Verify</button></>}
        </div>)}
      </div>}
      {holds.length > 0 && <div style={box}>
        <div style={{ fontWeight: 800, color: C.gold, marginBottom: 8 }}>Customs holds</div>
        {holds.map((h) => <div key={h.id} style={{ padding: '6px 0', borderTop: `1px solid ${C.border}`, fontSize: 12 }}>
          {String(h.createdAt).slice(0, 10)} — {h.cause ? <b>{h.cause.replace(/_/g, ' ').toLowerCase()} → {String(h.attributedTo).replace(/_/g, ' ').toLowerCase()}</b> : <span style={{ color: '#fbbf24' }}>to classify</span>}
          {!h.cause && <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <select value={cls[h.id] || ''} onChange={(e) => setCls({ ...cls, [h.id]: e.target.value })} style={inp}><option value="">Cause…</option>{CAUSES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ').toLowerCase()}</option>)}</select>
            <button disabled={busy || !cls[h.id]} onClick={() => run(() => api(`/customs-compliance/holds/${h.id}/classify`, { method: 'PATCH', body: { cause: cls[h.id] } }), 'hold classified')} style={btn()}>Save</button></div>}
        </div>)}
      </div>}
      {deliverable && <div style={box}>
        <div style={{ fontWeight: 800, color: C.gold, marginBottom: 8 }}>Proof of delivery</div>
        <input placeholder="Receiver name" value={pod.receiverName} onChange={(e) => setPod({ ...pod, receiverName: e.target.value })} style={{ ...inp, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input placeholder="Pieces delivered" inputMode="numeric" value={pod.itemsDelivered} onChange={(e) => setPod({ ...pod, itemsDelivered: e.target.value })} style={inp} />
          <select value={pod.condition} onChange={(e) => setPod({ ...pod, condition: e.target.value })} style={inp}>{['GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'PARTIAL_DELIVERY', 'REFUSED'].map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ').toLowerCase()}</option>)}</select>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Signature</div>
        <canvas ref={canvas} width={320} height={140} style={{ width: '100%', height: 140, background: '#fff', borderRadius: 10, touchAction: 'none' }} onMouseDown={start} onMouseMove={draw} onMouseUp={() => (drawing.current = false)} onTouchStart={start} onTouchMove={draw} onTouchEnd={() => (drawing.current = false)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button onClick={clearSig} style={btn(C.surface3)}>Clear</button><button disabled={busy} onClick={capturePod} style={{ ...btn(), flex: 1 }}>Capture POD</button></div>
      </div>}
    </div>
  );
}
