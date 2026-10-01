'use server';
import { createClient } from '@/lib/supabase/server';
import { writeAudit } from '@/lib/audit';
import { metricSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function addPilotMetric(pilotId: string, raw: unknown) {
  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos invalidos' };

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'No autenticado' };

  const { error } = await supabase.from('pilot_metrics').insert({ pilot_id: pilotId, ...parsed.data });
  if (error) return { ok: false, error: error.message };

  await writeAudit({
    actorId: auth.user.id, action: 'PILOT_METRIC_ADDED', entity: 'pilot_metrics',
    entityId: pilotId, newValue: parsed.data,
  });
  revalidatePath(`/admin/pilots/${pilotId}`);
  return { ok: true };
}
