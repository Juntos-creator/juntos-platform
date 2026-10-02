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
  ChevronRight, CreditCard, Calendar, Clock, MapPin 
} from 'lucide-react';

export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();

  // VARIABLES DE ESTADO (Soluciona los errores de TypeScript)
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('self');
  const [service, setService] = useState('Acompañamiento Médico');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [selectedCenter, setSelectedCenter] = useState('CEDIMAT');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Familiar');
  const [loading, setLoading] = useState(false);

  const pricePerHour = 900;
  const total = duration * pricePerHour;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 9));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Reserva confirmada', description: 'Tu acompañante ha sido asignado.', variant: 'success' });
      router.push('/');
    }, 2000);
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

        {/* CONTENEDOR PRINCIPAL */}
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
                      <p className="text-lg font-bold text-slate-900">Para un familiar (Mamá, Papá, Pareja)</p>
                      <p className="text-sm text-slate-600">Para cuidar a mi ser querido.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${recipient === 'family' ? 'border-juntos-blue bg-juntos-blue' : 'border-slate-300'}`}>
                    {recipient === 'family' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: SERVICIO (Ejemplo simplificado) */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Tipo de Servicio</h2>
              <div onClick={() => setService('Acompañamiento Médico')} className="p-5 rounded-xl border-2 border-juntos-blue bg-blue-50/60 cursor-pointer">
                <p className="text-lg font-bold text-slate-900">Acompañamiento en Clínica / Hospital</p>
                <p className="text-sm text-slate-600">Asistencia durante citas, análisis o ingresos.</p>
              </div>
            </div>
          )}

          {/* PASO 3: FECHA */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="text-juntos-blue w-6 h-6" /> ¿Qué día es la cita?
                </h2>
                <p className="text-slate-600 mt-1">Selecciona la fecha en que necesitas al acompañante.</p>
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
                  <Clock className="text-juntos-blue w-6 h-6" /> ¿A qué hora inicia la cita?
                </h2>
                <p className="text-slate-600 mt-1">El acompañante llegará 15 minutos antes.</p>
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
              <div>
                <h2 className="text-2xl font-bold text-slate-900">¿Cuántas horas necesitas?</h2>
                <p className="text-slate-600 mt-1">Tarifa base: RD$900 por hora.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 4, 6].map((hrs) => (
                  <div key={hrs} onClick={() => setDuration(hrs)} className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${duration === hrs ? 'border-juntos-blue bg-juntos-blue text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                    <p className="text-2xl font-bold">{hrs}h</p>
                    <p className={`text-sm ${duration === hrs ? 'text-blue-100' : 'text-slate-500'}`}>RD${hrs * 900}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> 2 horas es lo ideal para una consulta médica general o análisis de laboratorio.
                </p>
              </div>
            </div>
          )}

          {/* PASO 6: CENTRO MÉDICO */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-juntos-blue w-6 h-6" /> ¿En qué centro será la cita?
                </h2>
              </div>
              <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="w-full h-14 px-3 border rounded-lg text-lg bg-white font-medium text-slate-800">
                <option value="CEDIMAT">CEDIMAT (Plaza de la Salud)</option>
                <option value="Clínica Abreu">Clínica Abreu</option>
                <option value="HOMS">HOMS</option>
                <option value="Centro Médico Real">Centro Médico Real</option>
              </select>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm"><strong>Punto de encuentro:</strong> El acompañante te esperará en el lobby principal o entrada de consultas del centro seleccionado.</p>
              </div>
            </div>
          )}

          {/* PASO 7: NOTAS */}
          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Instrucciones especiales (Opcional)</h2>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Ej. Llevar silla de ruedas, tiene problemas de audición, etc."
                className="w-full p-4 border rounded-xl min-h-[120px] text-base focus:border-juntos-blue outline-none"
              />
            </div>
          )}

          {/* PASO 8: CONTACTO */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Contacto de emergencia</h2>
                <p className="text-slate-600 mt-1">¿A quién llamamos si surge algún imprevisto?</p>
              </div>
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
                    <option value="Amigo/a">Amigo/a</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 9: RESUMEN */}
          {step === 9 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Resumen del servicio</h2>
              <div className="bg-slate-50 border rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500">PARA QUIÉN</p>
                    <p className="font-semibold text-slate-900">{recipient === 'self' ? 'Para mí (Yo mismo)' : 'Para un familiar'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">SERVICIO</p>
                    <p className="font-semibold text-slate-900">{service}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">FECHA Y HORA</p>
                    <p className="font-semibold text-slate-900">{date || 'No definida'} • {time || 'No definida'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">CENTRO</p>
                    <p className="font-semibold text-slate-900">{selectedCenter}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-600">TOTAL A PAGAR</p>
                    <p className="text-xs text-slate-500">{duration} hrs × RD$900</p>
                  </div>
                  <p className="text-3xl font-black text-juntos-blue">RD${total}</p>
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
              {loading ? 'Procesando...' : `Pagar RD$${total}`}
            </Button>
          )}
        </div>

      </main>
    </div>
  );
}