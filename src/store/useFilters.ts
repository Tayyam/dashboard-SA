import { create } from 'zustand';
import type { Filters } from '../core/types';

const EMPTY_FILTERS: Filters = {
  from_date: null,
  to_date: null,
  year: null,
  month: null,
  day: null,
  arrival_city: null,
  departure_city: null,
  package: null,
  gender: null,
  table_search: null,
  table_inside_kingdom: null,
  chart_gender: null,
  chart_arrival_city: null,
  chart_arrival_date: null,
  chart_departure_date: null,
  chart_arrival_hotel: null,
  chart_departure_hotel: null,
  chart_third_stop: null,
  chart_nationality: null,
  chart_package: null,
  chart_package_type: null,
  chart_age_bucket: null,
  chart_contract_type: null,
  chart_visa_status: null,
  chart_holy_city: null,
  chart_holy_city_date: null,
  chart_holy_city_date_end: null,
};

interface FilterStore {
  filters: Filters;
  setSidebarFilter: (key: keyof Filters, value: string | null) => void;
  toggleChartFilter: (key: keyof Filters, value: string) => void;
  /** تبديل فلتر التواجد: مدينة + بداية النطاق + نهاية النطاق (نفس اليوم إن لم يُدمج) */
  toggleHolyCityPresenceFilter: (cityLabel: string, rangeStart: string, rangeEnd: string) => void;
  setHolyCityPresenceFilter: (
    cityLabel: string | null,
    rangeStart: string | null,
    rangeEnd: string | null,
  ) => void;
  clearHolyCityPresenceFilter: () => void;
  clearAllFilters: () => void;
}

export const useFilters = create<FilterStore>((set) => ({
  filters: { ...EMPTY_FILTERS },

  setSidebarFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  toggleChartFilter: (key, value) =>
    set((state) => {
      const current = state.filters[key];
      return {
        filters: {
          ...state.filters,
          [key]: current === value ? null : value,
        },
      };
    }),

  toggleHolyCityPresenceFilter: (cityLabel, rangeStart, rangeEnd) =>
    set((state) => {
      const same =
        state.filters.chart_holy_city === cityLabel &&
        state.filters.chart_holy_city_date === rangeStart &&
        state.filters.chart_holy_city_date_end === rangeEnd;
      return {
        filters: {
          ...state.filters,
          chart_holy_city: same ? null : cityLabel,
          chart_holy_city_date: same ? null : rangeStart,
          chart_holy_city_date_end: same ? null : rangeEnd,
        },
      };
    }),

  setHolyCityPresenceFilter: (cityLabel, rangeStart, rangeEnd) =>
    set((state) => ({
      filters: {
        ...state.filters,
        chart_holy_city: cityLabel,
        chart_holy_city_date: rangeStart,
        chart_holy_city_date_end: rangeEnd,
      },
    })),

  clearHolyCityPresenceFilter: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        chart_holy_city: null,
        chart_holy_city_date: null,
        chart_holy_city_date_end: null,
      },
    })),

  clearAllFilters: () => set({ filters: { ...EMPTY_FILTERS } }),
}));
