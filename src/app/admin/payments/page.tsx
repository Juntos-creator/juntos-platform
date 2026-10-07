'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-slate-300">
          Cargando información del pago…
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id') || '';
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadPayment() {
      if (!serviceId) {
        setError('No se indicó el servicio que deseas consultar.');
        setLoading(false);
        return;
      }

      const { data, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('service_request_id', serviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (paymentError) {
        setError('No se pudo cargar la información del pago.');
      } else if (!data) {
        setError('Todavía no hay un pago registrado para este servicio.');
      } else {
        setPayment(data);
      }

      setLoading(false);
    }

    void loadPayment();

    return () => {
      mounted = false;
    };
  }, [serviceId, supabase]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-black">Información de pago</h1>
          <p className="mt-2 text-sm text-slate-400">
            Servicio #{serviceId.slice(0, 8).toUpperCase()}
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Cargando pago…</p>
          ) : error ? (
            <p className="mt-6 rounded-xl border border-amber-700 bg-amber-950/50 p-4 text-sm text-amber-200">
              {error}
            </p>
          ) : payment ? (
            <div className="mt-6 space-y-3 text-sm">
              <p>
                Estado:{' '}
                <strong className="text-emerald-400">
                  {payment.status || 'No especificado'}
                </strong>
              </p>
              <p>
                Monto:{' '}
                <strong>
                  RD$ {Number(payment.amount || 0).toLocaleString('es-DO')}
                </strong>
              </p>
              <p>
                Método:{' '}
                <strong>{payment.payment_method || 'No especificado'}</strong>
              </p>

              <Link
                href={`/services/receipt?id=${encodeURIComponent(serviceId)}`}
                className="mt-4 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
              >
                Ver recibo
              </Link>
            </div>
          ) : null}
        </section>

        <Link
          href="/"
          className="inline-flex rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}