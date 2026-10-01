'use server';
import { createClient } from '@/lib/supabase/server';
import { writeAudit } from '@/lib/audit';
import { serviceRequestSchema } from '@/lib/validations';
import { basePriceDOP } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export type CreateResult =
  | { ok: true; id: string; code: string }
  | { ok: false; error: string };

export async function createServiceRequest(raw: unknown): Promise<CreateResult> {
  const parsed = serviceRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos invalidos' };
  }
  const d = parsed.data;

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'Debes iniciar sesion' };

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', auth.user.id).single();

  const { data: inserted, error } = await supabase
    .from('service_requests')
    .insert({
      customer_id: auth.user.id,
      for_who: d.for_who,
      for_who_name: d.for_who === 'me' ? null : d.for_who_name,
      service_type: d.service_type,
      requested_date: d.requested_date,
      requested_time: d.requested_time,
      duration_minutes: Math.round(d.duration_hours * 60),
      center_name: d.center_name,
      center_address: d.center_address ?? null,
      zone: d.zone ?? null,
      target_lat: d.target_lat ?? null,
      target_lng: d.target_lng ?? null,
      observations: d.observations ?? null,
      emergency_contact_name: d.emergency_contact_name,
      emergency_contact_phone: d.emergency_contact_phone,
      emergency_contact_relationship: d.emergency_contact_relationship,
      status: 'submitted',
    })
    .select('id, code')
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la solicitud' };
  }

  // Crea el pago PENDING asociado (CONFIG_REQUIRED hasta integrar pasarela)
  await supabase.from('payments').insert({
    service_request_id: inserted.id,
    customer_id: auth.user.id,
    amount: basePriceDOP(d.duration_hours),
    currency: 'DOP',
    status: 'PENDING',
    provider: 'CONFIG_REQUIRED',
  });

  // Audit log inmutable
  await writeAudit({
    actorId: auth.user.id,
    actorRole: profile?.role ?? 'CUSTOMER',
    action: 'SERVICE_REQUEST_CREATED',
    entity: 'service_requests',
    entityId: inserted.id,
    newValue: { code: inserted.code, service_type: d.service_type },
  });

  revalidatePath('/admin/payments');
  return { ok: true, id: inserted.id, code: inserted.code };
}
