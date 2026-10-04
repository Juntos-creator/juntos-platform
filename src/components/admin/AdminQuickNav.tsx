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
  LogOut 
} from 'lucide-react';

export function AdminQuickNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

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
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-[95vw] sm:max-w-4xl"
    >
      <div className="bg-slate-950/95 border border-emerald-500/60 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-[11px] font-black shrink-0">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">MODO ADMIN</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-1 text-[11px] font-bold">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${
                  active 
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          title="Cerrar sesión"
          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition shrink-0 ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}