'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { transitionPayment } from '@/app/admin/payment-actions';
import type { PaymentStatus } from '@/types/db';

const NEXT: Partial<Record<PaymentStatus, { to: PaymentStatus; label: string; variant?: 'success' | 'default' }>> = {
  PENDING: { to: 'AUTHORIZED', label: 'Autorizar' },
  AUTHORIZED: { to: 'PAID', label: 'Marcar PAID', variant: 'success' },
};

export function PaymentRowActions({ paymentId, status }: { paymentId: string; status: PaymentStatus }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const action = NEXT[status];

  function run(to: PaymentStatus) {
    start(async () => {
      const res = await transitionPayment(paymentId, to);
      if (!res.ok) { toast({ title: 'Error', description: res.error, variant: 'error' }); return; }
      toast({ title: `Pago ${to}`, variant: 'success' });
      router.refresh();
    });
  }

  if (!action && status !== 'PAID') return <span className="text-xs text-muted-foreground">Sin acciones</span>;
  return (
    <div className="flex gap-2">
      {action && (
        <Button size="sm" variant={action.variant ?? 'default'} disabled={pending} onClick={() => run(action.to)}>
          {action.label}
        </Button>
      )}
      {status === 'PAID' && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run('REFUNDED')}>Reembolsar</Button>
      )}
    </div>
  );
}
