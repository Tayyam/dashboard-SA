-- ثلاث نقاط توقف (فندق أو منى …) + حقول عربية للمطارات والمدن
-- نفّذ على مخطط publicsv (كما في عميل Supabase لهذا المشروع).
-- إن كان عندك view pilgrims_app يختار أعمدة صراحةً، أضف الأعمدة الجديدة إلى تعريف الـ view.

alter table publicsv.pilgrims add column if not exists first_stop_name text;
alter table publicsv.pilgrims add column if not exists first_stop_location text;
alter table publicsv.pilgrims add column if not exists first_stop_check_in date;
alter table publicsv.pilgrims add column if not exists first_stop_check_out date;
alter table publicsv.pilgrims add column if not exists second_stop_name text;
alter table publicsv.pilgrims add column if not exists second_stop_location text;
alter table publicsv.pilgrims add column if not exists second_stop_check_in date;
alter table publicsv.pilgrims add column if not exists second_stop_check_out date;
alter table publicsv.pilgrims add column if not exists third_stop_name text;
alter table publicsv.pilgrims add column if not exists third_stop_location text;
alter table publicsv.pilgrims add column if not exists third_stop_check_in date;
alter table publicsv.pilgrims add column if not exists third_stop_check_out date;
alter table publicsv.pilgrims add column if not exists first_entry_place text;
alter table publicsv.pilgrims add column if not exists arrival_airport text;
alter table publicsv.pilgrims add column if not exists last_exit_place text;
alter table publicsv.pilgrims add column if not exists departure_airport text;

comment on column publicsv.pilgrims.first_stop_name is 'نقطة التوقف الأولى (فندق، منى، …)';
comment on column publicsv.pilgrims.third_stop_check_out is 'تاريخ مغادرة التوقف الثالث';
