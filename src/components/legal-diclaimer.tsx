import { ShieldCheck, Info } from 'lucide-react';

export function LegalDisclaimer() {
  return (
    <aside className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-slate-400 text-xs">
      <div className="flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-200">
            Aviso Regulatorio de Asistencia No Clínica (Ley 42-01)
          </p>
          <p className="text-[11px] leading-relaxed text-slate-400">
            <strong>JUNTOS Asistencia RD</strong> es una plataforma tecnológica de coordinación logística y acompañamiento humano no sanitario. 
            El personal acompañante <u>no realiza</u> actos médicos, administración invasiva de medicamentos, curas de enfermería ni transporte sanitario de emergencia. 
            Para contingencias médicas que comprometan la vida, comuníquese de inmediato al <strong>Sistema Nacional de Emergencias 9-1-1</strong>.
          </p>
        </div>
      </div>
    </aside>
  );
}