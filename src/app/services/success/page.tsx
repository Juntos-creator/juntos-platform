'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Radio, 
  Navigation
} from 'lucide-react';

function SuccessTrackingContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const supabase = createClient();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    // 1. Verificación inicial de estatus
    async function checkServiceStatus() {
      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      if (data) {
        setService(data);
        setLoading(false);

        // Si ya fue tomado por un acompañante, saltar a la sala en vivo
        if (data.status === 'ASSIGNED' || data.status === 'IN_PROGRESS') {
          window.location.href = `/services/live?id=${data.id}`;
        }
      }
    }

    checkServiceStatus();
    // Sondeo de respaldo cada 3 segundos
    const interval = setInterval(checkServiceStatus, 3000);

    // 2. Suscripción instantánea en tiempo real de Supabase
    const channel = supabase
      .channel(`dispatch_listener_${serviceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${serviceId}` },
        (payload) => {
          if (payload.new.status === 'ASSIGNED' || payload.new.status === 'IN_PROGRESS') {
            window.location.href = `/services/live?id=${payload.new.id}`;
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [serviceId, supabase]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 relative z-10 space-y-6">
      
      {/* TARJETA SUPERIOR DE ESTADO */}
      <div className="bg-slate-950/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-5">
        
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            RADAR EN VIVO • DESPACHANDO ACOMPAÑANTE
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Buscando Acompañante Acreditado
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tu requerimiento está activo en la red de acompañantes depurados PGR. Tan pronto uno acepte, esta pantalla abrirá la Sala Operativa automáticamente.
          </p>
        </div>

        {/* SIMULADOR DE RADAR SATELITAL */}
        <div className="relative w-full h-64 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <div className="absolute w-48 h-48 border border-emerald-500/20 rounded-full animate-pulse" />
          <div className="absolute w-28 h-28 border border-emerald-500/30 rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/40">
              <MapPin className="w-6 h-6 text-slate-950" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40 mt-1">
              Punto de Encuentro
            </span>
          </div>

          <div className="absolute top-8 left-10 flex items-center gap-1.5 text-[10px] bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Acompañante Piantini (Notificado)</span>
          </div>

          <div className="absolute bottom-8 right-10 flex items-center gap-1.5 text-[10px] bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded-xl text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Acompañante Naco (Disponible)</span>
          </div>
        </div>

        {/* DETALLES DEL REQUERIMIENTO */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-2.5">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Orden No.:</span>
            <span className="font-mono text-emerald-400 font-bold">
              #{serviceId ? serviceId.slice(0, 8).toUpperCase() : 'JUNTOS'}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Persona a Acompañar:</span>
            <span className="font-bold text-white">
              {service?.recipient_name || 'Cargando...'}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Lugar / Sector:</span>
            <span className="font-bold text-white text-right max-w-xs truncate">
              {service?.facility_or_location || 'Ubicación seleccionada'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">Total Liquidado:</span>
            <span className="font-mono text-base font-black text-emerald-400">
              RD$ {Number(service?.rate_total || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* BOTONES DE ENLACE */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {serviceId && (
            <Link
              href={`/services/live?id=${serviceId}`}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <span>Entrar a la Sala Operativa</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/profile"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2 transition"
          >
            <span>Ir a Mis Solicitudes</span>
          </Link>
        </div>

      </div>

    </main>
  );
}

export default function ServiceSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Conectando radar...</div>}>
        <SuccessTrackingContent />
      </Suspense>
    </div>
  );
}