'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  User, 
  HeartHandshake, 
  Mail, 
  Phone, 
  Lock, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

type RegisterCategory = 'CLIENT' | 'COMPANION';

export default function UnifiedRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [category, setCategory] = useState<RegisterCategory>('CLIENT');
  
  // Campos comunes
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Campos específicos de Acompañante
  const [cedula, setCedula] = useState('');
  const [zone, setZone] = useState('Distrito Nacional (Santo Domingo)');
  const [experience, setExperience] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
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

    const displayName = fullName.trim();
    const role = category === 'CLIENT' ? 'CLIENT' : 'COMPANION';

    // 1. Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: displayName,
          phone: phone.trim(),
          role: role,
        },
      },
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Registro en tabla profiles
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email.trim(),
        full_name: displayName,
        phone: phone.trim(),
        role: role,
        status: 'ACTIVE',
      });

      // 3. Autologin general para evitar reingreso de credenciales
      if (!authData.session) {
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      // 4. Inserción de expediente y redirección según rol
      if (category === 'COMPANION') {
        await supabase.from('companion_applications').insert([{
          user_id: authData.user.id,
          nombre: displayName,
          telefono: phone.trim(),
          numero_documento: cedula.trim(),
          domicilio_direccion: zone,
          notas_experiencia: experience,
          estado: 'PENDIENTE_REVISION',
          estado_depuracion: 'EN_PROCESO'
        }]);

        router.push('/companion');
        return;
      }

      // Rol Solicitante / Cliente
      router.push('/services/new');
      return;
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* DEGRADADO Y EFECTO DE LUZ CORPORATIVA */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CONTENEDOR CENTRAL */}
      <div className="relative z-10 w-full max-w-xl space-y-5 my-8">
        
        {/* LOGO ENCABEZADO */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo size="lg" variant="dark" href="/" />
          <p className="text-xs text-slate-400 font-medium">
            Plataforma de Acompañamiento y Asistencia No Clínica
          </p>
        </div>

        {/* TARJETA DE REGISTRO */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
            <p className="text-xs text-slate-400">Selecciona el tipo de registro que necesitas</p>
          </div>

          {/* 2 BOTONES DE SELECCIÓN (SOLICITANTE Y ACOMPAÑANTE) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => { setCategory('CLIENT'); setErrorMsg(null); }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                category === 'CLIENT'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4 mb-1" />
              <span>Solicitante</span>
            </button>

            <button
              type="button"
              onClick={() => { setCategory('COMPANION'); setErrorMsg(null); }}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                category === 'COMPANION'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HeartHandshake className="w-4 h-4 mb-1" />
              <span>Acompañante</span>
            </button>
          </div>

          {/* BADGE DE ORIENTACIÓN */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-[11px] text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {category === 'CLIENT' 
                ? 'Registro para coordinar asistencia no médica para ti o tus familiares.'
                : 'Postulación de acompañante con acceso inmediato y acreditación PGR.'}
            </span>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            
            {/* SECCIÓN 1: NOMBRE Y CÉDULA/TELÉFONO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Nombre completo *</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {category === 'COMPANION' ? (
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Cédula de Identidad *</label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="001-0000000-0"
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Teléfono / WhatsApp *</label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 809..."
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: CORREO Y TELÉFONO (CUANDO ES ACOMPAÑANTE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Correo electrónico *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {category === 'COMPANION' && (
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Teléfono / WhatsApp *</label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 809..."
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CAMPOS EXTRA SOLO PARA ACOMPAÑANTE */}
            {category === 'COMPANION' && (
              <>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Zona de disponibilidad principal *</label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="Distrito Nacional (Santo Domingo)">Distrito Nacional (Santo Domingo)</option>
                      <option value="Santo Domingo Este">Santo Domingo Este</option>
                      <option value="Santo Domingo Oeste">Santo Domingo Oeste</option>
                      <option value="Santo Domingo Norte">Santo Domingo Norte</option>
                      <option value="Santiago de los Caballeros">Santiago de los Caballeros</option>
                      <option value="Otras provincias">Otras provincias</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Experiencia en acompañamiento o trato con adultos mayores</label>
                  <textarea
                    rows={2}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Describe brevemente tu vocación de servicio, paciencia y experiencia..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>
              </>
            )}

            {/* CONTRASEÑA Y CONFIRMAR */}
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
                <label className="text-slate-300 font-bold block">Confirmar clave *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite contraseña"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* BOTÓN ENVIAR REGISTRO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-4"
            >
              <span>
                {loading 
                  ? 'Registrando...' 
                  : category === 'CLIENT'
                  ? 'Crear cuenta de Solicitante'
                  : 'Registrarme e Ingresar como Acompañante'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* YA TIENES CUENTA */}
          <div className="pt-3 border-t border-slate-800/80 text-center text-xs">
            <p className="text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* PIE DISCRETO */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Datos confidenciales y protegidos • JUNTOS ASISTENCIA RD</span>
        </div>

      </div>
    </div>
  );
}