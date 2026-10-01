import { z } from 'zod';

export const CENTERS = [
  { name: 'CEDIMAT', lat: 18.4631, lng: -69.9389 },
  { name: 'Hospital General Plaza de la Salud', lat: 18.4760, lng: -69.9387 },
  { name: 'Clinica Abreu', lat: 18.4555, lng: -69.9099 },
  { name: 'Clinica Corazones Unidos', lat: 18.4710, lng: -69.9290 },
  { name: 'Hospiten Santo Domingo', lat: 18.4890, lng: -69.8570 },
  { name: 'Centro Medico Real', lat: 18.4820, lng: -69.9360 },
  { name: 'HOMS Santiago', lat: 19.4517, lng: -70.6970 },
  { name: 'Otro centro', lat: null, lng: null },
] as const;

export const SERVICE_TYPES = [
  'Acompanamiento a consulta medica',
  'Acompanamiento a procedimiento ambulatorio',
  'Acompanamiento a estudios / laboratorio',
  'Acompanamiento post-alta',
  'Acompanamiento a adulto mayor',
] as const;

// Schema del wizard de 9 pasos (B2C)
export const serviceRequestSchema = z.object({
  // Paso 1
  for_who: z.enum(['me', 'familiar', 'otro']),
  for_who_name: z.string().optional(),
  // Paso 2
  service_type: z.string().min(1, 'Selecciona un tipo de servicio'),
  // Paso 3
  requested_date: z.string().min(1, 'Selecciona la fecha'),
  // Paso 4
  requested_time: z.string().min(1, 'Selecciona la hora'),
  // Paso 5
  duration_hours: z.coerce.number().min(1, 'Minimo 1 hora').max(24),
  // Paso 6
  center_name: z.string().min(1, 'Selecciona el centro'),
  center_address: z.string().optional(),
  zone: z.string().optional(),
  target_lat: z.coerce.number().optional().nullable(),
  target_lng: z.coerce.number().optional().nullable(),
  // Paso 7
  observations: z.string().max(1000).optional(),
  // Paso 8
  emergency_contact_name: z.string().min(1, 'Nombre de contacto requerido'),
  emergency_contact_phone: z.string().min(1, 'WhatsApp requerido'),
  emergency_contact_relationship: z.string().min(1, 'Parentesco requerido'),
}).refine(
  (d) => d.for_who === 'me' || !!d.for_who_name,
  { message: 'Indica el nombre del destinatario', path: ['for_who_name'] }
);

export type ServiceRequestForm = z.infer<typeof serviceRequestSchema>;

export const metricSchema = z.object({
  week_number: z.coerce.number().min(1),
  services_count: z.coerce.number().min(0),
  satisfaction_avg: z.coerce.number().min(0).max(5),
  incidents_count: z.coerce.number().min(0),
  response_time_avg_minutes: z.coerce.number().min(0),
  repeat_rate: z.coerce.number().min(0).max(100),
  feedback: z.string().optional(),
});
