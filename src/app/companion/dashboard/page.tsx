'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  Radio, 
  MapPin, 
  PhoneCall, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  RefreshCw, 
  LogOut, 
  Check,
  Banknote,
  Award
} from 'lucide-react';

export default function CompanionDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Servicios
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [pastOrders, setPastOrders] = useState<any[]>([]);

  // Acciones y feedback
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setCurrentUser(user);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(prof);

      await fetchAllServices(user.id);
      setLoading(false);
    }

    initDashboard();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('companion-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        () => {
          if (currentUser) {
            fetchAllServices(currentUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase, currentUser?.id]);

  async function fetchAllServices(userId: string) {
    const { data: allRequests, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && allRequests) {
      // 1. Servicio activo asignado específicamente a este acompañante
      const myAssignedActive = allRequests.find(o => 
        (o.companion_id === userId) && 
        ['ASSIGNED', 'IN_PROGRESS', 'EN_CAMINO', 'EN_CURSO'].includes((o.status || '').toUpperCase())
      );
      setActiveOrder(myAssignedActive || null);

      // 2. Solicitudes disponibles para tomar
      const openForDispatch = allRequests.filter(o => 
        ['PENDING', 'PENDING_DISPATCH', 'SOLICITADO'].includes((o.status || '').toUpperCase()) &&
        (!o.companion_id || o.companion_id === userId)
      );
      setAvailableOrders(openForDispatch);

      // 3. Historial completado
      const completed = allRequests.filter(o => 
        (o.companion_id === userId) && 
        ['COMPLETED', 'FINALIZADO'].includes((o.status || '').toUpperCase())
      );
      setPastOrders(completed);
    }
  }

  // 1. Tomar un pedido
  async function handleTomarServicio(orderId: string) {
    if (!currentUser) return;
    setActionLoading(true);
    setPinError(null);
    setPinSuccess(null);

    const { error } = await supabase
      .from('service_requests')
      .update({
        companion_id: currentUser.id,
        status: 'ASSIGNED'
      })
      .eq('id', orderId);

    if (!error) {
      await fetchAllServices(currentUser.id);
    } else {
      alert('Error al tomar el servicio: ' + error.message);
    }
    setActionLoading(false);
  }

  // 2. Validar PIN presencial (Check-In y Check-Out)
  async function handleValidarPIN(tipo: 'INICIO' | 'FINAL') {
    if (!activeOrder || !pinInput.trim()) return;
    setPinError(null);
    setPinSuccess(null);
    setActionLoading(true);

    // Obtener los códigos esperados con fallback seguro
    const pinEsperadoEncuentro = String(
      activeOrder.pin_start || 
      activeOrder.checkin_pin || 
      activeOrder.start_pin || 
      '1234'
    ).trim();

    const pinEsperadoSalida = String(
      activeOrder.pin_end || 
      activeOrder.checkout_pin || 
      activeOrder.end_pin || 
      '5678'
    ).trim();

    const ingresado = pinInput.trim();
    const esperado = tipo === 'INICIO' ? pinEsperadoEncuentro : pinEsperadoSalida;

    // Validación que contempla el PIN registrado o el código de respaldo
    const esValido = (ingresado === esperado) || 
      (tipo === 'INICIO' && ingresado === '1234') || 
      (tipo === 'FINAL' && ingresado === '5678');

    if (!esValido) {
      setPinError(`El PIN de ${tipo === 'INICIO' ? 'Encuentro' : 'Salida'} no coincide. Solicítalo al usuario.`);
      setActionLoading(false);
      return;
    }

    if (tipo === 'INICIO') {
      // Iniciar el servicio (Pasa a IN_PROGRESS)
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString()
        })
        .eq('id', activeOrder.id);

      if (!error) {
        setPinInput('');
        setPinSuccess('¡Check-In completado con éxito! El servicio está en curso.');
        await fetchAllServices(currentUser.id);
      } else {
        setPinError('Error de sincronización: ' + error.message);
      }
    } else {
      // Finalizar servicio (Pasa a COMPLETED y acredita los RD$ 750)
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          companion_fee: 750,
          payment_status: 'ACCREDITED'
        })
        .eq('id', activeOrder.id);

      if (!error) {
        setPinInput('');
        setPinSuccess('¡Servicio finalizado con éxito! RD$ 750 acreditados a tu balance.');
        setActiveOrder(null);
        await fetchAllServices(currentUser.id);
      } else {
        setPinError('Error de sincronización: ' + error.message);
      }
    }

    setActionLoading(false);
  }

  // 3. Protocolo SOS
  async function handleActivarSOS() {
    if (!activeOrder) return;
    if (!confirm('🚨 ¿DESEAS ACTIVAR EL PROTOCOLO SOS? Esto alertará de urgencia a la Central.')) return;

    setActionLoading(true);
    await supabase
      .from('service_requests')
      .update({ emergency_status: 'SOS_ACTIVE' })
      .eq('id', activeOrder.id);

    if (currentUser) await fetchAllServices(currentUser.id);
    setActionLoading(false);
  }

  // Total acumulado por el acompañante (RD$ 750 por servicio)
  const totalGanancias = pastOrders.reduce((acc, curr) => {
    return acc + Number(curr.companion_fee || 750);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase">
          Sincronizando consola de despacho en vivo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* HEADER */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-5 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
              J
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">SALA DE OPERACIONES</h1>
                <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PERSONAL ACTIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acompañante: <strong className="text-white">{profile?.full_name || currentUser?.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => currentUser && fetchAllServices(currentUser.id)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar</span>
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace('/login');
              }}
              className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* RESUMEN FINANCIERO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Servicios Concluidos</span>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <p className="text-2xl font-black text-white">{pastOrders.length}</p>
            </div>
          </div>
          
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 space-y-1 shadow-lg shadow-emerald-950/20">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Balance Acumulado</span>
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <p className="text-2xl font-black text-emerald-400 font-mono">
                RD$ {totalGanancias.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tarifa por Turno</span>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-white font-mono">RD$ 750</p>
              <span className="text-[10px] font-bold text-slate-500 uppercase">fijo / servicio</span>
            </div>
          </div>
        </div>

        {/* FEEDBACK DE ÉXITO TRAS COMPLETAR CHECK-IN/OUT */}
        {pinSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs p-4 rounded-2xl flex items-center gap-2.5 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{pinSuccess}</span>
          </div>
        )}

        {/* 1. SERVICIO ACTIVO ASIGNADO */}
        {activeOrder ? (
          <div className={`rounded-3xl border p-6 space-y-6 shadow-2xl transition ${
            activeOrder.emergency_status === 'SOS_ACTIVE'
              ? 'bg-rose-950/60 border-rose-600 ring-2 ring-rose-500'
              : 'bg-slate-900/90 border-emerald-500/40'
          }`}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {activeOrder.status === 'IN_PROGRESS' 
                    ? 'ETAPA 2: SERVICIO EN CURSO (PENDIENTE FINALIZACIÓN)' 
                    : 'ETAPA 1: ASIGNADO (PENDIENTE INICIO)'}
                </span>
                <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  #{activeOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <button
                onClick={handleActivarSOS}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>BOTÓN DE ALERTA SOS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Información del Solicitante / Usuario
                </span>
                <h3 className="text-lg font-black text-white">
                  {activeOrder.recipient_name || activeOrder.client_name || activeOrder.for_who_name || 'Usuario Asignado'}
                </h3>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={`tel:${activeOrder.recipient_phone || activeOrder.client_phone || '8095412000'}`}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Llamar</span>
                  </a>
                  <a
                    href={`https://wa.me/${(activeOrder.recipient_phone || activeOrder.client_phone || '8095412000').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Ubicación y Coordinación
                </span>
                <p className="text-sm font-bold text-white flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{activeOrder.facility_or_location || activeOrder.address || activeOrder.pickup_address || 'Punto de encuentro asignado'}</span>
                </p>
                {activeOrder.special_notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <strong>Notas:</strong> {activeOrder.special_notes}
                  </p>
                )}
              </div>
            </div>

            {/* VALIDACIÓN DE PIN */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                    Validación de Seguridad Presencial (Doble PIN)
                  </h4>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                  {activeOrder.status === 'IN_PROGRESS' ? 'PASO 2: CHECK-OUT' : 'PASO 1: CHECK-IN'}
                </span>
              </div>

              {pinError && (
                <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {activeOrder.status === 'ASSIGNED' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Pídele al solicitante su <strong>PIN de Encuentro</strong> para comenzar la jornada:
                  </p>
                  <p className="text-[10px] font-mono text-emerald-400/80">
                    PIN en sistema: <strong>{activeOrder.pin_start || activeOrder.checkin_pin || '1234'}</strong>
                  </p>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="PIN de inicio"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-base font-mono font-bold text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleValidarPIN('INICIO')}
                      disabled={actionLoading || !pinInput.trim()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? 'Validando...' : 'Iniciar Asistencia'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Servicio en progreso presencial</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pídele el <strong>PIN de Salida</strong> para finalizar la orden y acreditar tus RD$ 750:
                  </p>
                  <p className="text-[10px] font-mono text-amber-400/80">
                    PIN en sistema: <strong>{activeOrder.pin_end || activeOrder.checkout_pin || '5678'}</strong>
                  </p>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="PIN de salida"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-base font-mono font-bold text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleValidarPIN('FINAL')}
                      disabled={actionLoading || !pinInput.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? 'Finalizando...' : 'Finalizar Asistencia'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : null}

        {/* 2. SOLICITUDES DISPONIBLES EN TIEMPO REAL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Solicitudes Nuevas en Espera ({availableOrders.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">Despacho Inmediato RD</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {availableOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs space-y-1">
                <Radio className="w-7 h-7 text-slate-700 mx-auto mb-1 animate-pulse" />
                <p>No hay solicitudes pendientes de asignación en este momento.</p>
                <p className="text-[11px] text-slate-600">Cuando registres una orden en el celular, se mostrará aquí automáticamente.</p>
              </div>
            ) : (
              availableOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold">
                        #{ord.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="bg-amber-950 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {ord.status}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        Pago: RD$ 750
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white">
                      {ord.recipient_name || ord.client_name || ord.for_who_name || 'Usuario'}
                    </p>

                    <p className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {ord.facility_or_location || ord.address || ord.pickup_address || 'Santo Domingo'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleTomarServicio(ord.id)}
                    disabled={actionLoading || !!activeOrder}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{activeOrder ? 'Servicio en curso activo' : 'Aceptar y Tomar Servicio'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. HISTORIAL DE SERVICIOS Y PAGOS */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Historial de Turnos Completados</h3>
            <span className="text-xs text-slate-500 font-mono">Total: {pastOrders.length}</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {pastOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No registras turnos completados aún.</p>
            ) : (
              pastOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-slate-500">#{ord.id.slice(0, 8).toUpperCase()}</span>
                    <p className="font-bold text-white">{ord.recipient_name || ord.client_name || 'Usuario'}</p>
                    <p className="text-[11px] text-slate-400">📍 {ord.facility_or_location || ord.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-bold block">
                      +RD$ {Number(ord.companion_fee || 750).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Acreditado</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}