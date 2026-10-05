import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/brand/Logo';
import { formatDOP, formatDate } from '@/lib/utils';
import { PrintButton } from './print-button';
import { notFound } from 'next/navigation';

export default async function InvoicePrint({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: inv } = await supabase
    .from('invoices').select('*, service_requests(code, service_type, duration_minutes)')
    .eq('id', params.id).single();
  if (!inv) notFound();
  const sr = (inv as any).service_requests;

  return (
    <div className="min-h-screen bg-muted py-8 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow print:shadow-none print:rounded-none p-8">
        {/* Encabezado con logo oficial */}
        <div className="flex items-center justify-between border-b-2 border-juntos-blue pb-4">
          <Logo size="lg" />
          <div className="text-right text-sm">
            <p className="font-bold text-juntos-blue">COMPROBANTE FISCAL</p>
            <p className="text-muted-foreground">{inv.ncf_type === 'B01' ? 'Credito Fiscal (B01)' : 'Consumidor Final (B02)'}</p>
          </div>
        </div>

        <div className="flex justify-between mt-6 text-sm">
          <div>
            <p className="text-muted-foreground">NCF</p>
            <p className="font-mono font-bold text-lg">{inv.ncf_number}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Fecha de emision</p>
            <p className="font-medium">{formatDate(inv.created_at)}</p>
          </div>
        </div>

        {inv.ncf_type === 'B01' && (
          <div className="mt-4 text-sm bg-juntos-blue-50 rounded p-3">
            <p><span className="text-muted-foreground">Razon social:</span> {inv.company_name ?? '-'}</p>
            <p><span className="text-muted-foreground">RNC / Cedula:</span> {inv.rnc_cedula ?? '-'}</p>
          </div>
        )}

        <table className="w-full mt-6 text-sm">
          <thead><tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Descripcion</th><th className="text-right">Importe</th>
          </tr></thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">{sr?.service_type ?? 'Servicio de acompanamiento'}<br/>
                <span className="text-xs text-muted-foreground">Ref. {sr?.code} / {(sr?.duration_minutes ?? 0) / 60} h</span></td>
              <td className="text-right">{formatDOP(Number(inv.subtotal))}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-56 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatDOP(Number(inv.subtotal))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">ITBIS (18%)</span><span>{formatDOP(Number(inv.itbis))}</span></div>
          <div className="flex justify-between border-t pt-1 font-bold text-juntos-blue text-base"><span>Total</span><span>{formatDOP(Number(inv.total))}</span></div>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground text-center border-t pt-4">
          JUNTOS - Acompanamiento humano no clinico / Republica Dominicana / Comprobante conforme a normativa DGII.
        </p>

        <div className="mt-6 flex justify-center print:hidden"><PrintButton /></div>
      </div>
    </div>
  );
}