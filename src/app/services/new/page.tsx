'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  User, 
  Users, 
  HeartHandshake, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Tag, 
  Stethoscope,
  Home,
  Activity,
  Navigation,
  ExternalLink,
  LocateFixed
} from 'lucide-react';

function ServiceBookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [locating, setLocating] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Beneficio de descuento
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Form Data State
  const [formData, setFormData] = useState({
    // Paso 1: Beneficiario
    forWhom: 'FAMILY', // 'SELF' | 'FAMILY' | 'OTHER'
    recipientName: '',
    recipientPhone: '',

    // Paso 2: Tipo de Servicio
    serviceType: 'CLINIC_APPOINTMENT',
    
    // Paso 3: Ubicación y centro
    facilityName: 'CEDIMAT',
    city: 'Distrito Nacional (Santo Domingo)',
    address: '',

    // Paso 4: Fecha y Hora
    serviceDate: '',
    serviceTime: '08:00',

    // Paso 5: Duración
    hours: 3,

    // Paso 6: Geolocalización GPS y Punto de Mapa (Google Maps / Diáspora)
    geoLat: '',
    geoLng: '',
    mapsUrl: '',
    mobilitySupport: 'NONE',
    specialInstructions: '',

    // Paso 7: Contacto Familiar Responsable
    contactName: '',
    contactPhone: '',
    relationship: 'Hijo(a)',

    // Paso 8: Facturación
    requiresNCF: false,
    rncOrCedula: '',
    fiscalName: '',

    // Paso 9: Método
    paymentMethod: 'CARD_ONLINE'
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login?redirect=/services/new');
          return;
        }

        setUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, phone')
          .eq('id', user.id)
          .maybeSingle();

        const hasUrlDiscount = searchParams.get('discount') === '5';
        if (profile?.role === 'COMPANION' || hasUrlDiscount) {
          setDiscountPercent(5);
        }

        setFormData(prev => ({
          ...prev,
          contactName: profile?.full_name || prev.contactName,
          contactPhone: profile?.phone || prev.contactPhone,
        }));
      } catch (err) {
        console.warn('Error al verificar sesión:', err);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router, searchParams, supabase]);

  const RATE_PER_HOUR = 900;
  const subtotal = formData.hours * RATE_PER_HOUR;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  function updateField(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    // Si está en el Paso 4 y la fecha está vacía, asignar la fecha de hoy por defecto
    if (step === 4 && (!formData.serviceDate || formData.serviceDate.trim() === '')) {
      const today = new Date().toISOString().split('T')[0];
      updateField('serviceDate', today);
    }
    if (step < 9) setStep(step + 1);
  }

  function handlePrev() {
    if (step > 1) setStep(step - 1);
  }

  function handleGetDeviceLocation() {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización directa.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        updateField('geoLat', lat);
        updateField('geoLng', lng);
        updateField('mapsUrl', `https://www.google.com/maps?q=${lat},${lng}`);
        setLocating(false);
      },
      () => {
        alert('No se pudo obtener la señal GPS. Puedes buscar el punto en Google Maps RD y pegar el enlace.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmitService() {
    if (!user) {
      alert('Debes iniciar sesión para confirmar y despachar el acompañante.');
      window.location.href = '/login?redirect=/services/new';
      return;
    }

    // 1. Asegurar fecha válida en formato YYYY-MM-DD
    let validDate = formData.serviceDate;
    if (!validDate || validDate.trim() === '') {
      const today = new Date();
      validDate = today.toISOString().split('T')[0];
    }

    setLoading(true);

    try {
      const ubicacionConsolidada = `${formData.facilityName || 'Domicilio'}${formData.address ? ' - ' + formData.address : ''} (${formData.city})${formData.geoLat ? ` [GPS: ${formData.geoLat}, ${formData.geoLng}]` : ''}`;
      
      const recipientFinal = formData.forWhom === 'SELF' 
        ? (user.user_metadata?.full_name || user.email || 'Titular Solicitante') 
        : (formData.recipientName || 'Familiar');

      const notasConsolidadas = [
        `Supervisor/Contacto: ${formData.contactName || 'No especificado'} (${formData.contactPhone || 'Sin teléfono'}) [${formData.relationship}]`,
        `Movilidad: ${formData.mobilitySupport}`,
        formData.specialInstructions ? `Instrucciones: ${formData.specialInstructions}` : '',
        formData.mapsUrl ? `Punto Google Maps: ${formData.mapsUrl}` : '',
        formData.requiresNCF ? `NCF Solicitado: ${formData.fiscalName} (RNC: ${formData.rncOrCedula})` : '',
        discountAmount > 0 ? `Descuento Aplicado: RD$ ${discountAmount}` : ''
      ].filter(Boolean).join(' | ');

      const universalPayload: any = {
        user_id: user.id,
        customer_id: user.id,
        recipient_name: recipientFinal,
        recipient_phone: formData.recipientPhone || formData.contactPhone || 'N/A',
        service_type: formData.serviceType,
        facility_or_location: ubicacionConsolidada,
        scheduled_date: validDate,
        requested_date: validDate,
        scheduled_time: formData.serviceTime || '08:00',
        duration_hours: formData.hours,
        rate_total: total,
        special_notes: notasConsolidadas,
        mobility_notes: formData.mobilitySupport,
        status: 'PENDING_DISPATCH',
        emergency_status: 'NORMAL'
      };

      const { data, error } = await supabase
        .from('service_requests')
        .insert([universalPayload])
        .select('id')
        .single();

      let serviceId = data?.id;

      if (error) {
        console.warn('Primer intento falló, ejecutando inserción base:', error.message);
        
        const corePayload: any = {
          user_id: user.id,
          customer_id: user.id,
          recipient_name: recipientFinal,
          recipient_phone: formData.recipientPhone || formData.contactPhone || 'N/A',
          service_type: formData.serviceType,
          facility_or_location: ubicacionConsolidada,
          scheduled_date: validDate,
          requested_date: validDate,
          scheduled_time: formData.serviceTime || '08:00',
          duration_hours: formData.hours,
          rate_total: total,
          special_notes: notasConsolidadas
        };

        const { data: fallbackData, error: coreError } = await supabase
          .from('service_requests')
          .insert([corePayload])
          .select('id')
          .single();

        if (coreError) throw coreError;
        serviceId = fallbackData?.id;
      }

      // Redirección a la pantalla de éxito con los detalles del servicio
      if (serviceId) {
        window.location.href = `/services/success?id=${serviceId}`;
      } else {
        window.location.href = '/profile';
      }
    } catch (err: any) {
      alert(`Error al registrar el servicio: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Verificando sesión segura...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-20">
      <Navbar />

      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-500/10 via-slate-900/0 to-transparent pointer-events-none" />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-8 w-full relative z-10 space-y-6">
        
        {/* BARRA SUPERIOR */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {step}
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              PASO {step} DE 9
            </span>
          </div>

          <div className="flex items-center gap-2">
            {discountPercent > 0 && (
              <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Tag className="w-3 h-3" /> 5% DESC. FAMILIAR
              </span>
            )}
            <span className="bg-slate-950/90 border border-slate-800 text-amber-400 font-mono text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
              <span>RD$ 900/h</span>
            </span>
          </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 9) * 100}%` }}
          />
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ¿Para quién es el acompañamiento?
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Elige la persona que recibirá el apoyo humano:
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => updateField('forWhom', 'SELF')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    formData.forWhom === 'SELF'
                      ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-emerald-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Para mí (Yo mismo)</h4>
                      <p className="text-xs text-slate-400">Necesito que un acompañante me asista</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.forWhom === 'SELF' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                    {formData.forWhom === 'SELF' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('forWhom', 'FAMILY')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    formData.forWhom === 'FAMILY'
                      ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-emerald-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Para un familiar</h4>
                      <p className="text-xs text-slate-400">Mamá, Papá, Pareja o pariente cercano</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.forWhom === 'FAMILY' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                    {formData.forWhom === 'FAMILY' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('forWhom', 'OTHER')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    formData.forWhom === 'OTHER'
                      ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-emerald-400">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Para otra persona</h4>
                      <p className="text-xs text-slate-400">Amigo, allegado, vecino o colaborador</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.forWhom === 'OTHER' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                    {formData.forWhom === 'OTHER' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </button>
              </div>

              {formData.forWhom !== 'SELF' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Datos de la persona acompañada
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-800/40">
                      Requerido
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">Nombre completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.recipientName}
                        onChange={(e) => updateField('recipientName', e.target.value)}
                        placeholder="Ej: Doña Mercedes Altagracia"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">WhatsApp / Teléfono directo *</label>
                      <input
                        type="tel"
                        required
                        value={formData.recipientPhone}
                        onChange={(e) => updateField('recipientPhone', e.target.value)}
                        placeholder="Ej: 809-555-0199"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Modalidad del Acompañamiento
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Soporte personal y logístico estrictamente no clínico:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { id: 'CLINIC_APPOINTMENT', title: 'Consultas o Estudios Médicos', desc: 'Espera en sala, asistencia de movilidad y soporte en farmacia.', icon: Stethoscope },
                  { id: 'HOME_CARE', title: 'Asistencia y Compañía en Hogar', desc: 'Compañía activa, apoyo en movilidad dentro de casa y supervisión diurna.', icon: Home },
                  { id: 'HOSPITAL_DISCHARGE', title: 'Alta Médica o Procedimiento', desc: 'Soporte presencial en trámites de egreso y traslado de retorno.', icon: Activity },
                  { id: 'ERRANDS', title: 'Diligencias y Gestión Personal', desc: 'Acompañamiento a banco, compras o trámites cotidianos.', icon: HeartHandshake }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = formData.serviceType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateField('serviceType', item.id)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all ${
                        active 
                          ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ¿Dónde se brindará el servicio?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Indica la ciudad y el centro médico o sector de encuentro:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Ciudad / Municipio *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Distrito Nacional (Santo Domingo)">Distrito Nacional (Santo Domingo)</option>
                    <option value="Santo Domingo Este">Santo Domingo Este</option>
                    <option value="Santo Domingo Oeste">Santo Domingo Oeste</option>
                    <option value="Santo Domingo Norte">Santo Domingo Norte</option>
                    <option value="Santiago de los Caballeros">Santiago de los Caballeros</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Centro de Salud / Hospital o Referencia *</label>
                  <input
                    type="text"
                    value={formData.facilityName}
                    onChange={(e) => updateField('facilityName', e.target.value)}
                    placeholder="Ej: CEDIMAT, HOMS, Clínica Abreu o Domicilio"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Dirección o sector específico</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Ej: Calle Ramón A. Castillo No. 20, Ensanche Ozama"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Fecha y Hora de Inicio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  ¿Cuándo necesitas que el acompañante se presente?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Fecha del servicio *</label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={formData.serviceDate}
                      onChange={(e) => updateField('serviceDate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-white outline-none focus:border-emerald-500 transition [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Hora de inicio *</label>
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="time"
                      required
                      value={formData.serviceTime}
                      onChange={(e) => updateField('serviceTime', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-white outline-none focus:border-emerald-500 transition [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 5 */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Duración del Servicio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecciona la cantidad estimada de horas:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[2, 3, 4, 6, 8, 10, 12].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updateField('hours', h)}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      formData.hours === h
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl font-black block text-white">{h}h</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                      RD$ {(h * RATE_PER_HOUR).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <p className="text-slate-400">Total calculado para {formData.hours} horas:</p>
                  <p className="text-xl font-black text-white">RD$ {total.toLocaleString()}</p>
                </div>
                {discountPercent > 0 && (
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-600/40 px-3 py-1 rounded-xl text-xs">
                    Incluye 5% de descuento familiar
                  </span>
                )}
              </div>
            </div>
          )}

          {/* PASO 6 */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold mb-2">
                  <Navigation className="w-3.5 h-3.5" /> MAPA Y LOCALIZACIÓN EN REPÚBLICA DOMINICANA
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Punto de Encuentro y Movilidad
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Especifica dónde esperará la persona que recibirá el servicio en RD.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Origen de la solicitud
                  </span>
                  {formData.forWhom !== 'SELF' && (
                    <span className="text-[10px] bg-blue-950 border border-blue-800/60 text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                      Solicitud familiar / Diáspora
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleGetDeviceLocation}
                      disabled={locating}
                      className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <LocateFixed className="w-4 h-4 text-emerald-400" />
                      <span>{locating ? 'Leyendo GPS...' : 'Usar GPS de este teléfono (Solo si estoy en RD)'}</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address || formData.facilityName || 'Santo Domingo, Republica Dominicana')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition shrink-0"
                    >
                      <span>Buscar en Google Maps RD</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 Si estás solicitando desde el extranjero (EE. UU., Europa) o tu trabajo, busca el punto en Google Maps RD y copia el enlace o dirección exacta debajo.
                  </p>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">
                      Enlace compartido de Google Maps o Coordenadas (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.mapsUrl}
                      onChange={(e) => updateField('mapsUrl', e.target.value)}
                      placeholder="Ej: https://maps.app.goo.gl/... o https://google.com/maps?q=18.486,-69.931"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 outline-none focus:border-emerald-500 font-mono transition"
                    />
                  </div>

                  {formData.geoLat && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                      <span>✓ Coordenadas fijadas: {formData.geoLat}, {formData.geoLng}</span>
                      <button
                        type="button"
                        onClick={() => { updateField('geoLat', ''); updateField('geoLng', ''); updateField('mapsUrl', ''); }}
                        className="text-rose-400 hover:underline ml-2"
                      >
                        Limpiar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Requerimientos de movilidad de la persona a acompañar
                </h4>
                {[
                  { id: 'NONE', title: 'Movilidad independiente', desc: 'Camina por sí mismo sin apoyo técnico.' },
                  { id: 'ARM_ASSIST', title: 'Apoyo de brazo / Paso lento', desc: 'Requiere soporte de brazo para caminar o subir aceras/escalones.' },
                  { id: 'WALKER', title: 'Uso de Andador / Bastón', desc: 'Lleva su propio equipo de apoyo ambulatorio.' },
                  { id: 'WHEELCHAIR', title: 'Uso de Silla de Ruedas', desc: 'El acompañante asistirá empujando y trasladando la silla.' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateField('mobilitySupport', item.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      formData.mobilitySupport === item.id
                        ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${formData.mobilitySupport === item.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-300 font-bold block">
                  Punto de encuentro específico o referencia de llegada en RD
                </label>
                <textarea
                  rows={2}
                  value={formData.specialInstructions}
                  onChange={(e) => updateField('specialInstructions', e.target.value)}
                  placeholder="Ej: Casa blanca con rejas negras frente al colmado; o en CEDIMAT en sala de espera Piso 2..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>
            </div>
          )}

          {/* PASO 7 */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Contacto de Emergencia y Reportes
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Persona que recibirá reportes de la Mesa de Operaciones por WhatsApp durante el servicio:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Nombre del familiar responsable *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    placeholder="Ej: Carlos Domínguez"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">WhatsApp / Teléfono para reportes *</label>
                    <input
                      type="tel"
                      required
                      value={formData.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      placeholder="+1 809-555-0100"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">Parentesco</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => updateField('relationship', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                    >
                      <option value="Hijo(a)">Hijo(a)</option>
                      <option value="Cónyuge">Cónyuge / Pareja</option>
                      <option value="Hermano(a)">Hermano(a)</option>
                      <option value="Otro">Otro familiar / Amigo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 8 */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Comprobante Fiscal Dominicano
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Emisión oficial de recibo digital o factura con valor fiscal (NCF):
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 cursor-pointer" onClick={() => updateField('requiresNCF', !formData.requiresNCF)}>
                  <input
                    type="checkbox"
                    checked={formData.requiresNCF}
                    onChange={(e) => updateField('requiresNCF', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs">¿Requiere Factura con Crédito Fiscal (NCF tipo B01)?</h4>
                    <p className="text-[11px] text-slate-400">Para empresas o deducción fiscal autorizada</p>
                  </div>
                </div>

                {formData.requiresNCF && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block">RNC o Cédula fiscal *</label>
                      <input
                        type="text"
                        value={formData.rncOrCedula}
                        onChange={(e) => updateField('rncOrCedula', e.target.value)}
                        placeholder="Ej: 1-01-00000-0"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block">Razón Social *</label>
                      <input
                        type="text"
                        value={formData.fiscalName}
                        onChange={(e) => updateField('fiscalName', e.target.value)}
                        placeholder="Nombre registrado en DGII"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 9 */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Resumen de tu Solicitud
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verifica los detalles antes de enviar a la Mesa de Operaciones Central:
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Modalidad:</span>
                  <span className="font-bold text-white">
                    {formData.serviceType === 'CLINIC_APPOINTMENT' ? 'Consulta / Estudio Médico' : 'Asistencia en Hogar'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Ubicación y Sector:</span>
                  <span className="font-bold text-white text-right">
                    {formData.facilityName || 'Domicilio'} ({formData.city})
                  </span>
                </div>

                {formData.geoLat && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Punto GPS Fijado:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formData.geoLat}, {formData.geoLng}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Fecha y hora:</span>
                  <span className="font-bold text-white">
                    {formData.serviceDate || new Date().toISOString().split('T')[0]} a las {formData.serviceTime}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Duración:</span>
                  <span className="font-bold text-white">{formData.hours} Horas</span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-mono text-white">RD$ {subtotal.toLocaleString()}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-2 text-emerald-400 font-bold">
                    <span>Descuento de red (5%):</span>
                    <span>- RD$ {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1 text-sm font-black text-white">
                  <span>Total a Pagar:</span>
                  <span className="text-emerald-400 font-mono text-base">RD$ {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Garantía JUNTOS:</strong> Todos los acompañantes cuentan con depuración penal PGR y carnet de identificación. El servicio es de asistencia y movilidad 100% no clínico.
                </p>
              </div>
            </div>
          )}

          {/* BOTONERA NAVEGACIÓN */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-xs border border-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            ) : <div />}

            {step < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitService}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-xl flex items-center gap-2 text-xs shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <span>{loading ? 'Enviando a Mesa de Operaciones...' : 'Confirmar y Despachar Acompañante'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Mesa de Operaciones activa 24/7 en Santo Domingo y Santiago • JUNTOS ASISTENCIA RD</span>
        </div>

      </main>
    </div>
  );
}

export default function NewServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">Cargando reserva...</div>}>
      <ServiceBookingWizard />
    </Suspense>
  );
}