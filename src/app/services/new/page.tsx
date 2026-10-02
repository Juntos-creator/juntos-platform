'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { 
  User, Users, HeartHandshake, ChevronLeft, 
  ChevronRight, Calendar, Clock, MapPin, 
  Stethoscope, Home, Activity, CheckCircle2 
} from 'lucide-react';

export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('self');
  const [service, setService] = useState('Acompañamiento en Clínica');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [selectedCenter, setSelectedCenter] = useState('CEDIMAT');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Familiar');
  const [loading, setLoading] = useState(false);

  // Lógica Financiera
  const pricePerHour = 900;
  const subtotal = duration * pricePerHour;
  const platformFee = 150; // Cargo fijo por uso de plataforma
  const insuranceFee = subtotal * 0.05; // 5% del subtotal para el seguro del acompañante
  const itbis = subtotal * 0.18; // 18% ITBIS
  const total = subtotal + platformFee + insuranceFee + itbis;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 9));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    setLoading(true);
    // Simulamos validación de pago y redirigimos al radar de búsqueda
    setTimeout(() => {
      setLoading(false);
      // Guardamos el centro elegido en el navegador para que el radar sepa dónde es
      localStorage.setItem('juntos_meet_point', selectedCenter);
      router.push('/services/tracking');
    }, 1500);
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
          <div className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
            RD$ {pricePerHour}/h
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
            </div>
          )}

          {/* PASO 2: SERVICIO */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">Tipo de Servicio</h2>
                <p className="text-slate-600">Selecciona el tipo de apoyo que necesitas:</p>
              </div>

              <div className="space-y-3">
                <div onClick={() => setService('Acompañamiento en Clínica')} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${service === 'Acompañamiento en Clínica' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Stethoscope className={`w-8 h-8 ${service === 'Acompañamiento en Clínica' ? 'text-juntos-blue' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-lg font-bold text-slate-900">Acompañamiento en Clínica / Hospital</p>
                    <p className="text-sm text-slate-600">Asistencia durante consultas, laboratorios o internamiento.</p>
                  </div>
                </div>

                <div onClick={() => setService('Asistencia en el Hogar')} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${service === 'Asistencia en el Hogar' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Home className={`w-8 h-8 ${service === 'Asistencia en el Hogar' ? 'text-juntos-blue' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-lg font-bold text-slate-900">Asistencia Diaria en el Hogar</p>
                    <p className="text-sm text-slate-600">Apoyo en tareas diarias, movilidad y compañía en casa.</p>
                  </div>
                </div>

                <div onClick={() => setService('Cuidados Post-Operatorios')} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${service === 'Cuidados Post-Operatorios' ? 'border-juntos-blue bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                  <Activity className={`w-8 h-8 ${service === 'Cuidados Post-Operatorios' ? 'text-juntos-blue' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-lg font-bold text-slate-900">Cuidados Post-Operatorios</p>
                    <p className="text-sm text-slate-600">Supervisión tras cirugías y apoyo en la recuperación.</p>
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
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setDate('2026-10-02')} className="px-4 py-2 rounded-full border bg-slate-50 hover:bg-slate-100 font-medium text-slate-700">Hoy</button>
                <button type="button" onClick={() => setDate('2026-10-03')} className="px-4 py-2 rounded-full border bg-slate-50 hover:bg-slate-100 font-medium text-slate-700">Mañana</button>
              </div>
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
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Horarios comunes</p>
                <div className="grid grid-cols-2 gap-2">
                  {['08:00', '09:30', '14:00', '16:00'].map((h) => (
                    <button key={h} type="button" onClick={() => setTime(h)} className="py-3 border rounded-lg text-sm font-bold text-slate-700 hover:border-juntos-blue bg-slate-50">
                      {parseInt(h) >= 12 ? `${parseInt(h) === 12 ? 12 : parseInt(h) - 12}:00 PM` : `${h} AM`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 5: DURACIÓN */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">¿Cuántas horas necesitas?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 4, 6].map((hrs) => (
                  <div key={hrs} onClick={() => setDuration(hrs)} className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${duration === hrs ? 'border-juntos-blue bg-juntos-blue text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                    <p className="text-2xl font-bold">{hrs}h</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 6: CENTRO MÉDICO O DIRECCIÓN */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-juntos-blue w-6 h-6" /> 
                  {service === 'Asistencia en el Hogar' ? '¿En qué dirección será?' : '¿En qué centro será?'}
                </h2>
              </div>
              
              {service === 'Asistencia en el Hogar' ? (
                <textarea 
                  value={selectedCenter === 'CEDIMAT' ? '' : selectedCenter} 
                  onChange={(e) => setSelectedCenter(e.target.value)} 
                  placeholder="Ej. Av. Winston Churchill #105, Ensanche Piantini. Torre Azul, Apto 4B."
                  className="w-full p-4 border rounded-xl min-h-[100px] text-base outline-none focus:border-juntos-blue"
                />
              ) : (
                <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="w-full h-14 px-3 border rounded-lg text-lg bg-white font-medium text-slate-800">
                  <option value="CEDIMAT">CEDIMAT (Plaza de la Salud)</option>
                  <option value="Clínica Abreu">Clínica Abreu</option>
                  <option value="HOMS">HOMS</option>
                  <option value="Centro Médico Real">Centro Médico Real</option>
                </select>
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
                placeholder="Ej. Llevar silla de ruedas, problemas de audición..."
                className="w-full p-4 border rounded-xl min-h-[120px] text-base focus:border-juntos-blue outline-none"
              />
            </div>
          )}

          {/* PASO 8: CONTACTO */}
          {step === 8 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Contacto de emergencia</h2>
              <div className="space-y-4">
                <div>
                  <Label>Nombre completo</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ej. Ana García" className="h-12" />
                </div>
                <div>
                  <Label>WhatsApp / Teléfono</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 809 000 0000" className="h-12" />
                </div>
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
                    <p className="font-bold text-slate-500">PARA QUIÉN</p>
                    <p className="font-semibold text-slate-900">{recipient === 'self' ? 'Para mí' : recipient === 'family' ? 'Un familiar' : 'Otra persona'}</p>
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
                    <p className="font-bold text-slate-500">LUGAR DE ENCUENTRO</p>
                    <p className="font-semibold text-slate-900">{selectedCenter}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({duration} hrs)</span>
                    <span>RD$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ITBIS (18%)</span>
                    <span>RD$ {itbis.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Seguro de Acompañante (5%)</span>
                    <span>RD$ {insuranceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cargo por uso de plataforma</span>
                    <span>RD$ {platformFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <p className="text-base font-bold text-slate-800">TOTAL A PAGAR</p>
                  <p className="text-3xl font-black text-juntos-blue">RD$ {total.toLocaleString('es-DO')}</p>
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
            <Button size="lg" onClick={handleSubmit} disabled={loading} className="w-2/3 h-14 text-base font-bold bg-juntos-green text-white hover:bg-juntos-green/90">
              {loading ? 'Procesando Tarjeta...' : `Pagar RD$ ${total.toLocaleString('es-DO')}`}
            </Button>
          )}
        </div>

      </main>
    </div>
  );
}