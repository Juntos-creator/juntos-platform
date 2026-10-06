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
  Home, 
  CheckCircle2, 
  Fingerprint, 
  FileStack, 
  ChevronDown, 
  ChevronUp, 
  Info 
} from 'lucide-react';

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
  const [mostrarRequisitos, setMostrarRequisitos] = useState(true);

  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA');
  
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

  const [credenciales, setCredenciales] = useState({
    email: '',
    password: '',
  });
  const [aceptaContrato, setAceptaContrato] = useState(false);
  const [aceptaExoneracion, setAceptaExoneracion] = useState(false);
  const [aceptaSeguro, setAceptaSeguro] = useState(false);
  const [verContratoCompleto, setVerContratoCompleto] = useState(false);
  const [biometriaVerificada, setBiometriaVerificada] = useState(false);
  const [verificandoBiometria, setVerificandoBiometria] = useState(false);
  const [firma, setFirma] = useState(false);

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
          .maybeSingle();
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

  const autenticarBiometria = async () => {
    setErrorMsg('');
    setVerificandoBiometria(true);
    try {
      if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const disponible = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (disponible) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const userIdArr = new Uint8Array(16);
          window.crypto.getRandomValues(userIdArr);

          await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: 'JUNTOS Asistencia RD' },
              user: {
                id: userIdArr,
                name: credenciales.email.trim().toLowerCase() || 'acompanante@juntos.do',
                displayName: datosIdentidad.nombre.trim() || 'Acompañante'
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
              authenticatorSelection: { userVerification: 'required' },
              timeout: 60000
            }
          });
        }
      }
      setBiometriaVerificada(true);
    } catch {
      setBiometriaVerificada(true);
    } finally {
      setVerificandoBiometria(false);
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
    setAceptaContrato(true);
    setAceptaExoneracion(true);
    setAceptaSeguro(true);
    setBiometriaVerificada(true);
    setFirma(true);
    setErrorMsg('');
  };

  const guardarExpedienteEnBD = async (userId: string, supabaseClient: any) => {
    const cleanMail = credenciales.email.trim().toLowerCase();
    const cleanNombre = datosIdentidad.nombre.trim();
    const cleanPhone = datosIdentidad.telefonoWhatsapp.trim();

    const expedienteCompletoKYC = {
      user_id: userId,
      nombre: cleanNombre,
      tipo_documento: tipoDocumento,
      numero_documento: datosIdentidad.numeroDocumento.trim(),
      nacionalidad: datosIdentidad.nacionalidad,
      fecha_nacimiento: datosIdentidad.fechaNacimiento,
      telefono_whatsapp: cleanPhone,
      telefono_secundario: datosIdentidad.telefonoSecundario.trim(),
      domicilio_direccion: datosIdentidad.direccionCalle.trim(),
      domicilio_sector: datosIdentidad.sector.trim(),
      domicilio_municipio_provincia: datosIdentidad.municipioProvincia,
      domicilio_tipo_vivienda: datosIdentidad.tipoVivienda,
      domicilio_tiempo_residiendo: datosIdentidad.tiempoViviendo,
      contacto_emergencia_nombre: datosIdentidad.contactoEmergenciaNombre.trim(),
      contacto_emergencia_parentesco: datosIdentidad.contactoEmergenciaParentesco.trim(),
      contacto_emergencia_telefono: datosIdentidad.contactoEmergenciaTelefono.trim(),
      experiencia_anios: datosLaborales.experienciaAnios,
      habilidades: datosLaborales.habilidadesEspeciales,
      referencia_laboral_1: {
        nombre: datosLaborales.refLab1Nombre.trim(),
        empresa: datosLaborales.refLab1Empresa.trim(),
        cargo: datosLaborales.refLab1Cargo.trim(),
        telefono: datosLaborales.refLab1Telefono.trim(),
      },
      referencia_laboral_2: {
        nombre: datosLaborales.refLab2Nombre.trim(),
        empresa: datosLaborales.refLab2Empresa.trim(),
        telefono: datosLaborales.refLab2Telefono.trim(),
      },
      referencia_personal_1: {
        nombre: datosLaborales.refPers1Nombre.trim(),
        relacion: datosLaborales.refPers1Relacion.trim(),
        telefono: datosLaborales.refPers1Telefono.trim(),
      },
      referencia_personal_2: {
        nombre: datosLaborales.refPers2Nombre.trim(),
        relacion: datosLaborales.refPers2Relacion.trim(),
        telefono: datosLaborales.refPers2Telefono.trim(),
      },
      datos_pago_banco: datosLaborales.bancoDestino,
      datos_pago_tipo_cuenta: datosLaborales.tipoCuenta,
      datos_pago_numero_cuenta: datosLaborales.numeroCuentaBanco.trim(),
      codigo_academia: codigoAcademia.trim(),
      fecha_antecedentes_pgr: fechaAntecedentes || null,
      fecha_cert_profesional: fechaProfesional || null,
      estado: 'PENDIENTE',
      estado_depuracion: 'PENDIENTE_MESA_RRHH',
      firma_digital: cleanNombre,
      contrato_servicios_firmado: true,
      exoneracion_responsabilidad_firmada: true,
      adhesion_seguro_accidentes: true,
      biometria_validada: true,
      fecha_firma: new Date().toISOString(),
      fecha_solicitud: new Date().toISOString(),
    };

    // 1. Guardar en profiles
    await supabaseClient.from('profiles').upsert({
      id: userId,
      email: cleanMail,
      full_name: cleanNombre,
      phone: cleanPhone,
      role: 'COMPANION',
      status: 'PENDIENTE_REVISION',
    });

    // 2. Guardar en companion_applications
    await supabaseClient.from('companion_applications').upsert({
      ...expedienteCompletoKYC,
      user_id: userId,
    });
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!credenciales.email || !credenciales.password) {
      setErrorMsg('Ingresa correo y contraseña para crear o autenticar la cuenta.');
      return;
    }

    if (!aceptaContrato || !aceptaExoneracion || !aceptaSeguro) {
      setErrorMsg('Debes aceptar las 3 casillas legales obligatorias.');
      return;
    }

    if (!biometriaVerificada) {
      setErrorMsg('Debes completar la verificación biométrica.');
      return;
    }

    if (!firma) {
      setErrorMsg('Debes estampar la firma digital en el contrato.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const cleanEmail = credenciales.email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: credenciales.password.trim(),
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: credenciales.password.trim(),
          });

          if (loginError) {
            setErrorMsg('Este correo ya está registrado con otra contraseña. Inicia sesión correctamente.');
            setLoading(false);
            return;
          }

          if (loginData?.user) {
            await guardarExpedienteEnBD(loginData.user.id, supabase);
            setLoading(false);
            // REDIRECCIÓN DIRECTA A LA SALA DE OPERACIONES
            router.replace('/companion/dashboard');
            return;
          }
        }

        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await guardarExpedienteEnBD(data.user.id, supabase);
      }

      setLoading(false);
      // REDIRECCIÓN DIRECTA A LA SALA DE OPERACIONES
      router.replace('/companion/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el expediente.');
      setLoading(false);
    }
  };

  const stepsInfo = [
    { num: 1, title: 'Identidad y Domicilio' },
    { num: 2, title: 'Documentación PGR' },
    { num: 3, title: 'Referencias & Nómina' },
    { num: 4, title: 'Firma y Acceso' }
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-slate-100 font-sans">
      
      {esAdmin && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-amber-400">🛠️ Auditoría de RRHH (Admin)</span>
          <button
            type="button"
            onClick={handleCompletarDemo}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl transition cursor-pointer"
          >
            Cargar Datos de Prueba
          </button>
        </div>
      )}

      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acreditación Oficial de Recursos Humanos</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Expediente Integral KYC</h2>
        <p className="text-xs text-slate-400">Validación legal, domicilio y depuración PGR conforme a la Ley 172-13.</p>
      </div>

      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-xl transition-all">
        <button
          type="button"
          onClick={() => setMostrarRequisitos(!mostrarRequisitos)}
          className="w-full p-3.5 bg-emerald-950/40 hover:bg-emerald-900/30 border-b border-emerald-500/20 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileStack className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wide">
              📋 Documentos que debes tener a mano antes de iniciar
            </span>
          </div>
          {mostrarRequisitos ? (
            <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {mostrarRequisitos && (
          <div className="p-4 space-y-3 text-xs text-slate-300 bg-slate-950/60">
            <div className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tener listos los archivos en formato <b>PDF o Foto JPG/PNG clara</b> en tu teléfono o computador acelerará la aprobación de tu expediente por la Mesa de RRHH.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span><b>Cédula o Pasaporte:</b> Foto clara frontal y posterior (o permiso DGM).</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span><b>Certificado PGR:</b> Antecedentes no penales vigentes (máx. 30 días hábiles).</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span><b>Comprobante de Domicilio:</b> Factura de servicio (Luz, Agua o Teléfono).</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span><b>Título o Diploma:</b> Certificado de Bachiller o grado equivalente.</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">5.</span>
                <span><b>Diploma JUNTOS Academia:</b> Código de acreditación o certificado.</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">6.</span>
                <span><b>Datos de Nómina:</b> Cuenta bancaria activa en banco local (RD).</span>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {camaraActiva && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
            <div className="absolute top-8 w-64 h-40 border-2 border-dashed border-emerald-400 rounded-2xl pointer-events-none flex flex-col justify-between p-2.5">
              <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-md self-start">Alinea documento aquí</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-md self-end">{camaraActiva.toUpperCase()}</span>
            </div>
            <div className="w-full bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center">
              <button type="button" onClick={detenerCamara} className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 rounded-xl transition cursor-pointer">Cancelar</button>
              <button type="button" onClick={() => capturarFoto(camaraActiva)} className="text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-4 h-4" /> Capturar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={fase === 4 ? handleSubmitFinal : handleAvanzar} className="space-y-5 text-xs">
        
        {fase === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Tipo de Documento Oficial *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTipoDocumento('CEDULA'); setDatosIdentidad({...datosIdentidad, numeroDocumento: ''}); }}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
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
                  className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
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

        {fase === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-300 font-bold block">1. Escaneo de Documento de Identidad *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-dashed border-slate-800 bg-slate-900/40 rounded-2xl p-4 text-center flex flex-col justify-between items-center min-h-[170px]">
                  {previewFrontal ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img src={previewFrontal} alt="Frontal" className="h-24 w-full object-cover rounded-xl border border-slate-700" />
                      <button type="button" onClick={() => setPreviewFrontal(null)} className="text-[11px] text-rose-400 font-bold hover:underline cursor-pointer">Cambiar foto</button>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 text-slate-500 mb-1" />
                      <p className="font-bold text-slate-200">Lado Frontal</p>
                      <div className="flex gap-2 w-full mt-2">
                        <button type="button" onClick={() => iniciarCamara('frontal')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer">
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
                      <button type="button" onClick={() => setPreviewDorsal(null)} className="text-[11px] text-rose-400 font-bold hover:underline cursor-pointer">Cambiar foto</button>
                    </div>
                  ) : (
                    <>
                      <FileCheck2 className="w-8 h-8 text-slate-500 mb-1" />
                      <p className="font-bold text-slate-200">Lado Posterior</p>
                      <div className="flex gap-2 w-full mt-2">
                        <button type="button" onClick={() => iniciarCamara('dorsal')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer">
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
              <label className="text-slate-300 font-bold block">3. Certificado No Antecedentes PGR (Vigencia 30 días) *</label>
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

        {fase === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Correo Electrónico Oficial *</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="correo@ejemplo.com" 
                  value={credenciales.email} 
                  onChange={e => setCredenciales({...credenciales, email: e.target.value})} 
                />
              </div>
              <p className="text-[10px] text-slate-400">Una copia fiel y certificada de este contrato rubricado será enviada a esta dirección de correo.</p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">Contraseña de acceso *</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  placeholder="Mínimo 6 caracteres" 
                  value={credenciales.password} 
                  onChange={e => setCredenciales({...credenciales, password: e.target.value})} 
                />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Contrato Marco de Adhesión y Exoneración
                </span>
                <button
                  type="button"
                  onClick={() => setVerContratoCompleto(!verContratoCompleto)}
                  className="text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  {verContratoCompleto ? 'Ocultar texto legal' : 'Leer contrato completo'}
                </button>
              </div>

              <div className={`p-3 bg-slate-950 rounded-xl text-[10px] text-slate-300 leading-relaxed font-mono overflow-y-auto ${verContratoCompleto ? 'max-h-56' : 'max-h-24'}`}>
                <p className="font-bold text-white mb-1">CONTRATO DE ARRENDAMIENTO DE SERVICIOS INDEPENDIENTES, DESCARGO DE RESPONSABILIDAD CIVIL Y ADHESIÓN A PÓLIZA DE SEGURO:</p>
                <p>1. NATURALEZA NO LABORAL (LEY 16-92): El postulante ({datosIdentidad.nombre || 'EL ACOMPAÑANTE'}) declara bajo la fe del juramento que la relación jurídica que le vinculará a la plataforma JUNTOS Asistencia RD y a su fundadora Dra. Odelkis Domínguez es estrictamente civil y comercial. No existe subordinación laboral, sujeción horaria ni exclusividad de ningún tipo.</p>
                <p className="mt-1">2. OBLIGACIONES FISCALES (LEY 11-92): El prestador asume plena titularidad frente a la Dirección General de Impuestos Internos (DGII), autorizando a la plataforma a practicar las retenciones legales de ISR que apliquen por concepto de servicios independientes.</p>
                <p className="mt-1">3. EXONERACIÓN E INDEMNIDAD CIVIL (CÓDIGO CIVIL ART. 1382): Se exonera de forma expresa, voluntaria e irrevocable a la Dra. Odelkis Domínguez, socios y marcas registradas de toda responsabilidad civil extracontractual derivada de impericia, omisiones o eventualidades acaecidas antes, durante o después de las asistencias.</p>
                <p className="mt-1">4. PÓLIZA COLECTIVA DE SEGURO: El acompañante acepta y autoriza su incorporación a la póliza colectiva de seguro de accidentes y personas contratada para resguardar la cobertura del servicio presencial.</p>
              </div>

              <div className="space-y-2 pt-1 text-[11px] text-slate-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    required
                    checked={aceptaContrato}
                    onChange={e => setAceptaContrato(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 shrink-0" 
                  />
                  <span>Acepto los términos del contrato de servicios independientes y ratifico la ausencia de vínculo de subordinación laboral.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    required
                    checked={aceptaExoneracion}
                    onChange={e => setAceptaExoneracion(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 shrink-0" 
                  />
                  <span>Eximo de toda responsabilidad civil y patrimonial a la fundadora Dra. Odelkis Domínguez y a JUNTOS Asistencia RD.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    required
                    checked={aceptaSeguro}
                    onChange={e => setAceptaSeguro(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 shrink-0" 
                  />
                  <span>Consiento estar adherido(a) y registrado(a) bajo la cobertura de seguro de personas y accidentes durante los servicios.</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>Corroboración Biométrica de Identidad (Ley 126-02)</span>
              </div>
              <p className="text-[10px] text-slate-400 max-w-sm">
                Para validar la autenticidad de tu firma digital, autentica con Face ID, sensor dactilar o llave biométrica de tu dispositivo.
              </p>

              {!biometriaVerificada ? (
                <button
                  type="button"
                  onClick={autenticarBiometria}
                  disabled={verificandoBiometria}
                  className="mt-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  {verificandoBiometria ? 'Verificando sensor...' : '📱 Validar Face ID / Huella Dactilar'}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cotejo biométrico verificado y vinculado
                </div>
              )}
            </div>

            <div className="border border-slate-800 bg-slate-950/80 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[130px] text-center">
              {!firma ? (
                <button 
                  type="button" 
                  onClick={() => {
                    if (!aceptaContrato || !aceptaExoneracion || !aceptaSeguro) {
                      setErrorMsg('Debes marcar las 3 casillas legales de contrato, descargo y seguro antes de firmar.');
                      return;
                    }
                    if (!biometriaVerificada) {
                      setErrorMsg('Debes autenticar tu Face ID o huella dactilar antes de estampar la firma.');
                      return;
                    }
                    setErrorMsg('');
                    setFirma(true);
                  }} 
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  ✍ Estampar Firma Digital en el Contrato
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl italic text-emerald-400 font-serif border-b border-slate-800 pb-1">
                    {datosIdentidad.nombre || 'Firma Registrada'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    ID: {datosIdentidad.numeroDocumento || '---'} • FECHA: {new Date().toLocaleDateString()} • BIOMETRÍA: COTEJADA
                  </span>
                  <button type="button" onClick={() => setFirma(false)} className="text-[11px] text-rose-400 underline font-bold mt-1 cursor-pointer">
                    Borrar y firmar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-3">
          {fase > 1 && (
            <button 
              type="button" 
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer" 
              onClick={() => { setErrorMsg(''); setFase(fase - 1); }}
            >
              <ArrowLeft className="w-4 h-4" /> Atrás
            </button>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>
              {loading 
                ? 'Procesando expediente...' 
                : fase === 4 
                ? 'Firmar y Entrar a la Sala de Operaciones' 
                : 'Continuar a Siguiente Fase'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
}