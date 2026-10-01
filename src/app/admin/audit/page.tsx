import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-juntos-blue">Auditoria e historial inmutable</h1>
      <p className="text-sm text-muted-foreground">
        Solo visible para roles ADMIN y AUDITOR. Los registros no pueden editarse ni eliminarse.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 border border-destructive p-3 text-sm text-destructive">
          No autorizado o sin acceso: {error.message}
        </div>
      )}

      <div className="rounded-lg bg-juntos-blue text-green-300 font-mono text-xs p-4 h-[70vh] overflow-y-auto">
        {(data ?? []).map((l) => (
          <div key={l.id} className="border-b border-white/10 py-1.5">
            <span className="text-slate-400">[{new Date(l.timestamp).toISOString()}]</span>{' '}
            <span className="text-amber-300">{l.action}</span>{' '}
            <span className="text-white">{l.entity}:{l.entity_id?.slice(0, 8)}</span>{' '}
            <span className="text-slate-400">role={l.actor_role} actor={l.actor_id?.slice(0, 8)} ip={l.ip ?? '-'}</span>
          </div>
        ))}
        {(!data || data.length === 0) && !error && <p className="text-slate-400">Sin eventos registrados.</p>}
      </div>
    </div>
  );
}
