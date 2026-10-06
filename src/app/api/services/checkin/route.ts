import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Validar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId, pin, latitude, longitude } = body;

    if (!serviceId || !pin) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (serviceId, pin).' }, { status: 400 });
    }

    // 2. Obtener el servicio
    const { data: service, error: srvError } = await supabase
      .from('service_requests')
      .select('id, status, companion_id, checkin_pin, pin_start, client_id, user_id, customer_id')
      .eq('id', serviceId)
      .maybeSingle();

    if (srvError || !service) {
      return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
    }

    // 3. Verificar autorización: acompañante asignado o cliente del servicio
    const isCompanion = service.companion_id === user.id;
    const isClient = [service.client_id, service.user_id, service.customer_id].includes(user.id);

    if (!isCompanion && !isClient) {
      return NextResponse.json(
        { error: 'Acceso denegado: no estás asignado a este servicio.' },
        { status: 403 }
      );
    }

    // 4. Verificar estado del servicio
    if (service.status !== 'ASSIGNED') {
      return NextResponse.json(
        { error: `El servicio no está en estado ASIGNADO (estado actual: ${service.status}).` },
        { status: 400 }
      );
    }

    // 5. Validación ESTRICTA del PIN (SIN fallbacks 1234/5678)
    const pinEsperado = String(service.checkin_pin || service.pin_start || '').trim();
    const pinIngresado = String(pin).trim();

    if (!pinEsperado || pinIngresado !== pinEsperado) {
      return NextResponse.json(
        { error: 'PIN de Check-In incorrecto. Solicítalo presencialmente al usuario.' },
        { status: 400 }
      );
    }

    // 6. Registrar inicio presencial y coordenadas GPS
    const coordenadasTxt = (latitude && longitude) ? `[GPS: ${latitude}, ${longitude}]` : null;

    const { data: updatedService, error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        ...(coordenadasTxt ? { checkin_location: coordenadasTxt } : {})
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el servicio: ' + updateError.message }, { status: 500 });
    }

    // 7. Registro de auditoría
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'SERVICE_CHECKIN_VALIDATED',
      details: { service_id: serviceId, location: coordenadasTxt }
    }).select().maybeSingle();

    return NextResponse.json({
      success: true,
      message: 'Check-In presencial validado con éxito.',
      service: updatedService
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno.' }, { status: 500 });
  }
}