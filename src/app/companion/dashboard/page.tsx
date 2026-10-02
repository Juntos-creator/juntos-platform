'use client';

import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, DollarSign, UserSquare2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast';

export default function CompanionDashboardPage() {
  const { toast } = useToast();
  const [arrived, setArrived] = useState(false);

  const handleArrival = () => {
    setArrived(true);
    toast({
      title: 'Llegada confirmada',
      description: 'Se ha notificado al familiar que ya estás en el centro médico.',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container max-w-5xl py-8 px-4">
        
        {/* Encabezado del Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-juntos-blue">Mi Panel de Trabajo</h1>
            <p className="text-muted-foreground mt-1">Bienvenido(a), aquí tienes el resumen de tus acompañamientos.</p>
          </div>
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            Perfil Aprobado y Activo
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tarjetas de Estadísticas */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Ganancias del Mes</CardTitle>
              <DollarSign className="w-5 h-5 text-juntos-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-juntos-blue">RD$ 12,500</div>
              <p className="text-xs text-muted-foreground mt-1">+RD$ 3,000 esta semana</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Servicios Completados</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-juntos-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-juntos-blue">14</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Horas de Acompañamiento</CardTitle>
              <Clock className="w-5 h-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-juntos-blue">48 hrs</div>
              <p className="text-xs text-muted-foreground mt-1">Calificación promedio: 5.0 ⭐</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Próximo Servicio (Ocupa 2 columnas en pantallas grandes) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-juntos-green" />
              Tu próximo servicio asignado
            </h2>
            
            <Card className="shadow-md border-juntos-blue/20 overflow-hidden">
              <div className="bg-juntos-blue/5 px-6 py-4 border-b border-juntos-blue/10 flex justify-between items-center">
                <span className="text-sm font-bold text-juntos-blue uppercase tracking-wider">Hoy</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                  Confirmado
                </span>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <UserSquare2 className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-500">Paciente</p>
                        <p className="font-semibold text-slate-900">Don Carlos Mendoza (78 años)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-500">Centro Médico</p>
                        <p className="font-semibold text-slate-900">Plaza de la Salud</p>
                        <p className="text-sm text-muted-foreground">Área de Cardiología, 2do Nivel</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-500">Fecha y Hora</p>
                        <p className="font-semibold text-slate-900">2 de Octubre, 2026</p>
                        <p className="text-sm text-juntos-blue font-medium">02:30 PM - 06:30 PM (4 hrs)</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <Button 
                    className={`w-full sm:w-auto ${arrived ? 'bg-green-600 hover:bg-green-700' : 'bg-juntos-blue hover:bg-juntos-blue/90'} text-white`}
                    onClick={handleArrival}
                    disabled={arrived}
                  >
                    {arrived ? (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Llegada Confirmada</>
                    ) : (
                      <><MapPin className="w-4 h-4 mr-2" /> Confirmar que llegué al centro</>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Ver detalles médicos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historial Reciente */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Historial reciente</h2>
            
            <div className="space-y-4">
              {/* Item de historial */}
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Clínica Abreu</p>
                    <p className="text-xs text-muted-foreground">Ayer • 3 horas</p>
                  </div>
                  <div className="ml-auto font-bold text-sm text-juntos-green">
                    +RD$ 900
                  </div>
                </CardContent>
              </Card>

              {/* Item de historial */}
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">Hospital General</p>
                    <p className="text-xs text-muted-foreground">28 Sept • 5 horas</p>
                  </div>
                  <div className="ml-auto font-bold text-sm text-juntos-green">
                    +RD$ 1,500
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button variant="ghost" className="w-full text-juntos-blue hover:text-juntos-blue/80">
              Ver todo mi historial
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}