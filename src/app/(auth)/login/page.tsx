'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos.' 
        : error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Consultar rol para redirigir adecuadamente
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'ADMIN' || data.user.email === 'odel_kiss@hotmail.com') {
        router.push('/profile');
      } else if (profile?.role === 'COMPANION') {
        router.push('/companion');
      } else {
        router.push('/');
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* DEGRADADO Y EFECTO DE LUZ CORPORATIVA */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CONTENEDOR CENTRAL */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* LOGO ENCABEZADO */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo size="lg" variant="dark" href="/" />
          <p className="text-xs text-slate-400 font-medium">
            Plataforma de Acompañamiento y Asistencia No Clínica
          </p>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-white">Iniciar sesión</h1>
            <p className="text-xs text-slate-400">Ingresa a tu cuenta de JUNTOS</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* CORREO */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Correo electrónico</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold block">Contraseña</label>
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

            {/* BOTÓN DE ACCIÓN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Verificando...' : 'Iniciar sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* ENLACES SECUNDARIOS */}
          <div className="space-y-2 pt-4 border-t border-slate-800/80 text-center text-xs">
            <p className="text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-emerald-400 font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
            <p className="text-slate-500">
              ¿Eres una institución?{' '}
              <Link href="/register-b2b" className="text-teal-400 font-semibold hover:underline">
                Portal B2B
              </Link>
            </p>
          </div>
        </div>

        {/* PIE DISCRETO */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Conexión segura cifrada SSL 256-bit</span>
        </div>

      </div>
    </div>
  );
}