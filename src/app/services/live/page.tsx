'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Radio, 
  UserPlus,
  X,
  Edit3,
  CalendarPlus,
  Lock,
  Unlock
} from 'lucide-react';

function LiveRoomContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id');
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('CLIENT');
  const [service, setService] = useState<any>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Estados de PIN
  const [pinMode, setPinMode] = useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN');
  const [inputPin, setInputPin] = useState('');
  const [pinActionLoading, setPinActionLoading] = useState(false);
  const [pinFeedback, setPinFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Chat Operativo
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Modal para Asignar / Cambiar Acompañante
  const [showEditCompanionModal, setShowEditCompanionModal] = useState(false);
  const [allCompanions, setAllCompanions] = useState<any[]>([]);
  const [selectedCompanionId, setSelectedCompanionId] = useState('');
  const [savingComp, setSavingComp] = useState(false);

  // SOS
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/login?redirect=/services/live${rawId ? `?id=${rawId}` : ''}`;
        return;
      }
      setCurrentUser(user);

      // Obtener rol del usuario actual
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile?.role) {
        setCurrentUserRole(userProfile.role);
      }

      let targetId = rawId?.trim();

      // Fallback 1: Buscar orden más reciente del usuario
      if (!targetId) {
        const { data: userLatest } = await supabase
          .from('service_requests')
          .select('id')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userLatest) targetId = userLatest.id;
      }

      // Fallback 2: Buscar orden más reciente global (para Admin / Acompañante)
      if (!targetId) {
        const { data: globalLatest } = await supabase
          .from('service_requests')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (globalLatest) targetId = globalLatest.id;
      }

      if (!targetId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: srv } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      if (!srv) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setService(srv);
      setSosSent(srv.emergency_status === 'SOS_ACTIVE');
      if (srv.status === 'IN_PROGRESS') {
        setPinMode('CHECKOUT');
      }

      // Cargar lista de acompañantes registrados
      const { data: compList } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .in('role', ['COMPANION', 'ACOMPANANTE']);
      setAllCompanions(compList || []);

      // Cargar acompañante asignado
      const companionId = srv.assigned_companion_id || srv.companion_id;
      let compInfo: any = null;
      if (companionId) {
        const { data: comp } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, email')
          .eq('id', companionId)
          .maybeSingle();
        compInfo = comp;
      }

      const nombreAcomp = 
        compInfo?.full_name || 
        srv.companion_name || 
        (companionId ? 'Acompañante Asignado' : 'Por asignar por Mesa Central');

      const telAcomp = 
        compInfo?.phone || 
        srv.companion_phone || 
        '809-541-2000';

      setCompanion({
        id: companionId,
        full_name: nombreAcomp,
        phone: telAcomp
      });
      setSelectedCompanionId(companionId || '');

      // Cargar datos del solicitante/familiar
      const customerId = srv.client_id || srv.customer_id || srv.user_id;
      if (customerId) {
        const { data: cli } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('id', customerId)
          .maybeSingle();
        setClientProfile(cli);
      }

      // Cargar Mensajes con compatibilidad de tablas
      let { data: msgs } = await supabase
        .from('service_chat_messages')
        .select('*')
        .eq('service_id', targetId)
        .order('created_at', { ascending: true });

      if (!msgs || msgs.length === 0) {
        const { data: altMsgs } = await supabase
          .from('service_messages')
          .select('*')
          .eq('service_request_id', targetId)
          .order('created_at', { ascending: true });
        msgs = altMsgs;
      }

      setChatMessages(msgs || []);
      setLoading(false);
    }

    loadData();
  }, [rawId, supabase]);

  // Suscripción Realtime para chat y estado del servicio
  useEffect(() => {
    if (!service?.id) return;

    const channel = supabase
      .channel(`live_channel_${service.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_chat_messages', filter: `service_id=eq.${service.id}` },
        (payload) => {
          setChatMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_messages', filter: `service_request_id=eq.${service.id}` },
        (payload) => {
          setChatMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${service.id}` },
        (payload) => {
          setService(payload.new);
          if (payload.new.status === 'IN_PROGRESS') {
            setPinMode('CHECKOUT');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [service?.id, supabase]);

  // Auto-scroll del chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 1. VALIDACIÓN SEGURA DEL PIN MEDIANTE RPC
  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;

    setPinActionLoading(true);
    setPinFeedback(null);

    const enteredPin = inputPin.trim();

    try {
      // Intentar primero con la función segura en base de datos
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('verify_service_pin', {
        p_service_id: service.id,
        p_pin: enteredPin,
        p_pin_type: pinMode
      });

      if (!rpcError && rpcSuccess) {
        const nextStatus = pinMode === 'CHECKIN' ? 'IN_PROGRESS' : 'COMPLETED';
        setService((prev: any) => ({ ...prev, status: nextStatus }));
        setPinFeedback({
          type: 'success',
          text: pinMode === 'CHECKIN' ? 'Check-In validado. Servicio en curso.' : 'Check-Out validado. Servicio finalizado.'
        });
        setInputPin('');
        if (pinMode === 'CHECKIN') setPinMode('CHECKOUT');
        setPinActionLoading(false);
        return;
      }

      // Fallback frontend si la RPC no estuviese compilada
      const expectedPin = pinMode === 'CHECKIN' 
        ? (service.checkin_pin || '').toString() 
        : (service.checkout_pin || '').toString();

      if (expectedPin && enteredPin === expectedPin) {
        const nextStatus = pinMode === 'CHECKIN' ? 'IN_PROGRESS' : 'COMPLETED';
        const { error } = await supabase
          .from('service_requests')
          .update({ status: nextStatus })
          .eq('id', service.id);

        if (error) throw error;

        setService((prev: any) => ({ ...prev, status: nextStatus }));
        setPinFeedback({
          type: 'success',
          text: pinMode === 'CHECKIN' ? 'Check-In validado con éxito.' : 'Check-Out completado con éxito.'
        });
        setInputPin('');
        if (pinMode === 'CHECKIN') setPinMode('CHECKOUT');
      } else {
        throw new Error('El PIN ingresado es incorrecto.');
      }
    } catch (err: any) {
      setPinFeedback({
        type: 'error',
        text: err.message || 'Error al validar el PIN.'
      });
    } finally {
      setPinActionLoading(false);
    }
  }

  // 2. ENVIAR MENSAJE AL CHAT
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !service || !currentUser) return;

    const texto = newMessage.trim();
    setNewMessage('');
    setSendingMsg(true);

    const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
    const tempMsg = {
      id: `temp_${Date.now()}`,
      service_id: service.id,
      sender_id: currentUser.id,
      sender_name: senderName,
      message: texto,
      created_at: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, tempMsg]);

    try {
      const { error: err1 } = await supabase
        .from('service_chat_messages')
        .insert([{
          service_id: service.id,
          sender_id: currentUser.id,
          sender_name: senderName,
          message: texto
        }]);

      if (err1) {
        await supabase
          .from('service_messages')
          .insert([{
            service_request_id: service.id,
            sender_id: currentUser.id,
            sender_name: senderName,
            message: texto
          }]);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setSendingMsg(false);
    }
  }

  // 3. ASIGNAR / ACTUALIZAR ACOMPAÑANTE
  async function handleSaveCompanion() {
    if (!selectedCompanionId || !service) return;

    setSavingComp(true);
    const chosen = allCompanions.find(c => c.id === selectedCompanionId);
    if (!chosen) {
      setSavingComp(false);
      return;
    }

    const { error } = await supabase
      .from('service_requests')
      .update({
        assigned_companion_id: chosen.id,
        companion_id: chosen.id,
        companion_name: chosen.full_name,
        companion_phone: chosen.phone,
        status: (service.status === 'PENDING' || service.status === 'PENDING_DISPATCH') ? 'ASSIGNED' : service.status
      })
      .eq('id', service.id);

    if (!error) {
      setCompanion({
        id: chosen.id,
        full_name: chosen.full_name,
        phone: chosen.phone
      });
      setService((prev: any) => ({
        ...prev,
        assigned_companion_id: chosen.id,
        companion_id: chosen.id,
        companion_name: chosen.full_name,
        companion_phone: chosen.phone,
        status: (prev.status === 'PENDING' || prev.status === 'PENDING_DISPATCH') ? 'ASSIGNED' : prev.status
      }));
      setShowEditCompanionModal(false);
    } else {
      alert(`Error al asignar: ${error.message}`);
    }
    setSavingComp(false);
  }

  // 4. ALERTA SOS
  async function handleTriggerSOS() {
    if (!service) return;
    const confirmSOS = confirm('¿Deseas emitir una ALERTA SOS prioritaria a la Mesa Central de Operaciones?');
    if (!confirmSOS) return;

    await supabase.from('service_requests').update({ emergency_status: 'SOS_ACTIVE' }).eq('id', service.id);
    setSosSent(true);
    alert('🚨 ALERTA SOS EMITIDA a la Mesa Central.');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando sala operativa en vivo...</p>
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <Radio className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
          <h2 className="text-xl font-black text-white">No hay órdenes activas</h2>
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition"
          >
            <CalendarPlus className="w-4 h-4" /> Solicitar Nuevo Acompañante
          </Link>
        </div>
      </div>
    );
  }

  const checkinPin = service.checkin_pin || '----';
  const checkoutPin = service.checkout_pin || '----';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* HEADER DE ESTADO Y BOTONES */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                SALA EN VIVO • ORDEN #{service.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {service.status === 'IN_PROGRESS' && 'Servicio en Curso (Check-In Validado)'}
              {service.status === 'ASSIGNED' && 'Acompañante Asignado (Esperando Encuentro)'}
              {service.status === 'COMPLETED' && 'Servicio Finalizado'}
              {service.status === 'PENDING_DISPATCH' && 'En Espera de Despacho Operativo'}
              {!['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PENDING_DISPATCH'].includes(service.status) && `Servicio Activo (${service.status})`}
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['ADMIN', 'AUDITOR'].includes(currentUserRole) && (
              <button
                type="button"
                onClick={() => setShowEditCompanionModal(true)}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Asignar Personal
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerSOS}
              disabled={sosSent}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{sosSent ? 'SOS ACTIVO' : 'BOTÓN SOS'}</span>
            </button>
          </div>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUMNA 1: FICHA Y DOBLE PIN */}
          <div className="space-y-6">
            
            {/* FICHA DEL ACOMPAÑANTE */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Ficha del Acompañante
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  companion?.id 
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' 
                    : 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                }`}>
                  {companion?.id ? 'ASIGNACIÓN CONFIRMADA' : 'POR ASIGNAR'}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                  {companion?.full_name ? companion.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white text-base">
                    {companion?.full_name || 'Por asignar por Mesa Central'}
                  </h4>
                  <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contacto: </span>
                    <strong className="text-emerald-400">{companion?.phone || '809-541-2000'}</strong>
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                      ✓ ACREDITADO KYC
                    </span>
                    <span className="text-[10px] text-slate-400">• Antecedentes Cotejados</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 text-xs text-slate-300 space-y-1">
                <p><strong className="text-white">Usuario:</strong> {service.recipient_name || service.client_name || 'No especificado'}</p>
                <p><strong className="text-white">Punto de Encuentro:</strong> {service.facility_or_location || service.address || 'Distrito Nacional'}</p>
                <p><strong className="text-white">Familiar Responsable:</strong> {clientProfile?.full_name || 'Contacto Registrado'} ({clientProfile?.phone || service.recipient_phone || '809-541-2000'})</p>
              </div>
            </div>

            {/* CONTROL DE VALIDACIÓN ANTIFRAUDE CON DOBLE PIN */}
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" /> Control de Validación Antifraude
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">
                  DOBLE PIN
                </span>
              </div>

              {/* TARJETAS DE VISUALIZACIÓN DE PINS */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">1. PIN Check-In (Llegada)</span>
                  <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">{checkinPin}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Dictar al verse en persona</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">2. PIN Check-Out (Salida)</span>
                  <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">{checkoutPin}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Dictar al terminar el servicio</span>
                </div>
              </div>

              {/* FORMULARIO DE VALIDACIÓN */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Ingresar PIN para Validación:
                  </label>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => { setPinMode('CHECKIN'); setPinFeedback(null); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        pinMode === 'CHECKIN' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Check-In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPinMode('CHECKOUT'); setPinFeedback(null); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        pinMode === 'CHECKOUT' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Check-Out
                    </button>
                  </div>
                </div>

                {pinFeedback && (
                  <div className={`text-xs p-2.5 rounded-xl text-center border ${
                    pinFeedback.type === 'success' 
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                      : 'bg-rose-950/80 border-rose-800 text-rose-300'
                  }`}>
                    {pinFeedback.text}
                  </div>
                )}

                <form onSubmit={handleVerifyPin} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Escribir PIN..."
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center font-mono text-base text-white font-bold outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={pinActionLoading || inputPin.trim().length < 4}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50 shrink-0 ${
                      pinMode === 'CHECKIN' 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {pinActionLoading ? 'Validando...' : 'Validar PIN'}
                  </button>
                </form>
              </div>

              {service.status === 'COMPLETED' && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl text-center space-y-1">
                  <span className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ¡SERVICIO FINALIZADO CON ÉXITO!
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA 2: CHAT OPERATIVO EN VIVO */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat Operativo del Servicio
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> EN VIVO
              </span>
            </div>

            {/* LISTA DE MENSAJES */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-slate-500 px-4">
                  No hay mensajes aún. Escribe para coordinar el punto de encuentro en tiempo real.
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-500 font-mono mb-0.5">{msg.sender_name}</span>
                      <div className={`p-2.5 rounded-2xl max-w-[85%] break-words ${
                        isMine 
                          ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none' 
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* FORMULARIO DE ENVÍO */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje de coordinación..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl transition shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* MODAL PARA ASIGNAR ACOMPAÑANTE */}
        {showEditCompanionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" /> Seleccionar Acompañante Acreditado
                </h3>
                <button onClick={() => setShowEditCompanionModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold block">Personal depurado en la plataforma:</label>
                <select
                  value={selectedCompanionId}
                  onChange={(e) => setSelectedCompanionId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Elige un acompañante --</option>
                  {allCompanions.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.full_name} ({comp.phone || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCompanionModal(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanion}
                  disabled={!selectedCompanionId || savingComp}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {savingComp ? 'Guardando...' : 'Confirmar Asignación'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ServiceLivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LiveRoomContent />
    </Suspense>
  );
}