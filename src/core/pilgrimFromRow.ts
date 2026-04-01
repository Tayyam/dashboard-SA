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

/** Placeholder when Excel/DB expects NOT NULL but القيمة ناقصة — يفضّل تصحيح الملف لاحقاً */
const DATE_FALLBACK = '1900-01-01';

/** تاريخ صالح لـ Postgres أو قيمة احتياطية (يتجنّب 23502 NOT NULL) */
function coerceDbDate(primary: string, ...alternates: string[]): string {
  for (const s of [primary, ...alternates]) {
    const v = toDbDate(s);
    if (v) return v;
  }
  return DATE_FALLBACK;
}

function emptyToNull(s: string): string | null {
  const t = s?.trim();
  return t ? t : null;
}

/** قيمة نصية لأعمدة NOT NULL — تجنّب الفراغ في القاعدة */
function nonEmptyText(primary: string, ...alternates: string[]): string {
  for (const s of [primary, ...alternates]) {
    const t = s?.trim();
    if (t) return t;
  }
  return '-';
}

/**
 * صف الإدراج: لا نرسل `null` لحقول قد تكون NOT NULL في قاعدتك — نستخدم سلاسل/تواريخ احتياطية.
 * حقول اختيارية حقاً تُحذف لاحقاً بـ stripNullInsertFields إن رغبت.
 */
export function pilgrimToDbInsert(p: Pilgrim): Record<string, unknown> {
  const arrival = coerceDbDate(p.arrival_date, p.first_stop_check_in);
  const departure = coerceDbDate(p.departure_date, p.third_stop_check_out, p.second_stop_check_out, arrival);

  return {
    id: p.id,
    group_id: p.group_id?.trim() || '-',
    booking_id: p.booking_id?.trim() || String(p.id),
    gender: p.gender,
    name: p.name?.trim() || '(بدون اسم)',
    birth_date: coerceDbDate(p.birth_date),
    age: p.age,
    guide_name: emptyToNull(p.guide_name),
    residence_country: emptyToNull(p.residence_country),
    nationality: emptyToNull(p.nationality),
    package_id: p.package_id?.trim() || '-',
    package: p.package?.trim() || '-',
    arrival_city: nonEmptyText(p.arrival_city, p.first_entry_place, p.arrival_airport),
    departure_city: nonEmptyText(p.departure_city, p.last_exit_place, p.departure_airport),
    arrival_hotel: emptyToNull(p.arrival_hotel),
    arrival_hotel_location: emptyToNull(p.arrival_hotel_location),
    departure_hotel: emptyToNull(p.departure_hotel),
    departure_hotel_location: emptyToNull(p.departure_hotel_location),
    arrival_date: arrival,
    arrival_hotel_checkout_date: coerceDbDate(p.arrival_hotel_checkout_date, p.first_stop_check_out, arrival),
    departure_city_arrival_date: coerceDbDate(p.departure_city_arrival_date, p.second_stop_check_in, arrival),
    departure_hotel_checkout_date: coerceDbDate(
      p.departure_hotel_checkout_date,
      p.third_stop_check_out,
      p.second_stop_check_out,
      departure
    ),
    departure_date: departure,
    visa_status: p.visa_status?.trim() || '-',
    inside_kingdom: p.inside_kingdom,
    makkah_room_type: p.makkah_room_type,
    madinah_room_type: p.madinah_room_type,
    flight_contract_type: p.flight_contract_type,
    first_stop_name: emptyToNull(p.first_stop_name),
    first_stop_location: emptyToNull(p.first_stop_location),
    first_stop_check_in: coerceDbDate(p.first_stop_check_in, arrival),
    first_stop_check_out: coerceDbDate(p.first_stop_check_out, p.arrival_hotel_checkout_date, arrival),
    second_stop_name: emptyToNull(p.second_stop_name),
    second_stop_location: emptyToNull(p.second_stop_location),
    second_stop_check_in: coerceDbDate(p.second_stop_check_in, p.departure_city_arrival_date, arrival),
    second_stop_check_out: coerceDbDate(p.second_stop_check_out, p.departure_hotel_checkout_date, departure),
    third_stop_name: emptyToNull(p.third_stop_name),
    third_stop_location: emptyToNull(p.third_stop_location),
    third_stop_check_in: coerceDbDate(p.third_stop_check_in, p.second_stop_check_out, arrival),
    third_stop_check_out: coerceDbDate(p.third_stop_check_out, p.departure_hotel_checkout_date, departure),
    first_entry_place: emptyToNull(p.first_entry_place),
    arrival_airport: emptyToNull(p.arrival_airport),
    last_exit_place: emptyToNull(p.last_exit_place),
    departure_airport: emptyToNull(p.departure_airport),
  };
}

/** إزالة المفاتيح ذات القيمة null حتى يستخدم Postgres DEFAULT حيث وُجد */
export function stripNullInsertFields(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}
