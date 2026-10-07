'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';

function normalizeRole(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('juntos_remember_email');

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Elimina cualquier contraseña guardada por versiones anteriores.
    localStorage.removeItem('juntos_remember_password');
  }, []);

  async function handleResetPassword() {
    setErrorMsg(null);
    setResetSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg(
        'Escribe tu correo electrónico para enviarte el enlace de recuperación.'
      );
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });

      if (error) throw error;
      setResetSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el enlace de recuperación.'
      );
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResetSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const message = error.message.toLowerCase();

        if (message.includes('email not confirmed')) {
          throw new Error(
            'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.'
          );
        }

        if (message.includes('invalid login credentials')) {
          throw new Error('Contraseña incorrecta o correo no registrado.');
        }

        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error('No se pudo identificar la cuenta.');
      }

      // Recordar solo el correo; nunca guardar la contraseña en el navegador.
      localStorage.removeItem('juntos_remember_password');

      if (rememberMe) {
        localStorage.setItem('juntos_remember_email', cleanEmail);
      } else {
        localStorage.removeItem('juntos_remember_email');
      }

      const userEmail = user.email?.toLowerCase();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('No se pudo verificar tu perfil. Inténtalo de nuevo.');
      }

      const role = normalizeRole(
        profile?.role ?? user.user_metadata?.role
      );

      if (userEmail === 'odel_kiss@hotmail.com' || role.includes('ADMIN')) {
        window.location.assign('/admin/operations');
        return;
      }

      const isCompanionRole =
        role.includes('COMPANION') || role.includes('ACOMPANANTE');

      if (isCompanionRole) {
        window.location.assign('/companion/dashboard');
        return;
      }

      // Si el perfil no tiene el rol, comprueba si existe una solicitud
      // asociada a esta cuenta para no enviarla al flujo de cliente.
      const { data: application, error: applicationError } = await supabase
        .from('companion_applications')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (applicationError) {
        throw new Error(
          'No se pudo verificar tu solicitud de acompañante. Inténtalo de nuevo.'
        );
      }

      if (application) {
        window.location.assign('/companion/dashboard');
        return;
      }

      const { data: activeService, error: serviceError } = await supabase
        .from('service_requests')
        .select('id')
        .eq('client_id', user.id)
        .in('status', [
          'PENDING',
          'PENDING_DISPATCH',
          'ASSIGNED',
          'IN_PROGRESS',
        ])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (serviceError) {
        throw new Error('No se pudo consultar tu servicio activo.');
      }

      if (activeService) {
        window.location.assign(`/services/live?id=${activeService.id}`);
      } else {
        window.location.assign('/profile');
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error al iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
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

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-white">Iniciar Sesión</h1>
          <p className="text-xs text-slate-400">
            Ingresa tus credenciales para acceder a tu cuenta
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl leading-snug">
            ✓ Te enviamos un enlace de recuperación. Revisa tu correo o spam.
          </div>
        )}

        <form
          onSubmit={handleLogin}
          method="post"
          autoComplete="on"
          className="space-y-4 text-xs"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="font-bold text-slate-300 block">
              Correo electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="font-bold text-slate-300">
                Contraseña *
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none text-slate-300 hover:text-white transition">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="sr-only"
            />
            {rememberMe ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-600" />
            )}
            <span className="text-xs font-medium">
              Recordar correo en este dispositivo
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 mt-2"
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