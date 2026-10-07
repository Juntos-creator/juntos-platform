'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { ArrowRight, CheckCircle2, CreditCard } from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const [service, setService] = useState<any>(null);
  const [, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadService() {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      setService(data);
      setLoading(false);
    }

    void loadService();
  }, [serviceId, supabase]);

  const totalAmount = Number(service?.rate_total || service?.total_amount || 1500);

  return (
    <main className="max-w-xl mx-auto p-6 flex-1 flex flex-col justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
            Servicio Finalizado & Liquidado
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Resumen de Pago</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            #{serviceId ? String(serviceId).slice(0, 8).toUpperCase() : '---'}
          </p>
        </div>

        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3 text-left text-sm">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-xs text-slate-400">Solicitante / Usuario:</span>
            <span className="font-bold text-white">
              {service?.recipient_name || service?.client_name || 'Don Manuel Peña'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-xs text-slate-400">Método de liquidación:</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Cobro Automático / Tarjeta
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300 pt-3 border-t border-slate-800">
            <span className="font-black text-slate-200">Total Liquidado:</span>
            <span className="font-mono text-xl font-black text-emerald-400">
              RD$ {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/services/live?id=${serviceId}`}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <span>Sala Operativa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/profile"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <span>Mis Solicitudes</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ServicePaymentPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Cargando liquidación...</div>}>
        <PaymentContent />
      </Suspense>
    </div>
  );
}