'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Shield } from 'lucide-react';

interface Props {
  serviceId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'CUSTOMER' | 'COMPANION';
}

export default function ServiceChatModal({ serviceId, currentUserId, currentUserName, currentUserRole }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const supabase = createClient();

  useEffect(() => {
    cargarMensajes();

    const channel = supabase
      .channel(`chat_${serviceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_chats', filter: `service_id=eq.${serviceId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serviceId]);

  async function cargarMensajes() {
    const { data } = await supabase
      .from('service_chats')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  }

  async function enviarMensaje(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    await supabase.from('service_chats').insert([{
      service_id: serviceId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      message: nuevoMensaje.trim()
    }]);

    setNuevoMensaje('');
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-96 w-full max-w-md overflow-hidden">
      <div className="bg-blue-950 p-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">Chat de Acompañamiento Auditado</span>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 text-xs">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`p-2.5 rounded-xl max-w-[80%] ${
              m.sender_id === currentUserId 
                ? 'bg-blue-600 text-white ml-auto' 
                : 'bg-white border text-slate-800 mr-auto'
            }`}
          >
            <p className="font-bold text-[10px] opacity-75">{m.sender_name}</p>
            <p>{m.message}</p>
          </div>
        ))}
      </div>

      <form onSubmit={enviarMensaje} className="p-2 bg-white border-t flex gap-2">
        <input 
          type="text" 
          value={nuevoMensaje} 
          onChange={(e) => setNuevoMensaje(e.target.value)} 
          placeholder="Escribe un mensaje..."
          className="flex-1 text-xs border rounded-xl px-3 py-2 outline-none focus:border-blue-600"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}