import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, Building2, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
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
          Acompanamiento humano, <span className="text-juntos-green">no clinico</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Solicita acompanantes por horas para consultas y procedimientos medicos en
          Republica Dominicana. Para familias e instituciones de salud.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/services/new">Solicitar un servicio</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin/institutions">Soy institucion (B2B)</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 md:grid-cols-3 pb-20">
        {[
          { icon: HeartHandshake, t: 'B2C por horas', d: 'Flujo de solicitud en 9 pasos con geolocalizacion de centros.' },
          { icon: Building2, t: 'CRM B2B', d: 'Pilotos de 30 dias, funnel comercial y KPIs de calidad.' },
          { icon: ShieldCheck, t: 'Fiscal DGII', d: 'Facturas con NCF B01/B02, ITBIS 18% y auditoria inmutable.' },
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
