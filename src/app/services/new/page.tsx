'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { 
  User, Users, HeartHandshake, ChevronLeft, 
  ChevronRight, Calendar, Clock, MapPin, 
  Stethoscope, Home, LocateFixed, Phone, CheckCircle
} from 'lucide-react';

export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState<'self' | 'family' | 'other'>('family');

  // Datos del Paciente / Beneficiario cuando es familiar u otra persona
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientRelation, setPatientRelation] = useState('');

  const [service, setService] = useState('Acompañamiento en Clínica / Hospital');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  // Duración y Tarifa Dinámica
  const [duration, setDuration] = useState<number | ''>(2);
  const [isNightShift, setIsNightShift] = useState(false);
  const pricePerHour = isNightShift ? 1100 : 900;
  
  const [selectedCenter, setSelectedCenter] = useState('CEDIMAT (Plaza de la Salud)');
  const [customCenter, setCustomCenter] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Familiar');
  const [loading, setLoading] = useState(false);

  // Lógica Financiera
  const numericDuration = typeof duration === 'number' ? duration : 0;
  const subtotal = numericDuration * pricePerHour;
  const platformFee = 150; 
  const insuranceFee = subtotal * 0.05; 
  const itbis = subtotal * 0.18; 
  const total = subtotal > 0 ? subtotal + platformFee + insuranceFee + itbis : 0;

  const nextStep = () => {
    if (step === 1 && (recipient === 'family' || recipient === 'other')) {
      if (!patientName.trim() || !patientPhone.trim()) {
        toast({
          title: 'Datos requeridos',
          description: 'Por favor indica el nombre y teléfono de quien recibirá el acompañamiento.',
          variant: 'error'
        });
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 9));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleGeoLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setSelectedCenter('Otro');
      setCustomCenter('Av. 27 de Febrero esq. Tiradentes, Santo Domingo');
      setIsLocating(false);
      toast({ title: 'Ubicación detectada', description: 'GPS sincronizado con éxito.', variant: 'success' });
    }, 1500);
  };

  const dispararNotificacionWhatsApp = async (finalPatient: string, finalPhone: string, finalLocation: string) => {
    try {
      await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: finalPhone,
          nombrePaciente: finalPatient,
          fecha: `${date || 'Hoy'} a las ${time || '08:00 AM'}`,
          direccion: finalLocation,
          nombreAcompanante: 'Asignado por Mesa Central JUNTOS'
        })
      });
    } catch (err) {
      console.warn('Disparo WhatsApp API secundario:', err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const finalLocation = selectedCenter === 'Otro' ? customCenter : selectedCenter;
    const finalPatient = recipient === 'self' ? (contactName || 'El Solicitante') : patientName;
    const finalPhone = recipient === 'self' ? contactPhone : patientPhone;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload: Record<string, any> = {
        customer_id: user?.id || null,
        for_who: recipient === 'self' ? 'myself' : recipient === 'family' ? 'family' : 'other',
        for_who_name: finalPatient,
        service_type: service,
        requested_date: date || new Date().toISOString().split('T')[0],
        duration_minutes: numericDuration * 60,
        center_name: selectedCenter,
        center_address: finalLocation,
        address: finalLocation,
        client_name: finalPatient,
        client_phone: finalPhone,
        observations: notes || `Parentesco: ${patientRelation || contactRelation}`,
        emergency_contact_name: contactName || finalPatient,
        emergency_contact_phone: contactPhone || finalPhone,
        emergency_contact_relationship: contactRelation || patientRelation || 'Familiar',
        emergency_status: 'NORMAL'
      };

      if (time) {
        payload.requested_time = time;
      }

      // 1. Guardar en service_requests con columnas verificadas
      const { data: srvData, error: srvError } = await supabase
        .from('service_requests')
        .insert([payload])
        .select()
        .single();

      if (srvError) throw srvError;

      // 2. Registrar pre-orden en la tabla payments
      await supabase.from('payments').insert([{
        service_request_id: srvData.id,
        user_id: user?.id || null,
        amount: total,
        currency: 'DOP',
        status: 'PENDING',
        payment_method: 'TARJETA'
      }]);

      // 3. Disparar WhatsApp / Notificación
      await dispararNotificacionWhatsApp(finalPatient, finalPhone, finalLocation);

      localStorage.setItem('juntos_meet_point', finalLocation);
      localStorage.setItem('juntos_current_service_id', srvData.id);

      toast({ 
        title: '¡Servicio Solicitado!', 
        description: 'Hemos registrado la orden exitosamente.', 
        variant: 'success' 
      });

      router.push(`/admin/payments?service_id=${srvData.id}&amount=${total}`);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error al procesar',
        description: error.message || 'No se pudo guardar la solicitud.',
        variant: 'error'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <main className="container max-w-3xl py-8 px-4">
        {/* Indicador de progreso */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 border bg-white px-4 py-2 rounded-full shadow-sm">
            <div className="bg-juntos-blue text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
              {step}
            </div>
            <p className="text-sm font-bold text-slate-700 tracking-wider uppercase">Paso {step} de 9</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${isNightShift ? 'bg-indigo-900 text-white' : 'bg-slate-800 text-white'}`}>
            {isNightShift ? '🌙 RD$ 1,100/h' : '☀️️ RD$ 900/h'}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6 min-h-[400px]">
          
          {/* PASO 1: PARA QUIÉN */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">¿Para quién es el acompañamiento?</h2>
                <p className="text-slate-600 text-base">Elige la opción que mejor describa a la persona que recibirá el apoyo:</p>
              </div>

              <div className="space-y-3">
                <div onClick={() => setRecipient('self')} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${recipient === 'self' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-4">
                    <User className="w-8 h-8 text-slate-500 bg-slate-100 p-1.5 rounded-full" />
                    <div>
                      <p className="text-lg font-bold text-slate-900">Para mí (Yo mismo)</p>
                      <p className="text-sm text-slate-600">Necesito que un acompañante me asista.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${recipient === 'self' ? 'border-juntos-blue bg-juntos-blue' : 'border-slate-300'}`}>
                    {recipient === 'self' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div onClick={() => setRecipient('family')} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${recipient === 'family' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8 text-slate-500 bg-slate-100 p-1.5 rounded-full" />
                    <div>
                      <p className="text-lg font-bold text-slate-900">Para un familiar</p>
                      <p className="text-sm text-slate-600">Mamá, Papá, Pareja o pariente.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${recipient === 'family' ? 'border-juntos-blue bg-juntos-blue' : 'border-slate-300'}`}>
                    {recipient === 'family' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div onClick={() => setRecipient('other')} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${recipient === 'other' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-4">
                    <HeartHandshake className="w-8 h-8 text-slate-500 bg-slate-100 p-1.5 rounded-full" />
                    <div>
                      <p className="text-lg font-bold text-slate-900">Para otra persona</p>
                      <p className="text-sm text-slate-600">Amigo, vecino o conocido.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${recipient === 'other' ? 'border-juntos-blue bg-juntos-blue' : 'border-slate-300'}`}>
                    {recipient === 'other' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* DESPLIEGUE AUTOMÁTICO DE DATOS DEL PACIENTE/BENEFICIARIO */}
              {(recipient === 'family' || recipient === 'other') && (
                <div className="mt-6 p-5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-3">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wide flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Datos de la persona que recibirá la atención
                    </h3>
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Requerido
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Nombre completo del paciente *</Label>
                      <Input 
                        required
                        value={patientName} 
                        onChange={(e) => setPatientName(e.target.value)} 
                        placeholder="Ej: Doña Mercedes Altagracia"
                        className="mt-1 h-12 bg-white text-base"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-slate-700">WhatsApp / Teléfono directo *</Label>
                      <Input 
                        required
                        type="tel"
                        value={patientPhone} 
                        onChange={(e) => setPatientPhone(e.target.value)} 
                        placeholder="Ej: 809-555-0199"
                        className="mt-1 h-12 bg-white text-base"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Parentesco o relación contigo (Opcional)</Label>
                      <Input 
                        value={patientRelation} 
                        onChange={(e) => setPatientRelation(e.target.value)} 
                        placeholder="Ej: Mi madre, Abuelo, Tía..."
                        className="mt-1 h-12 bg-white text-base"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-blue-800 bg-blue-100/60 p-2.5 rounded-xl flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0 text-blue-600" />
                    El acompañante utilizará estos datos para contactar a la persona al llegar y confirmar la cita por WhatsApp.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: SERVICIO */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">Tipo de Servicio</h2>
                <p className="text-slate-600">Selecciona el tipo de apoyo que necesitas (Servicios no clínicos):</p>
              </div>

              <div className="space-y-3">
                <div onClick={() => setService('Acompañamiento en Clínica / Hospital')} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${service === 'Acompañamiento en Clínica / Hospital' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Stethoscope className={`w-8 h-8 ${service === 'Acompañamiento en Clínica / Hospital' ? 'text-juntos-blue' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-lg font-bold text-slate-900">Acompañamiento en Clínica / Hospital</p>
                    <p className="text-sm text-slate-600">Asistencia no médica durante consultas, laboratorios o internamiento.</p>
                  </div>
                </div>

                <div onClick={() => setService('Asistencia Diaria en el Hogar')} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${service === 'Asistencia Diaria en el Hogar' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Home className={`w-8 h-8 ${service === 'Asistencia Diaria en el Hogar' ? 'text-juntos-blue' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-lg font-bold text-slate-900">Asistencia Diaria en el Hogar</p>
                    <p className="text-sm text-slate-600">Apoyo en tareas diarias, movilidad y compañía en casa.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: FECHA */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="text-juntos-blue w-6 h-6" /> ¿Qué día es el servicio?
                </h2>
              </div>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-lg p-3 h-14" />
            </div>
          )}

          {/* PASO 4: HORA */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="text-juntos-blue w-6 h-6" /> ¿A qué hora inicia?
                </h2>
              </div>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="text-lg p-3 h-14" />
            </div>
          )}

          {/* PASO 5: DURACIÓN */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">¿Cuántas horas necesitas?</h2>
                <p className="text-slate-600 mt-1">Tarifa base: RD$900/h. Turno nocturno: RD$1,100/h.</p>
              </div>

              <div className="flex gap-4 mb-4">
                <Button 
                  type="button" 
                  variant={isNightShift ? "outline" : "default"} 
                  className={`w-1/2 h-12 ${!isNightShift ? 'bg-juntos-blue' : ''}`}
                  onClick={() => setIsNightShift(false)}
                >
                  ☀️ Diurno (RD$ 900)
                </Button>
                <Button 
                  type="button" 
                  variant={isNightShift ? "default" : "outline"} 
                  className={`w-1/2 h-12 ${isNightShift ? 'bg-indigo-900 hover:bg-indigo-800' : ''}`}
                  onClick={() => setIsNightShift(true)}
                >
                  🌙 Nocturno (RD$ 1,100)
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 4, 8].map((hrs) => (
                  <div key={hrs} onClick={() => setDuration(hrs)} className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${duration === hrs ? (isNightShift ? 'border-indigo-900 bg-indigo-900 text-white' : 'border-juntos-blue bg-juntos-blue text-white') : 'border-slate-200 bg-white text-slate-800'}`}>
                    <p className="text-xl font-bold">{hrs}h</p>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Label className="text-sm font-bold text-slate-700">O escribe una cantidad personalizada de horas:</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="24"
                  placeholder="Ej: 12" 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} 
                  className="mt-2 h-12 text-lg" 
                />
              </div>
            </div>
          )}

          {/* PASO 6: CENTRO MÉDICO O DIRECCIÓN */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-juntos-blue w-6 h-6" /> ¿En qué centro o dirección será?
                </h2>
              </div>
              
              <div className="flex gap-2">
                <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="flex-1 h-14 px-3 border rounded-lg text-lg bg-white font-medium text-slate-800">
                  <option value="CEDIMAT (Plaza de la Salud)">CEDIMAT (Plaza de la Salud)</option>
                  <option value="Clínica Abreu">Clínica Abreu</option>
                  <option value="HOMS">HOMS</option>
                  <option value="Centro Médico Real">Centro Médico Real</option>
                  <option value="Otro">Escribir otra ubicación / Casa</option>
                </select>
                <Button onClick={handleGeoLocation} disabled={isLocating} className="h-14 w-14 bg-slate-100 hover:bg-slate-200 text-slate-700 border" title="Usar mi ubicación actual">
                  <LocateFixed className={`w-6 h-6 ${isLocating ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {selectedCenter === 'Otro' && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <Label>Escribe el nombre del centro o dirección exacta:</Label>
                  <textarea 
                    value={customCenter} 
                    onChange={(e) => setCustomCenter(e.target.value)} 
                    placeholder="Ej. Hospital Traumatológico Dr. Ney Arias Lora, Av. Charles de Gaulle."
                    className="w-full p-4 mt-2 border rounded-xl min-h-[100px] text-base outline-none focus:border-juntos-blue"
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO 7: NOTAS */}
          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Instrucciones especiales (Opcional)</h2>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Ej. Llevar silla de ruedas, problemas de audición, paciente hipertenso..."
                className="w-full p-4 border rounded-xl min-h-[120px] text-base focus:border-juntos-blue outline-none"
              />
            </div>
          )}

          {/* PASO 8: CONTACTO */}
          {step === 8 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Contacto de emergencia</h2>
              <div className="space-y-4">
                <div><Label>Nombre completo</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-12" /></div>
                <div><Label>WhatsApp / Teléfono</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="h-12" /></div>
                <div>
                  <Label>Parentesco</Label>
                  <select value={contactRelation} onChange={(e) => setContactRelation(e.target.value)} className="w-full h-12 px-3 border rounded-lg bg-white">
                    <option value="Hijo/a">Hijo/a</option>
                    <option value="Pareja">Pareja / Cónyuge</option>
                    <option value="Familiar">Familiar general</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 9: FACTURA / RESUMEN */}
          {step === 9 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Facturación y Resumen</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div>
                    <p className="font-bold text-slate-500">PACIENTE A ASISTIR</p>
                    <p className="font-semibold text-slate-900">
                      {recipient === 'self' ? 'Para mí' : `${patientName} (${patientPhone})`}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500">FECHA Y HORA</p>
                    <p className="font-semibold text-slate-900">{date || 'Hoy'} • {time || '08:00 AM'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-bold text-slate-500">SERVICIO</p>
                    <p className="font-semibold text-slate-900">{service}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-bold text-slate-500">LUGAR</p>
                    <p className="font-semibold text-slate-900">{selectedCenter === 'Otro' ? customCenter : selectedCenter}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal ({numericDuration} hrs {isNightShift ? '🌙' : '☀️'})</span><span>RD$ {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>ITBIS (18%)</span><span>RD$ {itbis.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Seguro de Acompañante (5%)</span><span>RD$ {insuranceFee.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Cargo por uso de plataforma</span><span>RD$ {platformFee.toFixed(2)}</span></div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <p className="text-base font-bold text-slate-800">TOTAL A PAGAR</p>
                  <p className="text-3xl font-black text-juntos-blue">RD$ {total.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLES DE NAVEGACIÓN */}
        <div className="flex gap-4 items-center">
          {step > 1 && (
            <Button variant="outline" size="lg" onClick={prevStep} className="w-1/3 border-2 h-14 text-base font-bold">
              <ChevronLeft className="w-5 h-5 mr-1" /> Atrás
            </Button>
          )}
          {step < 9 ? (
            <Button size="lg" onClick={nextStep} className={`h-14 text-base font-bold text-white bg-juntos-blue hover:bg-juntos-blue/90 ${step === 1 ? 'w-full' : 'w-2/3'}`}>
              Continuar <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleSubmit} disabled={loading || numericDuration === 0} className="w-2/3 h-14 text-base font-bold bg-juntos-green text-white hover:bg-juntos-green/90">
              {loading ? 'Procesando Tarjeta y WhatsApp...' : `Pagar RD$ ${total.toLocaleString('es-DO', {minimumFractionDigits: 2})}`}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}