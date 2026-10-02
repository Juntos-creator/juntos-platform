'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartHandshake, Building2, ShieldCheck, UserPlus, LogIn, X } from 'lucide-react';

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
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/services/new">Solicitar un servicio (B2C)</Link>
          </Button>
          {/* Botón que abre las opciones B2B */}
          <Button size="lg" variant="outline" onClick={() => setShowB2BModal(true)}>
            Soy institución (B2B)
          </Button>
        </div>
      </section>

      {/* Modal / Selector de acceso B2B */}
      {showB2BModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                Selecciona cómo deseas ingresar a la plataforma:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {/* Opción 1: Nuevo Solicitante B2B */}
              <Button asChild className="w-full h-12 text-base bg-juntos-green hover:bg-juntos-green/90 text-white flex items-center gap-2">
                <Link href="/services/new?type=institution">
                  <UserPlus className="w-5 h-5" />
                  Nuevo Solicitante (Crear Solicitud)
                </Link>
              </Button>

              <div className="relative py-1 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 uppercase font-medium absolute">o</span>
              </div>

              {/* Opción 2: Ya registrado */}
              <Button asChild variant="outline" className="w-full h-12 text-base flex items-center gap-2 border-slate-300">
                <Link href="/login?redirect=/admin/institutions">
                  <LogIn className="w-5 h-5 text-slate-600" />
                  Ya registrado (Iniciar Sesión)
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="container grid gap-6 md:grid-cols-3 pb-20">
        {[
          { icon: HeartHandshake, t: 'B2C por horas', d: 'Flujo de solicitud en 9 pasos con geolocalización de centros.' },
          { icon: Building2, t: 'CRM B2B', d: 'Pilotos de 30 días, funnel comercial y KPIs de calidad.' },
          { icon: ShieldCheck, t: 'Fiscal DGII', d: 'Facturas con NCF B01/B02, ITBIS 18% y auditoría inmutable.' },
        ].map((f, i) => (
          <Card key={i}>
            <CardHeader>
              <f.icon className="h-8 w-8 text-juntos-green" />
              <CardTitle>{f.t}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{f.d}</CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}