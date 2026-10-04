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
  PhoneCall, 
  User, 
  Radar,
  Radio,
  Navigation
} from 'lucide-react';

function SuccessTrackingContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const supabase = createClient();
  const [service, setService] = useState<any>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      // Consulta del servicio
      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      setService(data);

      if (data?.companion_id) {
        const { data: compData } = await supabase
          .from('profiles')
          .select('full_name, phone, role')
          .eq('id', data.companion_id)
          .maybeSingle();
        setCompanion(compData);
      }

      setLoading(false);
    }

    loadData();

    // Suscripción en tiempo real cuando un acompañante toma el servicio
    const channel = supabase
      .channel('service_tracking')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${serviceId}` },
        (payload) => {
          setService(payload.new);
          if (payload.new.companion_id) {
            supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', payload.new.companion_id)
              .maybeSingle()
              .then(({ data }) => setCompanion(data));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serviceId, supabase]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 relative z-10 space-y-6">
      
      {/* TARJETA SUPERIOR DE ESTADO */}
      <div className="bg-slate-950/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-4">
        
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            RADAR DE OPERACIONES ACTIVO • 24/7 RD
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {service?.status === 'ASSIGNED' 
            ? '¡Acompañante Asignado y en Ruta!' 
            : 'Buscando Acompañante Acreditado'}
        </h1>

        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          {service?.status === 'ASSIGNED'
            ? 'Un acompañante depurado ha aceptado tu solicitud. Los reportes iniciarán puntualmente vía WhatsApp.'
            : 'Tu solicitud está transmitiéndose a la red de acompañantes certificados más cercanos a la zona.'}
        </p>

        {/* SIMULADOR DE MAPA Y RADAR OPERATIVO */}
        <div className="relative w-full h-64 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          {/* Círculos concéntricos de radar */}
          <div className="absolute w-44 h-44 border border-emerald-500/20 rounded-full animate-pulse" />
          <div className="absolute w-28 h-28 border border-emerald-500/30 rounded-full" />
          
          {/* Punto central del usuario solicitante */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/40">
              <MapPin className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-slate-950/90 px-2 py-0.5 rounded-full border border-emerald-500/40 mt-1">
              Punto de Encuentro
            </span>
          </div>

          {/* Acompañante asignado o disponibles simulados */}
          {service?.status === 'ASSIGNED' ? (
            <div className="absolute top-12 right-16 z-10 flex items-center gap-2 bg-slate-950 border border-emerald-500 px-3 py-1.5 rounded-xl shadow-lg">
              <User className="w-4 h-4 text-emerald-400" />
              <div className="text-left text-[11px]">
                <p className="font-bold text-white">{companion?.full_name || 'Acompañante Acreditado'}</p>
                <p className="text-emerald-400 font-mono text-[9px]">EN CONTACTO DIRECTO</p>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute top-10 left-12 flex items-center gap-1 text-[10px] bg-slate-950/90 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Acompañante Piantini (Disponible)</span>
              </div>
              <div className="absolute bottom-8 right-14 flex items-center gap-1 text-[10px] bg-slate-950/90 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Acompañante Naco (Disponible)</span>
              </div>
            </>
          )}
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
            <span className="text-slate-400">Ubicación fijada:</span>
            <span className="font-bold text-white text-right max-w-xs truncate">
              {service?.facility_or_location}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Horario programado:</span>
            <span className="font-bold text-white">
              {service?.scheduled_date} • {service?.scheduled_time} ({service?.duration_hours}h)
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">Total a Pagar:</span>
            <span className="font-mono text-base font-black text-emerald-400">
              RD$ {Number(service?.rate_total || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/profile"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Mis Solicitudes y Recibos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2 transition"
          >
            <span>Volver al Inicio</span>
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
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Cargando radar...</div>}>
        <SuccessTrackingContent />
      </Suspense>
    </div>
  );
}