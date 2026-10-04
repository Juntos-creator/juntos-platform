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

    if (!serviceId) {
      return NextResponse.json({ error: 'Falta serviceId' }, { status: 400 });
    }

    // 1. Obtener datos del acompañante que toma el servicio
    const { data: companionProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .maybeSingle();

    const companionName = companionProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Acompañante Certificado';
    const companionPhone = companionProfile?.phone || user.user_metadata?.phone || '809-555-0199';

    // 2. Asignar servicio
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        companion_id: user.id,
        companion_name: companionName,
        companion_phone: companionPhone,
        status: 'ASSIGNED'
      })
      .eq('id', serviceId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Servicio asignado correctamente.',
      companionName,
      companionPhone
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}