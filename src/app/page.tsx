'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Building2,
  Calendar,
  PhoneCall,
  Stethoscope,
  Home,
  Activity,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Globe2,
  Sparkles,
  Calculator,
  KeyRound
} from 'lucide-react';

export default function HomePage() {
  // Estado para la calculadora rápida en vivo
  const [calcHours, setCalcHours] = useState(3);
  const RATE_PER_HOUR = 900;
  const calculatedTotal = calcHours * RATE_PER_HOUR;

  // Estado para acordeón de FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Qué tipo de servicios realiza un acompañante de JUNTOS?',
      a: 'Brindamos asistencia y acompañamiento estrictamente NO clínico: soporte en movilidad física, asistencia en salas de espera de hospitales o clínicas, compañía activa en el hogar, gestiones personales y apoyo en compras o farmacia.'
    },
    {
      q: '¿El acompañante puede aplicar inyecciones o cambiar medicamentos?',
      a: 'No. Todo el personal de JUNTOS tiene prohibido por protocolo y estatuto legal realizar procedimientos médicos o de enfermería (diagnosticar, inyectar, colocar sondas o modificar dosis). Nuestro rol es de soporte humano, logística y acompañamiento digno conforme a la Ley 42-01.'
    },
    {
      q: '¿Puedo contratar el servicio si resido en Estados Unidos o el extranjero (Diáspora)?',
      a: 'Sí, es una de nuestras principales especialidades. Puedes reservar y pagar en línea para un familiar en la República Dominicana. Recibirás reportes y confirmaciones de llegada en tiempo real vía WhatsApp.'
    },
    {
      q: '¿Cuál es el costo del servicio y cómo se calcula?',
      a: 'Contamos con una tarifa diurna fija y transparente de RD$ 900 por hora (mínimo de 2 horas para desplazamiento). Si eres parte de convenios o red familiar acreditada, se aplica un 5% de descuento.'
    },
    {
      q: '¿Cómo garantizan la seguridad e identidad del acompañante?',
      a: 'Cada acompañante pasa por validación de antecedentes penales mediante Certificado oficial de la Procuraduría General de la República (PGR), verificación de identidad de la JCE, capacitación y asignación de código PIN de inicio para el encuentro presencial.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 1. HEADER / NAVBAR SUPERIOR */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Logo size="md" variant="dark" href="/" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#servicios" className="hover:text-emerald-400 transition">Modalidades</a>
            <a href="#como-funciona" className="hover:text-emerald-400 transition">Cómo Funciona</a>
            <a href="#seguridad" className="hover:text-emerald-400 transition">Garantía PGR</a>
            <a href="#tarifas" className="hover:text-emerald-400 transition">Tarifas</a>
            <a href="#faq" className="hover:text-emerald-400 transition">Preguntas</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/services/new"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>Solicitar Servicio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-500/10 via-slate-900/0 to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-emerald-400 font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Red de Asistencia y Acompañamiento No Clínico en República Dominicana</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Cuidado humano, puntual y seguro para quienes más amas en RD.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Coordinamos acompañantes depurados para citas médicas, trámites personales y compañía diurna en el hogar. Diseñado para familias en RD y la comunidad dominicana en la diáspora.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/services/new"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
            >
              <span>Solicitar Acompañante Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/companion/register"
              className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 font-bold px-7 py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Postular como Acompañante</span>
            </Link>
          </div>

          {/* Badges de confianza */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Certificado No Antecedentes PGR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tarifa Fija RD$ 900 / Hora</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Reportes por WhatsApp a Familiares</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Gran Santo Domingo y Santiago</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MÉTRICAS CLAVE */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">RD$ 900</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Tarifa por Hora Fija</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-white font-mono">PGR</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">No Antecedentes Penales</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">PIN</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Validación de Llegada</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-white font-mono">2 Horas</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Mínimo por Servicio</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MODALIDADES DE SERVICIO */}
      <section id="servicios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            SERVICIOS ESPECIALIZADOS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Modalidades de Asistencia Humana
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Diseñadas para brindar tranquilidad logística a las familias con estándares de calidad y respeto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Consultas y Estudios Médicos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Espera en sala médica, asistencia de movilidad en pasillos, gestión de turnos y soporte al recoger recetas en farmacia.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Compañía en Hogar</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compañía activa diurna, apoyo para caminar, lectura, conversación empática y supervisión preventiva dentro del domicilio.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Altas y Procedimientos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acompañamiento presencial durante el egreso de clínica o centro de salud, con soporte en el retorno seguro a casa.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Diligencias Personales</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Soporte para acudir al banco, pagos de servicios, compras o gestiones cotidianas con asistencia continua.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CÓMO FUNCIONA (PASO A PASO) */}
      <section id="como-funciona" className="py-20 bg-slate-950/70 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              FLUJO RÁPIDO Y TRANSPARENTE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ¿Cómo Funciona el Proceso?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Diseñado tanto para familiares en República Dominicana como para la comunidad dominicana en el exterior.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                1
              </span>
              <h4 className="font-bold text-white text-base">Completa la Solicitud</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Elige fecha, horas, punto de encuentro en RD y condiciones de movilidad de la persona a acompañar.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                2
              </span>
              <h4 className="font-bold text-white text-base">Asignación Depurada</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asignamos un acompañante acreditado con carnet institucional y Certificado PGR verificado.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                3
              </span>
              <h4 className="font-bold text-white text-base">Validación con PIN</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                El acompañante se presenta puntualmente y confirma el inicio del servicio mediante tu código PIN único.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                4
              </span>
              <h4 className="font-bold text-white text-base">Reportes Directos</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recibes confirmación de llegada y finalización por WhatsApp, estés donde estés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALCULADORA RÁPIDA DE TARIFAS */}
      <section id="tarifas" className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl sm:text-2xl font-black text-white">Calculadora Rápida de Servicio</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Tarifa diurna estándar (7:00 AM – 7:00 PM)</p>
            </div>
            <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-full font-bold">
              RD$ 900 / Hora
            </span>
          </div>

          <div className="space-y-4">
            <label className="text-xs text-slate-300 font-bold block">
              Selecciona las horas estimadas: ({calcHours} Horas)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[2, 3, 4, 6, 8, 10, 12].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setCalcHours(h)}
                  className={`py-3 rounded-xl font-bold text-xs border transition-all ${
                    calcHours === h
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs text-slate-400">Total estimado a pagar:</span>
              <p className="text-3xl font-black text-white font-mono">
                RD$ {calculatedTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 mt-0.5">
                * 5% de descuento aplicable con código de red familiar o rol acreditado.
              </p>
            </div>

            <Link
              href="/services/new"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Continuar con {calcHours} Horas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. SEGURIDAD, POLÍTICAS Y DIÁSPORA */}
      <section id="seguridad" className="py-20 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                CONFIANZA Y RIGOR LEGAL
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Garantía y Tranquilidad para Familias Locales y en el Exterior
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sabemos la preocupación que genera coordinar la asistencia de un ser querido cuando te encuentras trabajando o fuera del país:
              </p>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Depuración de Antecedentes PGR:</strong>
                    Certificación de no antecedentes penales emitida por la Procuraduría General de la República Dominicana con verificación periódica.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Protocolo de Seguridad con Código PIN:</strong>
                    Validación numérica mutua en el punto de encuentro para garantizar la autenticidad y el inicio exacto del servicio.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Canal de Seguimiento para la Diáspora:</strong>
                    Soporte telefónico y WhatsApp directo (+1) para seguimiento operativo continuo desde el exterior.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  IMPORTANTE: PROTOCOLO NO CLÍNICO
                </span>
                <h4 className="text-xl font-black text-white">Límites Claros de Nuestro Rol</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Para seguridad del usuario y estricto cumplimiento de la Ley General de Salud 42-01, los acompañantes de JUNTOS no son enfermeros a domicilio ni personal médico.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SÍ: Acompañamiento, soporte físico, movilidad y escucha activa.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SÍ: Logística en salas de espera, farmacias y trámites cotidianos.</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center gap-2.5 text-rose-300">
                  <span className="font-bold text-rose-400 shrink-0">✕</span>
                  <span>NO: Administración invasiva de fármacos, inyecciones ni diagnósticos.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            RESOLVEMOS TUS DUDAS
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. CTA FINAL */}
      <section className="py-16 bg-gradient-to-b from-slate-950/40 to-slate-950 border-t border-slate-800/80 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ¿Listo para coordinar un acompañante?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Reserva en menos de 3 minutos con confirmación directa y seguimiento continuo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/services/new"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
            >
              <span>Comenzar Reserva de Servicio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-7 py-4 rounded-xl text-xs transition"
            >
              <span>Acceder a Mi Cuenta</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER COMPLETO */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <Logo size="sm" variant="dark" href="/" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Plataforma de Acompañamiento y Asistencia No Clínica en República Dominicana. Cuidado humano, digno y seguro.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Plataforma</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li><Link href="/services/new" className="hover:text-emerald-400">Solicitar Acompañante</Link></li>
              <li><Link href="/login" className="hover:text-emerald-400">Acceso a Cuenta</Link></li>
              <li><Link href="/register" className="hover:text-emerald-400">Registro de Clientes</Link></li>
              <li><Link href="/companion/register" className="hover:text-emerald-400">Postulación de Acompañantes</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Marco Legal</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li><Link href="/terminos" className="hover:text-emerald-400">Términos de Servicio y Tarifas</Link></li>
              <li><Link href="/privacidad" className="hover:text-emerald-400">Protección de Datos (Ley 172-13)</Link></li>
              <li><Link href="/cancelacion" className="hover:text-emerald-400">Cancelaciones y Reembolsos</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Atención y Contacto</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Coordinación operativa: Lunes a Domingo, 7:00 AM – 9:00 PM.
            </p>
            <p className="text-emerald-400 font-mono font-bold text-xs">
              Mesa Operativa: Santo Domingo Este, RD
            </p>
            <p className="text-[11px] text-slate-400">
              <a 
                href="https://wa.me/18094268978" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-emerald-400 transition"
              >
                WhatsApp: +1 (809) 426-8978
              </a>
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
          <p>© 2026 JUNTOS ASISTENCIA RD. Operado por Odelkis Domínguez. Todos los derechos reservados.</p>
          <p>Servicios de Asistencia Personal No Clínica bajo normativa legal dominicana.</p>
        </div>
      </footer>

    </div>
  );
}