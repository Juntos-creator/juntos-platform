'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Validación oficial de Cédula Dominicana (Módulo 10 JCE)
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

// Validación de 30 días hábiles
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

  // ---------------------------------------------------------------------------
  // ESTADOS DEL FORMULARIO INTEGRAL KYC / RRHH
  // ---------------------------------------------------------------------------
  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA');
  
  // Fase 1: Identidad & Domicilio Completo
  const [datosIdentidad, setDatosIdentidad] = useState({
    nombre: '',
    fechaNacimiento: '',
    nacionalidad: 'Dominicana',
    numeroDocumento: '',
    telefonoWhatsapp: '',
    telefonoSecundario: '',
    // Domicilio KYC
    direccionCalle: '',
    sector: '',
    municipioProvincia: 'Santo Domingo Este',
    tipoVivienda: 'Propia',
    tiempoViviendo: 'Más de 3 años',
    // Contacto de Emergencia
    contactoEmergenciaNombre: '',
    contactoEmergenciaParentesco: '',
    contactoEmergenciaTelefono: '',
  });

  // Fase 2: Documentos & Evidencias KYC
  const [docFrontal, setDocFrontal] = useState<File | null>(null);
  const [docDorsal, setDocDorsal] = useState<File | null>(null);
  const [permisoTrabajo, setPermisoTrabajo] = useState<File | null>(null);
  const [previewFrontal, setPreviewFrontal] = useState<string | null>(null);
  const [previewDorsal, setPreviewDorsal] = useState<string | null>(null);

  const [comprobanteDomicilio, setComprobanteDomicilio] = useState<File | null>(null);

  const [certAntecedentes, setCertAntecedentes] = useState<File | null>(null);
  const [fechaAntecedentes, setFechaAntecedentes] = useState('');

  const [certProfesional, setCertProfesional] = useState<File | null>(null);
  const [fechaProfesional, setFechaProfesional] = useState('');

  const [certBachiller, setCertBachiller] = useState<File | null>(null);
  const [certAcademia, setCertAcademia] = useState<File | null>(null);
  const [codigoAcademia, setCodigoAcademia] = useState('');

  // Fase 3: Referencias Laborales & Personales + Datos Bancarios
  const [datosLaborales, setDatosLaborales] = useState({
    experienciaAnios: '1-3',
    habilidadesEspeciales: 'Cuidado geriátrico básico, Movilización, Control de medicamentos',
    // Referencia Laboral 1
    refLab1Nombre: '',
    refLab1Empresa: '',
    refLab1Cargo: '',
    refLab1Telefono: '',
    // Referencia Laboral 2
    refLab2Nombre: '',
    refLab2Empresa: '',
    refLab2Telefono: '',
    // Referencia Personal 1
    refPers1Nombre: '',
    refPers1Relacion: '',
    refPers1Telefono: '',
    // Referencia Personal 2
    refPers2Nombre: '',
    refPers2Relacion: '',
    refPers2Telefono: '',
    // Datos de pago / nómina
    bancoDestino: 'Banreservas',
    tipoCuenta: 'Ahorros',
    numeroCuentaBanco: '',
  });

  // Fase 4: Credenciales de acceso y Firma Legal
  const [credenciales, setCredenciales] = useState({
    email: '',
    password: '',
  });
  const [firma, setFirma] = useState(false);

  // Cámara
  const [camaraActiva, setCamaraActiva] = useState<'frontal' | 'dorsal' | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detección de Administrador
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
      setErrorMsg('No se pudo acceder a la cámara. Usa la opción de adjuntar archivo.');
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

  // Validaciones estrictas por fase
  const handleAvanzar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (esAdmin) {
      setFase(prev => Math.min(prev + 1, 4));
      return;
    }

    if (fase === 1) {
      if (!datosIdentidad.nombre || !datosIdentidad.numeroDocumento || !datosIdentidad.telefonoWhatsapp) {
        setErrorMsg('Completa los campos obligatorios de contacto e identidad.');
        return;
      }
      if (tipoDocumento === 'CEDULA') {
        if (!validarCedulaDominicana(datosIdentidad.numeroDocumento)) {
          setErrorMsg('Cédula no válida según el padrón de la Junta Central Electoral.');
          return;
        }
      } else {
        if (datosIdentidad.numeroDocumento.trim().length < 6) {
          setErrorMsg('Ingresa un número de pasaporte válido.');
          return;
        }
      }
      if (!datosIdentidad.direccionCalle || !datosIdentidad.sector) {
        setErrorMsg('El domicilio exacto (Calle, No., Sector) es obligatorio para el expediente KYC.');
        return;
      }
      if (!datosIdentidad.contactoEmergenciaNombre || !datosIdentidad.contactoEmergenciaTelefono) {
        setErrorMsg('Indica un contacto de emergencia directo y verificado.');
        return;
      }
      setFase(2);
      return;
    }

    if (fase === 2) {
      if (tipoDocumento === 'CEDULA') {
        if (!docFrontal || !docDorsal) {
          setErrorMsg('Debes adjuntar ambas caras de la Cédula (Frontal y Posterior).');
          return;
        }
      } else {
        if (!docFrontal || !permisoTrabajo) {
          setErrorMsg('Para pasaporte extranjero es obligatorio el pasaporte y el Permiso DGM.');
          return;
        }
      }
      if (!comprobanteDomicilio) {
        setErrorMsg('Adjunta un comprobante de domicilio (factura de servicios o contrato).');
        return;
      }
      if (!certAntecedentes || !fechaAntecedentes || !validarVigencia30DiasHabiles(fechaAntecedentes)) {
        setErrorMsg('Certificado PGR obligatorio con vigencia máxima de 30 días hábiles.');
        return;
      }
      if (certProfesional && (!fechaProfesional || !validarVigencia30DiasHabiles(fechaProfesional))) {
        setErrorMsg('La certificación profesional excede los 30 días hábiles permitidos.');
        return;
      }
      if (!certBachiller) {
        setErrorMsg('El certificado o diploma de Bachiller es obligatorio.');
        return;
      }
      if (!certAcademia) {
        setErrorMsg('El certificado de JUNTOS Academia es obligatorio.');
        return;
      }
      setFase(3);
      return;
    }

    if (fase === 3) {
      if (!datosLaborales.refLab1Nombre || !datosLaborales.refLab1Telefono) {
        setErrorMsg('Indica al menos una Referencia Laboral completa.');
        return;
      }
      if (!datosLaborales.refPers1Nombre || !datosLaborales.refPers1Telefono) {
        setErrorMsg('Indica al menos una Referencia Personal con teléfono verificado.');
        return;
      }
      setFase(4);
      return;
    }
  };

  // Botón Admin: Cargar expediente KYC completo de demostración
  const handleCompletarDemo = () => {
    setDatosIdentidad({
      nombre: 'Licda. Rosa Altagracia Morales',
      fechaNacimiento: '1992-06-15',
      nacionalidad: 'Dominicana',
      numeroDocumento: '40222222228',
      telefonoWhatsapp: '8095550192',
      telefonoSecundario: '8295550193',
      direccionCalle: 'Av. Las Américas No. 142, Edif. Aurora III, Apto 3B',
      sector: 'Ensanche Ozama',
      municipioProvincia: 'Santo Domingo Este',
      tipoVivienda: 'Propia',
      tiempoViviendo: 'Más de 3 años',
      contactoEmergenciaNombre: 'Carlos Morales (Hermano)',
      contactoEmergenciaParentesco: 'Hermano',
      contactoEmergenciaTelefono: '8095559876',
    });

    setDatosLaborales({
      experienciaAnios: '3-5',
      habilidadesEspeciales: 'Cuidado geriátrico especializado, Control de signos vitales, Estimulación cognitiva',
      refLab1Nombre: 'Dra. Carmen Santos',
      refLab1Empresa: 'Hogar de Ancianos San Francisco',
      refLab1Cargo: 'Supervisora de Enfermería',
      refLab1Telefono: '8095551122',
      refLab2Nombre: 'Ing. Pedro Méndez',
      refLab2Empresa: 'Particular (Cuidado privado)',
      refLab2Telefono: '8095553344',
      refPers1Nombre: 'Lic. Miguel Ángel Ramos',
      refPers1Relacion: 'Vecino / Colega docente',
      refPers1Telefono: '8095555566',
      refPers2Nombre: 'Elena Bautista',
      refPers2Relacion: 'Líder comunitaria',
      refPers2Telefono: '8095557788',
      bancoDestino: 'Banco Popular Dominicano',
      tipoCuenta: 'Ahorros',
      numeroCuentaBanco: '7894561230',
    });

    setCredenciales({
      email: `acompanante_kyc_${Date.now()}@juntos.do`,
      password: 'Password2026!',
    });

    setCodigoAcademia('JACAD-2026-KYC');
    setFechaAntecedentes(new Date().toISOString().split('T')[0]);
    setFirma(true);
    setErrorMsg('');
  };

  // Creación y almacenamiento del expediente integral KYC
  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!credenciales.email || !credenciales.password) {
      setErrorMsg('Ingresa correo y contraseña para crear la cuenta.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: credenciales.email,
      password: credenciales.password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const userId = data.user.id;

      const expedienteCompletoKYC = {
        user_id: userId,
        // Identidad y KYC
        nombre: datosIdentidad.nombre,
        tipo_documento: tipoDocumento,
        numero_documento: datosIdentidad.numeroDocumento,
        nacionalidad: datosIdentidad.nacionalidad,
        fecha_nacimiento: datosIdentidad.fechaNacimiento,
        telefono_whatsapp: datosIdentidad.telefonoWhatsapp,
        telefono_secundario: datosIdentidad.telefonoSecundario,
        // Domicilio
        domicilio_direccion: datosIdentidad.direccionCalle,
        domicilio_sector: datosIdentidad.sector,
        domicilio_municipio_provincia: datosIdentidad.municipioProvincia,
        domicilio_tipo_vivienda: datosIdentidad.tipoVivienda,
        domicilio_tiempo_residiendo: datosIdentidad.tiempoViviendo,
        // Contacto Emergencia
        contacto_emergencia_nombre: datosIdentidad.contactoEmergenciaNombre,
        contacto_emergencia_parentesco: datosIdentidad.contactoEmergenciaParentesco,
        contacto_emergencia_telefono: datosIdentidad.contactoEmergenciaTelefono,
        // Referencias Laborales y Personales
        experiencia_anios: datosLaborales.experienciaAnios,
        habilidades: datosLaborales.habilidadesEspeciales,
        referencia_laboral_1: {
          nombre: datosLaborales.refLab1Nombre,
          empresa: datosLaborales.refLab1Empresa,
          cargo: datosLaborales.refLab1Cargo,
          telefono: datosLaborales.refLab1Telefono,
        },
        referencia_laboral_2: {
          nombre: datosLaborales.refLab2Nombre,
          empresa: datosLaborales.refLab2Empresa,
          telefono: datosLaborales.refLab2Telefono,
        },
        referencia_personal_1: {
          nombre: datosLaborales.refPers1Nombre,
          relacion: datosLaborales.refPers1Relacion,
          telefono: datosLaborales.refPers1Telefono,
        },
        referencia_personal_2: {
          nombre: datosLaborales.refPers2Nombre,
          relacion: datosLaborales.refPers2Relacion,
          telefono: datosLaborales.refPers2Telefono,
        },
        // Datos Bancarios
        datos_pago_banco: datosLaborales.bancoDestino,
        datos_pago_tipo_cuenta: datosLaborales.tipoCuenta,
        datos_pago_numero_cuenta: datosLaborales.numeroCuentaBanco,
        // Acreditaciones
        codigo_academia: codigoAcademia,
        fecha_antecedentes_pgr: fechaAntecedentes || null,
        fecha_cert_profesional: fechaProfesional || null,
        // Auditoría
        estado_depuracion: 'PENDIENTE_MESA_RRHH',
        firma_digital: firma ? datosIdentidad.nombre : 'FIRMADO_ELECTRONICO',
        fecha_solicitud: new Date().toISOString(),
      };

      await supabase.from('profiles').update({
        full_name: datosIdentidad.nombre,
        phone: datosIdentidad.telefonoWhatsapp,
        role: 'COMPANION',
        status: 'PENDIENTE_REVISION',
        metadata: expedienteCompletoKYC,
      }).eq('id', userId);

      await supabase.from('companion_applications').insert([expedienteCompletoKYC]).select();
    }

    setLoading(false);
    alert('¡Expediente KYC y de Recursos Humanos registrado exitosamente! La Mesa Operativa de RRHH lo tiene disponible.');
    router.push('/companion/onboarding');
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 py-8 font-sans text-slate-900">
      
      {/* MODO AUDITORÍA EXCLUSIVO PARA ADMINISTRADORES CON ENLACE A MESA DE OPERACIONES */}
      {esAdmin && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs shadow-sm">
          <span className="font-semibold text-amber-900">🛠️ Vista Admin / RRHH</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCompletarDemo}
              className="bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition"
            >
              Llenar prueba
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/mesa-operaciones')}
              className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-black transition flex items-center gap-1 shadow"
            >
              📡 Mesa de Operaciones
            </button>
          </div>
        </div>
      )}

      <button 
        className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-1 hover:text-slate-800 transition" 
        onClick={() => router.push('/')}
        type="button"
      >
        ‹ Volver a la portada
      </button>

      <h2 className="text-2xl font-black text-blue-950 mb-1">Acreditación Oficial</h2>
      <p className="text-xs text-slate-600 mb-5 font-medium">Expediente integral KYC y verificación legal para Acompañantes JUNTOS.</p>

      {/* Pestañas de Fases */}
      {esAdmin ? (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => { setErrorMsg(''); setFase(num); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                fase === num ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
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

      {/* Modal con Escáner de Cédula */}
      {camaraActiva && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
            <div className="absolute top-8 w-64 h-40 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <span className="text-[10px] text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded self-start">Alinea con bordes</span>
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
        
        {/* ============================================================== */}
        {/* FASE 1: IDENTIDAD, DOMICILIO LEGAL Y CONTACTO DE EMERGENCIA    */}
        {/* ============================================================== */}
        {fase === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Fase 1: Identidad y Domicilio Legal</span>
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-normal">KYC Nivel 1</span>
            </h3>

            {/* Documento */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Documento Oficial</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('CEDULA'); setDatosIdentidad({...datosIdentidad, numeroDocumento: ''}); }}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${tipoDocumento === 'CEDULA' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  🪪 Cédula Dominicana
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('PASAPORTE'); setDatosIdentidad({...datosIdentidad, numeroDocumento: ''}); }}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${tipoDocumento === 'PASAPORTE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}
                >
                  🛂 Pasaporte Extranjero
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Nombre Completo (como aparece en ID)</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                placeholder="Ej: Rosa Altagracia Morales" 
                value={datosIdentidad.nombre} 
                onChange={e => setDatosIdentidad({...datosIdentidad, nombre: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">{tipoDocumento === 'CEDULA' ? 'Cédula (11 dígitos)' : 'Pasaporte'}</label>
                <input 
                  type="text" 
                  maxLength={tipoDocumento === 'CEDULA' ? 11 : 20} 
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500 font-mono" 
                  placeholder={tipoDocumento === 'CEDULA' ? '40200000000' : 'A12345678'} 
                  value={datosIdentidad.numeroDocumento} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, numeroDocumento: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Fecha Nacimiento</label>
                <input 
                  type="date" 
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-xs outline-none focus:border-blue-500" 
                  value={datosIdentidad.fechaNacimiento} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, fechaNacimiento: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">WhatsApp Personal</label>
                <input 
                  type="tel" 
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                  placeholder="809-555-0000" 
                  value={datosIdentidad.telefonoWhatsapp} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, telefonoWhatsapp: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Teléfono Fijo / Secundario</label>
                <input 
                  type="tel" 
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                  placeholder="Opcional" 
                  value={datosIdentidad.telefonoSecundario} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, telefonoSecundario: e.target.value})} 
                />
              </div>
            </div>

            {/* SECCIÓN DOMICILIO RESIDENCIAL EXACTO */}
            <div className="pt-3 border-t space-y-3">
              <label className="text-xs font-black text-blue-900 uppercase tracking-wide block">
                🏠 Domicilio Residencial Verificado
              </label>

              <div>
                <label className="text-xs font-semibold text-slate-700">Dirección Exacta (Calle, No., Residencial, Edif./Apto.)</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                  placeholder="Ej: C/ Mella #45, Edif. Real III, Apto 2-A" 
                  value={datosIdentidad.direccionCalle} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, direccionCalle: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Sector / Barrio</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                    placeholder="Ej: Ensanche Ozama / Piantini" 
                    value={datosIdentidad.sector} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, sector: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Municipio / Provincia</label>
                  <select 
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-xs outline-none focus:border-blue-500"
                    value={datosIdentidad.municipioProvincia}
                    onChange={e => setDatosIdentidad({...datosIdentidad, municipioProvincia: e.target.value})}
                  >
                    <option value="Distrito Nacional">Distrito Nacional (D.N.)</option>
                    <option value="Santo Domingo Este">Santo Domingo Este</option>
                    <option value="Santo Domingo Norte">Santo Domingo Norte</option>
                    <option value="Santo Domingo Oeste">Santo Domingo Oeste</option>
                    <option value="Santiago de los Caballeros">Santiago de los Caballeros</option>
                    <option value="San Cristóbal">San Cristóbal</option>
                    <option value="La Vega">La Vega</option>
                    <option value="Puerto Plata">Puerto Plata</option>
                    <option value="Otra Provincia">Otra Provincia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Condición Vivienda</label>
                  <select 
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-xs outline-none"
                    value={datosIdentidad.tipoVivienda}
                    onChange={e => setDatosIdentidad({...datosIdentidad, tipoVivienda: e.target.value})}
                  >
                    <option value="Propia">Propia</option>
                    <option value="Alquilada">Alquilada</option>
                    <option value="Familiar">Familiar / Padres</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Tiempo en el lugar</label>
                  <select 
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-xs outline-none"
                    value={datosIdentidad.tiempoViviendo}
                    onChange={e => setDatosIdentidad({...datosIdentidad, tiempoViviendo: e.target.value})}
                  >
                    <option value="Menos de 1 año">Menos de 1 año</option>
                    <option value="1 a 3 años">1 a 3 años</option>
                    <option value="Más de 3 años">Más de 3 años</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN CONTACTO DE EMERGENCIA */}
            <div className="pt-3 border-t space-y-2">
              <label className="text-xs font-black text-rose-700 uppercase tracking-wide block">
                🚨 Contacto de Emergencia Inmediato
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs outline-none" 
                    placeholder="Nombre y apellido" 
                    value={datosIdentidad.contactoEmergenciaNombre} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, contactoEmergenciaNombre: e.target.value})} 
                  />
                </div>
                <div className="col-span-1">
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs outline-none" 
                    placeholder="Parentesco (Ej: Madre)" 
                    value={datosIdentidad.contactoEmergenciaParentesco} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, contactoEmergenciaParentesco: e.target.value})} 
                  />
                </div>
                <div className="col-span-1">
                  <input 
                    type="tel" 
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs outline-none" 
                    placeholder="Teléfono contacto" 
                    value={datosIdentidad.contactoEmergenciaTelefono} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, contactoEmergenciaTelefono: e.target.value})} 
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* FASE 2: DOCUMENTOS, COMPROBANTE DOMICILIO Y CERTIFICADOS       */}
        {/* ============================================================== */}
        {fase === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Fase 2: Evidencias y Certificaciones</span>
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-normal">KYC Nivel 2</span>
            </h3>

            {/* Documento ID */}
            {tipoDocumento === 'CEDULA' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase block">1. Cédula (Ambas Caras) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-2.5 bg-white text-center flex flex-col justify-between items-center h-40">
                    {previewFrontal ? (
                      <div className="w-full h-full flex flex-col items-center justify-between">
                        <img src={previewFrontal} alt="Frontal" className="h-24 w-full object-cover rounded-md" />
                        <button type="button" onClick={() => setPreviewFrontal(null)} className="text-[10px] text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xl">🪪</span>
                        <p className="text-xs font-bold text-blue-700">Lado Frontal</p>
                        <div className="flex flex-col gap-1 w-full">
                          <button type="button" onClick={() => iniciarCamara('frontal')} className="text-[10px] bg-blue-50 text-blue-700 py-1 rounded font-bold">📷 Escanear</button>
                          <label className="text-[10px] bg-slate-100 text-slate-700 py-1 rounded font-bold cursor-pointer">
                            📁 Subir
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'frontal')} />
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-2.5 bg-white text-center flex flex-col justify-between items-center h-40">
                    {previewDorsal ? (
                      <div className="w-full h-full flex flex-col items-center justify-between">
                        <img src={previewDorsal} alt="Dorsal" className="h-24 w-full object-cover rounded-md" />
                        <button type="button" onClick={() => setPreviewDorsal(null)} className="text-[10px] text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xl">🔄</span>
                        <p className="text-xs font-bold text-blue-700">Lado Posterior</p>
                        <div className="flex flex-col gap-1 w-full">
                          <button type="button" onClick={() => iniciarCamara('dorsal')} className="text-[10px] bg-blue-50 text-blue-700 py-1 rounded font-bold">📷 Escanear</button>
                          <label className="text-[10px] bg-slate-100 text-slate-700 py-1 rounded font-bold cursor-pointer">
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
                <label className="text-xs font-bold text-slate-700 uppercase block">1. Pasaporte y Permiso DGM *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-2.5 bg-white text-center flex flex-col justify-between items-center h-40">
                    <span className="text-xl">🛂</span>
                    <p className="text-xs font-bold text-blue-700">Pág. Pasaporte</p>
                    <label className="w-full text-[10px] bg-slate-100 text-slate-700 py-2 rounded font-bold cursor-pointer">
                      {docFrontal ? '✓ Adjuntado' : 'Subir Imagen'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'frontal')} />
                    </label>
                  </div>
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-2.5 bg-white text-center flex flex-col justify-between items-center h-40">
                    <span className="text-xl">📑</span>
                    <p className="text-xs font-bold text-blue-700">Permiso Trabajo DGM</p>
                    <label className="w-full text-[10px] bg-slate-100 text-slate-700 py-2 rounded font-bold cursor-pointer">
                      {permisoTrabajo ? '✓ Adjuntado' : 'Subir PDF/Foto'}
                      <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setPermisoTrabajo(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Comprobante de Domicilio */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase block">
                2. Comprobante de Domicilio (Factura Luz, Agua o Contrato) *
              </label>
              <label className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <span className="font-semibold text-slate-700 truncate">
                  {comprobanteDomicilio ? `✓ ${comprobanteDomicilio.name}` : '📄 Subir Factura CAASD/Edeeste/Edesur/Claro'}
                </span>
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setComprobanteDomicilio(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Antecedentes No Penales (PGR - 30 días) */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase block">
                3. Certificado No Antecedentes Penales (PGR - 30 días hábiles) *
              </label>
              <div className="bg-white border rounded-xl p-3 space-y-2">
                <label className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-slate-700 truncate">{certAntecedentes ? `✓ ${certAntecedentes.name}` : '📎 Adjuntar Certificado PGR'}</span>
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertAntecedentes(e.target.files?.[0] || null)} />
                </label>
                {certAntecedentes && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Fecha de emisión:</label>
                    <input type="date" value={fechaAntecedentes} onChange={(e) => setFechaAntecedentes(e.target.value)} className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white mt-1" />
                  </div>
                )}
              </div>
            </div>

            {/* Certificación Profesional Previa (Opcional - 30 días) */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase">4. Certificación Profesional Previa</label>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">Opcional</span>
              </div>
              <div className="bg-white border rounded-xl p-3 space-y-2">
                <label className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-slate-700 truncate">{certProfesional ? `✓ ${certProfesional.name}` : '📎 Adjuntar Certificación'}</span>
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertProfesional(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Título de Bachiller */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase block">5. Certificado o Diploma de Bachiller *</label>
              <label className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-700 truncate">{certBachiller ? `✓ ${certBachiller.name}` : '🎓 Adjuntar Título Bachiller'}</span>
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertBachiller(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* JUNTOS Academia */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-bold text-blue-950 uppercase block">6. Certificado JUNTOS Academia *</label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <input 
                  type="text" 
                  value={codigoAcademia} 
                  onChange={(e) => setCodigoAcademia(e.target.value)} 
                  placeholder="Código de Acreditación (Ej: JACAD-2026-XXXX)" 
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white uppercase font-mono"
                />
                <label className="w-full text-xs bg-blue-600 text-white font-bold rounded-lg p-2 block text-center cursor-pointer">
                  {certAcademia ? `✓ ${certAcademia.name}` : '📎 Adjuntar Diploma Academia'}
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertAcademia(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* FASE 3: REFERENCIAS LABORALES, PERSONALES Y PAGO DE NÓMINA     */}
        {/* ============================================================== */}
        {fase === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Fase 3: Referencias y Depuración RRHH</span>
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-normal">RRHH</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Experiencia con Adultos Mayores</label>
              <select 
                className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none" 
                value={datosLaborales.experienciaAnios} 
                onChange={e => setDatosLaborales({...datosLaborales, experienciaAnios: e.target.value})}
              >
                <option value="0-1">Menos de 1 año</option>
                <option value="1-3">1 a 3 años</option>
                <option value="3-5">3 a 5 años</option>
                <option value="5+">Más de 5 años</option>
              </select>
            </div>

            {/* REFERENCIAS LABORALES */}
            <div className="pt-2 border-t space-y-3">
              <label className="text-xs font-black text-blue-900 uppercase tracking-wide block">
                💼 Referencias Laborales Previas (Mínimo 1 requerida)
              </label>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Referencia Laboral 1 *</p>
                <input 
                  type="text" 
                  placeholder="Nombre de la persona o supervisor" 
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  value={datosLaborales.refLab1Nombre}
                  onChange={e => setDatosLaborales({...datosLaborales, refLab1Nombre: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="Empresa o Familia" 
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refLab1Empresa}
                    onChange={e => setDatosLaborales({...datosLaborales, refLab1Empresa: e.target.value})}
                  />
                  <input 
                    type="tel" 
                    placeholder="Teléfono directo" 
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refLab1Telefono}
                    onChange={e => setDatosLaborales({...datosLaborales, refLab1Telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Referencia Laboral 2 (Opcional)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="Nombre supervisor/contacto" 
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refLab2Nombre}
                    onChange={e => setDatosLaborales({...datosLaborales, refLab2Nombre: e.target.value})}
                  />
                  <input 
                    type="tel" 
                    placeholder="Teléfono de contacto" 
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refLab2Telefono}
                    onChange={e => setDatosLaborales({...datosLaborales, refLab2Telefono: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* REFERENCIAS PERSONALES */}
            <div className="pt-2 border-t space-y-3">
              <label className="text-xs font-black text-blue-900 uppercase tracking-wide block">
                👥 Referencias Personales (No familiares directos)
              </label>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Referencia Personal 1 *</p>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder="Nombre completo" 
                    className="col-span-1 w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refPers1Nombre}
                    onChange={e => setDatosLaborales({...datosLaborales, refPers1Nombre: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Relación (Ej: Vecino)" 
                    className="col-span-1 w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refPers1Relacion}
                    onChange={e => setDatosLaborales({...datosLaborales, refPers1Relacion: e.target.value})}
                  />
                  <input 
                    type="tel" 
                    placeholder="Teléfono" 
                    className="col-span-1 w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refPers1Telefono}
                    onChange={e => setDatosLaborales({...datosLaborales, refPers1Telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Referencia Personal 2 (Opcional)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="Nombre completo" 
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refPers2Nombre}
                    onChange={e => setDatosLaborales({...datosLaborales, refPers2Nombre: e.target.value})}
                  />
                  <input 
                    type="tel" 
                    placeholder="Teléfono de contacto" 
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    value={datosLaborales.refPers2Telefono}
                    onChange={e => setDatosLaborales({...datosLaborales, refPers2Telefono: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* DATOS BANCARIOS PARA PAGO */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-wide block">
                💳 Cuenta Bancaria para Pago de Servicios (RD)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select 
                  className="col-span-1 text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  value={datosLaborales.bancoDestino}
                  onChange={e => setDatosLaborales({...datosLaborales, bancoDestino: e.target.value})}
                >
                  <option value="Banreservas">Banreservas</option>
                  <option value="Banco Popular">Banco Popular</option>
                  <option value="Banco BHD">Banco BHD</option>
                  <option value="Asociación Popular">APAP</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Otro Banco">Otro Banco</option>
                </select>
                <select 
                  className="col-span-1 text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  value={datosLaborales.tipoCuenta}
                  onChange={e => setDatosLaborales({...datosLaborales, tipoCuenta: e.target.value})}
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
                <input 
                  type="text" 
                  placeholder="No. de Cuenta" 
                  className="col-span-1 text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  value={datosLaborales.numeroCuentaBanco}
                  onChange={e => setDatosLaborales({...datosLaborales, numeroCuentaBanco: e.target.value})}
                />
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* FASE 4: CONSENTIMIENTO LEY 172-13, FIRMA Y ACCESO              */}
        {/* ============================================================== */}
        {fase === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Fase 4: Consentimiento Legal y Acceso</span>
              <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-normal">Firma</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Correo Electrónico Oficial</label>
              <input 
                type="email" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                placeholder="correo@ejemplo.com"
                value={credenciales.email}
                onChange={e => setCredenciales({...credenciales, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Contraseña para ingresar a la plataforma</label>
              <input 
                type="password" 
                className="w-full rounded-xl border border-slate-300 bg-white p-3 mt-1 text-sm outline-none focus:border-blue-500" 
                placeholder="Mínimo 6 caracteres"
                value={credenciales.password}
                onChange={e => setCredenciales({...credenciales, password: e.target.value})}
              />
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed text-justify">
              Autorizo expresamente a <b>JUNTOS PLATFORM</b> a verificar la autenticidad de mis antecedentes penales ante la Procuraduría General de la República (PGR), comprobar mis referencias personales y validar mis credenciales académicas conforme a las <b>Leyes 172-13</b> (Protección de Datos) y <b>126-02</b> (Comercio Electrónico y Firmas Digitales).
            </div>

            <div className="mt-2 rounded-xl border-2 border-slate-200 bg-white p-4 h-36 flex flex-col items-center justify-center relative">
              {!firma ? (
                <button 
                  type="button" 
                  onClick={() => setFirma(true)} 
                  className="rounded-full bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                >
                  ✍ Toca aquí para estampar tu firma digital
                </button>
              ) : (
                <div className="w-full text-center">
                  <div className="text-2xl italic text-blue-950 font-serif border-b pb-1 mb-1">
                    {datosIdentidad.nombre || 'Firma Registrada'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    DOC: {datosIdentidad.numeroDocumento || '---'} | FECHA: {new Date().toLocaleDateString()}
                  </span>
                  <button type="button" onClick={() => setFirma(false)} className="text-xs text-red-500 mt-1 block mx-auto underline font-bold">
                    Borrar firma
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTONES INFERIORES */}
        <div className="mt-8 flex gap-3">
          {fase > 1 && (
            <button 
              type="button" 
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition" 
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
            {loading ? 'Procesando expediente...' : fase === 4 ? 'Firmar y Enviar a RRHH' : 'Siguiente Fase'}
          </button>
        </div>
      </form>
    </div>
  );
}