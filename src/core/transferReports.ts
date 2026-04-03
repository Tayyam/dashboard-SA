import type { Pilgrim } from './types';
import { formatJourneyAirportCode } from './airportDisplay';

/**
 * مدينة المطار الفعلية للمقارنة مع مدينة الوجهة/المغادرة.
 * يدعم JED/MED وأشكالاً عربية/نصية قد تُخزَّن بدل الرمز (مثل «مطار جدة»).
 */
export function airportToCityCanon(airportRaw: string): 'jeddah' | 'madinah' | '' {
  const raw = airportRaw.trim();
  if (!raw) return '';
  const u = raw.toUpperCase();
  const t = raw.toLowerCase();

  if (/\bJED\b/.test(u) || u === 'JED') return 'jeddah';
  if (/\bMED\b/.test(u) || u === 'MED') return 'madinah';

  if (t.includes('مطار جدة') || (t.includes('مطار') && (t.includes('جدة') || t.includes('جده')))) return 'jeddah';
  if (
    t.includes('مطار المدينة') ||
    (t.includes('مطار') && (t.includes('المدينة') || t.includes('المدينه')))
  )
    return 'madinah';

  if (t.includes('king abdulaziz') || t.includes('kaia')) return 'jeddah';
  if (t.includes('prince mohammad bin abdulaziz') || t.includes('محمد بن عبدالعزيز')) return 'madinah';

  if (t.includes('jeddah') || /\bjed\b/.test(t)) return 'jeddah';
  if (t.includes('madinah') || t.includes('medina') || /\bmed\b/.test(t)) return 'madinah';

  return '';
}

/** من اسم/وصف توقف أو موقع: مكة (منى، المزدلفة، عرفات، الحج…) ثم مدن الحرمين */
function textToCityCanonForTransfer(text: string): 'jeddah' | 'makkah' | 'madinah' | 'other' | '' {
  const t = text.trim().toLowerCase();
  if (!t) return '';
  if (
    /\bmina\b|minaa|منى|muzdalif|مزدلف|arafat|عرفات|\bhajj\b|\/\s*hajj|المناسك/.test(t)
  ) {
    return 'makkah';
  }
  return pilgrimCityCanon(text);
}

/** تطبيع مدينة الوصول/المغادرة من النص أو الرمز */
export function pilgrimCityCanon(cityRaw: string): 'jeddah' | 'makkah' | 'madinah' | 'other' | '' {
  const t = cityRaw.trim().toLowerCase();
  if (!t) return '';
  if (t === 'jed' || t.includes('jeddah') || t.includes('جدة') || t.includes('جده')) return 'jeddah';
  if (
    t === 'med' ||
    t.includes('madinah') ||
    t.includes('medina') ||
    t.includes('المدينة') ||
    t.includes('المدينه')
  )
    return 'madinah';
  if (t.includes('makkah') || t.includes('mecca') || t.includes('مكة') || t.includes('مكه')) return 'makkah';
  return 'other';
}

/** مكان التوقف الأول فقط — مطابق لعمود «مكان نقطة التوقف الأولى» في تقرير الوصول */
export function arrivalFirstStopLocationCanon(p: Pilgrim): 'jeddah' | 'makkah' | 'madinah' | 'other' | '' {
  return textToCityCanonForTransfer(p.first_stop_location || '');
}

/** تفصيل حالة الوصول لتوزيع التقارير (مطار × مكان التوقف الأول). */
export type ArrivalFlowBucket =
  | 'normal'
  | 'transfer_to_madinah'
  | 'transfer_to_makkah'
  | 'transfer_other'
  | 'unknown';

export function pilgrimArrivalFlowBucket(p: Pilgrim): ArrivalFlowBucket {
  if (!p.arrival_airport?.trim()) return 'unknown';
  const ap = airportToCityCanon(p.arrival_airport);
  if (!ap) return 'unknown';
  const loc = arrivalFirstStopLocationCanon(p);
  const st = matchAirportToGroundLocation(ap, loc);
  if (st === 'unknown') return 'unknown';
  if (st === 'normal') return 'normal';
  if (ap === 'jeddah' && loc === 'madinah') return 'transfer_to_madinah';
  if (ap === 'madinah' && loc === 'makkah') return 'transfer_to_makkah';
  return 'transfer_other';
}

