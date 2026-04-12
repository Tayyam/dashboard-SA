-- يُعيد إنشاء view pilgrims_app ليشمل الأعمدة الجديدة:
--   arrival_flight_number, arrival_time, departure_flight_number
-- التي أُضيفت إلى جدول pilgrims في مهاجرة 20260404120000
-- لكن VIEW لم يُحدَّث (PostgreSQL يُثبّت قائمة أعمدة SELECT * وقت الإنشاء).

create or replace view publicsv.pilgrims_app as
select *
from publicsv.pilgrims;

grant select on publicsv.pilgrims_app to anon, authenticated, service_role;

comment on view publicsv.pilgrims_app is 'واجهة التطبيق لبيانات الحجاج — تشمل جميع الأعمدة بما فيها رقم الرحلة ووقت الوصول.';
