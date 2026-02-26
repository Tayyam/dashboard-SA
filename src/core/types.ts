export interface Pilgrim {
  id: number;
  booking_id: string;
  gender: 'Male' | 'Female';
  nationality: string;
  package: string;
  arrival_city: string;
  departure_city: string;
  arrival_hotel: string;
  departure_hotel: string;
  age: number;
  arrival_date: string;                  // YYYY-MM-DD
  arrival_hotel_checkout_date: string;   // YYYY-MM-DD
  departure_city_arrival_date: string;   // YYYY-MM-DD
  departure_hotel_checkout_date: string; // YYYY-MM-DD
  departure_date: string;                // YYYY-MM-DD
  makkah_room_type: 'triple' | 'double' | 'quad';
  madinah_room_type: 'triple' | 'double' | 'quad';
  flight_contract_type: 'B2B' | 'GDS';
}

export interface Filters {
  from_date: string | null;
  to_date: string | null;
  year: string | null;
  month: string | null;
  day: string | null;
  arrival_city: string | null;
  departure_city: string | null;
  package: string | null;
  gender: string | null;
  // Chart cross-filter selections
  chart_gender: string | null;
  chart_arrival_city: string | null;
  chart_arrival_date: string | null;
  chart_departure_date: string | null;
  chart_arrival_hotel: string | null;
  chart_departure_hotel: string | null;
  chart_nationality: string | null;
  chart_package: string | null;
  chart_age_bucket: string | null;
  chart_contract_type: string | null;
}

export type GroupedData = Record<string, Pilgrim[]>;

export interface ChartDataPoint {
  label: string;
  value: number;
  isSelected: boolean;
}
