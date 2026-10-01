-- =====================================================================
-- JUNTOS - Datos de ejemplo (seed) para demo del CRM / pilotos
-- Migracion 0003 (opcional)
-- =====================================================================

insert into public.institutions (name, rnc, type, zone, contact_name, contact_role, contact_email, status) values
  ('CEDIMAT', '401000001', 'hospital', 'Distrito Nacional', 'Dra. Perez', 'Directora Medica', 'contacto@cedimat.do', 'PILOT_ACTIVE'),
  ('Clinica Abreu', '401000002', 'clinica', 'Gazcue', 'Lic. Gomez', 'Gerente', 'info@abreu.do', 'MEETING'),
  ('HOMS Santiago', '401000003', 'hospital', 'Santiago', 'Dr. Reyes', 'Coordinador', 'homs@homs.do', 'PROSPECT'),
  ('Hospiten Santo Domingo', '401000004', 'hospital', 'Santo Domingo Este', 'Sra. Nunez', 'Admin', 'sd@hospiten.do', 'CONTACTED')
on conflict do nothing;

-- Piloto activo de ejemplo para CEDIMAT + 2 semanas de metricas
do $$
declare inst uuid; pil uuid;
begin
  select id into inst from public.institutions where name = 'CEDIMAT' limit 1;
  if inst is not null then
    insert into public.pilots (institution_id, start_date, end_date, status)
    values (inst, current_date - 14, current_date + 16, 'ACTIVE')
    returning id into pil;

    insert into public.pilot_metrics (pilot_id, week_number, services_count, satisfaction_avg, incidents_count, response_time_avg_minutes, repeat_rate, feedback) values
      (pil, 1, 42, 4.70, 0, 22, 24.0, 'Buen arranque, familias satisfechas.'),
      (pil, 2, 55, 4.60, 1, 25, 28.5, 'Un incidente menor resuelto en sitio.');
  end if;
end $$;
