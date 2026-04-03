import { Fragment, useEffect, useMemo } from 'react';
import type { Pilgrim } from '../core/types';
import { exportPilgrimsToExcel, type PilgrimExportScope } from '../core/exportExcel';
import { AirportBadge, RegionBadge } from '../components/RegionBadge';
import { cn } from '../lib/cn';

export type PilgrimDetailScope = PilgrimExportScope;

interface PilgrimGroupModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  pilgrims: Pilgrim[];
  onClose: () => void;
  /** تقرير الوصول: إخفاء رحلة المغادرة. تقرير المغادرة: إخفاء حقول الوصول. */
  detailScope?: PilgrimDetailScope;
}

type ColKey =
  | 'id'
  | 'booking'
  | 'name'
  | 'gender'
  | 'nationality'
  | 'age'
  | 'package'
  | 'arrivalCity'
  | 'departureCity'
  | 'arrivalAirport'
  | 'arrivalFlight'
  | 'arrivalTime'
  | 'departureFlight'
  | 'departureAirport'
  | 'stop1'
  | 'guide';

const COL_DEFS: { key: ColKey; label: string; hideFor?: PilgrimExportScope[] }[] = [
  { key: 'id', label: 'المعرف' },
  { key: 'booking', label: 'رقم الحجز' },
  { key: 'name', label: 'الاسم' },
  { key: 'gender', label: 'الجنس' },
  { key: 'nationality', label: 'الجنسية' },
  { key: 'age', label: 'العمر' },
  { key: 'package', label: 'الباقة' },
  { key: 'arrivalCity', label: 'مدينة الوصول', hideFor: ['departure_report'] },
  { key: 'departureCity', label: 'مدينة المغادرة' },
  { key: 'arrivalAirport', label: 'مطار الوصول', hideFor: ['departure_report'] },
  { key: 'arrivalFlight', label: 'رقم رحلة الوصول', hideFor: ['departure_report'] },
  { key: 'arrivalTime', label: 'وقت الوصول', hideFor: ['departure_report'] },
  { key: 'departureFlight', label: 'رقم رحلة المغادرة', hideFor: ['arrival_report'] },
  { key: 'departureAirport', label: 'مطار المغادرة' },
  { key: 'stop1', label: 'التوقف 1' },
  { key: 'guide', label: 'المرشد' },
];

function cellForCol(p: Pilgrim, key: ColKey) {
  switch (key) {
    case 'id':
      return <td className="px-2 py-2 tabular-nums text-fg-secondary">{p.id}</td>;
    case 'booking':
      return (
        <td className="max-w-[100px] truncate px-2 py-2 font-mono text-[11px]" dir="ltr" title={p.booking_id}>
          {p.booking_id || '—'}
        </td>
      );
    case 'name':
      return (
        <td className="max-w-[140px] truncate px-2 py-2 font-medium text-fg" title={p.name}>
          {p.name || '—'}
        </td>
      );
    case 'gender':
      return <td className="px-2 py-2 text-fg-secondary">{p.gender === 'Male' ? 'ذكر' : 'أنثى'}</td>;
    case 'nationality':
      return <td className="px-2 py-2 text-fg-secondary">{p.nationality || '—'}</td>;
    case 'age':
      return <td className="px-2 py-2 tabular-nums">{p.age ?? '—'}</td>;
    case 'package':
      return (
        <td className="max-w-[120px] truncate px-2 py-2" title={p.package}>
          {p.package || '—'}
        </td>
      );
    case 'arrivalCity':
      return (
        <td className="px-2 py-2">
          <RegionBadge label={p.arrival_city || '—'} />
        </td>
      );
    case 'departureCity':
      return (
        <td className="px-2 py-2">
          <RegionBadge label={p.departure_city || '—'} />
        </td>
      );
    case 'arrivalAirport':
      return (
        <td className="px-2 py-2">
          <AirportBadge code={p.arrival_airport} />
        </td>
      );
    case 'arrivalFlight':
      return (
        <td
          className="max-w-[100px] truncate px-2 py-2 font-mono text-[11px] text-fg-secondary tabular-nums"
          dir="ltr"
          title={p.arrival_flight_number}
        >
          {p.arrival_flight_number?.trim() || '—'}
        </td>
      );
    case 'arrivalTime':
      return (
        <td className="max-w-[80px] truncate px-2 py-2 tabular-nums text-fg-secondary" dir="ltr" title={p.arrival_time}>
          {p.arrival_time?.trim() || '—'}
        </td>
      );
    case 'departureFlight':
      return (
        <td
          className="max-w-[100px] truncate px-2 py-2 font-mono text-[11px] text-fg-secondary tabular-nums"
          dir="ltr"
          title={p.departure_flight_number}
        >
          {p.departure_flight_number?.trim() || '—'}
        </td>
      );
    case 'departureAirport':
      return (
        <td className="px-2 py-2">
          <AirportBadge code={p.departure_airport} />
        </td>
      );
    case 'stop1':
      return (
        <td className="max-w-[120px] truncate px-2 py-2" title={p.first_stop_name}>
          {p.first_stop_name || '—'}
        </td>
      );
    case 'guide':
      return (
        <td className="max-w-[100px] truncate px-2 py-2 text-fg-secondary" title={p.guide_name}>
          {p.guide_name || '—'}
        </td>
      );
    default:
      return null;
  }
}

export function PilgrimGroupModal({
  open,
  title,
  subtitle,
  pilgrims,
  onClose,
  detailScope = 'full',
}: PilgrimGroupModalProps) {
  const columns = useMemo(
    () => COL_DEFS.filter((c) => !c.hideFor?.includes(detailScope)),
    [detailScope],
  );

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
    exportPilgrimsToExcel(pilgrims, detailScope);
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
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className="border-none px-2 py-2.5 text-start text-[10px] font-extrabold uppercase tracking-wide text-white whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pilgrims.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 even:bg-gray-50/80 hover:bg-primary-pale/40">
                      {columns.map((c) => (
                        <Fragment key={c.key}>{cellForCol(p, c.key)}</Fragment>
                      ))}
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
