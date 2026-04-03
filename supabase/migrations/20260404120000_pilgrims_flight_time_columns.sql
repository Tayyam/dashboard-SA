-- أعمدة اختيارية لرقم الرحلة ووقت الوصول (تقارير الوصول/المغادرة والرفع من Excel)
alter table publicsv.pilgrims
  add column if not exists arrival_flight_number text,
  add column if not exists arrival_time text,
  add column if not exists departure_flight_number text;

comment on column publicsv.pilgrims.arrival_flight_number is 'رقم رحلة الوصول';
comment on column publicsv.pilgrims.arrival_time is 'وقت الوصول (نص أو HH:mm)';
comment on column publicsv.pilgrims.departure_flight_number is 'رقم رحلة المغادرة';
