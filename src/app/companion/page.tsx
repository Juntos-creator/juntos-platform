'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Check, 
  User 
} from 'lucide-react';

export default function CompanionDashboard() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanionData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login?redirect=/companion';
        return;
      }
      setUser(user);

      // 1. Cargar servicios pendientes en bolsa pública
      const { data: pendings } = await supabase
        .from('service_requests')
        .select('*')
        .eq('status', 'PENDING_DISPATCH')
        .order('created_at', { ascending: false });

      setAvailableServices(pendings || []);

      // 2. Cargar mi agenda de servicios asignados
      const { data: mine } = await supabase
        .from('service_requests')
        .select('*')
        .eq('companion_id', user.id)
        .order('scheduled_date', { ascending: true });

      setMyServices(mine || []);
      setLoading(false);
    }

    loadCompanionData();
  }, [supabase]);

  async function handleClaimService(serviceId: string) {
    setClaimingId(serviceId);
    try {
      const res = await fetch('/api/services/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'No se pudo tomar el servicio.');
        return;
      }

      alert('✓ ¡Servicio asignado a tu agenda exitosamente!');
      window.location.reload();
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/80 border border-slate-800 p-6 rounded-3xl">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-400 font-mono text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> ACOMPAÑANTE CERTIFICADO PGR
            </div>
            <h1 className="text-2xl font-black text-white">Mesa de Asignación y Agenda</h1>
            <p className="text-xs text-slate-400">Regla activa: Mínimo 1 hora libre de traslado entre servicios.</p>
          </div>
        </div>

        {/* SERVICIOS EN ESPERA (BOLSA DE DISPATCH) */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>Servicios Solicitados en Vivo</span>
            <span className="text-xs bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-mono">
              {availableServices.length}
            </span>
          </h2>

          {availableServices.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              No hay solicitudes pendientes en este momento. La mesa de despacho actualiza automáticamente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableServices.map((srv) => (
                <div key={srv.id} className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                        {srv.service_type}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">{srv.recipient_name}</h4>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      RD$ {Number(srv.rate_total || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-400">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{srv.scheduled_date || srv.requested_date} a las {srv.scheduled_time} ({srv.duration_hours}h)</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{srv.facility_or_location}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={claimingId === srv.id}
                    onClick={() => handleClaimService(srv.id)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{claimingId === srv.id ? 'Validando agenda...' : 'Tomar este Servicio'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MI AGENDA CONFIRMADA */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>Mi Agenda de Servicios Asignados</span>
            <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
              {myServices.length}
            </span>
          </h2>

          <div className="space-y-3">
            {myServices.map((mine) => (
              <div key={mine.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{mine.recipient_name}</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono text-[10px]">
                      {mine.status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{mine.facility_or_location}</p>
                </div>

                <div className="text-left sm:text-right font-mono">
                  <p className="text-emerald-400 font-bold">{mine.scheduled_date} • {mine.scheduled_time}</p>
                  <p className="text-[11px] text-slate-500">{mine.duration_hours} Horas (+1h traslado reservada)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}