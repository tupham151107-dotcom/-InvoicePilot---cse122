-- Persist payment reconciliation and company-wide notifications.
-- Apply after 202610140001_invoice_payments_and_history.sql.

alter table public.ip_payments
  add column if not exists reconciled_at timestamptz,
  add column if not exists reconciled_by uuid references auth.users(id) on delete set null;

create table if not exists public.ip_notifications (
  id uuid primary key default gen_random_uuid(),
  company_admin_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('customer_added', 'invoice_created', 'payment_received', 'payment_reconciled')),
  title text not null,
  message text not null default '',
  reference_type text not null check (reference_type in ('customer', 'invoice', 'payment')),
  reference_id uuid not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ip_notifications_company_created_idx
  on public.ip_notifications (company_admin_id, created_at desc);

create table if not exists public.ip_notification_reads (
  notification_id uuid not null references public.ip_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);
create index if not exists ip_notification_reads_user_idx
  on public.ip_notification_reads (user_id, read_at desc);

alter table public.ip_notifications enable row level security;
alter table public.ip_notification_reads enable row level security;
revoke all on public.ip_notifications, public.ip_notification_reads from anon;
grant select on public.ip_notifications to authenticated;
grant select, insert on public.ip_notification_reads to authenticated;

drop policy if exists "Company members read notifications" on public.ip_notifications;
create policy "Company members read notifications" on public.ip_notifications
  for select to authenticated
  using (company_admin_id = (select public.current_company_admin_id()));

drop policy if exists "Members read own notification receipts" on public.ip_notification_reads;
create policy "Members read own notification receipts" on public.ip_notification_reads
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Members mark own notifications read" on public.ip_notification_reads;
create policy "Members mark own notifications read" on public.ip_notification_reads
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.ip_notifications n
      where n.id = notification_id
        and n.company_admin_id = (select public.current_company_admin_id())
    )
  );

create or replace function public.notify_invoicepilot_business_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_invoice public.ip_invoices%rowtype;
  v_customer text;
begin
  if tg_table_name = 'ip_customers' then
    insert into public.ip_notifications (company_admin_id, event_type, title, message, reference_type, reference_id, created_by)
    values (new.company_admin_id, 'customer_added', 'Khách hàng mới được thêm', new.name, 'customer', new.id, new.created_by);
  elsif tg_table_name = 'ip_invoices' then
    select name into v_customer from public.ip_customers where id = new.customer_id;
    insert into public.ip_notifications (company_admin_id, event_type, title, message, reference_type, reference_id, created_by)
    values (new.company_admin_id, 'invoice_created', 'Hóa đơn mới được tạo',
      new.invoice_no || ' · ' || coalesce(v_customer, 'Khách hàng') || ' · ' || to_char(new.amount, 'FM999G999G999G999G990'),
      'invoice', new.id, new.created_by);
  else
    select i.* into v_invoice from public.ip_invoices i where i.id = new.invoice_id;
    select c.name into v_customer from public.ip_customers c where c.id = v_invoice.customer_id;
    insert into public.ip_notifications (company_admin_id, event_type, title, message, reference_type, reference_id, created_by)
    values (new.company_admin_id, 'payment_received', 'Đã ghi nhận thanh toán',
      v_invoice.invoice_no || ' · ' || coalesce(v_customer, 'Khách hàng') || ' · ' || to_char(new.amount, 'FM999G999G999G999G990'),
      'payment', new.id, new.created_by);
  end if;
  return new;
end;
$$;

drop trigger if exists ip_customers_notify_business_event on public.ip_customers;
create trigger ip_customers_notify_business_event after insert on public.ip_customers
  for each row execute function public.notify_invoicepilot_business_event();
drop trigger if exists ip_invoices_notify_business_event on public.ip_invoices;
create trigger ip_invoices_notify_business_event after insert on public.ip_invoices
  for each row execute function public.notify_invoicepilot_business_event();
drop trigger if exists ip_payments_notify_business_event on public.ip_payments;
create trigger ip_payments_notify_business_event after insert on public.ip_payments
  for each row execute function public.notify_invoicepilot_business_event();

create or replace function public.reconcile_company_invoice_payment(p_payment_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_payment_id uuid; v_invoice_id uuid; v_company_id uuid; v_invoice_no text; v_amount numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if (select public.current_invoicepilot_role()) not in ('admin', 'accountant') then
    raise exception 'Only an accountant or admin can reconcile payments';
  end if;
  v_company_id := (select public.current_company_admin_id());
  update public.ip_payments
    set reconciled_at = now(), reconciled_by = auth.uid()
    where id = p_payment_id and company_admin_id = v_company_id and reconciled_at is null
    returning id, invoice_id, amount into v_payment_id, v_invoice_id, v_amount;
  if v_payment_id is null then raise exception 'Payment not found or already reconciled'; end if;
  select invoice_no into v_invoice_no from public.ip_invoices where id = v_invoice_id;
  insert into public.ip_notifications (company_admin_id, event_type, title, message, reference_type, reference_id, created_by)
    values (v_company_id, 'payment_reconciled', 'Khoản thanh toán đã đối soát',
      coalesce(v_invoice_no, 'Hóa đơn') || ' · ' || to_char(v_amount, 'FM999G999G999G999G990'), 'payment', p_payment_id, auth.uid());
  return v_payment_id;
end;
$$;
revoke all on function public.reconcile_company_invoice_payment(uuid) from public, anon;
grant execute on function public.reconcile_company_invoice_payment(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ip_notifications') then
      alter publication supabase_realtime add table public.ip_notifications;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ip_notification_reads') then
      alter publication supabase_realtime add table public.ip_notification_reads;
    end if;
  end if;
end;
$$;
