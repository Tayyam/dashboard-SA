import * as XLSX from 'xlsx';
import type { Pilgrim } from './types';

/** تقرير الوصول: بدون رحلة المغادرة. تقرير المغادرة: بدون حقول الوصول الجوية/الزمنية. */
export type PilgrimExportScope = 'full' | 'arrival_report' | 'departure_report';

function toArabicRows(data: Pilgrim[], scope: PilgrimExportScope = 'full') {
  return data.map((p) => {
    const row: Record<string, string | number> = {
      المعرف: p.id,
      رقم_الحجز: p.booking_id,
      الجنس: p.gender,
      الجنسية: p.nationality,
      الباقة: p.package,
      مدينة_الوصول: p.arrival_city,
      مدينة_المغادرة: p.departure_city,
      فندق_الوصول: p.arrival_hotel,
      فندق_المغادرة: p.departure_hotel,
      توقف1_الاسم: p.first_stop_name,
      توقف1_الموقع: p.first_stop_location,
      توقف1_دخول: p.first_stop_check_in,
      توقف1_خروج: p.first_stop_check_out,
      توقف2_الاسم: p.second_stop_name,
      توقف2_الموقع: p.second_stop_location,
      توقف2_دخول: p.second_stop_check_in,
      توقف2_خروج: p.second_stop_check_out,
      توقف3_الاسم: p.third_stop_name,
      توقف3_الموقع: p.third_stop_location,
      توقف3_دخول: p.third_stop_check_in,
      توقف3_خروج: p.third_stop_check_out,
      أول_مكان_دخول: p.first_entry_place,
      مطار_الوصول: p.arrival_airport,
      رقم_رحلة_الوصول: p.arrival_flight_number,
      وقت_الوصول: p.arrival_time,
      رقم_رحلة_المغادرة: p.departure_flight_number,
      آخر_مكان_خروج: p.last_exit_place,
      مطار_المغادرة: p.departure_airport,
      العمر: p.age,
      تاريخ_الوصول: p.arrival_date,
      تاريخ_مغادرة_فندق_الوصول: p.arrival_hotel_checkout_date,
      تاريخ_الوصول_لمدينة_المغادرة: p.departure_city_arrival_date,
      تاريخ_مغادرة_فندق_المغادرة: p.departure_hotel_checkout_date,
      تاريخ_المغادرة: p.departure_date,
      نوع_غرفة_مكة: p.makkah_room_type,
      نوع_غرفة_المدينة: p.madinah_room_type,
    };

    if (scope === 'arrival_report') {
      delete row['رقم_رحلة_المغادرة'];
    }
    if (scope === 'departure_report') {
      delete row['مدينة_الوصول'];
      delete row['مطار_الوصول'];
      delete row['رقم_رحلة_الوصول'];
      delete row['وقت_الوصول'];
      delete row['أول_مكان_دخول'];
      delete row['تاريخ_الوصول'];
      delete row['تاريخ_مغادرة_فندق_الوصول'];
    }

    return row;
  });
}

export function exportPilgrimsToExcel(data: Pilgrim[], scope: PilgrimExportScope = 'full') {
  const rows = toArabicRows(data, scope);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook  = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pilgrims');

  const now   = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

  XLSX.writeFile(workbook, `pilgrims-export-${stamp}.xlsx`);
}
