'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { User, Radio } from 'lucide-react';

export function Navbar() {
  const supabase = createClient();

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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

    getUserRole();
  }, [supabase]);

  return (
    <header className="bg-juntos-blue text-white w-full">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo principal */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo withText className="[&_span]:text-white" />
        </Link>

        {/* Navegación dinámica por rol */}
        {!loading && (
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            
            {/* 1. Vista Acompañante */}
            {role === 'COMPANION' && (
              <Link href="/companion/dashboard" className="hover:text-juntos-green transition-colors">
                Mi Panel de Trabajo
              </Link>
            )}

            {/* 2. Vista Institución B2B */}
            {role === 'INSTITUTION' && (
              <>
                <Link href="/admin/institutions" className="hover:text-juntos-green transition-colors">
                  Mi Panel de Control
                </Link>
                <Link href="/services/new?type=institution" className="hover:text-juntos-green transition-colors">
                  Solicitar para Paciente
                </Link>
              </>
            )}

            {/* 3. Vista Administrador Maestro (Acceso a todos los módulos) */}
            {role === 'ADMIN' && (
              <>
                <Link href="/services/new" className="hover:text-juntos-green transition-colors">
                  Solicitar (B2C)
                </Link>
                <Link href="/admin/institutions" className="hover:text-juntos-green transition-colors">
                  CRM B2B
                </Link>
                <Link href="/companion/dashboard" className="hover:text-juntos-green transition-colors">
                  Panel Acompañantes
                </Link>
                <Link href="/admin/payments" className="hover:text-juntos-green transition-colors">
                  Pagos
                </Link>
                <Link href="/admin/invoices" className="hover:text-juntos-green transition-colors">
                  Facturas
                </Link>
                <Link href="/admin/audit" className="hover:text-juntos-green transition-colors">
                  Auditoría
                </Link>

                {/* BOTÓN MESA DE OPERACIONES CENTRAL */}
                <Link 
                  href="/admin/mesa-operaciones" 
                  className="flex items-center gap-1.5 bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 hover:text-emerald-300 px-3 py-1.5 rounded-xl font-bold transition shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Radio className="w-3.5 h-3.5" />
                  <span>Mesa de Operaciones</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Acceso a Perfil */}
        <div className="flex items-center">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-sm font-medium text-white hover:text-juntos-green transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Mi Perfil</span>
          </Link>
        </div>

      </div>
    </header>
  );
}