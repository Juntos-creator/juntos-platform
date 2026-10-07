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
      return NextResponse.json(
        { error: 'Debe iniciar sesión.' },
        { status: 401 }
      );
    }

    let body: {
      serviceId?: unknown;
      pin?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'El cuerpo JSON no es válido.' }, { status: 400 });
    }

    const { serviceId, pin, latitude, longitude } = body;

    if (
      typeof serviceId !== 'string' ||
      !serviceId.trim() ||
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

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'service_checkin',
      {
        p_service_id: serviceId.trim(),
        p_pin: pin.trim(),
        p_latitude: hasLatitude ? latitude : null,
        p_longitude: hasLongitude ? longitude : null,
      }
    );

    if (rpcError) {
      const message = rpcError.message ?? '';
      const normalizedMessage = message.toLowerCase();

      if (
        message.includes('Solo el cliente') ||
        message.includes('Solo el acompañante') ||
        normalizedMessage.includes('autorizado')
      ) {
        return NextResponse.json({ error: message }, { status: 403 });
      }

      if (normalizedMessage.includes('no encontrado')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }

      if (
        normalizedMessage.includes('pin') ||
        normalizedMessage.includes('coordenadas')
      ) {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      if (
        normalizedMessage.includes('estado') ||
        normalizedMessage.includes('iniciado')
      ) {
        return NextResponse.json({ error: message }, { status: 409 });
      }

      console.error('Error en service_checkin:', message);
      return NextResponse.json(
        { error: 'No se pudo confirmar el check-in.' },
        { status: 500 }
      );
    }

    // Usa el registro devuelto por el RPC, si existe; si no, verifica la fila guardada.
    const rpcService = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    let service =
      rpcService && typeof rpcService === 'object' ? rpcService : null;

    if (!service?.status) {
      const { data: savedService, error: selectError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', serviceId.trim())
        .maybeSingle();

      if (selectError) {
        console.error('No se pudo verificar el estado del check-in:', selectError.message);
        return NextResponse.json(
          { error: 'No se pudo verificar que el check-in se guardara.' },
          { status: 500 }
        );
      }

      service = savedService;
    }

    const status = String(service?.status ?? '').trim().toUpperCase();

    if (!service || !['IN_PROGRESS', 'EN_CURSO'].includes(status)) {
      console.error(
        `service_checkin no dejó el servicio en curso. Estado recibido: ${status || 'sin estado'}`
      );
      return NextResponse.json(
        { error: 'El PIN se validó, pero el servicio no quedó en curso. Revisa la función service_checkin.' },
        { status: 409 }
      );
    }

    const location = hasLatitude
      ? `[GPS: ${latitude}, ${longitude}]`
      : null;

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
      service,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno.';
    console.error('Error inesperado en check-in:', message);
    return NextResponse.json(
      { error: 'Error interno al confirmar el check-in.' },
      { status: 500 }
    );
  }
}