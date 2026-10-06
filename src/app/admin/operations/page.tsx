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
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink
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

    // Cargar perfiles para mapear nombres y teléfonos de acompañantes
    const { data: acompanantes } = await supabase
      .from('profiles')
      .select('id, full_name, phone, status')
      .eq('role', 'COMPANION');
      
    // Solo aquellos aprobados pueden recibir despacho manual
    const soloAprobados = (acompanantes || []).filter(a => a.status === 'APROBADO');
    setAcompanantesActivos(soloAprobados);

    if (srvData && srvData.length > 0) {
      const mapeados: SolicitudServicio[] = srvData.map((srv: any) => {
        const comp = (acompanantes || []).find(a => a.id === srv.companion_id);
        return {
          ...srv,
          companion_id: srv.companion_id || undefined,
          companion_name: comp?.full_name || srv.companion_name || undefined,
          companion_phone: comp?.phone || srv.companion_phone || undefined,
          client_name: srv.recipient_name || srv.client_name || srv.for_who_name || 'Usuario Asistido',
          address: srv.facility_or_location || srv.address || 'Ubicación coordinada',
          scheduled_date: srv.scheduled_date || srv.requested_date,
          notes: srv.special_notes || srv.notes || '',
          client_phone: srv.recipient_phone || srv.client_phone || '809-541-2000',
          checkin_pin: srv.checkin_pin || srv.pin_start || srv.id.replace(/\D/g, '').slice(0, 4) || '2491',
          checkout_pin: srv.checkout_pin || srv.pin_end || srv.id.replace(/\D/g, '').slice(2, 6) || '8421',
          rate_total: Number(srv.total_amount || srv.rate_total || 1350),
          payment_status: srv.payment_status || 'PENDIENTE_CONCILIACION',
          ncf: srv.ncf || 'B0200004921'
        };
      });

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

    const { data: apps } = await supabase
      .from('companion_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setExpedientes(apps || []);

    setLoading(false);
  }

  // 3. Cambiar Estado del Servicio
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
      if (!confirm('🚨 ¿DESEAS ACTIVAR EL PROTOCOLO SOS? Esto marcará la orden en alerta prioritaria.')) {
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

  // 5. Asignar Personal (Solo modifica companion_id y status para evitar errores de schema)
  async function handleAsignarPersonal() {
    if (!acompananteSeleccionado || !selectedService) return;
    const pers = acompanantesActivos.find(a => a.id === acompananteSeleccionado);
    if (!pers) return;

    setUpdating(true);
    const { error } = await supabase
      .from('service_requests')
      .update({
        companion_id: pers.id,
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
    } else {
      alert(`Error al asignar personal: ${error.message}`);
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
    const nueva = `${anterior}[${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} Mesa Central]: ${nuevaBitacora.trim()}`;

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
      ? `🟢 *JUNTOS ASISTENCIA RD - Mesa de Operaciones*\n\nHola *${selectedService.client_name}*, te confirmamos tu servicio:\n📍 *Punto:* ${selectedService.address}\n👤 *Acompañante:* ${selectedService.companion_name || 'En despacho'}\n🔑 *PIN de Encuentro:* ${selectedService.checkin_pin}\n🔑 *PIN de Salida:* ${selectedService.checkout_pin}`
      : `🟢 *JUNTOS ASISTENCIA RD - Despacho Operativo*\n\nEstimado/a *${selectedService.companion_name}*, tienes un servicio asignado:\n📍 *Destino:* ${selectedService.address}\n👤 *Solicitante:* ${selectedService.client_name}\n📞 *Contacto:* ${selectedService.client_phone}`;

    window.open(`https://wa.me/${telFinal}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  // 9. APROBACIÓN DE EXPEDIENTE KYC (RRHH)
  async function handleAprobarKYC(exp: any) {
    if (!confirm(`¿Confirmas la acreditación oficial de ${exp.nombre || exp.full_name}?`)) return;
    setUpdating(true);

    await supabase
      .from('companion_applications')
      .update({ estado_depuracion: 'APROBADO', estado: 'APROBADO' })
      .eq('id', exp.id);

    await supabase
      .from('profiles')
      .update({ status: 'APROBADO', role: 'COMPANION' })
      .eq('id', exp.user_id);

    await cargarDatos();
    setUpdating(false);
  }

  // 10. RECHAZO DE EXPEDIENTE KYC (RRHH)
  async function handleRechazarKYC(exp: any) {
    const motivo = prompt('Indica el motivo de rechazo o inconsistencia en la documentación:');
    if (!motivo) return;

    setUpdating(true);
    await supabase
      .from('companion_applications')
      .update({ 
        estado_depuracion: 'RECHAZADO', 
        estado: 'RECHAZADO',
        observaciones_rrhh: motivo 
      })
      .eq('id', exp.id);

    await supabase
      .from('profiles')
      .update({ status: 'RECHAZADO' })
      .eq('id', exp.user_id);

    await cargarDatos();
    setUpdating(false);
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
              Mesa de Operaciones Central JUNTOS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
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
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Acompañantes Validados</span>
            <span className="text-xl font-black text-emerald-400">{acompanantesActivos.length}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Alertas SOS</span>
            <span className="text-xl font-black text-rose-400">
              {servicios.filter(s => s.emergency_status === 'SOS_ACTIVE').length}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Expedientes KYC</span>
            <span className="text-xl font-black text-amber-400">{expedientes.length}</span>
          </div>
        </div>
      </header>

      <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => { setTab('EN_CURSO'); setSelectedService(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'EN_CURSO' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Servicios en Curso ({serviciosEnCurso.length})</span>
          </button>

          <button
            onClick={() => { setTab('HISTORIAL'); setSelectedService(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'HISTORIAL' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial Finalizados ({serviciosHistorial.length})</span>
          </button>

          <button
            onClick={() => { setTab('EXPEDIENTES'); setSelectedService(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'EXPEDIENTES' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Acreditaciones RRHH ({expedientes.length})</span>
          </button>
        </div>
      </div>

      {tab !== 'EXPEDIENTES' ? (
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* BANDEJA IZQUIERDA */}
          <div className="lg:col-span-4 flex flex-col gap-3 max-h-[780px] overflow-hidden">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por usuario, lugar, ID..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {listaFiltrada.length === 0 ? (
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
                        ORDEN OPERATIVA
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
                      className={`text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
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
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Despachar Personal</span>
                    </button>

                    {selectedService.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCambiarEstado('IN_PROGRESS')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 inline mr-1" /> Iniciar
                      </button>
                    )}

                    {selectedService.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCambiarEstado('COMPLETED')}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Finalizar
                      </button>
                    )}
                  </div>
                </div>

                {/* DOBLE PIN Y FINANZAS (CONCILIACIÓN RD$ 1,350) */}
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
                        <Receipt className="w-4 h-4 text-emerald-400" /> Conciliación Financiera RD$
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
                        <span className="text-slate-400 text-[10px] block font-mono">
                          Total RD$ 1,350 (Acomp: $750 | JUNTOS: $600)
                        </span>
                        <span className="font-mono text-lg font-black text-white">
                          RD$ {selectedService.rate_total?.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={handleConciliarPago}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        {selectedService.payment_status === 'PAID' ? 'Revertir a Pendiente' : '✓ Validar Pago'}
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
                    <PhoneCall className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Llamar Usuario
                  </a>

                  <button
                    onClick={() => handleWhatsApp('PACIENTE')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-xl text-center font-bold text-emerald-400 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> WhatsApp Usuario
                  </button>

                  <a
                    href={`tel:${selectedService.companion_phone}`}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl text-center font-bold text-slate-300 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Llamar Acompañante
                  </a>

                  <button
                    onClick={() => handleWhatsApp('ACOMPANANTE')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 p-2.5 rounded-xl text-center font-bold text-emerald-400 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> WhatsApp Acomp.
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
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs disabled:opacity-40 transition cursor-pointer"
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
      ) : (
        /* PESTAÑA EXPEDIENTES KYC (RRHH) */
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Acreditación de Personal & Expedientes KYC
                </h2>
                <p className="text-xs text-slate-400">
                  Control de depuración penal PGR y verificación de identidad (Ley 172-13)
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-3 py-1 rounded-full">
                Total: {expedientes.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="p-3">Postulante</th>
                    <th className="p-3">Documento (ID)</th>
                    <th className="p-3">WhatsApp / Teléfono</th>
                    <th className="p-3">Sector / Domicilio</th>
                    <th className="p-3">Estado RRHH</th>
                    <th className="p-3 text-right">Acción de Acreditación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {expedientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No hay postulaciones registradas.
                      </td>
                    </tr>
                  ) : (
                    expedientes.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3">
                          <strong className="text-white block">{exp.nombre || exp.full_name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(exp.created_at || exp.fecha_solicitud || Date.now()).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {exp.tipo_documento || 'CEDULA'}: {exp.numero_documento || 'S/N'}
                        </td>
                        <td className="p-3 font-mono text-emerald-400">
                          {exp.telefono_whatsapp || exp.phone || 'S/N'}
                        </td>
                        <td className="p-3 text-slate-300">
                          {exp.domicilio_sector || exp.sector || 'Santo Domingo'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.estado_depuracion === 'APROBADO' || exp.estado === 'APROBADO'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : exp.estado_depuracion === 'RECHAZADO'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          }`}>
                            {exp.estado_depuracion || exp.estado || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {exp.estado_depuracion !== 'APROBADO' && exp.estado !== 'APROBADO' && (
                              <button
                                onClick={() => handleAprobarKYC(exp)}
                                disabled={updating}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar</span>
                              </button>
                            )}
                            {exp.estado_depuracion !== 'RECHAZADO' && (
                              <button
                                onClick={() => handleRechazarKYC(exp)}
                                disabled={updating}
                                className="bg-slate-900 hover:bg-rose-950 hover:text-rose-300 text-slate-400 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* MODAL DE DESPACHO */}
      {asignarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Despachar Acompañante Acreditado
              </h3>
              <button onClick={() => setAsignarModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-bold block">Selecciona personal depurado por la PGR:</label>
              <select
                value={acompananteSeleccionado}
                onChange={(e) => setAcompananteSeleccionado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 cursor-pointer"
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
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAsignarPersonal}
                disabled={!acompananteSeleccionado || updating}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
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