'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, ArrowLeft, Clock, CheckCircle2, RotateCcw, AlertOctagon } from 'lucide-react';

export default function CancelacionPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-20">
      
      {/* HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" variant="dark" href="/" />
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
            <RotateCcw className="w-4 h-4" />
            <span>Política Transparente de Reserva</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Políticas de Cancelación y Reembolsos
          </h1>
          <p className="text-xs text-slate-400">
            Última actualización: Octubre 2026 • JUNTOS Asistencia RD
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed text-justify">
          
          {/* SECCIÓN 1: CANCELACIÓN POR EL CLIENTE */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              1. Plazos de Cancelación por Parte del Solicitante
            </h2>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Cancelación con más de 12 horas de anticipación:</strong>
                  Reembolso del 100% del monto pagado o crédito íntegro a favor en la cuenta para reprogramar una nueva cita.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Cancelación con menos de 12 horas de anticipación:</strong>
                  Aplica una retención equivalente a una (1) hora de tarifa base (RD$ 900) para compensar el traslado y bloqueo de agenda del acompañante reservado.
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: GARANTÍA POR INCUMPLIMIENTO O RETRASO */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3 border-l-4 border-l-emerald-500">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. Garantía por Retraso o Incomparecencia del Acompañante
            </h2>
            <p>
              La puntualidad es nuestro compromiso central con las familias:
            </p>
            <ul className="space-y-2 list-disc list-inside text-slate-300 pl-1">
              <li>
                <strong>Incomparecencia del acompañante:</strong> Si el acompañante asignado no se presenta a la hora acordada, el cliente recibirá el <strong>reembolso inmediato del 100%</strong> de su reserva o la reasignación prioritaria sin costo.
              </li>
              <li>
                <strong>Retraso injustificado mayor a 30 minutos:</strong> El cliente tiene la potestad de cancelar el servicio sin penalización alguna y solicitar la devolución completa de su dinero.
              </li>
            </ul>
          </section>

          {/* SECCIÓN 3: PROCESAMIENTO DE REEMBOLSOS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              3. Plazos y Métodos de Devolución
            </h2>
            <p>
              Los reembolsos autorizados se procesan a través del mismo método de pago utilizado durante la contratación (tarjeta o transferencia) en un plazo habitual de <strong>2 a 5 días laborables</strong>, conforme a los tiempos de acreditación de la entidad bancaria del usuario.
            </p>
          </section>

          {/* SECCIÓN 4: GESTIÓN DE INCIDENCIAS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-emerald-400" />
              4. Reporte de Incidencias
            </h2>
            <p>
              Toda solicitud de reprogramación, cancelación o reclamo se canaliza directamente a través del <strong>Panel de Servicios Activos</strong> dentro del portal del usuario.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}