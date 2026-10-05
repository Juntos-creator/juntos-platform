'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, ArrowLeft, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export default function TerminosPage() {
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
            <ShieldCheck className="w-4 h-4" />
            <span>Marco Regulatorio y Contractual</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Términos y Condiciones de Servicio
          </h1>
          <p className="text-xs text-slate-400">
            Última actualización: Octubre 2026 • JUNTOS Asistencia RD
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed text-justify">
          
          {/* SECCIÓN 1 */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              1. Objeto y Naturaleza de la Plataforma
            </h2>
            <p>
              <strong>JUNTOS Asistencia RD</strong> es una plataforma tecnológica de intermediación que coordina y conecta a usuarios y familiares solicitantes con acompañantes independientes para servicios estrictamente de <strong>asistencia personal, apoyo en movilidad y logística no clínica</strong> en la República Dominicana.
            </p>
            <p>
              Al reservar o postularse en la plataforma, el usuario acepta de manera íntegra los presentes Términos y Condiciones.
            </p>
          </section>

          {/* SECCIÓN 2: LÍMITE NO CLÍNICO */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3 border-l-4 border-l-amber-500">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. Delimitación Estricta No Clínica (Ley General de Salud 42-01)
            </h2>
            <p>
              Los acompañantes adscritos a JUNTOS <strong>no son personal médico ni prestadores de enfermería invasiva a domicilio</strong>. En estricto apego a la Ley 42-01, queda terminantemente prohibido que el acompañante realice diagnósticos médicos, altere dosificaciones, inyecte medicamentos o efectúe curaciones invasivas.
            </p>
            <p>
              El alcance se limita al acompañamiento físico, espera asistida en consultorios, gestiones en farmacia, soporte de desplazamiento y compañía respetuosa.
            </p>
          </section>

          {/* SECCIÓN 3: PROTOCOLO DE EMERGENCIAS Y CAÍDAS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3. Protocolo Ante Emergencias, Desvanecimientos o Caídas
            </h2>
            <p>
              En caso de caída accidental, crisis de salud imprevista o emergencia médica del asistido durante la prestación del servicio, el acompañante activará inmediatamente la alerta al <strong>Sistema Nacional de Atención a Emergencias y Seguridad (9-1-1)</strong> y se comunicará de inmediato con el contacto de emergencia familiar designado en la reserva.
            </p>
            <p>
              El acompañante permanecerá junto a la persona asistida hasta la llegada de las unidades de auxilio médico oficial o de los familiares responsables.
            </p>
          </section>

          {/* SECCIÓN 4: TARIFAS Y CONTRATACIÓN INDEPENDIENTE */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              4. Tarifas y Relación Jurídica Independiente
            </h2>
            <p>
              La tarifa diurna estándar es de <strong>RD$ 900 por hora</strong>, con una duración mínima de dos (2) horas por servicio.
            </p>
            <p>
              Conforme al Principio Fundamental VII del Código de Trabajo Dominicano, los acompañantes actúan bajo la condición de <strong>prestadores de servicios independientes</strong>, sin relación de subordinación laboral ni exclusividad contractual con la plataforma ni con los directivos de JUNTOS.
            </p>
          </section>

          {/* SECCIÓN 5: CANAL DE CONTACTO */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              5. Atención y Notificaciones
            </h2>
            <p>
              Para cualquier consulta o solicitud vinculada a los presentes términos, los usuarios pueden comunicarse a través de la <strong>Mesa de Soporte Oficial</strong> integrada en su panel de usuario registrado en la plataforma.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}