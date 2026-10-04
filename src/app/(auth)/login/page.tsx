'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  HeartHandshake, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<'CLIENT' | 'COMPANION'>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // 1. Limpieza de correo obligatoria en minúsculas
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (error) {
        // Mostrar mensaje exacto si falta confirmación de correo
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Tu correo aún no está confirmado. Ve a Supabase > Authentication > Users y confirma el usuario, o desactiva "Confirm email" en Providers.');
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Contraseña incorrecta o correo no registrado.');
        } else {
          throw new Error(error.message);
        }
      }

      if (data?.user) {
        const userEmail = data.user.email?.toLowerCase();
        const userRole = data.user.user_metadata?.role;

        // Redirección por tipo de usuario
        if (userEmail === 'odel_kiss@hotmail.com' || userRole === 'ADMIN') {
          router.push('/admin/operations');
          return;
        }

        if (role === 'COMPANION' || userRole === 'COMPANION') {
          router.push('/companion');
        } else {
          router.push('/services/new');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      
      {/* BRANDING CABECERA */}
      <div className="flex flex-col items-center mb-6 text-center space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            J
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            JUNTOS
          </span>
          <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded">
            ASISTENCIA RD
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Plataforma de Acompañamiento y Asistencia No Clínica
        </p>
      </div>

      {/* TARJETA DE ACCESO */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-white">Acceso a la Plataforma</h1>
          <p className="text-xs text-slate-400">Selecciona tu categoría de usuario</p>
        </div>

        {/* SELECTOR DE 2 COLUMNAS */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setRole('CLIENT'); setErrorMsg(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              role === 'CLIENT'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('COMPANION'); setErrorMsg(null); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              role === 'COMPANION'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Acompañante</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">Correo electrónico *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-300">Contraseña *</label>
              <span className="text-[11px] text-emerald-400 cursor-pointer hover:underline">
                ¿Olvidaste tu contraseña?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 mt-2"
          >
            <span>
              {loading 
                ? 'Validando credenciales...' 
                : role === 'CLIENT' 
                ? 'Ingresar como Cliente' 
                : 'Ingresar como Acompañante'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            {role === 'CLIENT' ? '¿No tienes cuenta de cliente? ' : '¿Deseas postularte como acompañante? '}
            <Link 
              href={role === 'CLIENT' ? '/register' : '/companion/register'} 
              className="text-emerald-400 font-bold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Acceso seguro cifrado SSL 256-bit • JUNTOS ASISTENCIA RD</span>
      </div>

    </div>
  );
}