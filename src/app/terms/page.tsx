'use client';

import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ShieldCheck, Scale, FileText, ArrowLeft, AlertCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>

        <div className="bg-slate-950 border border-slate-800 p-6 sm:p-10 rounded-3xl space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-5 space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-mono text-emerald-400 font-bold">
              <Scale className="w-3.5 h-3.5" /> MARCO LEGAL Y REGULATORIO RD
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Términos del Servicio y Deslinde de Responsabilidad
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              JUNTOS ASISTENCIA RD • Última actualización: Octubre 2026
            </p>
          </div>

          <div className="space-y-6 text-xs text-slate-300 leading-relaxed text-justify">
            
            {/* CLÁUSULA 1: NATURALEZA DEL SERVICIO */}
            <section className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                1. Naturaleza Jurídica del Servicio (No Constituye Acto Médico)
              </h2>
              <p>
                <strong>JUNTOS ASISTENCIA RD</strong> opera estrictamente como una plataforma tecnológica de coordinación, acompañamiento presencial, asistencia personal ambulatoria y soporte logístico. 
              </p>
              <p className="text-amber-300/90 font-medium bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                ⚠️ <strong>AVISO REGULATORIO:</strong> Los acompañantes acreditados no prestan actos médicos, no realizan procedimientos de enfermería invasiva, no emiten diagnósticos clínicos, ni prescriben ni administran fármacos por vía endovenosa. Las responsabilidades clínicas y terapéuticas corresponden de forma privativa a los médicos tratantes y centros de salud legalmente habilitados bajo la Ley General de Salud No. 42-01.
              </p>
            </section>

            {/* CLÁUSULA 2: VERIFICACIÓN PGR */}
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                2. Acreditación y Depuración de Acompañantes
              </h2>
              <p>
                Todo acompañante activo en la plataforma ha completado un protocolo de debida diligencia que incluye la verificación de identidad biométrica, validación de referencias laborales y la certificación de no antecedentes penales expedida por la <strong>Procuraduría General de la República (PGR)</strong> de la República Dominicana.
              </p>
            </section>

            {/* CLÁUSULA 3: LEY 172-13 DE DATOS PERSONALES */}
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                3. Protección de Datos y Confidencialidad (Ley No. 172-13)
              </h2>
              <p>
                Los datos de contacto, geolocalización, notas de asistencia e información médica referencial suministrada por el Solicitante son tratados bajo estricta confidencialidad de conformidad con la <strong>Ley No. 172-13 sobre Protección Integral de Datos Personales</strong>. Esta información únicamente es compartida con el acompañante asignado durante la vigencia de la orden para fines operativos.
              </p>
            </section>

            {/* CLÁUSULA 4: PROTOCOLO ANTIFRAUDE Y PINS */}
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                4. Validación por Doble PIN (Check-In y Check-Out)
              </h2>
              <p>
                Para garantizar la seguridad de ambas partes y prevenir fraudes, el inicio y cierre del servicio son validados exclusivamente mediante dos códigos PIN de un solo uso que el Solicitante dicta en persona al Acompañante. Ningún cobro o liquidación es ejecutado sin la validación previa de ambos códigos.
              </p>
            </section>

            {/* CLÁUSULA 5: JURISDICCIÓN */}
            <section className="space-y-2 border-t border-slate-800 pt-4">
              <h2 className="text-sm font-bold text-white">5. Legislación Aplicable y Jurisdicción</h2>
              <p>
                Las relaciones contractuales derivadas del uso de esta plataforma se rigen por las leyes de la <strong>República Dominicana</strong>. Cualquier litigio o controversia será sometido a los tribunales ordinarios del Distrito Nacional.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}