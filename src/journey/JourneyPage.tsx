import { useJourneyFilters } from '../store/useJourneyFilters';
import { JourneySidebarFilters } from './SidebarFilters';
import { JourneyFlow } from './JourneyFlow';
import { PilgrimsTable } from '../dashboard/PilgrimsTable';
import { useJourneyData } from '../store/useJourneyData';
import type { JourneyFilters } from '../core/journeyFilterEngine';
import { HiOutlineMap } from 'react-icons/hi2';
import { formatJourneyAirportCode } from './journeyDisplay';

const NODE_LABELS: Partial<Record<keyof JourneyFilters, string>> = {
  node_arrival_date: 'تاريخ الوصول',
  node_package: 'الباقة',
  node_arrival_city: 'مطار مدينة الوصول',
  node_first_stop_name: 'التوقف الأول',
  node_first_stop_check_out: 'مغادرة مكان التوقف الأول',
  node_second_stop_name: 'التوقف الثاني',
  node_second_stop_check_out: 'مغادرة مكان التوقف الثاني',
  node_third_stop_name: 'التوقف الثالث',
  node_third_stop_check_out: 'مغادرة مكان التوقف الثالث',
  node_departure_city: 'مطار مدينة المغادرة',
  node_departure_date: 'تاريخ المغادرة',
};

function formatJourneyBadgeValue(key: keyof JourneyFilters, value: string): string {
  if (key === 'node_arrival_city' || key === 'node_departure_city') return formatJourneyAirportCode(value);
  return value;
}

const NODE_KEYS = Object.keys(NODE_LABELS) as (keyof JourneyFilters)[];

function ActiveBadges() {
  const filters = useJourneyFilters((s) => s.filters);
  const toggle = useJourneyFilters((s) => s.toggleNodeFilter);
  const active = NODE_KEYS.filter((k) => filters[k]);
  return (
    <div className="flex min-h-9 shrink-0 items-center">
      <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pb-0.5">
        {active.map((k) => (
          <button
            key={k}
            type="button"
            className="shrink-0 cursor-pointer rounded-full border border-[#b3d9c5] bg-primary-pale px-3 py-1 text-xs font-medium text-primary-dark transition-all duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            onClick={() => toggle(k, filters[k]!)}
          >
            {NODE_LABELS[k]}: <strong>{formatJourneyBadgeValue(k, filters[k]!)}</strong> x
          </button>
        ))}
      </div>
    </div>
  );
}

export function JourneyPage() {
  const filters = useJourneyFilters((s) => s.filters);
  const clearAll = useJourneyFilters((s) => s.clearAll);
  const setSidebarFilter = useJourneyFilters((s) => s.setSidebarFilter);
  const hasAnyFilter = Object.entries(filters).some(([key, value]) => {
    if (key === 'table_inside_kingdom') return value !== null;
    return Boolean(value);
  });
  const { filteredData } = useJourneyData();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-[22px] py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-primary-pale"
            title="مسار الرحلة"
          >
            <HiOutlineMap className="h-5 w-5 text-[#046A38]" aria-hidden />
          </span>
          <h2 className="text-base font-bold tracking-tight text-fg">مسار رحلة الحجاج</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-fg-muted">Haj Journey Map</span>
        </div>
        <div className="flex items-center gap-2.5">
          {hasAnyFilter && (
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-red-200 bg-white px-3.5 py-1.5 font-sans text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-50"
              onClick={clearAll}
            >
              مسح جميع الفلاتر
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <JourneySidebarFilters />

        <main className="scrollbar-content flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-page px-[22px] pb-7 pt-[18px]">
          <ActiveBadges />
          <div className="shrink-0">
            <JourneyFlow />
          </div>
          <div className="shrink-0">
            <PilgrimsTable
              data={filteredData}
              searchValue={filters.table_search ?? ''}
              insideFilterValue={filters.table_inside_kingdom ?? 'all'}
              onSearchChange={(value) => setSidebarFilter('table_search', value.trim() ? value : null)}
              onInsideFilterChange={(value) =>
                setSidebarFilter('table_inside_kingdom', value === 'all' ? null : value)
              }
            />
          </div>
        </main>
      </div>
    </div>
  );
}
