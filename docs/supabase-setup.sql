-- Run once in Supabase Dashboard > SQL Editor.
-- Auth owns password storage; this table stores application/profile data only.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null,
  tax_code text not null,
  full_name text not null,
  role text not null default 'admin'
    check (role in ('admin', 'manager', 'accountant', 'sales')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.create_invoicepilot_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, company_name, tax_code, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'company_name', 'Chưa cập nhật'),
    coalesce(new.raw_user_meta_data ->> 'tax_code', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'admin'
  );
  return new;
end;
$$;

drop trigger if exists on_invoicepilot_auth_user_created on auth.users;
create trigger on_invoicepilot_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_invoicepilot_profile();
