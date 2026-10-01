import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDOP, formatDate } from '@/lib/utils';
import { IssueInvoiceForm } from './issue-form';

export default async function InvoicesPage() {
  const supabase = createClient();
  const { data: invoices } = await supabase
    .from('invoices').select('*').order('created_at', { ascending: false });

  // Servicios con pago PAID pero sin factura emitida
  const { data: paid } = await supabase
    .from('payments')
    .select('service_request_id, amount, service_requests(code, service_type)')
    .eq('status', 'PAID');
  const invoicedIds = new Set((invoices ?? []).map((i) => i.service_request_id));
  const pending = (paid ?? []).filter((p: any) => p.service_request_id && !invoicedIds.has(p.service_request_id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-juntos-blue">Comprobantes fiscales (NCF)</h1>

      <Card>
        <CardHeader><CardTitle>Pendientes de emitir comprobante</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {pending.map((p: any) => (
            <div key={p.service_request_id} className="flex items-center justify-between border rounded-md p-3 flex-wrap gap-2">
              <div>
                <p className="font-medium">{p.service_requests?.code}</p>
                <p className="text-xs text-muted-foreground">{p.service_requests?.service_type} / {formatDOP(Number(p.amount))}</p>
              </div>
              <IssueInvoiceForm serviceRequestId={p.service_request_id} />
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-muted-foreground">No hay servicios pendientes de facturar.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <h2 className="font-semibold">Facturas emitidas</h2>
        {(invoices ?? []).map((i) => (
          <Link key={i.id} href={`/admin/invoices/${i.id}`}>
            <Card className="hover:shadow-md transition"><CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-mono font-semibold">{i.ncf_number}</p>
                <p className="text-xs text-muted-foreground">{formatDate(i.created_at)} / {i.company_name ?? 'Consumidor final'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-juntos-blue">{formatDOP(Number(i.total))}</p>
                <Badge variant={i.ncf_type === 'B01' ? 'default' : 'success'}>{i.ncf_type}</Badge>
              </div>
            </CardContent></Card>
          </Link>
        ))}
        {(!invoices || invoices.length === 0) && <p className="text-sm text-muted-foreground">Aun no hay facturas.</p>}
      </div>
    </div>
  );
}
