import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { serviceId } = await req.json();

    // 1. Obtener detalles del servicio
    const { data: service, error: sErr } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (sErr || !service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    if (service.status !== 'PENDING_DISPATCH') {
      return NextResponse.json({ error: 'Este servicio ya fue tomado por otro acompañante.' }, { status: 400 });
    }

    // 2. Verificar la regla de 1 hora de margen con la función de BD
    const { data: hasConflict, error: cErr } = await supabase.rpc('check_companion_conflict', {
      p_companion_id: user.id,
      p_service_date: service.scheduled_date || service.requested_date,
      p_service_time: service.scheduled_time || '08:00',
      p_duration_hours: Number(service.duration_hours || 3)
    });

    if (cErr) {
      console.error(cErr);
      return NextResponse.json({ error: 'Error al verificar agenda' }, { status: 500 });
    }

    if (hasConflict) {
      return NextResponse.json({ 
        error: 'Conflicto en agenda: Debes contar con al menos 1 hora de margen entre servicios para traslado.' 
      }, { status: 409 });
    }

    // 3. Asignar el servicio al acompañante
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        companion_id: user.id,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Servicio asignado exitosamente.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}