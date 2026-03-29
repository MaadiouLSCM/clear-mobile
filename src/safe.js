export function str(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return val.name || val.ref || val.title || val.email || '—';
  return String(val);
}
export function arr(d) {
  try {
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') {
      if (Array.isArray(d.data)) return d.data;
      for (const k of Object.keys(d)) { if (Array.isArray(d[k])) return d[k]; }
    }
    return [];
  } catch { return []; }
}
export function jobRef(j) { return j?.ref || j?.lscmRef || j?.reference || 'JOB-' + String(j?.id || '?').slice(-6); }
export function corridorStr(j) {
  const c = j?.corridor;
  if (!c) return '—';
  if (typeof c === 'string') return c;
  if (c.name) return String(c.name);
  if (c.originCountry && c.destCountry) return c.originCountry + '→' + c.destCountry;
  return '—';
}
export function clientStr(j) {
  const c = j?.client;
  if (!c) return '—';
  if (typeof c === 'string') return c;
  return c.name ? String(c.name) : '—';
}
