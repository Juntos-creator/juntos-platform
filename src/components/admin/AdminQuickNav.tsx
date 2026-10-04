'use client';

import { useState, useEffect, useRef } from 'react';
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
  X,
  GripHorizontal
} from 'lucide-react';

export function AdminQuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Posición flotante arrastrable
  const [pos, setPos] = useState({ x: 20, y: 100 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

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
      const email = session?.user?.email?.toLowerCase();
      setIsAdmin(email === 'odel_kiss@hotmail.com' || session?.user?.user_metadata?.role === 'ADMIN');
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Manejadores de arrastre
  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 240, e.clientX - dragOffset.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 350, e.clientY - dragOffset.current.y))
      });
    }

    function handleMouseUp() {
      isDragging.current = false;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isAdmin) return null;

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
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 select-none font-sans print:hidden"
    >
      {/* BOTÓN BURBUJA CUANDO ESTÁ CERRADO */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-950/90 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md transition hover:scale-105 active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-wide">ADMIN</span>
        </button>
      ) : (
        /* MENÚ FLOTANTE ABIERTO Y ARRASTRABLE */
        <div className="w-56 bg-slate-950/95 border border-slate-800 rounded-3xl p-3 shadow-2xl backdrop-blur-xl space-y-2">
          
          {/* BARRA SUPERIOR PARA ARRASTRAR */}
          <div 
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between px-2 py-1 border-b border-slate-800/80 cursor-move text-slate-400 hover:text-white"
            title="Arrastra para mover el menú"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ADMIN MOVILE
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* LISTA DE ENLACES */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* CERRAR SESIÓN */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Salir</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}