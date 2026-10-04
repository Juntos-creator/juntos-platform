'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Check, 
  User,
  Navigation,
  ExternalLink,
  LocateFixed,
  Compass,
  Radio,
  ArrowRight
} from 'lucide-react';

const DEFAULT_LAT = 18.486058;
const DEFAULT_LNG = -69.931212;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function CompanionDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Ubicación del Acompañante
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG
  });
  const [locationName, setLocationName] = useState('Distrito Nacional / Santo Domingo');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLocationName('Ubicación GPS Actual');
        },
        () => console.log('Ubicación referencial SD')
      );
    }

    async function loadCompanionData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login?redirect=/companion';
        return;
      }
      setUser(user);

      // 1. Servicios disponibles en bolsa
      const { data: pendings } = await supabase
        .from('service_requests')
        .select('*')
        .eq('status', 'PENDING_DISPATCH')
        .order('created_at', { ascending: false });

      const withDistance = (pendings || []).map((srv) => {
        let srvLat = srv.geo_lat ? Number(srv.geo_lat) : 18.475;
        let srvLng = srv.geo_lng ? Number(srv.geo_lng) : -69.935;

        if (!srv.geo_lat) {
          if (srv.facility_or_location?.includes('CEDIMAT')) {
            srvLat = 18.4872;
            srvLng = -69.9248;
          } else if (srv.facility_or_location?.includes('Santiago')) {
            srvLat = 19.4517;
            srvLng = -70.6970;
          }
        }

        const dist = calculateDistance(myLocation.lat, myLocation.lng, srvLat, srvLng);
        return { ...srv, distanceKm: dist, targetLat: srvLat, targetLng: srvLng };
      });

      withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
      setAvailableServices(withDistance);

      // 2. Mis servicios aceptados
      const { data: mine } = await supabase
        .from('service_requests')
        .select('*')
        .eq('companion_id', user.id)
        .order('scheduled_date', { ascending: true });

      setMyServices(mine || []);
      setLoading(false);
    }

    loadCompanionData();
  }, [supabase, myLocation.lat, myLocation.lng]);

  // Al tomar el servicio: redirección directa a /services/live?id=... (Query Param seguro)
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

      // Redirección inmediata a la sala en vivo con query param
      window.location.href = `/services/live?id=${serviceId}`;
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setClaimingId(null);
    }
  }

  const closestService = availableServices.length > 0 ? availableServices[0] : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-400 font-mono text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> ACOMPAÑANTE CERTIFICADO PGR
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Mesa de Asignación y Agenda</h1>
            <p className="text-xs text-slate-400 mt-1">
              Geolocalización en tiempo real • Sala de operaciones con doble PIN (Check-In y Check-Out).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-2xl text-xs font-mono">
            <LocateFixed className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">{locationName}</span>
          </div>
        </div>

        {/* ALERTA DE SERVICIO CERCANO */}
        {closestService && (
          <div className="bg-gradient-to-r from-emerald-950/80 to-slate-950 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/30">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  ¡SERVICIO MÁS CERCANO A TI!
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {closestService.recipient_name} • A solo {closestService.distanceKm} km de tu posición
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">{closestService.facility_or_location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${closestService.targetLat},${closestService.targetLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Compass className="w-4 h-4 text-emerald-400" /> Ver Ruta
              </a>

              <button
                type="button"
                disabled={claimingId === closestService.id}
                onClick={() => handleClaimService(closestService.id)}
                className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition"
              >
                <Check className="w-4 h-4" />
                <span>{claimingId === closestService.id ? 'Asignando...' : 'Tomar e Iniciar Sala'}</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTENEDOR EN DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA 1 Y 2: RADAR Y BOLSA DE SERVICIOS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* RADAR SATELITAL */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Radar Satelital de Servicios Activos
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  {availableServices.length} en espera de asignación
                </span>
              </div>

              <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
                <div className="absolute w-64 h-64 border border-emerald-500/10 rounded-full" />
                <div className="absolute w-44 h-44 border border-emerald-500/20 rounded-full animate-pulse" />
                <div className="absolute w-24 h-24 border border-emerald-500/30 rounded-full" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/40">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 bg-emerald-400 px-2 py-0.5 rounded-full mt-1">
                    Mi Posición
                  </span>
                </div>

                {availableServices.map((srv, idx) => {
                  const offsets = [
                    { top: '20%', left: '25%' },
                    { top: '30%', right: '22%' },
                    { bottom: '25%', left: '35%' },
                    { bottom: '20%', right: '28%' }
                  ];
                  const pos = offsets[idx % offsets.length];

                  return (
                    <div 
                      key={srv.id} 
                      style={pos}
                      className="absolute z-10 flex items-center gap-1.5 bg-slate-950/95 border border-emerald-500/60 px-2.5 py-1 rounded-xl text-[10px] shadow-lg cursor-pointer hover:scale-105 transition"
                      onClick={() => handleClaimService(srv.id)}
                    >
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="font-bold text-white truncate max-w-[120px]">{srv.recipient_name}</span>
                      <span className="text-emerald-400 font-mono font-bold">({srv.distanceKm} km)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LISTADO DE SERVICIOS DISPONIBLES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Bolsa de Servicios en Vivo</span>
                  <span className="text-xs bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {availableServices.length}
                  </span>
                </h2>
                <span className="text-xs text-slate-400">Ordenados por distancia</span>
              </div>

              {availableServices.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
                  No hay servicios pendientes en tu zona en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.map((srv) => (
                    <div 
                      key={srv.id} 
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 space-y-4 transition shadow-lg relative flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                              {srv.service_type}
                            </span>
                            <h4 className="font-bold text-white text-sm mt-1">{srv.recipient_name}</h4>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-emerald-400 text-sm block">
                              RD$ {Number(srv.rate_total || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-800/40">
                              a {srv.distanceKm} km
                            </span>
                          </div>
                        </div>

                        <div className="text-xs space-y-1.5 text-slate-400">
                          <p className="flex items-center gap-2 text-slate-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{srv.scheduled_date || srv.requested_date} • {srv.scheduled_time} ({srv.duration_hours}h)</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{srv.facility_or_location}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80 mt-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${srv.targetLat},${srv.targetLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-xl transition"
                          title="Abrir ruta en Google Maps"
                        >
                          <Compass className="w-4 h-4 text-emerald-400" />
                        </a>

                        <button
                          type="button"
                          disabled={claimingId === srv.id}
                          onClick={() => handleClaimService(srv.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{claimingId === srv.id ? 'Asignando...' : 'Tomar e Ir a la Sala'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA 3: MINI CALENDARIO Y ENTRADA DIRECTA A LA SALA OPERATIVA */}
          <div className="space-y-6">
            
            {/* MINI CALENDARIO */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" /> Mi Calendario y Turnos
                </h3>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">
                  {myServices.length} Agendados
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-slate-400 pb-2">
                <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                {Array.from({ length: 14 }).map((_, i) => {
                  const dayNum = i + 1;
                  const hasService = myServices.some(s => s.scheduled_date?.endsWith(`-${dayNum < 10 ? '0' + dayNum : dayNum}`));
                  return (
                    <div 
                      key={i} 
                      className={`py-2 rounded-xl border text-[11px] font-mono transition ${
                        hasService 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-900/60 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 leading-tight border-t border-slate-800/60 pt-3">
                🔒 <strong>Regla de Traslado Automática:</strong> El sistema bloquea citas con menos de 1 hora de margen entre servicios.
              </p>
            </div>

            {/* MIS SERVICIOS ACEPTADOS CON ACCESO DIRECTO A SALA EN VIVO */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Mis Servicios Aceptados
              </h3>

              {myServices.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No has aceptado servicios todavía.</p>
              ) : (
                <div className="space-y-3">
                  {myServices.map((mine) => {
                    const isCompleted = mine.status === 'COMPLETED';
                    const isInProgress = mine.status === 'IN_PROGRESS';

                    return (
                      <div 
                        key={mine.id}
                        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white text-sm">{mine.recipient_name}</span>
                          <span className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold border ${
                            isCompleted 
                              ? 'bg-slate-800 text-slate-400 border-slate-700' 
                              : isInProgress
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40 animate-pulse'
                              : 'bg-blue-950 text-blue-400 border-blue-800/40'
                          }`}>
                            {mine.status}
                          </span>
                        </div>

                        <p className="text-slate-400 text-[11px] truncate">{mine.facility_or_location}</p>

                        <div className="flex justify-between items-center font-mono text-[10px] text-slate-400 border-t border-slate-800/60 pt-2">
                          <span className="text-emerald-400 font-bold">{mine.scheduled_date} • {mine.scheduled_time}</span>
                          <span>{mine.duration_hours}h (+1h traslado)</span>
                        </div>

                        {/* ENLACE DIRECTO A LA SALA CON QUERY PARAM (SIN 404) */}
                        <Link
                          href={`/services/live?id=${mine.id}`}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition mt-2"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Abrir Sala Operativa (Check-In & Chat)</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}