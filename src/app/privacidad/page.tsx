'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff, UserCheck } from 'lucide-react';

export default function PrivacidadPage() {
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
            <Lock className="w-4 h-4" />
            <span>Ley 172-13 sobre Protección de Datos de Carácter Personal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Política de Privacidad y Tratamiento de Datos
          </h1>
          <p className="text-xs text-slate-400">
            Última actualización: Octubre 2026 • JUNTOS Asistencia RD
          </p>
        </div>

        <div className="space-y-8 text-xs text-slate-300 leading-relaxed text-justify">
          
          {/* SECCIÓN 1 */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              1. Responsable del Tratamiento y Datos Recabados
            </h2>
            <p>
              <strong>JUNTOS Asistencia RD</strong> es el responsable de la custodia y tratamiento seguro de los datos personales suministrados por solicitantes y postulantes a acompañantes.
            </p>
            <p>
              Recabamos exclusivamente los datos necesarios para la gestión segura del servicio: nombres, teléfonos de contacto, domicilio de encuentro, condiciones funcionales de movilidad y datos de acreditación de identidad (para acompañantes).
            </p>
          </section>

          {/* SECCIÓN 2: DERECHOS ARCO SEGUROS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              2. Ejercicio Seguro de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h2>
            <p>
              Conforme a la Ley 172-13 de la República Dominicana, usted tiene derecho a consultar, actualizar o solicitar la supresión de sus datos personales en cualquier momento.
            </p>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-slate-300">
              <strong className="text-emerald-400 block mb-1">Mecanismo seguro de solicitud:</strong>
              Para proteger su privacidad y evitar la circulación innecesaria de documentos por correo electrónico, el ejercicio de sus derechos ARCO se tramita directamente desde la <strong>sección de seguridad dentro de su cuenta autenticada</strong> en la plataforma.
            </div>
          </section>

          {/* SECCIÓN 3: ACCESO RESTRINGIDO A DATOS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              3. Confidencialidad y Limitación de Acceso
            </h2>
            <p>
              Los datos sensibles de movilidad del asistido (uso de silla de ruedas, andador, etc.) y la dirección exacta del punto de encuentro únicamente son visibles para el acompañante que haya sido <strong>formalmente asignado</strong> a dicha reserva, restringiendo el acceso una vez finalizado el servicio.
            </p>
            <p>
              JUNTOS no vende ni cede datos de contacto a terceros para fines comerciales o de publicidad ajena a la plataforma.
            </p>
          </section>

          {/* SECCIÓN 4: SEGURIDAD Y CONSERVACIÓN */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              4. Medidas Técnicas de Resguardo
            </h2>
            <p>
              Toda la información viaja bajo canales de comunicación cifrados mediante protocolo HTTPS/TLS y se almacena en bases de datos con control de acceso por roles (Row Level Security).
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}