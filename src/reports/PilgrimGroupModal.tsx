import { useEffect } from 'react';
import type { Pilgrim } from '../core/types';
import { exportPilgrimsToExcel } from '../core/exportExcel';
import { AirportBadge, RegionBadge } from '../components/RegionBadge';
import { cn } from '../lib/cn';

interface PilgrimGroupModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  pilgrims: Pilgrim[];
  onClose: () => void;
}

export function PilgrimGroupModal({ open, title, subtitle, pilgrims, onClose }: PilgrimGroupModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleExport = () => {
    if (pilgrims.length === 0) return;
    exportPilgrimsToExcel(pilgrims);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={cn(
          'flex max-h-[min(90vh,720px)] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_rgba(15,23,42,0.25)]',
          'rtl',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pilgrim-group-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-gradient-to-b from-white to-gray-50 px-5 py-4">
          <div>
            <h2 id="pilgrim-group-modal-title" className="text-lg font-extrabold text-primary-dark">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-fg-secondary">{subtitle}</p>}
            <p className="mt-1 text-xs font-semibold text-fg-muted">عدد السجلات: {pilgrims.length.toLocaleString()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleExport}
              disabled={pilgrims.length === 0}
            >
              تحميل Excel
            </button>
            <button
              type="button"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-fg-secondary hover:bg-gray-50"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="scrollbar-reports min-h-0 flex-1 overflow-auto p-4">
          {pilgrims.length === 0 ? (
            <p className="py-8 text-center text-fg-secondary">لا توجد بيانات.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead className="sticky top-0 z-[1] bg-gradient-to-b from-primary to-primary-dark">
                  <tr>
                    {[
                      'المعرف',
                      'رقم الحجز',
                      'الاسم',
                      'الجنس',
                      'الجنسية',
                      'العمر',
                      'الباقة',
                      'مدينة الوصول',
                      'مدينة المغادرة',
                      'مطار الوصول',
                      'مطار المغادرة',
                      'التوقف 1',
                      'المرشد',
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-none px-2 py-2.5 text-start text-[10px] font-extrabold uppercase tracking-wide text-white whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pilgrims.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 even:bg-gray-50/80 hover:bg-primary-pale/40">
                      <td className="px-2 py-2 tabular-nums text-fg-secondary">{p.id}</td>
                      <td className="max-w-[100px] truncate px-2 py-2 font-mono text-[11px]" dir="ltr" title={p.booking_id}>
                        {p.booking_id || '—'}
                      </td>
                      <td className="max-w-[140px] truncate px-2 py-2 font-medium text-fg" title={p.name}>
                        {p.name || '—'}
                      </td>
                      <td className="px-2 py-2 text-fg-secondary">{p.gender === 'Male' ? 'ذكر' : 'أنثى'}</td>
                      <td className="px-2 py-2 text-fg-secondary">{p.nationality || '—'}</td>
                      <td className="px-2 py-2 tabular-nums">{p.age ?? '—'}</td>
                      <td className="max-w-[120px] truncate px-2 py-2" title={p.package}>
                        {p.package || '—'}
                      </td>
                      <td className="px-2 py-2">
                        <RegionBadge label={p.arrival_city || '—'} />
                      </td>
                      <td className="px-2 py-2">
                        <RegionBadge label={p.departure_city || '—'} />
                      </td>
                      <td className="px-2 py-2">
                        <AirportBadge code={p.arrival_airport} />
                      </td>
                      <td className="px-2 py-2">
                        <AirportBadge code={p.departure_airport} />
                      </td>
                      <td className="max-w-[120px] truncate px-2 py-2" title={p.first_stop_name}>
                        {p.first_stop_name || '—'}
                      </td>
                      <td className="max-w-[100px] truncate px-2 py-2 text-fg-secondary" title={p.guide_name}>
                        {p.guide_name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
