'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  HeartHandshake, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

export default function CompanionRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cedula, setCedula] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanConfirmEmail = confirmEmail.trim().toLowerCase();

    if (cleanEmail !== cleanConfirmEmail) {
      setErrorMsg('Los correos electrónicos no coinciden.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Crear el usuario en Auth fijando en su metadata el rol COMPANION
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: 'COMPANION' // ROL OFICIAL LABORAL
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Insertar o actualizar su perfil con rol COMPANION estricto
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: cleanEmail,
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: 'COMPANION', // Enum estricto en Supabase
            cedula: cedula.trim() || null
          });

        if (profileError) {
          console.error('Error al guardar perfil laboral:', profileError.message);
        }

        // Redirigir al panel del acompañante
        window.location.href = '/companion/dashboard';
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la postulación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 py-12 selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* BRANDING */}
      <div className="flex flex-col items-center mb-6 text-center space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
            A
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            JUNTOS
          </span>
          <span className="text-[10px] font-mono bg-amber-950 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded">
            PORTAL RRHH
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Postulación y Registro de Acompañantes Asistenciales No Clínicos
        </p>
      </div>

      {/* TARJETA EXCLUSIVA DE ACOMPAÑANTE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-bold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Expediente de Personal Acompañante</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Únete a la Red de Acompañantes
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Regístrate para brindar soporte presencial, compañía y traslado seguro en Santo Domingo y Santiago.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Nombre completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Carmen Gómez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Teléfono / WhatsApp *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="Ej: 809-555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">Cédula de Identidad *</label>
            <div className="relative">
              <FileCheck2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="402-XXXXXXX-X"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Correo electrónico *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Confirmar correo *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="Repite tu correo"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Contraseña *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Confirmar contraseña *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acreditación Obligatoria</span>
            </div>
            <p>
              Toda postulación pasa por depuración de antecedentes y validación de identidad antes de ser habilitada para recibir asignaciones remuneradas.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Registrando expediente...' : 'Completar Postulación como Acompañante'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
          <p>
            ¿Ya estás acreditado?{' '}
            <Link href="/login" className="text-amber-400 font-bold hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
          <p className="text-[11px] text-slate-500">
            ¿Buscas solicitar un acompañante?{' '}
            <Link href="/register" className="text-emerald-400 font-bold hover:underline">
              Registro para Familias / Solicitantes &rarr;
            </Link>
          </p>
        </div>

      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span>Registro de Personal Laboral Acreditado • JUNTOS RD</span>
      </div>

    </div>
  );
}