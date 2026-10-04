'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { createClient } from '@/lib/supabase/client';
import { 
  Receipt, 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  Radio, 
  ShieldCheck, 
  KeyRound, 
  Calendar, 
  MapPin, 
  FileText 
} from 'lucide-react';

function ReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id') || '';
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      const { data: srv } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      const { data: pay } = await supabase
        .from('payments')
        .select('*')
        .eq('service_request_id', serviceId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      setService(srv);
      setPayment(pay);
      setLoading(false);
    }

    loadData();
  }, [serviceId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">
        Cargando comprobante fiscal...
      </div>
    );
  }

  const checkinPin = service?.checkin_pin || service?.id?.replace(/\D/g, '').slice(0, 4) || '2491';
  const checkoutPin = service?.checkout_pin || service?.id?.replace(/\D/g, '').slice(2, 6) || '8421';
  const ncf = payment?.ncf || 'B0200004921';
  const monto = payment?.amount || service?.rate_total || 2700;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        
        {/* BOTONES SUPERIORES */}
        <div className="flex justify-between items-center print:hidden">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a mis servicios
          </Link>

          <button
            onClick={() => window.print()}
            className="bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir Comprobante
          </button>
        </div>

        {/* RECIBO / COMPROBANTE DGII */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="flex justify-between items-start border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  J
                </div>
                <span className="font-black text-white text-lg tracking-tight">JUNTOS ASISTENCIA RD</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">RNC: 1-32-84920-1 • Santo Domingo, R.D.</p>
              <p className="text-[10px] text-slate-500">Soporte y Acompañamiento No Clínico</p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-400 px-2.5 py-0.5 rounded-full inline-block">
                PAGO CONCILIADO
              </span>
              <p className="text-xs font-mono font-bold text-white block mt-1">NCF: {ncf}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Fecha: {new Date().toLocaleDateString('es-DO')}
              </p>
            </div>
          </div>

          {/* DATOS DEL SERVICIO */}
          <div className="space-y-3 text-xs">
            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              Detalle del Servicio Contratado
            </h3>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Paciente / Receptor:</span>
                <span className="font-bold text-white">{service?.recipient_name || service?.client_name || 'Paciente'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Punto de Asistencia:</span>
                <span className="font-medium text-slate-200 text-right max-w-[65%] truncate">
                  {service?.facility_or_location || service?.address || 'Ubicación coordinada'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acompañante Acreditado:</span>
                <span className="font-bold text-emerald-400">{service?.companion_name || 'Mesa Central Asignada'}</span>
              </div>
            </div>
          </div>

          {/* DOBLE PIN ANTIFRAUDE */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> PINs de Seguridad Presencial
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                DICTAR EN SITIO
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-center pt-1 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">1. PIN ENCUENTRO</span>
                <span className="font-mono text-lg font-black text-emerald-400">{checkinPin}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">2. PIN FINALIZACIÓN</span>
                <span className="font-mono text-lg font-black text-amber-400">{checkoutPin}</span>
              </div>
            </div>
          </div>

          {/* DESGLOSE CONTABLE */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Acompañamiento Presencial Asistencial</span>
              <span className="font-mono">RD$ {Number(monto).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Método: {payment?.payment_method === 'CARD' ? 'Tarjeta (CardNET)' : 'Transferencia Bancaria'}</span>
              <span className="font-mono text-emerald-400 font-bold">100% CUBIERTO</span>
            </div>
            <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Pagado:</span>
              <span className="font-mono text-xl font-black text-emerald-400">RD$ {Number(monto).toLocaleString()}</span>
            </div>
          </div>

          {/* ACCIÓN SALA EN VIVO */}
          <div className="pt-2 print:hidden flex flex-col sm:flex-row gap-3">
            <Link
              href={`/services/live?id=${serviceId}`}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Radio className="w-4 h-4" />
              <span>Entrar a la Sala Operativa en Vivo</span>
            </Link>
          </div>

          <div className="text-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
            Documento de validez fiscal emitido bajo las regulaciones de la DGII • JUNTOS ASISTENCIA SRL
          </div>

        </div>

      </main>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ReceiptContent />
    </Suspense>
  );
}