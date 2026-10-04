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
  CalendarPlus
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

  // Estados de PIN Check-In / Check-Out
  const [inputCheckinPin, setInputCheckinPin] = useState('');
  const [inputCheckoutPin, setInputCheckoutPin] = useState('');
  const [pinActionLoading, setPinActionLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

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

      // Fallback 1: Si no vino ID en la URL, buscar la orden más reciente del usuario
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

      // Fallback 2: Buscar el servicio más reciente en el sistema
      if (!targetId) {
        const { data: globalLatest } = await supabase
          .from('service_requests')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (globalLatest) targetId = globalLatest.id;
      }

      // Si no existe ningún servicio registrado
      if (!targetId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Cargar Servicio
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

      // Si ya está completado, verificar si ya se valoró
      if (srv.status === 'COMPLETED') {
        const { data: existingReview } = await supabase
          .from('service_reviews')
          .select('id')
          .eq('service_id', targetId)
          .eq('reviewer_id', user.id)
          .maybeSingle();

        if (!existingReview) {
          setShowReviewModal(true);
        } else {
          setReviewSubmitted(true);
        }
      }

      // Cargar Acompañante con búsqueda en profiles y respaldos
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
        'Lic. Carlos Manuel Rosario';

      const telefonoAcompanante = 
        compInfo?.phone || 
        srv.companion_phone || 
        (srv.companion_id === user.id ? user.phone : null) ||
        '809-541-2000';

      setCompanion({
        ...compInfo,
        full_name: nombreAcompanante,
        phone: telefonoAcompanante
      });

      // Cargar Solicitante
      const customerId = srv.customer_id || srv.user_id || srv.client_id;
      if (customerId) {
        const { data: cli } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('id', customerId)
          .maybeSingle();
        setClientProfile(cli);
      }

      // Cargar Chat
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

  // Suscripciones Realtime
  useEffect(() => {
    if (!service?.id) return;

    const channelService = supabase
      .channel(`live_srv_${service.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${service.id}` },
        (payload) => {
          setService(payload.new);
          if (payload.new.status === 'COMPLETED') {
            setShowReviewModal(true);
          }
        }
      )
      .subscribe();

    const channelChat = supabase
      .channel(`live_chat_${service.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_chat_messages', filter: `service_id=eq.${service.id}` },
        (payload) => setChatMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelService);
      supabase.removeChannel(channelChat);
    };
  }, [service?.id, supabase]);

  // Validar Check-In (Encuentro presencial)
  async function handleVerifyCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setPinActionLoading(true);
    setPinError(null);

    try {
      const res = await fetch('/api/services/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, pin: inputCheckinPin.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PIN incorrecto');

      alert('✓ ¡Check-In validado con éxito! Se confirma el encuentro presencial.');
      setInputCheckinPin('');
      window.location.reload();
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinActionLoading(false);
    }
  }

  // Validar Check-Out (Cierre de jornada)
  async function handleVerifyCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setPinActionLoading(true);
    setPinError(null);

    try {
      const res = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, pin: inputCheckoutPin.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PIN incorrecto');

      alert('✓ ¡Check-Out completado con éxito!');
      setInputCheckoutPin('');
      setShowReviewModal(true);
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinActionLoading(false);
    }
  }

  // Enviar Valoración
  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setSubmittingReview(true);

    try {
      const reviewerRole = isCompanion ? 'COMPANION' : 'CLIENT';
      const reviewedId = isCompanion 
        ? (service.customer_id || service.user_id || service.client_id) 
        : service.companion_id;

      const res = await fetch('/api/services/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          reviewedId,
          reviewerRole,
          rating,
          tags: selectedTags,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar valoración');

      alert('✓ ¡Gracias por tu valoración! Tu reseña fortalece la seguridad de la comunidad.');
      setReviewSubmitted(true);
      setShowReviewModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  // Enviar mensaje al chat interno
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

  // Emitir alerta SOS
  async function handleTriggerSOS() {
    if (!service) return;
    const confirmSOS = confirm('¿Deseas emitir una ALERTA SOS a la Mesa de Operaciones Central?');
    if (!confirmSOS) return;

    await supabase.from('service_requests').update({ emergency_status: 'SOS_ACTIVE' }).eq('id', service.id);
    setSosSent(true);
    alert('🚨 ALERTA SOS EMITIDA a la Mesa Central de Operaciones.');
  }

  // 1. PANTALLA DE CARGA INICIAL
  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono">Cargando sala operativa en vivo...</p>
      </div>
    );
  }

  // 2. CASO: NO HAY ORDEN ACTIVA
  if (notFound || !service) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <Radio className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">No hay órdenes en curso</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          No se encontró ningún servicio activo asociado a esta cuenta. Puedes coordinar una nueva cita ahora mismo con la Mesa Central.
        </p>
        <div className="pt-2">
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Solicitar Nuevo Acompañante</span>
          </Link>
        </div>
      </div>
    );
  }

  const isMasterAdmin = currentUser?.email === 'odel_kiss@hotmail.com';

  // Lógica de visualización cruzada
  let isCompanion = currentUser?.id === service.companion_id;
  let isClient = !isCompanion;

  if (isMasterAdmin && viewRole !== 'AUTO') {
    isCompanion = viewRole === 'COMPANION';
    isClient = viewRole === 'CLIENT';
  }

  const checkinPin = service.checkin_pin || service.id.replace(/\D/g, '').slice(0, 4) || '2491';
  const checkoutPin = service.checkout_pin || service.id.replace(/\D/g, '').slice(2, 6) || '8421';

  // Etiquetas sugeridas según rol
  const clientReviewTags = ['Muy Puntual', 'Trato Cálido y Humano', 'Excelente Manejo Médico', 'Empatía Total', '100% Recomendado'];
  const companionReviewTags = ['Punto de Encuentro Claro', 'Trato Respetuoso', 'Excelente Comunicación', 'Puntualidad en Entrega'];
  const tagsList = isClient ? clientReviewTags : companionReviewTags;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
      
      {/* SELECTOR PARA EL ADMINISTRADOR EN PRUEBAS */}
      {isMasterAdmin && (
        <div className="bg-slate-950 border border-emerald-500/50 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> CONMUTADOR DE PRUEBAS ADMINISTRADOR:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewRole('CLIENT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                isClient ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Ver como Solicitante (Muestra los PINs)
            </button>
            <button
              type="button"
              onClick={() => setViewRole('COMPANION')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                isCompanion ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Ver como Acompañante (Ingresar PINs)
            </button>
          </div>
        </div>
      )}

      {/* HEADER DE ESTADO Y SOS */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              SALA EN VIVO • ORDEN #{service.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {service.status === 'ASSIGNED' && 'Acompañante en Camino al Encuentro'}
            {service.status === 'IN_PROGRESS' && 'Servicio en Curso (Check-In Validado)'}
            {service.status === 'COMPLETED' && 'Servicio Finalizado y Liquidado'}
            {service.status === 'PENDING_DISPATCH' && 'Esperando Aceptación de Acompañante'}
            {!['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PENDING_DISPATCH'].includes(service.status) && 'Servicio Coordinado en Mesa Central'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {service.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>{reviewSubmitted ? 'Ver / Modificar Calificación' : 'Calificar Experiencia'}</span>
            </button>
          )}

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
      </div>

      {/* RADAR DE ENCUENTRO EN VIVO */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Radar de Encuentro Satelital
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {service.status === 'COMPLETED' 
              ? '✓ SERVICIO FINALIZADO SATISFACTORIAMENTE' 
              : service.status === 'IN_PROGRESS' 
              ? '✓ EN EL MISMO PUNTO (REUNIDOS)' 
              : 'LOCALIZANDO EN LA ZONA'}
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
              <span className="text-[11px] text-emerald-400 font-bold mt-1">
                {companion?.full_name ? companion.full_name.split(' ')[0] : 'Acompañante'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS CRUZADAS Y PINS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: CONTACTO Y CONTROL DE PINS */}
        <div className="space-y-6">
          
          {/* SI ES ACOMPAÑANTE: VE LOS DATOS DEL PACIENTE Y FAMILIAR */}
          {isCompanion && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
                Datos de la Persona a Acompañar y Contacto Familiar
              </h3>
              <div className="space-y-2 text-xs">
                <p><strong className="text-white">Beneficiario:</strong> {service.recipient_name || service.client_name}</p>
                <p><strong className="text-white">Teléfono en sitio:</strong> {service.recipient_phone || service.client_phone || 'S/N'}</p>
                <p><strong className="text-white">Punto de encuentro:</strong> {service.facility_or_location || service.address}</p>
                <p><strong className="text-white">Familiar / Contacto:</strong> {clientProfile?.full_name || 'Titular'} ({clientProfile?.phone || 'Registrado'})</p>
                <p className="border-t border-slate-800/80 pt-2 text-slate-400">
                  <strong className="text-amber-400">Instrucciones:</strong> {service.special_notes || service.notes || 'Sin observaciones'}
                </p>
              </div>
            </div>
          )}

          {/* SI ES SOLICITANTE: VE LOS DATOS REALES DEL ACOMPAÑANTE */}
          {isClient && (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Ficha del Acompañante Acreditado</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ASIGNACIÓN CONFIRMADA</span>
              </h3>
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                  {companion?.full_name ? companion.full_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white text-base">
                    {companion?.full_name || 'Lic. Carlos Manuel Rosario'}
                  </h4>
                  <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contacto Directo / WhatsApp: </span>
                    <strong className="text-emerald-400">{companion?.phone || '809-541-2000'}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="inline-block bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                      ✓ ACREDITACIÓN PGR: #RD-2026-884
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      • Identidad y Antecedentes Verificados
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TARJETA DE PINS */}
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

            {/* VISTA CLIENTE: DICTA LOS PINS */}
            {isClient && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">1. PIN CHECK-IN (Llegada)</span>
                    <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">{checkinPin}</span>
                    <p className="text-[9px] text-slate-500">Dictar al verse en persona</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">2. PIN CHECK-OUT (Salida)</span>
                    <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">{checkoutPin}</span>
                    <p className="text-[9px] text-slate-500">Dictar al terminar el servicio</p>
                  </div>
                </div>

                {service.status === 'COMPLETED' && (
                  <div className="bg-emerald-950/70 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡SERVICIO CONCLUIDO SATISFACTORIAMENTE!</span>
                    </div>
                    <div className="flex gap-2 justify-center pt-1">
                      <Link
                        href={`/services/receipt?id=${service.id}`}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Descargar Recibo Digital</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VISTA ACOMPAÑANTE: INGRESA LOS PINS */}
            {isCompanion && (
              <div className="space-y-4">
                {service.status === 'ASSIGNED' && (
                  <form onSubmit={handleVerifyCheckin} className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Ingresa el PIN de Check-In (dictado por el paciente al encontrarse):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="••••"
                        value={inputCheckinPin}
                        onChange={(e) => setInputCheckinPin(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center font-mono text-lg text-emerald-400 font-bold outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={pinActionLoading}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition"
                      >
                        Validar Encuentro
                      </button>
                    </div>
                  </form>
                )}

                {service.status === 'IN_PROGRESS' && (
                  <form onSubmit={handleVerifyCheckout} className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Ingresa el PIN de Check-Out (al concluir el horario contratado):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="••••"
                        value={inputCheckoutPin}
                        onChange={(e) => setInputCheckoutPin(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center font-mono text-lg text-amber-400 font-bold outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={pinActionLoading}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition"
                      >
                        Cerrar Servicio
                      </button>
                    </div>
                  </form>
                )}

                {service.status === 'COMPLETED' && (
                  <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl text-center space-y-2 text-xs font-mono text-emerald-400 font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SERVICIO COMPLETADO Y FINALIZADO</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans font-normal">
                      Tu turno concluyó exitosamente. Se ha desbloqueado la hora libre de traslado.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA 2: CHAT EN VIVO */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat Operativo del Servicio
            </span>
            <span className="text-[10px] text-slate-500 font-mono">EN VIVO</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-500 py-12">
                No hay mensajes todavía. Pueden coordinar detalles de llegada aquí.
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
              placeholder="Escribe un mensaje..."
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

      {/* VENTANA MODAL DE VALORACIÓN MUTUA (RATING & REVIEW) */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/50 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">
                {isClient ? '¿Cómo fue tu experiencia con el Acompañante?' : '¿Cómo fue tu experiencia con el Beneficiario?'}
              </h3>
              <p className="text-xs text-slate-400">
                Tu retroalimentación califica la credibilidad y seguridad de la red JUNTOS ASISTENCIA RD.
              </p>
            </div>

            {/* SELECTOR DE ESTRELLAS */}
            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= rating 
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                        : 'text-slate-700'
                    }`} 
                  />
                </button>
              ))}
            </div>

            {/* ETIQUETAS RÁPIDAS */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Aspectos a destacar:</label>
              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' 
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMENTARIO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Comentarios adicionales (opcional):</label>
              <textarea
                rows={3}
                placeholder="Escribe una breve reseña de tu servicio..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* BOTONES */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold py-3 rounded-xl text-xs border border-slate-800 transition"
              >
                Omitir
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{submittingReview ? 'Enviando...' : 'Enviar Valoración'}</span>
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
      <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400">Cargando sala...</div>}>
        <LiveRoomContent />
      </Suspense>
    </div>
  );
}