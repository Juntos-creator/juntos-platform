'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, CheckCircle2, X } from 'lucide-react';

interface RatingModalProps {
  serviceId: string;
  companionId?: string;
  clientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function RatingModal({
  serviceId,
  companionId,
  clientId,
  isOpen,
  onClose,
  onSubmitted
}: RatingModalProps) {
  const supabase = createClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1. Guardar en la tabla service_reviews
    await supabase.from('service_reviews').insert({
      service_request_id: serviceId,
      companion_id: companionId,
      client_id: clientId,
      rating: rating,
      comment: comment.trim() || null
    });

    // 2. Actualizar también la orden en service_requests
    await supabase
      .from('service_requests')
      .update({
        rating: rating,
        review_comment: comment.trim() || null
      })
      .eq('id', serviceId);

    setLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      if (onSubmitted) onSubmitted();
      onClose();
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-black text-white">¡Gracias por tu valoración!</h3>
            <p className="text-xs text-slate-400">Tu opinión nos ayuda a mantener la calidad de JUNTOS.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Califica tu Experiencia
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ¿Cómo calificarías el acompañamiento brindado?
              </p>
            </div>

            {/* Estrellas interactivas */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deja un comentario opcional sobre el servicio..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Enviando...' : 'Enviar Valoración'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}