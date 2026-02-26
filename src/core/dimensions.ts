export const DIMENSIONS = {
  GENDER: 'gender',
  ARRIVAL_CITY: 'arrival_city',
  ARRIVAL_DATE: 'arrival_date',
  DEPARTURE_DATE: 'departure_date',
  ARRIVAL_HOTEL: 'arrival_hotel',
  DEPARTURE_HOTEL: 'departure_hotel',
  NATIONALITY: 'nationality',
  PACKAGE: 'package',
  AGE_BUCKET: 'age_bucket',
  MAKKAH_ROOM_TYPE: 'makkah_room_type',
  MADINAH_ROOM_TYPE: 'madinah_room_type',
  FLIGHT_CONTRACT_TYPE: 'flight_contract_type',
} as const;

export type DimensionKey = keyof typeof DIMENSIONS;
