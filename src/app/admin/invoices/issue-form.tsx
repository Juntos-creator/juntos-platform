'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { generateInvoice } from '@/app/admin/payment-actions';
import type { NcfType } from '@/types/db';

export function IssueInvoiceForm({ serviceRequestId }: { serviceRequestId: string }) {
  const [pending, start] = useTransition();
  const [type, setType] = useState<NcfType>('B02');
  const [rnc, setRnc] = useState('');
  const [company, setCompany] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  function issue() {
    start(async () => {
      const res = await generateInvoice(serviceRequestId, type, rnc || undefined, company || undefined);
      if (!res.ok) { toast({ title: 'Error', description: res.error, variant: 'error' }); return; }
      toast({ title: `NCF ${res.ncf_number ?? ''} emitido`, variant: 'success' });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={type} onChange={(e) => setType(e.target.value as NcfType)}
        className="h-9 rounded-md border border-input px-2 text-sm">
        <option value="B02">B02 Consumidor</option>
        <option value="B01">B01 Credito Fiscal</option>
      </select>
      {type === 'B01' && (
        <>
          <Input className="h-9 w-32" placeholder="RNC" value={rnc} onChange={(e) => setRnc(e.target.value)} />
          <Input className="h-9 w-40" placeholder="Razon social" value={company} onChange={(e) => setCompany(e.target.value)} />
        </>
      )}
      <Button size="sm" variant="success" disabled={pending} onClick={issue}>Emitir NCF</Button>
    </div>
  );
}
