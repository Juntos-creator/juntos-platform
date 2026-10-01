import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Institution, InstitutionStatus } from '@/types/db';

const FUNNEL: InstitutionStatus[] = ['PROSPECT','CONTACTED','MEETING','PILOT_PROPOSED','PILOT_ACTIVE','CLIENT'];

const statusVariant = (s: InstitutionStatus) =>
  s === 'CLIENT' ? 'success' : s === 'PILOT_ACTIVE' ? 'default' : s === 'INACTIVE' ? 'muted' : 'warning';

export default async function InstitutionsPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const supabase = createClient();
  let query = supabase.from('institutions').select('*').order('created_at', { ascending: false });
  if (searchParams.status) query = query.eq('status', searchParams.status);
  const { data } = await query;
  let items = (data ?? []) as Institution[];
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.rnc ?? '').includes(q));
  }

  const counts = FUNNEL.map((s) => ({ s, n: items.filter((i) => i.status === s).length }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-juntos-blue">CRM B2B - Instituciones</h1>

      {/* Funnel comercial */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {counts.map(({ s, n }) => (
          <Card key={s}><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-juntos-blue">{n}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-2" action="/admin/institutions">
        <input name="q" defaultValue={searchParams.q} placeholder="Buscar por nombre o RNC"
          className="h-10 rounded-md border border-input px-3 text-sm flex-1 min-w-[200px]" />
        <select name="status" defaultValue={searchParams.status ?? ''} className="h-10 rounded-md border border-input px-3 text-sm">
          <option value="">Todos los estados</option>
          {FUNNEL.concat(['INACTIVE']).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="h-10 px-4 rounded-md bg-juntos-blue text-white text-sm">Filtrar</button>
      </form>

      {/* Lista */}
      <div className="grid gap-3">
        {items.map((i) => (
          <Link key={i.id} href={`/admin/institutions/${i.id}`}>
            <Card className="hover:shadow-md transition"><CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">RNC {i.rnc ?? '-'} / {i.type} / {i.zone ?? '-'}</p>
              </div>
              <Badge variant={statusVariant(i.status)}>{i.status}</Badge>
            </CardContent></Card>
          </Link>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No hay instituciones.</p>}
      </div>
    </div>
  );
}
