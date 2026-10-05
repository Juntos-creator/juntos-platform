'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Stethoscope,
  Home,
  Activity,
  ChevronDown,
  ChevronUp,
  Globe2,
  Calculator,
  KeyRound,
  MessageSquare,
  Radio
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  const [calcHours, setCalcHours] = useState(2);
  const RATE_PER_HOUR = 900;
  const calculatedTotal = calcHours * RATE_PER_HOUR;

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Comprobar automáticamente si el usuario ya está conectado y tiene cita activa
  useEffect(() => {
    async function checkUserSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      // Si es la administradora, va directo a la mesa de operaciones
      if (user.email?.toLowerCase() === 'odel_kiss@hotmail.com' || user.user_metadata?.role === 'ADMIN') {
        router.replace('/admin/mesa-operaciones');
        return;
      }

      // Si es un cliente, buscar si tiene un servicio activo
      const { data: activeOrder } = await supabase
        .from('service_requests')
        .select('id')
        .eq('client_id', user.id)
        .in('status', ['PENDING', 'PENDING_DISPATCH', 'ASSIGNED', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeOrder) {
        setActiveServiceId(activeOrder.id);
        // Redirección directa e instantánea a la Sala Situacional
        router.replace(`/services/live?id=${activeOrder.id}`);
      }
    }

    checkUserSession();
  }, [router, supabase]);

  const faqs = [
    {
      q: '¿Qué tipo de servicios realiza un acompañante de JUNTOS?',
      a: 'Brindamos asistencia y acompañamiento estrictamente NO clínico: soporte en movilidad física, asistencia en salas de espera de hospitales o clínicas, compañía activa en el hogar, gestiones personales y apoyo en farmacia.'
    },
    {
      q: '¿El acompañante puede aplicar inyecciones o administrar medicamentos?',
      a: 'No. Todo el personal de JUNTOS tiene prohibido realizar procedimientos médicos o de enfermería (diagnosticar, inyectar, colocar sondas o modificar dosis). Nuestro rol es de soporte humano y logística conforme a la Ley 42-01.'
    },
    {
      q: '¿Puedo contratar el servicio si resido en el extranjero para un familiar en RD?',
      a: 'Sí. Puedes coordinar y reservar en línea para un familiar en la República Dominicana y recibir confirmación del inicio y finalización del servicio.'
    },
    {
      q: '¿Cuál es el costo del servicio y cómo se calcula?',
      a: 'Contamos con una tarifa diurna estándar de RD$ 900 por hora, con un tiempo mínimo de 2 horas para garantizar el desplazamiento del acompañante.'
    },
    {
      q: '¿Cómo garantizan la identidad del acompañante?',
      a: 'Cada acompañante pasa por un proceso de acreditación de identidad ante la plataforma, validación de antecedentes y verificación en el punto de encuentro mediante código PIN.'
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
            <a href="#seguridad" className="hover:text-emerald-400 transition">Protocolo No Clínico</a>
            <a href="#tarifas" className="hover:text-emerald-400 transition">Tarifas</a>
            <a href="#faq" className="hover:text-emerald-400 transition">Preguntas</a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/profile"
                className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition"
              >
                Mi Perfil
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition"
              >
                Iniciar sesión
              </Link>
            )}

            {activeServiceId ? (
              <Link
                href={`/services/live?id=${activeServiceId}`}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Sala en Vivo</span>
              </Link>
            ) : (
              <Link
                href="/services/new"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4.5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <span>Solicitar Servicio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* BANNER DINÁMICO SI HAY SERVICIO ACTIVO */}
      {activeServiceId && (
        <div className="bg-emerald-950 border-b border-emerald-500/40 p-3 text-center text-xs flex items-center justify-center gap-2 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Tienes un servicio activo en curso.</span>
          <Link 
            href={`/services/live?id=${activeServiceId}`} 
            className="font-black underline text-white hover:text-emerald-200 ml-1"
          >
            Abrir Sala en Vivo ahora &rarr;
          </Link>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-500/10 via-slate-900/0 to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-slate-950/90 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-emerald-400 font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Asistencia y Acompañamiento Personal No Clínico en RD</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Cuidado humano, puntual y respetuoso para tus seres queridos en RD.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Coordinamos acompañamiento confiable para citas médicas, trámites personales y compañía diurna en el hogar. Diseñado para familias en República Dominicana y la comunidad en el exterior.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {activeServiceId ? (
              <Link
                href={`/services/live?id=${activeServiceId}`}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Ir a mi Sala en Vivo Activa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/services/new"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]"
              >
                <span>Solicitar Acompañante Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

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
              <span>Expediente de Identidad Verificado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tarifa Transparente RD$ 900 / Hora</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Código PIN de Seguridad de Encuentro</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Gran Santo Domingo y Santiago</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MODALIDADES DE SERVICIO */}
      <section id="servicios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            SERVICIOS ASISTENCIALES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Modalidades de Asistencia Humana
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Soporte logístico y compañía para familias que necesitan apoyo presencial confiable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Consultas y Estudios Médicos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Espera en sala médica, asistencia en movilidad en pasillos, gestión de turnos y soporte al recoger recetas.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Compañía en Hogar</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compañía activa diurna, apoyo para caminar, lectura, conversación respetuosa y supervisión dentro del domicilio.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Altas y Salidas de Centros</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acompañamiento presencial durante el egreso de un centro de salud y retorno seguro al hogar.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Diligencias Cotidianas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Soporte para acudir al banco, pagos de servicios o gestiones cotidianas con asistencia continua.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-slate-950/70 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              PROCESO CLARO
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ¿Cómo Funciona?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Coordinación rápida y trazable para familias locales y en el exterior.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center">1</span>
              <h4 className="font-bold text-white text-base">Completa la Solicitud</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Indica fecha, horas, punto de encuentro y condiciones de movilidad de la persona a acompañar.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center">2</span>
              <h4 className="font-bold text-white text-base">Confirmación de Acompañante</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asignamos un acompañante con perfil acreditado y documentación de identidad cotejada.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center">3</span>
              <h4 className="font-bold text-white text-base">Validación con PIN</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                El acompañante se presenta y el servicio inicia confirmando el código PIN único de tu reserva.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center">4</span>
              <h4 className="font-bold text-white text-base">Cierre del Servicio</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirmación de entrega segura en el hogar o destino final acordado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALCULADORA DE TARIFA */}
      <section id="tarifas" className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl sm:text-2xl font-black text-white">Calculadora de Tarifa</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Horario diurno estándar (7:00 AM – 7:00 PM)</p>
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
                  className={`py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    calcHours === h
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
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
              <span className="text-xs text-slate-400">Total estimado por servicio:</span>
              <p className="text-3xl font-black text-white font-mono">
                RD$ {calculatedTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                * Mínimo de 2 horas por traslado. Tarifas claras sin cargos sorpresa.
              </p>
            </div>

            <Link
              href={`/services/new?hours=${calcHours}`}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Continuar con {calcHours} Horas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. PROTOCOLO NO CLÍNICO */}
      <section id="seguridad" className="py-20 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                SEGURIDAD Y TRANSPARENCIA
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Claridad y Rigor en Nuestro Alcance
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Priorizamos la dignidad y la integridad de cada persona cuidada mediante protocolos estrictos:
              </p>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Acreditación Previa de Identidad:</strong>
                    Documentación de identidad oficial y antecedentes cotejados antes de cada asignación.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Verificación con Código PIN:</strong>
                    Clave de confirmación numérica en el punto de encuentro para garantizar el inicio puntual.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Coordinación para la Diáspora:</strong>
                    Plataforma web accesible desde cualquier país para coordinar y supervisar reservas a distancia.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  IMPORTANTE: PROTOCOLO NO CLÍNICO (LEY 42-01)
                </span>
                <h4 className="text-xl font-black text-white">Límites Claros de Nuestro Rol</h4>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Para seguridad del usuario y estricto cumplimiento normativo, los acompañantes no ejercen enfermería invasiva ni actos médicos.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SÍ: Acompañamiento, soporte en movilidad, traslados y escucha activa.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SÍ: Espera en consultas, apoyo en farmacias y diligencias personales.</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center gap-2.5 text-rose-300">
                  <span className="font-bold text-rose-400 shrink-0">✕</span>
                  <span>NO: Diagnósticos, inyecciones, cambios de dosis ni procedimientos clínicos.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. PREGUNTAS FRECUENTES */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            RESPUESTAS CLARAS
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
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white cursor-pointer"
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

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Logo size="sm" variant="dark" href="/" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Plataforma de Acompañamiento y Asistencia Personal No Clínica en República Dominicana.
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
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Términos y Marco Legal</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li><Link href="/terminos" className="hover:text-emerald-400">Términos de Servicio y Tarifas</Link></li>
              <li><Link href="/privacidad" className="hover:text-emerald-400">Política de Privacidad (Ley 172-13)</Link></li>
              <li><Link href="/cancelacion" className="hover:text-emerald-400">Cancelaciones y Reembolsos</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Atención en Línea</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mesa Operativa: Gran Santo Domingo y Santiago, RD.
            </p>
            <p className="text-[11px] text-slate-400">
              Horario diurno: 7:00 AM – 7:00 PM.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400 font-bold text-[11px]">
                <MessageSquare className="w-3.5 h-3.5" /> Soporte activo vía panel de usuario
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
          <p>© 2026 JUNTOS Asistencia RD. Todos los derechos reservados.</p>
          <p>Servicios de Asistencia Personal No Clínica bajo normativa legal dominicana.</p>
        </div>
      </footer>

    </div>
  );
}