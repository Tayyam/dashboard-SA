import type { Pilgrim } from './types';

export interface PackageTypeMatrixRow {
  type: string;
  packageNumbers: readonly string[];
  first: string;
  second: string;
  third: string | null;
}

/** مرجع أنواع الباقات (T1–T5) وأرقام الباقات وترتيب التوقفات */
export const PACKAGE_TYPE_MATRIX: readonly PackageTypeMatrixRow[] = [
  {
    type: 'T1',
    packageNumbers: ['A01', 'A02', 'A03', 'A04', 'G01', 'G02', 'H01', 'H02'],
    first: 'Madinah',
    second: 'Makkah',
    third: 'Mina',
  },
  {
    type: 'T2',
    packageNumbers: ['A05', 'A06', 'G03', 'G04', 'G05', 'G06', 'G33', 'H06'],
    first: 'Madinah',
    second: 'Mina',
    third: 'Makkah',
  },
  {
    type: 'T3',
    packageNumbers: ['A07', 'A08', 'A09', 'H03', 'H04', 'H05'],
    first: 'Makkah',
    second: 'Mina',
    third: 'Madinah',
  },
  {
    type: 'T4',
    packageNumbers: ['A10', 'G07', 'H07'],
    first: 'Madinah',
    second: 'Mina',
    third: null,
  },
  {
    type: 'T5',
    packageNumbers: ['A11', 'G08', 'H08'],
    first: 'Mina',
    second: 'Madinah',
    third: null,
  },
] as const;

const CODE_TO_TYPE = new Map<string, string>();
for (const row of PACKAGE_TYPE_MATRIX) {
  for (const c of row.packageNumbers) {
    CODE_TO_TYPE.set(c.trim().toUpperCase(), row.type);
  }
}

/** يحدد نوع الباقة T1–T5 من package_id (رمز مثل A01 أو T1 مباشرة) */
export function packageTypeFromPackageId(packageId: string): string | null {
  const u = packageId.trim().toUpperCase();
  if (!u || u === '-') return null;
  if (/^T[1-5]$/.test(u)) return u;
  return CODE_TO_TYPE.get(u) ?? null;
}

export function countPilgrimsByPackageType(pilgrims: Pilgrim[]): {
  byType: Record<string, number>;
  unmatched: number;
} {
  const byType: Record<string, number> = {};
  for (const row of PACKAGE_TYPE_MATRIX) byType[row.type] = 0;
  let unmatched = 0;
  for (const p of pilgrims) {
    const t = packageTypeFromPackageId(p.package_id ?? '');
    if (t && byType[t] !== undefined) byType[t] += 1;
    else unmatched += 1;
  }
  return { byType, unmatched };
}
