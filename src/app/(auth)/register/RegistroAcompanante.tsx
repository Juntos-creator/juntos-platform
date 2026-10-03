'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroAcompanante() {
  const router = useRouter();
  const [fase, setFase] = useState(1);
  const [datos, setDatos] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    experiencia: ''
  });
  const [firma, setFirma] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    alert('Tu solicitud ha sido enviada a la Mesa Operacional con éxito. Será depurada en la PGR y te contactaremos pronto.');
    router.push('/');
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

      <form onSubmit={fase === 4 ? handleSubmit : (e) => { e.preventDefault(); setFase(fase + 1) }}>
        
        {/* FASE 1 */}
        {fase === 1 && (
          <div className="space-y-4 animate-fade-in">
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
          <div className="space-y-4 animate-fade-in">
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
          <div className="space-y-4 animate-fade-in">
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

        {/* FASE 4 */}
        {fase === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 4: Firma Digital</h3>
            <p className="text-xs text-slate-600 text-justify leading-relaxed">
              Al firmar este documento, autorizas a <b>JUNTOS</b> a realizar la depuración de antecedentes penales en la PGR y validar tu identidad. Documento válido y vinculante bajo la <b>Ley 126-02</b> sobre Comercio Electrónico, Documentos y Firmas Digitales en RD, y protegido bajo la Ley 172-13 de Protección de Datos.
            </p>
            
            <div className="mt-4 rounded-xl border-2 border-slate-200 bg-white p-4 h-48 flex flex-col items-center justify-center relative overflow-hidden">
              {!firma ? (
                <button 
                  type="button" 
                  onClick={() => setFirma(true)} 
                  className="rounded-full bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                >
                  ✍️ Toca aquí para firmar con el dedo
                </button>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center fade-in">
                  <div className="text-4xl italic text-blue-950 font-serif border-b-2 border-slate-800 px-8 py-4 mb-2">
                    {datos.nombre || 'Firma Generada'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {datos.cedula || '---'} | TIMESTAMP: {new Date().toLocaleDateString()}</span>
                  <button 
                    type="button" 
                    onClick={() => setFirma(false)} 
                    className="text-xs text-red-500 mt-2 absolute bottom-2 right-4 font-bold underline"
                  >
                    Borrar firma
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 mt-4 bg-slate-100 p-3 rounded-xl border border-slate-200">
              <input type="checkbox" required id="terminos" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
              <label htmlFor="terminos" className="text-xs font-medium text-slate-700 leading-tight">
                Declaro bajo fe de juramento que la información suministrada es verídica y acepto los términos y políticas de privacidad de la plataforma.
              </label>
            </div>
          </div>
        )}

        {/* Botones de Navegación */}
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
            className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md transition ${fase === 4 && !firma ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} 
            disabled={fase === 4 && !firma}
          >
            {fase === 4 ? 'Firmar y Enviar Solicitud' : 'Siguiente Fase'}
          </button>
        </div>
      </form>
    </div>
  )
}