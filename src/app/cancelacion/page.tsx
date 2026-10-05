import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Clock, AlertTriangle, RefreshCcw } from 'lucide-react';

export const metadata = {
  title: 'Políticas de Cancelación y Reembolsos | JUNTOS Asistencia RD',
  description: 'Normas de cancelación previa, tolerancia de espera y reembolsos en República Dominicana.'
};

export default function CancelacionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1">
        
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            <RefreshCcw className="w-4 h-4" /> POLÍTICA CLARA AL CONSUMIDOR
          </div>
          <h1 className="text-3xl font-black text-white">Cancelación, Tolerancia y Reembolsos</h1>
          <p className="text-xs text-slate-400">Transparencia para clientes en RD y familias en el exterior</p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <section className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Cancelación Gratuita</h2>
            <p>
              Las citas pueden cancelarse sin penalidad alguna avisando con al menos <strong>dos (2) horas de antelación</strong> a la hora fijada para el inicio del servicio. El monto pagado será reembolsado al mismo método de pago o acreditado como balance para un próximo acompañamiento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Cancelación Tardía (Menos de 2 horas)</h2>
            <p>
              Si la cancelación se realiza con menos de 2 horas de anticipación, cuando el acompañante ya se encuentra en trayecto o en el centro de salud, se retendrá el equivalente a <strong>una (1) hora de tarifa básica (RD$ 900)</strong> para compensar el traslado y tiempo del acompañante asignado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Tolerancia de Espera (15 Minutos)</h2>
            <p>
              El acompañante esperará hasta un máximo de <strong>15 minutos</strong> a partir de la hora pautada en el punto de encuentro fijado. Si el solicitante no se presenta ni contesta a los llamados de la Mesa Central, el servicio se considerará como iniciado y se computará el tiempo de espera.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Garantía si el Acompañante No se Presenta</h2>
            <p>
              En caso fortuito de que el acompañante asignado presente un retraso superior a 15 minutos o una imposibilidad de presentarse, la Mesa Central gestionará un reemplazo prioritario inmediato o se procesará el <strong>reembolso del 100% de la tarifa</strong> más un cupón de cortesía para su próxima reserva.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}