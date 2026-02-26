import { useMemo, useState } from 'react';
import { rawData } from '../data/rawData';
import { useJourneyFilters } from '../store/useJourneyFilters';
import { DateRangeSlider } from './DateRangeSlider';
import type { JourneyFilters } from '../core/journeyFilterEngine';

function unique(arr: string[]) {
  return Array.from(new Set(arr)).sort();
}

function SelectFilter({
  label,
  filterKey,
  options,
}: {
  label: string;
  filterKey: keyof JourneyFilters;
  options: string[];
}) {
  const value = useJourneyFilters((s) => s.filters[filterKey]) as string | null;
  const set = useJourneyFilters((s) => s.setSidebarFilter);
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
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function BookingIdSearch() {
  const value = useJourneyFilters((s) => s.filters.dropdown_booking_id) ?? '';
  const set = useJourneyFilters((s) => s.setSidebarFilter);
  return (
    <div className="filter-group">
      <label className="filter-label">رقم الحجز</label>
      <input
        type="text"
        className="filter-select"
        placeholder="HJ-2025-00001"
        value={value}
        onChange={(e) => set('dropdown_booking_id', e.target.value || null)}
        style={{ paddingRight: '10px', backgroundImage: 'none' }}
      />
    </div>
  );
}

export function JourneySidebarFilters() {
  const [collapsed, setCollapsed] = useState(true);
  const filters  = useJourneyFilters((s) => s.filters);
  const setFilter = useJourneyFilters((s) => s.setSidebarFilter);
  const clearAll  = useJourneyFilters((s) => s.clearAll);

  const activeCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const arrivalDates  = useMemo(() => unique(rawData.map((p) => p.arrival_date)), []);
  const departureDates = useMemo(() => unique(rawData.map((p) => p.departure_date)), []);

  return (
    <aside className={`sidebar journey-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-title">الفلاتر</span>}
        <div className="journey-sidebar-actions">
          <button
            className="clear-btn journey-toggle-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'إظهار الفلاتر' : 'إخفاء الفلاتر'}
            title={collapsed ? 'إظهار الفلاتر' : 'إخفاء الفلاتر'}
          >
            {collapsed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              'إخفاء'
            )}
          </button>
          {!collapsed && activeCount > 0 && (
            <button className="clear-btn" onClick={clearAll}>
              مسح الكل ({activeCount})
            </button>
          )}
        </div>
      </div>

      {!collapsed && <div className="filter-scroll">
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
          label="مدينة الوصول"
          filterKey="dropdown_arrival_city"
          options={unique(rawData.map((p) => p.arrival_city))}
        />
        <SelectFilter
          label="فندق الوصول"
          filterKey="dropdown_arrival_hotel"
          options={unique(rawData.map((p) => p.arrival_hotel))}
        />
        <SelectFilter
          label="مدينة المغادرة"
          filterKey="dropdown_departure_city"
          options={unique(rawData.map((p) => p.departure_city))}
        />
        <SelectFilter
          label="فندق المغادرة"
          filterKey="dropdown_departure_hotel"
          options={unique(rawData.map((p) => p.departure_hotel))}
        />
        <SelectFilter
          label="الجنس"
          filterKey="dropdown_gender"
          options={unique(rawData.map((p) => p.gender))}
        />
        <SelectFilter
          label="الجنسية"
          filterKey="dropdown_nationality"
          options={unique(rawData.map((p) => p.nationality))}
        />
        <BookingIdSearch />
      </div>}
    </aside>
  );
}
