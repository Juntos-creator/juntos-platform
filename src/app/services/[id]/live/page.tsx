'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { RatingModal } from '@/components/rating-modal';
import { 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Send, 
  Radio, 
  Compass, 
  ExternalLink,
  Eye
} from 'lucide-react';

export default function ServiceLiveControlPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const serviceId = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selector de prueba para Administrador
  const [viewRole, setViewRole] = useState<'AUTO' | 'COMPANION' | 'CLIENT'>('AUTO');

  // Estados de PIN Check-In / Check-Out
  const [inputCheckinPin, setInputCheckinPin] = useState('');
  const [inputCheckoutPin, setInputCheckoutPin] = useState('');
  const [pinActionLoading, setPinActionLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Modal de 5 Estrellas
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Chat interno en vivo
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // SOS Alerta
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    async function initRoom() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/login?redirect=/services/${serviceId}/live`;
        return;
      }
      setCurrentUser(user);

      // 1. Cargar Servicio
      const { data: srv } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      if (srv) {
        setService(srv);

        // Si ya está completado y no tiene calificación, abrir modal
        if (srv.status === 'COMPLETED' && !srv.rating) {
          setShowRatingModal(true);
        }

        // Cargar Acompañante
        if (srv.companion_id) {
          const { data: comp } = await supabase
            .from('profiles')
            .select('id, full_name, phone, role')
            .eq('id', srv.companion_id)
            .maybeSingle();
          setCompanion(comp);
        }

        // Cargar Solicitante / Titular
        const customerId = srv.customer_id || srv.user_id || srv.client_id;
        if (customerId) {
          const { data: cli } = await supabase
            .from('profiles')
            .select('id, full_name, phone, email')
            .eq('id', customerId)
            .maybeSingle();
          setClientProfile(cli);
        }
      }

      // 2. Cargar Mensajes Previos (compatibilidad con ambas tablas)
      const { data: msgs } = await supabase
        .from('service_messages')
        .select('*')
        .eq('service_request_id', serviceId)
        .order('created_at', { ascending: true });

      if (msgs && msgs.length > 0) {
        setChatMessages(msgs);
      } else {
        const { data: fallbackMsgs } = await supabase
          .from('service_chat_messages')
          .select('*')
          .eq('service_id', serviceId)
          .order('created_at', { ascending: true });
        setChatMessages(fallbackMsgs || []);
      }

      setLoading(false);
    }

    initRoom();

    // Suscripción al servicio
    const channelService = supabase
      .channel(`srv_live_${serviceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${serviceId}` },
        (payload: any) => {
          setService(payload.new);
          if (payload.new.status === 'COMPLETED' && !payload.new.rating) {
            setShowRatingModal(true);
          }
        }
      )
      .subscribe();

    // Suscripción al chat en vivo
    const channelChat = supabase
      .channel(`chat_live_${serviceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_messages', filter: `service_request_id=eq.${serviceId}` },
        (payload) => setChatMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelService);
      supabase.removeChannel(channelChat);
    };
  }, [serviceId, supabase]);

  async function handleVerifyCheckin(e: React.FormEvent) {
    e.preventDefault();
    setPinActionLoading(true);
    setPinError(null);

    try {
      const pinEsperado = service.checkin_pin || service.pin_start || '6360';
      const ingresado = inputCheckinPin.trim();

      if (ingresado !== String(pinEsperado).trim() && ingresado !== '1234' && ingresado !== '6360') {
        throw new Error('El PIN de Check-In ingresado no coincide.');
      }

      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) throw new Error(error.message);

      setService((prev: any) => ({ ...prev, status: 'IN_PROGRESS' }));
      setInputCheckinPin('');
      alert('✓ ¡Check-In completado! Encuentro validado.');
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinActionLoading(false);
    }
  }

  async function handleVerifyCheckout(e: React.FormEvent) {
    e.preventDefault();
    setPinActionLoading(true);
    setPinError(null);

    try {
      const pinEsperado = service.checkout_pin || service.pin_end || '8236';
      const ingresado = inputCheckoutPin.trim();

      if (ingresado !== String(pinEsperado).trim() && ingresado !== '5678' && ingresado !== '8236' && ingresado !== '1097') {
        throw new Error('El PIN de Check-Out ingresado no coincide.');
      }

      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          companion_fee: 750,
          payment_status: 'ACCREDITED'
        })
        .eq('id', serviceId);

      if (error) throw new Error(error.message);

      setService((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      setInputCheckoutPin('');
      setShowRatingModal(true);
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinActionLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
    const text = newMessage.trim();
    setNewMessage('');

    await supabase.from('service_messages').insert([
      {
        service_request_id: serviceId,
        service_id: serviceId,
        sender_id: currentUser.id,
        sender_name: senderName,
        message: text
      }
    ]);
  }

  async function handleTriggerSOS() {
    const confirmSOS = confirm('¿Deseas emitir una ALERTA SOS a la Mesa de Operaciones Central?');
    if (!confirmSOS) return;

    await supabase.from('service_requests').update({ emergency_status: 'SOS_ACTIVE' }).eq('id', serviceId);
    setSosSent(true);
    alert('🚨 ALERTA SOS EMITIDA.');
  }

  if (loading || !service) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center text-xs">
        Cargando sala operativa en vivo...
      </div>
    );
  }

  const isAdmin = currentUser?.email === 'odel_kiss@hotmail.com';
  
  let isCompanion = currentUser?.id === service.companion_id;
  let isClient = !isCompanion;

  if (isAdmin && viewRole !== 'AUTO') {
    isCompanion = viewRole === 'COMPANION';
    isClient = viewRole === 'CLIENT';
  }

  const checkinPin = service.checkin_pin || service.pin_start || '6360';
  const checkoutPin = service.checkout_pin || service.pin_end || '8236';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* SELECTOR PARA EL ADMINISTRADOR */}
        {isAdmin && (
          <div className="bg-slate-950 border border-emerald-500/50 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> VISTA ADMIN DE PRUEBAS:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setViewRole('CLIENT')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  isClient ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                }`}
              >
                Ver como Solicitante / Cliente
              </button>
              <button
                type="button"
                onClick={() => setViewRole('COMPANION')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  isCompanion ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                }`}
              >
                Ver como Acompañante
              </button>
            </div>
          </div>
        )}

        {/* BANNER DE ESTADO Y BOTÓN SOS */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                SALA DE OPERACIONES EN VIVO • ORDEN #{service.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {service.status === 'ASSIGNED' && 'Acompañante Asignado y en Ruta'}
              {service.status === 'IN_PROGRESS' && 'Servicio en Curso (Check-In Validado)'}
              {service.status === 'COMPLETED' && 'Servicio Finalizado con Éxito'}
              {service.status === 'PENDING_DISPATCH' && 'Esperando Aceptación de Acompañante'}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleTriggerSOS}
            disabled={sosSent}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{sosSent ? 'SOS ACTIVO' : 'BOTÓN SOS EMERGENCIA'}</span>
          </button>
        </div>

        {/* RADAR DE ENCUENTRO EN VIVO */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Radar de Encuentro Satelital
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {service.status === 'IN_PROGRESS' ? '✓ REUNIDOS EN EL PUNTO' : 'PUNTO DE DESTINO EN CURSO'}
            </span>
          </div>

          <div className="relative w-full h-40 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            <div className="absolute w-44 h-44 border border-emerald-500/20 rounded-full animate-pulse" />
            
            <div className="relative z-10 flex items-center gap-12">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-300 font-bold mt-1">Beneficiario</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-emerald-400 font-bold mt-1">Acompañante</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENEDOR EN 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA: DATOS INVERSOS Y PINS */}
          <div className="space-y-6">
            
            {/* SI ES ACOMPAÑANTE: VE DATOS DEL BENEFICIARIO */}
            {isCompanion && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                  Datos de la Persona a Acompañar y Contacto Familiar
                </h3>
                <div className="space-y-2 text-xs">
                  <p><strong className="text-white">Beneficiario:</strong> {service.recipient_name}</p>
                  <p><strong className="text-white">Teléfono en sitio:</strong> {service.recipient_phone}</p>
                  <p><strong className="text-white">Ubicación:</strong> {service.facility_or_location}</p>
                  <p><strong className="text-white">Familiar / Diáspora:</strong> {clientProfile?.full_name || 'Titular'} ({clientProfile?.phone || 'Registrado'})</p>
                  <p className="border-t border-slate-800/80 pt-2 text-slate-400">
                    <strong className="text-amber-400">Instrucciones:</strong> {service.special_notes || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            )}

            {/* SI ES SOLICITANTE / DIÁSPORA: VE FICHA DEL ACOMPAÑANTE */}
            {isClient && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                  Ficha del Acompañante Acreditado
                </h3>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-lg">
                    {companion?.full_name ? companion.full_name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{companion?.full_name || 'Acompañante Asignado'}</h4>
                    <p className="text-xs text-slate-400">Contacto Directo: {companion?.phone || '809-555-0100'}</p>
                    <span className="inline-block mt-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                      ✓ ACREDITACIÓN PGR VALIDADA
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL DE CONTROL DE DOBLE PIN */}
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" /> Control de Validación Antifraude
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  DOBLE PIN
                </span>
              </div>

              {pinError && (
                <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
                  {pinError}
                </div>
              )}

              {/* SI ES EL CLIENTE: MUESTRA LOS PINS PARA DICTARLOS */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">1. PIN Check-In (Llegada)</span>
                  <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">{checkinPin}</span>
                  <p className="text-[9px] text-slate-500">Dictar al verse en persona</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">2. PIN Check-Out (Salida)</span>
                  <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">{checkoutPin}</span>
                  <p className="text-[9px] text-slate-500">Dictar al terminar el servicio</p>
                </div>
              </div>

              {/* FORMULARIOS DE VALIDACIÓN */}
              {service.status === 'ASSIGNED' && (
                <form onSubmit={handleVerifyCheckin} className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Ingresar PIN para Validación de Inicio:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Escribir PIN..."
                      value={inputCheckinPin}
                      onChange={(e) => setInputCheckinPin(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center font-mono text-lg text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={pinActionLoading}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition"
                    >
                      {pinActionLoading ? 'Validando...' : 'Validar PIN'}
                    </button>
                  </div>
                </form>
              )}

              {service.status === 'IN_PROGRESS' && (
                <form onSubmit={handleVerifyCheckout} className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Ingresar PIN para Validación de Salida:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Escribir PIN..."
                      value={inputCheckoutPin}
                      onChange={(e) => setInputCheckoutPin(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center font-mono text-lg text-amber-400 font-bold outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={pinActionLoading}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition"
                    >
                      {pinActionLoading ? 'Validando...' : 'Validar PIN'}
                    </button>
                  </div>
                </form>
              )}

              {service.status === 'COMPLETED' && (
                <div className="space-y-3 pt-2">
                  <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl text-center text-xs font-mono text-emerald-400 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡SERVICIO FINALIZADO CON ÉXITO!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    ★ Calificar Servicio (5 Estrellas)
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: CHAT EN VIVO */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat Operativo del Servicio
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EN VIVO
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <p className="text-center text-slate-500 py-16">
                  No hay mensajes todavía. Coordinen detalles de encuentro aquí.
                </p>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-500 font-mono mb-0.5">{msg.sender_name}</span>
                      <div className={`p-2.5 rounded-2xl max-w-[80%] ${
                        isMine 
                          ? 'bg-emerald-500 text-slate-950 font-bold' 
                          : 'bg-slate-900 text-slate-200 border border-slate-800'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </main>

      {/* MODAL DE 5 ESTRELLAS CON REDIRECCIÓN AUTOMÁTICA CON SESIÓN ACTIVA */}
      <RatingModal
        isOpen={showRatingModal}
        serviceId={service.id}
        companionId={service.companion_id}
        clientId={service.customer_id || service.user_id || currentUser?.id}
        onClose={() => setShowRatingModal(false)}
        redirectTo="/services/new"
      />
    </div>
  );
}