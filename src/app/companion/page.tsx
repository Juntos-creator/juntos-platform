'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  HeartHandshake, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  UserCheck
} from 'lucide-react';

export default function CompanionDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
        Cargando portal de acompañante...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-600/40 px-3 py-1 rounded-full text-emerald-400 text-xs font-bold mb-2">
              <UserCheck className="w-3.5 h-3.5" /> Acompañante Acreditado
            </div>
            <h1 className="text-3xl font-black text-white">Panel de Acompañante</h1>
            <p className="text-xs text-slate-400 mt-1">
              Servicios asignados y coordinación no clínica en tiempo real
            </p>
          </div>

          <Link
            href="/profile"
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition"
          >
            Ver Mi Expediente
          </Link>
        </div>

        {/* ESTADO DE SERVICIOS */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Sin asignaciones en curso</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            La Mesa de Operaciones te asignará servicios según tu zona de cobertura y disponibilidad confirmada.
          </p>
        </div>

      </main>
    </div>
  );
}