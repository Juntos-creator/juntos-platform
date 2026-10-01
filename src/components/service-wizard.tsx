'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { serviceRequestSchema, type ServiceRequestForm, CENTERS, SERVICE_TYPES } from '@/lib/validations';
import { createServiceRequest } from '@/app/services/actions';
import { basePriceDOP } from '@/lib/pricing';
import { formatDOP } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { MapPin, CheckCircle2 } from 'lucide-react';

const STEPS = ['Destinatario','Servicio','Fecha','Hora','Duracion','Centro','Observaciones','Emergencia','Confirmar'];

export function ServiceWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ServiceRequestForm>({
    resolver: zodResolver(serviceRequestSchema),
    mode: 'onTouched',
    defaultValues: { for_who: 'me', duration_hours: 4, center_name: '' },
  });
  const { register, watch, setValue, trigger, getValues, formState: { errors } } = form;
  const v = watch();

  // Campos a validar por paso
  const fieldsByStep: (keyof ServiceRequestForm)[][] = [
    ['for_who', 'for_who_name'], ['service_type'], ['requested_date'], ['requested_time'],
    ['duration_hours'], ['center_name'], ['observations'],
    ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'], [],
  ];

  async function next() {
    const ok = await trigger(fieldsByStep[step]);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function captureGPS() {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocalizacion no disponible', variant: 'error' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('target_lat', pos.coords.latitude);
        setValue('target_lng', pos.coords.longitude);
        toast({ title: 'Ubicacion capturada', variant: 'success' });
      },
      () => toast({ title: 'No se pudo obtener la ubicacion', variant: 'error' })
    );
  }

  function onCenterChange(name: string) {
    setValue('center_name', name);
    const c = CENTERS.find((x) => x.name === name);
    if (c && c.lat != null) {
      setValue('target_lat', c.lat);
      setValue('target_lng', c.lng as number);
    }
  }

  async function submit() {
    setSubmitting(true);
    const res = await createServiceRequest(getValues());
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: 'Error', description: res.error, variant: 'error' });
      return;
    }
    toast({ title: `Solicitud ${res.code} creada`, variant: 'success' });
    router.push(`/services/checkout/${res.id}`);
  }

  const price = basePriceDOP(v.duration_hours || 0);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-juntos-blue">Solicitar acompanamiento</CardTitle>
        <div className="flex gap-1 mt-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-juntos-green' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Paso {step + 1} de {STEPS.length}: {STEPS[step]}</p>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[260px]">
        {step === 0 && (
          <div className="space-y-3">
            <Label>Para quien es el servicio?</Label>
            <div className="flex gap-2">
              {([['me','Para mi'],['familiar','Un familiar'],['otro','Otra persona']] as const).map(([val,lbl]) => (
                <button key={val} type="button" onClick={() => setValue('for_who', val)}
                  className={`flex-1 border rounded-md p-3 text-sm ${v.for_who===val?'border-juntos-green bg-juntos-green-50':'border-input'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            {v.for_who !== 'me' && (
              <div>
                <Label htmlFor="fwn">Nombre del destinatario</Label>
                <Input id="fwn" {...register('for_who_name')} />
                {errors.for_who_name && <p className="text-xs text-destructive mt-1">{errors.for_who_name.message}</p>}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <Label>Tipo de servicio</Label>
            <div className="grid gap-2">
              {SERVICE_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setValue('service_type', t)}
                  className={`text-left border rounded-md p-3 text-sm ${v.service_type===t?'border-juntos-green bg-juntos-green-50':'border-input'}`}>{t}</button>
              ))}
            </div>
            {errors.service_type && <p className="text-xs text-destructive mt-1">{errors.service_type.message}</p>}
          </div>
        )}

        {step === 2 && (
          <div>
            <Label htmlFor="date">Fecha del servicio</Label>
            <Input id="date" type="date" {...register('requested_date')} />
            {errors.requested_date && <p className="text-xs text-destructive mt-1">{errors.requested_date.message}</p>}
          </div>
        )}

        {step === 3 && (
          <div>
            <Label htmlFor="time">Hora estimada</Label>
            <Input id="time" type="time" {...register('requested_time')} />
            {errors.requested_time && <p className="text-xs text-destructive mt-1">{errors.requested_time.message}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <Label htmlFor="dur">Duracion (horas)</Label>
            <Input id="dur" type="number" min={1} max={24} {...register('duration_hours')} />
            <div className="rounded-md bg-juntos-blue-50 p-3 text-sm">
              Tarifa base estimada: <span className="font-semibold text-juntos-blue">{formatDOP(price)}</span>
              <span className="text-muted-foreground"> (RD$900 / hora)</span>
            </div>
            {errors.duration_hours && <p className="text-xs text-destructive">{errors.duration_hours.message}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <Label>Centro de atencion</Label>
            <div className="grid gap-2 max-h-56 overflow-auto">
              {CENTERS.map((c) => (
                <button key={c.name} type="button" onClick={() => onCenterChange(c.name)}
                  className={`text-left border rounded-md p-2.5 text-sm ${v.center_name===c.name?'border-juntos-green bg-juntos-green-50':'border-input'}`}>{c.name}</button>
              ))}
            </div>
            {v.center_name === 'Otro centro' && (
              <Input placeholder="Direccion del centro" {...register('center_address')} />
            )}
            <Button type="button" variant="outline" size="sm" onClick={captureGPS}>
              <MapPin className="h-4 w-4" /> Capturar mi ubicacion GPS
            </Button>
            {v.target_lat != null && (
              <p className="text-xs text-muted-foreground">Coord: {v.target_lat?.toFixed(4)}, {v.target_lng?.toFixed(4)}</p>
            )}
            {errors.center_name && <p className="text-xs text-destructive">{errors.center_name.message}</p>}
          </div>
        )}

        {step === 6 && (
          <div>
            <Label htmlFor="obs">Observaciones logisticas</Label>
            <textarea id="obs" rows={4} {...register('observations')}
              className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              placeholder="Ej. silla de ruedas, punto de encuentro. NO incluir datos clinicos." />
            <p className="text-xs text-muted-foreground mt-1">No registres informacion clinica confidencial.</p>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3">
            <div><Label htmlFor="ecn">Nombre del contacto</Label><Input id="ecn" {...register('emergency_contact_name')} /></div>
            <div><Label htmlFor="ecp">WhatsApp</Label><Input id="ecp" {...register('emergency_contact_phone')} placeholder="+1 809..." /></div>
            <div><Label htmlFor="ecr">Parentesco</Label><Input id="ecr" {...register('emergency_contact_relationship')} /></div>
            {(errors.emergency_contact_name || errors.emergency_contact_phone || errors.emergency_contact_relationship) &&
              <p className="text-xs text-destructive">Completa los datos del contacto de emergencia.</p>}
          </div>
        )}

        {step === 8 && (
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-juntos-blue flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-juntos-green" /> Resumen</h3>
            <Row k="Destinatario" val={v.for_who === 'me' ? 'Para mi' : (v.for_who_name || '-')} />
            <Row k="Servicio" val={v.service_type} />
            <Row k="Fecha / hora" val={`${v.requested_date} ${v.requested_time}`} />
            <Row k="Duracion" val={`${v.duration_hours} h`} />
            <Row k="Centro" val={v.center_name} />
            <Row k="Contacto emergencia" val={`${v.emergency_contact_name} (${v.emergency_contact_relationship})`} />
            <Row k="Tarifa base" val={formatDOP(price)} />
          </div>
        )}
      </CardContent>

      <div className="flex justify-between p-6 pt-0">
        <Button type="button" variant="outline" onClick={back} disabled={step === 0}>Atras</Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>Siguiente</Button>
        ) : (
          <Button type="button" variant="success" onClick={submit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Confirmar e ir a pagar'}
          </Button>
        )}
      </div>
    </Card>
  );
}

function Row({ k, val }: { k: string; val?: string }) {
  return (
    <div className="flex justify-between border-b py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{val || '-'}</span>
    </div>
  );
}
