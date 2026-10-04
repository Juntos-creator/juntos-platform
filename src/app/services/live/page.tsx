'use client';

import { Suspense, useEffect, useState } from 'react';
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
  User, 
  Send, 
  Radio, 
  Eye, 
  Check, 
  Star, 
  Sparkles, 
  FileText, 
  CalendarPlus,
  UserPlus,
  X,
  Edit3
} from 'lucide-react';

function LiveRoomContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id');
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Selector para cambiar vista en pruebas
  const [viewRole, setViewRole] = useState<'AUTO' | 'COMPANION' | 'CLIENT'>('AUTO');

  // Estados de PIN
  const [pinType, setPinType] = useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN');
  const [inputPin, setInputPin] = useState('');
  const [pinActionLoading, setPinActionLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Modal para asignar/editar acompañante
  const [showEditCompanionModal, setShowEditCompanionModal] = useState(false);
  const [allCompanions, setAllCompanions] = useState<any[]>([]);
  const [selectedCompanionId, setSelectedCompanionId] = useState('');

  // Estados de Valoración Mutua
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Chat interno
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

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

      let targetId = rawId?.trim();

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

      // Cargar lista completa de acompañantes para que puedas seleccionarlos
      const { data: compList } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .eq('role', 'COMPANION');
      setAllCompanions(compList || []);

      // Cargar acompañante asignado
      let compInfo: any = null;
      if (srv.companion_id) {
        const { data: comp } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, email')
          .eq('id', srv.companion_id)
          .maybeSingle();
        compInfo = comp;
      }

      const nombreAcompanante = 
        compInfo?.full_name || 
        srv.companion_name || 
        (srv.companion_id === user.id ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : null) ||
        'Por asignar por Mesa Central';

      const telefonoAcompanante = 
        compInfo?.phone || 
        srv.companion_phone || 
        (srv.companion_id === user.id ? user.phone : null) ||
        '809-541-2000';

      setCompanion({
        ...compInfo,
        id: srv.companion_id,
        full_name: nombreAcompanante,
        phone: telefonoAcompanante
      });
      setSelectedCompanionId(srv.companion_id || '');

      // Cargar solicitante
      const customerId = srv.customer_id || srv.user_id || srv.client_id;
      if (customerId) {
        const { data: cli } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('id', customerId)
          .maybeSingle();
        setClientProfile(cli);
      }

      // Cargar chat
      const { data: msgs } = await supabase
        .from('service_chat_messages')
        .select('*')
        .eq('service_id', targetId)
        .order('created_at', { ascending: true });

      setChatMessages(msgs || []);
      setLoading(false);
    }

    loadData();
  }, [rawId, supabase]);

  // Validar PIN directamente en la base de datos sin restricciones
  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setPinActionLoading(true);
    setPinError(null);

    const enteredPin = inputPin.trim();
    const checkinExpected = (service.checkin_pin || service.id.replace(/\D/g, '').slice(0, 4) || '2491').toString();
    const checkoutExpected = (service.checkout_pin || service.id.replace(/\D/g, '').slice(2, 6) || '8421').toString();

    try {
      if (pinType === 'CHECKIN') {
        if (enteredPin !== checkinExpected) {
          throw new Error(`PIN de Encuentro incorrecto. (PIN esperado: ${checkinExpected})`);
        }

        await supabase
          .from('service_requests')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', service.id);

        setService({ ...service, status: 'IN_PROGRESS' });
        alert('✓ ¡Check-In Validado con éxito! Servicio marcado como: EN CURSO.');
        setInputPin('');
        setPinType('CHECKOUT');
      } else {
        if (enteredPin !== checkoutExpected) {
          throw new Error(`PIN de Salida incorrecto. (PIN esperado: ${checkoutExpected})`);
        }

        await supabase
          .from('service_requests')
          .update({ status: 'COMPLETED' })
          .eq('id', service.id);

        setService({ ...service, status: 'COMPLETED' });
        alert('✓ ¡Check-Out Validado con éxito! Servicio FINALIZADO satisfactoriamente.');
        setInputPin('');
        setShowReviewModal(true);
      }
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinActionLoading(false);
    }
  }

  // Guardar cambio o asignación de acompañante
  async function handleUpdateCompanion() {
    if (!selectedCompanionId || !service) return;

    const chosen = allCompanions.find(c => c.id === selectedCompanionId);
    if (!chosen) return;

    await supabase
      .from('service_requests')
      .update({
        companion_id: chosen.id,
        companion_name: chosen.full_name,
        companion_phone: chosen.phone,
        status: service.status === 'PENDING' ? 'ASSIGNED' : service.status
      })
      .eq('id', service.id);

    setCompanion({
      id: chosen.id,
      full_name: chosen.full_name,
      phone: chosen.phone
    });
    setService({
      ...service,
      companion_id: chosen.id,
      companion_name: chosen.full_name,
      companion_phone: chosen.phone
    });
    setShowEditCompanionModal(false);
    alert(`✓ Acompañante actualizado a: ${chosen.full_name}`);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !service) return;

    const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
    const text = newMessage.trim();
    setNewMessage('');

    await supabase.from('service_chat_messages').insert([
      {
        service_id: service.id,
        sender_id: currentUser.id,
        sender_name: senderName,
        message: text
      }
    ]);
  }

  async function handleTriggerSOS() {
    if (!service) return;
    const confirmSOS = confirm('¿Deseas emitir una ALERTA SOS a la Mesa de Operaciones Central?');
    if (!confirmSOS) return;

    await supabase.from('service_requests').update({ emergency_status: 'SOS_ACTIVE' }).eq('id', service.id);
    setSosSent(true);
    alert('🚨 ALERTA SOS EMITIDA a la Mesa Central de Operaciones.');
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 space-y-3 font-mono">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Cargando sala operativa en vivo...</p>
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Radio className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
        <h2 className="text-xl font-black text-white">No hay órdenes en curso</h2>
        <Link
          href="/services/new"
          className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition"
        >
          <CalendarPlus className="w-4 h-4" /> Solicitar Nuevo Acompañante
        </Link>
      </div>
    );
  }

  const isMasterAdmin = currentUser?.email?.toLowerCase() === 'odel_kiss@hotmail.com' || currentUser?.user_metadata?.role === 'ADMIN';

  let isCompanion = currentUser?.id === service.companion_id;
  let isClient = !isCompanion;

  if (isMasterAdmin && viewRole !== 'AUTO') {
    isCompanion = viewRole === 'COMPANION';
    isClient = viewRole === 'CLIENT';
  }

  const checkinPin = service.checkin_pin || service.id.replace(/\D/g, '').slice(0, 4) || '2491';
  const checkoutPin = service.checkout_pin || service.id.replace(/\D/g, '').slice(2, 6) || '8421';

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
      
      {/* BARRA SUPERIOR DE PRUEBAS PARA EL ADMINISTRADOR */}
      {isMasterAdmin && (
        <div className="bg-slate-950 border border-emerald-500/50 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> CONSOLA DE CONTROL ADMINISTRADOR:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewRole('CLIENT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                isClient ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              Ver como Solicitante (PINs)
            </button>
            <button
              type="button"
              onClick={() => setViewRole('COMPANION')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                isCompanion ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              Ver como Acompañante
            </button>
            <button
              type="button"
              onClick={() => setShowEditCompanionModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar Acompañante
            </button>
          </div>
        </div>
      )}

      {/* HEADER DE ESTADO */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              SALA EN VIVO • ORDEN #{service.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            {service.status === 'ASSIGNED' && 'Acompañante Asignado (Esperando Encuentro)'}
            {service.status === 'IN_PROGRESS' && 'Servicio en Curso (Check-In Validado)'}
            {service.status === 'COMPLETED' && 'Servicio Finalizado y Liquidado'}
            {!['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(service.status) && `Servicio Activo (${service.status})`}
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

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: DETALLES, ACOMPAÑANTE Y PINS */}
        <div className="space-y-6">
          
          {/* TARJETA DE INFORMACIÓN DEL PACIENTE Y ACOMPAÑANTE */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Detalle Logístico & Acompañante
              </h3>
              <button
                onClick={() => setShowEditCompanionModal(true)}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Edit3 className="w-3.5 h-3.5" /> Asignar / Cambiar
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-white">Beneficiario / Paciente:</strong> {service.recipient_name || service.client_name}</p>
              <p><strong className="text-white">Punto de Asistencia:</strong> {service.facility_or_location || service.address}</p>
              <p><strong className="text-white">Teléfono en Sitio:</strong> {service.recipient_phone || service.client_phone || '809-541-2000'}</p>
              <p><strong className="text-white">Familiar Responsable:</strong> {clientProfile?.full_name || 'Titular'} ({clientProfile?.phone || 'Registrado'})</p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">ACOMPAÑANTE ASIGNADO:</span>
                  <span className="font-bold text-white text-sm">{companion?.full_name}</span>
                  <span className="text-emerald-400 block font-mono text-[11px]">Tel: {companion?.phone}</span>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                  ✓ VERIFICADO PGR
                </span>
              </div>
            </div>
          </div>

          {/* TARJETA DE VALIDACIÓN DE PINS */}
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

            {/* SECCIÓN 1: NÚMEROS DE PIN PARA EL SOLICITANTE */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                PINs Oficiales (Dictar en persona):
              </span>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">1. PIN Check-In</span>
                  <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">{checkinPin}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Al verse en sitio</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">2. PIN Check-Out</span>
                  <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">{checkoutPin}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Al despedirse</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: FORMULARIO DE INGRESO DEL PIN */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white block">
                  Ingresar PIN de Validación:
                </label>
                <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPinType('CHECKIN')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition ${
                      pinType === 'CHECKIN' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Check-In (Llegada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinType('CHECKOUT')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition ${
                      pinType === 'CHECKOUT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Check-Out (Salida)
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyPin} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder={`Ingresa PIN de ${pinType === 'CHECKIN' ? 'Llegada' : 'Salida'}...`}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-center font-mono text-base text-white font-bold outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={pinActionLoading || !inputPin.trim()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50 ${
                    pinType === 'CHECKIN' 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {pinActionLoading ? 'Validando...' : 'Validar PIN'}
                </button>
              </form>
            </div>

            {service.status === 'COMPLETED' && (
              <div className="bg-emerald-950/70 border border-emerald-500/40 p-3.5 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SERVICIO COMPLETADO Y FINALIZADO</span>
                </div>
                <Link
                  href={`/services/receipt?id=${service.id}`}
                  className="text-xs text-white underline font-bold inline-block mt-1"
                >
                  Ver Comprobante Digital
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA 2: CHAT EN VIVO */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat Operativo del Servicio
            </span>
            <span className="text-[10px] text-slate-500 font-mono">EN VIVO</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-500 py-16">
                No hay mensajes aún. Coordinen la llegada aquí.
              </p>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-slate-500 font-mono mb-0.5">{msg.sender_name}</span>
                    <div className={`p-2.5 rounded-2xl max-w-[80%] ${
                      isMine 
                        ? 'bg-emerald-500 text-slate-950 font-medium' 
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
              placeholder="Escribe un mensaje de coordinación..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* MODAL PARA CAMBIAR O ASIGNAR ACOMPAÑANTE */}
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
              <label className="text-slate-300 font-bold block">Personal depurado en base de datos:</label>
              <select
                value={selectedCompanionId}
                onChange={(e) => setSelectedCompanionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">-- Selecciona un acompañante --</option>
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
                onClick={handleUpdateCompanion}
                disabled={!selectedCompanionId}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                Guardar Acompañante
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function ServiceLivePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400 font-mono">Cargando sala...</div>}>
        <LiveRoomContent />
      </Suspense>
    </div>
  );
}