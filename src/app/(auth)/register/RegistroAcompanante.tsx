'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Validación Cédula Dominicana JCE (Algoritmo Módulo 10)
function validarCedulaDominicana(cedula: string): boolean {
  const clean = cedula.replace(/[^0-9]/g, '');
  if (clean.length !== 11) return false;

  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    let prod = parseInt(clean[i], 10) * weights[i];
    if (prod >= 10) {
      prod = Math.floor(prod / 10) + (prod % 10);
    }
    sum += prod;
  }

  const verifier = (10 - (sum % 10)) % 10;
  return verifier === parseInt(clean[10], 10);
}

// Validación de vigencia de 30 días hábiles
function validarVigencia30DiasHabiles(fechaEmisionStr: string): boolean {
  if (!fechaEmisionStr) return false;
  const fechaEmision = new Date(fechaEmisionStr + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaEmision > hoy) return false;

  let diasHabiles = 0;
  const cursor = new Date(fechaEmision);

  while (cursor < hoy) {
    cursor.setDate(cursor.getDate() + 1);
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      diasHabiles++;
    }
  }

  return diasHabiles <= 30;
}

export default function RegistroAcompanante() {
  const router = useRouter();
  const [fase, setFase] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);

  // Identidad
  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA');
  const [datos, setDatos] = useState({
    nombre: '',
    numeroDocumento: '',
    telefono: '',
    experiencia: '1-3',
    referenciaNombre: '',
    referenciaTelefono: '',
    email: '',
    password: '',
  });

  // Documentos
  const [docFrontal, setDocFrontal] = useState<File | null>(null);
  const [docDorsal, setDocDorsal] = useState<File | null>(null);
  const [permisoTrabajo, setPermisoTrabajo] = useState<File | null>(null);
  const [previewFrontal, setPreviewFrontal] = useState<string | null>(null);
  const [previewDorsal, setPreviewDorsal] = useState<string | null>(null);

  // Certificados
  const [certAntecedentes, setCertAntecedentes] = useState<File | null>(null);
  const [fechaAntecedentes, setFechaAntecedentes] = useState('');
  const [certProfesional, setCertProfesional] = useState<File | null>(null);
  const [fechaProfesional, setFechaProfesional] = useState('');
  const [certBachiller, setCertBachiller] = useState<File | null>(null);
  const [certAcademia, setCertAcademia] = useState<File | null>(null);
  const [codigoAcademia, setCodigoAcademia] = useState('');

  // Cámara
  const [camaraActiva, setCamaraActiva] = useState<'frontal' | 'dorsal' | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [firma, setFirma] = useState(false);

  // Detectar sesión de Administrador
  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'ADMIN') {
          setEsAdmin(true);
        }
      }
    }
    checkAdmin();
  }, []);

  const iniciarCamara = async (tipo: 'frontal' | 'dorsal') => {
    setErrorMsg('');
    setCamaraActiva(tipo);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setErrorMsg('No se pudo abrir la cámara. Utiliza la opción de subir archivo.');
      detenerCamara();
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCamaraActiva(null);
  };

  const capturarFoto = (tipo: 'frontal' | 'dorsal') => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${tipoDocumento.toLowerCase()}_${tipo}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        if (tipo === 'frontal') {
          setDocFrontal(file);
          setPreviewFrontal(url);
        } else {
          setDocDorsal(file);
          setPreviewDorsal(url);
        }
      }
      detenerCamara();
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'frontal' | 'dorsal') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (tipo === 'frontal') {
        setDocFrontal(file);
        setPreviewFrontal(url);
      } else {
        setDocDorsal(file);
        setPreviewDorsal(url);
      }
    }
  };

  // Validación y avance controlado
  const handleAvanzar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Si es Administrador, puede navegar libremente
    if (esAdmin) {
      setFase(prev => Math.min(prev + 1, 4));
      return;
    }

    // Reglas estrictas para postulantes regulares
    if (fase === 1) {
      if (!datos.nombre || !datos.numeroDocumento || !datos.telefono) {
        setErrorMsg('Por favor completa todos los campos de identidad.');
        return;
      }
      if (tipoDocumento === 'CEDULA') {
        if (!validarCedulaDominicana(datos.numeroDocumento)) {
          setErrorMsg('La cédula ingresada no es válida según el padrón de la JCE.');
          return;
        }
      } else {
        if (datos.numeroDocumento.trim().length < 6) {
          setErrorMsg('Ingresa un número de pasaporte válido.');
          return;
        }
      }
      setFase(2);
      return;
    }

    if (fase === 2) {
      if (tipoDocumento === 'CEDULA') {
        if (!docFrontal || !docDorsal) {
          setErrorMsg('Es obligatorio subir ambas caras de la cédula.');
          return;
        }
      } else {
        if (!docFrontal) {
          setErrorMsg('Es obligatorio subir la página principal del pasaporte.');
          return;
        }
        if (!permisoTrabajo) {
          setErrorMsg('Para pasaporte extranjero es obligatorio el Permiso de Trabajo (DGM).');
          return;
        }
      }

      if (!certAntecedentes) {
        setErrorMsg('Es obligatorio adjuntar el Certificado de Antecedentes No Penales (PGR).');
        return;
      }
      if (!fechaAntecedentes || !validarVigencia30DiasHabiles(fechaAntecedentes)) {
        setErrorMsg('El Certificado de Antecedentes No Penales excede los 30 días hábiles permitidos.');
        return;
      }

      if (certProfesional) {
        if (!fechaProfesional || !validarVigencia30DiasHabiles(fechaProfesional)) {
          setErrorMsg('La certificación profesional excede los 30 días hábiles permitidos.');
          return;
        }
      }

      if (!certBachiller) {
        setErrorMsg('Es obligatorio adjuntar el Certificado o Título de Bachiller.');
        return;
      }

      if (!certAcademia) {
        setErrorMsg('Es obligatorio adjuntar el Certificado de JUNTOS Academia.');
        return;
      }

      setFase(3);
      return;
    }

    if (fase === 3) {
      if (!datos.referenciaNombre || !datos.referenciaTelefono) {
        setErrorMsg('Por favor completa los datos de la referencia laboral.');
        return;
      }
      setFase(4);
      return;
    }
  };

  // Botón exclusivo de Admin para pruebas rápidas
  const handleCompletarDemo = () => {
    setDatos({
      nombre: 'Acompañante de Prueba (Admin)',
      numeroDocumento: '40222222228',
      telefono: '8095551234',
      experiencia: '3-5',
      referenciaNombre: 'Hospital Central',
      referenciaTelefono: '8095554321',
      email: `acompanante_test_${Date.now()}@juntos.do`,
      password: 'password123',
    });
    setCodigoAcademia('JACAD-2026-DEMO');
    setFirma(true);
    setErrorMsg('');
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!datos.email || !datos.password) {
      setErrorMsg('Ingresa un correo y contraseña.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const userId = data.user.id;
      const expedienteCompleto = {
        user_id: userId,
        nombre: datos.nombre,
        tipo_documento: tipoDocumento,
        numero_documento: datos.numeroDocumento,
        telefono: datos.telefono,
        email: datos.email,
        experiencia: datos.experiencia,
        referencia_nombre: datos.referenciaNombre,
        referencia_telefono: datos.referenciaTelefono,
        codigo_academia: codigoAcademia,
        fecha_antecedentes: fechaAntecedentes || null,
        fecha_profesional: fechaProfesional || null,
        estado: 'PENDIENTE_REVISION',
        firma_digital: firma ? datos.nombre : 'FIRMADO_ADMIN',
        fecha_solicitud: new Date().toISOString(),
      };

      await supabase.from('profiles').update({
        full_name: datos.nombre,
        phone: datos.telefono,
        role: 'COMPANION',
        status: 'PENDIENTE_REVISION',
        metadata: expedienteCompleto,
      }).eq('id', userId);

      await supabase.from('companion_applications').insert([expedienteCompleto]).select();
    }

    setLoading(false);
    alert('¡Expediente guardado! Disponible en la Mesa Operativa.');
    router.push('/companion/onboarding');
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 py-8 font-sans text-slate-900">
      
      {/* 1. BARRA EXCLUSIVA PARA EL ADMINISTRADOR */}
      {esAdmin && (
        <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-semibold text-amber-800">
            🛠️ Modo Auditoría (Solo visible para Admin)
          </span>
          <button
            type="button"
            onClick={handleCompletarDemo}
            className="bg-amber-600 text-white font-bold px-2.5 py-1 rounded hover:bg-amber-700 transition"
          >
            Llenar datos prueba
          </button>
        </div>
      )}

      <button 
        className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-800 transition" 
        onClick={() => router.push('/')}
        type="button"
      >
        ‹ Volver a la portada
      </button>

      <h2 className="text-2xl font-black text-blue-950 mb-1">Únete a JUNTOS</h2>
      <p className="text-sm text-slate-600 mb-5 font-medium">Proceso de verificación y acreditación oficial para acompañantes.</p>

      {/* 2. NAVEGACIÓN: Botones directos si es Admin, Barra de progreso si es usuario regular */}
      {esAdmin ? (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => { setErrorMsg(''); setFase(num); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                fase === num 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Fase {num}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num} 
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${fase >= num ? 'bg-blue-600' : 'bg-slate-200'}`} 
            />
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      {/* Modal con Escáner */}
      {camaraActiva && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
            <div className="absolute top-8 w-64 h-40 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <span className="text-[10px] text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded self-start">Alinea documento</span>
              <span className="text-[10px] text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded self-end">{camaraActiva.toUpperCase()}</span>
            </div>
            <div className="w-full bg-slate-900 p-4 flex justify-between items-center">
              <button type="button" onClick={detenerCamara} className="text-xs text-white bg-slate-700 px-4 py-2 rounded-lg">Cancelar</button>
              <button type="button" onClick={() => capturarFoto(camaraActiva)} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-lg">
                📸 Capturar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={fase === 4 ? handleSubmitFinal : handleAvanzar}>
        
        {/* FASE 1 */}
        {fase === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 1: Identidad Básica</h3>
            
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tipo de Documento</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('CEDULA'); setDatos({...datos, numeroDocumento: ''}); }}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${tipoDocumento === 'CEDULA' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  🪪 Cédula Dominicana
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('PASAPORTE'); setDatos({...datos, numeroDocumento: ''}); }}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${tipoDocumento === 'PASAPORTE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  🛂 Pasaporte Extranjero
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nombre Completo</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500" 
                placeholder="Ej: María Pérez" 
                value={datos.nombre} 
                onChange={e => setDatos({...datos, nombre: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {tipoDocumento === 'CEDULA' ? 'Cédula (11 dígitos sin guiones)' : 'Número de Pasaporte'}
              </label>
              <input 
                type="text" 
                maxLength={tipoDocumento === 'CEDULA' ? 11 : 20} 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm outline-none focus:border-blue-500 font-mono" 
                placeholder={tipoDocumento === 'CEDULA' ? '40200000000' : 'A12345678'} 
                value={datos.numeroDocumento} 
                onChange={e => setDatos({...datos, numeroDocumento: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Teléfono (WhatsApp)</label>
              <input 
                type="tel" 
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
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 2: Documentación y Seguridad</h3>

            {/* Documento */}
            {tipoDocumento === 'CEDULA' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase block">1. Cédula (Ambas Caras)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 bg-white text-center flex flex-col justify-between items-center h-44">
                    {previewFrontal ? (
                      <div className="w-full h-full flex flex-col items-center justify-between">
                        <img src={previewFrontal} alt="Frontal" className="h-28 w-full object-cover rounded-md" />
                        <button type="button" onClick={() => setPreviewFrontal(null)} className="text-[10px] text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl">🪪</span>
                        <p className="text-xs font-bold text-blue-700">Lado Frontal</p>
                        <div className="flex flex-col gap-1 w-full">
                          <button type="button" onClick={() => iniciarCamara('frontal')} className="text-[11px] bg-blue-50 text-blue-700 py-1 rounded font-semibold">📷 Escanear</button>
                          <label className="text-[11px] bg-slate-100 text-slate-700 py-1 rounded font-semibold cursor-pointer">
                            📁 Subir
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'frontal')} />
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 bg-white text-center flex flex-col justify-between items-center h-44">
                    {previewDorsal ? (
                      <div className="w-full h-full flex flex-col items-center justify-between">
                        <img src={previewDorsal} alt="Dorsal" className="h-28 w-full object-cover rounded-md" />
                        <button type="button" onClick={() => setPreviewDorsal(null)} className="text-[10px] text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl">🔄</span>
                        <p className="text-xs font-bold text-blue-700">Lado Posterior</p>
                        <div className="flex flex-col gap-1 w-full">
                          <button type="button" onClick={() => iniciarCamara('dorsal')} className="text-[11px] bg-blue-50 text-blue-700 py-1 rounded font-semibold">📷 Escanear</button>
                          <label className="text-[11px] bg-slate-100 text-slate-700 py-1 rounded font-semibold cursor-pointer">
                            📁 Subir
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'dorsal')} />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase block">1. Pasaporte y Permiso DGM</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 bg-white text-center flex flex-col justify-between items-center h-44">
                    {previewFrontal ? (
                      <div className="w-full h-full flex flex-col items-center justify-between">
                        <img src={previewFrontal} alt="Pasaporte" className="h-28 w-full object-cover rounded-md" />
                        <button type="button" onClick={() => setPreviewFrontal(null)} className="text-[10px] text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl">🛂</span>
                        <p className="text-xs font-bold text-blue-700">Pág. Pasaporte</p>
                        <button type="button" onClick={() => iniciarCamara('frontal')} className="text-[11px] bg-blue-50 text-blue-700 py-1 rounded font-semibold">📷 Escanear</button>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 bg-white text-center flex flex-col justify-between items-center h-44">
                    <span className="text-2xl">📑</span>
                    <p className="text-xs font-bold text-blue-700">Permiso Trabajo</p>
                    <label className="w-full text-[11px] bg-slate-100 text-slate-700 py-2 rounded font-semibold cursor-pointer">
                      {permisoTrabajo ? '✓ Adjuntado' : '📁 Subir DGM'}
                      <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setPermisoTrabajo(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Antecedentes No Penales */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase block">2. Antecedentes No Penales (PGR)</label>
              <div className="bg-white border rounded-xl p-3 space-y-2">
                <label className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-slate-700 truncate">{certAntecedentes ? `✓ ${certAntecedentes.name}` : '📎 Adjuntar Certificado No Antecedentes'}</span>
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertAntecedentes(e.target.files?.[0] || null)} />
                </label>
                {certAntecedentes && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Fecha de emisión (30 días hábiles):</label>
                    <input type="date" value={fechaAntecedentes} onChange={(e) => setFechaAntecedentes(e.target.value)} className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profesional Opcional */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase">3. Certificación Profesional Previa</label>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">Opcional</span>
              </div>
              <div className="bg-white border rounded-xl p-3 space-y-2">
                <label className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-slate-700 truncate">{certProfesional ? `✓ ${certProfesional.name}` : '📎 Adjuntar Certificación'}</span>
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertProfesional(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Bachiller */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase block">4. Certificado de Bachiller</label>
              <label className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-700 truncate">{certBachiller ? `✓ ${certBachiller.name}` : '🎓 Adjuntar Diploma o Certificado'}</span>
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertBachiller(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* JUNTOS Academia */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-blue-950 uppercase block">5. Certificado JUNTOS Academia</label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <input 
                  type="text" 
                  value={codigoAcademia} 
                  onChange={(e) => setCodigoAcademia(e.target.value)} 
                  placeholder="Código de Acreditación (Ej: JACAD-2026-XXXX)" 
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white uppercase font-mono"
                />
                <label className="w-full text-xs bg-blue-600 text-white font-bold rounded-lg p-2 block text-center cursor-pointer">
                  {certAcademia ? `✓ ${certAcademia.name}` : '📎 Adjuntar Diploma'}
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertAcademia(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* FASE 3 */}
        {fase === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 3: Experiencia y Referencias</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Años de experiencia</label>
              <select 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm" 
                value={datos.experiencia} 
                onChange={e => setDatos({...datos, experiencia: e.target.value})}
              >
                <option value="0-1">Menos de 1 año</option>
                <option value="1-3">1 a 3 años</option>
                <option value="3-5">3 a 5 años</option>
                <option value="5+">Más de 5 años</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Nombre Referencia Laboral</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm" 
                placeholder="Nombre de contacto"
                value={datos.referenciaNombre}
                onChange={e => setDatos({...datos, referenciaNombre: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Teléfono de la Referencia</label>
              <input 
                type="tel" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 mt-1 text-sm" 
                placeholder="Ej: 809-555-0000"
                value={datos.referenciaTelefono}
                onChange={e => setDatos({...datos, referenciaTelefono: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* FASE 4 */}
        {fase === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Fase 4: Firma y Creación de Cuenta</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Correo Electrónico</label>
              <input 
                type="email" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm" 
                placeholder="correo@ejemplo.com"
                value={datos.email}
                onChange={e => setDatos({...datos, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Contraseña</label>
              <input 
                type="password" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm" 
                placeholder="••••••••"
                value={datos.password}
                onChange={e => setDatos({...datos, password: e.target.value})}
              />
            </div>

            <div className="mt-4 rounded-xl border-2 border-slate-200 bg-white p-4 h-36 flex flex-col items-center justify-center relative">
              {!firma ? (
                <button 
                  type="button" 
                  onClick={() => setFirma(true)} 
                  className="rounded-full bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 border border-blue-200"
                >
                  ✍ Toca aquí para firmar
                </button>
              ) : (
                <div className="w-full text-center">
                  <div className="text-2xl italic text-blue-950 font-serif border-b pb-1 mb-1">
                    {datos.nombre || 'Firma Registrada'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">FECHA: {new Date().toLocaleDateString()}</span>
                  <button type="button" onClick={() => setFirma(false)} className="text-xs text-red-500 mt-1 block mx-auto underline">
                    Borrar firma
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones inferiores */}
        <div className="mt-8 flex gap-3">
          {fase > 1 && (
            <button 
              type="button" 
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700" 
              onClick={() => { setErrorMsg(''); setFase(fase - 1); }}
            >
              Atrás
            </button>
          )}
          <button 
            type="submit" 
            className="flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md bg-blue-600 hover:bg-blue-700 transition" 
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : fase === 4 ? 'Firmar y Enviar Solicitud' : 'Siguiente Fase'}
          </button>
        </div>
      </form>
    </div>
  );
}