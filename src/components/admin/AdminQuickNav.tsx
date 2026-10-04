'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Home, 
  CalendarPlus, 
  HeartHandshake, 
  Radio, 
  Receipt, 
  LogOut, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export function AdminQuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function checkAdminSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }

      const user = session.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const tienePrivilegio = 
        profile?.role === 'ADMIN' || 
        user.user_metadata?.role === 'ADMIN' || 
        user.email?.toLowerCase() === 'odel_kiss@hotmail.com';

      setIsAdmin(!!tienePrivilegio);
    }

    checkAdminSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsAdmin(false);
      } else {
        const email = session.user.email?.toLowerCase();
        if (email === 'odel_kiss@hotmail.com' || session.user.user_metadata?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!isAdmin) {
    return null;
  }

  // Lista limpia y lógica sin el botón de Mesa / Perfil Central
  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/admin/operations', label: 'Mesa de Operaciones', icon: Radio },
    { href: '/services/new', label: 'Wizard Solicitud', icon: CalendarPlus },
    { href: '/companion', label: 'Portal Acompañante', icon: HeartHandshake },
    { href: '/services/checkout', label: 'Pasarela & NCF', icon: Receipt },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    router.push('/login');
  }

  return (
    <aside
      className={`fixed left-4 top-20 z-40 bg-slate-950/95 border border-slate-800 rounded-3xl p-3 shadow-2xl backdrop-blur-xl transition-all duration-300 font-sans print:hidden ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && (
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase truncate">
              ADMIN
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-500 hover:text-white p-1 rounded-lg transition"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="pt-2 mt-2 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
}