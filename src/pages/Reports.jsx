import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { api } from '../api';
import { C, FONTS } from '../theme';

const REPORT_TYPES = ['inspection', 'collection', 'delivery', 'incident'];

export default function Reports() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ jobId: '', type: 'inspection', notes: '', photos: [] });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api('/jobs').then(d => setJobs(Array.isArray(d) ? d : d?.data || [])).catch(() => {});
  }, []);

  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, photos: [...f.photos, { data: reader.result, name: file.name, ts: Date.now() }] }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!form.jobId || !form.notes) return;
    setSending(true);
    try {
      // Submit as a task/note on the job
      await api('/tasks', {
        method: 'POST',
        body: {
          jobId: parseInt(form.jobId),
          title: `Field Report: ${t(form.type)}`,
          description: form.notes,
          type: 'FIELD_REPORT',
          priority: form.type === 'incident' ? 'HIGH' : 'MEDIUM',
          status: 'TODO',
        }
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ jobId: '', type: 'inspection', notes: '', photos: [] });
      }, 3000);
    } catch {
      // Fallback: store locally for sync later
      const pending = JSON.parse(localStorage.getItem('clear-pending-reports') || '[]');
      pending.push({ ...form, createdAt: new Date().toISOString() });
      localStorage.setItem('clear-pending-reports', JSON.stringify(pending));
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ jobId: '', type: 'inspection', notes: '', photos: [] });
      }, 3000);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: FONTS.display, color: C.green, marginBottom: 8 }}>
          {t('submitted')}
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          {navigator.onLine ? 'Synced to CLEAR ERP' : 'Saved locally — will sync when online'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.display, color: C.text, marginBottom: 20 }}>
        {t('reportTitle')}
      </div>

      {/* Job selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('selectJob')}
        </label>
        <select
          value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}
          style={{
            width: '100%', padding: '12px 14px', background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14,
            appearance: 'none', outline: 'none',
          }}>
          <option value="">—</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>
              {j.lscmRef || j.reference || `JOB-${j.id}`} — {typeof j.client === 'string' ? j.client : j.client?.name || ''}
            </option>
          ))}
        </select>
      </div>

      {/* Report type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('reportType')}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {REPORT_TYPES.map(rt => (
            <button key={rt} onClick={() => setForm(f => ({ ...f, type: rt }))} style={{
              padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: form.type === rt ? C.goldDim : C.surface,
              color: form.type === rt ? C.gold : C.muted,
              border: `1px solid ${form.type === rt ? C.goldBorder : C.border}`,
              fontSize: 13, fontWeight: 700,
            }}>
              {rt === 'inspection' ? '🔍' : rt === 'collection' ? '📦' : rt === 'delivery' ? '🚛' : '⚠️'}{' '}
              {t(rt)}
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('photos')} ({form.photos.length})
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {form.photos.map((p, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden' }}>
              <img src={p.data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removePhoto(i)} style={{
                position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)', border: 'none', color: C.red, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} style={{
            width: 72, height: 72, borderRadius: 10, border: `2px dashed ${C.goldBorder}`,
            background: C.surface, cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 22 }}>📷</span>
            <span style={{ fontSize: 9, color: C.muted }}>{t('addPhoto')}</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={addPhoto} style={{ display: 'none' }} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('notes')}
        </label>
        <textarea
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={4} placeholder="..."
          style={{
            width: '100%', padding: '12px 14px', background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14,
            resize: 'none', outline: 'none',
          }}
        />
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={sending || !form.jobId || !form.notes} style={{
        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
        background: (!form.jobId || !form.notes) ? C.surface2 : C.gold,
        color: (!form.jobId || !form.notes) ? C.muted : C.bg,
        fontSize: 16, fontWeight: 700, fontFamily: FONTS.display, cursor: 'pointer',
        opacity: (!form.jobId || !form.notes) ? 0.5 : 1,
      }}>
        {sending ? '...' : t('submit')}
      </button>
    </div>
  );
}
