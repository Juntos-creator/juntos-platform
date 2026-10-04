'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { 
  Stethoscope, 
  ShieldCheck, 
  Building2, 
  HeartPulse, 
  UserCheck, 
  CheckCircle2, 
  FileText, 
  Phone, 
  MapPin, 
  Award, 
  ArrowRight,
  ShieldPlus,
  Landmark
} from 'lucide-react';

export default function RegisterB2BPage() {
  const [partnerType, setPartnerType] = useState<'DOCTOR' | 'ARS'>('DOCTOR');

  // Campos Médico
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Geriatría');
  const [exequatur, setExequatur] = useState('');
  const [clinicOrHospital, setClinicOrHospital] = useState('');
  const [consultationRoom, setConsultationRoom] = useState('');

  // Campos ARS
  const [arsName, setArsName] = useState('Primera ARS');
  const [customArsName, setCustomArsName] = useState('');
  const [rnc, setRnc] = useState('');
  const [department, setDepartment] = useState('Planes Complementarios y Preventivos');

  // Campos comunes
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Santo Domingo (Distrito Nacional)');

  const [loading, setLoading] = useState(false);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const finalArsName = arsName === 'OTRA' ? customArsName : arsName;

    try {
      const res = await fetch('/api/b2b/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerType,
          doctorName,
          specialty,
          exequatur,
          clinicOrHospital,
          consultationRoom,
          arsName: finalArsName,
          rnc,
          department,
          phone,
          email,
          city
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRegisteredCode(data.partnerCode);
    } catch (err: any) {
      alert(`Error al registrar convenio: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        
        {/* ENCABEZADO INSTITUCIONAL B2B */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-slate-950 border border-emerald-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-mono font-bold">
            <ShieldPlus className="w-4 h-4" />
            <span>ALIANZAS B2B • MÉDICOS & ARS • JUNTOS ASISTENCIA RD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Convenios Institucionales con Médicos y ARS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Acuerdos estratégicos diseñados para <strong>Médicos Especialistas</strong> (Emergenciología, Geriatría, Medicina Familiar) y <strong>Administradoras de Riesgos de Salud (ARS)</strong> para brindar cobertura de acompañamiento certificado a pacientes crónicos y adultos mayores.
          </p>
        </div>

        {/* SELECTOR DE TIPO DE CONVENIO (MÉDICO VS ARS) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setPartnerType('DOCTOR'); setRegisteredCode(null); }}
            className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
              partnerType === 'DOCTOR'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>1. Médicos Especialistas</span>
          </button>

          <button
            type="button"
            onClick={() => { setPartnerType('ARS'); setRegisteredCode(null); }}
            className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
              partnerType === 'ARS'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. ARS / Aseguradoras de Salud</span>
          </button>
        </div>

        {/* PILARES INFORMATIVOS */}
        {partnerType === 'DOCTOR' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Médicos Emergenciólogos</h3>
              <p className="text-xs text-slate-400">
                Garantiza el traslado seguro y monitoreado a casa tras altas en salas de emergencia.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Médicos Geriatras</h3>
              <p className="text-xs text-slate-400">
                Acompañamiento recurrente para pacientes de la tercera edad a consultas, laboratorios y terapias.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Médicos Familiares</h3>
              <p className="text-xs text-slate-400">
                Coordinación continua con reporte de asistencia en vivo para familiares en el país y la Diáspora.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Planes Complementarios</h3>
              <p className="text-xs text-slate-400">
                Inclusión del acompañamiento asistencial como beneficio diferenciador en planes premium y senior.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                <ShieldPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Pacientes Crónicos</h3>
              <p className="text-xs text-slate-400">
                Disminución de citas médicas perdidas y mayor adherencia terapéutica en diálisis, oncología y rehabilitación.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Trazabilidad y NCF</h3>
              <p className="text-xs text-slate-400">
                Facturación fiscal B2B conforme a la DGII y validación de horas por doble PIN antifraude.
              </p>
            </div>
          </div>
        )}

        {/* CONFIRMACIÓN DE CONVENIO EXITOSO */}
        {registeredCode ? (
          <div className="bg-slate-950 border border-emerald-500/50 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                ¡CONVENIO {partnerType === 'ARS' ? 'ARS' : 'MÉDICO'} FORMALIZADO!
              </span>
              <h2 className="text-2xl font-black text-white">
                {partnerType === 'ARS' ? (arsName === 'OTRA' ? customArsName : arsName) : `Dr(a). ${doctorName}`}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                El convenio institucional ha sido registrado en la Mesa Central de JUNTOS ASISTENCIA RD.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 max-w-sm mx-auto p-4 rounded-2xl space-y-1 text-center">
              <span className="text-[11px] text-slate-400 font-bold block">Código Institucional de Referencia:</span>
              <span className="font-mono text-3xl font-black text-emerald-400 tracking-widest">{registeredCode}</span>
              <p className="text-[10px] text-slate-500">
                {partnerType === 'ARS' 
                  ? 'Tus afiliados podrán ingresar este código para validar cobertura preferencial.' 
                  : 'Tus pacientes podrán indicar este código para agendar con tu referencia médica.'}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/services/new"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
              >
                <span>Solicitar Servicio con este Convenio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* FORMULARIO DINÁMICO */
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>
                  {partnerType === 'DOCTOR' ? 'Formulario de Registro Profesional CMD' : 'Formulario de Convenio ARS'}
                </span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                {partnerType === 'DOCTOR' ? 'EXEQUÁTUR MÉDICO' : 'COBERTURA EN SALUD RD'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* CAMPOS EXCLUSIVOS DE MÉDICO */}
              {partnerType === 'DOCTOR' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Nombre completo del Médico *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Dr. Ramón Emilio Pérez"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Especialidad Médica *</label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition font-bold"
                      >
                        <option value="Emergenciología">Emergenciología (Médico Emergenciólogo)</option>
                        <option value="Geriatría">Geriatría (Médico Geriatra)</option>
                        <option value="Medicina Familiar">Medicina Familiar y Comunitaria</option>
                        <option value="Medicina Interna">Medicina Interna</option>
                        <option value="Cardiología">Cardiología</option>
                        <option value="Neurología">Neurología</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">No. de Exequátur CMD *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 45892-21"
                        value={exequatur}
                        onChange={(e) => setExequatur(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-mono transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Centro Médico / Hospital donde Ejerce *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: CEDIMAT / Plaza de la Salud / HOMS"
                        value={clinicOrHospital}
                        onChange={(e) => setClinicOrHospital(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CAMPOS EXCLUSIVOS DE ARS */}
              {partnerType === 'ARS' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Seleccionar ARS *</label>
                      <select
                        value={arsName}
                        onChange={(e) => setArsName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition font-bold"
                      >
                        <option value="Primera ARS">Primera ARS</option>
                        <option value="ARS SeNaSa (Régimen Contributivo / Subsidiado)">ARS SeNaSa</option>
                        <option value="ARS MAPFRE">ARS MAPFRE</option>
                        <option value="ARS Universal">ARS Universal</option>
                        <option value="ARS Futuro">ARS Futuro</option>
                        <option value="ARS Monumental">ARS Monumental</option>
                        <option value="ARS Renacer">ARS Renacer</option>
                        <option value="ARS Simag">ARS Simag</option>
                        <option value="OTRA">Otra Administradora de Salud</option>
                      </select>
                    </div>

                    {arsName === 'OTRA' ? (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-300">Nombre de la ARS *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nombre oficial de la ARS"
                          value={customArsName}
                          onChange={(e) => setCustomArsName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-300">RNC Institucional de la ARS *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: 1-01-00000-0"
                          value={rnc}
                          onChange={(e) => setRnc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 font-mono transition"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Departamento o Programa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Gerencia de Planes Complementarios / Atención Domiciliaria"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </>
              )}

              {/* CAMPOS COMUNES DE CONTACTO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Teléfono / Flota de Contacto *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 809-555-0188"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Correo Electrónico Corporativo *</label>
                  <input
                    type="email"
                    required
                    placeholder="contacto@institucion.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Jurisdicción / Sede *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Santo Domingo (Distrito Nacional)">Santo Domingo (Distrito Nacional)</option>
                    <option value="Santo Domingo Este">Santo Domingo Este</option>
                    <option value="Santiago de los Caballeros">Santiago de los Caballeros</option>
                    <option value="Cobertura Nacional RD">Cobertura Nacional RD</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  <span>
                    {loading 
                      ? 'Procesando...' 
                      : partnerType === 'ARS' 
                      ? 'Formalizar Convenio con ARS' 
                      : 'Formalizar Convenio Médico'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}