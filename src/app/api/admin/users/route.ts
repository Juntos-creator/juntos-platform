import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verificación de Administrador Maestro
    if (!user || user.email !== 'odel_kiss@hotmail.com') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    // Consultar todos los perfiles registrados en la base de datos
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verificación de Administrador Maestro
    if (!user || user.email !== 'odel_kiss@hotmail.com') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Actualizar el rol del usuario (CLIENT <-> COMPANION)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Rol actualizado a ${newRole}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}