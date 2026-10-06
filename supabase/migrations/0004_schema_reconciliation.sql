-- ==============================================================================
-- JUNTOS PLATFORM - MIGRACION 0004: RECONCILIACION INTEGRAL DE ESQUEMA (P1)
-- ==============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDIENTE',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS companion_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS facility_or_location text,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_time time,
  ADD COLUMN IF NOT EXISTS duration_hours integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS checkin_pin text,
  ADD COLUMN IF NOT EXISTS checkout_pin text,
  ADD COLUMN IF NOT EXISTS pin_start text,
  ADD COLUMN IF NOT EXISTS pin_end text,
  ADD COLUMN IF NOT EXISTS checkin_location text,
  ADD COLUMN IF NOT EXISTS checkout_location text,
  ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 1350.00,
  ADD COLUMN IF NOT EXISTS companion_fee numeric(10,2) DEFAULT 750.00,
  ADD COLUMN IF NOT EXISTS platform_margin numeric(10,2) DEFAULT 600.00,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS emergency_status text DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS rating integer,
  ADD COLUMN IF NOT EXISTS review_comment text,
  ADD COLUMN IF NOT EXISTS special_notes text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

CREATE TABLE IF NOT EXISTS public.service_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid REFERENCES public.service_requests(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  companion_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companion_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  numero_documento text NOT NULL,
  telefono text,
  correo text,
  ciudad text,
  estado text DEFAULT 'PENDIENTE',
  notas_rrhh text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
