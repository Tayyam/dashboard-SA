import type { Pilgrim, Filters } from './types';

export function applyFilters(data: Pilgrim[], filters: Filters): Pilgrim[] {
  return data.filter((p) => {
    // Sidebar dropdown filters
    if (filters.from_date && p.arrival_date < filters.from_date) return false;
    if (filters.to_date && p.arrival_date > filters.to_date) return false;
    if (filters.year && new Date(p.arrival_date).getFullYear().toString() !== filters.year) return false;
    if (filters.month && (new Date(p.arrival_date).getMonth() + 1).toString() !== filters.month) return false;
    if (filters.day && new Date(p.arrival_date).getDate().toString() !== filters.day) return false;
    if (filters.arrival_city && p.arrival_city !== filters.arrival_city) return false;
    if (filters.departure_city && p.departure_city !== filters.departure_city) return false;
    if (filters.package && p.package !== filters.package) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (filters.table_inside_kingdom === 'inside' && !p.inside_kingdom) return false;
    if (filters.table_inside_kingdom === 'outside' && p.inside_kingdom) return false;
    if (filters.table_search) {
      const q = filters.table_search.trim().toLowerCase();
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

    // Chart cross-filters (AND logic)
    if (filters.chart_gender && p.gender !== filters.chart_gender) return false;
    if (filters.chart_arrival_city && p.arrival_city !== filters.chart_arrival_city) return false;
    if (filters.chart_arrival_date && p.arrival_date !== filters.chart_arrival_date) return false;
    if (filters.chart_departure_date && p.departure_date !== filters.chart_departure_date) return false;
    if (filters.chart_arrival_hotel && p.first_stop_name !== filters.chart_arrival_hotel) return false;
    if (filters.chart_departure_hotel && p.second_stop_name !== filters.chart_departure_hotel) return false;
    if (filters.chart_third_stop && p.third_stop_name !== filters.chart_third_stop) return false;
    if (filters.chart_nationality && p.nationality !== filters.chart_nationality) return false;
    if (filters.chart_package && p.package !== filters.chart_package) return false;
    if (filters.chart_age_bucket) {
      const bucket = getAgeBucket(p.age);
      if (bucket !== filters.chart_age_bucket) return false;
    }
    if (filters.chart_contract_type && p.flight_contract_type !== filters.chart_contract_type) return false;
    if (filters.chart_visa_status && p.visa_status !== filters.chart_visa_status) return false;

    return true;
  });
}

export function getAgeBucket(age: number): string {
  const low = Math.floor(age / 5) * 5;
  return `${low}-${low + 4}`;
}
