'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  href?: string;
}

export function Logo({ size = 'md', variant = 'dark', href = '/' }: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6 text-xs rounded-md',
    md: 'w-8 h-8 text-base rounded-xl',
    lg: 'w-10 h-10 text-lg rounded-2xl'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const isLight = variant === 'light';

  const content = (
    <div className="flex items-center gap-2.5 select-none transition-transform active:scale-95">
      {/* Isotipo Esmeralda */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 shadow-md shadow-emerald-500/20`}
      >
        J
      </div>
      
      {/* Tipografía Corporativa No Clínica */}
      <div className="flex items-center gap-1.5">
        <span
          className={`font-black tracking-tight ${textSizes[size]} ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          JUNTOS
        </span>
        <span
          className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border ${
            isLight
              ? 'bg-slate-100 text-slate-600 border-slate-300'
              : 'bg-slate-800/80 text-emerald-400 border-slate-700'
          }`}
        >
          ASISTENCIA RD
        </span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}