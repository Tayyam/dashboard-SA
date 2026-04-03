/** تصنيف النص لعرض badge: المدينة/مطار المدينة = success، مكة/جدة = danger، منى = warning */
export type RegionTone = 'success' | 'danger' | 'warning' | 'neutral';

/**
 * يطابق أسماء المدن، المطارات (JED/MED، مطار جدة/المدينة)، والمنطقة المحيطة بمكة.
 */
export function getRegionTone(raw: string): RegionTone {
  const text = raw.trim();
  if (!text) return 'neutral';
  const t = text.toLowerCase();
  const u = text.toUpperCase();

  if (/\bMED\b/.test(u) || u === 'MED') return 'success';
  if (t.includes('مطار المدينة') || (t.includes('مطار') && (t.includes('المدينة') || t.includes('المدينه')))) {
    return 'success';
  }
  if (t.includes('prince mohammad') || t.includes('محمد بن عبدالعزيز')) return 'success';
  if (t.includes('madinah') || t.includes('medina') || t.includes('المدينة') || t.includes('المدينه')) {
    return 'success';
  }

  if (/\bJED\b/.test(u) || u === 'JED') return 'danger';
  if (t.includes('مطار جدة') || (t.includes('مطار') && (t.includes('جدة') || t.includes('جده')))) return 'danger';
  if (t.includes('king abdulaziz') || t.includes('kaia')) return 'danger';
  if (t.includes('jeddah') || /\bjed\b/.test(t) || t.includes('جدة') || t.includes('جده')) return 'danger';

  if (t.includes('makkah') || t.includes('mecca') || t.includes('مكة') || t.includes('مكه')) return 'danger';
  if (/\bmina\b|minaa|منى/.test(t)) return 'warning';
  if (
    /muzdalif|مزدلف|arafat|عرفات|\bhajj\b|\/\s*hajj|المناسك/.test(t)
  ) {
    return 'danger';
  }

  return 'neutral';
}
