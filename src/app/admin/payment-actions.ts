'use server';
import { createClient } from '@/lib/supabase/server';
import { writeAudit } from '@/lib/audit';
import { invoiceBreakdown } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';
import type { PaymentStatus, NcfType } from '@/types/db';

// Transiciones validas de la maquina de estados de pago
const ALLOWED: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['AUTHORIZED', 'CANCELLED', 'FAILED'],
  AUTHORIZED: ['PAID', 'CANCELLED', 'FAILED'],
  PAID: ['REFUNDED', 'PARTIAL_REFUND'],
  FAILED: ['PENDING'],
  REFUNDED: [],
  PARTIAL_REFUND: ['REFUNDED'],
  CANCELLED: [],
};

export async function transitionPayment(paymentId: string, to: PaymentStatus) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'No autenticado' };

  const { data: pay } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (!pay) return { ok: false, error: 'Pago no encontrado' };

  if (!ALLOWED[pay.status as PaymentStatus].includes(to)) {
    return { ok: false, error: `Transicion invalida: ${pay.status} -> ${to}` };
  }

  const { error } = await supabase.from('payments').update({ status: to }).eq('id', paymentId);
  if (error) return { ok: false, error: error.message };

  await writeAudit({
    actorId: auth.user.id, action: `PAYMENT_${to}`, entity: 'payments',
    entityId: paymentId, oldValue: { status: pay.status }, newValue: { status: to },
  });

  // Al pasar a PAID se genera la factura automaticamente (B02 por defecto)
  if (to === 'PAID' && pay.service_request_id) {
    await generateInvoice(pay.service_request_id, 'B02');
  }

  revalidatePath('/admin/payments');
  revalidatePath('/admin/invoices');
  return { ok: true };
}

export async function generateInvoice(
  serviceRequestId: string,
  ncfType: NcfType,
  rncCedula?: string,
  companyName?: string
) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'No autenticado' };

  // Evita duplicar factura
  const { data: existing } = await supabase
    .from('invoices').select('id').eq('service_request_id', serviceRequestId).maybeSingle();
  if (existing) return { ok: true, id: existing.id, duplicated: true };

  const { data: pay } = await supabase
    .from('payments').select('amount, customer_id')
    .eq('service_request_id', serviceRequestId)
    .order('created_at', { ascending: false }).limit(1).single();
  if (!pay) return { ok: false, error: 'No hay pago asociado' };

  const { subtotal, itbis, total } = invoiceBreakdown(Number(pay.amount));

  const { data: inv, error } = await supabase.from('invoices').insert({
    service_request_id: serviceRequestId,
    customer_id: pay.customer_id,
    ncf_type: ncfType,
    subtotal, itbis, total,
    rnc_cedula: rncCedula ?? null,
    company_name: companyName ?? null,
  }).select('id, ncf_number').single();

  if (error) return { ok: false, error: error.message };

  await writeAudit({
    actorId: auth.user.id, action: 'INVOICE_ISSUED', entity: 'invoices',
    entityId: inv.id, newValue: { ncf_number: inv.ncf_number, total },
  });

  revalidatePath('/admin/invoices');
  return { ok: true, id: inv.id, ncf_number: inv.ncf_number };
}
