'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Phone 
} from 'lucide-react';

export default function RegisterB2BPage() {
  const router = useRouter();
  const supabase = createClient();

  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rnc, setRnc] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegisterB2B(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    // 1. Registro en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: institutionName.trim(),
          phone: phone.trim(),
          role: 'INSTITUTION',
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. Guardar en profiles
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email.trim(),
        full_name: institutionName.trim(),
        phone: phone.trim(),
        role: 'INSTITUTION',
        status: 'PENDING_APPROVAL',
      });

      // 3. Crear registro de institución
      await supabase.from('institutions').insert([{
        user_id: data.user.id,
        name: institutionName.trim(),
        rnc: rnc.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: 'PENDING_REVIEW'
      }]);

      // 4. AUTOLOGIN: Si no vino sesión activa por confirmación de email, forzar login inmediato
      if (!data.session) {
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      // Redirigir directamente al perfil institucional sin pasar por login
      router.push('/profile');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-5 my-8">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo size="lg" variant="dark" href="/" />
          <p className="text-xs text-slate-400 font-medium">
            Portal Institucional & Convenios B2B
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="space-y-1 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto mb-2">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white">Registro B2B</h1>
            <p className="text-xs text-slate-400">
              Crea tu cuenta institucional con ingreso automático
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegisterB2B} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Nombre de la Institución / Empresa *</label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Ej. Clínica San Rafael / Empresa RD"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">RNC Institucional</label>
              <div className="relative flex items-center">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  placeholder="Ej. 1-01-00000-0"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Correo electrónico institucional *</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@institucion.com"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Teléfono de contacto / Flota *</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="809-555-0000"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Contraseña *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Confirmar *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite clave"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-3"
            >
              <span>{loading ? 'Conectando cuenta B2B...' : 'Registrar e Ingresar al Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 text-center text-xs">
            <p className="text-slate-400">
              ¿Ya tienes cuenta institucional?{' '}
              <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Acceso para convenios corporativos y facturación NCF formal</span>
        </div>
      </div>
    </div>
  );
}