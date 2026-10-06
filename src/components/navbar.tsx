'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  User, 
  HeartHandshake, 
  LogOut,
  SlidersHorizontal,
  Home,
  Compass
} from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser(sessionUser?: any) {
      const activeUser = sessionUser || (await supabase.auth.getUser()).data.user;
      
      if (activeUser) {
        setUser(activeUser);
        
        // Obtener rol desde la base de datos
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', activeUser.id)
          .maybeSingle();

        const role = profile?.role || activeUser.user_metadata?.role || 'CLIENT';
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    }

    checkUser();

    // Escuchar cambios de sesión en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    router.push('/login');
    router.refresh();
  }

  const isAdmin = userRole === 'ADMIN' || user?.email?.toLowerCase() === 'odel_kiss@hotmail.com';
  const isCompanion = ['COMPANION', 'ACOMPANANTE'].includes(userRole || '');

  // Ruta del panel según el rol activo
  const dashboardHref = isAdmin 
    ? '/admin/mesa-operaciones' 
    : isCompanion 
    ? '/companion/dashboard' 
    : '/services/live';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Logo size="md" variant="dark" href="/" />

        {/* ACCIONES Y MENÚS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* BOTÓN INICIO */}
              <Link
                href="/"
                className="text-slate-300 hover:text-white hover:bg-slate-900 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>

              {/* BOTÓN AL PANEL / SALA OPERATIVA */}
              <Link
                href={dashboardHref}
                className="text-slate-300 hover:text-white hover:bg-slate-900 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {isAdmin ? 'Mesa Operativa' : isCompanion ? 'Mi Despacho' : 'Mi Asistencia'}
                </span>
              </Link>

              {/* OPCIONES EXCLUSIVAS PARA ADMINISTRADOR */}
              {isAdmin && (
                <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-emerald-500/30 p-1 rounded-xl">
                  <Link
                    href="/companion/dashboard"
                    className="text-slate-300 hover:text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vista Acompañante</span>
                  </Link>
                </div>
              )}

              {/* MI PERFIL */}
              <Link
                href="/profile"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mi Perfil</span>
              </Link>

              {/* CERRAR SESIÓN */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}