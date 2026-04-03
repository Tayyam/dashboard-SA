import { useMemo } from 'react';
import { usePilgrimsData } from '../store/usePilgrimsData';
import { PACKAGE_TYPE_MATRIX, countPilgrimsByPackageType } from '../core/packageTypeReport';
import { cn } from '../lib/cn';

function CityPill({ value }: { value: string | null }) {
  if (!value || value === '—') {
    return <span className="font-semibold text-fg-muted">—</span>;
  }
  const k = value.trim().toLowerCase();
  const variant =
    k === 'madinah' ? 'madinah' : k === 'makkah' ? 'makkah' : k === 'mina' ? 'mina' : 'other';
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2.5 py-1 text-xs font-bold',
        variant === 'madinah' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        variant === 'makkah' && 'border-blue-200 bg-blue-50 text-blue-700',
        variant === 'mina' && 'border-amber-200 bg-amber-50 text-amber-800',
        variant === 'other' && 'border-border bg-gray-100 text-gray-700',
      )}
    >
      {value}
    </span>
  );
}

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

export function ReportsPage() {
  const data = usePilgrimsData((s) => s.data);
  const loading = usePilgrimsData((s) => s.loading);

  const { byType, unmatched } = useMemo(() => countPilgrimsByPackageType(data), [data]);
  const totalClassified = useMemo(
    () => PACKAGE_TYPE_MATRIX.reduce((s, r) => s + byType[r.type], 0),
    [byType],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-primary-pale from-0% via-page via-[38%] to-slate-50 to-100% [background-size:100%_100%]">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-6 pb-4 pt-3.5 shadow-[0_1px_0_rgba(4,106,56,0.06)]">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_14px_rgba(4,106,56,0.28)]"
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2 2H5V5h14v14zm2-16H3v18h18V3z"
                fill="currentColor"
                opacity="0.9"
              />
            </svg>
          </span>
          <div>
            <p className="m-0 text-[15px] font-extrabold tracking-tight text-fg">مركز التقارير</p>
            <p className="mt-1 text-xs font-medium leading-snug text-fg-secondary">إحصائيات مباشرة من بيانات الحجاج المحمّلة</p>
          </div>
        </div>
      </header>

      <div className="scrollbar-reports min-h-0 flex-1 overflow-y-auto px-[22px] pb-8 pt-5">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
          {loading && data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-12 font-semibold text-fg-secondary">
              <div className="h-12 w-12 animate-[reports-spin_0.85s_linear_infinite] rounded-full border-[3px] border-primary border-t-transparent bg-primary-pale" />
              <p>جاري تحميل بيانات الحجاج...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-[14px] max-[720px]:grid-cols-1">
                <div className="rounded-[14px] border border-[#b8e0cc] bg-gradient-to-br from-white to-primary-ultra px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-150 hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(4,106,56,0.1)]">
                  <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
                    إجمالي السجلات
                  </span>
                  <span className="text-[26px] font-extrabold tracking-tight text-fg tabular-nums">{data.length.toLocaleString()}</span>
                </div>
                <div className="rounded-[14px] border border-border bg-card px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-150 hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(4,106,56,0.1)]">
                  <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">مصنّف T1–T5</span>
                  <span className="text-[26px] font-extrabold tracking-tight text-primary-dark tabular-nums">
                    {totalClassified.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-[14px] border border-border bg-card px-[18px] py-4 shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-150 hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(4,106,56,0.1)]">
                  <span className="mb-1.5 block text-[11px] font-bold tracking-wide text-fg-secondary uppercase">غير مطابق للجدول</span>
                  <span className="text-[26px] font-extrabold tracking-tight text-amber-700 tabular-nums">
                    {unmatched.toLocaleString()}
                  </span>
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
                <div className="border-b border-border bg-gradient-to-b from-white to-[#fafcfb] px-[22px] pb-4 pt-5">
                  <h2 className="mb-2 text-base font-extrabold text-primary-dark">تقرير أنواع الباقات (T1–T5)</h2>
                  <p className="m-0 text-[13px] leading-relaxed text-fg-secondary">
                    Package type، أرقام الباقات، وترتيب التوقفات (first / second / third) مع العدد الفعلي من البيانات المحمّلة.
                  </p>
                </div>

                <div className="scrollbar-table-x overflow-x-auto touch-pan-x">
                  <table className="min-w-[720px] w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-[1]">
                      <tr className="bg-gradient-to-b from-primary to-primary-dark shadow-[0_2px_8px_rgba(4,106,56,0.2)]">
                        <th
                          scope="col"
                          className="border-none px-4 py-3.5 ps-[22px] text-start text-[11px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="border-none px-4 py-3.5 text-start text-[11px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap"
                        >
                          Package Numbers
                        </th>
                        <th
                          scope="col"
                          className="border-none px-4 py-3.5 text-start text-[11px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap"
                        >
                          first
                        </th>
                        <th
                          scope="col"
                          className="border-none px-4 py-3.5 text-start text-[11px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap"
                        >
                          second
                        </th>
                        <th
                          scope="col"
                          className="border-none px-4 py-3.5 text-start text-[11px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap"
                        >
                          third
                        </th>
                        <th
                          scope="col"
                          className="border-none px-4 py-3.5 pe-[22px] text-end text-[11px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap"
                        >
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
                            <CityPill value={row.first} />
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <CityPill value={row.second} />
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <CityPill value={row.third} />
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
          )}
        </div>
      </div>
    </div>
  );
}
