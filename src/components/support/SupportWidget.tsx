'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircleQuestion, X, Send } from 'lucide-react';

export default function SupportWidget() {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function enviarSoporte(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();

    await supabase.from('support_messages').insert([{
      user_name: nombre,
      user_email: contacto,
      page_origin: typeof window !== 'undefined' ? window.location.pathname : 'Desconocido',
      message: mensaje,
    }]);

    setEnviado(true);
    setTimeout(() => {
      setAbierto(false);
      setEnviado(false);
      setMensaje('');
    }, 2500);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition-all hover:scale-105"
        >
          <MessageCircleQuestion className="w-5 h-5" />
          <span>¿Necesitas ayuda?</span>
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 p-4 font-sans text-slate-800">
          <div className="flex justify-between items-center border-b pb-2 mb-3">
            <div>
              <h4 className="font-bold text-sm text-blue-950">Mesa de Ayuda JUNTOS</h4>
              <p className="text-[10px] text-slate-500">Respondemos en tiempo real</p>
            </div>
            <button onClick={() => setAbierto(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {enviado ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
              ✓ Tu mensaje fue enviado a la Mesa de Operaciones. Te responderemos de inmediato.
            </div>
          ) : (
            <form onSubmit={enviarSoporte} className="space-y-2">
              <input
                type="text"
                required
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-xs border rounded-lg p-2 outline-none"
              />
              <input
                type="text"
                required
                placeholder="Teléfono o WhatsApp"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                className="w-full text-xs border rounded-lg p-2 outline-none"
              />
              <textarea
                required
                rows={3}
                placeholder="¿En qué te ayudamos con el registro o servicio?"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full text-xs border rounded-lg p-2 outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <Send className="w-3 h-3" /> Enviar a Operaciones
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}