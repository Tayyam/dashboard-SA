-- دور manager (مدير): أقل من admin؛ يُستخدم في التطبيق لصلاحية رفع Excel فقط من واجهة الموافقات.
-- تحديث قيد role والسماح للمدير بتحديث صفه دون تغيير الدور إلى admin.

alter table publicsv.users drop constraint if exists users_role_check;
alter table publicsv.users
  add constraint users_role_check check (role in ('user', 'manager', 'admin'));

drop policy if exists "users update own basic fields or admin" on publicsv.users;
create policy "users update own basic fields or admin"
on publicsv.users
for update
using (auth.uid() = id or publicsv.is_admin())
with check (
  (auth.uid() = id and role in ('user', 'manager'))
  or publicsv.is_admin()
);
