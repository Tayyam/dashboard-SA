import type { Pilgrim } from './types';

export interface JourneyFilters {
  // Date range sliders
  arrival_date_from: string | null;
  arrival_date_to: string | null;
  departure_date_from: string | null;
  departure_date_to: string | null;
  // Sidebar dropdowns
  dropdown_arrival_city: string | null;
  dropdown_departure_city: string | null;
  dropdown_first_stop: string | null;
  dropdown_second_stop: string | null;
  dropdown_third_stop: string | null;
  dropdown_gender: string | null;
  dropdown_nationality: string | null;
  dropdown_booking_id: string | null;
  // Journey table controls (must affect both table and chart)
  table_search: string | null;
  table_inside_kingdom: 'inside' | 'outside' | null;
  // Node cross-filters (click)
  node_package: string | null;
  node_arrival_date: string | null;
  node_arrival_city: string | null;
  node_first_stop_name: string | null;
  node_first_stop_check_out: string | null;
  node_second_stop_name: string | null;
  node_second_stop_check_out: string | null;
  node_third_stop_name: string | null;
  node_third_stop_check_out: string | null;
  node_departure_city: string | null;
  node_departure_date: string | null;
}

export const EMPTY_JOURNEY_FILTERS: JourneyFilters = {
  arrival_date_from: null,
  arrival_date_to: null,
  departure_date_from: null,
  departure_date_to: null,
  dropdown_arrival_city: null,
  dropdown_departure_city: null,
  dropdown_first_stop: null,
  dropdown_second_stop: null,
  dropdown_third_stop: null,
  dropdown_gender: null,
  dropdown_nationality: null,
  dropdown_booking_id: null,
  table_search: null,
  table_inside_kingdom: null,
  node_package: null,
  node_arrival_date: null,
  node_arrival_city: null,
  node_first_stop_name: null,
  node_first_stop_check_out: null,
  node_second_stop_name: null,
  node_second_stop_check_out: null,
  node_third_stop_name: null,
  node_third_stop_check_out: null,
  node_departure_city: null,
  node_departure_date: null,
};

export function applyJourneyFilters(data: Pilgrim[], f: JourneyFilters): Pilgrim[] {
  return data.filter((p) => {
    if (f.arrival_date_from && p.arrival_date < f.arrival_date_from) return false;
    if (f.arrival_date_to && p.arrival_date > f.arrival_date_to) return false;
    if (f.departure_date_from && p.departure_date < f.departure_date_from) return false;
    if (f.departure_date_to && p.departure_date > f.departure_date_to) return false;

    if (f.dropdown_arrival_city && p.arrival_city !== f.dropdown_arrival_city) return false;
    if (f.dropdown_departure_city && p.departure_city !== f.dropdown_departure_city) return false;
    if (f.dropdown_first_stop && p.first_stop_name !== f.dropdown_first_stop) return false;
    if (f.dropdown_second_stop && p.second_stop_name !== f.dropdown_second_stop) return false;
    if (f.dropdown_third_stop && p.third_stop_name !== f.dropdown_third_stop) return false;
    if (f.dropdown_gender && p.gender !== f.dropdown_gender) return false;
    if (f.dropdown_nationality && p.nationality !== f.dropdown_nationality) return false;
    if (f.dropdown_booking_id && p.booking_id !== f.dropdown_booking_id) return false;
    if (f.table_inside_kingdom === 'inside' && !p.inside_kingdom) return false;
    if (f.table_inside_kingdom === 'outside' && p.inside_kingdom) return false;
    if (f.table_search) {
      const q = f.table_search.trim().toLowerCase();
      if (q) {
        const searchMatch =
          String(p.id).toLowerCase().includes(q) ||
          p.group_id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.nationality.toLowerCase().includes(q) ||
          p.package.toLowerCase().includes(q) ||
          p.guide_name.toLowerCase().includes(q) ||
          p.booking_id.toLowerCase().includes(q);
        if (!searchMatch) return false;
      }
    }

    if (f.node_package && p.package !== f.node_package) return false;
    if (f.node_arrival_date && p.arrival_date !== f.node_arrival_date) return false;
    if (f.node_arrival_city && p.arrival_city !== f.node_arrival_city) return false;
    if (f.node_first_stop_name && p.first_stop_name !== f.node_first_stop_name) return false;
    if (f.node_first_stop_check_out && p.first_stop_check_out !== f.node_first_stop_check_out) return false;
    if (f.node_second_stop_name && p.second_stop_name !== f.node_second_stop_name) return false;
    if (f.node_second_stop_check_out && p.second_stop_check_out !== f.node_second_stop_check_out) return false;
    if (f.node_third_stop_name && p.third_stop_name !== f.node_third_stop_name) return false;
    if (f.node_third_stop_check_out && p.third_stop_check_out !== f.node_third_stop_check_out) return false;
    if (f.node_departure_city && p.departure_city !== f.node_departure_city) return false;
    if (f.node_departure_date && p.departure_date !== f.node_departure_date) return false;

    return true;
  });
}
