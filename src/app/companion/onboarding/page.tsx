'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { CheckCircle2, Clock, ArrowRight, RefreshCw } from 'lucide-react';

export default function CompanionOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace('/login');
          return;
        }

        const { data: application, error: applicationError } = await supabase
          .from('companion_applications')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (applicationError) throw applicationError;

        if (application) {
          router.replace('/companion/dashboard');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const role = String(profile?.role ?? '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();

        if (role.includes('COMPANION') || role.includes('ACOMPANANTE')) {
          router.replace('/companion/dashboard');
          return;
        }

        if (active) setLoading(false);
      } catch (err) {
        console.error('Error verificando el perfil de acompañante:', err);
        if (active) {
          setError(
            'No se pudo verificar tu perfil. Inténtalo de nuevo; no vuelvas a registrarte mientras tanto.'
          );
          setLoading(false);
        }
      }
    }

    void checkStatus();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase">
          Verificando expediente laboral...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-16 w-full text-center">
          <div className="rounded-3xl border border-rose-900 bg-slate-900 p-8">
            <p className="text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950"
            >
              Volver a intentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-16 w-full text-center space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">
              Expediente Recibido Correctamente
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus datos ya están registrados en la Red de Acompañantes de JUNTOS Asistencia RD.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Estado: Depuración y Acreditación en Curso</span>
            </div>
            <p className="text-[11px] text-slate-400">
              No necesitas llenar ningún formulario repetido. Puedes ingresar a tu panel de trabajo.
            </p>
          </div>

          <Link
            href="/companion/dashboard"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <span>Ir a Mi Panel de Trabajo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}