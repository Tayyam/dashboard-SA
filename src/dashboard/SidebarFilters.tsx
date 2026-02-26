import { useFilters } from '../store/useFilters';
import { rawData } from '../data/rawData';
import { useMemo } from 'react';
import type { Filters } from '../core/types';

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
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
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <select
        className="filter-select"
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
  const filters  = useFilters((s) => s.filters);

  const activeCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const arrivalDates = useMemo(() => unique(rawData.map((p) => p.arrival_date)), []);
  const years = useMemo(
    () => unique(rawData.map((p) => new Date(p.arrival_date).getFullYear().toString())),
    [],
  );
  const months = useMemo(
    () => unique(rawData.map((p) => (new Date(p.arrival_date).getMonth() + 1).toString())),
    [],
  );
  const days = useMemo(
    () => unique(rawData.map((p) => new Date(p.arrival_date).getDate().toString())),
    [],
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">الفلاتر</span>
        {activeCount > 0 && (
          <button className="clear-btn" onClick={clearAll}>
            مسح الكل ({activeCount})
          </button>
        )}
      </div>

      <div className="filter-scroll">
        <SelectFilter label="من تاريخ"     filterKey="from_date"     options={arrivalDates} />
        <SelectFilter label="إلى تاريخ"    filterKey="to_date"       options={arrivalDates} />
        <SelectFilter label="السنة"         filterKey="year"          options={years} />
        <SelectFilter label="الشهر"         filterKey="month"         options={months} />
        <SelectFilter label="اليوم"         filterKey="day"           options={days} />
        <SelectFilter label="مدينة الوصول"  filterKey="arrival_city"  options={unique(rawData.map((p) => p.arrival_city))} />
        <SelectFilter label="مدينة المغادرة" filterKey="departure_city" options={unique(rawData.map((p) => p.departure_city))} />
        <SelectFilter label="اسم الباقة"   filterKey="package"       options={unique(rawData.map((p) => p.package))} />
        <SelectFilter label="الجنس"         filterKey="gender"        options={unique(rawData.map((p) => p.gender))} />
      </div>
    </aside>
  );
}
