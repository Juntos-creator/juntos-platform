import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

type AuditInput = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity?: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
};

// Inserta un registro inmutable en audit_logs usando service_role (bypass RLS).
export async function writeAudit(input: AuditInput) {
  const h = headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    null;
  const userAgent = h.get('user-agent') ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from('audit_logs').insert({
    actor_id: input.actorId ?? null,
    actor_role: input.actorRole ?? null,
    action: input.action,
    entity: input.entity ?? null,
    entity_id: input.entityId ?? null,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    ip,
    user_agent: userAgent,
  });
  if (error) console.error('[audit] insert error:', error.message);
}
