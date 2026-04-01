import type { Pilgrim } from './types';

export function toText(val: unknown): string {
  return val == null ? '' : String(val).trim();
}

/** YYYY-MM-DD for charts and filters; accepts ISO strings, Excel serials, M/D/YYYY */
export function toPilgrimDate(val: unknown): string {
  if (val == null || val === '') return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  if (typeof val === 'number' && Number.isFinite(val)) {
    const ms = Math.round((val - 25569) * 86400_000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const month = m[1].padStart(2, '0');
    const day = m[2].padStart(2, '0');
    return `${m[3]}-${month}-${day}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s.slice(0, 10);
}

/** For SQL insert (null when empty) */
export function toDbDate(val: unknown): string | null {
  const d = toPilgrimDate(val);
  return d || null;
}

function pickStr(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    if (!(k in row)) continue;
    const t = toText(row[k]);
    if (t) return t;
  }
  return '';
}

function toNum(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeGender(raw: string): 'Male' | 'Female' {
  const g = raw.toLowerCase();
  if (g === 'male' || g === 'm' || g === 'ذكر') return 'Male';
  return 'Female';
}

function normalizeContract(raw: string): 'B2B' | 'GDS' {
  return raw.toUpperCase() === 'B2B' ? 'B2B' : 'GDS';
}

function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const t = toText(val).toLowerCase();
  return t === 'true' || t === '1' || t === 'yes' || t === 'نعم';
}

function roomType(raw: string): 'triple' | 'double' | 'quad' {
  const t = raw.toLowerCase();
  if (t === 'double' || t === 'quad') return t;
  return 'triple';
}

export function pilgrimFromRow(row: Record<string, unknown>, index: number): Pilgrim {
  const groupIdRaw =
    row.group_id ?? row.groupId ?? row.groupid ?? row['group id'] ?? '';

  const first_stop_name =
    pickStr(row, ['first_stop_name']) ||
    pickStr(row, ['packages.first_hotel_name']) ||
    toText(row.arrival_hotel);

  const second_stop_name =
    pickStr(row, ['second_stop_name']) ||
    pickStr(row, ['last_hotel_name']) ||
    toText(row.departure_hotel);

  const third_stop_name = pickStr(row, ['third_stop_name']);

  const first_stop_location =
    pickStr(row, ['first_stop_location']) ||
    pickStr(row, ['packages.first_hotel_location']) ||
    toText(row.arrival_hotel_location);

  const second_stop_location =
    pickStr(row, ['second_stop_location']) ||
    pickStr(row, ['packages.second_hotel_location']) ||
    toText(row.departure_hotel_location);

  const third_stop_location = pickStr(row, ['third_stop_location']);

  const first_stop_check_in =
    toPilgrimDate(row.first_stop_check_in) ||
    toPilgrimDate(row.arrival_date) ||
    toPilgrimDate(row.Dep_Arr_Date);

  const first_stop_check_out =
    toPilgrimDate(row.first_stop_check_out) || toPilgrimDate(row.arrival_hotel_checkout_date);

  const second_stop_check_in =
    toPilgrimDate(row.second_stop_check_in) || toPilgrimDate(row.departure_city_arrival_date);

  let second_stop_check_out = toPilgrimDate(row.second_stop_check_out);
  let third_stop_check_in = toPilgrimDate(row.third_stop_check_in);
  let third_stop_check_out = toPilgrimDate(row.third_stop_check_out);

  if (!third_stop_name) {
    if (!second_stop_check_out) second_stop_check_out = toPilgrimDate(row.departure_hotel_checkout_date);
  } else {
    if (!third_stop_check_out) third_stop_check_out = toPilgrimDate(row.departure_hotel_checkout_date);
  }

  const arrival_date =
    toPilgrimDate(row.arrival_date) || toPilgrimDate(row.Dep_Arr_Date) || first_stop_check_in;

  const departure_date =
    toPilgrimDate(row.departure_date) ||
    toPilgrimDate(row.Ret_Date) ||
    third_stop_check_out ||
    second_stop_check_out ||
    first_stop_check_out;

  const contractRaw = toText(row.flight_contract_type ?? row.Flight_contract_type).toUpperCase();

  const idSource =
    toText(row.nusuk_id) || toText(row.Booking_ID) || toText(row.booking_id) || '';

  const idNum = Number(String(idSource).trim());
  const id = Number.isFinite(idNum) && idNum > 0 ? idNum : toNum(row.id) || index + 1;

  return {
    id,
    group_id: toText(groupIdRaw),
    booking_id: idSource || toText(row.booking_id) || `SV-${index + 1}`,
    gender: normalizeGender(toText(row.gender)),
    name: toText(row.name),
    birth_date: toPilgrimDate(row.birth_date) || toText(row.birth_date),
    age: toNum(row.age ?? row.Age),
    guide_name: toText(row.guide_name),
    residence_country: toText(row.residence_country),
    nationality: toText(row.nationality),
    package_id: pickStr(row, ['package_type', 'package_id']),
    package: pickStr(row, ['package_name', 'package']),
    arrival_city: pickStr(row, ['arrival_city', 'Dep_Destination']),
    departure_city: pickStr(row, ['departure_city', 'Ret_Origin']),
    arrival_hotel: first_stop_name,
    arrival_hotel_location: first_stop_location,
    departure_hotel: second_stop_name,
    departure_hotel_location: second_stop_location,
    arrival_date,
    arrival_hotel_checkout_date: first_stop_check_out,
    departure_city_arrival_date: second_stop_check_in,
    departure_hotel_checkout_date: third_stop_name ? third_stop_check_out : second_stop_check_out,
    departure_date,
    visa_status: toText(row.visa_status),
    inside_kingdom: toBool(row.inside_kingdom),
    makkah_room_type: roomType(toText(row.makkah_room_type)),
    madinah_room_type: roomType(toText(row.madinah_room_type)),
    flight_contract_type: normalizeContract(contractRaw),
    first_stop_name,
    first_stop_location,
    first_stop_check_in,
    first_stop_check_out,
    second_stop_name,
    second_stop_location,
    second_stop_check_in,
    second_stop_check_out,
    third_stop_name,
    third_stop_location,
    third_stop_check_in,
    third_stop_check_out,
    first_entry_place: pickStr(row, ['first_entry_place', 'أول مكان دخول']),
    arrival_airport: pickStr(row, ['arrival_airport', 'مطار الوصول']),
    last_exit_place: pickStr(row, ['last_exit_place', 'آخر مكان خروج']),
    departure_airport: pickStr(row, ['departure_airport', 'مطار المغادرة']),
  };
}

/** Row shape for `pilgrims` insert (Postgres date columns as string | null) */
export function pilgrimToDbInsert(p: Pilgrim): Record<string, unknown> {
  const d = (s: string) => toDbDate(s);
  return {
    id: p.id,
    group_id: p.group_id || null,
    booking_id: p.booking_id,
    gender: p.gender,
    name: p.name,
    birth_date: d(p.birth_date),
    age: p.age,
    guide_name: p.guide_name || null,
    residence_country: p.residence_country || null,
    nationality: p.nationality || null,
    package_id: p.package_id || null,
    package: p.package || null,
    arrival_city: p.arrival_city || null,
    departure_city: p.departure_city || null,
    arrival_hotel: p.arrival_hotel || null,
    arrival_hotel_location: p.arrival_hotel_location || null,
    departure_hotel: p.departure_hotel || null,
    departure_hotel_location: p.departure_hotel_location || null,
    arrival_date: d(p.arrival_date),
    arrival_hotel_checkout_date: d(p.arrival_hotel_checkout_date),
    departure_city_arrival_date: d(p.departure_city_arrival_date),
    departure_hotel_checkout_date: d(p.departure_hotel_checkout_date),
    departure_date: d(p.departure_date),
    visa_status: p.visa_status || null,
    inside_kingdom: p.inside_kingdom,
    makkah_room_type: p.makkah_room_type,
    madinah_room_type: p.madinah_room_type,
    flight_contract_type: p.flight_contract_type,
    first_stop_name: p.first_stop_name || null,
    first_stop_location: p.first_stop_location || null,
    first_stop_check_in: d(p.first_stop_check_in),
    first_stop_check_out: d(p.first_stop_check_out),
    second_stop_name: p.second_stop_name || null,
    second_stop_location: p.second_stop_location || null,
    second_stop_check_in: d(p.second_stop_check_in),
    second_stop_check_out: d(p.second_stop_check_out),
    third_stop_name: p.third_stop_name || null,
    third_stop_location: p.third_stop_location || null,
    third_stop_check_in: d(p.third_stop_check_in),
    third_stop_check_out: d(p.third_stop_check_out),
    first_entry_place: p.first_entry_place || null,
    arrival_airport: p.arrival_airport || null,
    last_exit_place: p.last_exit_place || null,
    departure_airport: p.departure_airport || null,
  };
}
