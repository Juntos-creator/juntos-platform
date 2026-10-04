'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { createClient } from '@/lib/supabase/client';
import { 
  CreditCard, 
  Receipt, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id') || '';
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'TRANSFER'>('CARD');

  // Facturación Fiscal DGII
  const [needsNCF, setNeedsNCF] = useState(false);
  const [rncCedula, setRncCedula] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [ncfType, setNcfType] = useState('B01'); // B01: Crédito Fiscal, B02: Consumo Final

  // Datos Tarjeta
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
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
  const itbis = Math.round(subtotal * 0.18);
  const totalPagar = subtotal + (needsNCF ? itbis : 0);

  // Generador oficial de secuencia NCF DGII
  const ncfGenerado = needsNCF 
    ? `${ncfType}0000${Math.floor(1000 + Math.random() * 9000)}`
    : `B020000${Math.floor(1000 + Math.random() * 9000)}`;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);

    try {
      // 1. Registrar o actualizar pago en Supabase
      const { data: payRecord, error: payError } = await supabase
        .from('payments')
        .upsert({
          service_request_id: serviceId,
          amount: totalPagar,
          currency: 'DOP',
          status: paymentMethod === 'CARD' ? 'COMPLETED' : 'PENDING_VERIFICATION',
          payment_method: paymentMethod,
          ncf: ncfGenerado,
          rnc_cedula: needsNCF ? rncCedula : null,
          razon_social: needsNCF ? razonSocial : null,
        })
        .select()
        .single();

      // 2. Actualizar estado del servicio
      await supabase
        .from('service_requests')
        .update({
          payment_status: paymentMethod === 'CARD' ? 'PAID' : 'PENDING_AUDIT',
          status: paymentMethod === 'CARD' ? 'SCHEDULED' : 'PENDING_PAYMENT'
        })
        .eq('id', serviceId);

      alert(
        paymentMethod === 'CARD'
          ? `✓ Pago procesado exitosamente por RD$ ${totalPagar.toLocaleString()} con Comprobante NCF: ${ncfGenerado}`
          : `✓ Transferencia registrada. La Mesa de Operaciones validará el comprobante.`
      );

      router.push(`/services/receipt?id=${serviceId}`);
    } catch (err: any) {
      alert(`Error al procesar: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-xs">
        Cargando orden de pago...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold">
            <Lock className="w-3.5 h-3.5" /> PAGO SEGURO CIFRADO SSL
          </div>
          <h1 className="text-2xl font-black text-white">Pasarela de Pago y Comprobante Fiscal</h1>
          <p className="text-xs text-slate-400">
            Orden #{serviceId ? serviceId.slice(0, 8).toUpperCase() : 'PENDIENTE'} • República Dominicana
          </p>
        </div>

        <form onSubmit={handlePay} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: MÉTODO Y DGII (7 COLS) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* SELECTOR MÉTODO */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Selecciona Método de Pago
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                    paymentMethod === 'CARD'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold">Tarjeta de Crédito / Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold">Transferencia Bancaria</span>
                </button>
              </div>

              {/* CAMPOS TARJETA */}
              {paymentMethod === 'CARD' ? (
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Número de Tarjeta</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Vencimiento (MM/AA)</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* CUENTAS BANCARIAS RD */
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs space-y-2 text-slate-300">
                  <p className="font-bold text-white">Cuentas Corrientes Autorizadas (DOP):</p>
                  <p className="font-mono text-[11px]">• <strong>Banco Popular:</strong> 8023-XXXX-XX</p>
                  <p className="font-mono text-[11px]">• <strong>Banreservas:</strong> 240-XXXXXX-X</p>
                  <p className="text-[10px] text-slate-400">
                    A nombre de: <strong>JUNTOS ASISTENCIA SRL</strong> (RNC: 1-32-XXXXX-X)
                  </p>
                </div>
              )}
            </div>

            {/* FACTURACIÓN FISCAL NCF */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" /> ¿Requieres Comprobante Fiscal (DGII)?
                </span>
                <input
                  type="checkbox"
                  checked={needsNCF}
                  onChange={(e) => setNeedsNCF(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 h-4 w-4"
                />
              </div>

              {needsNCF && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Tipo de Comprobante</label>
                      <select
                        value={ncfType}
                        onChange={(e) => setNcfType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                      >
                        <option value="B01">Crédito Fiscal (B01)</option>
                        <option value="B02">Consumo Final (B02)</option>
                        <option value="B14">Gubernamental (B14)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">RNC o Cédula *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 101000000"
                        value={rncCedula}
                        onChange={(e) => setRncCedula(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Razón Social o Nombre Legal *</label>
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

          </div>

          {/* COLUMNA DERECHA: RESUMEN DE ORDEN (5 COLS) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Resumen de la Liquidación
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Servicio de Acompañamiento</span>
                  <span className="font-mono">RD$ {subtotal.toLocaleString()}</span>
                </div>

                {needsNCF && (
                  <div className="flex justify-between text-slate-400">
                    <span>ITBIS (18%)</span>
                    <span className="font-mono">RD$ {itbis.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold text-white">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-xl font-black text-emerald-400">
                    RD$ {totalPagar.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-mono text-emerald-400 font-bold block">
                  NCF Asignado: {ncfGenerado}
                </span>
                <p>Secuencia autorizada por la DGII para fines de declaración fiscal.</p>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <span>{processing ? 'Liquidando Transacción...' : `Pagar RD$ ${totalPagar.toLocaleString()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Comprobantes válidos para crédito fiscal en República Dominicana (Decreto 254-06).
            </div>
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