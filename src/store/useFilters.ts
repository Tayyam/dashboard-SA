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
  chart_gender: null,
  chart_arrival_city: null,
  chart_arrival_date: null,
  chart_departure_date: null,
  chart_arrival_hotel: null,
  chart_departure_hotel: null,
  chart_nationality: null,
  chart_package: null,
  chart_age_bucket: null,
};

interface FilterStore {
  filters: Filters;
  setSidebarFilter: (key: keyof Filters, value: string | null) => void;
  toggleChartFilter: (key: keyof Filters, value: string) => void;
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

  clearAllFilters: () => set({ filters: { ...EMPTY_FILTERS } }),
}));
