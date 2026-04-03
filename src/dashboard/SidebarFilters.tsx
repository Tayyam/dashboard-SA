import { useFilters } from '../store/useFilters';
import { useMemo } from 'react';
import type { Filters } from '../core/types';
import { usePilgrimsData } from '../store/usePilgrimsData';

function unique(arr: string[]): string[] {
  const invalid = new Set(['', 'null', 'undefined', 'nan']);
  return Array.from(
    new Set(
      arr
        .map((v) => (v ?? '').toString().trim())
        .filter((v) => !invalid.has(v.toLowerCase())),
    ),
  ).sort();
}

function SelectFilter({
  label,
  filterKey,
  options,
}: {
  label: string;
  filterKey: keyof Filters;
  options: string[];
}) {
  const value = useFilters((s) => s.filters[filterKey]) as string | null;
  const set = useFilters((s) => s.setSidebarFilter);

  return (
    <div className="mb-[11px]">
      <label className="mb-1 block text-[10px] font-semibold tracking-wide text-white/65 uppercase">{label}</label>
      <select
        className="filter-select-native"
        value={value ?? ''}
        onChange={(e) => set(filterKey, e.target.value || null)}
      >
        <option value="">الكل</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SidebarFilters() {
  const clearAll = useFilters((s) => s.clearAllFilters);
  const filters = useFilters((s) => s.filters);
  const data = usePilgrimsData((s) => s.data);

  const activeCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const arrivalDates = useMemo(() => unique(data.map((p) => p.arrival_date)), [data]);
  const years = useMemo(() => unique(data.map((p) => new Date(p.arrival_date).getFullYear().toString())), [data]);
  const months = useMemo(
    () => unique(data.map((p) => (new Date(p.arrival_date).getMonth() + 1).toString())),
    [data],
  );
  const days = useMemo(() => unique(data.map((p) => new Date(p.arrival_date).getDate().toString())), [data]);

  return (
    <aside
      data-sidebar="filters"
      className="flex w-56 shrink-0 flex-col overflow-hidden bg-primary max-md:hidden"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-4 pt-3.5 pb-3">
        <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase">الفلاتر</span>
        {activeCount > 0 && (
          <button
            type="button"
            className="cursor-pointer rounded border border-white/25 bg-white/15 px-2 py-0.5 font-sans text-[10px] font-medium whitespace-nowrap text-white/90 transition-all duration-150 hover:bg-white/25"
            onClick={clearAll}
          >
            مسح الكل ({activeCount})
          </button>
        )}
      </div>

      <div className="scrollbar-sidebar flex-1 overflow-y-auto px-3 pt-2.5 pb-5">
        <SelectFilter label="من تاريخ" filterKey="from_date" options={arrivalDates} />
        <SelectFilter label="إلى تاريخ" filterKey="to_date" options={arrivalDates} />
        <SelectFilter label="السنة" filterKey="year" options={years} />
        <SelectFilter label="الشهر" filterKey="month" options={months} />
        <SelectFilter label="اليوم" filterKey="day" options={days} />
        <SelectFilter label="مدينة الوصول" filterKey="arrival_city" options={unique(data.map((p) => p.arrival_city))} />
        <SelectFilter label="مدينة المغادرة" filterKey="departure_city" options={unique(data.map((p) => p.departure_city))} />
        <SelectFilter label="اسم الباقة" filterKey="package" options={unique(data.map((p) => p.package))} />
        <SelectFilter label="الجنس" filterKey="gender" options={unique(data.map((p) => p.gender))} />
      </div>
    </aside>
  );
}
