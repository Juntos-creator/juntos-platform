'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function CompanionRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Campos del formulario
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('Santo Domingo / Distrito Nacional');
  const [experience, setExperience] = useState('EXPERIENCIA_BASICA');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Validación de coincidencia de correo electrónico
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setErrorMsg('Los correos electrónicos ingresados no coinciden.');
      return;
    }

    // Validación de coincidencia de contraseña
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Registro en Supabase Auth con metadatos de acompañante
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'COMPANION',
            phone: phone.trim()
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      if (userId) {
        // 2. Crear o actualizar perfil en la tabla profiles
        await supabase.from('profiles').upsert({
          id: userId,
          email: email.trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'COMPANION'
        });

        // 3. Crear solicitud de acreditación en companion_applications
        await supabase.from('companion_applications').insert([{
          user_id: userId,
          nombre: fullName.trim(),
          numero_documento: cedula.trim(),
          telefono: phone.trim(),
          correo: email.trim(),
          ciudad: city,
          estado: 'PENDIENTE',
          notas_rrhh: `Postulación web directa. Experiencia: ${experience}. Depuración PGR en proceso.`
        }]);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/companion');
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar el registro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-10 w-full">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* CABECERA */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1 rounded-full text-emerald-400 font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> POSTULACIÓN Y REGISTRO OFICIAL
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Únete a la Red de Acompañantes
            </h1>
            <p className="text-xs text-slate-400">
              JUNTOS Asistencia RD • Genera ingresos brindando acompañamiento a citas médicas y gestiones presenciales.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs p-4 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>¡Cuenta creada con éxito! Entrando a tu portal de asignación...</span>
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            
            {/* Nombre completo */}
            <div>
              <label className="font-bold text-slate-300 block mb-1">Nombre completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Carlos Manuel Rosario"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Cédula y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Cédula de Identidad *</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="001-0000000-0"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Teléfono / WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="809-541-2000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Ciudad y Perfil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Zona operativa *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Santo Domingo / Distrito Nacional">Santo Domingo (DN)</option>
                    <option value="Santo Domingo Este">Santo Domingo Este</option>
                    <option value="Santo Domingo Oeste / Norte">SD Oeste / Norte</option>
                    <option value="Santiago de los Caballeros">Santiago de los Caballeros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Perfil de Asistencia *</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-500"
                >
                  <option value="EXPERIENCIA_BASICA">Acompañamiento General</option>
                  <option value="ENFERMERIA_AUXILIAR">Auxiliar de Enfermería / Salud</option>
                  <option value="CUIDADO_MAYORES">Especialista en Adultos Mayores</option>
                </select>
              </div>
            </div>

            {/* Correo y Confirmación de Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Correo electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Confirmar correo electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Repite tu correo"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Contraseña y Confirmación de Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Contraseña de acceso *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Confirmar contraseña de acceso *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Aviso de verificación */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[10px] text-slate-400 space-y-1">
              <p>🛡️ <strong>Depuración de Seguridad:</strong> Tu cédula será verificada con el registro de antecedentes de la Procuraduría General de la República (PGR).</p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Procesando registro...' : 'Completar Registro y Postulación'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            ¿Ya tienes una cuenta de acompañante?{' '}
            <Link href="/login" className="text-emerald-400 font-bold hover:underline">
              Iniciar Sesión
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}