import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { serviceId, reviewedId, reviewerRole, rating, tags, comment } = await req.json();

    if (!serviceId || !rating) {
      return NextResponse.json({ error: 'Faltan campos requeridos (calificación)' }, { status: 400 });
    }

    // Guardar reseña en service_reviews
    const { error: insertError } = await supabase
      .from('service_reviews')
      .insert([
        {
          service_id: serviceId,
          reviewer_id: user.id,
          reviewed_id: reviewedId,
          reviewer_role: reviewerRole,
          rating: Number(rating),
          tags: tags || [],
          comment: comment || ''
        }
      ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '¡Valoración registrada con éxito!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}