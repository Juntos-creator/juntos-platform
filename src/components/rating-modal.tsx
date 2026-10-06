'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Star, CheckCircle2, X, ArrowRight } from 'lucide-react';

export interface RatingModalProps {
  serviceId: string;
  companionId?: string;
  clientId?: string;
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function RatingModal({
  serviceId,
  companionId,
  clientId,
  isOpen,
  onClose,
  redirectTo = '/services/new'
}: RatingModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Guardar en service_reviews
      await supabase.from('service_reviews').insert({
        service_request_id: serviceId,
        companion_id: companionId || null,
        client_id: clientId || null,
        rating: rating,
        comment: comment.trim() || null
      });

      // 2. Actualizar también en service_requests
      await supabase
        .from('service_requests')
        .update({
          rating: rating,
          review_comment: comment.trim() || null
        })
        .eq('id', serviceId);

      setSubmitted(true);

      // 3. Redirección automática manteniendo la sesión
      setTimeout(() => {
        onClose();
        router.push(redirectTo);
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error('Error al calificar:', err);
      onClose();
      router.push(redirectTo);
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    onClose();
    router.push(redirectTo);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-slate-500 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-black text-white">¡Gracias por tu valoración!</h3>
            <p className="text-xs text-slate-400">
              Redirigiendo a tu cuenta para solicitar un nuevo servicio...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block mb-2">
                SERVICIO COMPLETADO
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Califica tu Acompañamiento
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ¿Cómo calificarías la asistencia recibida?
              </p>
            </div>

            {/* Selector de 5 estrellas */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition transform hover:scale-125 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-800'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentario sobre el servicio (opcional)..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
            />

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Guardando...' : 'Enviar y Pedir Nuevo Servicio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="text-[11px] text-slate-500 hover:text-slate-400 block w-full text-center"
              >
                Omitir
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}