import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, companionId, companionName, companionPhone } = body;

    let targetId = serviceId;

    // Si no enviaron serviceId o viene vacío, buscar el servicio pendiente más reciente
    if (!targetId) {
      const { data: pending } = await supabase
        .from('service_requests')
        .select('id')
        .in('status', ['PENDING', 'PENDING_DISPATCH', 'SCHEDULED', 'AGENDADO'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) targetId = pending.id;
    }

    if (!targetId) {
      const { data: anySrv } = await supabase
        .from('service_requests')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anySrv) targetId = anySrv.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'No se encontró ninguna orden para asignar' }, { status: 404 });
    }

    const cId = companionId || 'companion_active';
    const cName = companionName || 'Acompañante Acreditado';
    const cPhone = companionPhone || '809-541-2000';

    const { data: updated, error } = await supabase
      .from('service_requests')
      .update({
        companion_id: cId,
        companion_name: cName,
        companion_phone: cPhone,
        status: 'ASSIGNED'
      })
      .eq('id', targetId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      serviceId: targetId,
      service: updated
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en claim' }, { status: 500 });
  }
}