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

    const { data: service, error: sErr } = await supabase
      .from('service_requests')
      .select('id, checkin_pin, companion_id, status')
      .eq('id', serviceId)
      .single();

    if (sErr || !service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const expectedPin = service.checkin_pin || '1234';

    if (pin.trim() !== expectedPin.trim()) {
      return NextResponse.json({ error: 'PIN de Check-In incorrecto.' }, { status: 400 });
    }

    const { error: updErr } = await supabase
      .from('service_requests')
      .update({
        status: 'IN_PROGRESS',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Check-In validado. Servicio en curso.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}