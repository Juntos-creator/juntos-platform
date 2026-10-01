'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { transitionPayment } from '@/app/admin/payment-actions';
import type { PaymentStatus } from '@/types/db';

export function CheckoutActions({ paymentId, currentStatus }: { paymentId: string; currentStatus: PaymentStatus }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<PaymentStatus>(currentStatus);
  const { toast } = useToast();
  const router = useRouter();

  function run(to: PaymentStatus) {
    startTransition(async () => {
      const res = await transitionPayment(paymentId, to);
      if (!res.ok) { toast({ title: 'Error', description: res.error, variant: 'error' }); return; }
      setStatus(to);
      toast({ title: `Pago ${to}`, variant: 'success' });
      router.refresh();
    });
  }

  if (status === 'PAID') {
    return <p className="text-sm text-juntos-green font-medium">Pago completado. Factura generada automaticamente.</p>;
  }

  return (
    <div className="flex gap-2 pt-2">
      {status === 'PENDING' && (
        <Button onClick={() => run('AUTHORIZED')} disabled={pending}>Autorizar pago</Button>
      )}
      {status === 'AUTHORIZED' && (
        <Button variant="success" onClick={() => run('PAID')} disabled={pending}>Confirmar pago (PAID)</Button>
      )}
    </div>
  );
}
