import type { Pilgrim } from './types';
import { pilgrimArrivalFlowBucket, type ArrivalFlowBucket } from './transferReports';

function formatReportDate(iso: string): string {
  if (!iso?.trim()) return '—';
  try {
    return new Date(iso.trim() + 'T12:00:00').toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** وصول مبكر: تسجيل دخول التوقف الأول بتاريخ قبل تاريخ الوصول المسجّل */
function isEarlyArrival(p: Pilgrim): boolean {
  const arr = p.arrival_date?.trim();
  const cin = p.first_stop_check_in?.trim();
  if (!arr || !cin) return false;
  return cin < arr;
}

export interface ArrivalStatusSummaryRow {
  bucket: ArrivalFlowBucket | 'total';
  label: string;
  actionLabel: string;
  actionUrgent: boolean;
  swatchClass: string;
  note?: string;
  count: number;
  pct: number;
}

export interface ArrivalDateDistributionRow {
  sortDate: string;
  dateLabel: string;
  normal: number;
  early: number;
  transferMadinah: number;
  transferMakkah: number;
  /** نقل بحاجة أخرى + غير محدد (مجمّع في عمود «أخرى»؛ غير معروض كصفوف في ملخص الحالات) */
  otherOrUnknown: number;
  total: number;
  flights: number;
  pilgrims: Pilgrim[];
}

/** تقسيم متكامل لكل حاج في صف التاريخ (لا ازدواج بين طبيعي ومبكر). */
export function classifyArrivalDayCell(p: Pilgrim): 'normal' | 'early' | 'tm' | 'tk' | 'other' {
  const b = pilgrimArrivalFlowBucket(p);
  if (b === 'unknown' || b === 'transfer_other') return 'other';
  if (b === 'transfer_to_madinah') return 'tm';
  if (b === 'transfer_to_makkah') return 'tk';
  if (isEarlyArrival(p)) return 'early';
  return 'normal';
}

export function filterPilgrimsByArrivalDayCell(
  row: ArrivalDateDistributionRow,
  cell: 'normal' | 'early' | 'tm' | 'tk' | 'other',
): Pilgrim[] {
  return row.pilgrims.filter((p) => classifyArrivalDayCell(p) === cell);
}

export function buildArrivalStatusSummary(pilgrims: Pilgrim[]): {
  rows: ArrivalStatusSummaryRow[];
  byBucket: Record<ArrivalFlowBucket, Pilgrim[]>;
  total: number;
} {
  const withArrival = pilgrims.filter((p) => p.arrival_date?.trim());
  const byBucket: Record<ArrivalFlowBucket, Pilgrim[]> = {
    normal: [],
    transfer_to_madinah: [],
    transfer_to_makkah: [],
    transfer_other: [],
    unknown: [],
  };
  for (const p of withArrival) {
    byBucket[pilgrimArrivalFlowBucket(p)].push(p);
  }

  const total = withArrival.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  const meta: {
    bucket: ArrivalFlowBucket;
    label: string;
    actionLabel: string;
    actionUrgent: boolean;
    swatchClass: string;
    note?: string;
  }[] = [
    {
      bucket: 'normal',
      label: 'طبيعي',
      actionLabel: 'لا',
      actionUrgent: false,
      swatchClass: 'bg-emerald-500',
    },
    {
      bucket: 'transfer_to_madinah',
      label: 'يحتاج نقل ← المدينة المنورة',
      actionLabel: 'نقل فوري',
      actionUrgent: true,
      swatchClass: 'bg-amber-500',
    },
    {
      bucket: 'transfer_to_makkah',
      label: 'يحتاج نقل ← مكة المكرمة',
      actionLabel: 'نقل فوري',
      actionUrgent: true,
      swatchClass: 'bg-red-800',
      note: 'خطر تشغيلي',
    },
  ];

  const rows: ArrivalStatusSummaryRow[] = meta.map((m) => ({
    ...m,
    count: byBucket[m.bucket].length,
    pct: pct(byBucket[m.bucket].length),
  }));

  rows.push({
    bucket: 'total',
    label: 'الإجمالي',
    actionLabel: '—',
    actionUrgent: false,
    swatchClass: 'bg-slate-600',
    count: total,
    pct: total > 0 ? 100 : 0,
  });

  return { rows, byBucket, total };
}

export function buildArrivalStatusByDate(pilgrims: Pilgrim[]): ArrivalDateDistributionRow[] {
  const withArrival = pilgrims.filter((p) => p.arrival_date?.trim());
  const byDate = new Map<string, Pilgrim[]>();
  for (const p of withArrival) {
    const d = p.arrival_date.trim();
    const list = byDate.get(d) ?? [];
    list.push(p);
    byDate.set(d, list);
  }

  const rows: ArrivalDateDistributionRow[] = [];
  for (const [sortDate, list] of byDate) {
    let normal = 0;
    let early = 0;
    let transferMadinah = 0;
    let transferMakkah = 0;
    let otherOrUnknown = 0;
    const bookingIds = new Set<string>();

    for (const p of list) {
      if (p.booking_id?.trim()) bookingIds.add(p.booking_id.trim());
      const part = classifyArrivalDayCell(p);
      if (part === 'normal') normal++;
      else if (part === 'early') early++;
      else if (part === 'tm') transferMadinah++;
      else if (part === 'tk') transferMakkah++;
      else otherOrUnknown++;
    }

    const total = list.length;
    const flights = bookingIds.size || (total > 0 ? 1 : 0);

    rows.push({
      sortDate,
      dateLabel: formatReportDate(sortDate),
      normal,
      early,
      transferMadinah,
      transferMakkah,
      otherOrUnknown,
      total,
      flights,
      pilgrims: list,
    });
  }

  rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  return rows;
}

export function buildArrivalDateTotals(rows: ArrivalDateDistributionRow[]): ArrivalDateDistributionRow | null {
  if (!rows.length) return null;
  const acc: ArrivalDateDistributionRow = {
    sortDate: '',
    dateLabel: 'الإجمالي',
    normal: 0,
    early: 0,
    transferMadinah: 0,
    transferMakkah: 0,
    otherOrUnknown: 0,
    total: 0,
    flights: 0,
    pilgrims: [],
  };
  for (const r of rows) {
    acc.normal += r.normal;
    acc.early += r.early;
    acc.transferMadinah += r.transferMadinah;
    acc.transferMakkah += r.transferMakkah;
    acc.otherOrUnknown += r.otherOrUnknown;
    acc.total += r.total;
    acc.flights += r.flights;
  }
  return acc;
}
