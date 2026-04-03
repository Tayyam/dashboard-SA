import { useMemo, useState, type ReactNode } from 'react';
import { usePilgrimsData } from '../store/usePilgrimsData';
import { PACKAGE_TYPE_MATRIX, countPilgrimsByPackageType } from '../core/packageTypeReport';
import { buildMovementReportRows } from '../core/movementReport';
import {
  buildArrivalReportRows,
  buildDepartureReportRows,
  buildTransferCasesReport,
  rowStatusDisplay,
} from '../core/transferReports';
import type { Pilgrim } from '../core/types';
import { RegionBadge } from '../components/RegionBadge';
import { cn } from '../lib/cn';
import { ArrivalStatusDistributionReportSection } from './ArrivalStatusDistributionReportSection';
import { PilgrimGroupModal } from './PilgrimGroupModal';
import {
  HiOutlineArrowDownCircle,
  HiOutlineArrowUpCircle,
  HiOutlineArrowsRightLeft,
  HiOutlineChevronLeft,
  HiOutlineCube,
  HiOutlineDocumentChartBar,
  HiOutlineTableCells,
} from 'react-icons/hi2';
import { TbTruckDelivery } from 'react-icons/tb';

type ReportView =
  | 'hub'
  | 'packages'
  | 'arrival'
  | 'arrival_status'
  | 'departure'
  | 'transfers'
  | 'movements';

function TypeBadge({ type }: { type: string }) {
  const n = type.replace(/^T/i, '');
  return (
    <span
      className={cn(
        'inline-flex min-w-[2.5rem] items-center justify-center rounded-lg px-3 py-1.5 text-[13px] font-black tracking-wide text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
        n === '1' && 'bg-gradient-to-br from-[#046a38] to-[#023d20]',
        n === '2' && 'bg-gradient-to-br from-teal-600 to-teal-700',
        n === '3' && 'bg-gradient-to-br from-blue-600 to-blue-700',
        n === '4' && 'bg-gradient-to-br from-violet-600 to-violet-800',
        n === '5' && 'bg-gradient-to-br from-orange-700 to-orange-800',
      )}
      data-type={type}
    >
      {type}
    </span>
  );
}

const thBase =
  'border-none px-4 py-3.5 text-start text-[11px] font-extrabold tracking-wide text-white whitespace-nowrap';

function statusPillClass(text: string) {
  if (text === 'طبيعي') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (text === 'يحتاج إلى نقل') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (text === 'غير محدد' || /^\d[\d,]* غير محدد$/.test(text)) {
    return 'border-gray-200 bg-gray-100 text-gray-600';
  }
  return 'border-sky-200 bg-sky-50 text-sky-900';
}

const VIEW_TITLES: Record<Exclude<ReportView, 'hub'>, string> = {
  packages: 'تقرير أنواع الباقات (T1–T5)',
  arrival: 'تقرير الوصول',
  arrival_status: 'توزيع حالات الوصول',
  departure: 'تقرير المغادرة',
  transfers: 'تقرير حالات النقل',
  movements: 'تقرير التحركات',
};

const REPORT_HUB_ICON_WRAP =
  'bg-gradient-to-br from-primary to-primary-dark shadow-[0_4px_14px_rgba(4,106,56,0.35)]';

function ReportHubTile({
  title,
  badge,
  onClick,
  iconWrapClass = REPORT_HUB_ICON_WRAP,
  children,
}: {
  title: string;
  badge?: string;
  onClick: () => void;
  iconWrapClass?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col items-stretch gap-4 rounded-2xl border border-border bg-card p-6 text-start shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_40px_rgba(4,106,56,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner',
            iconWrapClass,
          )}
        >
          {children}
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-fg-secondary transition-colors group-hover:bg-primary-pale group-hover:text-primary-dark">
          عرض التقرير
        </span>
      </div>
      <div>
        <h3 className="text-lg font-extrabold tracking-tight text-fg">{title}</h3>
        {badge && (
          <p className="mt-3 text-xs font-bold text-primary-dark tabular-nums">{badge}</p>
        )}
      </div>
    </button>
  );
}

