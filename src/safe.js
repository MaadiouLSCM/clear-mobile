// Safe extraction helpers — prevents React error #31 (object rendered as child)

export function safeStr(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && val.name) return String(val.name);
  if (typeof val === 'object') return '—';
  return String(val);
}

export function safeArray(d) {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    if (Array.isArray(d.data)) return d.data;
    for (const k of Object.keys(d)) {
      if (Array.isArray(d[k])) return d[k];
    }
  }
  return [];
}

export function jobRef(j) {
  if (!j) return '—';
  return safeStr(j.ref || j.lscmRef || j.reference || `JOB-${String(j.id || '?').slice(-6)}`);
}

export function jobClient(j) {
  if (!j) return '—';
  return safeStr(j.client);
}

export function jobCorridor(j) {
  if (!j) return '—';
  if (typeof j.corridor === 'object' && j.corridor?.name) return String(j.corridor.name);
  return safeStr(j.corridor || j.corridorId || '');
}
