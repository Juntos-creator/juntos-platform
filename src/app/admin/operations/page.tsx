'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  Radio, 
  History, 
  PhoneCall, 
  ShieldCheck, 
  UserPlus, 
  X,
  Play,
  CheckSquare,
  AlertTriangle,
  MessageCircle,
  KeyRound,
  ShieldAlert,
  Search,
  Receipt,
  Users
} from 'lucide-react';

interface SolicitudServicio {
  id: string;
  client_name?: string;
  recipient_name?: string;
  for_who_name?: string;
  companion_id?: string;
  companion_name?: string;
  client_phone?: string;
  recipient_phone?: string;
  companion_phone?: string;
  status: string;
  created_at: string;
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
  special_notes?: string;
  facility_or_location?: string;
  address?: string;
  rate_total?: number;
  payment_status?: string;
  checkin_pin?: string;
  checkout_pin?: string;
  emergency_status?: 'NORMAL' | 'SOS_ACTIVE';
  ncf?: string;
}

export default function OperacionesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [tab, setTab] = useState<'EN_CURSO' | 'HISTORIAL' | 'EXPEDIENTES'>('EN_CURSO');
  const [servicios, setServicios] = useState<SolicitudServicio[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [acompanantesActivos, setAcompanantesActivos] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<SolicitudServicio | null>(null);
  
  const [filtroTexto, setFiltroTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [asignarModal, setAsignarModal] = useState(false);
  const [acompananteSeleccionado, setAcompananteSeleccionado] = useState('');
  const [nuevaBitacora, setNuevaBitacora] = useState('');

  // 1. Verificación de Administradora
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace('/login?redirect=/admin/operations');
        return;
      }

      const user = session.user;
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
        router.replace('/');
        return;
      }

      setIsAuthorized(true);
      setAuthChecking(false);
      cargarDatos();
    }

    checkAuth();
  }, [router, supabase]);

  // 2. Carga General de Datos
  async function cargarDatos() {
    setLoading(true);

    const { data: srvData } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (srvData && srvData.length > 0) {
      const mapeados: SolicitudServicio[] = srvData.map((srv: any) => ({
        ...srv,
        companion_id: srv.companion_id || undefined,
        client_name: srv.recipient_name || srv.client_name || srv.for_who_name || 'Paciente',
        address: srv.facility_or_location || srv.address || 'Ubicación coordinada',
        scheduled_date: srv.scheduled_date || srv.requested_date,
        notes: srv.special_notes || srv.notes || '',
        client_phone: srv.recipient_phone || srv.client_phone || '809-541-2000',
        checkin_pin: srv.checkin_pin || srv.pin_start || srv.id.replace(/\D/g, '').slice(0, 4) || '2491',
        checkout_pin: srv.checkout_pin || srv.pin_end || srv.id.replace(/\D/g, '').slice(2, 6) || '8421',
        rate_total: Number(srv.rate_total || 1800),
        payment_status: srv.payment_status || 'PENDIENTE_CONCILIACION',
        ncf: srv.ncf || 'B0200004921'
      }));

      setServicios(mapeados);
      if (!selectedService) {
        setSelectedService(mapeados[0]);
      } else {
        const actualizado = mapeados.find((s) => s.id === selectedService.id);
        if (actualizado) setSelectedService(actualizado);
      }
    } else {
      setServicios([]);
    }

    const { data: acompanantes } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'COMPANION');
    setAcompanantesActivos(acompanantes || []);

    const { data: apps } = await supabase
      .from('companion_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setExpedientes(apps || []);

    setLoading(false);
  }

  // 3. Cambiar Estado
  async function handleCambiarEstado(nuevoEstado: string) {
    if (!selectedService) return;
    setUpdating(true);

    const { error } = await supabase
      .from('service_requests')
      .update({ status: nuevoEstado })
      .eq('id', selectedService.id);

    if (!error) {
      setSelectedService({ ...selectedService, status: nuevoEstado });
      cargarDatos();
    } else {
      alert(`Error al actualizar estado: ${error.message}`);
    }
    setUpdating(false);
  }

  // 4. Protocolo SOS
  async function handleToggleSOS() {
    if (!selectedService) return;
    const nuevoSOS = selectedService.emergency_status === 'SOS_ACTIVE' ? 'NORMAL' : 'SOS_ACTIVE';

    if (nuevoSOS === 'SOS_ACTIVE') {
      if (!confirm('🚨 ¿DESEAS ACTIVAR EL PROTOCOLO SOS? Esto marcará la orden en rojo y notificará contingencia.')) {
        return;
      }
    }

    setUpdating(true);
    await supabase
      .from('service_requests')
      .update({ emergency_status: nuevoSOS })
      .eq('id', selectedService.id);

    setSelectedService({ ...selectedService, emergency_status: nuevoSOS });
    cargarDatos();
    setUpdating(false);
  }

  // 5. Asignar Personal
  async function handleAsignarPersonal() {
    if (!acompananteSeleccionado || !selectedService) return;
    const pers = acompanantesActivos.find(a => a.id === acompananteSeleccionado);
    if (!pers) return;

    setUpdating(true);
    const { error } = await supabase
      .from('service_requests')
      .update({
        companion_id: pers.id,
        companion_name: pers.full_name,
        companion_phone: pers.phone,
        status: 'ASSIGNED'
      })
      .eq('id', selectedService.id);

    if (!error) {
      setSelectedService({
        ...selectedService,
        companion_id: pers.id,
        companion_name: pers.full_name,
        companion_phone: pers.phone,
        status: 'ASSIGNED'
      });
      setAsignarModal(false);
      cargarDatos();
    }
    setUpdating(false);
  }

  // 6. Conciliar Pago
  async function handleConciliarPago() {
    if (!selectedService) return;
    const nuevoStatus = selectedService.payment_status === 'PAID' ? 'PENDIENTE_CONCILIACION' : 'PAID';
    
    setUpdating(true);
    await supabase
      .from('service_requests')
      .update({ payment_status: nuevoStatus })
      .eq('id', selectedService.id);

    setSelectedService({ ...selectedService, payment_status: nuevoStatus });
    cargarDatos();
    setUpdating(false);
  }

  // 7. Bitácora
  async function handleAnotarBitacora(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaBitacora.trim() || !selectedService) return;

    const anterior = selectedService.notes ? `${selectedService.notes}\n` : '';
    const nueva = `${anterior}[${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} Operaciones]: ${nuevaBitacora.trim()}`;

    setUpdating(true);
    await supabase
      .from('service_requests')
      .update({ special_notes: nueva })
      .eq('id', selectedService.id);

    setSelectedService({ ...selectedService, notes: nueva });
    setNuevaBitacora('');
    setUpdating(false);
    cargarDatos();
  }

  // 8. Mensajería WhatsApp
  function handleWhatsApp(tipo: 'PACIENTE' | 'ACOMPANANTE') {
    if (!selectedService) return;
    const telefono = tipo === 'PACIENTE' ? selectedService.client_phone : selectedService.companion_phone;
    if (!telefono) return;

    const num = telefono.replace(/[^0-9]/g, '');
    const telFinal = num.length === 10 ? '1' + num : num;

    const mensaje = tipo === 'PACIENTE'
      ? `🟢 *JUNTOS ASISTENCIA RD - Operaciones*\n\nHola *${selectedService.client_name}*, te confirmamos tu servicio:\n📍 *Punto:* ${selectedService.address}\n👤 *Acompañante:* ${selectedService.companion_name || 'En despacho'}\n🔑 *PIN de Encuentro:* ${selectedService.checkin_pin}\n🔑 *PIN de Salida:* ${selectedService.checkout_pin}`
      : `🟢 *JUNTOS ASISTENCIA RD - Asignación de Servicio*\n\nEstimado/a *${selectedService.companion_name}*, tienes un servicio activo:\n📍 *Destino:* ${selectedService.address}\n👤 *Paciente:* ${selectedService.client_name}\n📞 *Contacto:* ${selectedService.client_phone}`;

    window.open(`https://wa.me/${telFinal}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <ShieldAlert className="w-8 h-8 text-emerald-400 animate-pulse" />
        <p className="text-xs font-mono tracking-widest uppercase">Cargando Operaciones Central...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const serviciosEnCurso = servicios.filter(s => 
    ['IN_PROGRESS', 'ASSIGNED', 'PENDING_DISPATCH', 'SCHEDULED', 'EN_CURSO', 'PENDING'].includes((s.status || '').toUpperCase())
  );
  const serviciosHistorial = servicios.filter(s => 
    ['COMPLETED', 'CANCELLED', 'FINALIZADO'].includes((s.status || '').toUpperCase())
  );

  const listaActual = tab === 'EN_CURSO' ? serviciosEnCurso : serviciosHistorial;
  const listaFiltrada = listaActual.filter(s => 
    (s.client_name || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
    (s.companion_name || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
    s.id.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                DESPACHO & CONTROL CENTRAL 24/7
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Operaciones Central JUNTOS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              ↻ Sincronizar en Vivo
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Servicios Activos</span>
            <span className="text-xl font-black text-white">{serviciosEnCurso.length}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Acompañantes en Red</span>
            <span className="text-xl font-black text-emerald-400">{acompanantesActivos.length}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Alertas SOS</span>
            <span className="text-xl font-black text-rose-400">
              {servicios.filter(s => s.emergency_status === 'SOS_ACTIVE').length}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Postulantes RRHH</span>
            <span className="text-xl font-black text-amber-400">{expedientes.length}</span>
          </div>
        </div>
      </header>

      <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => { setTab('EN_CURSO'); setSelectedService(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'EN_CURSO' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Servicios en Curso ({serviciosEnCurso.length})</span>
          </button>

          <button
            onClick={() => { setTab('HISTORIAL'); setSelectedService(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'HISTORIAL' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial Finalizados ({serviciosHistorial.length})</span>
          </button>

          <button
            onClick={() => { setTab('EXPEDIENTES'); setSelectedService(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'EXPEDIENTES' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Acreditaciones PGR ({expedientes.length})</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BANDEJA IZQUIERDA */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[780px] overflow-hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por paciente, lugar, id..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {tab !== 'EXPEDIENTES' ? (
              listaFiltrada.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                  No hay servicios en esta bandeja.
                </div>
              ) : (
                listaFiltrada.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  const isSOS = srv.emergency_status === 'SOS_ACTIVE';

                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`p-4 rounded-2xl border cursor-pointer transition shadow-md ${
                        isSOS
                          ? 'bg-rose-950/60 border-rose-600 animate-pulse'
                          : isSelected
                          ? 'bg-slate-950 border-emerald-500 ring-1 ring-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">
                              #{srv.id.slice(0, 8).toUpperCase()}
                            </span>
                            {isSOS && (
                              <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded animate-pulse">
                                SOS
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white line-clamp-1">
                            {srv.client_name}
                          </h3>
                          <p className="text-[11px] text-emerald-400 font-medium">
                            {srv.companion_name ? `Acomp: ${srv.companion_name}` : '⚠️ Sin personal asignado'}
                          </p>
                        </div>

                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                          {srv.status}
                        </span>
                      </div>

                      <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between items-center font-mono">
                        <span className="truncate max-w-[65%]">📍 {srv.address}</span>
                        <span>{new Date(srv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              expedientes.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1.5 text-xs"
                >
                  <h3 className="font-bold text-white">{exp.nombre || exp.full_name || 'Postulante'}</h3>
                  <p className="text-slate-400 font-mono">Cédula: {exp.numero_documento || 'S/N'}</p>
                  <p className="text-emerald-400 font-mono">Tel: {exp.telefono || 'S/N'}</p>
                  <span className="inline-block text-[9px] font-mono bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                    {exp.estado || 'PENDIENTE'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DETALLE Y CONSOLA DE ACCIONES */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[780px] overflow-y-auto">
          {selectedService ? (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-500/40 text-emerald-400 px-2.5 py-0.5 rounded font-bold">
                      ORDEN ACTIVA
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {selectedService.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedService.client_name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {selectedService.address}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleSOS}
                    disabled={updating}
                    className={`text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition ${
                      selectedService.emergency_status === 'SOS_ACTIVE'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{selectedService.emergency_status === 'SOS_ACTIVE' ? 'SOS ACTIVO (CANCELAR)' : 'BOTÓN SOS'}</span>
                  </button>

                  <button
                    onClick={() => setAsignarModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Despachar Personal</span>
                  </button>

                  {selectedService.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCambiarEstado('IN_PROGRESS')}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition"
                    >
                      <Play className="w-3.5 h-3.5 inline mr-1" /> Iniciar
                    </button>
                  )}

                  {selectedService.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCambiarEstado('COMPLETED')}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Finalizar
                    </button>
                  )}
                </div>
              </div>

              {/* DOBLE PIN Y FINANZAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-400" /> Validación Presencial
                    </span>
                    <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      DOBLE PIN
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center pt-1">
                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">1. Pin Encuentro</span>
                      <span className="font-mono text-xl font-black text-emerald-400">{selectedService.checkin_pin}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">2. Pin Salida</span>
                      <span className="font-mono text-xl font-black text-amber-400">{selectedService.checkout_pin}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-400" /> Control Financiero
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      selectedService.payment_status === 'PAID' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}>
                      {selectedService.payment_status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Monto a Liquidar:</span>
                      <span className="font-mono text-lg font-black text-white">
                        RD$ {selectedService.rate_total?.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={handleConciliarPago}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition"
                    >
                      {selectedService.payment_status === 'PAID' ? 'Revertir a Pendiente' : '✓ Validar Pago Recibido'}
                    </button>
                  </div>
                </div>
              </div>

              {/* COMUNICACIÓN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <a
                  href={`tel:${selectedService.client_phone}`}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-center font-bold text-slate-300 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Llamar Paciente
                </a>

                <button
                  onClick={() => handleWhatsApp('PACIENTE')}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-xl text-center font-bold text-emerald-400 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> WhatsApp Paciente
                </button>

                <a
                  href={`tel:${selectedService.companion_phone}`}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-center font-bold text-slate-300 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Llamar Acompañante
                </a>

                <button
                  onClick={() => handleWhatsApp('ACOMPANANTE')}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-xl text-center font-bold text-emerald-400 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> WhatsApp Acompañante
                </button>
              </div>

              {/* BITÁCORA */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                  Bitácora de Eventos y Novedades del Servicio
                </h4>
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {selectedService.notes || 'No se han registrado novedades en esta orden todavía.'}
                </div>

                <form onSubmit={handleAnotarBitacora} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={nuevaBitacora}
                    onChange={(e) => setNuevaBitacora(e.target.value)}
                    placeholder="Registrar nueva nota u orden del despacho..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!nuevaBitacora.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs disabled:opacity-40 transition"
                  >
                    Anotar
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-24">
              <ShieldCheck className="w-12 h-12 text-slate-800 mb-2" />
              Selecciona una solicitud para abrir la consola de despacho y comandos.
            </div>
          )}
        </div>

      </main>

      {/* MODAL DE DESPACHO */}
      {asignarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Despachar Acompañante Acreditado
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
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
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
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAsignarPersonal}
                disabled={!acompananteSeleccionado || updating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}