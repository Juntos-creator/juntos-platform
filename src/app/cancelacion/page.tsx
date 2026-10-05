'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { RefreshCcw } from 'lucide-react';

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
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Cancelación Previa</h2>
            <p>
              Las citas pueden cancelarse sin penalidad notificando con al menos <strong>dos (2) horas de antelación</strong> al horario reservado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Tolerancia de Espera</h2>
            <p>
              El acompañante mantendrá un tiempo de espera de hasta <strong>15 minutos</strong> en el punto acordado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Cancelación Fuera de Plazo</h2>
            <p>
              Cancelaciones solicitadas con menos de 2 horas retendrán el equivalente a una (1) hora de tarifa estándar para compensar el traslado operativo.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}