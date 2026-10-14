-- Shared partial invoice payments and audit history for InvoicePilot.
-- Apply after docs/supabase-shared-business-data.sql.

create table if not exists public.ip_payments (
  id uuid primary key default gen_random_uuid(),
  company_admin_id uuid not null references public.profiles(id) on delete cascade,
  invoice_id uuid not null references public.ip_invoices(id) on delete restrict,
  amount numeric(16,2) not null check (amount > 0),
  payment_method text not null default 'bank' check (payment_method in ('bank', 'cash', 'card', 'other')),
  reference text not null default '' check (length(reference) <= 160),
  paid_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);

create index if not exists ip_payments_company_paid_idx
  on public.ip_payments (company_admin_id, paid_at desc);
create index if not exists ip_payments_invoice_idx
  on public.ip_payments (invoice_id, paid_at desc);

create table if not exists public.ip_invoice_history (
  id bigint generated always as identity primary key,
  company_admin_id uuid not null references public.profiles(id) on delete cascade,
  invoice_id uuid not null references public.ip_invoices(id) on delete cascade,
  event_type text not null check (event_type in ('invoice_created', 'amount_paid', 'invoice_updated')),
  changed_by uuid references auth.users(id) on delete set null,
  old_values jsonb,
  new_values jsonb not null,
  changed_at timestamptz not null default now()
);

create index if not exists ip_invoice_history_invoice_idx
  on public.ip_invoice_history (invoice_id, changed_at desc);

alter table public.ip_payments enable row level security;
alter table public.ip_invoice_history enable row level security;
revoke all on public.ip_payments, public.ip_invoice_history from anon;
revoke insert, update, delete on public.ip_payments, public.ip_invoice_history from authenticated;
grant select on public.ip_payments, public.ip_invoice_history to authenticated;

drop policy if exists "Company members read payments" on public.ip_payments;
create policy "Company members read payments" on public.ip_payments
  for select to authenticated
  using (company_admin_id = (select public.current_company_admin_id()));

drop policy if exists "Company members read invoice history" on public.ip_invoice_history;
create policy "Company members read invoice history" on public.ip_invoice_history
  for select to authenticated
  using (company_admin_id = (select public.current_company_admin_id()));

create or replace function public.log_invoice_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event text;
begin
  if tg_op = 'INSERT' then
    v_event := 'invoice_created';
  elsif old.amount_paid is distinct from new.amount_paid then
    v_event := 'amount_paid';
  elsif row(old.company_admin_id, old.customer_id, old.invoice_no, old.issue_date, old.due_date, old.amount, old.description)
        is distinct from row(new.company_admin_id, new.customer_id, new.invoice_no, new.issue_date, new.due_date, new.amount, new.description) then
    v_event := 'invoice_updated';
  else
    return new;
  end if;

  insert into public.ip_invoice_history (company_admin_id, invoice_id, event_type, changed_by, old_values, new_values)
  values (
    new.company_admin_id,
    new.id,
    v_event,
    auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists ip_invoices_audit_history on public.ip_invoices;
create trigger ip_invoices_audit_history
  after insert or update on public.ip_invoices
  for each row execute function public.log_invoice_history();

create or replace function public.record_company_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text default 'bank',
  p_reference text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.ip_invoices%rowtype;
  v_payment_id uuid;
  v_company_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if (select public.current_invoicepilot_role()) not in ('admin', 'accountant') then
    raise exception 'Only an accountant or admin can record invoice payments';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
  if coalesce(p_payment_method, 'bank') not in ('bank', 'cash', 'card', 'other') then
    raise exception 'Unsupported payment method';
  end if;

  v_company_id := (select public.current_company_admin_id());
  select * into v_invoice
  from public.ip_invoices
  where id = p_invoice_id and company_admin_id = v_company_id
  for update;
  if not found then raise exception 'Invoice not found in this company'; end if;
  if p_amount > v_invoice.amount - v_invoice.amount_paid then raise exception 'Payment exceeds invoice balance'; end if;

  insert into public.ip_payments (company_admin_id, invoice_id, amount, payment_method, reference, created_by)
  values (v_company_id, p_invoice_id, p_amount, coalesce(p_payment_method, 'bank'), left(coalesce(p_reference, ''), 160), auth.uid())
  returning id into v_payment_id;

  update public.ip_invoices
  set amount_paid = amount_paid + p_amount, updated_at = now()
  where id = p_invoice_id;

  return v_payment_id;
end;
$$;

revoke all on function public.record_company_invoice_payment(uuid, numeric, text, text) from public, anon;
grant execute on function public.record_company_invoice_payment(uuid, numeric, text, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ip_payments') then
      alter publication supabase_realtime add table public.ip_payments;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ip_invoice_history') then
      alter publication supabase_realtime add table public.ip_invoice_history;
    end if;
  end if;
end;
$$;