/** نص موقع آخر توقف قبل المغادرة (ثالث ← ثاني ← فندق المغادرة ← أول ← آخر خروج) */
function lastStopLocationRaw(p: Pilgrim): string {
  return (
    p.third_stop_location?.trim() ||
    p.second_stop_location?.trim() ||
    p.departure_hotel_location?.trim() ||
    p.first_stop_location?.trim() ||
    p.last_exit_place?.trim() ||
    ''
  );
}

function lastStopLocationBeforeDepartureCanon(p: Pilgrim): 'jeddah' | 'makkah' | 'madinah' | 'other' | '' {
  return textToCityCanonForTransfer(lastStopLocationRaw(p));
}

/** عرض عمود الموقع في تقرير المغادرة (نفس منطق الحالة) */
export function lastStopLocationDisplay(p: Pilgrim): string {
  const t = lastStopLocationRaw(p);
  return t || '—';
}

/**
 * طبيعي: مطار المدينة + مكان المدينة، أو مطار جدة + مكة (أو جدة).
 * يحتاج نقل: مطار المدينة + مكة، أو مطار جدة + المدينة، أو مطار المدينة + جدة.
 */
function matchAirportToGroundLocation(
  ap: 'jeddah' | 'madinah',
  loc: 'jeddah' | 'makkah' | 'madinah' | 'other' | '',
): TransferStatus {
  if (!loc || loc === 'other') return 'unknown';
  if (ap === 'madinah' && loc === 'madinah') return 'normal';
  if (ap === 'jeddah' && loc === 'makkah') return 'normal';
  if (ap === 'jeddah' && loc === 'jeddah') return 'normal';
  if (ap === 'madinah' && loc === 'makkah') return 'needs_transfer';
  if (ap === 'jeddah' && loc === 'madinah') return 'needs_transfer';
  if (ap === 'madinah' && loc === 'jeddah') return 'needs_transfer';
  return 'unknown';
}

export type TransferStatus = 'normal' | 'needs_transfer' | 'unknown';

/** وصول: مطار الوصول × مكان نقطة التوقف الأولى فقط (حسب الجدول المرجعي). */
export function pilgrimArrivalTransferStatus(p: Pilgrim): TransferStatus {
  if (!p.arrival_airport?.trim()) return 'unknown';
  const ap = airportToCityCanon(p.arrival_airport);
  if (!ap) return 'unknown';
  const loc = arrivalFirstStopLocationCanon(p);
  return matchAirportToGroundLocation(ap, loc);
}

/** مغادرة: مكان آخر نقطة توقف × مطار المغادرة (حسب الجدول المرجعي). */
export function pilgrimDepartureTransferStatus(p: Pilgrim): TransferStatus {
  if (!p.departure_airport?.trim()) return 'unknown';
  const ap = airportToCityCanon(p.departure_airport);
  if (!ap) return 'unknown';
  const loc = lastStopLocationBeforeDepartureCanon(p);
  return matchAirportToGroundLocation(ap, loc);
}

export function formatTransferStatus(s: TransferStatus): string {
  if (s === 'normal') return 'طبيعي';
  if (s === 'needs_transfer') return 'يحتاج إلى نقل';
  return '—';
}

export function displayAirport(raw: string): string {
  const t = raw.trim();
  if (!t) return '—';
  return formatJourneyAirportCode(t);
}

/** تسمية نقطة التوقف قبل المغادرة (آخر توقف ذي معنى) */
export function departureStopLabel(p: Pilgrim): string {
  return (
    p.third_stop_name?.trim() ||
    p.second_stop_name?.trim() ||
    p.departure_hotel?.trim() ||
    p.first_stop_name?.trim() ||
    p.last_exit_place?.trim() ||
    '—'
  );
}

