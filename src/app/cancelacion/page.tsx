'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  AlertOctagon, 
  CreditCard, 
  MapPin, 
  Mail 
} from 'lucide-react';

export default function CancelacionPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-24">
      
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
            <span>Garantía de Servicio y Reembolsos Claros</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Políticas de Cancelación, Reembolsos y Puntualidad
          </h1>
          <p className="text-xs text-slate-400">
            Marco Operativo y Pasarela de Devolución • JUNTOS Asistencia RD
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed text-justify">
          
          {/* SECCIÓN 1: CANCELACIÓN POR EL CLIENTE */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              1. Plazos de Cancelación Voluntaria por el Contratante
            </h2>
            <div className="space-y-2.5">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold text-xs">Con más de 12 horas de anticipación a la cita:</strong>
                  Reembolso del 100% del monto abonado a través del método de pago de origen, o saldo íntegro a favor en su cuenta para reagendar una nueva cita sin deducción alguna.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold text-xs">Con menos de 12 horas de anticipación:</strong>
                  Aplica una compensación por bloqueo de agenda y traslado equivalente a una (1) hora de tarifa diurna base (RD$ 900). El monto restante pagado se reembolsa al cliente.
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: PROTOCOLO ANTE INCOMPARECENCIA O RETRASO */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3 border-l-4 border-l-emerald-500">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. Protocolo de Detección por Retraso o Incomparecencia del Acompañante
            </h2>
            <p>
              La presencia física se audita a través del <strong>código PIN de encuentro</strong> validado en la plataforma:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-1">
              <li>
                <strong>Tolerancia de espera:</strong> Se establece un margen de tolerancia máxima de 15 minutos en el punto de encuentro fijado en Santo Domingo o Santiago.
              </li>
              <li>
                <strong>Retraso mayor a 30 minutos sin causa justificada:</strong> Si el acompañante no se presenta en un lapso de 30 minutos tras la hora programada y no hay confirmación de PIN en el sistema, el cliente puede cancelar la reserva recibiendo el <strong>reembolso del 100%</strong> inmediato o solicitar reasignación urgente sin costo adicional.
              </li>
              <li>
                <strong>Incomparecencia total (No-Show del acompañante):</strong> La Mesa Operativa activará la restitución íntegra de los fondos y aplicará las sanciones de acreditación correspondientes al acompañante.
              </li>
            </ul>
          </section>

          {/* SECCIÓN 3: PROCESAMIENTO Y TIEMPOS BANCARIOS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              3. Plazos Bancarios para la Devolución de Fondos
            </h2>
            <p>
              Una vez aprobada la cancelación en la plataforma, la orden de reembolso se emite de forma inmediata hacia la pasarela de pagos. El reflejo del crédito en el estado de cuenta bancario del titular dependerá del emisor de la tarjeta:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li><strong>Tarjetas dominicanas (procesamiento local):</strong> Habitualmente entre 2 y 5 días laborables.</li>
              <li><strong>Tarjetas internacionales (Diáspora / USD):</strong> Entre 5 y 10 días laborables conforme a la entidad bancaria internacional emisora.</li>
            </ul>
          </section>

          {/* CANAL DE DISPUTAS Y RECLAMOS */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-white">Atención Operativa de Cancelaciones y Disputas</p>
              <p className="text-slate-400 text-[11px]">Si necesitas cancelar un servicio activo o reportar un retraso:</p>
            </div>
            <a 
              href="mailto:soporte@juntos.do" 
              className="text-emerald-400 hover:underline font-mono font-bold flex items-center gap-1.5 text-xs bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>soporte@juntos.do</span>
            </a>
          </section>

        </div>
      </main>
    </div>
  );
}