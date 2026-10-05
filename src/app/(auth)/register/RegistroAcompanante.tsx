'use client';

import React, { useState, useRef, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  Upload, 
  FileCheck2, 
  User, 
  Phone, 
  CreditCard, 
  AlertCircle,
  GraduationCap,
  FileText,
  Lock,
  Mail,
  Home
} from 'lucide-react';

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

export default function RegistroAcompanante(): JSX.Element {
  const router = useRouter();
  const [fase, setFase] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);

  // Estados del formulario
  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA');
  
  // Fase 1: Identidad & Domicilio
  const [datosIdentidad, setDatosIdentidad] = useState({
    nombre: '',
    fechaNacimiento: '',
    nacionalidad: 'Dominicana',
    numeroDocumento: '',
    telefonoWhatsapp: '',
    telefonoSecundario: '',
    direccionCalle: '',
    sector: '',
    municipioProvincia: 'Santo Domingo Este',
    tipoVivienda: 'Propia',
    tiempoViviendo: 'Más de 3 años',
    contactoEmergenciaNombre: '',
    contactoEmergenciaParentesco: '',
    contactoEmergenciaTelefono: '',
  });

  // Fase 2: Documentos KYC
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

  // Fase 3: Referencias & Nómina
  const [datosLaborales, setDatosLaborales] = useState({
    experienciaAnios: '1-3',
    habilidadesEspeciales: 'Cuidado geriátrico básico, Movilización, Control de medicamentos',
    refLab1Nombre: '',
    refLab1Empresa: '',
    refLab1Cargo: '',
    refLab1Telefono: '',
    refLab2Nombre: '',
    refLab2Empresa: '',
    refLab2Telefono: '',
    refPers1Nombre: '',
    refPers1Relacion: '',
    refPers1Telefono: '',
    refPers2Nombre: '',
    refPers2Relacion: '',
    refPers2Telefono: '',
    bancoDestino: 'Banreservas',
    tipoCuenta: 'Ahorros',
    numeroCuentaBanco: '',
  });

  // Fase 4: Acceso y Firma
  const [credenciales, setCredenciales] = useState({
    email: '',
    password: '',
  });
  const [firma, setFirma] = useState(false);

  // Cámara
  const [camaraActiva, setCamaraActiva] = useState<'frontal' | 'dorsal' | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        nombre: datosIdentidad.nombre,
        tipo_documento: tipoDocumento,
        numero_documento: datosIdentidad.numeroDocumento,
        nacionalidad: datosIdentidad.nacionalidad,
        fecha_nacimiento: datosIdentidad.fechaNacimiento,
        telefono_whatsapp: datosIdentidad.telefonoWhatsapp,
        telefono_secundario: datosIdentidad.telefonoSecundario,
        domicilio_direccion: datosIdentidad.direccionCalle,
        domicilio_sector: datosIdentidad.sector,
        domicilio_municipio_provincia: datosIdentidad.municipioProvincia,
        domicilio_tipo_vivienda: datosIdentidad.tipoVivienda,
        domicilio_tiempo_residiendo: datosIdentidad.tiempoViviendo,
        contacto_emergencia_nombre: datosIdentidad.contactoEmergenciaNombre,
        contacto_emergencia_parentesco: datosIdentidad.contactoEmergenciaParentesco,
        contacto_emergencia_telefono: datosIdentidad.contactoEmergenciaTelefono,
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
        datos_pago_banco: datosLaborales.bancoDestino,
        datos_pago_tipo_cuenta: datosLaborales.tipoCuenta,
        datos_pago_numero_cuenta: datosLaborales.numeroCuentaBanco,
        codigo_academia: codigoAcademia,
        fecha_antecedentes_pgr: fechaAntecedentes || null,
        fecha_cert_profesional: fechaProfesional || null,
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

  const stepsInfo = [
    { num: 1, title: 'Identidad y Domicilio' },
    { num: 2, title: 'Documentación PGR' },
    { num: 3, title: 'Referencias & Nómina' },
    { num: 4, title: 'Firma y Acceso' }
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-slate-100 font-sans">
      
      {/* BARRA ADMIN */}
      {esAdmin && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-amber-400">🛠️ Auditoría de RRHH (Admin)</span>
          <button
            type="button"
            onClick={handleCompletarDemo}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl transition"
          >
            Cargar Datos de Prueba
          </button>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acreditación Oficial de Recursos Humanos</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Expediente Integral KYC</h2>
        <p className="text-xs text-slate-400">Validación legal, domicilio y depuración PGR conforme a la Ley 172-13.</p>
      </div>

      {/* STEPPER PROGRESO */}
      <div className="grid grid-cols-4 gap-2">
        {stepsInfo.map(step => (
          <div key={step.num} className="space-y-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                fase >= step.num ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : 'bg-slate-800'
              }`} 
            />
            <p className={`text-[10px] font-bold truncate ${fase === step.num ? 'text-emerald-400' : 'text-slate-500'}`}>
              {step.num}. {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* MENSAJE DE ERROR */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MODAL CÁMARA */}
      {camaraActiva && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
            <div className="absolute top-8 w-64 h-40 border-2 border-dashed border-emerald-400 rounded-2xl pointer-events-none flex flex-col justify-between p-2.5">
              <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-md self-start">Alinea documento aquí</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-md self-end">{camaraActiva.toUpperCase()}</span>
            </div>
            <div className="w-full bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center">
              <button type="button" onClick={detenerCamara} className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 rounded-xl transition">Cancelar</button>
              <button type="button" onClick={() => capturarFoto(camaraActiva)} className="text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Capturar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO */}
      <form onSubmit={fase === 4 ? handleSubmitFinal : handleAvanzar} className="space-y-5 text-xs">
        
        {/* FASE 1 */}
        {fase === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Tipo de Documento Oficial *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('CEDULA'); setDatosIdentidad({...datosIdentidad, numeroDocumento: ''}); }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    tipoDocumento === 'CEDULA'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Cédula Dominicana
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('PASAPORTE'); setDatosIdentidad({...datosIdentidad, numeroDocumento: ''}); }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    tipoDocumento === 'PASAPORTE'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Pasaporte Extranjero
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Nombre Completo (como figura en ID) *</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input 
                  type="text" 
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="Ej: Rosa Altagracia Morales" 
                  value={datosIdentidad.nombre} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, nombre: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">{tipoDocumento === 'CEDULA' ? 'Cédula (11 dígitos sin guiones) *' : 'Pasaporte *'}</label>
                <div className="relative flex items-center">
                  <FileCheck2 className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input 
                    type="text" 
                    maxLength={tipoDocumento === 'CEDULA' ? 11 : 20} 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500 transition"
                    placeholder={tipoDocumento === 'CEDULA' ? '40200000000' : 'A12345678'} 
                    value={datosIdentidad.numeroDocumento} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, numeroDocumento: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Fecha de Nacimiento *</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white outline-none focus:border-emerald-500 transition"
                  value={datosIdentidad.fechaNacimiento} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, fechaNacimiento: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">WhatsApp Personal *</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input 
                    type="tel" 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500 transition"
                    placeholder="809-555-0000" 
                    value={datosIdentidad.telefonoWhatsapp} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, telefonoWhatsapp: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Teléfono Secundario</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input 
                    type="tel" 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500 transition"
                    placeholder="Opcional" 
                    value={datosIdentidad.telefonoSecundario} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, telefonoSecundario: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* DOMICILIO RESIDENCIAL */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Home className="w-4 h-4" />
                <span>Domicilio Residencial Verificado</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Dirección Exacta (Calle, No., Edif./Apto.) *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="Ej: C/ Mella #45, Edif. Real III, Apto 2-A" 
                  value={datosIdentidad.direccionCalle} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, direccionCalle: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Sector / Barrio *</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    placeholder="Ej: Ensanche Ozama" 
                    value={datosIdentidad.sector} 
                    onChange={e => setDatosIdentidad({...datosIdentidad, sector: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Municipio / Provincia *</label>
                  <select 
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white outline-none focus:border-emerald-500 transition cursor-pointer"
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
            </div>

            {/* CONTACTO DE EMERGENCIA */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Contacto de Emergencia Inmediato *</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input 
                  type="text" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="Nombre y apellido" 
                  value={datosIdentidad.contactoEmergenciaNombre} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, contactoEmergenciaNombre: e.target.value})} 
                />
                <input 
                  type="text" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="Parentesco (Ej: Hermano)" 
                  value={datosIdentidad.contactoEmergenciaParentesco} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, contactoEmergenciaParentesco: e.target.value})} 
                />
                <input 
                  type="tel" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500 transition"
                  placeholder="Teléfono directo" 
                  value={datosIdentidad.contactoEmergenciaTelefono} 
                  onChange={e => setDatosIdentidad({...datosIdentidad, contactoEmergenciaTelefono: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}

        {/* FASE 2 */}
        {fase === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-300 font-bold block">1. Escaneo de Documento de Identidad *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-dashed border-slate-800 bg-slate-900/40 rounded-2xl p-4 text-center flex flex-col justify-between items-center min-h-[170px]">
                  {previewFrontal ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img src={previewFrontal} alt="Frontal" className="h-24 w-full object-cover rounded-xl border border-slate-700" />
                      <button type="button" onClick={() => setPreviewFrontal(null)} className="text-[11px] text-rose-400 font-bold hover:underline">Cambiar foto</button>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 text-slate-500 mb-1" />
                      <p className="font-bold text-slate-200">Lado Frontal</p>
                      <div className="flex gap-2 w-full mt-2">
                        <button type="button" onClick={() => iniciarCamara('frontal')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Cámara
                        </button>
                        <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Subir
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'frontal')} />
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <div className="border border-dashed border-slate-800 bg-slate-900/40 rounded-2xl p-4 text-center flex flex-col justify-between items-center min-h-[170px]">
                  {previewDorsal ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img src={previewDorsal} alt="Dorsal" className="h-24 w-full object-cover rounded-xl border border-slate-700" />
                      <button type="button" onClick={() => setPreviewDorsal(null)} className="text-[11px] text-rose-400 font-bold hover:underline">Cambiar foto</button>
                    </div>
                  ) : (
                    <>
                      <FileCheck2 className="w-8 h-8 text-slate-500 mb-1" />
                      <p className="font-bold text-slate-200">Lado Posterior</p>
                      <div className="flex gap-2 w-full mt-2">
                        <button type="button" onClick={() => iniciarCamara('dorsal')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Cámara
                        </button>
                        <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Subir
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'dorsal')} />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">2. Comprobante de Domicilio *</label>
              <label className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                <span className="text-slate-400 truncate">{comprobanteDomicilio ? `✓ ${comprobanteDomicilio.name}` : 'Adjuntar PDF o Foto de Factura'}</span>
                <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setComprobanteDomicilio(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-slate-300 font-bold block">3. Certificado No Antecedentes PGR *</label>
              <label className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                <span className="text-slate-400 truncate">{certAntecedentes ? `✓ ${certAntecedentes.name}` : 'Adjuntar Certificado Oficial PGR'}</span>
                <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertAntecedentes(e.target.files?.[0] || null)} />
              </label>
              {certAntecedentes && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Fecha de emisión del certificado:</span>
                  <input type="date" value={fechaAntecedentes} onChange={(e) => setFechaAntecedentes(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">4. Diploma de Bachiller *</label>
              <label className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
                <span className="text-slate-400 truncate">{certBachiller ? `✓ ${certBachiller.name}` : 'Adjuntar Diploma de Bachiller'}</span>
                <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertBachiller(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-slate-300 font-bold block">5. Certificado JUNTOS Academia *</label>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2">
                <input 
                  type="text" 
                  value={codigoAcademia} 
                  onChange={(e) => setCodigoAcademia(e.target.value)} 
                  placeholder="Código de acreditación (Ej: JACAD-2026-XXXX)" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono uppercase outline-none focus:border-emerald-500"
                />
                <label className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl block text-center cursor-pointer transition shadow-md shadow-emerald-500/20">
                  {certAcademia ? `✓ ${certAcademia.name}` : 'Adjuntar Diploma Academia'}
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setCertAcademia(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* FASE 3 */}
        {fase === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Experiencia en Acompañamiento o Cuidado *</label>
              <select 
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white outline-none focus:border-emerald-500 transition cursor-pointer"
                value={datosLaborales.experienciaAnios} 
                onChange={e => setDatosLaborales({...datosLaborales, experienciaAnios: e.target.value})}
              >
                <option value="0-1">Menos de 1 año</option>
                <option value="1-3">1 a 3 años de experiencia</option>
                <option value="3-5">3 a 5 años de experiencia</option>
                <option value="5+">Más de 5 años de experiencia</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-emerald-400 font-bold block">Referencia Laboral 1 *</span>
              <input 
                type="text" 
                placeholder="Nombre supervisor / empleador" 
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                value={datosLaborales.refLab1Nombre}
                onChange={e => setDatosLaborales({...datosLaborales, refLab1Nombre: e.target.value})}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Empresa o Familia" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  value={datosLaborales.refLab1Empresa}
                  onChange={e => setDatosLaborales({...datosLaborales, refLab1Empresa: e.target.value})}
                />
                <input 
                  type="tel" 
                  placeholder="Teléfono directo" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500 transition"
                  value={datosLaborales.refLab1Telefono}
                  onChange={e => setDatosLaborales({...datosLaborales, refLab1Telefono: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-emerald-400 font-bold block">Referencia Personal *</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Nombre completo" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  value={datosLaborales.refPers1Nombre}
                  onChange={e => setDatosLaborales({...datosLaborales, refPers1Nombre: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Relación (Ej: Vecino)" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  value={datosLaborales.refPers1Relacion}
                  onChange={e => setDatosLaborales({...datosLaborales, refPers1Relacion: e.target.value})}
                />
                <input 
                  type="tel" 
                  placeholder="Teléfono" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 font-mono outline-none focus:border-emerald-500 transition"
                  value={datosLaborales.refPers1Telefono}
                  onChange={e => setDatosLaborales({...datosLaborales, refPers1Telefono: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CreditCard className="w-4 h-4" />
                <span>Cuenta Bancaria para Pago de Servicios</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  value={datosLaborales.bancoDestino}
                  onChange={e => setDatosLaborales({...datosLaborales, bancoDestino: e.target.value})}
                >
                  <option value="Banreservas">Banreservas</option>
                  <option value="Banco Popular">Banco Popular</option>
                  <option value="Banco BHD">Banco BHD</option>
                  <option value="Asociación Popular">APAP</option>
                  <option value="Scotiabank">Scotiabank</option>
                </select>
                <select 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  value={datosLaborales.tipoCuenta}
                  onChange={e => setDatosLaborales({...datosLaborales, tipoCuenta: e.target.value})}
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
                <input 
                  type="text" 
                  placeholder="No. de Cuenta" 
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-white font-mono outline-none focus:border-emerald-500 transition"
                  value={datosLaborales.numeroCuentaBanco}
                  onChange={e => setDatosLaborales({...datosLaborales, numeroCuentaBanco: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {/* FASE 4 */}
        {fase === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Correo Electrónico Oficial *</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input 
                  type="email" 
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="correo@ejemplo.com"
                  value={credenciales.email}
                  onChange={e => setCredenciales({...credenciales, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Contraseña de acceso *</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input 
                  type="password" 
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="Mínimo 6 caracteres"
                  value={credenciales.password}
                  onChange={e => setCredenciales({...credenciales, password: e.target.value})}
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-[11px] text-slate-400 leading-relaxed text-justify">
              Autorizo expresamente a <strong className="text-white">JUNTOS ASISTENCIA RD</strong> a verificar la autenticidad de mis antecedentes penales ante la Procuraduría General de la República (PGR), validar mis referencias personales y certificar mis credenciales de conformidad con las <strong className="text-white">Leyes 172-13</strong> y <strong className="text-white">126-02</strong>.
            </div>

            <div className="border border-slate-800 bg-slate-950/80 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[140px] text-center">
              {!firma ? (
                <button 
                  type="button" 
                  onClick={() => setFirma(true)} 
                  className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold px-6 py-3 rounded-xl text-xs hover:bg-emerald-900/50 transition flex items-center gap-2"
                >
                  ✍ Estampar Firma Digital Electrónica
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl italic text-emerald-400 font-serif border-b border-slate-800 pb-1">
                    {datosIdentidad.nombre || 'Firma Registrada'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    DOC: {datosIdentidad.numeroDocumento || '---'} • FECHA: {new Date().toLocaleDateString()}
                  </span>
                  <button type="button" onClick={() => setFirma(false)} className="text-[11px] text-rose-400 underline font-bold mt-1">
                    Borrar y firmar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAVEGACIÓN */}
        <div className="flex gap-3 pt-3">
          {fase > 1 && (
            <button 
              type="button" 
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-3.5 rounded-xl transition flex items-center gap-1.5" 
              onClick={() => { setErrorMsg(''); setFase(fase - 1); }}
            >
              <ArrowLeft className="w-4 h-4" /> Atrás
            </button>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>
              {loading 
                ? 'Procesando expediente...' 
                : fase === 4 
                ? 'Firmar y Enviar Expediente a RRHH' 
                : 'Continuar a Siguiente Fase'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
}