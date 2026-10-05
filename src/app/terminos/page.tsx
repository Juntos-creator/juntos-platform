import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ShieldAlert, CheckCircle, Scale } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones de Uso | JUNTOS Asistencia RD',
  description: 'Condiciones de contratación, tarifas y alcance de asistencia no clínica conforme a la Ley General de Salud 42-01.'
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 flex-1">
        
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            <Scale className="w-4 h-4" /> MARCO LEGAL DOMINICANO
          </div>
          <h1 className="text-3xl font-black text-white">Términos y Condiciones de Servicio</h1>
          <p className="text-xs text-slate-400">Última actualización: Octubre 2026 • Santo Domingo, República Dominicana</p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <section className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Naturaleza No Clínica del Servicio (Ley General de Salud 42-01)</h2>
            <p>
              JUNTOS Asistencia es una plataforma tecnológica y de coordinación de personal para el <strong>acompañamiento humano, soporte logístico, movilidad asistida y apoyo en trámites presenciales</strong>. 
            </p>
            <p>
              En estricto cumplimiento con la <strong>Ley General de Salud No. 42-01</strong> de la República Dominicana, los acompañantes <strong>NO realizan actos médicos, diagnósticos, curaciones invasivas ni prescripción ni administración parenteral de medicamentos</strong>. El servicio no sustituye la atención médica especializada, servicio de ambulancia ni internamiento clínico.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Verificación de Antecedentes y Personal</h2>
            <p>
              Todos los acompañantes postulados en la plataforma deben presentar obligatoriamente su <strong>Certificado de No Antecedentes Penales emitido por la Procuraduría General de la República (PGR)</strong> con una vigencia no mayor a 90 días al momento de la admisión, el cual es sujeto a renovación periódica semestral. JUNTOS verifica la autenticidad del documento mediante el código de barras oficial de la PGR.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Tarifas, Mínimo de Horas y Cobertura</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Tarifa Estándar Diurna:</strong> RD$ 900 / hora (o su equivalente aproximado de ~$15 USD para clientes de la diáspora con tarjetas internacionales).</li>
              <li><strong>Mínimo de Contratación:</strong> Cada servicio requiere un mínimo de dos (2) horas para cubrir los costos de traslado y desplazamiento del acompañante asignado.</li>
              <li><strong>Horario Operativo:</strong> De 7:00 AM a 7:00 PM. Servicios en horario nocturno o fuera del polígono metropolitano (Gran Santo Domingo y Santiago) requieren previa cotización con la Mesa Central de Despacho.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Protocolo Antifraude de Inicio y Cierre (PIN)</h2>
            <p>
              Para garantizar que el servicio se preste efectivamente en tiempo y forma, cada solicitud genera dos códigos PIN numéricos únicos y confidenciales. El cliente o familiar entrega el PIN de inicio al acompañante al encontrarse en el centro de salud o domicilio, y el PIN de cierre al concluir el servicio.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}