'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Radio, 
  Clock, 
  History, 
  FileText, 
  PhoneCall, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Send, 
  UserCheck, 
  UserPlus, 
  X,
  Play,
  CheckSquare,
  AlertOctagon,
  MessageSquare
} from 'lucide-react';

interface SolicitudServicio {
  id: string;
  client_id?: string;
  companion_id?: string;
  client_name?: string;
  companion_name?: string;
  client_phone?: string;
  companion_phone?: string;
  status: string;
  created_at: string;
  scheduled_date?: string;
  notes?: string;
  address?: string;
  emergency_status?: 'NORMAL' | 'SOS_ACTIVE';
}

export default function MesaOperacionesPage() {
  const [tab, setTab] = useState<'EN_CURSO' | 'POSTERIORES' | 'PREVIOS' | 'EXPEDIENTES'>('EN_CURSO');
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [acompanantesActivos, setAcompanantesActivos] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Estados de interacción operativa
  const [chatMensajes, setChatMensajes] = useState<any[]>([]);
  const [nuevoMensajeAdmin, setNuevoMensajeAdmin] = useState('');
  const [nuevaNota, setNuevaNota] = useState('');
  const [asignarModal, setAsignarModal] = useState(false);
  const [acompananteSeleccionado, setAcompananteSeleccionado] = useState('');

  // Visor modal de documentos KYC
  const [docModal, setDocModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  const supabase = createClient();

  useEffect(() => {
    cargarDatos();

    // Suscripción Realtime a solicitudes y chats
    const channelServices = supabase
      .channel('realtime_mesa_operaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        cargarDatos();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_chats' }, (payload) => {
        setChatMensajes(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelServices);
    };
  }, []);

  // Cargar chat cuando se selecciona un servicio
  useEffect(() => {
    if (selectedItem && tab !== 'EXPEDIENTES') {
      cargarChatServicio(selectedItem.id);
    }
  }, [selectedItem, tab]);

  async function cargarDatos() {
    setLoading(true);

    // 1. Solicitudes de servicio
    const { data: srvData } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (srvData && srvData.length > 0) {
      setSolicitudes(srvData);
      if (!selectedItem && tab !== 'EXPEDIENTES') setSelectedItem(srvData[0]);
    } else {
      setSolicitudes([]);
    }

    // 2. Expedientes de Acompañantes
    const { data: compApps } = await supabase
      .from('companion_applications')
      .select('*')
      .order('fecha_solicitud', { ascending: false });

    if (compApps && compApps.length > 0) {
      setExpedientes(compApps);
    } else {
      const { data: profCompanions } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COMPANION');
      setExpedientes(profCompanions || []);
    }

    // 3. Acompañantes aprobados y disponibles para asignar
    const { data: activos } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'COMPANION')
      .eq('status', 'ACTIVE');
    setAcompanantesActivos(activos || []);

    setLoading(false);
  }

  async function cargarChatServicio(serviceId: string) {
    const { data } = await supabase
      .from('service_chats')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });

    setChatMensajes(data || []);
  }

  // COMANDO 1: Cambiar estado del servicio (Iniciar, Completar, Cancelar)
  async function cambiarEstadoServicio(serviceId: string, nuevoEstado: string) {
    setUpdating(true);
    const { error } = await supabase
      .from('service_requests')
      .update({ status: nuevoEstado })
      .eq('id', serviceId);

    if (error) {
      alert(`Error al cambiar estado: ${error.message}`);
    } else {
      setSelectedItem((prev: any) => ({ ...prev, status: nuevoEstado }));
      cargarDatos();
    }
    setUpdating(false);
  }

  // COMANDO 2: Activar / Desactivar Botón de Pánico (SOS)
  async function toggleAlertaSOS(servicio: SolicitudServicio) {
    const nuevoEstadoSOS = servicio.emergency_status === 'SOS_ACTIVE' ? 'NORMAL' : 'SOS_ACTIVE';
    
    if (nuevoEstadoSOS === 'SOS_ACTIVE') {
      if (!confirm('⚠️ ¿DESEAS ACTIVAR EL PROTOCOLO SOS? Esto alertará a la central de despacho y registrará contacto de urgencia.')) {
        return;
      }
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

  // COMANDO 3: Asignar Acompañante Oficial
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
        status: selectedItem.status === 'PENDING' ? 'SCHEDULED' : selectedItem.status
      })
      .eq('id', selectedItem.id);

    if (!error) {
      setSelectedItem((prev: any) => ({
        ...prev,
        companion_id: acompanante.id,
        companion_name: acompanante.full_name,
        companion_phone: acompanante.phone
      }));
      setAsignarModal(false);
      cargarDatos();
      alert(`✓ ${acompanante.full_name} asignado al servicio con éxito.`);
    }
    setUpdating(false);
  }

  // COMANDO 4: Enviar mensaje como Despachador de Mesa al Chat
  async function enviarMensajeAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoMensajeAdmin.trim() || !selectedItem) return;

    const { error } = await supabase.from('service_chats').insert([{
      service_id: selectedItem.id,
      sender_id: 'ADMIN_OPERACIONES',
      sender_name: 'Mesa de Operaciones (Despacho)',
      sender_role: 'ADMIN',
      message: nuevoMensajeAdmin.trim()
    }]);

    if (!error) {
      setNuevoMensajeAdmin('');
      cargarChatServicio(selectedItem.id);
    }
  }

  // COMANDO 5: Agregar Novedad u Orden a la Bitácora
  async function handleAgregarNota(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaNota.trim() || !selectedItem) return;

    const notasActuales = selectedItem.notes ? `${selectedItem.notes}\n` : '';
    const notaFormateada = `${notasActuales}[${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} Admin]: ${nuevaNota.trim()}`;

    setUpdating(true);
    await supabase
      .from('service_requests')
      .update({ notes: notaFormateada })
      .eq('id', selectedItem.id);

    setSelectedItem((prev: any) => ({ ...prev, notes: notaFormateada }));
    setNuevaNota('');
    setUpdating(false);
    cargarDatos();
  }

  // COMANDO 6: Aprobación de Expediente RRHH
  async function handleAprobar(expediente: any) {
    if (!confirm(`¿Confirmas la APROBACIÓN de ${expediente.nombre || expediente.full_name}? Podrá recibir servicios de inmediato.`)) return;

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

    alert(`✓ Acompañante acreditado y activo en el sistema.`);
    setUpdating(false);
    cargarDatos();
  }

  // Filtrado de servicios
  const serviciosFiltrados = solicitudes.filter(s => {
    const st = (s.status || '').toUpperCase();
    if (tab === 'EN_CURSO') return st === 'IN_PROGRESS' || st === 'EN_CURSO' || st === 'PENDING';
    if (tab === 'POSTERIORES') return st === 'SCHEDULED' || st === 'AGENDADO';
    if (tab === 'PREVIOS') return st === 'COMPLETED' || st === 'CANCELLED' || st === 'FINALIZADO';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      
      {/* HEADER DE MESA CENTRAL */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            Mesa de Operaciones Central JUNTOS
          </h1>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
            DESPACHO & COMANDO 24/7
          </span>
        </div>

        <button 
          onClick={cargarDatos}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
        >
          ↻ Actualizar en vivo
        </button>
      </header>

      {/* PESTAÑAS DE CONTROL */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => { setTab('EN_CURSO'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'EN_CURSO' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          Servicios en Tiempo Real ({solicitudes.filter(s => ['IN_PROGRESS', 'PENDING', 'EN_CURSO'].includes((s.status || '').toUpperCase())).length})
        </button>

        <button
          onClick={() => { setTab('POSTERIORES'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'POSTERIORES' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Servicios Posteriores / Agendados ({solicitudes.filter(s => ['SCHEDULED', 'AGENDADO'].includes((s.status || '').toUpperCase())).length})
        </button>

        <button
          onClick={() => { setTab('PREVIOS'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'PREVIOS' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-slate-400" />
          Servicios Previos / Historial ({solicitudes.filter(s => ['COMPLETED', 'CANCELLED', 'FINALIZADO'].includes((s.status || '').toUpperCase())).length})
        </button>

        <button
          onClick={() => { setTab('EXPEDIENTES'); setSelectedItem(expedientes[0] || null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'EXPEDIENTES' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-white" />
          Expedientes RRHH / Postulaciones ({expedientes.length})
        </button>
      </div>

      {/* CUERPO CENTRAL DE MANDO */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* LISTADO DE ELEMENTOS (4 COLUMNAS) */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto">
          {tab !== 'EXPEDIENTES' ? (
            serviciosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800 text-xs">
                No hay servicios en esta bandeja.
              </div>
            ) : (
              serviciosFiltrados.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedItem(s)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    s.emergency_status === 'SOS_ACTIVE'
                      ? 'bg-rose-950/40 border-rose-600 animate-pulse'
                      : selectedItem?.id === s.id
                      ? 'bg-blue-950/50 border-blue-500'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          ID: {s.id.slice(0, 8)}
                        </span>
                        {s.emergency_status === 'SOS_ACTIVE' && (
                          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded">
                            SOS ACTIVO
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm mt-1">
                        {s.client_name || `Solicitud #${s.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-blue-400">
                        {s.companion_name ? `Acompañante: ${s.companion_name}` : '⚠️ Sin acompañante asignado'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
                    <span className="truncate">📍 {s.address || 'Ubicación'}</span>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            /* LISTA EXPEDIENTES RRHH */
            expedientes.map((exp, idx) => (
              <div
                key={exp.id || idx}
                onClick={() => setSelectedItem(exp)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  selectedItem?.id === exp.id
                    ? 'bg-amber-950/40 border-amber-500'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {exp.nombre || exp.full_name || 'Postulante'}
                    </h3>
                    <p className="text-xs text-slate-400">Doc: {exp.numero_documento || 'No especificado'}</p>
                    <p className="text-xs text-amber-400">Tel: {exp.telefono || exp.phone || exp.telefono_whatsapp || 'S/N'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {exp.estado || exp.status || 'PENDIENTE_REVISION'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PANEL DERECHO: CONSOLA DE ACCIONES OPERATIVAS Y AUDITORÍA (8 COLUMNAS) */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-5">
              
              {/* CABECERA CON ACCIONES DE MANDO */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {tab === 'EXPEDIENTES' ? 'Expediente Oficial RRHH' : 'Consola de Despacho del Servicio'}
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    {selectedItem.nombre || selectedItem.client_name || selectedItem.full_name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    ID: <span className="font-mono text-slate-300">{selectedItem.id}</span>
                  </p>
                </div>

                {/* BOTONERA OPERATIVA DE SERVICIO */}
                {tab !== 'EXPEDIENTES' && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón Pánico SOS */}
                    <button
                      onClick={() => toggleAlertaSOS(selectedItem)}
                      disabled={updating}
                      className={`text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                        selectedItem.emergency_status === 'SOS_ACTIVE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4" />
                      {selectedItem.emergency_status === 'SOS_ACTIVE' ? 'SOS ACTIVO (CANCELAR)' : 'BOTÓN SOS'}
                    </button>

                    {/* Asignar Acompañante */}
                    <button
                      onClick={() => setAsignarModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Asignar Personal
                    </button>

                    {/* Acciones de estado */}
                    {selectedItem.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => cambiarEstadoServicio(selectedItem.id, 'IN_PROGRESS')}
                        className="bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Iniciar
                      </button>
                    )}
                    {selectedItem.status !== 'COMPLETED' && (
                      <button
                        onClick={() => cambiarEstadoServicio(selectedItem.id, 'COMPLETED')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 border border-slate-700"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Finalizar
                      </button>
                    )}
                  </div>
                )}

                {/* Botonera si es expediente RRHH */}
                {tab === 'EXPEDIENTES' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAprobar(selectedItem)}
                      disabled={updating}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar y Acreditar
                    </button>
                  </div>
                )}
              </div>

              {/* CUERPO DEL SERVICIO: CONTACTOS, CHAT Y BITÁCORA */}
              {tab !== 'EXPEDIENTES' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  
                  {/* COLUMNA 1: DATOS, CONTACTOS Y BITÁCORA */}
                  <div className="space-y-4">
                    {/* Llamadas Rápidas */}
                    <div className="flex gap-2">
                      <a
                        href={`tel:${selectedItem.client_phone}`}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-blue-400"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Llamar Cliente ({selectedItem.client_phone || 'S/N'})
                      </a>
                      <a
                        href={`tel:${selectedItem.companion_phone}`}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-emerald-400"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Llamar Acompañante ({selectedItem.companion_phone || 'S/N'})
                      </a>
                    </div>

                    {/* Resumen del Servicio */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-slate-300">
                      <p><b>Dirección de Atención:</b> {selectedItem.address || 'No registrada'}</p>
                      <p><b>Acompañante Asignado:</b> {selectedItem.companion_name || 'Sin asignar'}</p>
                      <p><b>Estado Actual:</b> <span className="font-mono text-emerald-400 uppercase">{selectedItem.status}</span></p>
                    </div>

                    {/* Bitácora Operacional */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col h-60">
                      <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider mb-2">
                        Bitácora y Novedades del Servicio
                      </h4>
                      <div className="flex-1 overflow-y-auto bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                        {selectedItem.notes || 'No hay notas u órdenes registradas todavía.'}
                      </div>
                      <form onSubmit={handleAgregarNota} className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={nuevaNota}
                          onChange={(e) => setNuevaNota(e.target.value)}
                          placeholder="Registrar novedad u orden..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs">
                          Anotar
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* COLUMNA 2: CHAT AUDITADO EN VIVO (CLIENTE ↔ ACOMPAÑANTE ↔ MESA) */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col h-[460px]">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Transcripción del Chat en Vivo
                      </h4>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                        AUDITORÍA
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                      {chatMensajes.length === 0 ? (
                        <div className="text-center text-slate-600 text-[11px] py-12">
                          No hay mensajes intercambiados en este servicio todavía.
                        </div>
                      ) : (
                        chatMensajes.map((m, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                              m.sender_role === 'ADMIN'
                                ? 'bg-amber-950/50 border border-amber-800/80 text-amber-200 ml-auto'
                                : m.sender_role === 'COMPANION'
                                ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-200 ml-auto'
                                : 'bg-blue-950/40 border border-blue-800 text-blue-200 mr-auto'
                            }`}
                          >
                            <div className="flex justify-between text-[10px] opacity-75 font-bold mb-0.5">
                              <span>{m.sender_name}</span>
                              <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p>{m.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Enviar mensaje desde la Mesa al chat */}
                    <form onSubmit={enviarMensajeAdmin} className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={nuevoMensajeAdmin}
                        onChange={(e) => setNuevoMensajeAdmin(e.target.value)}
                        placeholder="Enviar mensaje oficial al chat..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                </div>
              ) : (
                /* VISTA EXPEDIENTES RRHH */
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Documento:</span>
                      <span className="font-mono text-white">{selectedItem.numero_documento || 'No indicado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Teléfono / WhatsApp:</span>
                      <span className="text-white">{selectedItem.telefono || selectedItem.phone || selectedItem.telefono_whatsapp}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Domicilio Registrado:</span>
                      <span className="text-white">{selectedItem.domicilio_direccion || selectedItem.metadata?.domicilio_direccion || 'No indicado'}</span>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDocModal({
                        open: true,
                        title: 'Cédula de Identidad',
                        url: selectedItem.url_doc_frontal || 'https://placehold.co/600x400/0f172a/white?text=Cedula+Frontal'
                      })}
                      className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between text-slate-200"
                    >
                      <span>🪪 Cédula</span>
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => setDocModal({
                        open: true,
                        title: 'Certificado Antecedentes PGR',
                        url: selectedItem.url_cert_antecedentes || 'https://placehold.co/600x400/0f172a/white?text=Certificado+PGR'
                      })}
                      className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between text-slate-200"
                    >
                      <span>📜 PGR</span>
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => setDocModal({
                        open: true,
                        title: 'Título de Bachiller',
                        url: selectedItem.url_cert_bachiller || 'https://placehold.co/600x400/0f172a/white?text=Diploma+Bachiller'
                      })}
                      className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between text-slate-200"
                    >
                      <span>🎓 Título</span>
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-2" />
              Selecciona cualquier servicio o expediente para accionar los comandos operativos.
            </div>
          )}
        </div>

      </div>

      {/* MODAL PARA ASIGNAR ACOMPAÑANTE */}
      {asignarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Despachar Acompañante
              </h3>
              <button onClick={() => setAsignarModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-bold block">Selecciona un personal verificado disponible:</label>
              <select
                value={acompananteSeleccionado}
                onChange={(e) => setAcompananteSeleccionado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">-- Elige un acompañante --</option>
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
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAsignarAcompanante}
                disabled={!acompananteSeleccionado || updating}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold"
              >
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE DOCUMENTOS */}
      {docModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> {docModal.title}
              </h3>
              <button onClick={() => setDocModal({ open: false, url: '', title: '' })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900 rounded-xl p-2 min-h-[300px]">
              <img src={docModal.url} alt={docModal.title} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}