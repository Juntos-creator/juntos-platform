'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Scale } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1">
        
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            <Scale className="w-4 h-4" /> MARCO LEGAL DOMINICANO
          </div>
          <h1 className="text-3xl font-black text-white">Términos y Condiciones de Servicio</h1>
          <p className="text-xs text-slate-400">Última actualización: Octubre 2026 • Santo Domingo, República Dominicana</p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <section className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Naturaleza No Clínica del Servicio (Ley General de Salud 42-01)</h2>
            <p>
              JUNTOS Asistencia es una plataforma tecnológica y de coordinación de personal para el <strong>acompañamiento humano, soporte logístico, movilidad asistida y apoyo en trámites presenciales</strong>. 
            </p>
            <p>
              En estricto cumplimiento con la <strong>Ley General de Salud No. 42-01</strong> de la República Dominicana, los acompañantes <strong>NO realizan actos médicos, diagnósticos, curaciones invasivas ni administración parenteral de medicamentos</strong>. El servicio no sustituye la atención médica especializada ni el transporte de emergencia.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Verificación de Personal</h2>
            <p>
              Los acompañantes registrados presentan Certificado de No Antecedentes Penales emitido por la Procuraduría General de la República (PGR) verificado previo a su activación.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Tarifas y Horarios</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Tarifa Diurna:</strong> RD$ 900 / hora (~$15 USD).</li>
              <li><strong>Mínimo de Contratación:</strong> Dos (2) horas para cobertura de desplazamiento.</li>
              <li><strong>Horario Operativo:</strong> 7:00 AM a 7:00 PM en Gran Santo Domingo y Santiago.</li>
            </ul>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}