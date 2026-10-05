'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { CheckCircle2, Clock, ArrowRight, RefreshCw } from 'lucide-react';

export default function CompanionOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // 1. Si ya tiene postulación o perfil registrado, redirigir al panel
      const { data: app } = await supabase
        .from('companion_applications')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (app) {
        router.replace('/companion/dashboard');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'COMPANION') {
        router.replace('/companion/dashboard');
        return;
      }

      setLoading(false);
    }

    checkStatus();
  }, [router, supabase]);

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