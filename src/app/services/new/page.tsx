'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  LocateFixed,
  RotateCcw
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

  // Descuento y consentimiento Ley 172-13
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(true);

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
    hours: 2,

    // Paso 6: Geolocalización GPS y Punto de Mapa
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
    let isMounted = true;

    // 1. Sincronizar horas desde URL (?hours=X)
    const hoursParam = searchParams.get('hours');
    if (hoursParam) {
      const parsedHours = parseInt(hoursParam, 10);
      if (!isNaN(parsedHours) && parsedHours >= 2) {
        setFormData(prev => ({ ...prev, hours: parsedHours }));
      }
    }

    // 2. Verificar autenticación y si ya tiene cita activa
    async function checkAuthAndActiveService() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted && user) {
          setUser(user);

          // COMPROBACIÓN CRÍTICA: ¿Tiene ya una cita activa?
          const { data: activeOrder } = await supabase
            .from('service_requests')
            .select('id, status')
            .or(`client_id.eq.${user.id},customer_id.eq.${user.id},user_id.eq.${user.id}`)
            .in('status', ['PENDING', 'PENDING_DISPATCH', 'ASSIGNED', 'IN_PROGRESS'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeOrder) {
            window.location.replace(`/services/live?id=${activeOrder.id}`);
            return;
          }

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
        }
      } catch (err) {
        console.warn('Error verificando sesión o cita previa:', err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuthAndActiveService();

    return () => {
      isMounted = false;
    };
  }, [searchParams, supabase]);

  const RATE_PER_HOUR = 900;
  const subtotal = formData.hours * RATE_PER_HOUR;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  function updateField(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleNext() {
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
    if (typeof window !== 'undefined' && !navigator.geolocation) {
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
        alert('No se pudo obtener la señal GPS directa. Puedes escribir la dirección o pegar el enlace de Google Maps debajo.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmitService() {
    if (!acceptedTerms) {
      alert('Debes autorizar el consentimiento de datos conforme a la Ley 172-13 para continuar.');
      return;
    }

    setLoading(true);

    try {
      let activeUser = user;
      if (!activeUser) {
        const { data: authData } = await supabase.auth.getUser();
        activeUser = authData?.user;
      }

      if (!activeUser) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('juntos_pending_booking', JSON.stringify(formData));
        }
        window.location.href = '/login?redirect=/services/new';
        return;
      }

      let validDate = formData.serviceDate;
      if (!validDate || validDate.trim() === '') {
        validDate = new Date().toISOString().split('T')[0];
      }

      const ubicacionConsolidada = `${formData.facilityName || 'Domicilio'}${formData.address ? ' - ' + formData.address : ''} (${formData.city})${formData.geoLat ? ` [GPS: ${formData.geoLat}, ${formData.geoLng}]` : ''}`;
      
      const recipientFinal = formData.forWhom === 'SELF' 
        ? (activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'Titular Solicitante') 
        : (formData.recipientName || 'Familiar Acompañado');

      const notasConsolidadas = [
        `Contacto: ${formData.contactName || 'No especificado'} (${formData.contactPhone || 'Sin teléfono'}) [${formData.relationship}]`,
        `Condición de Movilidad: ${formData.mobilitySupport}`,
        formData.specialInstructions ? `Punto de encuentro: ${formData.specialInstructions}` : '',
        formData.mapsUrl ? `Maps: ${formData.mapsUrl}` : '',
        formData.requiresNCF ? `NCF: ${formData.fiscalName} (RNC: ${formData.rncOrCedula})` : '',
        discountAmount > 0 ? `Descuento: RD$ ${discountAmount}` : '',
        `Consentimiento Ley 172-13: ACEPTADO`
      ].filter(Boolean).join(' | ');

      const randomCheckinPin = Math.floor(1000 + Math.random() * 9000).toString();
      const randomCheckoutPin = Math.floor(1000 + Math.random() * 9000).toString();

      // INCLUYE EXPRESAMENTE client_id PARA EVITAR VALORES NULL
      const universalPayload: any = {
        client_id: activeUser.id,
        user_id: activeUser.id,
        customer_id: activeUser.id,
        recipient_name: recipientFinal,
        recipient_phone: formData.recipientPhone || formData.contactPhone || '809-000-0000',
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
        emergency_status: 'NORMAL',
        checkin_pin: randomCheckinPin,
        checkout_pin: randomCheckoutPin
      };

      const { data, error } = await supabase
        .from('service_requests')
        .insert([universalPayload])
        .select('id')
        .single();

      let serviceId = data?.id;

      if (error) {
        console.warn('Esquema extendido falló, aplicando payload simplificado:', error.message);
        
        const corePayload: any = {
          client_id: activeUser.id,
          user_id: activeUser.id,
          recipient_name: recipientFinal,
          service_type: formData.serviceType,
          facility_or_location: ubicacionConsolidada,
          scheduled_date: validDate,
          scheduled_time: formData.serviceTime || '08:00',
          duration_hours: formData.hours,
          rate_total: total,
          special_notes: notasConsolidadas,
          status: 'PENDING_DISPATCH'
        };

        const { data: fallbackData, error: coreError } = await supabase
          .from('service_requests')
          .insert([corePayload])
          .select('id')
          .single();

        if (coreError) throw coreError;
        serviceId = fallbackData?.id;
      }

      if (serviceId) {
        window.location.href = `/services/live?id=${serviceId}`;
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-4 p-4 text-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Verificando estado de tu cuenta...</p>
          <p className="text-xs text-slate-500">Conectando con la plataforma JUNTOS Asistencia RD</p>
        </div>
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
              <span>RD$ 900 / Hora</span>
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
                  Elige a la persona que recibirá el apoyo humano presencial:
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => updateField('forWhom', 'SELF')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
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
                      <h4 className="font-bold text-sm text-white">Para mí (Titular)</h4>
                      <p className="text-xs text-slate-400">Yo mismo asistiré a la cita o actividad</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.forWhom === 'SELF' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                    {formData.forWhom === 'SELF' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('forWhom', 'FAMILY')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
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
                      <h4 className="font-bold text-sm text-white">Para un familiar (Padres / Diáspora)</h4>
                      <p className="text-xs text-slate-400">Madre, padre, abuelos o parientes en República Dominicana</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.forWhom === 'FAMILY' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                    {formData.forWhom === 'FAMILY' && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('forWhom', 'OTHER')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
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
                      <p className="text-xs text-slate-400">Amigo, colaborador, vecino o conocido</p>
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
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Persona que recibirá el acompañamiento
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
                        placeholder="Ej: Doña Mercedes Morales"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">Teléfono / WhatsApp en RD *</label>
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
                  Soporte personal y logístico estrictamente no clínico (Ley 42-01):
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { id: 'CLINIC_APPOINTMENT', title: 'Consultas o Estudios Médicos', desc: 'Espera en sala, asistencia en movilidad y soporte en farmacia.', icon: Stethoscope },
                  { id: 'HOME_CARE', title: 'Asistencia y Compañía en Hogar', desc: 'Compañía activa, apoyo en movilidad y supervisión diurna dentro de casa.', icon: Home },
                  { id: 'HOSPITAL_DISCHARGE', title: 'Alta Médica o Procedimiento', desc: 'Soporte presencial en egreso hospitalario y retorno seguro al hogar.', icon: Activity },
                  { id: 'ERRANDS', title: 'Diligencias y Gestión Personal', desc: 'Acompañamiento a banco, compras o gestiones cotidianas.', icon: HeartHandshake }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = formData.serviceType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateField('serviceType', item.id)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
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
                  Indica la ciudad y el centro médico o dirección de encuentro:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Ciudad / Municipio *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition cursor-pointer"
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
                    placeholder="Ej: CEDIMAT, HOMS, Clínica Abreu o Domicilio particular"
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
                  <label className="text-slate-300 font-bold block">Hora de inicio (7:00 AM – 7:00 PM) *</label>
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
                  Selecciona las horas estimadas (mínimo 2 horas por traslado):
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[2, 3, 4, 6, 8, 10, 12].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updateField('hours', h)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
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
                  <p className="text-slate-400">Total calculado ({formData.hours} horas):</p>
                  <p className="text-xl font-black text-white">RD$ {total.toLocaleString()}</p>
                </div>
                {discountPercent > 0 && (
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-600/40 px-3 py-1 rounded-xl text-xs">
                    Incluye 5% de descuento
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
                  <Navigation className="w-3.5 h-3.5" /> MAPA Y LOCALIZACIÓN EN RD
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Punto de Encuentro y Movilidad
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Especifica el punto de recepción y las condiciones físicas del asistido:
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Coordenadas operativas
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
                      className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      <LocateFixed className="w-4 h-4 text-emerald-400" />
                      <span>{locating ? 'Leyendo GPS...' : 'Usar GPS de este teléfono'}</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address || formData.facilityName || 'Santo Domingo, Republica Dominicana')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition shrink-0 cursor-pointer"
                    >
                      <span>Abrir Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    💡 Si estás coordinando desde el extranjero, puedes pegar el enlace compartido de Google Maps de la ubicación en RD debajo.
                  </p>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">
                      Enlace de Google Maps o Coordenadas (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.mapsUrl}
                      onChange={(e) => updateField('mapsUrl', e.target.value)}
                      placeholder="Ej: https://maps.app.goo.gl/... o coordenadas"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 outline-none focus:border-emerald-500 font-mono transition"
                    />
                  </div>

                  {formData.geoLat && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                      <span>✓ Coordenadas fijadas: {formData.geoLat}, {formData.geoLng}</span>
                      <button
                        type="button"
                        onClick={() => { updateField('geoLat', ''); updateField('geoLng', ''); updateField('mapsUrl', ''); }}
                        className="text-rose-400 hover:underline ml-2 cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Condición de movilidad de la persona a acompañar *
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
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
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
                  placeholder="Ej: Sala de espera 2do piso de CEDIMAT, o lobby del edificio..."
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
                  Persona responsable que recibirá reportes de inicio y finalización del servicio:
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="Hijo(a)">Hijo(a)</option>
                      <option value="Cónyuge">Cónyuge / Pareja</option>
                      <option value="Hermano(a)">Hermano(a)</option>
                      <option value="Otro">Otro familiar / Allegado</option>
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
                  Emisión de recibo digital estándar o factura con valor fiscal (NCF):
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div 
                  className="flex items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 cursor-pointer" 
                  onClick={() => updateField('requiresNCF', !formData.requiresNCF)}
                >
                  <input
                    type="checkbox"
                    checked={formData.requiresNCF}
                    onChange={(e) => updateField('requiresNCF', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs">¿Requiere Factura con Crédito Fiscal (NCF tipo B01)?</h4>
                    <p className="text-[11px] text-slate-400">Para deducción de gastos autorizada ante la DGII</p>
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
                  Verifica los detalles antes de remitir la reserva:
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Modalidad:</span>
                  <span className="font-bold text-white">
                    {formData.serviceType === 'CLINIC_APPOINTMENT' ? 'Consulta / Estudio Médico' : 'Asistencia en Hogar'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Ubicación:</span>
                  <span className="font-bold text-white text-right">
                    {formData.facilityName || 'Domicilio'} ({formData.city})
                  </span>
                </div>

                {formData.geoLat && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">GPS Fijado:</span>
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

              {/* CONSENTIMIENTO LEY 172-13 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700 shrink-0 mt-0.5"
                  />
                  <span className="text-slate-300 leading-relaxed text-[11px]">
                    Autorizo el tratamiento de los datos de contacto, ubicación y condición de movilidad exclusivamente para fines de coordinación operativa del servicio, conforme a la <strong>Ley No. 172-13 sobre Protección de Datos de Carácter Personal en República Dominicana</strong>.
                  </span>
                </label>
              </div>

              {/* POLÍTICA DE CANCELACIÓN Y GARANTÍA */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  <strong>Protocolo y Cancelación:</strong> Acompañantes verificados. Asistencia estrictamente no clínica (Ley 42-01). Cancelación sin costo hasta 12 horas antes de la cita conforme a nuestra política oficial de servicio.
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
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-xs border border-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            ) : <div />}

            {step < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || !acceptedTerms}
                onClick={handleSubmitService}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-xl flex items-center gap-2 text-xs shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Asignando en Mesa de Operaciones...' : 'Confirmar e Iniciar Operación en Vivo'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Mesa Operativa activa en Gran Santo Domingo y Santiago • JUNTOS ASISTENCIA RD</span>
        </div>

      </main>
    </div>
  );
}

export default function NewServicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Iniciando reserva segura...</p>
      </div>
    }>
      <ServiceBookingWizard />
    </Suspense>
  );
}