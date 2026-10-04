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
  Calendar,
  Clock,
  MapPin,
  PhoneCall,
  User,
  HeartHandshake
} from 'lucide-react';

function SuccessTrackingContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const supabase = createClient();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadService() {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('service_requests')
          .select('*')
          .eq('id', serviceId)
          .maybeSingle();

        setService(data);
      } catch (err) {
        console.error('Error al cargar servicio:', err);
      } finally {
        setLoading(false);
      }
    }

    loadService();
  }, [serviceId, supabase]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 relative z-10 space-y-6">
      
      {/* TARJETA PRINCIPAL DE SEGUIMIENTO */}
      <div className="bg-slate-950/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl text-center space-y-5">
        
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="bg-emerald-950 text-emerald-400 font-mono text-xs px-3 py-1 rounded-full border border-emerald-600/40 font-bold">
            SOLICITUD REGISTRADA EXITOSAMENTE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Mesa de Operaciones Notificada
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tu solicitud está en la Mesa Central. Un acompañante acreditado y depurado por la PGR será asignado a la brevedad.
          </p>
        </div>

        {/* DETALLE Y ESTADO EN VIVO */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3">
          <div className="flex justify-between border-b border-slate-800 pb-2.5">
            <span className="text-slate-400">Número de Orden:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              #{serviceId ? serviceId.slice(0, 8).toUpperCase() : 'JUNTOS-RD'}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-800 pb-2.5 items-center">
            <span className="text-slate-400">Estado de Despacho:</span>
            <span className="bg-amber-950/80 text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-800/40 font-mono text-[11px] animate-pulse">
              ● EN PROCESO DE ASIGNACIÓN
            </span>
          </div>

          {service ? (
            <>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Persona a Acompañar:</span>
                <span className="font-bold text-white">{service.recipient_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Fecha y Hora Programada:</span>
                <span className="font-bold text-white">
                  {service.scheduled_date || service.requested_date} • {service.scheduled_time}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Lugar / Sector:</span>
                <span className="font-bold text-white text-right max-w-[240px] truncate">
                  {service.facility_or_location}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Duración:</span>
                <span className="font-bold text-white">{service.duration_hours} Horas</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Total:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  RD$ {Number(service.rate_total || 0).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-center py-2">Cargando detalles de la orden...</p>
          )}

          <div className="flex items-start gap-2.5 pt-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Seguridad JUNTOS: Acompañante con verificación penal PGR y reporte continuo vía WhatsApp.
            </span>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/profile"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <span>Ver Mis Solicitudes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2 transition"
          >
            <span>Ir a la Página de Inicio</span>
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
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Cargando seguimiento...</div>}>
        <SuccessTrackingContent />
      </Suspense>
    </div>
  );
}