import { useMemo } from 'react';
import type { Pilgrim } from '../core/types';
import type { ArrivalFlowBucket } from '../core/transferReports';
import {
  buildArrivalDateTotals,
  buildArrivalStatusByDate,
  buildArrivalStatusSummary,
  filterPilgrimsByArrivalDayCell,
  type ArrivalDateDistributionRow,
  type ArrivalStatusSummaryRow,
} from '../core/arrivalStatusDistributionReport';
import { cn } from '../lib/cn';
import { HiCheckCircle } from 'react-icons/hi2';
import { TbBus } from 'react-icons/tb';

const thSummary =
  'border-none px-3 py-3 text-start text-[10px] font-extrabold tracking-wide text-white whitespace-nowrap';

function bucketModalTitle(bucket: ArrivalFlowBucket): string {
  const m: Partial<Record<ArrivalFlowBucket, string>> = {
    normal: 'تفاصيل — حالة طبيعية',
    transfer_to_madinah: 'تفاصيل — يحتاج نقل ← المدينة المنورة',
    transfer_to_makkah: 'تفاصيل — يحتاج نقل ← مكة المكرمة',
  };
  return m[bucket] ?? String(bucket);
}

function CountButton({
  value,
  highlight,
  onClick,
}: {
  value: number;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const cls = cn(
    'min-w-[2.5rem] tabular-nums',
    highlight && value > 0 && 'rounded-md bg-amber-200 px-2 py-1 font-extrabold text-amber-950',
    onClick && value > 0 && 'cursor-pointer underline decoration-primary-dark/40 underline-offset-2 hover:bg-amber-100',
  );
  if (onClick && value > 0) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {value.toLocaleString()}
      </button>
    );
  }
  return <span className={cls}>{value.toLocaleString()}</span>;
}

