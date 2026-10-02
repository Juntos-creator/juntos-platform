'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MapPin, Search, CheckCircle2, User, Phone, ShieldCheck, Power, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client'; // Necesario para saber el rol

export default function TrackingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [userRole, setUserRole] = useState<'CUSTOMER' | 'COMPANION' | null>(null);
  const [status, setStatus] = useState<'searching' | 'found'>('searching');
  const [meetPoint, setMeetPoint] = useState('Centro Médico');
  const [encounterState, setEncounterState] = useState<'waiting' | 'started' | 'finished'>('waiting');

  useEffect(() => {
    // 1. Determinar quién está viendo la pantalla
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      } else {
         setUserRole('CUSTOMER'); // Fallback para pruebas sin login
      }
    }
    checkRole();

    // 2. Cargar punto de encuentro
    const savedPoint = localStorage.getItem('juntos_meet_point');
    if (savedPoint) setMeetPoint(savedPoint);

    // 3. Simulación: Si es cliente, simula que busca. Si es acompañante, asume que ya está asignado.
    if (userRole === 'COMPANION') {
        setStatus('found');
    } else {
        const timer = setTimeout(() => {
        setStatus('found');
        }, 4000);
        return () => clearTimeout(timer);
    }
  }, [userRole, supabase]);

  // Las acciones de Check-in y Check-out actualizarían la BD aquí
  const handleCheckIn = () => {
    setEncounterState('started');
    toast({ 
      title: 'Servicio Iniciado', 
      description: 'El tiempo del acompañamiento ha comenzado a correr.', 
      variant: 'success' 
    });
  };

  const handleCheckOut = () => {
    setEncounterState('finished');
    toast({ 
      title: 'Servicio Finalizado', 
      description: 'El encuentro se ha cerrado exitosamente.', 
      variant: 'default' 
    });
    
    setTimeout(() => {
      // Si es acompañante, vuelve a su dashboard; si es cliente, al inicio
      if (userRole === 'COMPANION') {
          router.push('/companion/dashboard');
      } else {
          router.push('/');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container max-w-lg py-12 px-4">
        {status === 'searching' && userRole !== 'COMPANION' ? (
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
            
            {/* CABECERA DINÁMICA */}
            {encounterState === 'waiting' ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-3xl text-center space-y-3 shadow-sm">
                <CheckCircle2 className="w-16 h-16 text-juntos-green mx-auto" />
                <h2 className="text-2xl font-bold text-green-900">
                    {userRole === 'COMPANION' ? '¡Servicio Asignado!' : '¡Acompañante Confirmado!'}
                </h2>
                <p className="text-green-800">
                    {userRole === 'COMPANION' 
                        ? 'Dirígete al punto de encuentro y presiona Check-in al llegar.' 
                        : 'Se ha notificado al acompañante. Él/Ella iniciará el Check-in al llegar.'}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl text-center space-y-3 shadow-sm">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Clock className="w-8 h-8 text-juntos-blue" />
                </div>
                <h2 className="text-2xl font-bold text-blue-900">Servicio en curso</h2>
                <p className="text-blue-800">El acompañamiento ha iniciado. Recuerda hacer check-out al terminar.</p>
              </div>
            )}

            <div className="bg-white border p-6 rounded-3xl shadow-sm space-y-6">
              
              {/* Info del Contraparte (Si soy cliente veo al acompañante, si soy acompañante veo al cliente) */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 shrink-0">
                  <User className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {userRole === 'COMPANION' ? 'Don Carlos Mendoza' : 'María Jiménez'}
                      {userRole !== 'COMPANION' && <ShieldCheck className="w-4 h-4 text-juntos-blue" />}
                  </h3>
                  <p className="text-sm text-slate-500">
                      {userRole === 'COMPANION' ? 'Paciente (78 años)' : 'Enfermera Auxiliar • 5.0 ⭐'}
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Punto de Encuentro</p>
                <div className="bg-slate-50 rounded-xl p-4 flex gap-4">
                  <MapPin className="w-6 h-6 text-juntos-blue shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">{meetPoint}</p>
                    <p className="text-sm text-slate-500">
                        {userRole === 'COMPANION' 
                            ? 'Debes estar aquí 15 minutos antes de la cita.' 
                            : 'El acompañante te esperará allí 15 minutos antes.'}
                    </p>
                  </div>
                </div>
              </div>

              {encounterState === 'waiting' && (
                <div className="w-full h-32 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-300">
                  <div className="absolute inset-0 bg-blue-50 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-juntos-blue flex flex-col items-center">
                    <MapPin className="w-8 h-8 fill-current text-juntos-blue" />
                    <span className="text-xs font-bold bg-white px-2 py-1 border rounded shadow-sm mt-1">Destino fijado</span>
                  </div>
                </div>
              )}

              {/* BOTONERA DINÁMICA (El Acompañante es quien tiene el control principal del Check-in/out) */}
              <div className="flex gap-3 pt-4">
                <Button className={`${userRole === 'COMPANION' ? 'w-1/3' : 'w-full'} h-14 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border`}>
                  <Phone className="w-4 h-4 mr-2" /> Llamar
                </Button>
                
                {/* Idealmente, solo el acompañante o el admin deberían poder hacer Check-in/out para evitar errores del paciente */}
                {userRole === 'COMPANION' && encounterState === 'waiting' && (
                  <Button 
                    className="w-2/3 h-14 text-white font-bold bg-juntos-blue hover:bg-juntos-blue/90"
                    onClick={handleCheckIn}
                  >
                    <Power className="w-5 h-5 mr-2" /> Check-in / Llegué
                  </Button>
                )}

                {userRole === 'COMPANION' && encounterState === 'started' && (
                  <Button 
                    className="w-2/3 h-14 text-white font-bold bg-red-600 hover:bg-red-700"
                    onClick={handleCheckOut}
                  >
                    <Power className="w-5 h-5 mr-2" /> Check-out / Cerrar
                  </Button>
                )}
                
                {/* Si soy paciente y está esperando o iniciado, le muestro que espere */}
                {userRole !== 'COMPANION' && encounterState !== 'finished' && (
                    <div className="hidden">
                        {/* El paciente no controla el check-in, lo ve cuando el acompañante lo hace */}
                    </div>
                )}

                {encounterState === 'finished' && (
                  <Button className="w-full h-14 text-white font-bold bg-slate-800" disabled>
                    Cerrando servicio...
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}