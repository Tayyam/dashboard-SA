import type { Pilgrim } from './types';

/** قيمة فلتر الرسم والشريط الجانبي — يجب أن تبقى مطابقة حرفياً */
export const HOLY_CITY_MAKKAH_LABEL = 'مكة المكرمة';
export const HOLY_CITY_MADINAH_LABEL = 'المدينة المنورة';

/** نص مجمّع لحقول المسار (للاحتياط عند غياب فترات توقف واضحة) */
export function pilgrimLocationBlob(p: Pilgrim): string {
  return [
    p.arrival_city,
    p.departure_city,
    p.arrival_hotel_location,
    p.departure_hotel_location,
    p.first_stop_location,
    p.second_stop_location,
    p.third_stop_location,
    p.first_entry_place,
    p.last_exit_place,
    p.arrival_airport,
    p.departure_airport,
    p.first_stop_name,
    p.second_stop_name,
    p.third_stop_name,
    p.arrival_hotel,
    p.departure_hotel,
  ]
    .map((s) => (s ?? '').toString().trim())
    .filter(Boolean)
    .join(' ');
}

/** يطابق المدينة المنورة ومطارها (MED) والأسماء الشائعة */
export function textImpliesMadinahRegion(text: string): boolean {
  const raw = text.trim();
  if (!raw) return false;
  const t = raw.toLowerCase();
  const u = raw.toUpperCase();
  if (/\bMED\b/.test(u)) return true;
  if (t.includes('مطار المدينة') || (t.includes('مطار') && (t.includes('المدينة') || t.includes('المدينه')))) {
    return true;
  }
  if (t.includes('prince mohammad') || t.includes('محمد بن عبدالعزيز')) return true;
  if (t.includes('madinah') || t.includes('medina') || t.includes('المدينة') || t.includes('المدينه')) {
    return true;
  }
  return false;
}

/** مكة والحرم ومنى ومزدلفة وعرفات — دون اعتبار جدة وحدها كـ«مكة» */
export function textImpliesMakkahRegion(text: string): boolean {
  const raw = text.trim();
  if (!raw) return false;
  const t = raw.toLowerCase();
  if (t.includes('مكة') || t.includes('مكه')) return true;
  if (t.includes('makkah') || t.includes('mecca')) return true;
  if (/\bmina\b|minaa|منى/.test(t)) return true;
  if (t.includes('muzdalif') || t.includes('مزدلف')) return true;
  if (t.includes('arafat') || t.includes('عرفات')) return true;
  if (t.includes('الحرم') || t.includes('haram')) return true;
  if (t.includes('المناسك')) return true;
  return false;
}

export function pilgrimHolyCityFlags(p: Pilgrim): { makkah: boolean; madinah: boolean } {
  const blob = pilgrimLocationBlob(p);
  return {
    makkah: textImpliesMakkahRegion(blob),
    madinah: textImpliesMadinahRegion(blob),
  };
}
