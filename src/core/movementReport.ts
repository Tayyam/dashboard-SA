import type { Pilgrim } from './types';

export interface MovementReportRow {
  sortDate: string;
  dateLabel: string;
  fromLocation: string;
  toLocation: string;
  fromName: string;
  toName: string;
  pilgrims: Pilgrim[];
}

function formatMovementDateLabel(iso: string): string {
  if (!iso?.trim()) return '—';
  try {
    return new Date(iso.trim() + 'T12:00:00').toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function displayCell(s: string | undefined): string {
  const t = s?.trim();
  return t || '—';
}

type DirectedEdge = {
  sortDate: string;
  fromLocation: string;
  toLocation: string;
  fromName: string;
  toName: string;
  pilgrim: Pilgrim;
};

/** توقف 1 → توقف 2: تاريخ الحركة من دخول التوقف الثاني أو خروج الأول أو تاريخ الوصول لمدينة المغادرة (ثاني). */
function edgeFirstToSecond(p: Pilgrim): DirectedEdge | null {
  const fromName = p.first_stop_name?.trim();
  const toName = p.second_stop_name?.trim();
  const fromLoc = p.first_stop_location?.trim();
  const toLoc = p.second_stop_location?.trim();
  if ((!fromName && !fromLoc) || (!toName && !toLoc)) return null;

  const sortDate =
    p.second_stop_check_in?.trim() ||
    p.first_stop_check_out?.trim() ||
    p.departure_city_arrival_date?.trim();
  if (!sortDate) return null;

  return {
    sortDate,
    fromLocation: displayCell(fromLoc),
    toLocation: displayCell(toLoc),
    fromName: displayCell(fromName),
    toName: displayCell(toName),
    pilgrim: p,
  };
}

/**
 * توقف 2 → توقف 1: عند مغادرة التوقف الثاني دون وجود توقف ثالث (تجنّب خلط المسار نحو التوقف الثالث).
 * تاريخ الحركة = خروج التوقف الثاني.
 */
function edgeSecondToFirst(p: Pilgrim): DirectedEdge | null {
  if (p.third_stop_name?.trim()) return null;

  const fromName = p.second_stop_name?.trim();
  const toName = p.first_stop_name?.trim();
  const fromLoc = p.second_stop_location?.trim();
  const toLoc = p.first_stop_location?.trim();
  if ((!fromName && !fromLoc) || (!toName && !toLoc)) return null;

  const sortDate = p.second_stop_check_out?.trim();
  if (!sortDate) return null;

  return {
    sortDate,
    fromLocation: displayCell(fromLoc),
    toLocation: displayCell(toLoc),
    fromName: displayCell(fromName),
    toName: displayCell(toName),
    pilgrim: p,
  };
}

/**
 * تحركات بين التوقف الأول والثاني (من الأول→الثاني ومن الثاني→الأول) في جدول واحد،
 * مع تجميع العدد لكل (تاريخ، مكان من، مكان إلى، اسم من، اسم إلى).
 */
export function buildMovementReportRows(pilgrims: Pilgrim[]): MovementReportRow[] {
  const edges: DirectedEdge[] = [];
  for (const p of pilgrims) {
    const a = edgeFirstToSecond(p);
    if (a) edges.push(a);
    const b = edgeSecondToFirst(p);
    if (b) edges.push(b);
  }

  const map = new Map<string, Pilgrim[]>();
  for (const e of edges) {
    const key = `${e.sortDate}\n${e.fromLocation}\n${e.toLocation}\n${e.fromName}\n${e.toName}`;
    const list = map.get(key) ?? [];
    list.push(e.pilgrim);
    map.set(key, list);
  }

  const rows: MovementReportRow[] = [];
  for (const [key, list] of map) {
    if (!list.length) continue;
    const [sortDate, fromLocation, toLocation, fromName, toName] = key.split('\n');
    rows.push({
      sortDate,
      dateLabel: formatMovementDateLabel(sortDate),
      fromLocation,
      toLocation,
      fromName,
      toName,
      pilgrims: list,
    });
  }

  rows.sort((a, b) => {
    const d = a.sortDate.localeCompare(b.sortDate);
    if (d !== 0) return d;
    const f = a.fromName.localeCompare(b.fromName);
    if (f !== 0) return f;
    const t = a.toName.localeCompare(b.toName);
    if (t !== 0) return t;
    return a.fromLocation.localeCompare(b.fromLocation);
  });

  return rows;
}
