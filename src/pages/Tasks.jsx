import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS } from '../theme';
import { arr, str } from '../safe';

const STATUSES = ['ALL', 'TODO', 'IN_PROGRESS', 'DONE'];
const PRIO_COLOR = { HIGH: C.red, MEDIUM: C.orange, LOW: C.green, URGENT: C.red };
const STATUS_STYLE = {
  TODO: { color: C.orange, bg: C.orangeDim, label: 'To Do' },
  IN_PROGRESS: { color: C.blue, bg: C.blueDim, label: 'In Progress' },
  DONE: { color: C.green, bg: C.greenDim, label: 'Done' },
  BLOCKED: { color: C.red, bg: C.redDim, label: 'Blocked' },
};

export default function Tasks() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { api('/tasks').then(d => setTasks(arr(d))).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = tasks.filter(tk => {
    if (!tk) return false;
    if (filter === 'ALL') return true;
    return tk.status === filter;
  });

  const counts = { ALL: tasks.length, TODO: tasks.filter(t => t?.status === 'TODO').length, IN_PROGRESS: tasks.filter(t => t?.status === 'IN_PROGRESS').length, DONE: tasks.filter(t => t?.status === 'DONE').length };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← {t('dashboard')}</button>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 16 }}>{t('myTasks')}</div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 8 }}>
        {STATUSES.map(s => {
          const active = filter === s;
          const st = STATUS_STYLE[s];
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              background: active ? (st?.bg || C.goldDim) : C.surface,
              color: active ? (st?.color || C.gold) : C.muted,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${active ? (st?.color || C.gold) + '33' : C.border}`,
            }}>{(s === 'ALL' ? 'All' : st?.label || s) + ' (' + (counts[s] || 0) + ')'}</button>
          );
        })}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>Loading...</div> :
        filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>No tasks</div> :
        filtered.map(tk => {
          const st = STATUS_STYLE[tk.status] || { color: C.muted, bg: 'rgba(107,114,128,0.12)', label: tk.status };
          const jobRef = tk.job?.ref || '—';
          const pColor = PRIO_COLOR[tk.priority] || C.muted;
          return (
            <div key={tk.id} onClick={() => tk.jobId ? nav('/jobs/' + tk.jobId) : null} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 14, marginBottom: 8, cursor: tk.jobId ? 'pointer' : 'default',
              borderLeft: `3px solid ${pColor}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, flex: 1, marginRight: 8 }}>{str(tk.title)}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
                <span style={{ color: C.gold, fontFamily: FONTS.mono }}>{jobRef}</span>
                <span>{str(tk.taskType || tk.type)}</span>
                <span style={{ color: pColor, fontWeight: 700 }}>{str(tk.priority)}</span>
                {tk.dueDate && <span>{'Due: ' + new Date(tk.dueDate).toLocaleDateString()}</span>}
              </div>
              {tk.assignee && <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>{'👤 ' + str(tk.assignee)}</div>}
            </div>
          );
        })}
    </div>
  );
}
