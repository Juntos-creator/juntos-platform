import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function InstitutionDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: inst } = await supabase.from('institutions').select('*').eq('id', params.id).single();
  if (!inst) notFound();
  const { data: pilots } = await supabase.from('pilots').select('*').eq('institution_id', params.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/institutions" className="text-sm text-juntos-blue">&larr; Volver al CRM</Link>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-juntos-blue">{inst.name}</CardTitle>
          <Badge variant={inst.status === 'CLIENT' ? 'success' : 'default'}>{inst.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">RNC</span><span>{inst.rnc ?? '-'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{inst.type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Zona</span><span>{inst.zone ?? '-'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Contacto</span><span>{inst.contact_name ?? '-'} ({inst.contact_role ?? '-'})</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{inst.contact_email ?? '-'}</span></div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold mb-2">Pilotos</h2>
        <div className="grid gap-2">
          {(pilots ?? []).map((p) => (
            <Link key={p.id} href={`/admin/pilots/${p.id}`}>
              <Card className="hover:shadow-md transition"><CardContent className="p-4 flex justify-between">
                <span>Piloto {formatDate(p.start_date)} - {p.end_date ? formatDate(p.end_date) : '...'}</span>
                <Badge variant="success">{p.status}</Badge>
              </CardContent></Card>
            </Link>
          ))}
          {(!pilots || pilots.length === 0) && <p className="text-sm text-muted-foreground">Sin pilotos activos.</p>}
        </div>
      </div>
    </div>
  );
}
