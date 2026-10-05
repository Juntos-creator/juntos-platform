'use client';

import { Navbar } from '@/components/navbar';
import RegistroAcompanante from '@/app/(auth)/register/RegistroAcompanante';
import { ShieldCheck } from 'lucide-react';

export default function CompanionKycPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8 w-full">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <RegistroAcompanante />
        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 mt-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Datos confidenciales y protegidos bajo Ley 172-13 • JUNTOS ASISTENCIA RD</span>
        </div>
      </main>
    </div>
  );
}