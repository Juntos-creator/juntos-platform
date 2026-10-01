-- =====================================================================
-- JUNTOS - Esquema relacional (PostgreSQL / Supabase)
-- Migracion 0001: tablas, enums, triggers de secuencia
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type user_role as enum ('CUSTOMER','COMPANION','OPERATOR','ADMIN','AUDITOR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sr_status as enum ('submitted','assigned','in_progress','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type service_status as enum ('assigned','in_progress','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('PENDING','AUTHORIZED','PAID','FAILED','REFUNDED','PARTIAL_REFUND','CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('CONFIG_REQUIRED','AZUL','CARDNET','PAYPAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ncf_type as enum ('B01','B02');
exception when duplicate_object then null; end $$;

do $$ begin
  create type institution_type as enum ('clinica','hospital','laboratorio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type institution_status as enum ('PROSPECT','CONTACTED','MEETING','PILOT_PROPOSED','PILOT_ACTIVE','CLIENT','INACTIVE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type for_who_type as enum ('me','familiar','otro');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES (vinculado a auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'CUSTOMER',
  created_at timestamptz not null default now()
);

-- ---------- SERVICE REQUESTS ----------
create sequence if not exists public.sr_code_seq;
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  for_who for_who_type not null default 'me',
  for_who_name text,
  service_type text not null,
  requested_date date not null,
  requested_time time not null,
  duration_minutes int not null check (duration_minutes > 0),
  center_name text,
  center_address text,
  zone text,
  target_lat double precision,
  target_lng double precision,
  observations text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  status sr_status not null default 'submitted',
  created_at timestamptz not null default now()
);

-- Genera code tipo JNT-2026-000001
create or replace function public.set_sr_code() returns trigger as $$
begin
  if new.code is null then
    new.code := 'JNT-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.sr_code_seq')::text, 6, '0');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_set_sr_code on public.service_requests;
create trigger trg_set_sr_code before insert on public.service_requests
  for each row execute function public.set_sr_code();

-- ---------- SERVICES (asignacion al acompanante) ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  companion_id uuid references public.profiles(id) on delete set null,
  check_in timestamptz,
  check_out timestamptz,
  status service_status not null default 'assigned',
  created_at timestamptz not null default now()
);

-- ---------- PAYMENTS ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'DOP',
  status payment_status not null default 'PENDING',
  provider payment_provider not null default 'CONFIG_REQUIRED',
  created_at timestamptz not null default now()
);

-- ---------- INVOICES (NCF DGII) ----------
create sequence if not exists public.ncf_b01_seq;
create sequence if not exists public.ncf_b02_seq;
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid references public.service_requests(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  ncf_type ncf_type not null,
  ncf_number text unique,
  subtotal numeric(12,2) not null,
  itbis numeric(12,2) not null,
  total numeric(12,2) not null,
  rnc_cedula text,
  company_name text,
  created_at timestamptz not null default now()
);

-- Asigna NCF segun tipo (B01xxxxxxxxxx / B02xxxxxxxxxx)
create or replace function public.set_ncf_number() returns trigger as $$
begin
  if new.ncf_number is null then
    if new.ncf_type = 'B01' then
      new.ncf_number := 'B01' || lpad(nextval('public.ncf_b01_seq')::text, 8, '0');
    else
      new.ncf_number := 'B02' || lpad(nextval('public.ncf_b02_seq')::text, 8, '0');
    end if;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_set_ncf on public.invoices;
create trigger trg_set_ncf before insert on public.invoices
  for each row execute function public.set_ncf_number();

-- ---------- INSTITUTIONS (CRM B2B) ----------
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rnc text,
  type institution_type not null default 'clinica',
  zone text,
  contact_name text,
  contact_role text,
  contact_email text,
  status institution_status not null default 'PROSPECT',
  created_at timestamptz not null default now()
);

-- ---------- PILOTS + METRICS ----------
create table if not exists public.pilots (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  start_date date not null default now(),
  end_date date,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.pilot_metrics (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references public.pilots(id) on delete cascade,
  week_number int not null,
  services_count int not null default 0,
  satisfaction_avg numeric(3,2) default 0,      -- objetivo > 4.5
  incidents_count int not null default 0,        -- tasa objetivo < 2%
  response_time_avg_minutes int default 0,       -- objetivo < 30
  repeat_rate numeric(5,2) default 0,            -- objetivo > 20 (%)
  feedback text,
  created_at timestamptz not null default now()
);

-- ---------- AUDIT LOGS (inmutable) ----------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role user_role,
  action text not null,
  entity text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip text,
  user_agent text,
  "timestamp" timestamptz not null default now()
);

-- ---------- Trigger: al pasar un payment a PAID se marca el servicio ----------
create or replace function public.on_payment_paid() returns trigger as $$
begin
  if new.status = 'PAID' and (old.status is distinct from 'PAID') then
    update public.services set status = 'completed'
      where id = new.service_id and status <> 'completed';
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_payment_paid on public.payments;
create trigger trg_payment_paid after update on public.payments
  for each row execute function public.on_payment_paid();
