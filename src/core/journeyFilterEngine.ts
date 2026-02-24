import type { Pilgrim } from './types';

export interface JourneyFilters {
  // Date range sliders
  arrival_date_from: string | null;
  arrival_date_to: string | null;
  departure_date_from: string | null;
  departure_date_to: string | null;
  // Sidebar dropdowns
  dropdown_arrival_city: string | null;
  dropdown_arrival_hotel: string | null;
  dropdown_departure_city: string | null;
  dropdown_departure_hotel: string | null;
  dropdown_gender: string | null;
  dropdown_nationality: string | null;
  dropdown_booking_id: string | null;
  // Node cross-filters (click)
  node_arrival_date: string | null;
  node_arrival_city: string | null;
  node_arrival_hotel: string | null;
  node_arrival_hotel_checkout_date: string | null;
  node_departure_city: string | null;
  node_departure_city_arrival_date: string | null;
  node_departure_hotel: string | null;
  node_departure_hotel_checkout_date: string | null;
  node_departure_date: string | null;
}

export const EMPTY_JOURNEY_FILTERS: JourneyFilters = {
  arrival_date_from: null,
  arrival_date_to: null,
  departure_date_from: null,
  departure_date_to: null,
  dropdown_arrival_city: null,
  dropdown_arrival_hotel: null,
  dropdown_departure_city: null,
  dropdown_departure_hotel: null,
  dropdown_gender: null,
  dropdown_nationality: null,
  dropdown_booking_id: null,
  node_arrival_date: null,
  node_arrival_city: null,
  node_arrival_hotel: null,
  node_arrival_hotel_checkout_date: null,
  node_departure_city: null,
  node_departure_city_arrival_date: null,
  node_departure_hotel: null,
  node_departure_hotel_checkout_date: null,
  node_departure_date: null,
};

export function applyJourneyFilters(data: Pilgrim[], f: JourneyFilters): Pilgrim[] {
  return data.filter((p) => {
    if (f.arrival_date_from && p.arrival_date < f.arrival_date_from) return false;
    if (f.arrival_date_to   && p.arrival_date > f.arrival_date_to)   return false;
    if (f.departure_date_from && p.departure_date < f.departure_date_from) return false;
    if (f.departure_date_to   && p.departure_date > f.departure_date_to)   return false;

    if (f.dropdown_arrival_city    && p.arrival_city    !== f.dropdown_arrival_city)    return false;
    if (f.dropdown_arrival_hotel   && p.arrival_hotel   !== f.dropdown_arrival_hotel)   return false;
    if (f.dropdown_departure_city  && p.departure_city  !== f.dropdown_departure_city)  return false;
    if (f.dropdown_departure_hotel && p.departure_hotel !== f.dropdown_departure_hotel) return false;
    if (f.dropdown_gender          && p.gender          !== f.dropdown_gender)          return false;
    if (f.dropdown_nationality     && p.nationality     !== f.dropdown_nationality)     return false;
    if (f.dropdown_booking_id      && p.booking_id      !== f.dropdown_booking_id)      return false;

    if (f.node_arrival_date  && p.arrival_date  !== f.node_arrival_date)  return false;
    if (f.node_arrival_city  && p.arrival_city  !== f.node_arrival_city)  return false;
    if (f.node_arrival_hotel && p.arrival_hotel !== f.node_arrival_hotel) return false;
    if (f.node_arrival_hotel_checkout_date && p.arrival_hotel_checkout_date !== f.node_arrival_hotel_checkout_date) return false;
    if (f.node_departure_city && p.departure_city !== f.node_departure_city) return false;
    if (f.node_departure_city_arrival_date && p.departure_city_arrival_date !== f.node_departure_city_arrival_date) return false;
    if (f.node_departure_hotel && p.departure_hotel !== f.node_departure_hotel) return false;
    if (f.node_departure_hotel_checkout_date && p.departure_hotel_checkout_date !== f.node_departure_hotel_checkout_date) return false;
    if (f.node_departure_date && p.departure_date !== f.node_departure_date) return false;

    return true;
  });
}
