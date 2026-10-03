'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { User, Radio, Briefcase, PlusCircle, LogIn } from 'lucide-react';

export function Navbar() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setRole(profile.role);
        }
      }
      setLoading(false);
    }

    getUserData();

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="bg-juntos-blue text-white w-full shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo principal */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo withText className="[&_span]:text-white" />
        </Link>

        {/* Navegación dinámica unificada */}
        {!loading && (
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            
            {/* 1. ACCESO UNIVERSAL: TODO USUARIO PUEDE SOLICITAR SERVICIO (B2C) */}
            <Link 
              href="/services/new" 
              className="flex items-center gap-1.5 bg-blue-600/70 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl transition font-semibold"
            >
              <PlusCircle className="w-4 h-4 text-blue-200" />
              <span>Solicitar Acompañante</span>
            </Link>

            {/* 2. SI ES ACOMPAÑANTE: Acceso a su panel laboral */}
            {(role === 'COMPANION' || role === 'ADMIN') && (
              <Link 
                href="/companion/dashboard" 
                className="flex items-center gap-1.5 text-slate-200 hover:text-emerald-300 transition-colors px-2 py-1"
              >
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Mi Panel de Trabajo</span>
              </Link>
            )}

            {/* 3. SI ES INSTITUCIÓN B2B */}
            {role === 'INSTITUTION' && (
              <>
                <Link href="/admin/institutions" className="hover:text-juntos-green transition-colors">
                  Mi Panel Institucional
                </Link>
                <Link href="/services/new?type=institution" className="hover:text-juntos-green transition-colors">
                  Solicitar para Paciente
                </Link>
              </>
            )}

            {/* 4. SI ES ADMINISTRADOR MAESTRO (Acceso total) */}
            {role === 'ADMIN' && (
              <>
                <Link href="/admin/institutions" className="hover:text-slate-300 text-xs">
                  CRM B2B
                </Link>
                <Link href="/admin/payments" className="hover:text-slate-300 text-xs">
                  Pagos
                </Link>
                <Link href="/admin/invoices" className="hover:text-slate-300 text-xs">
                  Facturas
                </Link>
                <Link href="/admin/audit" className="hover:text-slate-300 text-xs">
                  Auditoría
                </Link>

                {/* Mesa de Operaciones Central */}
                <Link 
                  href="/admin/mesa-operaciones" 
                  className="flex items-center gap-1.5 bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Radio className="w-3.5 h-3.5" />
                  <span>Mesa de Operaciones</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Acceso a Perfil o Inicio de Sesión Único */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-sm font-medium text-white hover:text-juntos-green transition-colors bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
            >
              <User className="h-4 w-4" />
              <span>Mi Cuenta</span>
              {role === 'COMPANION' && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded ml-1">
                  PRO
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Ingresar</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}