export function ReportsPage() {
  const data = usePilgrimsData((s) => s.data);
  const loading = usePilgrimsData((s) => s.loading);

  const [view, setView] = useState<ReportView>('hub');

  const [detailModal, setDetailModal] = useState<{
    title: string;
    subtitle?: string;
    pilgrims: Pilgrim[];
  } | null>(null);

  const { byType, unmatched } = useMemo(() => countPilgrimsByPackageType(data), [data]);
  const totalClassified = useMemo(
    () => PACKAGE_TYPE_MATRIX.reduce((s, r) => s + byType[r.type], 0),
    [byType],
  );

  const arrivalRows = useMemo(() => buildArrivalReportRows(data), [data]);
  const departureRows = useMemo(() => buildDepartureReportRows(data), [data]);
  const transferCases = useMemo(() => buildTransferCasesReport(data), [data]);
  const movementRows = useMemo(() => buildMovementReportRows(data), [data]);
  const withArrivalCount = useMemo(() => data.filter((p) => p.arrival_date?.trim()).length, [data]);

  const transferPilgrimCount = useMemo(
    () => transferCases.reduce((s, r) => s + r.count, 0),
    [transferCases],
  );

  return (
    <>
      <PilgrimGroupModal
        open={!!detailModal}
        title={detailModal?.title ?? ''}
        subtitle={detailModal?.subtitle}
        pilgrims={detailModal?.pilgrims ?? []}
        onClose={() => setDetailModal(null)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-primary-pale from-0% via-page via-[38%] to-slate-50 to-100% [background-size:100%_100%]">
        <header className="flex shrink-0 flex-col border-b border-border bg-card shadow-[0_1px_0_rgba(4,106,56,0.06)]">
          <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-3.5">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_14px_rgba(4,106,56,0.28)]"
                aria-hidden
              >
                <HiOutlineDocumentChartBar className="h-[22px] w-[22px] text-white" aria-hidden />
              </span>
              <div>
                <p className="m-0 text-[15px] font-extrabold tracking-tight text-fg">مركز التقارير</p>
                <p className="mt-1 text-xs font-medium leading-snug text-fg-secondary">
                  {view === 'hub'
                    ? 'اختر تقريراً من البطاقات أدناه'
                    : VIEW_TITLES[view as Exclude<ReportView, 'hub'>]}
                </p>
              </div>
            </div>
          </div>
          {view !== 'hub' && (
            <div className="flex items-center gap-3 border-t border-border/80 bg-gradient-to-r from-gray-50/90 to-white px-6 py-3">
              <button
                type="button"
                onClick={() => setView('hub')}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-fg-secondary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-pale hover:text-primary-dark"
              >
                <HiOutlineChevronLeft className="h-[18px] w-[18px]" aria-hidden />
                العودة للتقارير
              </button>
              <span className="text-sm font-extrabold text-primary-dark">{VIEW_TITLES[view]}</span>
            </div>
          )}
        </header>

        <div className="scrollbar-reports min-h-0 flex-1 overflow-y-auto px-[22px] pb-8 pt-5">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
            {loading && data.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-12 font-semibold text-fg-secondary">
                <div className="h-12 w-12 animate-[reports-spin_0.85s_linear_infinite] rounded-full border-[3px] border-primary border-t-transparent bg-primary-pale" />
                <p>جاري تحميل بيانات الحجاج...</p>
              </div>
            ) : view === 'hub' ? (
              <>
                <div className="grid grid-cols-3 gap-[14px] max-[720px]:grid-cols-1">
                  <div className="rounded-[14px] border border-[#b8e0cc] bg-gradient-to-br from-white to-primary-ultra px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                      إجمالي السجلات
                    </span>
                    <span className="text-[26px] font-extrabold tracking-tight text-fg tabular-nums">
                      {data.length.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-[14px] border border-border bg-card px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                      مصنّف T1–T5
                    </span>
                    <span className="text-[26px] font-extrabold tracking-tight text-primary-dark tabular-nums">
                      {totalClassified.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-[14px] border border-border bg-card px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                      غير مطابق للجدول
                    </span>
                    <span className="text-[26px] font-extrabold tracking-tight text-amber-700 tabular-nums">
                      {unmatched.toLocaleString()}
                    </span>
                  </div>
                </div>

                <h2 className="text-base font-extrabold text-fg">التقارير المتاحة</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReportHubTile
                    title="أنواع الباقات (T1–T5)"
                    badge={`${totalClassified.toLocaleString()} حاج مصنّف`}
                    onClick={() => setView('packages')}
                  >
                    <HiOutlineCube className="h-7 w-7" aria-hidden />
                  </ReportHubTile>

                  <ReportHubTile
                    title="تقرير الوصول"
                    badge={`${arrivalRows.length.toLocaleString()} صف تجميع`}
                    onClick={() => setView('arrival')}
                  >
                    <HiOutlineArrowDownCircle className="h-7 w-7" aria-hidden />
                  </ReportHubTile>

                  <ReportHubTile
                    title="توزيع حالات الوصول"
                    badge={`${withArrivalCount.toLocaleString()} حاج بتاريخ وصول`}
                    onClick={() => setView('arrival_status')}
                  >
                    <HiOutlineTableCells className="h-7 w-7" aria-hidden />
                  </ReportHubTile>

                  <ReportHubTile
                    title="تقرير المغادرة"
                    badge={`${departureRows.length.toLocaleString()} صف تجميع`}
                    onClick={() => setView('departure')}
                  >
                    <HiOutlineArrowUpCircle className="h-7 w-7" aria-hidden />
                  </ReportHubTile>

                  <ReportHubTile
                    title="حالات النقل"
                    badge={
                      transferCases.length > 0
                        ? `${transferCases.length.toLocaleString()} حالة · ${transferPilgrimCount.toLocaleString()} حاج`
                        : 'لا توجد حالات حالياً'
                    }
                    onClick={() => setView('transfers')}
                  >
                    <TbTruckDelivery className="h-7 w-7" aria-hidden />
                  </ReportHubTile>

                  <ReportHubTile
                    title="تقرير التحركات"
                    badge={`${movementRows.length.toLocaleString()} صف حركة`}
                    onClick={() => setView('movements')}
                  >
                    <HiOutlineArrowsRightLeft className="h-7 w-7" aria-hidden />
                  </ReportHubTile>
                </div>
              </>
            ) : view === 'packages' ? (
              <>
                <div className="grid grid-cols-3 gap-[14px] max-[720px]:grid-cols-1">
                  <div className="rounded-[14px] border border-[#b8e0cc] bg-gradient-to-br from-white to-primary-ultra px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                      إجمالي السجلات
                    </span>
                    <span className="text-[26px] font-extrabold tracking-tight text-fg tabular-nums">
                      {data.length.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-[14px] border border-border bg-card px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                      مصنّف T1–T5
                    </span>
                    <span className="text-[26px] font-extrabold tracking-tight text-primary-dark tabular-nums">
                      {totalClassified.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-[14px] border border-border bg-card px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                    <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                      غير مطابق للجدول
                    </span>
                    <span className="text-[26px] font-extrabold tracking-tight text-amber-700 tabular-nums">
                      {unmatched.toLocaleString()}
                    </span>
                  </div>
                </div>

                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
                    <h2 className="m-0 text-base font-extrabold text-primary-dark">تقرير أنواع الباقات (T1–T5)</h2>
                  </div>

                  <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
                    <table className="min-w-[720px] w-full border-collapse text-[13px]">
                      <thead className="sticky top-0 z-[1]">
                        <tr className="bg-gradient-to-b from-primary to-primary-dark shadow-[0_2px_8px_rgba(4,106,56,0.2)]">
                          <th scope="col" className={cn(thBase, 'ps-[22px] uppercase')}>
                            Type
                          </th>
                          <th scope="col" className={cn(thBase, 'uppercase')}>
                            Package Numbers
                          </th>
                          <th scope="col" className={cn(thBase, 'uppercase')}>
                            first
                          </th>
                          <th scope="col" className={cn(thBase, 'uppercase')}>
                            second
                          </th>
                          <th scope="col" className={cn(thBase, 'uppercase')}>
                            third
                          </th>
                          <th scope="col" className={cn(thBase, 'pe-[22px] text-end uppercase')}>
                            عدد الحجاج
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {PACKAGE_TYPE_MATRIX.map((row) => (
                          <tr
                            key={row.type}
                            className="border-b border-[#eef2f6] transition-colors duration-100 even:bg-[#fafcfb] last:border-b-0 hover:bg-primary-pale"
                          >
                            <td className="px-4 py-3.5 ps-[22px] align-middle text-fg">
                              <TypeBadge type={row.type} />
                            </td>
                            <td className="max-w-[400px] px-4 py-3.5 align-middle text-xs leading-normal text-fg-secondary tabular-nums">
                              {row.packageNumbers.join(', ')}
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <RegionBadge label={row.first} />
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <RegionBadge label={row.second} />
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <RegionBadge label={row.third} />
                            </td>
                            <td className="px-4 py-3.5 pe-[22px] text-end align-middle">
                              <span className="inline-flex min-w-[3.2rem] items-center justify-center rounded-full border border-[#b8e0cc] bg-primary-pale px-3 py-1.5 text-[13px] font-extrabold text-primary-dark tabular-nums">
                                {byType[row.type].toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : view === 'arrival' ? (
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
                <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
                  <h2 className="m-0 text-base font-extrabold text-primary-dark">تقرير الوصول</h2>
                </div>
                <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
                  <table className="min-w-[960px] w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-[1]">
                      <tr className="bg-gradient-to-b from-primary to-primary-dark shadow-[0_2px_8px_rgba(4,106,56,0.2)]">
                        <th scope="col" className={cn(thBase, 'ps-[22px]')}>
                          تاريخ الوصول
                        </th>
                        <th scope="col" className={thBase}>
                          مطار الوصول
                        </th>
                        <th scope="col" className={thBase}>
                          نقطة التوقف الأولى
                        </th>
                        <th scope="col" className={thBase}>
                          مكان نقطة التوقف الأولى
                        </th>
                        <th scope="col" className={thBase}>
                          الحالة
                        </th>
                        <th scope="col" className={cn(thBase, 'pe-[22px] text-end')}>
                          عدد الحجاج
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {arrivalRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-fg-secondary">
                            لا توجد بيانات وصول كافية.
                          </td>
                        </tr>
                      ) : (
                        arrivalRows.map((row, idx) => {
                          const st = rowStatusDisplay(row);
                          return (
                            <tr
                              key={`arr-${row.sortDate}-${row.airportLabel}-${row.stopLabel}-${row.firstStopLocationLabel}-${idx}`}
                              className="border-b border-[#eef2f6] transition-colors duration-100 even:bg-[#fafcfb] last:border-b-0 hover:bg-primary-pale"
                            >
                              <td className="px-4 py-3.5 ps-[22px] align-middle font-medium text-fg">{row.dateLabel}</td>
                              <td className="px-4 py-3.5 align-middle">
                                <RegionBadge label={row.airportLabel} />
                              </td>
                              <td
                                className="max-w-[220px] truncate px-4 py-3.5 align-middle text-fg-secondary"
                                title={row.stopLabel}
                              >
                                {row.stopLabel}
                              </td>
                              <td className="max-w-[200px] px-4 py-3.5 align-middle">
                                <RegionBadge label={row.firstStopLocationLabel} className="max-w-full" />
                              </td>
                              <td className="px-4 py-3.5 align-middle">
                                <span
                                  className={cn(
                                    'inline-block max-w-[240px] rounded-full border px-3 py-1 text-[11px] font-bold leading-snug',
                                    statusPillClass(st),
                                  )}
                                >
                                  {st}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 pe-[22px] text-end align-middle">
                                <button
                                  type="button"
                                  className="inline-flex min-w-[3.2rem] cursor-pointer items-center justify-center rounded-full border border-[#b8e0cc] bg-primary-pale px-3 py-1.5 text-[13px] font-extrabold text-primary-dark tabular-nums underline decoration-primary-dark/40 decoration-1 underline-offset-2 transition-colors hover:bg-emerald-100"
                                  onClick={() =>
                                    setDetailModal({
                                      title: 'تفاصيل الحجاج — تقرير الوصول',
                                      subtitle: `${row.dateLabel} · ${row.airportLabel} · ${row.stopLabel} · ${row.firstStopLocationLabel}`,
                                      pilgrims: row.pilgrims,
                                    })
                                  }
                                >
                                  {row.pilgrims.length.toLocaleString()}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : view === 'arrival_status' ? (
              <ArrivalStatusDistributionReportSection
                data={data}
                onOpenPilgrims={(title, subtitle, pilgrims) => setDetailModal({ title, subtitle, pilgrims })}
              />
            ) : view === 'departure' ? (
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
                <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
                  <h2 className="m-0 text-base font-extrabold text-primary-dark">تقرير المغادرة</h2>
                </div>
                <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
                  <table className="min-w-[960px] w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-[1]">
                      <tr className="bg-gradient-to-b from-primary to-primary-dark shadow-[0_2px_8px_rgba(4,106,56,0.2)]">
                        <th scope="col" className={cn(thBase, 'ps-[22px]')}>
                          تاريخ المغادرة
                        </th>
                        <th scope="col" className={thBase}>
                          مطار المغادرة
                        </th>
                        <th scope="col" className={thBase}>
                          نقطة التوقف (قبل المغادرة)
                        </th>
                        <th scope="col" className={thBase}>
                          مكان آخر نقطة توقف
                        </th>
                        <th scope="col" className={thBase}>
                          الحالة
                        </th>
                        <th scope="col" className={cn(thBase, 'pe-[22px] text-end')}>
                          عدد الحجاج
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departureRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-fg-secondary">
                            لا توجد بيانات مغادرة كافية.
                          </td>
                        </tr>
                      ) : (
                        departureRows.map((row, idx) => {
                          const st = rowStatusDisplay(row);
                          return (
                            <tr
                              key={`dep-${row.sortDate}-${row.airportLabel}-${row.stopLabel}-${row.firstStopLocationLabel}-${idx}`}
                              className="border-b border-[#eef2f6] transition-colors duration-100 even:bg-[#fafcfb] last:border-b-0 hover:bg-primary-pale"
                            >
                              <td className="px-4 py-3.5 ps-[22px] align-middle font-medium text-fg">{row.dateLabel}</td>
                              <td className="px-4 py-3.5 align-middle">
                                <RegionBadge label={row.airportLabel} />
                              </td>
                              <td
                                className="max-w-[220px] truncate px-4 py-3.5 align-middle text-fg-secondary"
                                title={row.stopLabel}
                              >
                                {row.stopLabel}
                              </td>
                              <td className="max-w-[200px] px-4 py-3.5 align-middle">
                                <RegionBadge label={row.firstStopLocationLabel} className="max-w-full" />
                              </td>
                              <td className="px-4 py-3.5 align-middle">
                                <span
                                  className={cn(
                                    'inline-block max-w-[240px] rounded-full border px-3 py-1 text-[11px] font-bold leading-snug',
                                    statusPillClass(st),
                                  )}
                                >
                                  {st}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 pe-[22px] text-end align-middle">
                                <button
                                  type="button"
                                  className="inline-flex min-w-[3.2rem] cursor-pointer items-center justify-center rounded-full border border-[#b8e0cc] bg-primary-pale px-3 py-1.5 text-[13px] font-extrabold text-primary-dark tabular-nums underline decoration-primary-dark/40 decoration-1 underline-offset-2 transition-colors hover:bg-emerald-100"
                                  onClick={() =>
                                    setDetailModal({
                                      title: 'تفاصيل الحجاج — تقرير المغادرة',
                                      subtitle: `${row.dateLabel} · ${row.airportLabel} · ${row.stopLabel} · ${row.firstStopLocationLabel}`,
                                      pilgrims: row.pilgrims,
                                    })
                                  }
                                >
                                  {row.pilgrims.length.toLocaleString()}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : view === 'transfers' ? (
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
                <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
                  <h2 className="m-0 text-base font-extrabold text-primary-dark">تقرير حالات النقل</h2>
                </div>
                <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
                  <table className="min-w-[960px] w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-[1]">
                      <tr className="bg-gradient-to-b from-primary to-primary-dark shadow-[0_2px_8px_rgba(4,106,56,0.2)]">
                        <th scope="col" className={cn(thBase, 'ps-[22px]')}>
                          النوع
                        </th>
                        <th scope="col" className={thBase}>
                          التاريخ
                        </th>
                        <th scope="col" className={thBase}>
                          المطار
                        </th>
                        <th scope="col" className={thBase}>
                          مدينة الوجهة
                        </th>
                        <th scope="col" className={thBase}>
                          نقطة التوقف
                        </th>
                        <th scope="col" className={thBase}>
                          المكان
                        </th>
                        <th scope="col" className={cn(thBase, 'pe-[22px] text-end')}>
                          عدد الحجاج
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferCases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-fg-secondary">
                            لا توجد حالات نقل مطابقة للقواعد الحالية.
                          </td>
                        </tr>
                      ) : (
                        transferCases.map((row, idx) => (
                          <tr
                            key={`tr-${row.kind}-${row.sortDate}-${row.airportLabel}-${idx}`}
                            className="border-b border-[#eef2f6] transition-colors duration-100 even:bg-[#fafcfb] last:border-b-0 hover:bg-amber-50/60"
                          >
                            <td className="px-4 py-3.5 ps-[22px] align-middle">
                              <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900">
                                {row.kind === 'arrival' ? 'وصول' : 'مغادرة'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 align-middle font-medium text-fg">{row.dateLabel}</td>
                            <td className="px-4 py-3.5 align-middle">
                              <RegionBadge label={row.airportLabel} />
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <RegionBadge label={row.destinationCity} />
                            </td>
                            <td
                              className="max-w-[200px] truncate px-4 py-3.5 align-middle text-fg-secondary"
                              title={row.stopLabel}
                            >
                              {row.stopLabel}
                            </td>
                            <td className="max-w-[180px] px-4 py-3.5 align-middle">
                              <RegionBadge label={row.firstStopLocationLabel} className="max-w-full" />
                            </td>
                            <td className="px-4 py-3.5 pe-[22px] text-end align-middle">
                              <button
                                type="button"
                                className="inline-flex min-w-[3.2rem] cursor-pointer items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[13px] font-extrabold text-amber-900 tabular-nums underline decoration-amber-700/40 decoration-1 underline-offset-2 hover:bg-amber-100"
                                onClick={() =>
                                  setDetailModal({
                                    title: `تفاصيل الحجاج — نقل (${row.kind === 'arrival' ? 'وصول' : 'مغادرة'})`,
                                    subtitle: `${row.dateLabel} · ${row.airportLabel} · ${row.destinationCity} · ${row.firstStopLocationLabel}`,
                                    pilgrims: row.pilgrims,
                                  })
                                }
                              >
                                {row.count.toLocaleString()}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
                <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] py-4">
                  <h2 className="m-0 text-base font-extrabold text-primary-dark">تقرير التحركات</h2>
                </div>
                <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
                  <table className="min-w-[1020px] w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-[1]">
                      <tr className="bg-gradient-to-b from-violet-700 to-indigo-900 shadow-[0_2px_8px_rgba(67,56,202,0.25)]">
                        <th scope="col" className={cn(thBase, 'ps-[22px]')}>
                          التاريخ
                        </th>
                        <th scope="col" className={thBase}>
                          مكان نقطة التحرك من
                        </th>
                        <th scope="col" className={thBase}>
                          مكان نقطة التحرك إلى
                        </th>
                        <th scope="col" className={thBase}>
                          اسم نقطة التحرك من
                        </th>
                        <th scope="col" className={thBase}>
                          اسم نقطة التحرك إلى
                        </th>
                        <th scope="col" className={cn(thBase, 'pe-[22px] text-end')}>
                          عدد الحجاج
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-fg-secondary">
                            لا توجد تحركات كافية بين التوقف الأول والثاني (تحقق من التواريخ والمواقع في البيانات).
                          </td>
                        </tr>
                      ) : (
                        movementRows.map((row, idx) => (
                          <tr
                            key={`mov-${row.sortDate}-${row.fromLocation}-${row.toLocation}-${row.fromName}-${row.toName}-${idx}`}
                            className="border-b border-[#eef2f6] transition-colors duration-100 even:bg-[#fafcfb] last:border-b-0 hover:bg-violet-50/50"
                          >
                            <td className="px-4 py-3.5 ps-[22px] align-middle font-medium text-fg">{row.dateLabel}</td>
                            <td className="max-w-[180px] px-4 py-3.5 align-middle">
                              <RegionBadge label={row.fromLocation} className="max-w-full" />
                            </td>
                            <td className="max-w-[180px] px-4 py-3.5 align-middle">
                              <RegionBadge label={row.toLocation} className="max-w-full" />
                            </td>
                            <td
                              className="max-w-[200px] truncate px-4 py-3.5 align-middle text-fg"
                              title={row.fromName}
                            >
                              {row.fromName}
                            </td>
                            <td
                              className="max-w-[200px] truncate px-4 py-3.5 align-middle text-fg"
                              title={row.toName}
                            >
                              {row.toName}
                            </td>
                            <td className="px-4 py-3.5 pe-[22px] text-end align-middle">
                              <button
                                type="button"
                                className="inline-flex min-w-[3.2rem] cursor-pointer items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[13px] font-extrabold text-indigo-900 tabular-nums underline decoration-indigo-700/35 decoration-1 underline-offset-2 transition-colors hover:bg-violet-100"
                                onClick={() =>
                                  setDetailModal({
                                    title: 'تفاصيل الحجاج — تقرير التحركات',
                                    subtitle: `${row.dateLabel} · ${row.fromName} → ${row.toName}`,
                                    pilgrims: row.pilgrims,
                                  })
                                }
                              >
                                {row.pilgrims.length.toLocaleString()}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
