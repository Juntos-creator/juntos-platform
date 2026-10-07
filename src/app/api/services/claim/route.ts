import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Validar autenticación obligatoria
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión.' },
        { status: 401 }
      );
    }

    // 2. Validar que el usuario tenga rol COMPANION y KYC APROBADO
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado.' },
        { status: 404 }
      );
    }

    if (profile.role !== 'COMPANION' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado: solo acompañantes acreditados pueden tomar servicios.' },
        { status: 403 }
      );
    }

    if (profile.role === 'COMPANION' && profile.status !== 'APROBADO') {
      return NextResponse.json(
        { error: 'Su perfil de acompañante está pendiente de aprobación KYC.' },
        { status: 403 }
      );
    }

    // 3. Obtener el serviceId obligatorio
    const body = await req.json();
    const { serviceId } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'El parámetro serviceId es obligatorio.' },
        { status: 400 }
      );
    }

    // 4. Verificar que la orden exista y esté disponible para despacho
    const { data: service, error: srvError } = await supabase
      .from('service_requests')
      .select('id, status, companion_id')
      .eq('id', serviceId)
      .maybeSingle();

    if (srvError || !service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado.' },
        { status: 404 }
      );
    }

    const estadosDisponibles = ['PENDING', 'PENDING_DISPATCH', 'SOLICITADO'];
    if (!estadosDisponibles.includes(service.status?.toUpperCase())) {
      return NextResponse.json(
        { error: 'El servicio ya fue tomado o no está disponible para asignación.' },
        { status: 409 }
      );
    }

    // 5. Asignar exclusivamente al ID de la sesión autenticada (auth.uid())
    const { data: updatedService, error: updateError } = await supabase
      .from('service_requests')
      .update({
        companion_id: user.id,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()
      .maybeSingle(); // 🟢 Corregido: un solo par de paréntesis

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al asignar el servicio: ' + updateError.message },
        { status: 500 }
      );
    }

    // 6. Registro de auditoría
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'SERVICE_CLAIMED',
      details: { service_id: serviceId, companion_id: user.id }
    });

    return NextResponse.json({
      success: true,
      service: updatedService
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}