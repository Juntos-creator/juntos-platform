import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Validar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 });
    }

    // 2. Extraer datos del formulario multipart
    const formData = await req.formData();
    const docType = formData.get('docType') as string; // 'cedula_frontal', 'cedula_trasera', 'pgr_antecedentes', 'curriculum', 'certificaciones'
    const file = formData.get('file') as File | null;

    if (!docType || !file) {
      return NextResponse.json({ error: 'Tipo de documento o archivo faltante.' }, { status: 400 });
    }

    // Validar tipo MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Solo JPG, PNG, WEBP o PDF.' }, { status: 400 });
    }

    // Validar tamaño (máximo 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el límite de 10 MB.' }, { status: 400 });
    }

    // 3. Definir la ruta en el bucket: kyc-vault/{user_id}/{docType}_{timestamp}.{ext}
    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `${user.id}/${docType}_${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Subir al bucket kyc-vault
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-vault')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Error al almacenar el archivo: ' + uploadError.message }, { status: 500 });
    }

    // 5. Mapear el campo correspondiente en companion_applications
    const columnMap: Record<string, string> = {
      cedula_frontal: 'doc_cedula_frontal_url',
      cedula_trasera: 'doc_cedula_trasera_url',
      pgr_antecedentes: 'doc_pgr_antecedentes_url',
      curriculum: 'doc_curriculum_url',
      certificaciones: 'doc_certificaciones_url'
    };

    const targetColumn = columnMap[docType];
    if (targetColumn) {
      // Actualizar el expediente del acompañante
      await supabase
        .from('companion_applications')
        .update({
          [targetColumn]: uploadData.path,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    // 6. Registro de auditoría
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'KYC_DOCUMENT_UPLOADED',
      details: { doc_type: docType, path: uploadData.path }
    }).select().maybeSingle();

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      message: 'Documento subido y registrado correctamente en el expediente.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor.' }, { status: 500 });
  }
}