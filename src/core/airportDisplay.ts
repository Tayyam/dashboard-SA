/** JED / MED فقط — أي قيمة أخرى تُعرض كما هي */
export function formatJourneyAirportCode(raw: string): string {
  const u = raw.trim().toUpperCase();
  if (u === 'JED') return 'مطار جدة';
  if (u === 'MED') return 'مطار المدينة';
  return raw.trim();
}
