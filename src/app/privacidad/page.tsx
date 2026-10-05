'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ShieldCheck, Lock } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1">
        
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" /> PROTECCIÓN DE DATOS PERSONALES
          </div>
          <h1 className="text-3xl font-black text-white">Política de Privacidad y Confidencialidad</h1>
          <p className="text-xs text-slate-400">Conforme a la Ley No. 172-13 de la República Dominicana</p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Responsable del Tratamiento y Finalidad</h2>
            <p>
              De conformidad con la <strong>Ley Orgánica No. 172-13 sobre Protección Integral de los Datos Personales</strong>, los datos recabados en este sitio web (nombre, teléfono, ubicación geográfica, contacto de emergencia y condiciones de movilidad ambulatoria) se recopilan con el único propósito de despachar, coordinar y garantizar la seguridad del acompañamiento solicitado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Datos de Movilidad y Población Vulnerable</h2>
            <p>
              La información sobre si el beneficiario utiliza silla de ruedas, andador o apoyo de brazo se clasifica como <strong>dato sensible de asistencia</strong>. Solo el acompañante expresamente asignado a la orden y el operador de despacho de guardia tienen acceso a estos detalles, exclusivamente durante la vigencia de la reserva.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Seguridad de Pagos y Tarjetas</h2>
            <p>
              JUNTOS Asistencia no almacena números completos de tarjetas de crédito o débito ni códigos CVV en sus servidores. Toda transacción digital se efectúa mediante pasarelas de pago cifradas con tokenización bancaria bajo estándares de seguridad PCI-DSS.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Derechos de Acceso, Rectificación y Supresión (ARCO)</h2>
            <p>
              Cualquier titular o familiar facultado puede solicitar el acceso, actualización o eliminación definitiva de sus datos personales de nuestros registros escribiendo a <strong>odelkis.cantante@gmail.com</strong> con copia de su documento de identidad.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}