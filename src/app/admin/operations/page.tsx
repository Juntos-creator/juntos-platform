'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  Radio, 
  Clock, 
  History, 
  FileText, 
  PhoneCall, 
  ShieldCheck, 
  CheckCircle2, 
  UserPlus, 
  X,
  Play,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  Send,
  MessageCircle,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

interface SolicitudServicio {
  id: string;
  client_name?: string;
  recipient_name?: string;
  companion_name?: string;
  client_phone?: string;
  recipient_phone?: string;
  companion_phone?: string;
  status: string;
  created_at: string;
  scheduled_date?: string;
  notes?: string;
  special_notes?: string;
  facility_or_location?: string;
  address?: string;
  checkin_pin?: string;
  checkout_pin?: string;
  emergency_status?: 'NORMAL' | 'SOS_ACTIVE';
}

export default function MesaOperacionesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  const [tab, setTab] = useState<'EN_CURSO' | 'POSTERIORES' | 'PREVIOS' | 'EXPEDIENTES'>('EN_CURSO');
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [acompanantesActivos, setAcompanantesActivos] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [chatMensajes, setChatMensajes] = useState<any[]>([]);
  const [nuevoMensajeAdmin, setNuevoMensajeAdmin] = useState('');
  const [nuevaNota, setNuevaNota] = useState('');
  const [asignarModal, setAsignarModal] = useState(false);
  const [acompananteSeleccionado, setAcompananteSeleccionado] = useState('');

  useEffect(() => {
    async function verificarPermisosAdmin() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login?redirect=/admin/operations');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const esAdmin = 
        profile?.role === 'ADMIN' || 
        user.user_metadata?.role === 'ADMIN' || 
        user.email?.toLowerCase() === 'odel_kiss@hotmail.com';

      if (!esAdmin) {
        alert('⛔ Acceso restringido a la Mesa Central de Operaciones.');
        router.replace('/');
        return;
      }

      setCurrentAdmin(user);
      setIsAuthorized(true);
      setAuthChecking(false);
      cargarDatos();
    }

    verificarPermisosAdmin();
  }, [router, supabase]);

  async function cargarDatos() {
    setLoading(true);

    const { data: srvData } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (srvData && srvData.length > 0) {
      const mapeados = srvData.map(srv => ({
        ...srv,
        client_name: srv.recipient_name || srv.client_name || 'Paciente',
        address: srv.facility_or_location || srv.address || 'Ubicación coordinada',
        scheduled_date: srv.scheduled_date || srv.requested_date,
        notes: srv.special_notes || srv.notes,
        client_phone: srv.recipient_phone || srv.client_phone || '809-541-2000',
        checkin_pin: srv.checkin_pin || srv.id.replace(/\D/g, '').slice(0, 4) || '2491',
        checkout_pin: srv.checkout_pin || srv.id.replace(/\D/g, '').slice(2, 6) || '8421'
      }));

      setSolicitudes(mapeados);
      if (!selectedItem && tab !== 'EXPEDIENTES') setSelectedItem(mapeados[0]);
    } else {
      setSolicitudes([]);
    }

    const { data: apps } = await supabase.from('companion_applications').select('*');
    setExpedientes(apps || []);

    const { data: activos } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'COMPANION');
    setAcompanantesActivos(activos || []);

    setLoading(false);
  }

  async function cambiarEstadoServicio(serviceId: string, nuevoEstado: string) {
    setUpdating(true);
    await supabase.from('service_requests').update({ status: nuevoEstado }).eq('id', serviceId);
    setSelectedItem((prev: any) => ({ ...prev, status: nuevoEstado }));
    cargarDatos();
    setUpdating(false);
  }

  async function toggleAlertaSOS(servicio: SolicitudServicio) {
    const nuevoEstado = servicio.emergency_status === 'SOS_ACTIVE' ? 'NORMAL' : 'SOS_ACTIVE';
    setUpdating(true);
    await supabase.from('service_requests').update({ emergency_status: nuevoEstado }).eq('id', servicio.id);
    setSelectedItem((prev: any) => ({ ...prev, emergency_status: nuevoEstado }));
    cargarDatos();
    setUpdating(false);
  }

  async function handleAsignarAcompanante() {
    if (!acompananteSeleccionado || !selectedItem) return;
    const acomp = acompanantesActivos.find(a => a.id === acompananteSeleccionado);
    if (!acomp) return;

    setUpdating(true);
    await supabase.from('service_requests').update({
      companion_id: acomp.id,
      companion_name: acomp.full_name,
      companion_phone: acomp.phone,
      status: 'ASSIGNED'
    }).eq('id', selectedItem.id);

    setSelectedItem((prev: any) => ({
      ...prev,
      companion_id: acomp.id,
      companion_name: acomp.full_name,
      companion_phone: acomp.phone,
      status: 'ASSIGNED'
    }));
    setAsignarModal(false);
    cargarDatos();
    setUpdating(false);
  }

  async function handleAgregarNota(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaNota.trim() || !selectedItem) return;

    const anterior = selectedItem.notes ? `${selectedItem.notes}\n` : '';
    const nueva = `${anterior}[${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} Mesa]: ${nuevaNota.trim()}`;

    setUpdating(true);
    await supabase.from('service_requests').update({ special_notes: nueva }).eq('id', selectedItem.id);
    setSelectedItem((prev: any) => ({ ...prev, notes: nueva }));
    setNuevaNota('');
    setUpdating(false);
    cargarDatos();
  }

  function enviarWhatsApp(servicio: SolicitudServicio) {
    const tel = (servicio.client_phone || '').replace(/[^0-9]/g, '');
    const num = tel.length === 10 ? '1' + tel : tel;
    const msg = `🟢 *JUNTOS ASISTENCIA RD*\n\nHola ${servicio.client_name}, te confirmamos tu servicio:\n📍 Lugar: ${servicio.address}\n👤 Acompañante: ${servicio.companion_name || 'En camino'}\n🔑 PIN Inicio: ${servicio.checkin_pin}\n🔑 PIN Salida: ${servicio.checkout_pin}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <ShieldAlert className="w-8 h-8 text-emerald-400 animate-pulse" />
        <p className="text-xs font-mono tracking-widest uppercase">Cargando Mesa Central de Operaciones...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const serviciosFiltrados = solicitudes.filter(s => {
    const st = (s.status || '').toUpperCase();
    if (tab === 'EN_CURSO') return ['IN_PROGRESS', 'ASSIGNED', 'PENDING_DISPATCH', 'EN_CURSO', 'SCHEDULED'].includes(st);
    if (tab === 'POSTERIORES') return ['AGENDADO'].includes(st);
    if (tab === 'PREVIOS') return ['COMPLETED', 'CANCELLED', 'FINALIZADO'].includes(st);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col pb-16 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                DESPACHO & COMANDO EN VIVO 24/7
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Mesa de Operaciones Central JUNTOS
            </h1>
          </div>

          <button 
            onClick={cargarDatos}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition"
          >
            ↻ Sincronizar
          </button>
        </div>
      </div>

      <div className="bg-slate-950/80 border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setTab('EN_CURSO'); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'EN_CURSO' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Servicios en Curso ({serviciosFiltrados.length})</span>
          </button>

          <button
            onClick={() => { setTab('PREVIOS'); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'PREVIOS' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial Concluidos</span>
          </button>

          <button
            onClick={() => { setTab('EXPEDIENTES'); setSelectedItem(expedientes[0] || null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'EXPEDIENTES' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Expedientes RRHH ({expedientes.length})</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LISTADO LATERAL */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
          {tab !== 'EXPEDIENTES' ? (
            serviciosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-3xl border border-slate-800 text-xs">
                No hay servicios activos en esta bandeja.
              </div>
            ) : (
              serviciosFiltrados.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedItem(s)}
                  className={`p-4 rounded-3xl border cursor-pointer transition shadow-lg ${
                    s.emergency_status === 'SOS_ACTIVE'
                      ? 'bg-rose-950/60 border-rose-600 animate-pulse'
                      : selectedItem?.id === s.id
                      ? 'bg-slate-950 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                        #{s.id.slice(0, 8).toUpperCase()}
                      </span>
                      <h3 className="font-black text-white text-sm mt-1.5">{s.client_name}</h3>
                      <p className="text-[11px] text-emerald-400">{s.companion_name ? `Acomp: ${s.companion_name}` : '⚠️ Sin asignar'}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {s.status}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            expedientes.map((exp, idx) => (
              <div
                key={exp.id || idx}
                onClick={() => setSelectedItem(exp)}
                className={`p-4 rounded-3xl border cursor-pointer transition shadow-lg ${
                  selectedItem?.id === exp.id ? 'bg-slate-950 border-emerald-500' : 'bg-slate-950/70 border-slate-800/80'
                }`}
              >
                <h3 className="font-bold text-white text-sm">{exp.nombre || 'Postulante'}</h3>
                <p className="text-xs text-slate-400 font-mono">Cédula: {exp.numero_documento || 'S/N'}</p>
              </div>
            ))
          )}
        </div>

        {/* DETALLE Y COMANDO */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[750px] overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white">{selectedItem.client_name || selectedItem.nombre}</h2>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedItem.id}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleAlertaSOS(selectedItem)}
                    className={`text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition ${
                      selectedItem.emergency_status === 'SOS_ACTIVE' ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> SOS
                  </button>

                  <button
                    onClick={() => setAsignarModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <UserPlus className="w-4 h-4" /> Despachar Personal
                  </button>

                  {selectedItem.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => cambiarEstadoServicio(selectedItem.id, 'IN_PROGRESS')}
                      className="bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      <Play className="w-3.5 h-3.5 inline mr-1" /> Iniciar
                    </button>
                  )}

                  {selectedItem.status !== 'COMPLETED' && (
                    <button
                      onClick={() => cambiarEstadoServicio(selectedItem.id, 'COMPLETED')}
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      <CheckSquare className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Finalizar
                    </button>
                  )}
                </div>
              </div>

              {/* PINS ANTIFRAUDE */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> PINs de Validación Presencial
                </span>
                <div className="grid grid-cols-2 gap-3 text-center pt-1">
                  <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 block">1. PIN ENCUENTRO</span>
                    <span className="font-mono text-xl font-black text-emerald-400">{selectedItem.checkin_pin}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 block">2. PIN SALIDA</span>
                    <span className="font-mono text-xl font-black text-amber-400">{selectedItem.checkout_pin}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selectedItem.client_phone}`}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center text-xs font-bold text-slate-300"
                >
                  <PhoneCall className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Llamar Paciente
                </a>
                <button
                  onClick={() => enviarWhatsApp(selectedItem)}
                  className="bg-emerald-500 text-slate-950 p-2.5 rounded-xl text-center text-xs font-black"
                >
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> Enviar WhatsApp
                </button>
              </div>

              {/* NOTAS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-300 uppercase text-[10px]">Bitácora</h4>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                  {selectedItem.notes || 'Sin novedades registradas.'}
                </div>
                <form onSubmit={handleAgregarNota} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Registrar nota u orden..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                  <button type="submit" className="bg-emerald-500 text-slate-950 font-black px-3.5 py-2 rounded-xl">
                    Anotar
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs py-20">
              Selecciona un servicio para abrir los comandos operativos.
            </div>
          )}
        </div>

      </div>

      {/* MODAL DESPACHO */}
      {asignarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white">Despachar Acompañante Acreditado</h3>
              <button onClick={() => setAsignarModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <select
              value={acompananteSeleccionado}
              onChange={(e) => setAcompananteSeleccionado(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
            >
              <option value="">-- Elige un acompañante --</option>
              {acompanantesActivos.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name} ({a.phone})</option>
              ))}
            </select>
            <button
              onClick={handleAsignarAcompanante}
              disabled={!acompananteSeleccionado}
              className="w-full bg-emerald-500 text-slate-950 py-3 rounded-xl text-xs font-black disabled:opacity-50"
            >
              Confirmar Asignación
            </button>
          </div>
        </div>
      )}

    </div>
  );
}