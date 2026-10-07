'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import RegistroAcompanante from '@/app/(auth)/register/RegistroAcompanante';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function CompanionRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Fondo degradado corporativo */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl space-y-5 my-8">
        
        {/* Cabecera y botón para volver */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al inicio</span>
          </Link>

          <Link
            href="/login"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition"
          >
            ¿Ya tienes cuenta? Ingresar
          </Link>
        </div>

        {/* Logo corporativo centrado */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo size="lg" variant="dark" href="/" />
          <p className="text-xs text-slate-400 font-medium">
            Red de Asistencia No Clínica • Postulación Oficial de Acompañantes
          </p>
        </div>

        {/* Tarjeta principal con el expediente KYC de 4 fases */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <RegistroAcompanante />
        </div>

        {/* Pie legal */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Datos confidenciales y protegidos bajo la Ley 172-13 • JUNTOS ASISTENCIA RD</span>
        </div>

      </div>
    </div>
  );
}
