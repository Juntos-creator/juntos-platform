'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function AffiliationFormPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // Aquí en el futuro se guardarán los datos en la tabla de Supabase
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({ title: 'Solicitud enviada', description: 'Hemos recibido tu formulario.', variant: 'success' });
    }, 1500);
  }

  // Pantalla de éxito tras llenar el formulario
  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="container max-w-2xl py-20 text-center">
          <CheckCircle2 className="w-20 h-20 text-juntos-green mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-juntos-blue mb-4">¡Formulario Completado!</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Hemos recibido los datos de tu institución. Nuestro equipo validará la información comercial. Ya puedes acceder a tu panel de control.
          </p>
          <Button onClick={() => router.push('/admin/institutions')} className="bg-juntos-blue hover:bg-juntos-blue/90 text-white">
            Ir a mi Panel de Control
          </Button>
        </main>
      </>
    );
  }

  // El Formulario Completo
  return (
    <>
      <Navbar />
      <main className="container max-w-3xl py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-juntos-blue flex items-center gap-3">
            <Building2 className="h-8 w-8 text-juntos-green" />
            Formulario de Afiliación B2B
          </h1>
          <p className="text-muted-foreground mt-2">
            Completa los datos fiscales de tu institución para acceder a la red de JUNTOS y solicitar acompañamientos para tus pacientes.
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Información Empresarial</CardTitle>
            <CardDescription>Estos datos se utilizarán para la facturación (NCF) y validación corporativa.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razón Social *</Label>
                  <Input required placeholder="Ej. Centro Médico S.R.L." />
                </div>
                <div className="space-y-2">
                  <Label>RNC *</Label>
                  <Input required placeholder="1-30-00000-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección Física *</Label>
                <Input required placeholder="Calle, Número, Sector, Ciudad" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Contacto Principal *</Label>
                  <Input required placeholder="Ej. Dra. María Pérez" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Input required placeholder="Ej. Directora Médica" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono Institucional *</Label>
                  <Input required placeholder="+1 809-000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Centro *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">Selecciona una opción...</option>
                    <option value="clinica">Clínica Privada</option>
                    <option value="hospital">Hospital Público</option>
                    <option value="aseguradora">Aseguradora (ARS)</option>
                    <option value="centro_imagenes">Centro de Imágenes / Labs</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" size="lg" className="bg-juntos-blue hover:bg-juntos-blue/90 text-white" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Solicitud de Afiliación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}