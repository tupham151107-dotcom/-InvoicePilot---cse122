-- Apply in Supabase SQL Editor before deploying the invite-member Edge Function.
-- This adds company ownership to profiles so an admin can list invited teammates.
alter table public.profiles
  add column if not exists email text,
  add column if not exists company_admin_id uuid references public.profiles(id) on delete cascade,
  add column if not exists invite_status text not null default 'active';

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

update public.profiles
set company_admin_id = id
where role = 'admin' and company_admin_id is null;

update public.profiles member
set company_admin_id = owner.id
from public.profiles owner
where member.role <> 'admin'
  and member.company_admin_id is null
  and owner.role = 'admin'
  and member.company_name = owner.company_name
  and member.tax_code = owner.tax_code;

create table if not exists public.member_invites (
  email text primary key,
  company_admin_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  tax_code text not null,
  full_name text not null,
  role text not null check (role in ('manager', 'accountant', 'sales')),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);
alter table public.member_invites enable row level security;
revoke all on public.member_invites from anon, authenticated;
grant all on public.member_invites to service_role;

create or replace function public.is_company_admin(target_admin_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.id = target_admin_id
  );
$$;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users and company admins can read profiles" on public.profiles;
create policy "Users and company admins can read profiles"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_company_admin(company_admin_id));

create or replace function public.create_invoicepilot_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  invite_row public.member_invites%rowtype;
begin
  select * into invite_row
  from public.member_invites
  where email = lower(new.email) and expires_at > now()
  for update;

  if found then
    delete from public.member_invites where email = invite_row.email;
    insert into public.profiles (id, company_name, tax_code, full_name, role, email, company_admin_id, invite_status)
    values (new.id, invite_row.company_name, invite_row.tax_code, invite_row.full_name, invite_row.role,
      new.email, invite_row.company_admin_id, 'invited');
  else
  insert into public.profiles (id, company_name, tax_code, full_name, role, email, company_admin_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'company_name', 'Chưa cập nhật'),
    coalesce(new.raw_user_meta_data ->> 'tax_code', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'admin',
    new.email,
    new.id
  );
  end;
  return new;
end;
$$;

create or replace function public.mark_invoicepilot_invite_accepted()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.encrypted_password is not null and new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles set invite_status = 'active' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists invoicepilot_invite_accepted on auth.users;
create trigger invoicepilot_invite_accepted
  after update of email_confirmed_at, encrypted_password on auth.users
  for each row execute function public.mark_invoicepilot_invite_accepted();
