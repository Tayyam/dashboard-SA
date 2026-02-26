import * as XLSX from 'xlsx';
import type { Pilgrim } from './types';

function toArabicRows(data: Pilgrim[]) {
  return data.map((p) => ({
    المعرف:             p.id,
    رقم_الحجز:          p.booking_id,
    الجنس:              p.gender,
    الجنسية:            p.nationality,
    الباقة:             p.package,
    مدينة_الوصول:       p.arrival_city,
    مدينة_المغادرة:     p.departure_city,
    فندق_الوصول:        p.arrival_hotel,
    فندق_المغادرة:      p.departure_hotel,
    العمر:              p.age,
    تاريخ_الوصول:       p.arrival_date,
    تاريخ_مغادرة_فندق_الوصول: p.arrival_hotel_checkout_date,
    تاريخ_الوصول_لمدينة_المغادرة: p.departure_city_arrival_date,
    تاريخ_مغادرة_فندق_المغادرة: p.departure_hotel_checkout_date,
    تاريخ_المغادرة:     p.departure_date,
    نوع_غرفة_مكة:       p.makkah_room_type,
    نوع_غرفة_المدينة:   p.madinah_room_type,
  }));
}

export function exportPilgrimsToExcel(data: Pilgrim[]) {
  const rows = toArabicRows(data);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook  = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pilgrims');

  const now   = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

  XLSX.writeFile(workbook, `pilgrims-export-${stamp}.xlsx`);
}
