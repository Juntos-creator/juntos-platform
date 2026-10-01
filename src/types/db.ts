export type UserRole = 'CUSTOMER' | 'COMPANION' | 'OPERATOR' | 'ADMIN' | 'AUDITOR';
export type SRStatus = 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus =
  | 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND' | 'CANCELLED';
export type PaymentProvider = 'CONFIG_REQUIRED' | 'AZUL' | 'CARDNET' | 'PAYPAL';
export type NcfType = 'B01' | 'B02';
export type InstitutionStatus =
  | 'PROSPECT' | 'CONTACTED' | 'MEETING' | 'PILOT_PROPOSED' | 'PILOT_ACTIVE' | 'CLIENT' | 'INACTIVE';

export interface ServiceRequest {
  id: string;
  code: string;
  customer_id: string;
  for_who: 'me' | 'familiar' | 'otro';
  for_who_name: string | null;
  service_type: string;
  requested_date: string;
  requested_time: string;
  duration_minutes: number;
  center_name: string | null;
  center_address: string | null;
  zone: string | null;
  target_lat: number | null;
  target_lng: number | null;
  observations: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  status: SRStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  service_id: string | null;
  service_request_id: string | null;
  customer_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  created_at: string;
}

export interface Invoice {
  id: string;
  service_request_id: string | null;
  customer_id: string;
  ncf_type: NcfType;
  ncf_number: string;
  subtotal: number;
  itbis: number;
  total: number;
  rnc_cedula: string | null;
  company_name: string | null;
  created_at: string;
}

export interface Institution {
  id: string;
  name: string;
  rnc: string | null;
  type: 'clinica' | 'hospital' | 'laboratorio';
  zone: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  status: InstitutionStatus;
  created_at: string;
}

export interface PilotMetric {
  id: string;
  pilot_id: string;
  week_number: number;
  services_count: number;
  satisfaction_avg: number;
  incidents_count: number;
  response_time_avg_minutes: number;
  repeat_rate: number;
  feedback: string | null;
  created_at: string;
}
