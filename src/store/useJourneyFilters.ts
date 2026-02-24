import { create } from 'zustand';
import {
  type JourneyFilters,
  EMPTY_JOURNEY_FILTERS,
} from '../core/journeyFilterEngine';

interface JourneyFilterStore {
  filters: JourneyFilters;
  setSidebarFilter: (key: keyof JourneyFilters, value: string | null) => void;
  toggleNodeFilter: (key: keyof JourneyFilters, value: string) => void;
  clearAll: () => void;
}

export const useJourneyFilters = create<JourneyFilterStore>((set) => ({
  filters: { ...EMPTY_JOURNEY_FILTERS },

  setSidebarFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  toggleNodeFilter: (key, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [key]: s.filters[key] === value ? null : value,
      },
    })),

  clearAll: () => set({ filters: { ...EMPTY_JOURNEY_FILTERS } }),
}));
