'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  User, 
  HeartHandshake, 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

type UserCategory = 'CLIENT' | 'COMPANION' | 'INSTITUTION';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const supabase = createClient();

  // Solo roles públicos visibles
  const [category, setCategory] = useState<UserCategory>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Iniciar sesión en Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        let msg = error.message;
        if (msg === 'Invalid login credentials') {
          msg = 'Correo o contraseña incorrectos.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Por favor verifica tu correo electrónico antes de ingresar.';
        }
        setErrorMsg(msg);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // 2. Comprobación silenciosa de Administrador (Totalmente oculta del público)
        const isMasterAdmin = data.user.email === 'odel_kiss@hotmail.com';

        let userRole = null;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          userRole = profile?.role;
        } catch {
          // Continuar con fallback
        }

        // Si es Admin, redirigir a la Mesa / Perfil Central de inmediato
        if (isMasterAdmin || userRole === 'ADMIN') {
          window.location.href = redirectParam || '/profile';
          return;
        }

        // Destinos para usuarios normales según su rol
        let destination = redirectParam;
        if (!destination) {
          if (category === 'COMPANION' || userRole === 'COMPANION') {
            destination = '/companion';
          } else if (category === 'INSTITUTION' || userRole === 'INSTITUTION') {
            destination = '/profile';
          } else {
            destination = '/services/new';
          }
        }

        // 3. Forzar redirección segura
        window.location.href = destination;
        return;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión. Inténtalo nuevamente.');
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-lg space-y-5 my-6">
      
      {/* LOGO ENCABEZADO */}
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <Logo size="lg" variant="dark" href="/" />
        <p className="text-xs text-slate-400 font-medium">
          Plataforma de Acompañamiento y Asistencia No Clínica
        </p>
      </div>

      {/* TARJETA DE LOGIN */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
        
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-black text-white">Acceso a la Plataforma</h1>
          <p className="text-xs text-slate-400">Selecciona tu categoría de usuario</p>
        </div>

        {/* SELECTOR SEGURO: SOLO 3 BOTONES PÚBLICOS (SIN BOTÓN ADMIN) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setCategory('CLIENT'); setErrorMsg(null); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              category === 'CLIENT'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4 mb-1" />
            <span>Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => { setCategory('COMPANION'); setErrorMsg(null); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              category === 'COMPANION'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HeartHandshake className="w-4 h-4 mb-1" />
            <span>Acompañante</span>
          </button>

          <button
            type="button"
            onClick={() => { setCategory('INSTITUTION'); setErrorMsg(null); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              category === 'INSTITUTION'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 mb-1" />
            <span>B2B / Empresa</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">
              {category === 'INSTITUTION' ? 'Correo institucional *' : 'Correo electrónico *'}
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-bold block">Contraseña *</label>
              <Link href="#" className="text-[11px] text-emerald-400 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
          >
            <span>
              {loading 
                ? 'Verificando credenciales...' 
                : category === 'CLIENT'
                ? 'Ingresar como Cliente'
                : category === 'COMPANION'
                ? 'Ingresar como Acompañante'
                : 'Ingresar Portal B2B'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-2 pt-4 border-t border-slate-800/80 text-center text-xs">
          {category === 'CLIENT' && (
            <p className="text-slate-400">
              ¿No tienes cuenta de cliente?{' '}
              <Link href="/register" className="text-emerald-400 font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          )}

          {category === 'COMPANION' && (
            <p className="text-slate-400">
              ¿Aún no eres acompañante acreditado?{' '}
              <Link href="/register" className="text-emerald-400 font-bold hover:underline">
                Postularme ahora
              </Link>
            </p>
          )}

          {category === 'INSTITUTION' && (
            <p className="text-slate-400">
              ¿Nueva institución o empresa?{' '}
              <Link href="/register-b2b" className="text-emerald-400 font-bold hover:underline">
                Registrar Convenio B2B
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Acceso seguro cifrado SSL 256-bit • JUNTOS ASISTENCIA RD</span>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-slate-400 text-xs">Cargando acceso...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}