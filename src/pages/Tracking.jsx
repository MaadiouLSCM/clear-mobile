import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS, STATUS_MAP } from '../theme';
import { arr, jobRef, clientStr, corridorStr } from '../safe';

const PORTS = [
  { n: 'Paris', lat: 48.86, lng: 2.35, f: '🇫🇷' },
  { n: 'Lagos', lat: 6.52, lng: 3.38, f: '🇳🇬' },
  { n: 'Nouakchott', lat: 18.07, lng: -15.96, f: '🇲🇷' },
  { n: 'Dakar', lat: 14.72, lng: -17.47, f: '🇸🇳' },
  { n: 'Conakry', lat: 9.64, lng: -13.58, f: '🇬🇳' },
  { n: 'Abidjan', lat: 5.36, lng: -4.01, f: '🇨🇮' },
  { n: 'Dubai', lat: 25.20, lng: 55.27, f: '🇦🇪' },
];
const ROUTES = [
  { from: 'Paris', to: 'Lagos', color: C.gold, label: 'EU → Nigeria' },
  { from: 'Paris', to: 'Nouakchott', color: C.blue, label: 'EU → Mauritania' },
  { from: 'Dubai', to: 'Lagos', color: C.green, label: 'UAE → Nigeria' },
  { from: 'Dakar', to: 'Conakry', color: '#a3e635', label: 'W. Africa' },
  { from: 'Dubai', to: 'Nouakchott', color: '#06B6D4', label: 'UAE → Mauritania' },
  { from: 'Abidjan', to: 'Paris', color: '#EC4899', label: 'IC → EU' },
];
const PROG = {
  RFC_RECEIVED: .05, QUOTATION: .08, DOCS_PENDING: .15, PLANNING: .20,
  BOOKING_CONFIRMED: .30, GL_SUBMITTED: .40, GL_APPROVED: .45,
  EXPORT_CUSTOMS: .55, IN_TRANSIT: .65, IMPORT_CUSTOMS: .80, CUSTOMS_HOLD: .82,
  POD_RECEIVED: .90, DELIVERED: 1, CLOSED: 1, ABORTED: 0,
};

function proj(lat, lng) {
  return { x: ((lng + 25) / 90) * 340 + 10, y: ((55 - lat) / 55) * 200 + 10 };
}

function bezier(from, to) {
  const p1 = proj(from.lat, from.lng), p2 = proj(to.lat, to.lng);
  const mx = (p1.x + p2.x) / 2, my = Math.min(p1.y, p2.y) - 15 - Math.abs(p1.x - p2.x) * .08;
  return { d: `M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`, p1, p2, mx, my };
}

function matchRoute(job) {
  const c = corridorStr(job).toLowerCase();
  for (const r of ROUTES) {
    if (c.includes(r.from.toLowerCase()) || c.includes(r.to.toLowerCase())) return r;
  }
  return null;
}

function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { color: C.muted, bg: 'rgba(128,128,128,0.12)', label: str(status) };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {m.label || status?.replace?.(/_/g, ' ') || '—'}
    </span>
  );
}

function str(v) { return typeof v === 'string' ? v : typeof v === 'object' ? (v?.name || v?.ref || '—') : String(v ?? '—'); }