export function ArrivalStatusDistributionReportSection({
  data,
  onOpenPilgrims,
}: {
  data: Pilgrim[];
  onOpenPilgrims: (title: string, subtitle: string, pilgrims: Pilgrim[]) => void;
}) {
  const { rows: summaryRows, byBucket } = useMemo(() => buildArrivalStatusSummary(data), [data]);
  const byDateRows = useMemo(() => buildArrivalStatusByDate(data), [data]);
  const dateFooter = useMemo(() => buildArrivalDateTotals(byDateRows), [byDateRows]);
  const showOtherCol = useMemo(() => byDateRows.some((r) => r.otherOrUnknown > 0), [byDateRows]);

  const openSummary = (row: ArrivalStatusSummaryRow) => {
    if (row.bucket === 'total') {
      const all = data.filter((p) => p.arrival_date?.trim());
      onOpenPilgrims('جميع الحجاج — بتاريخ وصول', `${all.length.toLocaleString()} سجل`, all);
      return;
    }
    const list = byBucket[row.bucket as ArrivalFlowBucket];
    onOpenPilgrims(bucketModalTitle(row.bucket as ArrivalFlowBucket), row.label, list);
  };

  const openDayCell = (row: ArrivalDateDistributionRow, cell: 'normal' | 'early' | 'tm' | 'tk' | 'other') => {
    const list = filterPilgrimsByArrivalDayCell(row, cell);
    if (!list.length) return;
    const labels: Record<typeof cell, string> = {
      normal: 'طبيعي',
      early: 'مبكر',
      tm: 'نقل ← المدينة',
      tk: 'نقل ← مكة',
      other: 'أخرى / غير محدد',
    };
    onOpenPilgrims(`تفاصيل — ${row.dateLabel}`, labels[cell], list);
  };

  const colSpanBase = showOtherCol ? 8 : 7;

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
        <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
          <h2 className="m-0 text-base font-extrabold text-primary-dark">ملخص توزيع الحالات</h2>
        </div>
        <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
          <table className="min-w-[760px] w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-gradient-to-b from-slate-700 to-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.2)]">
                <th scope="col" className={cn(thSummary, 'ps-[22px]')}>
                  الحالة
                </th>
                <th scope="col" className={thSummary}>
                  العدد
                </th>
                <th scope="col" className={thSummary}>
                  النسبة %
                </th>
                <th scope="col" className={thSummary}>
                  تحتاج إجراء
                </th>
                <th scope="col" className={thSummary}>
                  اللون
                </th>
                <th scope="col" className={cn(thSummary, 'pe-[22px]')}>
                  ملاحظات
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => {
                const isTotal = row.bucket === 'total';
                return (
                  <tr
                    key={String(row.bucket)}
                    className={cn(
                      'border-b border-[#eef2f6] transition-colors even:bg-[#fafcfb] last:border-b-0',
                      !isTotal && 'hover:bg-primary-pale/50',
                    )}
                  >
                    <td className="px-3 py-3.5 ps-[22px] align-middle font-bold text-fg">
                      <span className="inline-flex items-center gap-2">
                        {row.bucket === 'normal' && (
                          <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                        )}
                        {row.actionUrgent && !isTotal && (
                          <TbBus className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                        )}
                        {row.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 align-middle tabular-nums">
                      <button
                        type="button"
                        disabled={row.count === 0}
                        className={cn(
                          'font-extrabold text-primary-dark tabular-nums underline decoration-primary-dark/35 decoration-1 underline-offset-2 disabled:cursor-default disabled:no-underline disabled:opacity-40',
                        )}
                        onClick={() => openSummary(row)}
                      >
                        {row.count.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 py-3.5 align-middle tabular-nums text-fg-secondary">
                      {row.pct.toLocaleString('en-US', { maximumFractionDigits: 1 })}%
                    </td>
                    <td className="px-3 py-3.5 align-middle text-fg-secondary">{row.actionLabel}</td>
                    <td className="px-3 py-3.5 align-middle">
                      <span className={cn('inline-block h-5 w-5 rounded border border-black/10 shadow-sm', row.swatchClass)} />
                    </td>
                    <td className="px-3 py-3.5 pe-[22px] align-middle text-[12px] font-semibold text-red-800">
                      {row.note ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
        <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
          <h2 className="m-0 text-base font-extrabold text-primary-dark">توزيع الحالات حسب تاريخ الوصول</h2>
        </div>
        <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
          <table className="min-w-[960px] w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-[1]">
              <tr>
                <th
                  scope="col"
                  className="border-none bg-slate-800 px-3 py-3.5 ps-[22px] text-start text-[10px] font-extrabold tracking-wide text-white"
                >
                  التاريخ
                </th>
                <th
                  scope="col"
                  className="border-none bg-emerald-700 px-3 py-3.5 text-start text-[10px] font-extrabold tracking-wide text-white"
                >
                  طبيعي
                </th>
                <th
                  scope="col"
                  className="border-none bg-amber-900/90 px-3 py-3.5 text-start text-[10px] font-extrabold tracking-wide text-white"
                >
                  مبكر
                </th>
                <th
                  scope="col"
                  className="border-none bg-amber-500 px-3 py-3.5 text-start text-[10px] font-extrabold tracking-wide text-amber-950"
                >
                  نقل ← المدينة
                </th>
                <th
                  scope="col"
                  className="border-none bg-red-800 px-3 py-3.5 text-start text-[10px] font-extrabold tracking-wide text-white"
                >
                  نقل ← مكة
                </th>
                {showOtherCol && (
                  <th
                    scope="col"
                    className="border-none bg-slate-500 px-3 py-3.5 text-start text-[10px] font-extrabold tracking-wide text-white"
                  >
                    أخرى / غير محدد
                  </th>
                )}
                <th
                  scope="col"
                  className="border-none bg-emerald-600/90 px-3 py-3.5 text-start text-[10px] font-extrabold tracking-wide text-white"
                >
                  الإجمالي
                </th>
                <th
                  scope="col"
                  className="border-none bg-sky-800 px-3 py-3.5 pe-[22px] text-start text-[10px] font-extrabold tracking-wide text-white"
                >
                  الرحلات
                </th>
              </tr>
            </thead>
            <tbody>
              {byDateRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpanBase} className="px-4 py-8 text-center text-fg-secondary">
                    لا توجد تواريخ وصول في البيانات.
                  </td>
                </tr>
              ) : (
                <>
                  {byDateRows.map((row) => (
                    <tr
                      key={row.sortDate}
                      className="border-b border-[#eef2f6] transition-colors even:bg-[#fafcfb] last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-3.5 ps-[22px] align-middle font-semibold text-fg">{row.dateLabel}</td>
                      <td className="px-3 py-3.5 align-middle text-fg">
                        <CountButton
                          value={row.normal}
                          onClick={() => openDayCell(row, 'normal')}
                        />
                      </td>
                      <td className="px-3 py-3.5 align-middle text-fg">
                        <CountButton
                          value={row.early}
                          onClick={() => openDayCell(row, 'early')}
                        />
                      </td>
                      <td className="px-3 py-3.5 align-middle text-fg">
                        <CountButton
                          value={row.transferMadinah}
                          highlight
                          onClick={() => openDayCell(row, 'tm')}
                        />
                      </td>
                      <td className="px-3 py-3.5 align-middle text-fg">
                        <CountButton
                          value={row.transferMakkah}
                          highlight
                          onClick={() => openDayCell(row, 'tk')}
                        />
                      </td>
                      {showOtherCol && (
                        <td className="px-3 py-3.5 align-middle text-fg">
                          <CountButton
                            value={row.otherOrUnknown}
                            onClick={() => openDayCell(row, 'other')}
                          />
                        </td>
                      )}
                      <td className="px-3 py-3.5 align-middle font-extrabold tabular-nums text-fg">
                        <button
                          type="button"
                          className="underline decoration-primary-dark/35 decoration-1 underline-offset-2"
                          onClick={() =>
                            onOpenPilgrims(`جميع الحجاج — ${row.dateLabel}`, 'كافة الحالات', row.pilgrims)
                          }
                        >
                          {row.total.toLocaleString()}
                        </button>
                      </td>
                      <td className="px-3 py-3.5 pe-[22px] align-middle font-bold tabular-nums text-sky-900">
                        {row.flights.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {dateFooter && (
                    <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-extrabold">
                      <td className="px-3 py-3.5 ps-[22px] align-middle text-fg">{dateFooter.dateLabel}</td>
                      <td className="px-3 py-3.5 align-middle tabular-nums">{dateFooter.normal.toLocaleString()}</td>
                      <td className="px-3 py-3.5 align-middle tabular-nums">{dateFooter.early.toLocaleString()}</td>
                      <td className="px-3 py-3.5 align-middle tabular-nums">
                        {dateFooter.transferMadinah.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 align-middle tabular-nums">
                        {dateFooter.transferMakkah.toLocaleString()}
                      </td>
                      {showOtherCol && (
                        <td className="px-3 py-3.5 align-middle tabular-nums">
                          {dateFooter.otherOrUnknown.toLocaleString()}
                        </td>
                      )}
                      <td className="px-3 py-3.5 align-middle tabular-nums text-primary-dark">
                        {dateFooter.total.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 pe-[22px] align-middle tabular-nums text-sky-900">
                        {dateFooter.flights.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
