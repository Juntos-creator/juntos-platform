'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Scale, 
  CreditCard, 
  Clock, 
  MapPin, 
  Mail 
} from 'lucide-react';

export default function TerminosPage() {
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
            <Scale className="w-4 h-4" />
            <span>Condiciones Contractuales Generales</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Términos y Condiciones de Contratación
          </h1>
          <p className="text-xs text-slate-400">
            Versión Operativa 2.1 • Vigente para la República Dominicana • Sujeto a Validación Legal
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed text-justify">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN LEGAL */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              1. Identificación del Titular y Objeto de la Plataforma
            </h2>
            <p>
              El servicio y plataforma digital <strong>JUNTOS Asistencia RD</strong> (en lo adelante, «la Plataforma») opera bajo la denominación comercial de coordinación asistencial y logística independiente, con domicilio administrativo en Santo Domingo, República Dominicana (Mesa de Coordinación Operativa Central).
            </p>
            <p>
              La Plataforma actúa exclusivamente en calidad de <strong>intermediaria tecnológica de enlace</strong> que facilita la conexión entre usuarios contratantes (particulares o residentes en el extranjero que gestionan servicios para familiares en RD) y acompañantes prestadores de servicios independientes debidamente acreditados en la plataforma.
            </p>
          </section>

          {/* SECCIÓN 2: LÍMITE NO CLÍNICO (LEY 42-01) */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3 border-l-4 border-l-amber-500">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. Delimitación Estricta No Clínica (Ley General de Salud 42-01)
            </h2>
            <p>
              En estricto cumplimiento de la Ley General de Salud No. 42-01 y las normativas del Ministerio de Salud Pública de la República Dominicana, los acompañantes enlazados a través de la Plataforma <strong>NO ostentan condición de personal médico, enfermeros clínicos ni técnicos de atención médica invasiva</strong>.
            </p>
            <p>
              Queda expresamente prohibido que el acompañante efectúe diagnósticos clínicos, canalice vías intravenosas, inyecte medicamentos, modifique prescripciones o dosificaciones, efectúe curaciones de heridas complejas o asuma decisiones terapéuticas. El alcance del servicio se circunscribe a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li>Soporte físico no invasivo y ayuda en movilidad (apoyo de brazo, traslado en silla de ruedas, andador).</li>
              <li>Acompañamiento presencial y gestión de turnos en salas de espera de consultas médicas y centros de diagnóstico.</li>
              <li>Compañía respetuosa, lectura, supervisión activa y prevención en el domicilio.</li>
              <li>Soporte logístico en gestiones personales y recogida de medicamentos en farmacias bajo receta médica previa.</li>
            </ul>
          </section>

          {/* SECCIÓN 3: NATURALEZA LABORAL INDEPENDIENTE */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              3. Relación Jurídica de los Acompañantes (Prestación Independiente)
            </h2>
            <p>
              La relación jurídica entre la Plataforma y los acompañantes acreditados se rige bajo la figura de <strong>arrendamiento de servicios inmateriales y mandato independiente</strong>, sin que en ningún caso concurran los elementos constitutivos de subordinación jurídica o dependencia laboral establecidos en el Código de Trabajo de la República Dominicana (Principio Fundamental VII y Art. 1 y siguientes).
            </p>
            <p>
              Los acompañantes mantienen plena libertad para aceptar o rechazar solicitudes de asignación, determinar sus zonas geográficas de cobertura y gestionar su disponibilidad de manera autónoma, no existiendo régimen de exclusividad ni sujeción a jornada reglamentaria impuesta.
            </p>
          </section>

          {/* SECCIÓN 4: TARIFAS, ITBIS Y CONDICIONES DE PAGO */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              4. Tarifas, Régimen Tributario (ITBIS) y Comprobantes Fiscales (NCF)
            </h2>
            <p>
              La tarifa diurna base es de <strong>RD$ 900 (novecientos pesos dominicanos) por hora</strong>, con una duración mínima de dos (2) horas consecutivas por asignación para asegurar los costos de traslado del acompañante.
            </p>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <p>
                <strong>Tratamiento del ITBIS:</strong> Para consumidores finales que no requieran factura fiscal comercial, el valor indicado corresponde a la contraprestación final del servicio de intermediación y asistencia.
              </p>
              <p>
                En caso de que el contratante requiera <strong>Factura con Valor de Crédito Fiscal (Comprobante Fiscal Tipo B01)</strong> para deducción de gastos ante la Dirección General de Impuestos Internos (DGII), se adicionará el 18% correspondiente al ITBIS sobre la tarifa base facturada por la Plataforma.
              </p>
            </div>
          </section>

          {/* SECCIÓN 5: PROTOCOLO ANTE EMERGENCIAS Y CAÍDAS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
              5. Protocolo de Emergencias, Desvanecimientos o Caídas
            </h2>
            <p>
              En caso de que durante la prestación del servicio el usuario asistido sufra una caída accidental, desvanecimiento, pérdida de conciencia o alteración súbita de sus signos vitales:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-300">
              <li>El acompañante activará sin demora el <strong>Sistema Nacional de Atención a Emergencias y Seguridad 9-1-1</strong>.</li>
              <li>Notificará de forma inmediata al contacto familiar de emergencia registrado en la reserva y a la Mesa Operativa de la Plataforma.</li>
              <li>El acompañante permanecerá en el lugar brindando acompañamiento y resguardo hasta la llegada del equipo de auxilio médico oficial o de los familiares acreditados.</li>
              <li>El acompañante no suministrará medicamentos por cuenta propia ni realizará maniobras médicas para las cuales no esté facultado legalmente.</li>
            </ol>
          </section>

          {/* SECCIÓN 6: LÍMITES DE RESPONSABILIDAD Y SEGUROS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              6. Límite de Responsabilidad Civil y Cobertura de Accidentes
            </h2>
            <p>
              En la máxima medida permitida por el Código Civil Dominicano, la responsabilidad civil de la Plataforma por incidencias, demoras o controversias operativas directas estará expresamente limitada al <strong>monto total efectivamente pagado por el cliente por el servicio específico controvertido</strong>.
            </p>
            <p>
              La Plataforma no responde por actos ilícitos imputables de forma personal y directa a los contratistas o terceros, ni por descompensaciones fisiológicas preexistentes de la persona cuidada. Los acompañantes cuentan con adhesión a un esquema de auxilio básico de accidentes personales durante el desplazamiento en servicio activo, sujeto a los términos y exclusiones de la póliza colectiva contratada.
            </p>
          </section>

          {/* SECCIÓN 7: JURISDICCIÓN Y DISPUTAS */}
          <section className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              7. Jurisdicción Aplicable y Resolución de Controversias
            </h2>
            <p>
              Los presentes Términos se interpretan y rigen conforme a las leyes de la República Dominicana. Para cualquier disputa que no pueda resolverse de mutuo acuerdo en un plazo de treinta (30) días, las partes acuerdan someterse expresamente a la competencia de los <strong>Tribunales Ordinarios del Distrito Nacional, República Dominicana</strong>, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.
            </p>
          </section>

          {/* CANAL DE CONTACTO */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-white">Mesa Legal y de Cumplimiento Contractual</p>
              <p className="text-slate-400 text-[11px]">Canal de atención disponible para dudas, quejas y aclaraciones legales:</p>
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