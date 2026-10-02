'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const router = useRouter();
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/'); // Redirige a la página principal oficial, NO a /login
    router.refresh();
  }

  return (
    <header className="bg-juntos-blue text-white w-full">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Clic en el logo regresa al inicio manteniendo tu sesión */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo withText className="[&_span]:text-white" />
        </Link>

        {!loading && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-juntos-green transition-colors">
              Inicio
            </Link>

            {/* VISTA B2C (SOLICITANTE) o ACOMPAÑANTE */}
            {(role === 'CUSTOMER' || role === 'COMPANION') && (
              <Link href="/services/new" className="hover:text-juntos-green transition-colors">
                Solicitar servicio
              </Link>
            )}

            {/* VISTA B2B (INSTITUCIÓN) */}
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

            {/* VISTA ADMINISTRADOR INTERNO */}
            {role === 'ADMIN' && (
              <>
                <Link href="/services/new" className="hover:text-juntos-green transition-colors">Solicitar servicio</Link>
                <Link href="/admin/institutions" className="hover:text-juntos-green transition-colors">CRM B2B</Link>
                <Link href="/admin/payments" className="hover:text-juntos-green transition-colors">Pagos</Link>
                <Link href="/admin/invoices" className="hover:text-juntos-green transition-colors">Facturas</Link>
                <Link href="/admin/audit" className="hover:text-juntos-green transition-colors">Auditoría</Link>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Cerrar sesión
          </Button>
        </div>
        
      </div>
    </header>
  );
}