export interface ReportGroupRow {
  sortDate: string;
  dateLabel: string;
  airportLabel: string;
  stopLabel: string;
  /** وصول: مكان التوقف الأول. مغادرة: مكان آخر نقطة توقف (للحالة والعرض). */
  firstStopLocationLabel: string;
  /** وصول: رقم رحلة الوصول. مغادرة: رقم رحلة المغادرة أو احتياطي وصول. */
  flightNumberLabel: string;
  /** وقت الوصول (مجمّع من الحجاج في الصف) */
  arrivalTimeLabel: string;
  pilgrims: Pilgrim[];
  normalCount: number;
  transferCount: number;
  unknownCount: number;
}

function aggregateFlightField(list: Pilgrim[], get: (p: Pilgrim) => string): string {
  const vals = list
    .map((p) => get(p)?.trim())
    .filter((s) => s && s !== '-');
  if (vals.length === 0) return '—';
  const uniq = [...new Set(vals)];
  if (uniq.length === 1) return uniq[0];
  return `${uniq.length.toLocaleString('en-US')} قيم`;
}

function statusSummary(normal: number, transfer: number, unknown: number): string {
  const parts: string[] = [];
  if (normal) parts.push(`${normal} طبيعي`);
  if (transfer) parts.push(`${transfer} يحتاج نقل`);
  if (unknown) parts.push(`${unknown} غير محدد`);
  return parts.length ? parts.join('، ') : '—';
}

function firstStopLocationDisplay(p: Pilgrim): string {
  const t = p.first_stop_location?.trim();
  return t || '—';
}

