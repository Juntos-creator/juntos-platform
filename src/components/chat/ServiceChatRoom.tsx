'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send } from 'lucide-react';

interface Props {
  serviceId: string;
  currentUserId: string;
  currentUserName: string;
}

type Msg = {
  id: string;
  service_request_id: string;
  sender_id: string;
  sender_name: string | null;
  message: string;
  created_at: string;
  pending?: boolean;
  failed?: boolean;
};

type Conn = 'connecting' | 'live' | 'offline';

const COLUMNS = 'id, service_request_id, sender_id, sender_name, message, created_at';

export default function ServiceChatRoom({ serviceId, currentUserId, currentUserName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [conn, setConn] = useState<Conn>('connecting');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const merge = useCallback((incoming: Msg[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, { ...m, pending: false, failed: false });
      return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('service_messages')
      .select(COLUMNS)
      .eq('service_request_id', serviceId)
      .order('created_at', { ascending: true });

    if (err) {
      setError('No se pudieron cargar los mensajes.');
      return;
    }
    setError(null);
    merge((data ?? []) as Msg[]);
  }, [supabase, serviceId, merge]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`service_chat:${serviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_messages',
          filter: `service_request_id=eq.${serviceId}`,
        },
        (payload) => merge([payload.new as Msg])
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConn('live');
          load();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConn('offline');
        }
      });

    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', load);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', load);
      supabase.removeChannel(channel);
    };
  }, [supabase, serviceId, load, merge]);

  useEffect(() => {
    if (conn === 'live') return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [conn, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    setError(null);

    const id = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id,
        service_request_id: serviceId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        message: body,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);

    const { error: err } = await supabase.from('service_messages').insert({
      id,
      service_request_id: serviceId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      message: body,
    });

    if (err) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pending: false, failed: true } : m)));
      setError('No se pudo enviar el mensaje. Revisa tu conexión.');
    }
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[560px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-emerald-400" /> Chat Operativo del Servicio
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${
            conn === 'live'
              ? 'text-emerald-400 bg-emerald-950 border-emerald-500/30'
              : conn === 'connecting'
              ? 'text-amber-400 bg-amber-950 border-amber-500/30'
              : 'text-rose-400 bg-rose-950 border-rose-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              conn === 'live' ? 'bg-emerald-400 animate-pulse' : conn === 'connecting' ? 'bg-amber-400' : 'bg-rose-400'
            }`}
          />
          {conn === 'live' ? 'EN VIVO' : conn === 'connecting' ? 'CONECTANDO' : 'RECONECTANDO'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-slate-500 px-4">
            No hay mensajes aún. Escribe para coordinar el punto de encuentro en tiempo real.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-slate-500 font-mono mb-0.5">{m.sender_name}</span>
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] break-words ${
                    mine
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                  } ${m.pending ? 'opacity-60' : ''} ${m.failed ? 'ring-2 ring-rose-500' : ''}`}
                >
                  {m.message}
                </div>
                {m.failed && <span className="text-[9px] text-rose-400 mt-0.5">No enviado</span>}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-[11px] text-rose-400 pt-2">{error}</p>}

      <form onSubmit={send} className="pt-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          maxLength={1000}
          placeholder="Escribe un mensaje de coordinación..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl transition shadow"
          aria-label="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}