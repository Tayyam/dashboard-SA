-- إن كان view publicsv.pilgrims_app يعرّف أعمدة صراحةً (بدون third_stop_*)، فلن يصل العميل إلى التوقف الثالث والمخطط يبقى فارغاً.
-- هذا التعريف يمرّر كل أعمدة جدول pilgrims. إذا كان عندك منطق مخصص (JOIN، WHERE، إخفاء أعمدة)، انسخ الأعمدة الجديدة يدوياً إلى تعريفك بدلاً من تنفيذ هذا الملف كما هو.

create or replace view publicsv.pilgrims_app as
select *
from publicsv.pilgrims;

grant select on publicsv.pilgrims_app to anon, authenticated, service_role;

comment on view publicsv.pilgrims_app is 'واجهة التطبيق لبيانات الحجاج؛ يجب أن تتضمن أعمدة التوقف الثالث إن وُجدت في الجدول.';
