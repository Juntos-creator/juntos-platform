'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Cargar correo recordado en este dispositivo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('juntos_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  async function handleResetPassword() {
    setErrorMsg(null);
    setResetSuccess(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Por favor escribe tu correo electrónico arriba para enviarte el enlace de recuperación.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`
      });

      if (error) throw error;
      setResetSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo enviar el enlace de recuperación.');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResetSuccess(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Tu correo aún no está confirmado. Revisa tu bandeja de entrada.');
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Contraseña incorrecta o correo no registrado.');
        } else {
          throw new Error(error.message);
        }
      }

      if (data?.user) {
        // Guardar o limpiar correo en localStorage
        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('juntos_remember_email', cleanEmail);
          } else {
            localStorage.removeItem('juntos_remember_email');
          }
        }

        const user = data.user;
        const userEmail = user.email?.toLowerCase();

        // Consultar el rol real en la base de datos
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role;

        // 1. Administrador: super-usuario con acceso libre
        if (userEmail === 'odel_kiss@hotmail.com' || role === 'ADMIN') {
          window.location.href = '/admin/mesa-operaciones';
          return;
        }

        // 2. Personal Acompañante
        if (role === 'COMPANION' || role === 'ACOMPANANTE') {
          window.location.href = '/companion';
          return;
        }

        // 3. Cliente / Solicitante: verificar cita activa
        const { data: activeService } = await supabase
          .from('service_requests')
          .select('id')
          .eq('client_id', user.id)
          .in('status', ['PENDING', 'PENDING_DISPATCH', 'ASSIGNED', 'IN_PROGRESS'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeService) {
          window.location.href = `/services/live?id=${activeService.id}`;
        } else {
          window.location.href = '/profile';
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
      
      {/* BRANDING */}
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
          <h1 className="text-xl font-black text-white">Iniciar Sesión</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl leading-snug">
            ✓ Te enviamos un enlace de recuperación a tu correo. Revisa tu bandeja de entrada o spam.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">Correo electrónico *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
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
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
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

          {/* RECORDAR SESIÓN */}
          <div 
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center gap-2.5 pt-1 cursor-pointer select-none text-slate-300 hover:text-white transition"
          >
            {rememberMe ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-600" />
            )}
            <span className="text-xs font-medium">
              Recordar mi cuenta en este dispositivo
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Validando...' : 'Entrar a la Plataforma'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            ¿No tienes cuenta de cliente?{' '}
            <Link 
              href="/register" 
              className="text-emerald-400 font-bold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Conexión segura y cifrada • JUNTOS ASISTENCIA RD</span>
      </div>

    </div>
  );
}