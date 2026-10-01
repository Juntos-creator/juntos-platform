'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { addPilotMetric } from '@/app/admin/pilots/pilot-actions';

export function MetricForm({ pilotId }: { pilotId: string }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    week_number: 1, services_count: 0, satisfaction_avg: 4.5,
    incidents_count: 0, response_time_avg_minutes: 30, repeat_rate: 20, feedback: '',
  });
  const upd = (k: string, val: string) => setForm((f) => ({ ...f, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await addPilotMetric(pilotId, form);
      if (!res.ok) { toast({ title: 'Error', description: res.error, variant: 'error' }); return; }
      toast({ title: 'Metrica registrada', variant: 'success' });
      router.refresh();
    });
  }

  const fields: [string, string, string][] = [
    ['week_number','Semana','number'], ['services_count','Servicios','number'],
    ['satisfaction_avg','Satisfaccion (0-5)','number'], ['incidents_count','Incidentes','number'],
    ['response_time_avg_minutes','Tiempo resp. (min)','number'], ['repeat_rate','Repeticion (%)','number'],
  ];

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
      {fields.map(([k, lbl, type]) => (
        <div key={k}>
          <Label htmlFor={k}>{lbl}</Label>
          <Input id={k} type={type} step="any" value={(form as any)[k]} onChange={(e) => upd(k, e.target.value)} />
        </div>
      ))}
      <div className="md:col-span-3">
        <Label htmlFor="feedback">Feedback</Label>
        <Input id="feedback" value={form.feedback} onChange={(e) => upd('feedback', e.target.value)} />
      </div>
      <div className="md:col-span-3">
        <Button type="submit" variant="success" disabled={pending}>{pending ? 'Guardando...' : 'Registrar metrica semanal'}</Button>
      </div>
    </form>
  );
}
