-- Shared customer and invoice records for all InvoicePilot roles.
-- Apply after docs/supabase-member-invites.sql in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists company_admin_id uuid references public.profiles(id) on delete cascade;

update public.profiles
set company_admin_id = id
where role = 'admin' and company_admin_id is null;

create or replace function public.current_company_admin_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.company_admin_id, case when p.role = 'admin' then p.id end)
  from public.profiles p
  where p.id = (select auth.uid())
$$;

create or replace function public.current_invoicepilot_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create table if not exists public.ip_customers (
  id uuid primary key default gen_random_uuid(),
  company_admin_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  tax_code text not null default '',
  contact_name text not null default '',
  contact_email text not null default '',
  phone text not null default '',
  status text not null default 'Đang hoạt động' check (status in ('Đang hoạt động', 'Đang theo dõi', 'Cần liên hệ', 'Cần theo dõi')),
  opening_balance numeric(16,2) not null default 0 check (opening_balance >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ip_customers_company_tax_code_unique
  on public.ip_customers (company_admin_id, tax_code)
  where tax_code <> '';
create index if not exists ip_customers_company_name_idx
  on public.ip_customers (company_admin_id, name);

create table if not exists public.ip_invoices (
  id uuid primary key default gen_random_uuid(),
  company_admin_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.ip_customers(id) on delete restrict,
  invoice_no text not null check (length(trim(invoice_no)) between 1 and 80),
  issue_date date not null,
  due_date date not null,
  amount numeric(16,2) not null check (amount > 0),
  amount_paid numeric(16,2) not null default 0 check (amount_paid >= 0 and amount_paid <= amount),
  description text not null default '',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_admin_id, invoice_no)
);

create index if not exists ip_invoices_company_due_idx
  on public.ip_invoices (company_admin_id, due_date);
create index if not exists ip_invoices_customer_idx
  on public.ip_invoices (customer_id);

alter table public.ip_customers enable row level security;
alter table public.ip_invoices enable row level security;
revoke all on public.ip_customers, public.ip_invoices from anon;
grant select, insert, update on public.ip_customers, public.ip_invoices to authenticated;

drop policy if exists "Company members read customers" on public.ip_customers;
create policy "Company members read customers" on public.ip_customers
  for select to authenticated
  using (company_admin_id = (select public.current_company_admin_id()));

drop policy if exists "Sales and admins add customers" on public.ip_customers;
create policy "Sales and admins add customers" on public.ip_customers
  for insert to authenticated
  with check (
    company_admin_id = (select public.current_company_admin_id())
    and (select public.current_invoicepilot_role()) in ('admin', 'sales')
    and created_by = (select auth.uid())
  );

drop policy if exists "Sales and admins edit customers" on public.ip_customers;
create policy "Sales and admins edit customers" on public.ip_customers
  for update to authenticated
  using (
    company_admin_id = (select public.current_company_admin_id())
    and (select public.current_invoicepilot_role()) in ('admin', 'sales')
  )
  with check (
    company_admin_id = (select public.current_company_admin_id())
    and (select public.current_invoicepilot_role()) in ('admin', 'sales')
  );

drop policy if exists "Company members read invoices" on public.ip_invoices;
create policy "Company members read invoices" on public.ip_invoices
  for select to authenticated
  using (company_admin_id = (select public.current_company_admin_id()));

drop policy if exists "Accounting and admins create invoices" on public.ip_invoices;
create policy "Accounting and admins create invoices" on public.ip_invoices
  for insert to authenticated
  with check (
    company_admin_id = (select public.current_company_admin_id())
    and (select public.current_invoicepilot_role()) in ('admin', 'accountant')
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.ip_customers c
      where c.id = ip_invoices.customer_id and c.company_admin_id = ip_invoices.company_admin_id
    )
  );

drop policy if exists "Accounting and admins update invoices" on public.ip_invoices;
create policy "Accounting and admins update invoices" on public.ip_invoices
  for update to authenticated
  using (
    company_admin_id = (select public.current_company_admin_id())
    and (select public.current_invoicepilot_role()) in ('admin', 'accountant')
  )
  with check (
    company_admin_id = (select public.current_company_admin_id())
    and (select public.current_invoicepilot_role()) in ('admin', 'accountant')
    and exists (
      select 1 from public.ip_customers c
      where c.id = ip_invoices.customer_id and c.company_admin_id = ip_invoices.company_admin_id
    )
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ip_customers') then
      alter publication supabase_realtime add table public.ip_customers;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ip_invoices') then
      alter publication supabase_realtime add table public.ip_invoices;
    end if;
  end if;
end;
$$;
