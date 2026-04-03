import { useMemo, useState } from 'react';
import { useJourneyFilters } from '../store/useJourneyFilters';
import { thirdStopChartLabel } from '../core/aggregationEngine';
import { DateRangeSlider } from './DateRangeSlider';
import type { JourneyFilters } from '../core/journeyFilterEngine';
import { usePilgrimsData } from '../store/usePilgrimsData';
import { formatJourneyAirportCode } from './journeyDisplay';
import { HiBars3BottomLeft } from 'react-icons/hi2';
import { cn } from '../lib/cn';

function unique(arr: string[]) {
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
  formatOption,
}: {
  label: string;
  filterKey: keyof JourneyFilters;
  options: string[];
  formatOption?: (raw: string) => string;
}) {
  const value = useJourneyFilters((s) => s.filters[filterKey]) as string | null;
  const set = useJourneyFilters((s) => s.setSidebarFilter);
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
            {formatOption ? formatOption(o) : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function BookingIdSearch() {
  const value = useJourneyFilters((s) => s.filters.dropdown_booking_id) ?? '';
  const set = useJourneyFilters((s) => s.setSidebarFilter);
  return (
    <div className="mb-[11px]">
      <label className="mb-1 block text-[10px] font-semibold tracking-wide text-white/65 uppercase">رقم الحجز</label>
      <input
        type="text"
        className="w-full rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 font-sans text-xs text-white/95 outline-none transition-colors placeholder:text-white/50 focus:border-white/50 focus:bg-white/[0.18]"
        placeholder="HJ-2025-00001"
        value={value}
        onChange={(e) => set('dropdown_booking_id', e.target.value || null)}
      />
    </div>
  );
}

export function JourneySidebarFilters() {
  const [collapsed, setCollapsed] = useState(true);
  const filters = useJourneyFilters((s) => s.filters);
  const setFilter = useJourneyFilters((s) => s.setSidebarFilter);
  const clearAll = useJourneyFilters((s) => s.clearAll);
  const data = usePilgrimsData((s) => s.data);

  const activeCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const arrivalDates = useMemo(() => unique(data.map((p) => p.arrival_date)), [data]);
  const departureDates = useMemo(() => unique(data.map((p) => p.departure_date)), [data]);

  return (
    <aside
      data-sidebar="filters"
      className={cn(
        'flex shrink-0 flex-col overflow-hidden bg-primary transition-[width] duration-[250ms] ease-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-white/15',
          collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 pt-3.5 pb-3',
        )}
      >
        {!collapsed && (
          <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase">الفلاتر</span>
        )}
        <div className={cn('flex items-center gap-1.5', collapsed && 'w-full justify-center')}>
          <button
            type="button"
            className={cn(
              'inline-flex cursor-pointer items-center justify-center rounded border border-white/25 bg-white/15 font-sans text-[10px] font-medium text-white/90 transition-all duration-150 hover:bg-white/25',
              collapsed ? 'h-8 w-8 min-w-8 p-0 text-[0]' : 'min-w-[54px] px-2 py-0.5',
            )}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'إظهار الفلاتر' : 'إخفاء الفلاتر'}
            title={collapsed ? 'إظهار الفلاتر' : 'إخفاء الفلاتر'}
          >
            {collapsed ? (
              <HiBars3BottomLeft className="h-3.5 w-3.5" aria-hidden />
            ) : (
              'إخفاء'
            )}
          </button>
          {!collapsed && activeCount > 0 && (
            <button
              type="button"
              className="cursor-pointer rounded border border-white/25 bg-white/15 px-2 py-0.5 font-sans text-[10px] font-medium whitespace-nowrap text-white/90 transition-all duration-150 hover:bg-white/25"
              onClick={clearAll}
            >
              مسح الكل ({activeCount})
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="scrollbar-sidebar flex-1 overflow-y-auto px-3 pt-2.5 pb-5">
          <DateRangeSlider
            label="نطاق تاريخ الوصول"
            dates={arrivalDates}
            fromDate={filters.arrival_date_from}
            toDate={filters.arrival_date_to}
            onChange={(from, to) => {
              setFilter('arrival_date_from', from);
              setFilter('arrival_date_to', to);
            }}
          />

          <DateRangeSlider
            label="نطاق تاريخ المغادرة"
            dates={departureDates}
            fromDate={filters.departure_date_from}
            toDate={filters.departure_date_to}
            onChange={(from, to) => {
              setFilter('departure_date_from', from);
              setFilter('departure_date_to', to);
            }}
          />

          <SelectFilter
            label="مطار مدينة الوصول"
            filterKey="dropdown_arrival_city"
            options={unique(data.map((p) => p.arrival_city))}
            formatOption={formatJourneyAirportCode}
          />
          <SelectFilter
            label="التوقف الأول (اسم)"
            filterKey="dropdown_first_stop"
            options={unique(data.map((p) => p.first_stop_name))}
          />
          <SelectFilter
            label="التوقف الثاني (اسم)"
            filterKey="dropdown_second_stop"
            options={unique(data.map((p) => p.second_stop_name))}
          />
          <SelectFilter
            label="التوقف الثالث (اسم)"
            filterKey="dropdown_third_stop"
            options={unique(data.map((p) => thirdStopChartLabel(p)))}
          />
          <SelectFilter
            label="مطار مدينة المغادرة"
            filterKey="dropdown_departure_city"
            options={unique(data.map((p) => p.departure_city))}
            formatOption={formatJourneyAirportCode}
          />
          <SelectFilter
            label="الجنس"
            filterKey="dropdown_gender"
            options={unique(data.map((p) => p.gender))}
          />
          <SelectFilter
            label="الجنسية"
            filterKey="dropdown_nationality"
            options={unique(data.map((p) => p.nationality))}
          />
          <BookingIdSearch />
        </div>
      )}
    </aside>
  );
}
