-- Run this script in Supabase SQL Editor (publicsv schema).
-- It creates:
-- 1) users table (profile + role)
-- 2) approve table (registration approval workflow)
-- 3) RLS policies for user/admin access

create extension if not exists "pgcrypto";

create table if not exists publicsv.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar_url text,
  position text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists publicsv.approve (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references publicsv.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references publicsv.users(id)
);

create index if not exists approve_status_idx on publicsv.approve(status);
create index if not exists approve_user_id_idx on publicsv.approve(user_id);

alter table publicsv.users enable row level security;
alter table publicsv.approve enable row level security;

-- Helper: true if current auth user is admin
create or replace function publicsv.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from publicsv.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

-- USERS policies
drop policy if exists "users select own or admin" on publicsv.users;
create policy "users select own or admin"
on publicsv.users
for select
using (auth.uid() = id or publicsv.is_admin());

drop policy if exists "users insert own row" on publicsv.users;
create policy "users insert own row"
on publicsv.users
for insert
with check (auth.uid() = id);

drop policy if exists "users update own basic fields or admin" on publicsv.users;
create policy "users update own basic fields or admin"
on publicsv.users
for update
using (auth.uid() = id or publicsv.is_admin())
with check (
  (auth.uid() = id and role = 'user')
  or publicsv.is_admin()
);

-- APPROVE policies
drop policy if exists "approve select own or admin" on publicsv.approve;
create policy "approve select own or admin"
on publicsv.approve
for select
using (auth.uid() = user_id or publicsv.is_admin());

drop policy if exists "approve insert own request" on publicsv.approve;
create policy "approve insert own request"
on publicsv.approve
for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "approve admin update" on publicsv.approve;
create policy "approve admin update"
on publicsv.approve
for update
using (publicsv.is_admin())
with check (publicsv.is_admin());

-- Required grants for PostgREST (anon/authenticated via supabase-js)
grant usage on schema publicsv to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema publicsv to anon, authenticated, service_role;
alter default privileges in schema publicsv
grant select, insert, update, delete on tables to anon, authenticated, service_role;

-- Ensure PostgREST exposes publicsv schema
alter role authenticator set pgrst.db_schemas = 'public,publicsv,graphql_public';
notify pgrst, 'reload schema';
notify pgrst, 'reload config';