export function buildArrivalReportRows(pilgrims: Pilgrim[]): ReportGroupRow[] {
  const map = new Map<string, Pilgrim[]>();
  for (const p of pilgrims) {
    const d = p.arrival_date?.trim();
    if (!d) continue;
    const airport = displayAirport(p.arrival_airport);
    const stop = p.first_stop_name?.trim() || '—';
    const loc = firstStopLocationDisplay(p);
    const key = `${d}\n${airport}\n${stop}\n${loc}`;
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return finalizeGroups(map);
}

export function buildDepartureReportRows(pilgrims: Pilgrim[]): ReportGroupRow[] {
  const map = new Map<string, Pilgrim[]>();
  for (const p of pilgrims) {
    const d = p.departure_date?.trim();
    if (!d) continue;
    const airport = displayAirport(p.departure_airport);
    const stop = departureStopLabel(p);
    const loc = lastStopLocationDisplay(p);
    const key = `${d}\n${airport}\n${stop}\n${loc}`;
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return finalizeGroups(map, 'departure');
}

function finalizeGroups(map: Map<string, Pilgrim[]>, mode: 'arrival' | 'departure' = 'arrival'): ReportGroupRow[] {
  const rows: ReportGroupRow[] = [];
  for (const [, list] of map) {
    if (!list.length) continue;
    const first = list[0];
    const sortDate = mode === 'arrival' ? first.arrival_date : first.departure_date;
    const dateLabel = formatDateAr(sortDate);
    const airportLabel = mode === 'arrival' ? displayAirport(first.arrival_airport) : displayAirport(first.departure_airport);
    const stopLabel = mode === 'arrival' ? first.first_stop_name?.trim() || '—' : departureStopLabel(first);
    const firstStopLocationLabel =
      mode === 'arrival' ? firstStopLocationDisplay(first) : lastStopLocationDisplay(first);

    let normalCount = 0;
    let transferCount = 0;
    let unknownCount = 0;
    for (const p of list) {
      const st = mode === 'arrival' ? pilgrimArrivalTransferStatus(p) : pilgrimDepartureTransferStatus(p);
      if (st === 'normal') normalCount++;
      else if (st === 'needs_transfer') transferCount++;
      else unknownCount++;
    }

    const flightNumberLabel =
      mode === 'arrival'
        ? aggregateFlightField(list, (p) => p.arrival_flight_number)
        : aggregateFlightField(list, (p) => p.departure_flight_number || p.arrival_flight_number);
    const arrivalTimeLabel = aggregateFlightField(list, (p) => p.arrival_time);

    rows.push({
      sortDate,
      dateLabel,
      airportLabel,
      stopLabel,
      firstStopLocationLabel,
      flightNumberLabel,
      arrivalTimeLabel,
      pilgrims: list,
      normalCount,
      transferCount,
      unknownCount,
    });
  }
  rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  return rows;
}

function formatDateAr(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export interface TransferCaseRow {
  kind: 'arrival' | 'departure';
  sortDate: string;
  dateLabel: string;
  airportLabel: string;
  destinationCity: string;
  stopLabel: string;
  firstStopLocationLabel: string;
  count: number;
  pilgrims: Pilgrim[];
}

/** جدول حالات النقل فقط (وصول أو مغادرة تحتاج نقل)، مجمّع بنفس مفاتيح التقرير */
export function buildTransferCasesReport(pilgrims: Pilgrim[]): TransferCaseRow[] {
  const cases: TransferCaseRow[] = [];

  const arrMap = new Map<string, Pilgrim[]>();
  for (const p of pilgrims) {
    if (pilgrimArrivalTransferStatus(p) !== 'needs_transfer') continue;
    const d = p.arrival_date?.trim();
    if (!d) continue;
    const airport = displayAirport(p.arrival_airport);
    const stop = p.first_stop_name?.trim() || '—';
    const loc = firstStopLocationDisplay(p);
    const key = `a:${d}|${airport}|${stop}|${loc}`;
    const list = arrMap.get(key) ?? [];
    list.push(p);
    arrMap.set(key, list);
  }
  for (const [, list] of arrMap) {
    const p0 = list[0];
    cases.push({
      kind: 'arrival',
      sortDate: p0.arrival_date,
      dateLabel: formatDateAr(p0.arrival_date),
      airportLabel: displayAirport(p0.arrival_airport),
      destinationCity: p0.arrival_city?.trim() || '—',
      stopLabel: p0.first_stop_name?.trim() || '—',
      firstStopLocationLabel: firstStopLocationDisplay(p0),
      count: list.length,
      pilgrims: list,
    });
  }

  const depMap = new Map<string, Pilgrim[]>();
  for (const p of pilgrims) {
    if (pilgrimDepartureTransferStatus(p) !== 'needs_transfer') continue;
    const d = p.departure_date?.trim();
    if (!d) continue;
    const airport = displayAirport(p.departure_airport);
    const stop = departureStopLabel(p);
    const loc = lastStopLocationDisplay(p);
    const key = `d:${d}|${airport}|${stop}|${loc}`;
    const list = depMap.get(key) ?? [];
    list.push(p);
    depMap.set(key, list);
  }
  for (const [, list] of depMap) {
    const p0 = list[0];
    cases.push({
      kind: 'departure',
      sortDate: p0.departure_date,
      dateLabel: formatDateAr(p0.departure_date),
      airportLabel: displayAirport(p0.departure_airport),
      destinationCity: p0.departure_city?.trim() || '—',
      stopLabel: departureStopLabel(p0),
      firstStopLocationLabel: lastStopLocationDisplay(p0),
      count: list.length,
      pilgrims: list,
    });
  }

  cases.sort((a, b) => {
    const c = a.sortDate.localeCompare(b.sortDate);
    if (c !== 0) return c;
    return a.kind.localeCompare(b.kind);
  });
  return cases;
}

export function rowStatusLabel(r: ReportGroupRow): string {
  return statusSummary(r.normalCount, r.transferCount, r.unknownCount);
}

/** عرض مختصر لعمود الحالة */
export function rowStatusDisplay(r: ReportGroupRow): string {
  if (r.transferCount === 0 && r.normalCount === 0 && r.unknownCount > 0) {
    return r.unknownCount === 1 ? 'غير محدد' : `${r.unknownCount.toLocaleString('en-US')} غير محدد`;
  }
  if (r.transferCount === 0 && r.unknownCount === 0) return 'طبيعي';
  if (r.normalCount === 0 && r.unknownCount === 0) return 'يحتاج إلى نقل';
  return rowStatusLabel(r);
}