export default function Tracking() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let ok = true;
    api('/jobs').then(d => { if (ok) setJobs(arr(d)); }).catch(() => {}).finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, []);

  const tracked = jobs.map(j => {
    const status = j?.status || '';
    const progress = PROG[status] || 0;
    const route = matchRoute(j);
    const fromP = route ? PORTS.find(p => p.n === route.from) : null;
    const toP = route ? PORTS.find(p => p.n === route.to) : null;
    return { ...j, progress, route, fromP, toP };
  }).filter(j => j.fromP && j.toP);

  const active = tracked.filter(j => j.progress > 0 && j.progress < 1);

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: FONTS.display, color: C.text }}>📡 {t('tracking')}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Live corridor tracking · {tracked.length} shipments</div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[{ l: 'Active', v: active.length, c: C.gold },
          { l: 'In Transit', v: tracked.filter(j => j.status === 'IN_TRANSIT').length, c: C.blue },
          { l: 'Alerts', v: tracked.filter(j => ['CUSTOMS_HOLD', 'DOCS_PENDING'].includes(j.status)).length, c: C.red },
        ].map(k => (
          <div key={k.l} style={{ background: C.surface, borderRadius: 10, padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.c, fontFamily: FONTS.display }}>{k.v}</div>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Animated corridor map */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}`, background: '#0a0e16', marginBottom: 16 }}>
        <svg viewBox="0 0 360 220" style={{ width: '100%', display: 'block' }}>
          <defs>
            <radialGradient id="mbg" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#111828" /><stop offset="100%" stopColor="#080a0f" /></radialGradient>
            <filter id="ng"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <style>{`@keyframes rd{to{stroke-dashoffset:0}}@keyframes np{0%,100%{r:3.5;opacity:.9}50%{r:6;opacity:.3}}`}</style>
          </defs>
          <rect width="360" height="220" fill="url(#mbg)" />
          {/* Grid */}
          {Array.from({ length: 8 }).map((_, i) => <line key={`gv${i}`} x1={i * 48} y1="0" x2={i * 48} y2="220" stroke="rgba(96,165,250,0.03)" />)}
          {Array.from({ length: 5 }).map((_, i) => <line key={`gh${i}`} x1="0" y1={i * 48 + 10} x2="360" y2={i * 48 + 10} stroke="rgba(96,165,250,0.03)" />)}

          {/* Route arcs + cargo particles */}
          {ROUTES.map((r, i) => {
            const from = PORTS.find(p => p.n === r.from), to = PORTS.find(p => p.n === r.to);
            if (!from || !to) return null;
            const { d } = bezier(from, to);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={r.color} strokeWidth="1.2" strokeLinecap="round" opacity=".25"
                  strokeDasharray="400" strokeDashoffset="400" style={{ animation: `rd 2s ease ${i * .25}s forwards` }} />
                <circle r="2" fill={r.color} filter="url(#ng)">
                  <animateMotion dur={`${4 + i * .5}s`} repeatCount="indefinite" begin={`${i * .3 + 2}s`} path={d} />
                </circle>
              </g>
            );
          })}

          {/* City nodes */}
          {PORTS.map((p, i) => {
            const pt = proj(p.lat, p.lng);
            return (
              <g key={p.n}>
                <circle cx={pt.x} cy={pt.y} r="3.5" fill={C.gold} style={{ animation: `np 2.5s ease ${i * .2}s infinite` }} />
                <circle cx={pt.x} cy={pt.y} r="3.5" fill="none" stroke={C.gold} strokeWidth=".5" opacity="0">
                  <animate attributeName="r" values="4;10;4" dur="3s" repeatCount="indefinite" begin={`${i * .2}s`} />
                  <animate attributeName="opacity" values=".3;0;.3" dur="3s" repeatCount="indefinite" begin={`${i * .2}s`} />
                </circle>
                <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#E8EAF0" fontSize="7" fontFamily="Syne" fontWeight="700">{p.n}</text>
              </g>
            );
          })}

          {/* Job markers on routes */}
          {tracked.filter(j => j.progress > 0 && j.progress < 1).map(j => {
            const { p1, p2, mx, my } = bezier(j.fromP, j.toP);
            const t = j.progress;
            const cx = (1-t)*(1-t)*p1.x + 2*(1-t)*t*mx + t*t*p2.x;
            const cy = (1-t)*(1-t)*p1.y + 2*(1-t)*t*my + t*t*p2.y;
            const col = j.route?.color || C.gold;
            return (
              <g key={j.id} onClick={() => setSelected(j.id === selected ? null : j)} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cy} r="6" fill={col} opacity=".15">
                  <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values=".2;0;.2" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={cx} cy={cy} r="4" fill="#080a0f" stroke={col} strokeWidth="1.5" />
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="5" fill={col} style={{ pointerEvents: 'none' }}>
                  {j.status === 'IN_TRANSIT' ? '🚢' : '✈️'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Route legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 12px', borderTop: `1px solid ${C.border}` }}>
          {ROUTES.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 2, background: r.color, borderRadius: 1 }} />
              <span style={{ fontSize: 8, color: C.muted }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active shipment ETA cards */}
      {active.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>🚢 Active Shipments</div>
          {active.map(j => (
            <div key={j.id} onClick={() => nav(`/jobs/${j.id}`)} style={{
              padding: '12px 14px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
              marginBottom: 8, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700, color: j.route?.color || C.gold }}>{jobRef(j)}</span>
                <StatusBadge status={j.status} />
              </div>
              <div style={{ fontSize: 11, color: C.text, fontWeight: 500, marginBottom: 2 }}>{clientStr(j)}</div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{corridorStr(j)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${j.progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${j.route?.color || C.gold}, ${C.green})`, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: FONTS.mono, fontWeight: 700, color: j.route?.color || C.gold }}>{Math.round(j.progress * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All tracked */}
      {loading && <div style={{ textAlign: 'center', color: C.muted, padding: 24 }}>Loading tracking data...</div>}
      {!loading && tracked.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>No tracked shipments</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Jobs with corridors will appear here</div>
        </div>
      )}
    </div>
  );
}
