import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';

export default function Scan() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setCameraError(true);
    }
  };

  useEffect(() => () => stopCamera(), []);

  const captureAndDecode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Try BarcodeDetector API (Chrome/Edge/Safari 17+)
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
      detector.detect(canvas).then(codes => {
        if (codes.length > 0) {
          stopCamera();
          setQuery(codes[0].rawValue);
          doSearch(codes[0].rawValue);
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(captureAndDecode, 500);
    return () => clearInterval(interval);
  }, [scanning]);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setResult({ loading: true });
    try {
      // Try jobs first
      const jobs = await api('/jobs').then(d => Array.isArray(d) ? d : d?.data || []);
      const match = jobs.find(j =>
        (j.lscmRef || '').toLowerCase().includes(q.toLowerCase()) ||
        (j.reference || '').toLowerCase().includes(q.toLowerCase()) ||
        (j.poRef || '').toLowerCase().includes(q.toLowerCase()) ||
        String(j.id) === q
      );
      if (match) {
        setResult({ found: true, type: 'JOB', data: match });
        return;
      }
      // Try items
      const items = await api('/items').then(d => Array.isArray(d) ? d : d?.data || []);
      const itemMatch = items.find(i =>
        (i.qrCode || '').toLowerCase().includes(q.toLowerCase()) ||
        (i.material || '').toLowerCase().includes(q.toLowerCase()) ||
        String(i.id) === q
      );
      if (itemMatch) {
        setResult({ found: true, type: 'ITEM', data: itemMatch });
        return;
      }
      setResult({ found: false, query: q });
    } catch {
      setResult({ found: false, query: q });
    }
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 4 }}>
        {t('scanTitle')}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
        {t('scanHint')}
      </div>

      {/* Camera viewport */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '4/3',
        background: C.surface, borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${C.border}`, marginBottom: 16,
      }}>
        {scanning ? (
          <>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
            {/* Scan overlay */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '65%', aspectRatio: '1', border: `2px solid ${C.gold}`,
                borderRadius: 16, boxShadow: `0 0 0 9999px rgba(0,0,0,0.4)`,
                animation: 'pulse 2s infinite',
              }} />
            </div>
            <button onClick={stopCamera} style={{
              position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)',
              border: 'none', borderRadius: 8, padding: '6px 12px', color: C.text, fontSize: 12,
              fontWeight: 700, cursor: 'pointer',
            }}>✕ Close</button>
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>📷</span>
            <button onClick={startCamera} style={{
              background: C.gold, border: 'none', borderRadius: 10, padding: '10px 24px',
              color: C.bg, fontSize: 14, fontWeight: 700, fontFamily: FONTS.display, cursor: 'pointer',
            }}>
              {t('scanQr')}
            </button>
            {cameraError && (
              <div style={{ fontSize: 11, color: C.red, textAlign: 'center', padding: '0 20px' }}>
                Camera unavailable — use manual entry below
              </div>
            )}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Manual entry */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('manualEntry')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query)}
            placeholder={t('searchPlaceholder')}
            style={{
              flex: 1, padding: '12px 14px', background: C.surface,
              border: `2px solid ${C.goldBorder}`, borderRadius: 10,
              color: C.text, fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={() => doSearch(query)} style={{
            background: C.gold, border: 'none', borderRadius: 10, padding: '0 20px',
            color: C.bg, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>→</button>
        </div>
      </div>

      {/* Results */}
      {result && !result.loading && (
        result.found ? (
          <div onClick={() => {
            if (result.type === 'JOB') navigate(`/jobs/${result.data.id}`);
          }} style={{
            background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 14,
            padding: 16, cursor: result.type === 'JOB' ? 'pointer' : 'default',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: C.green, fontWeight: 800, fontSize: 14 }}>✓ {t('found')}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: C.goldDim, color: C.gold,
              }}>{result.type}</span>
            </div>
            {result.type === 'JOB' && (
              <>
                <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 16, color: C.gold, marginBottom: 4 }}>
                  {result.data.lscmRef || result.data.reference}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {typeof result.data.client === 'string' ? result.data.client : result.data.client?.name || '—'} · {result.data.corridor || '—'}
                </div>
                <div style={{ marginTop: 8 }}>
                  {(() => { const s = STATUS_MAP[result.data.status]; return s ? (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
                  ) : null; })()}
                </div>
              </>
            )}
            {result.type === 'ITEM' && (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>
                  {result.data.description || result.data.material || `Item #${result.data.id}`}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {result.data.quantity && `Qty: ${result.data.quantity}`} {result.data.unit || ''}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{
            background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 14, padding: 16,
          }}>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 14 }}>✕ {t('notFound')}</span>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>"{result.query}"</div>
          </div>
        )
      )}

      {result?.loading && (
        <div style={{ textAlign: 'center', padding: 24, color: C.muted }}>Searching...</div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
