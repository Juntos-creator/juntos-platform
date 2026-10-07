'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import {
  AlertTriangle,
  Award,
  Banknote,
  Check,
  CheckCircle2,
  Compass,
  KeyRound,
  LogOut,
  MapPin,
  MessageCircle,
  Navigation,
  PhoneCall,
  Radio,
  RefreshCw,
  Send,
} from 'lucide-react';

type Service = Record<string, any>;
type ChatMessage = Record<string, any>;

const ACTIVE_STATUSES = new Set([
  'ASSIGNED',
  'ASIGNADO',
  'IN_PROGRESS',
  'EN_CURSO',
  'EN_CAMINO',
  'IN PROGRESS',
  'IN-PROGRESS',
]);

const OPEN_STATUSES = new Set(['PENDING', 'PENDING_DISPATCH', 'SOLICITADO']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'FINALIZADO']);

function normalizeStatus(status: unknown): string {
  return String(status ?? '').trim().toUpperCase();
}

function isInProgress(status: unknown): boolean {
  return ['IN_PROGRESS', 'EN_CURSO', 'IN PROGRESS', 'IN-PROGRESS'].includes(
    normalizeStatus(status)
  );
}

export default function CompanionDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<Service | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Service[]>([]);
  const [pastOrders, setPastOrders] = useState<Service[]>([]);
  const [selectedChatOrder, setSelectedChatOrder] = useState<Service | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAllServices = useCallback(
    async (userId: string) => {
      const { data: requests, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !requests) {
        console.error('No se pudieron sincronizar los servicios:', error);
        return;
      }

      const mine = requests.filter((service) => service.companion_id === userId);
      const active = mine.find((service) =>
        ACTIVE_STATUSES.has(normalizeStatus(service.status))
      ) ?? null;

      const available = requests.filter(
        (service) =>
          OPEN_STATUSES.has(normalizeStatus(service.status)) &&
          (!service.companion_id || service.companion_id === userId)
      );

      const completed = mine.filter((service) =>
        COMPLETED_STATUSES.has(normalizeStatus(service.status))
      );

      setActiveOrder(active);
      setAvailableOrders(available);
      setPastOrders(completed);

      setSelectedChatOrder((previous) => {
        if (previous && requests.some((service) => service.id === previous.id)) {
          return requests.find((service) => service.id === previous.id) ?? previous;
        }
        return active ?? completed[0] ?? null;
      });
    },
    [supabase]
  );

  // Inicializa sesión y mantiene sincronizados los servicios.
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace('/login');
        return;
      }

      if (!mounted) return;
      setCurrentUser(session.user);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (mounted) setProfile(userProfile);

      await fetchAllServices(session.user.id);
      if (mounted) setLoading(false);
    }

    void initialize();

    const channel = supabase
      .channel('companion-services-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (mounted && session?.user) {
            await fetchAllServices(session.user.id);
          }
        }
      )
      .subscribe();

    const timer = window.setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && session?.user) {
        await fetchAllServices(session.user.id);
      }
    }, 4000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [fetchAllServices, router, supabase]);

  // Carga y escucha el chat del servicio seleccionado.
  useEffect(() => {
    if (!selectedChatOrder?.id) {
      setMessages([]);
      return;
    }

    let subscribed = true;
    const serviceId = selectedChatOrder.id;

    async function loadMessages() {
      const { data, error } = await supabase
        .from('service_messages')
        .select('*')
        .or(`service_request_id.eq.${serviceId},service_id.eq.${serviceId}`)
        .order('created_at', { ascending: true });

      if (!error && data && subscribed) setMessages(data);
    }

    void loadMessages();

    const channel = supabase
      .channel(`companion-chat-${serviceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_messages' },
        (payload) => {
          const message = payload.new as ChatMessage;
          if (
            subscribed &&
            (message.service_request_id === serviceId ||
              message.service_id === serviceId)
          ) {
            setMessages((previous) =>
              previous.some((item) => item.id === message.id)
                ? previous
                : [...previous, message]
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscribed = false;
      void supabase.removeChannel(channel);
    };
  }, [selectedChatOrder?.id, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function captureGps(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      setGpsStatus('Obteniendo ubicación GPS…');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsStatus('Ubicación GPS validada.');
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('GPS no disponible:', error.message);
          setGpsStatus(null);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
      );
    });
  }

  async function handleTakeService(serviceId: string) {
    if (activeOrder) {
      window.alert('Ya tienes un servicio asignado.');
      return;
    }

    setActionLoading(true);
    setPinError(null);

    try {
      const response = await fetch('/api/services/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo aceptar el servicio.');
      }

      if (result.service) {
        setActiveOrder(result.service);
        setSelectedChatOrder(result.service);
      }

      if (currentUser) await fetchAllServices(currentUser.id);
    } catch (error: unknown) {
      window.alert(
        error instanceof Error ? error.message : 'Error al aceptar el servicio.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleValidatePin(action: 'INICIO' | 'FINAL') {
    if (!activeOrder || !pinInput.trim()) return;

    setPinError(null);
    setPinSuccess(null);
    setActionLoading(true);

    try {
      const gps = await captureGps();
      const response = await fetch(
        action === 'INICIO'
          ? '/api/services/checkin'
          : '/api/services/checkout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: activeOrder.id,
            pin: pinInput.trim(),
            latitude: gps?.latitude,
            longitude: gps?.longitude,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo validar el PIN.');
      }

      setPinInput('');
      setPinSuccess(
        result.message ||
          (action === 'INICIO'
            ? 'Check-in validado. Servicio en curso.'
            : 'Check-out validado. Servicio finalizado.')
      );

      if (action === 'INICIO') {
        // Refleja el check-in confirmado mientras se sincroniza la fila real.
        setActiveOrder((previous) =>
          previous
            ? {
                ...previous,
                ...(result.service ?? {}),
                status: result.service?.status ?? 'IN_PROGRESS',
              }
            : previous
        );
      } else {
        setActiveOrder(null);
      }

      if (currentUser) await fetchAllServices(currentUser.id);
    } catch (error: unknown) {
      setPinError(
        error instanceof Error ? error.message : 'Error al validar el PIN.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = newMessage.trim();
    if (!content || !selectedChatOrder || !currentUser) return;

    setSendingMsg(true);
    const senderName =
      profile?.full_name || currentUser.email?.split('@')[0] || 'Acompañante';

    const { data, error } = await supabase
      .from('service_messages')
      .insert({
        service_request_id: selectedChatOrder.id,
        service_id: selectedChatOrder.id,
        sender_id: currentUser.id,
        sender_name: senderName,
        message: content,
      })
      .select()
      .single();

    if (error) {
      console.error('No se pudo enviar el mensaje:', error);
      setPinError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } else if (data) {
      setMessages((previous) =>
        previous.some((message) => message.id === data.id)
          ? previous
          : [...previous, data]
      );
      setNewMessage('');
    }

    setSendingMsg(false);
  }

  async function handleSos() {
    if (!activeOrder) return;

    if (
      !window.confirm(
        '¿Deseas activar el protocolo SOS? Se alertará a la central.'
      )
    ) {
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('service_requests')
      .update({ emergency_status: 'SOS_ACTIVE' })
      .eq('id', activeOrder.id);

    if (error) {
      setPinError('No se pudo activar SOS.');
    } else if (currentUser) {
      await fetchAllServices(currentUser.id);
    }

    setActionLoading(false);
  }

  async function refreshServices() {
    if (currentUser) await fetchAllServices(currentUser.id);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const totalEarnings = pastOrders.reduce(
    (total, order) => total + Number(order.companion_fee || 750),
    0
  );

  const location =
    activeOrder?.facility_or_location ||
    activeOrder?.address ||
    'CEDIMAT, Santo Domingo';

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  const serviceInProgress = isInProgress(activeOrder?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono uppercase tracking-widest">
          Sincronizando sala de operaciones…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 font-sans text-slate-100">
      <Navbar />

      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 px-4 py-5 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-black text-white">SALA DE OPERACIONES</h1>
            <p className="text-xs text-slate-400">
              Acompañante:{' '}
              <strong className="text-white">
                {profile?.full_name || currentUser?.email}
              </strong>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshServices}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <span className="text-xs font-bold uppercase text-slate-400">
              Servicios concluidos
            </span>
            <p className="mt-2 flex items-center gap-2 text-2xl font-black">
              <Award className="h-5 w-5 text-emerald-400" />
              {pastOrders.length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4">
            <span className="text-xs font-bold uppercase text-emerald-400">
              Balance acumulado
            </span>
            <p className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-400">
              <Banknote className="h-5 w-5" />
              RD$ {totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <span className="text-xs font-bold uppercase text-slate-400">
              Tarifa por servicio
            </span>
            <p className="mt-2 text-2xl font-black">RD$ 750</p>
          </div>
        </section>

        {pinSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {pinSuccess}
          </div>
        )}

        {pinError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-800 bg-rose-950 p-4 text-sm text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {pinError}
          </div>
        )}

        {activeOrder && (
          <section className="space-y-5 rounded-3xl border border-emerald-500/40 bg-slate-900 p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <p className="font-black text-emerald-400">
                  {serviceInProgress
                    ? 'SERVICIO EN CURSO · CHECK-OUT PENDIENTE'
                    : 'SERVICIO ASIGNADO · CHECK-IN PENDIENTE'}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  #{String(activeOrder.id).slice(0, 8).toUpperCase()} ·{' '}
                  {normalizeStatus(activeOrder.status)}
                </p>
              </div>
              <button
                onClick={handleSos}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black"
              >
                <AlertTriangle className="h-4 w-4" />
                SOS
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase text-slate-400">Solicitante</p>
                <h2 className="mt-1 text-lg font-black">
                  {activeOrder.recipient_name ||
                    activeOrder.client_name ||
                    activeOrder.for_who_name ||
                    'Usuario asignado'}
                </h2>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`tel:${activeOrder.recipient_phone || activeOrder.client_phone || ''}`}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-emerald-400"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Llamar
                  </a>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-emerald-400"
                  >
                    <Navigation className="h-4 w-4" />
                    Abrir mapa
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase text-slate-400">Ubicación</p>
                <p className="mt-2 flex items-start gap-2 text-sm font-bold">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                  {location}
                </p>
                {activeOrder.special_notes && (
                  <p className="mt-3 text-xs text-slate-400">
                    Notas: {activeOrder.special_notes}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <KeyRound className="h-4 w-4 text-emerald-400" />
                  Validación de servicio
                </h3>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Compass className="h-4 w-4" />
                  GPS
                </span>
              </div>

              {gpsStatus && (
                <p className="text-xs text-emerald-400">{gpsStatus}</p>
              )}

              <p className="text-xs text-slate-400">
                {serviceInProgress
                  ? 'Solicita al usuario el PIN de salida para finalizar el servicio.'
                  : 'Solicita al usuario el PIN de encuentro para iniciar la asistencia.'}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={pinInput}
                  onChange={(event) => setPinInput(event.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder={serviceInProgress ? 'PIN de salida' : 'PIN de inicio'}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center font-mono text-white outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() =>
                    handleValidatePin(serviceInProgress ? 'FINAL' : 'INICIO')
                  }
                  disabled={actionLoading || !pinInput.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-black text-slate-950 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {actionLoading
                    ? 'Validando…'
                    : serviceInProgress
                      ? 'Finalizar servicio'
                      : 'Iniciar asistencia'}
                </button>
              </div>
            </div>
          </section>
        )}

        {selectedChatOrder && (
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="flex items-center gap-2 font-black">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              Chat del servicio #
              {String(selectedChatOrder.id).slice(0, 8).toUpperCase()}
            </h2>

            <div className="h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4">
              {messages.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500">
                  No hay mensajes en este servicio.
                </p>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === currentUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                          mine
                            ? 'bg-emerald-500 font-bold text-slate-950'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        <p className="mb-1 text-[10px] opacity-70">
                          {message.sender_name || 'Usuario'}
                        </p>
                        {message.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Escribe un mensaje…"
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Enviar
              </button>
            </form>
          </section>
        )}

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 font-black">
            <Radio className="h-5 w-5 text-emerald-400" />
            Solicitudes disponibles ({availableOrders.length})
          </h2>

          {availableOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No hay solicitudes pendientes.
            </p>
          ) : (
            availableOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-3 border-t border-slate-800 py-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-xs text-slate-400">
                    #{String(order.id).slice(0, 8).toUpperCase()} ·{' '}
                    {normalizeStatus(order.status)}
                  </p>
                  <p className="font-bold">
                    {order.recipient_name ||
                      order.client_name ||
                      order.for_who_name ||
                      'Solicitante'}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    {order.facility_or_location || order.address || 'Santo Domingo'}
                  </p>
                </div>
                <button
                  onClick={() => handleTakeService(order.id)}
                  disabled={actionLoading || !!activeOrder}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Aceptar servicio
                </button>
              </div>
            ))
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="font-black">Historial de servicios ({pastOrders.length})</h2>
          {pastOrders.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-500">
              Aún no tienes servicios completados.
            </p>
          ) : (
            pastOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 py-3"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    #{String(order.id).slice(0, 8).toUpperCase()}
                  </p>
                  <p className="font-bold">
                    {order.recipient_name || order.client_name || 'Solicitante'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {order.facility_or_location || order.address}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChatOrder(order)}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-emerald-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Ver chat
                  </button>
                  <span className="text-xs font-bold text-emerald-400">
                    RD$ {Number(order.companion_fee || 750).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}