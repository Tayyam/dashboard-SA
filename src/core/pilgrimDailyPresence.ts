import type { Pilgrim } from './types';
import {
  pilgrimLocationBlob,
  textImpliesMadinahRegion,
  textImpliesMakkahRegion,
} from './holyCityPresence';

export function normalizeIsoDate(s: string | null | undefined): string | null {
  const t = (s ?? '').trim().slice(0, 10);
  if (!t || t.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

/** عرض مختصر dd/mm من YYYY-MM-DD */
export function formatIsoDateDdMm(iso: string): string {
  const t = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return iso;
  const [, month, day] = t.split('-');
  return `${day}/${month}`;
}

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayBeforeIso(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return toYmdLocal(d);
}

export function nextCalendarDayIso(iso: string): string {
  const d = new Date(`${iso.trim().slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return toYmdLocal(d);
}

/** مجموعة أيام متتالية بنفس أعداد التواجد (مكة / المدينة) */
export interface PresenceDayBucket {
  start: string;
  end: string;
  makkah: number;
  madinah: number;
}

function presenceCountsForDay(pilgrims: Pilgrim[], iso: string): { makkah: number; madinah: number } {
  let makkah = 0;
  let madinah = 0;
  for (const p of pilgrims) {
    const x = pilgrimPresenceOnCalendarDate(p, iso);
    if (x.makkah) makkah += 1;
    if (x.madinah) madinah += 1;
  }
  return { makkah, madinah };
}

/**
 * يدمج الأيام المتتالية على التقويم عندما تتطابق أعداد «في مكة» و«في المدينة» بالكامل.
 */
export function mergePresenceDaysWithSameCounts(
  sortedDates: string[],
  pilgrims: Pilgrim[],
): PresenceDayBucket[] {
  if (sortedDates.length === 0) return [];

  const rows = sortedDates.map((iso) => {
    const c = presenceCountsForDay(pilgrims, iso);
    return { iso, makkah: c.makkah, madinah: c.madinah };
  });

  const buckets: PresenceDayBucket[] = [];
  let runMakkah = rows[0].makkah;
  let runMadinah = rows[0].madinah;
  let runStart = rows[0].iso;
  let runEnd = rows[0].iso;

  for (let i = 1; i < rows.length; i++) {
    const cur = rows[i];
    const prevIso = rows[i - 1].iso;
    const contiguous = cur.iso === nextCalendarDayIso(prevIso);
    const sameCounts = cur.makkah === runMakkah && cur.madinah === runMadinah;
    if (contiguous && sameCounts) {
      runEnd = cur.iso;
    } else {
      buckets.push({ start: runStart, end: runEnd, makkah: runMakkah, madinah: runMadinah });
      runMakkah = cur.makkah;
      runMadinah = cur.madinah;
      runStart = cur.iso;
      runEnd = cur.iso;
    }
  }
  buckets.push({ start: runStart, end: runEnd, makkah: runMakkah, madinah: runMadinah });
  return buckets;
}

/** تسمية dd/mm أو dd/mm → dd/mm */
export function formatPresenceBucketDdMm(b: { start: string; end: string }): string {
  if (b.start === b.end) return formatIsoDateDdMm(b.start);
  return `${formatIsoDateDdMm(b.start)} → ${formatIsoDateDdMm(b.end)}`;
}

function stopSegmentBlob(p: Pilgrim, index: 0 | 1 | 2): string {
  const locs = [p.first_stop_location, p.second_stop_location, p.third_stop_location] as const;
  const names = [p.first_stop_name, p.second_stop_name, p.third_stop_name] as const;
  return [names[index], locs[index]].map((x) => (x ?? '').toString().trim()).filter(Boolean).join(' ');
}

/**
 * فترات إقامة من تواريخ دخول/خروج التوقف 1–3.
 * إن وُجد دخول بلا خروج: حتى يوم قبل دخول التوقف التالي، أو تاريخ المغادرة.
 */
export function getStayIntervals(p: Pilgrim): { start: string; end: string; blob: string }[] {
  const starts = [
    normalizeIsoDate(p.first_stop_check_in),
    normalizeIsoDate(p.second_stop_check_in),
    normalizeIsoDate(p.third_stop_check_in),
  ];
  const outs = [
    normalizeIsoDate(p.first_stop_check_out),
    normalizeIsoDate(p.second_stop_check_out),
    normalizeIsoDate(p.third_stop_check_out),
  ];
  const blobs: [string, string, string] = [stopSegmentBlob(p, 0), stopSegmentBlob(p, 1), stopSegmentBlob(p, 2)];
  const result: { start: string; end: string; blob: string }[] = [];

  for (let i = 0; i < 3; i++) {
    const start = starts[i];
    if (!start) continue;
    let end = outs[i];
    if (!end) {
      let nextIn: string | null = null;
      for (let j = i + 1; j < 3; j++) {
        if (starts[j]) {
          nextIn = starts[j];
          break;
        }
      }
      end = nextIn ? dayBeforeIso(nextIn) : (normalizeIsoDate(p.departure_date) ?? start);
    }
    if (end < start) end = start;
    result.push({ start, end, blob: blobs[i] });
  }
  return result;
}

/** هل يوم isoDate (YYYY-MM-DD) يقع ضمن فترة الإقامة في مكة و/أو المدينة حسب التوقفات، مع احتياط من بيانات المسار الكاملة */
export function pilgrimPresenceOnCalendarDate(
  p: Pilgrim,
  isoDate: string,
): { makkah: boolean; madinah: boolean } {
  let makkah = false;
  let madinah = false;

  for (const { start, end, blob } of getStayIntervals(p)) {
    if (isoDate >= start && isoDate <= end) {
      if (textImpliesMakkahRegion(blob)) makkah = true;
      if (textImpliesMadinahRegion(blob)) madinah = true;
    }
  }

  if (!makkah && !madinah) {
    const arr = normalizeIsoDate(p.arrival_date);
    const dep = normalizeIsoDate(p.departure_date) ?? arr;
    if (arr && dep && isoDate >= arr && isoDate <= dep) {
      const b = pilgrimLocationBlob(p);
      if (textImpliesMakkahRegion(b)) makkah = true;
      if (textImpliesMadinahRegion(b)) madinah = true;
    }
  }

  return { makkah, madinah };
}

/** كل الأيام من أقل تاريخ إلى أعلى تاريخ في نطاق الرحلات والتوقفات */
export function calendarDateRangeForPresenceChart(pilgrims: Pilgrim[]): string[] {
  const all: string[] = [];
  for (const p of pilgrims) {
    const a = normalizeIsoDate(p.arrival_date);
    const d = normalizeIsoDate(p.departure_date);
    if (a) all.push(a);
    if (d) all.push(d);
    for (const iv of getStayIntervals(p)) {
      all.push(iv.start, iv.end);
    }
  }
  if (all.length === 0) return [];
  const min = all.reduce((m, x) => (x < m ? x : m));
  const max = all.reduce((m, x) => (x > m ? x : m));
  if (max < min) return [];

  const out: string[] = [];
  const cur = new Date(`${min}T12:00:00`);
  const endT = new Date(`${max}T12:00:00`);
  while (cur <= endT) {
    out.push(toYmdLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** يفضّل يوم 18 من الشهر إن وُجد في النطاق، وإلا أول يوم */
export function defaultPresenceCalendarDate(dates: string[]): string {
  if (dates.length === 0) return '';
  const day18 = dates.find((iso) => iso.slice(8, 10) === '18');
  return day18 ?? dates[0];
}
