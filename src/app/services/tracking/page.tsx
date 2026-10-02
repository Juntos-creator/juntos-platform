'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MapPin, Search, CheckCircle2, User, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrackingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'searching' | 'found'>('searching');
  const [meetPoint, setMeetPoint] = useState('Centro Médico');

  useEffect(() => {
    // Leemos el punto de encuentro guardado en la pantalla anterior
    const savedPoint = localStorage.getItem('juntos_meet_point');
    if (savedPoint) setMeetPoint(savedPoint);

    // Simulamos que encuentra un acompañante a los 4 segundos
    const timer = setTimeout(() => {
      setStatus('found');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container max-w-lg py-12 px-4">
        
        {status === 'searching' ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm border text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-juntos-blue/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-juntos-blue/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-juntos-blue text-white rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 animate-spin-slow" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800">Buscando en tu zona...</h2>
            <p className="text-slate-500">Estamos conectando con los acompañantes disponibles más cercanos a tu ubicación.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-6 rounded-3xl text-center space-y-3 shadow-sm">
              <CheckCircle2 className="w-16 h-16 text-juntos-green mx-auto" />
              <h2 className="text-2xl font-bold text-green-900">¡Acompañante Confirmado!</h2>
              <p className="text-green-800">Se ha notificado al acompañante. Ya puedes estar tranquilo.</p>
            </div>

            <div className="bg-white border p-6 rounded-3xl shadow-sm space-y-6">
              
              {/* Info del Acompañante */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 shrink-0">
                  <User className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    María Jiménez <ShieldCheck className="w-4 h-4 text-juntos-blue" />
                  </h3>
                  <p className="text-sm text-slate-500">Enfermera Auxiliar • 5.0 ⭐</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Punto de encuentro */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Punto de Encuentro</p>
                <div className="bg-slate-50 rounded-xl p-4 flex gap-4">
                  <MapPin className="w-6 h-6 text-juntos-blue shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">{meetPoint}</p>
                    <p className="text-sm text-slate-500">El acompañante te esperará allí 15 minutos antes de tu hora reservada.</p>
                  </div>
                </div>
              </div>

              {/* Mapa de Simulación (Usando un color sólido o gradiente como placeholder) */}
              <div className="w-full h-32 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-300">
                <div className="absolute inset-0 bg-blue-50 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-juntos-blue flex flex-col items-center">
                  <MapPin className="w-8 h-8 fill-current text-white" />
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow-sm mt-1">Destino fijado</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="w-1/2 h-12 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border">
                  <Phone className="w-4 h-4 mr-2" /> Llamar
                </Button>
                <Button className="w-1/2 h-12 bg-juntos-blue text-white hover:bg-juntos-blue/90 font-bold" onClick={() => router.push('/')}>
                  Ir al Inicio
                </Button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}