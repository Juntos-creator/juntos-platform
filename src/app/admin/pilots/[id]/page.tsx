import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDOP } from '@/lib/utils';
import { MetricForm } from './metric-form';
import type { PilotMetric } from '@/types/db';
import { notFound } from 'next/navigation';

// Tarifa de referencia por servicio en pilotos B2B
const PILOT_SERVICE_RATE = 2200;

function kpi(value: number, ok: boolean, goal: string) {
  const variant: 'success' | 'warning' = ok ? 'success' : 'warning';
  return { value, variant, goal };
}

export default async function PilotDashboard({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: pilot } = await supabase.from('pilots').select('*, institutions(name)').eq('id', params.id).single();
  if (!pilot) notFound();
  const { data: metricsData } = await supabase
    .from('pilot_metrics').select('*').eq('pilot_id', params.id).order('week_number');
  const metrics = (metricsData ?? []) as PilotMetric[];

  const totalServices = metrics.reduce((a, m) => a + m.services_count, 0);
  const totalIncidents = metrics.reduce((a, m) => a + m.incidents_count, 0);
  const avgSat = metrics.length ? metrics.reduce((a, m) => a + Number(m.satisfaction_avg), 0) / metrics.length : 0;
  const avgResp = metrics.length ? metrics.reduce((a, m) => a + m.response_time_avg_minutes, 0) / metrics.length : 0;
  const avgRepeat = metrics.length ? metrics.reduce((a, m) => a + Number(m.repeat_rate), 0) / metrics.length : 0;
  const incidentRate = totalServices ? (totalIncidents / totalServices) * 100 : 0;
  const projectedBilling = totalServices * PILOT_SERVICE_RATE;

  const cards = [
    kpi(Number(avgSat.toFixed(2)), avgSat > 4.5, '> 4.5'),
    kpi(Number(incidentRate.toFixed(1)), incidentRate < 2, '< 2%'),
    kpi(Number(avgResp.toFixed(0)), avgResp < 30, '< 30 min'),
    kpi(Number(avgRepeat.toFixed(1)), avgRepeat > 20, '> 20%'),
  ];
  const labels = ['Satisfaccion', 'Tasa incidentes', 'Tiempo respuesta', 'Repeticion'];
  const units = ['estrellas', '%', 'min', '%'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-juntos-blue">Piloto 30 dias</h1>
        <p className="text-sm text-muted-foreground">{(pilot as any).institutions?.name}</p>
      </div>

      <Card className="bg-juntos-blue text-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Total facturado proyectado</p>
            <p className="text-3xl font-bold">{formatDOP(projectedBilling)}</p>
          </div>
          <p className="text-sm opacity-80">{totalServices} servicios x {formatDOP(PILOT_SERVICE_RATE)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((c, i) => (
          <Card key={i}><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{labels[i]}</p>
              <Badge variant={c.variant}>{c.variant === 'success' ? 'OK' : 'Alerta'}</Badge>
            </div>
            <p className="text-2xl font-bold mt-1">{c.value} <span className="text-xs font-normal text-muted-foreground">{units[i]}</span></p>
            <p className="text-[11px] text-muted-foreground">Objetivo {c.goal}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Metricas semanales</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Semana</th><th>Servicios</th><th>Satisf.</th><th>Incid.</th><th>Resp(min)</th><th>Repet(%)</th>
              </tr></thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="py-2">{m.week_number}</td><td>{m.services_count}</td>
                    <td>{Number(m.satisfaction_avg).toFixed(1)}</td><td>{m.incidents_count}</td>
                    <td>{m.response_time_avg_minutes}</td><td>{Number(m.repeat_rate).toFixed(0)}</td>
                  </tr>
                ))}
                {metrics.length === 0 && <tr><td colSpan={6} className="py-3 text-muted-foreground">Sin metricas aun.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Registrar metrica semanal</CardTitle></CardHeader>
        <CardContent><MetricForm pilotId={params.id} /></CardContent>
      </Card>
    </div>
  );
}
