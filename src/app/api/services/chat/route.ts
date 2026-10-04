import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con bypass seguro para inserción de chat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');

  if (!serviceId) {
    return NextResponse.json({ error: 'Falta serviceId' }, { status: 400 });
  }

  // 1. Probar en service_chat_messages
  let { data, error } = await supabase
    .from('service_chat_messages')
    .select('*')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: true });

  // 2. Si falla o no existe, probar en service_chats
  if (error || !data) {
    const res = await supabase
      .from('service_chats')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });
    data = res.data;
  }

  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, senderId, senderName, message } = body;

    if (!serviceId || !message) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    const payload = {
      service_id: serviceId,
      sender_id: senderId || 'anon_user',
      sender_name: senderName || 'Usuario',
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    // Intento 1: service_chat_messages
    let { data, error } = await supabase
      .from('service_chat_messages')
      .insert([payload])
      .select()
      .maybeSingle();

    // Intento 2: service_chats si la primera falló
    if (error) {
      const res = await supabase
        .from('service_chats')
        .insert([payload])
        .select()
        .maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data || payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}