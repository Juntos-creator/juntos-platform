'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { KycDocumentUploader } from '@/components/kyc-document-uploader';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CompanionKycPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadKycData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      const { data: app } = await supabase
        .from('companion_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setApplication(app);
      setLoading(false);
    }

    loadKycData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center text-xs">
        Cargando expediente documental...
      </div>
    );
  }

  const isApproved = application?.estado === 'APROBADO';
  const isPending = application?.estado === 'PENDIENTE';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 w-full space-y-6">
        <Link
          href="/companion/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel de Operaciones</span>
        </Link>

        {/* Encabezado */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> EXPEDIENTE DIGITAL KYC
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              isApproved 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-950 text-amber-400 border border-amber-500/40'
            }`}>
              ESTADO: {application?.estado || 'PENDIENTE'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            Acreditación y Carga de Documentos
          </h1>
          <p className="text-xs text-slate-400">
            Sube copias claras y legibles de tus documentos oficiales. Serán resguardados en el baúl seguro cifrado (`kyc-vault`) y auditados por la Mesa Central de JUNTOS.
          </p>

          {isPending && (
            <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs p-3 rounded-2xl flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Expediente en proceso de depuración legal y verificación de antecedentes.</span>
            </div>
          )}
        </div>

        {/* Formularios de carga segura */}
        <div className="space-y-4">
          <KycDocumentUploader
            docType="cedula_frontal"
            label="1. Cédula de Identidad (Lado Frontal) *"
            description="Foto nítida de frente de tu cédula dominicana de identidad y electoral."
          />

          <KycDocumentUploader
            docType="cedula_trasera"
            label="2. Cédula de Identidad (Lado Posterior) *"
            description="Foto nítida del reverso donde se aprecie el código de barras y firma."
          />

          <KycDocumentUploader
            docType="pgr_antecedentes"
            label="3. Certificado de Antecedentes No Penales (PGR) *"
            description="Certificado digital emitido por la Procuraduría General de la República (vigencia máx. 30 días)."
          />

          <KycDocumentUploader
            docType="certificaciones"
            label="4. Certificaciones de Salud / Primeros Auxilios (Opcional)"
            description="Diplomas de enfermería, soporte vital básico o cuidado del adulto mayor."
          />
        </div>
      </main>
    </div>
  );
}