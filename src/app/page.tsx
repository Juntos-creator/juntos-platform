'use client';

import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Calendar, 
  PhoneCall, 
  CheckCircle2, 
  HeartHandshake, 
  UserCheck, 
  Building2, 
  ArrowRight, 
  Star, 
  HelpCircle,
  Stethoscope,
  Home,
  ShieldAlert,
  MessageCircle,
  Radio
} from 'lucide-react';
import { Navbar } from '@/components/navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* COPY COMERCIAL */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-600/40 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ASISTENCIA PERSONAL Y ACOMPAÑAMIENTO NO CLÍNICO 24/7 EN RD
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                  Nadie debería esperar <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    en una clínica solo.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Asistencia logística, personal y de compañía para acudir a citas médicas, estudios diagnósticos o apoyo en el hogar. Ideal para familiares que están trabajando o fuera del país.
                </p>

                {/* BOTONERA CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/services/new"
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2.5 text-base shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    <span>Solicitar Acompañante Ahora</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <a
                    href="https://wa.me/18095550100?text=Hola,%20deseo%20información%20sobre%20el%20servicio%20de%20acompañamiento%20no%20clínico"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <span>Hablar por WhatsApp</span>
                  </a>
                </div>

                {/* INSIGNIAS RÁPIDAS DE CONFIANZA */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-left">
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">RD$900<span className="text-xs text-slate-400 font-medium">/h</span></p>
                    <p className="text-[11px] text-slate-400 font-medium">Tarifa fija diurna</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">100%</p>
                    <p className="text-[11px] text-slate-400 font-medium">Depurados con PGR</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">4.9★</p>
                    <p className="text-[11px] text-slate-400 font-medium">Calificación familias</p>
                  </div>
                </div>
              </div>

              {/* CARD RESUMEN / TARJETA COTIZADORA */}
              <div className="lg:col-span-5">
                <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
                        J
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Reserva Inmediata</h3>
                        <p className="text-[11px] text-slate-400">Despacho en centros de salud y hogares de RD</p>
                      </div>
                    </div>
                    <span className="text-[11px] bg-slate-800 text-emerald-400 border border-emerald-800/40 px-2.5 py-1 rounded-full font-mono font-bold">
                      DISPONIBLE HOY
                    </span>
                  </div>

                  <div className="space-y-4 py-5 text-xs text-slate-300">
                    <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Puntos de atención habituales</p>
                        <p className="text-white font-medium">CEDIMAT, HOMS, Clínica Abreu, Real o domicilio</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Seguridad del acompañante</p>
                        <p className="text-white font-medium">Cédula, depuración PGR y entrevistas presenciales</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Monitoreo activo</p>
                        <p className="text-white font-medium">Mesa de Operaciones y botón SOS auditado 24/7</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/services/new"
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs transition shadow"
                  >
                    Iniciar reserva personalizada en 2 min →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BENEFICIOS / VALORES CLAVE */}
        <section className="py-16 border-b border-slate-800 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">Seguridad y Claridad</h2>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">¿Por qué las familias confían en JUNTOS?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Depuración KYC Rigurosa</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada acompañante pasa por validación de identidad con cédula de JCE, certificado de antecedentes de la Procuraduría General (PGR) y pruebas psicométricas.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-700/60 flex items-center justify-center text-blue-400">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Mesa de Operaciones 24/7</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Supervisión constante de cada servicio desde nuestra central de comando, con protocolo de emergencia SOS activo y contacto directo por WhatsApp con la familia.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Trato Humano No Clínico</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Personal vocacional entrenado en empatía, asistencia práctica y paciencia para adultos mayores o convalecientes, sin involucrarse en actos médicos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA (3 PASOS) */}
        <section className="py-20 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">Paso a paso</h2>
              <p className="text-3xl font-black text-white mt-1">¿Cómo solicitar tu servicio?</p>
              <p className="text-sm text-slate-400 mt-2">Un proceso diseñado para ser rápido y sin fricciones técnicas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-3xl relative flex flex-col items-start space-y-4">
                <span className="text-4xl font-black text-slate-800 font-mono">01</span>
                <h3 className="text-xl font-bold text-white">Elige día, hora y lugar</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Indica si es para ti o para un ser querido, la clínica u hospital de atención, y las horas requeridas en nuestro formulario guiado.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-3xl relative flex flex-col items-start space-y-4">
                <span className="text-4xl font-black text-slate-800 font-mono">02</span>
                <h3 className="text-xl font-bold text-white">Asignación verificada</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  La Mesa de Operaciones asigna al acompañante acreditado disponible más idóneo y envía las credenciales por WhatsApp y SMS.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-3xl relative flex flex-col items-start space-y-4">
                <span className="text-4xl font-black text-slate-800 font-mono">03</span>
                <h3 className="text-xl font-bold text-white">Acompañamiento seguro</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El acompañante asiste al paciente, apoya en el trámite y mantiene a la familia informada hasta el cierre oficial del servicio.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/services/new"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm transition"
              >
                Comenzar reserva ahora <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* MODALIDADES DE SERVICIO */}
        <section className="py-20 border-b border-slate-800 bg-slate-950/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">Modalidades</h2>
              <p className="text-3xl font-black text-white mt-1">Servicios pensados para cada momento</p>
              <p className="text-xs text-slate-400 mt-2">Apoyo logístico y de movilidad estrictamente no invasivo (no clínico)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Acompañamiento a Consultas y Centros Médicos</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Soporte presencial no médico durante consultas con especialistas, realización de resonancias o análisis de laboratorio, internamientos y altas hospitalarias.
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Traslado y espera en sala de espera</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Asistencia en compras en farmacia interna</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Notificación paso a paso al familiar por WhatsApp</li>
                  </ul>
                </div>
                <Link href="/services/new" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-4">
                  Reservar en centro médico →
                </Link>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Home className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Asistencia y Compañía en el Hogar</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Acompañamiento no médico en el hogar para adultos mayores o personas convalecientes. Apoyo en movilidad, compañía conversacional y supervisión general.
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Apoyo en movilidad dentro del domicilio</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Compañía activa y estimulación diurna</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Turnos flexibles de 2, 4, 8 o nocturnos</li>
                  </ul>
                </div>
                <Link href="/services/new" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-4">
                  Reservar en casa →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES (FAQ) */}
        <section className="py-20 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">Dudas resueltas</h2>
              <p className="text-3xl font-black text-white mt-1">Preguntas Frecuentes</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ¿El servicio incluye cuidados de enfermería o administración de medicamentos invasivos?
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  <strong>No.</strong> JUNTOS brinda asistencia personal, de movilidad, acompañamiento y soporte estrictamente no clínico. No sustituye al médico ni al personal de enfermería especializado.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ¿Puedo reservar para mi madre si yo estoy fuera del país o en mi trabajo?
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Sí. En el primer paso del formulario puedes elegir "Para un familiar". El acompañante se coordinará con el paciente y te mantendrá informado por WhatsApp durante todo el servicio.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ¿Cómo se realiza el pago?
                </h3>
                <p className="text-slate-400 leading-relaxed pl-6">
                  Aceptamos tarjetas de crédito o débito de manera 100% segura en pesos dominicanos (RD$). Emitimos comprobante oficial y factura con NCF si es requerida.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-20 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Coordina el acompañamiento de tu ser querido hoy mismo
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Tranquilidad para ti, compañía de confianza para ellos. Disponibles 24 horas al día en todo el Gran Santo Domingo y Santiago.
            </p>
            <div className="pt-2">
              <Link
                href="/services/new"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-10 py-4 rounded-2xl inline-flex items-center gap-2 text-base shadow-xl shadow-emerald-500/20 transition hover:scale-105"
              >
                <span>Comenzar solicitud en línea</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs">
              J
            </div>
            <span className="font-bold text-slate-300">JUNTOS ASISTENCIA RD</span>
            <span>• Asistencia y Acompañamiento Personal No Clínico 24/7</span>
          </div>
          <p>© {new Date().getFullYear()} JUNTOS. Todos los derechos reservados. Santo Domingo, República Dominicana.</p>
        </div>
      </footer>
    </div>
  );
}