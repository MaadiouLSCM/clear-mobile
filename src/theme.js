export const C = {
  bg: '#0D0F14',
  surface: '#13161D',
  surface2: '#1A1E27',
  surface3: '#22272F',
  border: 'rgba(255,255,255,0.06)',
  borderHi: 'rgba(255,255,255,0.12)',
  gold: '#F5A800',
  goldDim: 'rgba(245,168,0,0.12)',
  goldBorder: 'rgba(245,168,0,0.25)',
  text: '#E8EAF0',
  muted: '#6B7280',
  mid: '#9CA3AF',
  green: '#22C55E',
  greenDim: 'rgba(34,197,94,0.12)',
  blue: '#3B82F6',
  blueDim: 'rgba(59,130,246,0.12)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.12)',
  orange: '#F97316',
  orangeDim: 'rgba(249,115,22,0.12)',
  purple: '#8B5CF6',
  purpleDim: 'rgba(139,92,246,0.12)',
};

export const FONTS = {
  display: "'Syne', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
};

export const STATUS_MAP = {
  RFC: { color: C.blue, bg: C.blueDim, label: 'RFC' },
  DOCUMENT_ASSEMBLY: { color: C.orange, bg: C.orangeDim, label: 'Doc Assembly' },
  PLANNING: { color: C.purple, bg: C.purpleDim, label: 'Planning' },
  COLLECTION: { color: C.blue, bg: C.blueDim, label: 'Collection' },
  CONSOLIDATION: { color: C.purple, bg: C.purpleDim, label: 'Consolidation' },
  GREEN_LIGHT: { color: C.gold, bg: C.goldDim, label: 'Green Light' },
  EXPORT_DEPARTURE: { color: C.blue, bg: C.blueDim, label: 'Export' },
  IN_TRANSIT: { color: C.blue, bg: C.blueDim, label: 'In Transit' },
  IMPORT_CLEARANCE: { color: C.orange, bg: C.orangeDim, label: 'Import' },
  DELIVERED: { color: C.green, bg: C.greenDim, label: 'Delivered' },
  CLOSED: { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: 'Closed' },
  INVOICED: { color: C.green, bg: C.greenDim, label: 'Invoiced' },
  ABORTED: { color: C.red, bg: C.redDim, label: 'Aborted' },
};

export const API_BASE = 'https://friendly-achievement-production.up.railway.app/api';
