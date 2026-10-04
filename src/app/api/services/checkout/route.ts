import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { serviceId, pin } = await req.json();

    if (!serviceId || !pin) {
      return NextResponse.json({ error: 'Faltan datos requeridos (ID o PIN)' }, { status: 400 });
    }

    // 1. Consultar el servicio y su PIN registrado
    const { data: service, error: sErr } = await supabase
      .from('service_requests')
      .select('id, checkout_pin, companion_id, status')
      .eq('id', serviceId)
      .single();

    if (sErr || !service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // 2. Verificar que quien intenta cerrar sea el acompañante asignado o un ADMIN
    const isMasterAdmin = user.email === 'odel_kiss@hotmail.com';
    if (service.companion_id !== user.id && !isMasterAdmin) {
      return NextResponse.json({ error: 'No tienes autorización para cerrar este servicio.' }, { status: 403 });
    }

    // 3. Obtener el PIN real (o fallback derivado del ID si no fue persistido)
    const expectedPin = service.checkout_pin || service.id.replace(/\D/g, '').slice(0, 4) || '8421';

    if (pin.trim() !== expectedPin.trim()) {
      return NextResponse.json({ 
        error: 'PIN de verificación incorrecto. Solicítale el código exacto de 4 dígitos al cliente.' 
      }, { status: 400 });
    }

    // 4. Marcar servicio como COMPLETADO
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '¡Servicio finalizado y validado con éxito!' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}