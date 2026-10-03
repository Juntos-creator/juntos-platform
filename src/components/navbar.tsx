'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO OFICIAL */}
        <Logo size="md" variant="dark" href="/" />

        {/* ACCESOS RÁPIDOS */}
        <div className="flex items-center gap-3">
          <Link
            href="/services/new"
            className="hidden sm:inline-flex bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition"
          >
            + Nueva Cita
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              pathname === '/profile'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4 text-emerald-400" />
            <span>Mi Perfil</span>
          </Link>
        </div>

      </div>
    </header>
  );
}