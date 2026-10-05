'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Database, 
  EyeOff, 
  UserCheck, 
  Mail, 
  Building2, 
  Clock 
} from 'lucide-react';

export default function PrivacidadPage() {
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
            <Lock className="w-4 h-4" />
            <span>Ley No. 172-13 sobre Protección de Datos de Carácter Personal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Política de Privacidad y Tratamiento de Datos
          </h1>
          <p className="text-xs text-slate-400">
            Versión 2.1 • República Dominicana • Aplicable a Solicitantes, Familiares y Acompañantes
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed text-justify">
          
          {/* SECCIÓN 1: RESPONSABLE */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              1. Identidad y Domicilio del Responsable del Fichero
            </h2>
            <p>
              El responsable del tratamiento y resguardo de sus datos personales es <strong>JUNTOS Asistencia RD</strong>, con sede operativa de coordinación en Santo Domingo, República Dominicana.
            </p>
            <p>
              En estricto cumplimiento de la <strong>Ley No. 172-13</strong>, garantizamos que los datos personales y de movilidad recopilados se procesan bajo principios de lealtad, finalidad legítima, proporcionalidad y confidencialidad.
            </p>
          </section>

          {/* SECCIÓN 2: DATOS TRATADOS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              2. Datos Recabados y Finalidad Específica
            </h2>
            <p>
              Recabamos únicamente la información estrictamente necesaria para la prestación y resguardo del servicio:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li><strong>Datos del Contratante y Contacto de Emergencia:</strong> Nombres, teléfono de contacto en RD o exterior, vínculo familiar y dirección de correo electrónico.</li>
              <li><strong>Datos Operativos y de Movilidad del Asistido:</strong> Nombre de referencia, punto de encuentro y condición ambulatoria (uso de andador, silla de ruedas, apoyo de brazo o movilidad independiente) con el único fin de prever el esfuerzo físico del acompañante.</li>
              <li><strong>Datos de Acompañantes (Acreditación KYC):</strong> Cédula de Identidad y Electoral oficial dominicana, fotografía de comprobación biométrica, referencias y constancia de antecedentes para cotejo.</li>
            </ul>
          </section>

          {/* SECCIÓN 3: CONTROL TÉCNICO DE ACCESO (RLS) */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3 border-l-4 border-l-emerald-500">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              3. Aislamiento de Datos Sensibles (Row Level Security en Base de Datos)
            </h2>
            <p>
              El resguardo de la privacidad de los adultos mayores no depende de una simple interfaz visual, sino de controles de acceso a nivel de motor de base de datos PostgreSQL:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li><strong>Acompañante Asignado:</strong> Solo tiene visibilidad de la dirección y condición de movilidad de la persona asistida una vez que la Mesa Operativa le asigna formalmente el servicio.</li>
              <li><strong>Cierre del Servicio:</strong> Una vez completada la asignación y validado el PIN final, la visualización de los datos operativos queda restringida en el perfil del acompañante.</li>
              <li><strong>Seguridad del Código PIN:</strong> Los códigos de verificación de llegada y salida se procesan mediante funciones criptográficas de ejecución segura en servidor (`SECURITY DEFINER`), impidiendo que el PIN viaje o pueda ser inspeccionado en el código del navegador.</li>
            </ul>
          </section>

          {/* SECCIÓN 4: PLAZO DE CONSERVACIÓN */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              4. Plazo de Conservación de la Información
            </h2>
            <p>
              Los datos vinculados a solicitudes operativas se conservarán durante el período necesario para dar cumplimiento a las obligaciones contractuales y de soporte al cliente, y posteriormente durante los plazos de prescripción legal exigidos por la legislación mercantil y tributaria dominicana (mínimo de 3 a 10 años para comprobantes fiscales y registros de transacciones).
            </p>
          </section>

          {/* SECCIÓN 5: DERECHOS ARCO (CANAL DENTRO Y FUERA DE CUENTA) */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              5. Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h2>
            <p>
              Cualquier titular de datos personales puede ejercer sus derechos previstos en la Ley 172-13 mediante dos vías habilitadas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <strong className="text-white block text-xs">Vía A: Panel Autenticado</strong>
                <p className="text-slate-400 text-[11px]">
                  Directamente desde la configuración de perfil de su cuenta en la plataforma, sin intermediarios.
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <strong className="text-white block text-xs">Vía B: Canal Externo (Sin Login)</strong>
                <p className="text-slate-400 text-[11px]">
                  Si no puede acceder a su cuenta, remita su petición a: <a href="mailto:soporte@juntos.do" className="text-emerald-400 underline font-mono">soporte@juntos.do</a> con el asunto «Ejercicio Derechos ARCO».
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              * Por seguridad, no solicitamos imágenes completas de cédula por correo convencional; la acreditación de identidad se gestiona mediante validación cruzada con el número de teléfono o correo originalmente registrado.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}