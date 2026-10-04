'use client';

import { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Headphones, 
  PhoneCall, 
  ShieldCheck, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: '¡Hola! Bienvenido a la Mesa de Asistencia JUNTOS. ¿En qué podemos orientarte con tu servicio hoy?',
      time: 'Ahora'
    }
  ]);

  const whatsappOficial = '18095550188'; // Número de Mesa de Operaciones

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoTexto = mensaje.trim();

    setMensajes(prev => [...prev, { sender: 'user', text: nuevoTexto, time: horaActual }]);
    setMensaje('');

    // Respuesta automática orientativa
    setTimeout(() => {
      setMensajes(prev => [
        ...prev,
        {
          sender: 'agent',
          text: 'Un operador de la Mesa Central ha recibido tu consulta. Si requieres atención prioritaria o confirmación de chofer/acompañante, pulsa el botón directo de WhatsApp abajo.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 900);
  }

  function handleOpenWhatsApp() {
    const texto = encodeURIComponent('Hola Mesa Central de JUNTOS ASISTENCIA RD, requiero soporte sobre un servicio en plataforma.');
    window.open(`https://wa.me/${whatsappOficial}?text=${texto}`, '_blank');
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans print:hidden">
      
      {/* VENTANA EMERGENTE DEL CHAT */}
      {isOpen && (
        <div className="mb-3 w-[340px] sm:w-[380px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* HEADER DEL CHAT */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Mesa de Soporte Central</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Despacho 24/7 • JUNTOS RD</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* BANNER WHATSAPP DIRECTO */}
          <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300 font-medium">¿Urgencia con tu acompañante?</span>
            <button
              onClick={handleOpenWhatsApp}
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              WhatsApp <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* ÁREA DE MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60">
            {mensajes.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-xs'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                  {m.time}
                </span>
              </div>
            ))}
          </div>

          {/* INPUT DE ENVÍO */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu mensaje o consulta..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={!mensaje.trim()}
              className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl flex items-center justify-center transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* BOTÓN FLOTANTE PRINCIPAL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 fill-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-950" />
        </div>
        <span className="text-xs tracking-tight">Soporte 24/7</span>
      </button>

    </div>
  );
}