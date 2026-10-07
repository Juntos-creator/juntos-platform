import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Debe iniciar sesión.' }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId, pin, latitude, longitude } = body;

    if (
      typeof serviceId !== 'string' ||
      !serviceId ||
      typeof pin !== 'string' ||
      !pin.trim()
    ) {
      return NextResponse.json(
        { error: 'Se requieren serviceId y PIN.' },
        { status: 400 }
      );
    }

    const hasLatitude = latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== undefined && longitude !== null;

    if (hasLatitude !== hasLongitude) {
      return NextResponse.json(
        { error: 'Envía ambas coordenadas o ninguna.' },
        { status: 400 }
      );
    }

    if (
      hasLatitude &&
      (typeof latitude !== 'number' ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      return NextResponse.json(
        { error: 'Coordenadas inválidas.' },
        { status: 400 }
      );
    }

    const { error: rpcError } = await supabase.rpc('service_checkin', {
      p_service_id: serviceId,
      p_pin: pin.trim(),
      p_latitude: hasLatitude ? latitude : null,
      p_longitude: hasLongitude ? longitude : null,
    });

    if (rpcError) {
      const message = rpcError.message ?? '';

      if (message.includes('Solo el cliente')) {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      if (message.includes('no encontrado')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message.includes('PIN') || message.includes('Coordenadas')) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (message.includes('estado') || message.includes('iniciado')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }

      console.error('Error en service_checkin:', message);
      return NextResponse.json(
        { error: 'No se pudo confirmar el check-in.' },
        { status: 500 }
      );
    }

    const location = hasLatitude ? `[GPS: ${latitude}, ${longitude}]` : null;
    const { error: auditError } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'SERVICE_CHECKIN_VALIDATED',
      details: { service_id: serviceId, location },
    });

    if (auditError) {
      console.error('Error de auditoría de check-in:', auditError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in validado con éxito.',
      service: { id: serviceId, status: 'IN_PROGRESS' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}