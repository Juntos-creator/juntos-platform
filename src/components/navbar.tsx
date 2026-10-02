'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { User } from 'lucide-react';

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
        
        {/* Logo (Actúa como botón de Inicio para todos) */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo withText className="[&_span]:text-white" />
        </Link>

        {/* Navegación dinámica por rol */}
        {!loading && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            
            {/* VISTA B2C y ACOMPAÑANTE: 
                Queda completamente limpia. 
                El logo los lleva al inicio y el Checkout les da la opción de nuevo servicio. */}

            {/* Vista Institución B2B (Solo ven sus herramientas de gestión) */}
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

            {/* Vista Administrador Interno (Ven el sistema completo) */}
            {role === 'ADMIN' && (
              <>
                <Link href="/services/new" className="hover:text-juntos-green transition-colors">
                  Solicitar servicio
                </Link>
                <Link href="/admin/institutions" className="hover:text-juntos-green transition-colors">
                  CRM B2B
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
              </>
            )}
          </nav>
        )}

        {/* Acceso exclusivo a Perfil */}
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