import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDOP, formatDateTime } from '@/lib/utils';
import { PaymentRowActions } from './row-actions';
import type { PaymentStatus } from '@/types/db';

const variant = (s: PaymentStatus) =>
  s === 'PAID' ? 'success' : s === 'PENDING' ? 'muted' : s === 'FAILED' || s === 'CANCELLED' ? 'destructive' : 'warning';

export default async function PaymentsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('payments')
    .select('*, service_requests(code, service_type)')
    .order('created_at', { ascending: false });
  const payments = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-juntos-blue">Pagos</h1>
      <div className="grid gap-3">
        {payments.map((p: any) => (
          <Card key={p.id}><CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold">{p.service_requests?.code ?? '-'}</p>
              <p className="text-xs text-muted-foreground">{p.service_requests?.service_type} / {formatDateTime(p.created_at)}</p>
              <p className="text-xs text-muted-foreground">Proveedor: {p.provider}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-juntos-blue">{formatDOP(Number(p.amount))}</p>
              <Badge variant={variant(p.status)}>{p.status}</Badge>
            </div>
            <PaymentRowActions paymentId={p.id} status={p.status} />
          </CardContent></Card>
        ))}
        {payments.length === 0 && <p className="text-sm text-muted-foreground">No hay pagos.</p>}
      </div>
    </div>
  );
}
