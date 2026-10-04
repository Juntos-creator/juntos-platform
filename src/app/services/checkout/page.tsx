'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  Banknote, 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight,
  Receipt,
  ShieldCheck,
  Clock
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id') || '';
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [metodo, setMetodo] = useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [needsNCF, setNeedsNCF] = useState(false);
  const [rncCedula, setRncCedula] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadService() {
      if (!serviceId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      setService(data);
      setLoading(false);
    }
    loadService();
  }, [serviceId, supabase]);

  const subtotal = Number(service?.rate_total || 2700);
  const ncfGenerado = needsNCF 
    ? `B010000${Math.floor(1000 + Math.random() * 9000)}` 
    : `B020000${Math.floor(1000 + Math.random() * 9000)}`;

  async function handleConfirmar(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);

    try {
      // Registrar pago como PENDIENTE DE CONCILIACIÓN
      await supabase
        .from('payments')
        .upsert({
          service_request_id: serviceId,
          amount: subtotal,
          currency: 'DOP',
          status: 'PENDIENTE_CONCILIACION',
          payment_method: metodo,
          ncf: ncfGenerado,
          rnc_cedula: needsNCF ? rncCedula : null,
          razon_social: needsNCF ? razonSocial : null,
        });

      // Actualizar estado del servicio a AGENDADO / PAGO POR COORDINAR
      await supabase
        .from('service_requests')
        .update({
          payment_status: 'COORDINADO_CENTRAL',
          status: 'SCHEDULED'
        })
        .eq('id', serviceId);

      router.push(`/services/receipt?id=${serviceId}`);
    } catch (err: any) {
      alert(`Error al registrar: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }

  function handleEnviarWhatsApp() {
    const tel = '18095550188'; // El número oficial de tu Mesa Central
    const msg = `🟢 *Comprobante de Pago - JUNTOS*\n\nHola Mesa Central, confirmo la coordinación de la orden *#${serviceId ? serviceId.slice(0, 8).toUpperCase() : ''}* por valor de *RD$ ${subtotal.toLocaleString()}*.\n\nAdjunto comprobante de transferencia / coordinaré el pago al llegar el acompañante.`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">
        Cargando coordinación de pago...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold">
            <Clock className="w-3.5 h-3.5" /> PAGO COORDINADO CON MESA CENTRAL
          </div>
          <h1 className="text-2xl font-black text-white">Coordinación de Pago y Comprobante</h1>
          <p className="text-xs text-slate-400">
            Orden #{serviceId ? serviceId.slice(0, 8).toUpperCase() : 'PENDIENTE'} • Paga al momento del servicio o vía transferencia.
          </p>
        </div>

        <form onSubmit={handleConfirmar} className="space-y-6">
          
          {/* SELECCIÓN DE MODALIDAD */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selecciona cómo deseas liquidar el servicio:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodo('TRANSFER')}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                  metodo === 'TRANSFER'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">Transferencia Bancaria</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vía Banco Popular o Banreservas (ACH / SIPARD).</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMetodo('CASH')}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3 ${
                  metodo === 'CASH'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">Al Llegar el Acompañante</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Paga en efectivo o transferencia contra entrega.</p>
                </div>
              </button>
            </div>

            {/* CUENTAS DE TRANSFERENCIA */}
            {metodo === 'TRANSFER' && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs space-y-3">
                <span className="font-bold text-white block">Cuentas Corrientes Autorizadas:</span>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <p>• <strong>Banco Popular:</strong> 8023-XXXX-XX (Corriente DOP)</p>
                  <p>• <strong>Banreservas:</strong> 240-XXXXXX-X (Corriente DOP)</p>
                  <p className="text-slate-400 text-[10px]">Beneficiario: <strong>JUNTOS ASISTENCIA SRL</strong></p>
                </div>

                <button
                  type="button"
                  onClick={handleEnviarWhatsApp}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notificar comprobante por WhatsApp a Despacho</span>
                </button>
              </div>
            )}
          </div>

          {/* COMPROBANTE DGII OPCIONAL */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                ¿Deseas Comprobante con Valor Fiscal (DGII)?
              </span>
              <input
                type="checkbox"
                checked={needsNCF}
                onChange={(e) => setNeedsNCF(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 h-4 w-4"
              />
            </div>

            {needsNCF && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">RNC o Cédula *</label>
                  <input
                    type="text"
                    required
                    placeholder="101000000"
                    value={rncCedula}
                    onChange={(e) => setRncCedula(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Razón Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre registrado en DGII"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RESUMEN Y BOTÓN FINAL */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block font-mono">Total Liquidación:</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                RD$ {subtotal.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <span>{processing ? 'Confirmando...' : 'Confirmar y Obtener PINs de Servicio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <CheckoutContent />
    </Suspense>
  );
}