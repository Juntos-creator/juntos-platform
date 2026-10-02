'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { HeartHandshake, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

export default function CompanionOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Simulación de guardado en Supabase
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({ title: 'Solicitud enviada', description: 'Evaluaremos tu perfil pronto.', variant: 'success' });
    }, 1500);
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="container max-w-2xl py-20 text-center">
          <CheckCircle2 className="w-20 h-20 text-juntos-green mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-juntos-blue mb-4">¡Solicitud Recibida!</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Gracias por querer formar parte de la familia JUNTOS. Nuestro equipo de calidad revisará tu perfil, tus referencias y tu papel de buena conducta. Te contactaremos en un plazo de 48 horas.
          </p>
          <Button onClick={() => router.push('/')} className="bg-juntos-blue hover:bg-juntos-blue/90 text-white">
            Volver al inicio
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container max-w-3xl py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-juntos-blue flex items-center gap-3">
            <HeartHandshake className="h-8 w-8 text-juntos-green" />
            Solicitud para Acompañante
          </h1>
          <p className="text-muted-foreground mt-2">
            Llena este formulario con sinceridad. La seguridad y confianza de nuestros pacientes es nuestra máxima prioridad.
          </p>
        </div>

        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-juntos-blue" />
              Datos de Identidad
            </CardTitle>
            <CardDescription>Esta información es confidencial y se usará para verificación de antecedentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombres Completos *</Label>
                  <Input required placeholder="Ej. Ana María" />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos *</Label>
                  <Input required placeholder="Ej. González Pérez" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cédula de Identidad *</Label>
                  <Input required placeholder="000-0000000-0" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Nacimiento *</Label>
                  <Input required type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección de Residencia *</Label>
                <Input required placeholder="Provincia, Sector, Calle, Número de Casa" />
              </div>

              <hr className="my-6" />

              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-juntos-blue" />
                <h3 className="text-lg font-semibold text-slate-800">Perfil y Experiencia</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profesión u Oficio *</Label>
                  <Input required placeholder="Ej. Enfermera, Estudiante, Cuidadora..." />
                </div>
                <div className="space-y-2">
                  <Label>Disponibilidad *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">Selecciona una opción...</option>
                    <option value="full">Tiempo Completo (Mañana y Tarde)</option>
                    <option value="morning">Solo Mañanas</option>
                    <option value="afternoon">Solo Tardes</option>
                    <option value="weekends">Solo Fines de Semana</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cuéntanos tu experiencia *</Label>
                <Textarea 
                  required 
                  placeholder="¿Has cuidado a personas mayores, niños o pacientes médicos antes? Describe brevemente tu experiencia." 
                  className="h-24"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                <strong>Nota Importante:</strong> Si tu perfil pre-califica, te contactaremos para solicitarte el Certificado de No Antecedentes Penales (Papel de Buena Conducta) y coordinar una entrevista virtual.
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" size="lg" className="bg-juntos-blue hover:bg-juntos-blue/90 text-white" disabled={loading}>
                  {loading ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}