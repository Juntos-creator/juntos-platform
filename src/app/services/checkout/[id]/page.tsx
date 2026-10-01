import { Navbar } from '@/components/navbar';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDOP, formatDate } from '@/lib/utils';
import { CheckoutActions } from './checkout-actions';
import { notFound } from 'next/navigation';

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: sr } = await supabase
    .from('service_requests').select('*').eq('id', params.id).single();
  if (!sr) notFound();

  const { data: payment } = await supabase
    .from('payments').select('*').eq('service_request_id', params.id)
    .order('created_at', { ascending: false }).limit(1).single();

  return (
    <>
      <Navbar />
      <main className="container py-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-juntos-blue">Checkout</CardTitle>
            <p className="text-sm text-muted-foreground">Solicitud {sr.code}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Servicio</span><span>{sr.service_type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span>{formatDate(sr.requested_date)} {sr.requested_time}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Centro</span><span>{sr.center_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Duracion</span><span>{sr.duration_minutes / 60} h</span></div>
            <div className="flex justify-between border-t pt-3 text-base">
              <span className="font-semibold">Total a autorizar</span>
              <span className="font-bold text-juntos-blue">{formatDOP(Number(payment?.amount ?? 0))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estado del pago</span>
              <Badge variant={payment?.status === 'PAID' ? 'success' : 'muted'}>{payment?.status ?? 'PENDING'}</Badge>
            </div>
            {payment?.provider === 'CONFIG_REQUIRED' && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                Pasarela de pago pendiente de configurar (AZUL / CARDNET / PAYPAL).
                Puedes simular la autorizacion para la demo.
              </p>
            )}
            {payment && <CheckoutActions paymentId={payment.id} currentStatus={payment.status} />}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
