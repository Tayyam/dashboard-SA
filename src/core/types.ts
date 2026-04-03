export interface Pilgrim {
  id: number;
  group_id: string;
  booking_id: string;
  gender: 'Male' | 'Female';
  name: string;
  birth_date: string;
  age: number;
  guide_name: string;
  residence_country: string;
  nationality: string;
  /** نوع الباقة (package type): T1–T5 أو رمز مثل A01، G01… — يُقرأ من عمود package_type في الإكسل */
  package_id: string;
  /** اسم/وصف الباقة */
  package: string;
  arrival_city: string;
  departure_city: string;
  arrival_hotel: string;
  arrival_hotel_location: string;
  departure_hotel: string;
  departure_hotel_location: string;
  /** ثلاث نقاط توقف (فندق أو منى/مزدلفة …) — تُملأ من الملف الجديد؛ تُشتق منها حقول الفنادق أعلاه للتوافق */
  first_stop_name: string;
  first_stop_location: string;
  first_stop_check_in: string;
  first_stop_check_out: string;
  second_stop_name: string;
  second_stop_location: string;
  second_stop_check_in: string;
  second_stop_check_out: string;
  third_stop_name: string;
  third_stop_location: string;
  third_stop_check_in: string;
  third_stop_check_out: string;
  first_entry_place: string;
  arrival_airport: string;
  last_exit_place: string;
  departure_airport: string;
  arrival_date: string;                  // YYYY-MM-DD
  arrival_hotel_checkout_date: string;   // YYYY-MM-DD
  departure_city_arrival_date: string;   // YYYY-MM-DD
  departure_hotel_checkout_date: string; // YYYY-MM-DD
  departure_date: string;                // YYYY-MM-DD
  visa_status: string;
  inside_kingdom: boolean;
  makkah_room_type: 'triple' | 'double' | 'quad';
  madinah_room_type: 'triple' | 'double' | 'quad';
  flight_contract_type: 'B2B' | 'GDS';
  /** true إذا كان الصف يحتوي حقول وصول جوي (مطار، Dep_Arr_Date، Dep_Destination) — يُستخدم لعدم اشتقاق مدينة الوصول من أماكن برية */
  has_arrival_flight: boolean;
  /** رقم رحلة الوصول (اختياري — من ملف الإكسل / القاعدة) */
  arrival_flight_number: string;
  /** وقت الوصول (نص أو وقت مستخرج من Excel) */
  arrival_time: string;
  /** رقم رحلة المغادرة (اختياري) */
  departure_flight_number: string;
}

export interface Filters {
  from_date: string | null;
  to_date: string | null;
  year: string | null;
  month: string | null;
  day: string | null;
  arrival_city: string | null;
  departure_city: string | null;
  package: string | null;
  gender: string | null;
  table_search: string | null;
  table_inside_kingdom: 'inside' | 'outside' | null;
  // Chart cross-filter selections
  chart_gender: string | null;
  chart_arrival_city: string | null;
  chart_arrival_date: string | null;
  chart_departure_date: string | null;
  chart_arrival_hotel: string | null;
  chart_departure_hotel: string | null;
  chart_third_stop: string | null;
  chart_nationality: string | null;
  chart_package: string | null;
  /** T1–T5 أو «أخرى» لغير المطابقة مع مصفوفة الأنواع */
  chart_package_type: string | null;
  chart_age_bucket: string | null;
  chart_contract_type: string | null;
  chart_visa_status: string | null;
  /** تواجد برنامج الحاج في مكة أو المدينة (من مواقع التوقف والمدن والمطارات) */
  chart_holy_city: string | null;
  /** تاريخ التقويم المرتبط بفلتر رسم التواجد اليومي (YYYY-MM-DD) */
  chart_holy_city_date: string | null;
  /** نهاية النطاق عند دمج أيام متطابقة (أو نفس بداية اليوم) */
  chart_holy_city_date_end: string | null;
}

export type GroupedData = Record<string, Pilgrim[]>;

export interface ChartDataPoint {
  /** مفتاح البيانات والفلتر والنقر (مثلاً JED) */
  label: string;
  value: number;
  isSelected: boolean;
  /** تسمية المحور/التولتيب عند الحاجة (مثلاً مطار جدة) */
  axisLabel?: string;
}
