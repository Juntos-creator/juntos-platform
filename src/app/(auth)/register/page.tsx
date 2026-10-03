'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  FileText, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  HeartHandshake, 
  AlertCircle,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';

export default function CompanionRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [zone, setZone] = useState('Santo Domingo');
  const [experience, setExperience] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    // 1. Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'COMPANION',
        },
      },
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Registro en tabla profiles con rol COMPANION y estado pendiente de depuración
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: 'COMPANION',
        status: 'PENDING_APPROVAL',
      });

      // 3. Crear solicitud en companion_applications para la Mesa de Operaciones
      await supabase.from('companion_applications').insert([{
        user_id: authData.user.id,
        nombre: fullName.trim(),
        telefono: phone.trim(),
        numero_documento: cedula.trim(),
        domicilio_direccion: zone,
        notas_experiencia: experience,
        estado: 'PENDIENTE_REVISION',
        estado_depuracion: 'EN_PROCESO'
      }]);

      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* DEGRADADO Y EFECTO DE LUZ CORPORATIVA */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CONTENEDOR CENTRAL */}
      <div className="relative z-10 w-full max-w-xl space-y-6 my-8">
        
        {/* LOGO ENCABEZADO */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo size="lg" variant="dark" href="/" />
          <p className="text-xs text-slate-400 font-medium">
            Red de Asistencia Personal y Acompañamiento No Clínico 24/7
          </p>
        </div>

        {/* TARJETA PRINCIPAL */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
          
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">¡Postulación Recibida!</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Tu expediente ha sido enviado a la <strong>Mesa de Operaciones Central</strong> para validación KYC y antecedentes con la Procuraduría General (PGR). Nos pondremos en contacto contigo vía WhatsApp o llamada telefónica.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs shadow-lg transition"
                >
                  Ir al inicio de sesión <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-center">
                <div className="inline-flex items-center gap-1.5 bg-blue-950/60 border border-blue-800/60 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase mb-1">
                  <HeartHandshake className="w-3.5 h-3.5" /> Equipo Operativo JUNTOS
                </div>
                <h1 className="text-2xl font-black text-white">Postularme como Acompañante</h1>
                <p className="text-xs text-slate-400">
                  Brinda asistencia personal y compañía de calidad a familias dominicanas
                </p>
              </div>

              {/* NOTA DE SERVICIO NO CLÍNICO */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Servicio No Clínico:</strong> El rol consiste en soporte logístico, movilidad asistida y compañía en salas de espera o domicilio. No requiere labores médicas ni de enfermería invasiva.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                
                {/* NOMBRE Y CÉDULA */}
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
                        placeholder="Ej. Carmen Rosario"
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

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
                </div>

                {/* CORREO Y TELÉFONO */}
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
                        placeholder="carmen@correo.com"
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

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
                </div>

                {/* ZONA DE COBERTURA */}
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

                {/* EXPERIENCIA PREVIA */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Experiencia previa en asistencia o trato con adultos mayores</label>
                  <textarea
                    rows={2}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Describe brevemente tu vocación de servicio, paciencia y experiencia previa..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>

                {/* CONTRASEÑA Y CONFIRMACIÓN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Contraseña para tu cuenta *</label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Confirmar contraseña *</label>
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

                {/* BOTÓN ENVIAR POSTULACIÓN */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-4"
                >
                  <span>{loading ? 'Enviando postulación...' : 'Enviar mi postulación'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* ENLACES A LOGIN */}
              <div className="pt-3 border-t border-slate-800/80 text-center text-xs">
                <p className="text-slate-400">
                  ¿Ya estás registrado como acompañante?{' '}
                  <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </>
          )}

        </div>

        {/* PIE DISCRETO */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Postulación sujeta a depuración de antecedentes penales conforme a leyes de la República Dominicana</span>
        </div>

      </div>
    </div>
  );
}