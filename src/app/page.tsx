'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartHandshake, Building2, ShieldCheck, UserPlus, X, LayoutDashboard } from 'lucide-react';

export default function Home() {
  const [showB2BModal, setShowB2BModal] = useState(false);

  return (
    <main className="min-h-screen relative">
      <header className="bg-juntos-blue text-white">
        <div className="container flex h-16 items-center justify-between">
          <Logo withText className="[&_span]:text-white" />
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild variant="success">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-juntos-blue">
          Acompañamiento humano, <span className="text-juntos-green">no clínico</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Solicita acompañantes por horas para consultas y procedimientos médicos en
          República Dominicana. Para familias e instituciones de salud.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/services/new">Solicitar un servicio (B2C)</Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => setShowB2BModal(true)} className="w-full sm:w-auto">
            Soy institución (B2B)
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto border border-juntos-green text-juntos-green hover:bg-juntos-green/10">
            <Link href="/register">Quiero ser Acompañante</Link>
          </Button>
        </div>
      </section>

      {showB2BModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setShowB2BModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <CardHeader className="text-center pt-6">
              <div className="mx-auto w-12 h-12 bg-juntos-blue/10 rounded-full flex items-center justify-center text-juntos-blue mb-2">
                <Building2 className="w-6 h-6 text-juntos-blue" />
              </div>
              <CardTitle className="text-xl text-juntos-blue">Portal Institucional B2B</CardTitle>
              <CardDescription>
                Selecciona la acción que deseas realizar:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              
              {/* ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE! href="/register-b2b" */}
              <Button asChild className="w-full h-auto py-3 text-sm bg-juntos-blue hover:bg-juntos-blue/90 text-white flex items-center justify-start gap-3 px-4 whitespace-normal text-left">
                <Link href="/register-b2b">
                  <Building2 className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <strong className="block text-base">1. Afiliar mi Institución</strong>
                    <span className="text-xs font-normal opacity-90">Llenar formulario para ser parte de Juntos</span>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-auto py-3 text-sm flex items-center justify-start gap-3 px-4 border-slate-300 whitespace-normal text-left">
                <Link href="/login?redirect=/admin/institutions">
                  <LayoutDashboard className="w-6 h-6 flex-shrink-0 text-slate-600" />
                  <div>
                    <strong className="block text-base text-slate-700">2. Mi Panel de Control</strong>
                    <span className="text-xs text-slate-500 font-normal">Ver pacientes referidos por mi clínica</span>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-auto py-3 text-sm flex items-center justify-start gap-3 px-4 border-slate-300 whitespace-normal text-left">
                <Link href="/login?redirect=/services/new">
                  <UserPlus className="w-6 h-6 flex-shrink-0 text-juntos-green" />
                  <div>
                    <strong className="block text-base text-slate-700">3. Solicitar Servicio para Paciente</strong>
                    <span className="text-xs text-slate-500 font-normal">Registrar un paciente directo a mi panel</span>
                  </div>
                </Link>
              </Button>

            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}