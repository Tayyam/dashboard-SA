import { useJourneyFilters } from '../store/useJourneyFilters';
import { JourneySidebarFilters } from './SidebarFilters';
import { JourneyFlow } from './JourneyFlow';
import type { JourneyFilters } from '../core/journeyFilterEngine';

const NODE_LABELS: Partial<Record<keyof JourneyFilters, string>> = {
  node_arrival_date:  'تاريخ الوصول',
  node_arrival_city:  'مدينة الوصول',
  node_arrival_hotel: 'فندق الوصول',
  node_arrival_hotel_checkout_date: 'تاريخ مغادرة فندق الوصول',
  node_departure_city: 'مدينة المغادرة',
  node_departure_city_arrival_date: 'تاريخ وصول مدينة المغادرة',
  node_departure_hotel: 'فندق المغادرة',
  node_departure_hotel_checkout_date: 'تاريخ مغادرة الفندق',
  node_departure_date: 'تاريخ المغادرة',
};

const NODE_KEYS = Object.keys(NODE_LABELS) as (keyof JourneyFilters)[];

function ActiveBadges() {
  const filters = useJourneyFilters((s) => s.filters);
  const toggle  = useJourneyFilters((s) => s.toggleNodeFilter);
  const active  = NODE_KEYS.filter((k) => filters[k]);
  return (
    <div className="journey-badges-slot">
      <div className="filter-badges journey-badges journey-badges-row">
        {active.map((k) => (
          <button
            key={k}
            className="filter-badge"
            onClick={() => toggle(k, filters[k]!)}
          >
            {NODE_LABELS[k]}: <strong>{filters[k]}</strong> x
          </button>
        ))}
      </div>
    </div>
  );
}

export function JourneyPage() {
  const filters     = useJourneyFilters((s) => s.filters);
  const clearAll    = useJourneyFilters((s) => s.clearAll);
  const hasAnyFilter = Object.values(filters).some(Boolean);

  return (
    <div className="journey-page-wrap">
      <div className="journey-page-header">
        <div className="journey-page-header-left">
          <span className="journey-page-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h12" stroke="#046A38" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <h2 className="journey-page-title">مسار رحلة الحجاج</h2>
          <span className="journey-page-sub">Haj Journey Map</span>
        </div>
        <div className="journey-page-header-right">
          {hasAnyFilter && (
            <button className="clear-all-btn journey-clear-btn" onClick={clearAll}>
              مسح جميع الفلاتر
            </button>
          )}
        </div>
      </div>

      <div className="main-layout" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <JourneySidebarFilters />

        <main className="content-area">
          <ActiveBadges />
          <JourneyFlow />
        </main>
      </div>
    </div>
  );
}
