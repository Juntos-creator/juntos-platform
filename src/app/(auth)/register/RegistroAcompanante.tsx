'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegistroAcompanante() {
  const router = useRouter();
  const [fase, setFase] = useState(1);
  const [loading, setLoading] = useState(false);

  const [datos, setDatos] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    experiencia: '',
    email: '',
    password: '',
  });
  const [firma, setFirma] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datos.email || !datos.password) {
      alert('Por favor ingresa tu correo y una contraseña para crear tu acceso.');
      return;
    }

    if (datos.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 1. Crear el usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
    });

    if (error) {
      alert(`Error al registrar cuenta: ${error.message}`);
      setLoading(false);
      return;
    }

    // 2. Guardar sus datos completos en la tabla profiles
    if (data.user) {
      await supabase.from('profiles').update({
        full_name: datos.nombre,
        phone: datos.telefono,
        role: 'COMPANION',
      }).eq('id', data.user.id);
    }

    setLoading(false);
    alert('Tu solicitud ha sido enviada con éxito. Será depurada en la PGR y te contactaremos pronto.');
    router.push('/companion/onboarding');
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 py-8 font-sans text-slate-900">
      <button 
        className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1 hover:text-slate-800 transition" 
        onClick={() => router.push('/')}
        type="button"
      >
        ‹ Volver a la portada
      </button>

      <h2 className="text-2xl font-black text-blue-950 mb-1">Únete a JUNTOS</h2>
      <p className="text-sm text-slate-600 mb-6 font-medium">Completa el proceso de verificación de 4 fases para ser acompañante oficial.</p>

      {/* Barra de progreso */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(num => (
          <div 
            key={num} 
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${fase >= num ? 'bg-blue-600' : 'bg-slate-200'}`} 
          />
        ))}
      </div>

      <form onSubmit={fase === 4 ? handleSubmit : (e) => { e.preventDefault(); setFase(fase + 1); }}>
        
        {/* FASE 1 */}
        {fase === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 1: Identidad Básica</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nombre Completo</label>
              <input 
                type="text" 
                required 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                placeholder="Ej: María Pérez" 
                value={datos.nombre} 
                onChange={e => setDatos({...datos, nombre: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cédula (Sin guiones)</label>
              <input 
                type="text" 
                required 
                maxLength={11} 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500" 
                placeholder="Ej: 00100000000" 
                value={datos.cedula} 
                onChange={e => setDatos({...datos, cedula: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Teléfono (WhatsApp)</label>
              <input 
                type="tel" 
                required 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500" 
                placeholder="Ej: 809-555-0000" 
                value={datos.telefono} 
                onChange={e => setDatos({...datos, telefono: e.target.value})} 
              />
            </div>
          </div>
        )}

        {/* FASE 2 */}
        {fase === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 2: Verificación de Seguridad</h3>
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 font-medium">
              ℹ️ Requisito obligatorio según la Ley 352-98 de Protección a la Persona Envejeciente en República Dominicana.
            </div>
            
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center bg-white cursor-pointer hover:bg-slate-50 transition">
              <span className="text-3xl block mb-2">📸</span>
              <p className="text-sm font-bold text-blue-700">Foto de Cédula (Frente y Dorso)</p>
              <p className="text-xs text-slate-500 mt-1">Obligatorio para depuración en la PGR</p>
            </div>
            
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center bg-white cursor-pointer hover:bg-slate-50 transition">
              <span className="text-3xl block mb-2">🎓</span>
              <p className="text-sm font-bold text-blue-700">Subir Certificados (Opcional)</p>
              <p className="text-xs text-slate-500 mt-1">Enfermería, RCP, o cuidado geriátrico</p>
            </div>
          </div>
        )}

        {/* FASE 3 */}
        {fase === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 3: Experiencia y Referencias</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Años de experiencia con adultos mayores</label>
              <select 
                required 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500" 
                value={datos.experiencia} 
                onChange={e => setDatos({...datos, experiencia: e.target.value})} 
              >
                <option value="">Selecciona una opción</option>
                <option value="0-1">Menos de 1 año</option>
                <option value="1-3">1 a 3 años</option>
                <option value="3-5">3 a 5 años</option>
                <option value="5+">Más de 5 años</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nombre Referencia Laboral</label>
              <input type="text" required className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500" placeholder="Nombre de tu contacto previo" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Teléfono de la Referencia</label>
              <input type="tel" required className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500" placeholder="Ej: 809-555-0000" />
            </div>
          </div>
        )}

        {/* FASE 4: Firma y creación de credenciales */}
        {fase === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 4: Firma y Creación de Cuenta</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Correo para acceder a la app</label>
                <input 
                  type="email" 
                  required 
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                  placeholder="tu-correo@ejemplo.com"
                  value={datos.email}
                  onChange={e => setDatos({...datos, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Crea una Contraseña (mínimo 6 caracteres)</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                  placeholder="••••••••"
                  value={datos.password}
                  onChange={e => setDatos({...datos, password: e.target.value})}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 text-justify leading-relaxed mt-2">
              Al firmar este documento, autorizas a <b>JUNTOS</b> a realizar la depuración de antecedentes penales en la PGR y validar tu identidad. Documento válido bajo la <b>Ley 126-02</b> y protegido por la Ley 172-13.
            </p>
            
            <div className="rounded-xl border-2 border-slate-200 bg-white p-4 h-40 flex flex-col items-center justify-center relative overflow-hidden">
              {!firma ? (
                <button 
                  type="button" 
                  onClick={() => setFirma(true)} 
                  className="rounded-full bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                >
                  ✍️ Toca aquí para firmar digitalmente
                </button>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-3xl italic text-blue-950 font-serif border-b-2 border-slate-800 px-6 py-2 mb-1">
                    {datos.nombre || 'Firma Generada'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {datos.cedula || '---'} | FECHA: {new Date().toLocaleDateString()}</span>
                  <button 
                    type="button" 
                    onClick={() => setFirma(false)} 
                    className="text-xs text-red-500 mt-1 absolute bottom-2 right-4 font-bold underline"
                  >
                    Borrar firma
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="mt-8 flex gap-3">
          {fase > 1 && (
            <button 
              type="button" 
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition" 
              onClick={() => setFase(fase - 1)}
            >
              Atrás
            </button>
          )}
          <button 
            type="submit" 
            className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md transition ${fase === 4 && (!firma || loading) ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} 
            disabled={fase === 4 && (!firma || loading)}
          >
            {loading ? 'Creando cuenta...' : fase === 4 ? 'Firmar y Registrarme' : 'Siguiente Fase'}
          </button>
        </div>
      </form>
    </div>
  );
}