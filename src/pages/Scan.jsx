import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';
import { arr, str, jobRef, clientStr, corridorStr } from '../safe';

// S161 — iOS browsers have no BarcodeDetector: camera scans never matched on iPhone/iPad. jsQR (vendored in
// public/assets, MIT) decodes the frame when BarcodeDetector is missing.
let jsqrLoading = null;
function loadJsQR() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (!jsqrLoading) jsqrLoading = new Promise((ok, ko) => { const s = document.createElement('script'); s.src = '/assets/jsQR.min.js'; s.onload = () => ok(window.jsQR); s.onerror = ko; document.head.appendChild(s); });
  return jsqrLoading;
}

export default function Scan() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [camErr, setCamErr] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCam = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setScanning(false); };
  const startCam = async () => {
    setCamErr(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      setScanning(true);
    } catch { setCamErr(true); }
  };
  useEffect(() => () => stopCam(), []);
  useEffect(() => {
    if (!scanning) return;
    const native = 'BarcodeDetector' in window;
    if (!native) loadJsQR().catch(() => setCamErr(true));
    const hit = (value) => { stopCam(); setQuery(value); doSearch(value); };
    const iv = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth) return;
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(v, 0, 0);
      if (native) {
        new BarcodeDetector({ formats: ['qr_code','code_128','ean_13'] }).detect(c).then(codes => { if (codes.length > 0) hit(codes[0].rawValue); }).catch(() => {});
      } else if (window.jsQR) {
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const r = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (r && r.data) hit(r.data);
      }
    }, 450);
    return () => clearInterval(iv);
  }, [scanning]);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setResult({ loading: true });
    // S161 — one server resolver: item sticker « item#k/n », shipping-mark QR / SM ref, job ref or PO number.
    try {
      const r = await api(`/scan/resolve/${encodeURIComponent(q.trim())}`);
      if (r?.type === 'ITEM') { setResult({ found: true, type: 'ITEM', data: r.item, sticker: r.sticker }); return; }
      if (r?.type === 'BOX') { setResult({ found: true, type: 'BOX', data: r.box }); return; }
      if (r?.type === 'JOB') { setResult({ found: true, type: 'JOB', data: r.job }); return; }
    } catch { /* not resolved server-side: fall back to the local search below */ }
    try {
      const jobs = arr(await api('/jobs').catch(() => []));
      const m = jobs.find(j => jobRef(j).toLowerCase().includes(q.toLowerCase()) || String(j.poNumber || '').toLowerCase().includes(q.toLowerCase()) || j.id === q);
      if (m) { setResult({ found: true, type: 'JOB', data: m }); return; }
      const items = arr(await api('/items').catch(() => []));
      const im = items.find(i => String(i.qrCode || '').toLowerCase().includes(q.toLowerCase()) || String(i.itemNumber || '').toLowerCase().includes(q.toLowerCase()) || i.id === q);
      if (im) { setResult({ found: true, type: 'ITEM', data: im }); return; }
      setResult({ found: false, query: q });
    } catch { setResult({ found: false, query: q }); }
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 4 }}>{t('scanTitle')}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{t('scanHint')}</div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: C.surface, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 16 }}>
        {scanning ? (<>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '65%', aspectRatio: '1', border: `2px solid ${C.gold}`, borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
          </div>
          <button onClick={stopCam} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 8, padding: '6px 12px', color: C.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
        </>) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 48 }}>📷</span>
            <button onClick={startCam} style={{ background: C.gold, border: 'none', borderRadius: 10, padding: '10px 24px', color: C.bg, fontSize: 14, fontWeight: 700, fontFamily: FONTS.display, cursor: 'pointer' }}>{t('scanQr')}</button>
            {camErr && <div style={{ fontSize: 11, color: C.red, textAlign: 'center', padding: '0 20px' }}>Camera unavailable — use manual entry</div>}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('manualEntry')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch(query)} placeholder={t('searchPlaceholder')} style={{ flex: 1, padding: '12px 14px', background: C.surface, border: `2px solid ${C.goldBorder}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none' }} />
          <button onClick={() => doSearch(query)} style={{ background: C.gold, border: 'none', borderRadius: 10, padding: '0 20px', color: C.bg, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>→</button>
        </div>
      </div>
      {result && !result.loading && (result.found ? (
        <div onClick={() => { const id = result.type === 'JOB' ? result.data.id : result.data.job?.id || result.data.jobId; if (id) nav('/jobs/' + id); }} style={{ background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 14, padding: 16, cursor: result.type === 'JOB' ? 'pointer' : 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: C.green, fontWeight: 800, fontSize: 14 }}>{'✓ ' + t('found')}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: C.goldDim, color: C.gold }}>{result.type}</span>
          </div>
          {result.type === 'JOB' && (<>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 16, color: C.gold, marginBottom: 4 }}>{jobRef(result.data)}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{clientStr(result.data) + ' · ' + corridorStr(result.data)}</div>
          </>)}
          {result.type === 'ITEM' && (<>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>{str(result.data.description || result.data.itemNumber)}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{result.data.quantity != null ? 'Qty: ' + result.data.quantity + ' ' : ''}{str(result.data.unit)}{result.sticker ? ` · sticker ${result.sticker.k}/${result.sticker.n}` : ''}{result.data.job?.ref ? ' · ' + result.data.job.ref : ''}</div>
          </>)}
          {result.type === 'BOX' && (<>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 16, color: C.gold, marginBottom: 4 }}>{str(result.data.smRef)}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{`Package ${result.data.packageNumber}/${result.data.totalPackages} · ${result.data._count?.items ?? 0} item(s)`}{result.data.job?.ref ? ' · ' + result.data.job.ref : ''}</div>
          </>)}
        </div>
      ) : (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 14, padding: 16 }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 14 }}>{'✕ ' + t('notFound')}</span>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{'"' + result.query + '"'}</div>
        </div>
      ))}
      {result?.loading && <div style={{ textAlign: 'center', padding: 24, color: C.muted }}>Searching...</div>}
    </div>
  );
}
