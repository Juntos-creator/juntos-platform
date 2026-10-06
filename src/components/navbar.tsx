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

  const dashboardHref = isAdmin 
    ? '/admin/mesa-operaciones' 
    : isCompanion 
    ? '/companion/dashboard' 
    : '/services/live';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Logo size="sm" variant="dark" href="/" />

        {/* ACCIONES Y MENÚS */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <>
              {/* BOTÓN INICIO (Visible siempre en móvil y PC) */}
              <Link
                href="/"
                className="text-slate-200 hover:text-white bg-slate-900 border border-slate-800 font-bold text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Inicio</span>
              </Link>

              {/* BOTÓN PANEL / DESPACHO */}
              <Link
                href={dashboardHref}
                className="text-slate-200 hover:text-white bg-slate-900 border border-slate-800 font-bold text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isCompanion ? 'Despacho' : 'Mi Sala'}</span>
              </Link>

              {/* PERFIL */}
              <Link
                href="/profile"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition flex items-center gap-1 shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Perfil</span>
              </Link>

              {/* SALIR */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}