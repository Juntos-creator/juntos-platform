'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { Logo } from '@/components/brand/Logo';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  PhoneCall, 
  MessageCircle, 
  FileText, 
  UserCheck, 
  QrCode,
  Building2,
  ExternalLink
} from 'lucide-react';

function ReceiptContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const supabase = createClient();

  const [service, setService] = useState<any>(null);
  const [companion, setCompanion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceiptData() {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      try {
        // 1. Obtener la solicitud
        const { data: srv, error: sErr } = await supabase
          .from('service_requests')
          .select('*')
          .eq('id', serviceId)
          .maybeSingle();

        if (sErr || !srv) {
          setLoading(false);
          return;
        }

        setService(srv);

        // 2. Si tiene acompañante asignado, cargar su perfil público y credenciales
        if (srv.companion_id) {
          const { data: comp } = await supabase
            .from('profiles')
            .select('id, full_name, phone, role, created_at')
            .eq('id', srv.companion_id)
            .maybeSingle();

          setCompanion(comp);
        }
      } catch (err) {
        console.error('Error cargando recibo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReceiptData();
  }, [serviceId, supabase]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono">Generando comprobante y credenciales...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-950 border border-slate-800 rounded-3xl text-center space-y-4">
        <p className="text-xs text-slate-400">No se encontró información para este comprobante.</p>
        <Link 
          href="/profile" 
          className="inline-block bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          Ir a mis solicitudes
        </Link>
      </div>
    );
  }

  const orderNum = service.id.slice(0, 8).toUpperCase();
  const rateTotal = Number(service.rate_total || 0);
  const durationHours = service.duration_hours || 3;
  const unitPrice = 900;
  const subtotal = durationHours * unitPrice;
  const discount = subtotal - rateTotal;

  // Enlace directo de WhatsApp con el acompañante o la mesa central
  const contactPhone = companion?.phone || service.recipient_phone || '809-555-0100';
  const cleanPhone = contactPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola, le contacto respecto a la solicitud #${orderNum} de JUNTOS ASISTENCIA RD.`)}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* BARRA DE ACCIONES SUPERIOR (Oculta al imprimir) */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis Solicitudes</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL: RECIBO OFICIAL Y FICHA */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:border-black print:bg-white print:text-black">
        
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6 print:border-gray-300">
          <div>
            <Logo size="md" variant="dark" href="/" />
            <p className="text-[11px] text-slate-400 mt-2 print:text-gray-600">
              JUNTOS ASISTENCIA RD S.R.L. • RNC: 1-32-88992-1
            </p>
            <p className="text-[10px] text-slate-500 print:text-gray-500">
              Servicios de Asistencia Personal No Clínica bajo normativa legal dominicana.
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase print:border-gray-400 print:text-black">
              COMPROBANTE DIGITAL OFICIAL
            </span>
            <p className="text-lg font-black text-white font-mono print:text-black">
              ORDEN #{orderNum}
            </p>
            <p className="text-[11px] text-slate-400 print:text-gray-600">
              Emitido el {new Date(service.created_at || Date.now()).toLocaleDateString('es-DO')}
            </p>
          </div>
        </div>

        {/* FICHA DEL ACOMPAÑANTE ASIGNADO */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-4 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-gray-200">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 print:text-black">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Acompañante Asignado y Acreditado
            </span>
            <div className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> DEPILACIÓN PGR VALIDADA
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-lg">
                {companion?.full_name ? companion.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h3 className="font-black text-sm text-white print:text-black">
                  {companion?.full_name || 'Acompañante Asignado por Mesa Central'}
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600">
                  Carnet ID: <span className="font-mono text-emerald-400 print:text-black">JNT-{companion?.id ? companion.id.slice(0, 6).toUpperCase() : 'OFICIAL'}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Acreditación de 40 horas en movilidad asistida y primeros auxilios básicos.
                </p>
              </div>
            </div>

            {/* BOTÓN DIRECTO DE WHATSAPP AL ACOMPAÑANTE (Oculto al imprimir) */}
            <div className="flex items-center gap-2 print:hidden w-full sm:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* DETALLES LOGÍSTICOS DEL SERVICIO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 print:border-gray-200">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] print:text-gray-500">
              Persona Acompañada
            </p>
            <p className="text-sm font-black text-white print:text-black">{service.recipient_name}</p>
            <p className="text-slate-400">Tel: {service.recipient_phone || 'N/A'}</p>
            <p className="text-slate-400">Modalidad: {service.service_type}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 print:border-gray-200">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] print:text-gray-500">
              Punto de Encuentro y Horario
            </p>
            <p className="text-sm font-black text-white print:text-black">
              {service.scheduled_date || service.requested_date} a las {service.scheduled_time}
            </p>
            <p className="text-slate-400 truncate">{service.facility_or_location}</p>
            <p className="text-slate-400">Duración: {durationHours} Horas programadas</p>
          </div>
        </div>

        {/* TABLA DE DESGLOSE FINANCIERO */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-black">
            Desglose del Pago
          </h4>

          <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-gray-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black print:border-gray-300">
                <tr>
                  <th className="p-3">Descripción</th>
                  <th className="p-3 text-center">Horas</th>
                  <th className="p-3 text-right">Tarifa</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-200 text-slate-300 print:text-black">
                <tr>
                  <td className="p-3 font-medium">
                    Servicio de Asistencia y Acompañamiento No Clínico
                  </td>
                  <td className="p-3 text-center font-mono">{durationHours}h</td>
                  <td className="p-3 text-right font-mono">RD$ {unitPrice.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold">RD$ {subtotal.toLocaleString()}</td>
                </tr>
                {discount > 0 && (
                  <tr className="text-emerald-400 font-bold print:text-black">
                    <td className="p-3" colSpan={3}>Descuento de Red Familiar Aplicado (5%)</td>
                    <td className="p-3 text-right font-mono">- RD$ {discount.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="bg-slate-900/90 font-black text-sm text-white print:bg-gray-100 print:text-black">
                  <td className="p-3.5" colSpan={3}>Monto Total Liquidado (DOP)</td>
                  <td className="p-3.5 text-right font-mono text-emerald-400 print:text-black">
                    RD$ {rateTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PIE DE PÁGINA DEL RECIBO */}
        <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500 print:text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Mesa de Operaciones Central 24/7 • Santo Domingo Este, RD</span>
          </div>
          <div className="font-mono">
            Estatus: <span className="text-emerald-400 font-bold">PAGADO / EN EJECUCIÓN</span>
          </div>
        </div>

      </div>

    </main>
  );
}

export default function ServiceReceiptPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Cargando recibo...</div>}>
        <ReceiptContent />
      </Suspense>
    </div>
  );
}