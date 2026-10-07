'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import ServiceChatRoom from '@/components/chat/ServiceChatRoom';
import { 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  UserPlus,
  X,
  Edit3,
  CalendarPlus,
  Star
} from 'lucide-react';

function LiveRoomContent() {
  const router = useRouter();
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

  // Estados de Calificación
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

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
        router.push(`/login?redirect=/services/live${rawId ? `?id=${rawId}` : ''}`);
        return;
      }
      setCurrentUser(user);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile?.role) {
        setCurrentUserRole(userProfile.role);
      }

      let targetId = rawId?.trim();

      // Si es un cliente y no pasa ID por URL, evaluamos su última orden de forma limpia en JS
      if (!targetId && userProfile?.role === 'CLIENT') {
        const { data: userLatest } = await supabase
          .from('service_requests')
          .select('id, status')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userLatest) {
          const estadoActual = (userLatest.status || '').toUpperCase();
          if (estadoActual === 'COMPLETED' || estadoActual === 'FINALIZADO' || estadoActual === 'CANCELLED') {
            router.replace('/');
            return;
          }
          targetId = userLatest.id;
        } else {
          router.replace('/');
          return;
        }
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

      // Validación doble de seguridad si el estado viene finalizado
      const statusUpper = (srv.status || '').toUpperCase();
      if ((statusUpper === 'COMPLETED' || statusUpper === 'FINALIZADO') && userProfile?.role === 'CLIENT') {
        router.replace('/');
        return;
      }

      setService(srv);
      setSosSent(srv.emergency_status === 'SOS_ACTIVE');
      if (statusUpper === 'IN_PROGRESS') {
        setPinMode('CHECKOUT');
      }

      if (srv.rating || srv.reviewed_at) {
        setRatingDone(true);
      }

      const { data: compList } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .in('role', ['COMPANION', 'ACOMPANANTE']);
      setAllCompanions(compList || []);

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

      setCompanion({
        id: companionId,
        full_name: compInfo?.full_name || srv.companion_name || (companionId ? 'Acompañante Asignado' : 'Por asignar por Mesa Central'),
        phone: compInfo?.phone || srv.companion_phone || '809-541-2000'
      });
      setSelectedCompanionId(companionId || '');

      const customerId = srv.client_id || srv.customer_id || srv.user_id;
      if (customerId) {
        const { data: cli } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('id', customerId)
          .maybeSingle();
        setClientProfile(cli);
      }

      setLoading(false);
    }

    loadData();
  }, [rawId, supabase, router]);

  // Escuchar cambios de estado en Realtime
  useEffect(() => {
    if (!service?.id) return;

    const channel = supabase
      .channel(`live_status_${service.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${service.id}` },
        (payload) => {
          const updated = payload.new;
          setService(updated);
          
          if (updated.status === 'IN_PROGRESS') {
            setPinMode('CHECKOUT');
          }
          
          if ((updated.status === 'COMPLETED' || updated.status === 'FINALIZADO') && currentUserRole === 'CLIENT') {
            if (!updated.rating && !ratingDone) {
              setShowRatingModal(true);
            } else {
              router.replace('/');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [service?.id, supabase, ratingDone, currentUserRole, router]);

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;

    setPinActionLoading(true);
    setPinFeedback(null);
    const enteredPin = inputPin.trim();

    try {
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
        else setShowRatingModal(true);
        setPinActionLoading(false);
        return;
      }

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
          text: pinMode === 'CHECKIN' ? 'Check-In validado.' : 'Check-Out validado.'
        });
        setInputPin('');
        if (pinMode === 'CHECKIN') setPinMode('CHECKOUT');
        else setShowRatingModal(true);
      } else {
        throw new Error('El PIN ingresado es incorrecto.');
      }
    } catch (err: any) {
      setPinFeedback({ type: 'error', text: err.message || 'Error al validar el PIN.' });
    } finally {
      setPinActionLoading(false);
    }
  }

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
      setCompanion({ id: chosen.id, full_name: chosen.full_name, phone: chosen.phone });
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

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;

    setSavingRating(true);
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          rating: ratingValue,
          review_comment: ratingComment.trim(),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', service.id);

      if (!error) {
        setRatingDone(true);
        setShowRatingModal(false);
        // Redirigir de inmediato a la página de inicio (/) manteniendo la sesión abierta
        router.replace('/');
      } else {
        alert('Error guardando la calificación: ' + error.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingRating(false);
    }
  }

  async function handleTriggerSOS() {
    if (!service) return;
    if (!confirm('¿Deseas emitir una ALERTA SOS prioritaria a la Mesa Central?')) return;
    await supabase.from('service_requests').update({ emergency_status: 'SOS_ACTIVE' }).eq('id', service.id);
    setSosSent(true);
    alert('🚨 ALERTA SOS EMITIDA.');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando sala operativa...</p>
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
          <Link href="/services/new" className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs">
            <CalendarPlus className="w-4 h-4" /> Solicitar Nuevo Acompañante
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* HEADER */}
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
          {/* COLUMNA 1: FICHA Y PINS */}
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">Ficha del Acompañante</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  companion?.id ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                }`}>
                  {companion?.id ? 'ASIGNACIÓN CONFIRMADA' : 'POR ASIGNAR'}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                  {companion?.full_name ? companion.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white text-base">{companion?.full_name || 'Por asignar por Mesa Central'}</h4>
                  <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contacto: </span>
                    <strong className="text-emerald-400">{companion?.phone || '809-541-2000'}</strong>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 text-xs text-slate-300 space-y-1">
                <p><strong className="text-white">Usuario:</strong> {service.recipient_name || service.client_name || 'No especificado'}</p>
                <p><strong className="text-white">Punto de Encuentro:</strong> {service.facility_or_location || service.address || 'Distrito Nacional'}</p>
                <p><strong className="text-white">Familiar:</strong> {clientProfile?.full_name || 'Contacto'} ({clientProfile?.phone || service.recipient_phone || '809-541-2000'})</p>
              </div>
            </div>

            {/* CONTROL DE VALIDACIÓN */}
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" /> Control de Validación
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold">DOBLE PIN</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">1. PIN Check-In</span>
                  <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">{service.checkin_pin || '----'}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">2. PIN Check-Out</span>
                  <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">{service.checkout_pin || '----'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
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
                    className="px-5 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50 shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  >
                    {pinActionLoading ? 'Validando...' : 'Validar PIN'}
                  </button>
                </form>
                {pinFeedback && (
                  <p className={`text-xs text-center ${pinFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{pinFeedback.text}</p>
                )}
              </div>

              {(service.status === 'COMPLETED' || service.status === 'FINALIZADO') && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-3">
                  <span className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ¡SERVICIO FINALIZADO CON ÉXITO!
                  </span>
                  {!service.rating && (
                    <button
                      type="button"
                      onClick={() => setShowRatingModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950" /> Calificar Servicio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA 2: CHAT */}
          <div>
            <ServiceChatRoom
              serviceId={service.id}
              currentUserId={currentUser.id}
              currentUserName={currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario'}
            />
          </div>
        </div>

        {/* MODAL PARA ASIGNAR ACOMPAÑANTE */}
        {showEditCompanionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" /> Seleccionar Acompañante
                </h3>
                <button onClick={() => setShowEditCompanionModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <select
                value={selectedCompanionId}
                onChange={(e) => setSelectedCompanionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-medium text-xs"
              >
                <option value="">-- Elige un acompañante --</option>
                {allCompanions.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.full_name} ({comp.phone || 'S/N'})</option>
                ))}
              </select>

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
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black transition disabled:opacity-50"
                >
                  {savingComp ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CALIFICACIÓN */}
        {showRatingModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 fill-emerald-400 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">¿Cómo estuvo la asistencia?</h3>
                <p className="text-xs text-slate-400">Califica el desempeño de <strong className="text-white">{companion?.full_name}</strong></p>
              </div>

              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRatingValue(star)} className="p-1 transition hover:scale-125">
                    <Star className={`w-8 h-8 ${star <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Escribe un comentario..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.replace('/')}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-3 rounded-xl text-xs font-bold"
                  >
                    Omitir
                  </button>
                  <button
                    type="submit"
                    disabled={savingRating}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-black transition"
                  >
                    {savingRating ? 'Enviando...' : 'Enviar Calificación'}
                  </button>
                </div>
              </form>
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