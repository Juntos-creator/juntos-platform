import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { 
      telefono, 
      nombrePaciente, 
      nombreSolicitante, 
      fecha, 
      direccion, 
      nombreAcompanante 
    } = await req.json();

    if (!telefono) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });
    }

    // Normalizar número telefónico para WhatsApp (formato +1809... o +1829...)
    let cleanPhone = telefono.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '1' + cleanPhone; // Código de país RD (+1)
    }

    const mensaje = `🟢 *JUNTOS - Acompañamiento Confirmado*\n\nHola *${nombrePaciente}*, te confirmamos tu servicio de asistencia:\n\n📅 *Fecha:* ${fecha}\n📍 *Punto:* ${direccion}\n👤 *Acompañante:* ${nombreAcompanante || 'Personal en camino'}\n\nProgramado por: ${nombreSolicitante || 'Familiar'}.\nCualquier duda, nuestro equipo de soporte está disponible.`;

    // Si usas Twilio:
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          To: `whatsapp:+${cleanPhone}`,
          Body: mensaje,
        }),
      });
    }

    return NextResponse.json({ ok: true, sentTo: cleanPhone });
  } catch (error: any) {
    console.error('Error enviando WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}