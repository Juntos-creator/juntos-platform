-- =====================================================================
-- JUNTOS - Row Level Security (RLS)
-- Migracion 0002
-- =====================================================================

-- Helper: rol del usuario autenticado
create or replace function public.app_role() returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_staff() returns boolean as $$
  select public.app_role() in ('OPERATOR','ADMIN','AUDITOR');
$$ language sql stable security definer;

create or replace function public.is_admin() returns boolean as $$
  select public.app_role() in ('ADMIN','AUDITOR');
$$ language sql stable security definer;

-- ======================= PROFILES =======================
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self_or_staff on public.profiles;
create policy profiles_select_self_or_staff on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update using (id = auth.uid() or public.app_role() = 'ADMIN');

-- ======================= SERVICE REQUESTS =======================
alter table public.service_requests enable row level security;

drop policy if exists sr_select on public.service_requests;
create policy sr_select on public.service_requests
  for select using (customer_id = auth.uid() or public.is_staff());

drop policy if exists sr_insert on public.service_requests;
create policy sr_insert on public.service_requests
  for insert with check (customer_id = auth.uid());

drop policy if exists sr_update on public.service_requests;
create policy sr_update on public.service_requests
  for update using (customer_id = auth.uid() or public.is_staff());

-- ======================= SERVICES =======================
alter table public.services enable row level security;

drop policy if exists svc_select on public.services;
create policy svc_select on public.services
  for select using (
    public.is_staff()
    or companion_id = auth.uid()
    or exists (select 1 from public.service_requests r
               where r.id = service_request_id and r.customer_id = auth.uid())
  );

drop policy if exists svc_write on public.services;
create policy svc_write on public.services
  for all using (public.is_staff() or companion_id = auth.uid())
  with check (public.is_staff() or companion_id = auth.uid());

-- ======================= PAYMENTS =======================
alter table public.payments enable row level security;

drop policy if exists pay_select on public.payments;
create policy pay_select on public.payments
  for select using (customer_id = auth.uid() or public.is_staff());

drop policy if exists pay_write on public.payments;
create policy pay_write on public.payments
  for all using (public.is_staff()) with check (public.is_staff());

-- ======================= INVOICES =======================
alter table public.invoices enable row level security;

drop policy if exists inv_select on public.invoices;
create policy inv_select on public.invoices
  for select using (customer_id = auth.uid() or public.is_staff());

drop policy if exists inv_write on public.invoices;
create policy inv_write on public.invoices
  for all using (public.is_staff()) with check (public.is_staff());

-- ======================= INSTITUTIONS / PILOTS =======================
alter table public.institutions enable row level security;
alter table public.pilots enable row level security;
alter table public.pilot_metrics enable row level security;

drop policy if exists inst_staff on public.institutions;
create policy inst_staff on public.institutions
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists pilot_staff on public.pilots;
create policy pilot_staff on public.pilots
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists pmetric_staff on public.pilot_metrics;
create policy pmetric_staff on public.pilot_metrics
  for all using (public.is_staff()) with check (public.is_staff());

-- ======================= AUDIT LOGS (INMUTABLE) =======================
alter table public.audit_logs enable row level security;

-- SELECT solo ADMIN y AUDITOR
drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs
  for select using (public.app_role() in ('ADMIN','AUDITOR'));

-- NO se definen policies de INSERT/UPDATE/DELETE para roles normales.
-- Con RLS activo y sin policy, esas operaciones quedan DENEGADAS para
-- anon/authenticated. El INSERT se realiza unicamente con service_role,
-- que hace BYPASS de RLS (ver src/lib/audit.ts).
-- UPDATE y DELETE quedan prohibidos para todos (inmutabilidad).

-- Revoca explicitamente update/delete al rol authenticated
revoke update, delete on public.audit_logs from authenticated, anon;
