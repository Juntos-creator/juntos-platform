'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  User, 
  HeartHandshake, 
  ShieldCheck, 
  LogOut,
  Radio,
  SlidersHorizontal
} from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const adminCheck = 
          user.email?.toLowerCase() === 'odel_kiss@hotmail.com' ||
          user.user_metadata?.role === 'ADMIN';
        setIsAdmin(adminCheck);
      }
    }
    checkUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Logo size="md" variant="dark" href="/" />

        {/* ACCIONES Y MENÚS */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* BOTONES EXCLUSIVOS DEL ADMINISTRADOR (Sin perfil especial) */}
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-emerald-500/30 p-1 rounded-xl">
                  <Link
                    href="/admin/mesa-operaciones"
                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-black text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Mesa Admin</span>
                  </Link>

                  <Link
                    href="/companion"
                    className="text-slate-300 hover:text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver como Acompañante</span>
                  </Link>
                </div>
              )}

              {/* PERFIL SOLICITANTE */}
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
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Iniciar sesión
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}