'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldAlert, 
  Home, 
  CalendarPlus, 
  HeartHandshake, 
  Building2, 
  UserCircle, 
  Layers, 
  Activity, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function AdminQuickNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isMasterEmail = user.email === 'odel_kiss@hotmail.com';

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (isMasterEmail || profile?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      } catch (err) {
        console.warn('Error verificando admin:', err);
      }
    }

    verifyAdmin();
  }, [supabase]);

  if (!isAdmin) return null;

  const links = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/services/new', label: 'Wizard Solicitud', icon: CalendarPlus },
    { href: '/companion', label: 'Portal Acompañante', icon: HeartHandshake },
    { href: '/profile', label: 'Mesa / Perfil Central', icon: Activity },
    { href: '/register-b2b', label: 'Convenios B2B', icon: Building2 },
    { href: '/register', label: 'Registro', icon: UserCircle },
    { href: '/login', label: 'Acceso', icon: Layers },
  ];

  return (
    <aside 
      aria-label="Panel de navegación rápida de Administrador"
      className="fixed left-3 top-1/2 -translate-y-1/2 z-[9999] transition-all duration-300"
    >
      <div className="bg-slate-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-xl p-2 flex flex-col items-center gap-1.5">
        
        {/* Cabecera / Botón para colapsar */}
        <div className="w-full flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-1 gap-1">
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-emerald-400 font-mono text-[10px] font-black">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            {!collapsed && <span className="tracking-widest">ADMIN</span>}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir barra' : 'Minimizar barra'}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Lista Vertical de Enlaces */}
        <nav className="flex flex-col gap-1 w-full text-xs font-semibold">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                  active 
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/25' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap text-[11px] pr-2">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Cerrar Sesión */}
        <div className="w-full pt-1.5 border-t border-slate-800/80 mt-1">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            title="Cerrar sesión"
            className="w-full flex items-center gap-2 px-2.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition text-[11px] font-bold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Salir</span>}
          </button>
        </div>

      </div>
    </aside>
  );
}