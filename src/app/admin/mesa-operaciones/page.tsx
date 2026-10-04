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
  Eye, 
  UserCheck, 
  UserPlus, 
  X,
  Play,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Receipt,
  Send,
  MessageCircle,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface SolicitudServicio {
  id: string;
  client_id?: string;
  customer_id?: string;
  companion_id?: string;
  client_name?: string;
  for_who_name?: string;
  recipient_name?: string;
  companion_name?: string;
  client_phone?: string;
  recipient_phone?: string;
  companion_phone?: string;
  status: string;
  created_at: string;
  scheduled_date?: string;
  requested_date?: string;
  notes?: string;
  observations?: string;
  special_notes?: string;
  facility_or_location?: string;
  address?: string;
  checkin_pin?: string;
  checkout_pin?: string;
  emergency_status?: 'NORMAL' | 'SOS_ACTIVE';
  payment_info?: {
    id?: string;
    amount?: number;
    status?: string;
    currency?: string;
  };
}

export default function MesaOperacionesPage() {
  const router = useRouter();
  const supabase = createClient();

  // Control de Acceso Dinámico
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Estados Operativos
  const [tab, setTab] = useState<'EN_CURSO' | 'POSTERIORES' | 'PREVIOS' | 'EXPEDIENTES'>('EN_CURSO');
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [acompanantesActivos, setAcompanantesActivos] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Chat y Despacho
  const [chatMensajes, setChatMensajes] = useState<any[]>([]);
  const [nuevoMensajeAdmin, setNuevoMensajeAdmin] = useState('');
  const [nuevaNota, setNuevaNota] = useState('');
  const [asignarModal, setAsignarModal] = useState(false);
  const [acompananteSeleccionado, setAcompananteSeleccionado] = useState('');

  // Visor KYC
  const [docModal, setDocModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  // 1. VERIFICACIÓN DINÁMICA DE ROL
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
        user.email === 'odel_kiss@hotmail.com';

      if (!esAdmin) {
        alert('⛔ Acceso denegado: Consola exclusiva para la Mesa Central de Operaciones.');
        router.replace('/profile');
        return;
      }

      setCurrentAdmin(user);
      setIsAuthorized(true);
      setAuthChecking(false);
      cargarDatos();
    }

    verificarPermisosAdmin();
  }, [router, supabase]);

  // 2. REALTIME ENGINE
  useEffect(() => {
    if (!isAuthorized) return;

    const channelServices = supabase
      .channel('realtime_mesa_operaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        cargarDatos();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_chat_messages' }, (payload) => {
        setChatMensajes(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelServices);
    };
  }, [isAuthorized, supabase]);

  useEffect(() => {
    if (selectedItem && tab !== 'EXPEDIENTES') {
      cargarChatServicio(selectedItem.id);
    }
  }, [selectedItem, tab]);

  async function cargarDatos() {
    setLoading(true);

    const { data: srvData } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (srvData && srvData.length > 0) {
      const serviciosMapeados = srvData.map(srv => {
        return {
          ...srv,
          client_name: srv.recipient_name || srv.client_name || srv.for_who_name || 'Paciente sin nombre',
          address: srv.facility_or_location || srv.address || srv.center_address || 'Punto a coordinar',
          scheduled_date: srv.scheduled_date || srv.requested_date,
          notes: srv.special_notes || srv.notes || srv.observations,
          client_phone: srv.recipient_phone || srv.client_phone || '809-541-2000',
          checkin_pin: srv.checkin_pin || srv.id.replace(/\D/g, '').slice(0, 4) || '2491',
          checkout_pin: srv.checkout_pin || srv.id.replace(/\D/g, '').slice(2, 6) || '8421'
        };
      });

      setSolicitudes(serviciosMapeados);
      if (!selectedItem && tab !== 'EXPEDIENTES') {
        setSelectedItem(serviciosMapeados[0]);
      }
    } else {
      setSolicitudes([]);
    }

    // Expedientes de postulantes y acompañantes
    const { data: compApps } = await supabase
      .from('companion_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (compApps && compApps.length > 0) {
      setExpedientes(compApps);
    } else {
      const { data: profCompanions } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COMPANION');
      setExpedientes(profCompanions || []);
    }

    // Acompañantes activos para despacho
    const { data: activos } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'COMPANION');
    setAcompanantesActivos(activos || []);

    setLoading(false);
  }

  async function cargarChatServicio(serviceId: string) {
    const { data } = await supabase
      .from('service_chat_messages')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });

    setChatMensajes(data || []);
  }

  async function cambiarEstadoServicio(serviceId: string, nuevoEstado: string) {
    setUpdating(true);
    const { error } = await supabase
      .from('service_requests')
      .update({ status: nuevoEstado })
      .eq('id', serviceId);

    if (!error) {
      setSelectedItem((prev: any) => ({ ...prev, status: nuevoEstado }));
      cargarDatos();
    } else {
      alert(`Error al actualizar estado: ${error.message}`);
    }
    setUpdating(false);
  }

  async function toggleAlertaSOS(servicio: SolicitudServicio) {
    const nuevoEstadoSOS = servicio.emergency_status === 'SOS_ACTIVE' ? 'NORMAL' : 'SOS_ACTIVE';
    
    if (nuevoEstadoSOS === 'SOS_ACTIVE') {
      if (!confirm('🚨 ¿DESEAS EMITIR PROTOCOLO DE ALERTA SOS?')) return;
    }

    setUpdating(true);
    await supabase
      .from('service_requests')
      .update({ emergency_status: nuevoEstadoSOS })
      .eq('id', servicio.id);

    setSelectedItem((prev: any) => ({ ...prev, emergency_status: nuevoEstadoSOS }));
    cargarDatos();
    setUpdating(false);
  }

  async function handleAsignarAcompanante() {
    if (!acompananteSeleccionado || !selectedItem) return;

    const acompanante = acompanantesActivos.find(a => a.id === acompananteSeleccionado);
    if (!acompanante) return;

    setUpdating(true);
    const { error } = await supabase
      .from('service_requests')
      .update({
        companion_id: acompanante.id,
        companion_name: acompanante.full_name,
        companion_phone: acompanante.phone,
        status: 'ASSIGNED'
      })
      .eq('id', selectedItem.id);

    if (!error) {
      setSelectedItem((prev: any) => ({
        ...prev,
        companion_id: acompanante.id,
        companion_name: acompanante.full_name,
        companion_phone: acompanante.phone,
        status: 'ASSIGNED'
      }));
      setAsignarModal(false);
      cargarDatos();
      alert(`✓ ${acompanante.full_name} asignado y despachado con éxito.`);
    }
    setUpdating(false);
  }

  async function enviarMensajeAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoMensajeAdmin.trim() || !selectedItem || !currentAdmin) return;

    const { error } = await supabase.from('service_chat_messages').insert([{
      service_id: selectedItem.id,
      sender_id: currentAdmin.id,
      sender_name: 'Mesa Central (Despacho)',
      message: `[MESA CENTRAL]: ${nuevoMensajeAdmin.trim()}`
    }]);

    if (!error) {
      setNuevoMensajeAdmin('');
      cargarChatServicio(selectedItem.id);
    }
  }

  async function handleAgregarNota(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaNota.trim() || !selectedItem) return;

    const notaAnterior = selectedItem.notes ? `${selectedItem.notes}\n` : '';
    const notaNueva = `${notaAnterior}[${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} Operaciones]: ${nuevaNota.trim()}`;

    setUpdating(true);
    await supabase
      .from('service_requests')
      .update({ special_notes: notaNueva })
      .eq('id', selectedItem.id);

    setSelectedItem((prev: any) => ({ ...prev, notes: notaNueva, special_notes: notaNueva }));
    setNuevaNota('');
    setUpdating(false);
    cargarDatos();
  }

  async function handleAprobar(expediente: any) {
    if (!confirm(`¿Confirmas la acreditación oficial de ${expediente.nombre || expediente.full_name}?`)) return;

    setUpdating(true);
    const userId = expediente.user_id || expediente.id;

    if (expediente.user_id) {
      await supabase
        .from('companion_applications')
        .update({ estado: 'APROBADO', estado_depuracion: 'APROBADO' })
        .eq('user_id', userId);
    }

    await supabase
      .from('profiles')
      .update({ status: 'ACTIVE', role: 'COMPANION' })
      .eq('id', userId);

    alert(`✓ Acompañante acreditado con carnet PGR.`);
    setUpdating(false);
    cargarDatos();
  }

  function enviarWhatsAppConfirmacion(servicio: SolicitudServicio) {
    const telefono = servicio.client_phone || servicio.recipient_phone;
    if (!telefono) {
      alert('Sin número de teléfono registrado.');
      return;
    }

    let tel = telefono.replace(/[^0-9]/g, '');
    if (tel.length === 10) tel = '1' + tel;

    const mensaje = `🟢 *JUNTOS ASISTENCIA RD - Confirmación de Servicio*\n\nEstimado/a *${servicio.client_name}*, tu cita está coordinada:\n\n📍 *Punto:* ${servicio.address}\n👤 *Acompañante Acreditado:* ${servicio.companion_name || 'En camino'}\n🔑 *PIN Check-In:* ${servicio.checkin_pin}\n🔑 *PIN Check-Out:* ${servicio.checkout_pin}\n\nMesa Central de Operaciones 24/7 disponible.`;

    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <ShieldAlert className="w-8 h-8 text-emerald-400 animate-pulse" />
        <p className="text-xs font-mono tracking-widest uppercase">Validando credenciales operativas...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const serviciosFiltrados = solicitudes.filter(s => {
    const st = (s.status || '').toUpperCase();
    if (tab === 'EN_CURSO') return ['IN_PROGRESS', 'ASSIGNED', 'PENDING_DISPATCH', 'EN_CURSO'].includes(st);
    if (tab === 'POSTERIORES') return ['SCHEDULED', 'AGENDADO'].includes(st);
    if (tab === 'PREVIOS') return ['COMPLETED', 'CANCELLED', 'FINALIZADO'].includes(st);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col pb-16 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* HEADER DE COMANDO CENTRAL */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                CENTRO DE CONTROL & DESPACHO EN VIVO
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Mesa de Operaciones Central JUNTOS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              Auditoría Cuentas
            </Link>
            <button 
              onClick={cargarDatos}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              ↻ Sincronizar
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE CONTROL */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setTab('EN_CURSO'); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'EN_CURSO' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>En Tiempo Real ({solicitudes.filter(s => ['IN_PROGRESS', 'ASSIGNED', 'PENDING_DISPATCH'].includes((s.status || '').toUpperCase())).length})</span>
          </button>

          <button
            onClick={() => { setTab('POSTERIORES'); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'POSTERIORES' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Agendados ({solicitudes.filter(s => ['SCHEDULED', 'AGENDADO'].includes((s.status || '').toUpperCase())).length})</span>
          </button>

          <button
            onClick={() => { setTab('PREVIOS'); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'PREVIOS' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial Concluidos ({solicitudes.filter(s => ['COMPLETED', 'CANCELLED'].includes((s.status || '').toUpperCase())).length})</span>
          </button>

          <button
            onClick={() => { setTab('EXPEDIENTES'); setSelectedItem(expedientes[0] || null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'EXPEDIENTES' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Expedientes RRHH ({expedientes.length})</span>
          </button>
        </div>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BANDEJA IZQUIERDA (4 COLUMNAS) */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
          {tab !== 'EXPEDIENTES' ? (
            serviciosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-3xl border border-slate-800 text-xs">
                No hay servicios en esta bandeja.
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                          #{s.id.slice(0, 8).toUpperCase()}
                        </span>
                        {s.emergency_status === 'SOS_ACTIVE' && (
                          <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded animate-pulse">
                            SOS ACTIVO
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-white text-sm mt-1.5 line-clamp-1">
                        {s.client_name}
                      </h3>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        {s.companion_name ? `Acomp: ${s.companion_name}` : '⚠️ Sin acompañante'}
                      </p>
                    </div>

                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {s.status}
                    </span>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between items-center font-mono">
                    <span className="truncate max-w-[60%]">📍 {s.address}</span>
                    <span>{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                  selectedItem?.id === exp.id
                    ? 'bg-slate-950 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {exp.nombre || exp.full_name || 'Postulante'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">Doc: {exp.numero_documento || 'Sin cédula'}</p>
                    <p className="text-xs text-emerald-400 font-mono">Tel: {exp.telefono || exp.phone || 'S/N'}</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
                    {exp.estado || exp.status || 'PENDIENTE'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETALLE Y PANEL OPERATIVO (8 COLUMNAS) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[750px] overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-6">
              
              {/* ENCABEZADO SERVICIO */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider">
                    {tab === 'EXPEDIENTES' ? 'Expediente Oficial PGR' : 'Consola de Despacho & Auditoría'}
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    {selectedItem.nombre || selectedItem.client_name || selectedItem.full_name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: <span className="text-slate-300">{selectedItem.id}</span>
                  </p>
                </div>

                {tab !== 'EXPEDIENTES' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleAlertaSOS(selectedItem)}
                      disabled={updating}
                      className={`text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition ${
                        selectedItem.emergency_status === 'SOS_ACTIVE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{selectedItem.emergency_status === 'SOS_ACTIVE' ? 'SOS ACTIVO (CANCELAR)' : 'BOTÓN SOS'}</span>
                    </button>

                    <button
                      onClick={() => setAsignarModal(true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Despachar Personal</span>
                    </button>

                    {selectedItem.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => cambiarEstadoServicio(selectedItem.id, 'IN_PROGRESS')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                      >
                        <Play className="w-3.5 h-3.5" /> Iniciar
                      </button>
                    )}

                    {selectedItem.status !== 'COMPLETED' && (
                      <button
                        onClick={() => cambiarEstadoServicio(selectedItem.id, 'COMPLETED')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Finalizar
                      </button>
                    )}
                  </div>
                )}

                {tab === 'EXPEDIENTES' && (
                  <button
                    onClick={() => handleAprobar(selectedItem)}
                    disabled={updating}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar y Acreditar PGR</span>
                  </button>
                )}
              </div>

              {tab !== 'EXPEDIENTES' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                  
                  {/* COLUMNA 1: AUDITORÍA DE PINS Y COMUNICACIONES */}
                  <div className="space-y-4">
                    
                    {/* TARJETA DE PINS EN VIVO */}
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> PINs de Validación Antifraude
                        </span>
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          AUDITORÍA EN VIVO
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-center pt-1">
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 block">1. PIN CHECK-IN</span>
                          <span className="font-mono text-xl font-black text-emerald-400">{selectedItem.checkin_pin}</span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-400 block">2. PIN CHECK-OUT</span>
                          <span className="font-mono text-xl font-black text-amber-400">{selectedItem.checkout_pin}</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTONERA DE CONTACTO DIRECTO */}
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`tel:${selectedItem.client_phone}`}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl flex items-center justify-center gap-1 font-bold text-slate-300 text-center transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Paciente
                      </a>

                      <a
                        href={`tel:${selectedItem.companion_phone}`}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl flex items-center justify-center gap-1 font-bold text-slate-300 text-center transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Acompañante
                      </a>

                      <button
                        onClick={() => enviarWhatsAppConfirmacion(selectedItem)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl flex items-center justify-center gap-1 font-black transition shadow text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" /> WhatsApp
                      </button>
                    </div>

                    {/* BITÁCORA */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-56 space-y-2">
                      <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                        Bitácora y Notas del Servicio
                      </h4>
                      <div className="flex-1 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                        {selectedItem.notes || 'Sin observaciones u órdenes especiales registradas.'}
                      </div>
                      <form onSubmit={handleAgregarNota} className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={nuevaNota}
                          onChange={(e) => setNuevaNota(e.target.value)}
                          placeholder="Registrar novedad u orden..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs">
                          Anotar
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* COLUMNA 2: CHAT OPERATIVO EN VIVO */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[460px]">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-2.5">
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Transcripción de Chat
                      </h4>
                      <span className="text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                        CANAL SEGURO
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                      {chatMensajes.length === 0 ? (
                        <div className="text-center text-slate-600 text-xs py-16">
                          No hay mensajes todavía.
                        </div>
                      ) : (
                        chatMensajes.map((m, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-2xl max-w-[85%] text-xs ${
                              m.sender_name?.includes('Mesa Central')
                                ? 'bg-amber-950/60 border border-amber-600/40 text-amber-200 ml-auto'
                                : 'bg-slate-900 border border-slate-800 text-slate-200 mr-auto'
                            }`}
                          >
                            <div className="flex justify-between text-[9px] opacity-75 font-bold mb-0.5">
                              <span>{m.sender_name}</span>
                              <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p>{m.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={enviarMensajeAdmin} className="mt-2.5 flex gap-2">
                      <input
                        type="text"
                        value={nuevoMensajeAdmin}
                        onChange={(e) => setNuevoMensajeAdmin(e.target.value)}
                        placeholder="Instrucción de despacho al chat..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                      <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl transition">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                </div>
              ) : (
                /* DETALLE EXPEDIENTE */
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Documento de Identidad:</span>
                      <span className="font-mono text-white text-sm">{selectedItem.numero_documento || 'No indicado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Teléfono de Contacto:</span>
                      <span className="text-white text-sm">{selectedItem.telefono || selectedItem.phone || 'S/N'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Domicilio Registrado:</span>
                      <span className="text-white">{selectedItem.domicilio_direccion || 'No indicado'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setDocModal({
                        open: true,
                        title: 'Cédula de Identidad',
                        url: selectedItem.url_doc_frontal || 'https://placehold.co/600x400/020617/white?text=Cedula+Frontal'
                      })}
                      className="bg-slate-900 hover:bg-slate-800 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-slate-200 transition"
                    >
                      <span>🪪 Cédula</span>
                      <Eye className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => setDocModal({
                        open: true,
                        title: 'Certificado Antecedentes PGR',
                        url: selectedItem.url_cert_antecedentes || 'https://placehold.co/600x400/020617/white?text=Certificado+PGR'
                      })}
                      className="bg-slate-900 hover:bg-slate-800 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-slate-200 transition"
                    >
                      <span>📜 PGR</span>
                      <Eye className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => setDocModal({
                        open: true,
                        title: 'Diploma de Bachiller',
                        url: selectedItem.url_cert_bachiller || 'https://placehold.co/600x400/020617/white?text=Diploma+Bachiller'
                      })}
                      className="bg-slate-900 hover:bg-slate-800 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-slate-200 transition"
                    >
                      <span>🎓 Título</span>
                      <Eye className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-20">
              <ShieldCheck className="w-12 h-12 text-slate-800 mb-2" />
              Selecciona una solicitud o expediente para desplegar los comandos de control.
            </div>
          )}
        </div>

      </div>

      {/* MODAL DESPACHAR ACOMPAÑANTE */}
      {asignarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Asignar Acompañante Acreditado
              </h3>
              <button onClick={() => setAsignarModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-bold block">Selecciona personal depurado por la PGR:</label>
              <select
                value={acompananteSeleccionado}
                onChange={(e) => setAcompananteSeleccionado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">-- Selecciona un acompañante --</option>
                {acompanantesActivos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAsignarModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAsignarAcompanante}
                disabled={!acompananteSeleccionado || updating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR KYC */}
      {docModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> {docModal.title}
              </h3>
              <button onClick={() => setDocModal({ open: false, url: '', title: '' })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900 rounded-2xl p-2 min-h-[300px]">
              <img src={docModal.url} alt={docModal.title} className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}