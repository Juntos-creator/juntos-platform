import Link from 'next/link';
import { ShieldCheck, Phone, Mail, MapPin, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs font-sans mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* COLUMNA 1: IDENTIDAD */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg">
                J
              </div>
              <span className="text-xl font-black tracking-tight text-white">JUNTOS</span>
              <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                RD
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Plataforma privada de asistencia presencial y acompañamiento logístico no clínico para citas médicas y diligencias en República Dominicana.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              JUNTOS ASISTENCIA SRL • RNC en formalización DGII
            </div>
          </div>

          {/* COLUMNA 2: PROTOCOLO Y SEGURIDAD */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Seguridad y Protocolo</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Certificado No Antecedentes PGR</span>
              </li>
              <li>Soporte strictly no clínico (Ley 42-01)</li>
              <li>Identificación mediante código PIN único</li>
              <li>Cobertura: Gran Santo Domingo y Santiago</li>
            </ul>
          </div>

          {/* COLUMNA 3: LEGAL Y NORMATIVAS */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Marco Legal</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/terminos" className="hover:text-emerald-400 transition">
                  Términos del Servicio y Tarifas
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-emerald-400 transition">
                  Protección de Datos (Ley 172-13)
                </Link>
              </li>
              <li>
                <Link href="/cancelacion" className="hover:text-emerald-400 transition">
                  Cancelación y Reembolsos
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMNA 4: CONTACTO DIRECTO */}
          <div className="space-y-2">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Mesa Central de Despacho</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>+1 (809) 541-2000 / WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>operaciones@juntos.do</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Santo Domingo Este, Rep. Dominicana</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Atención operativa: Lun a Dom, 7:00 AM – 9:00 PM.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} JUNTOS Asistencia RD. Todos los derechos reservados.</p>
          <p className="font-mono text-[10px]">Cifrado SSL 256-bit • Pagos con tarjeta vía procesador bancario certificado</p>
        </div>

      </div>
    </footer>
  );
}