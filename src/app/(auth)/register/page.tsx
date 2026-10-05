'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import RegistroAcompanante from './RegistroAcompanante';
import { 
  User, 
  HeartHandshake, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

type RegisterCategory = 'CLIENT' | 'COMPANION';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Iniciar por defecto SIEMPRE en CLIENT
  const [category, setCategory] = useState<RegisterCategory>('CLIENT');

  // Leer parámetros de la URL de forma segura
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'companion') {
      setCategory('COMPANION');
    } else {
      setCategory('CLIENT');
    }
  }, [searchParams]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegisterClient(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setErrorMsg('Los correos electrónicos no coinciden.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const displayName = fullName.trim();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: displayName,
          phone: phone.trim(),
          role: 'CLIENT',
        },
      },
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email.trim(),
        full_name: displayName,
        phone: phone.trim(),
        role: 'CLIENT',
        status: 'ACTIVE',
      });

      if (!authData.session) {
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      window.location.href = '/services/new';
      return;
    }

    setLoading(false);
  }

  const clientSubmitText = loading ? 'Creando cuenta...' : 'Crear cuenta de Solicitante';

  return (
    <div className="relative z-10 w-full max-w-xl space-y-5 my-8">
      {/* ENCABEZADO */}
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <Logo size="lg" variant="dark" href="/" />
        <p className="text-xs text-slate-400 font-medium">
          Plataforma de Acompañamiento y Asistencia No Clínica
        </p>
      </div>

      {/* SELECTOR SUPERIOR DE ROL */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/90 border border-slate-800 rounded-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => { 
            setCategory('CLIENT'); 
            setErrorMsg(null);
            router.replace('/register');
          }}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            category === 'CLIENT'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <User className="w-4 h-4 mb-1" />
          <span>Solicitante</span>
        </button>

        <button
          type="button"
          onClick={() => { 
            setCategory('COMPANION'); 
            setErrorMsg(null);
            router.replace('/register?role=companion');
          }}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            category === 'COMPANION'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4 mb-1" />
          <span>Acompañante (RRHH)</span>
        </button>
      </div>

      {/* CONTENEDOR SEGÚN LA PESTAÑA SELECCIONADA */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {category === 'COMPANION' ? (
          <RegistroAcompanante />
        ) : (
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
              <p className="text-xs text-slate-400">Registro para coordinar asistencia no médica</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-[11px] text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Gestiona acompañamiento presencial para citas médicas y diligencias.</span>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegisterClient} className="space-y-3.5 text-xs">
              {/* NOMBRE Y TELÉFONO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Nombre completo *</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Carlos Domínguez"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Teléfono / WhatsApp *</label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 809-426-8978"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* CORREO Y CONFIRMAR CORREO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Correo electrónico *</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Confirmar correo electrónico *</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="Repite tu correo"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* CONTRASEÑA Y CONFIRMAR CONTRASEÑA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Contraseña *</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Confirmar contraseña *</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu clave"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-4 cursor-pointer"
              >
                <span>{clientSubmitText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800/80 text-center text-xs">
              <p className="text-slate-400">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PIE */}
      <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Datos confidenciales y protegidos • JUNTOS ASISTENCIA RD</span>
      </div>
    </div>
  );
}

export default function UnifiedRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-xs text-slate-400 font-mono">Cargando registro...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}