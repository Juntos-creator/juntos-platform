'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';

interface KycDocumentUploaderProps {
  docType: 'cedula_frontal' | 'cedula_trasera' | 'pgr_antecedentes' | 'curriculum' | 'certificaciones';
  label: string;
  description: string;
  onUploaded?: (path: string) => void;
}

export function KycDocumentUploader({ docType, label, description, onUploaded }: KycDocumentUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('docType', docType);
      formData.append('file', file);

      const res = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUploadedPath(data.path);
      if (onUploaded) onUploaded(data.path);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir el archivo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            {label}
          </h4>
          <p className="text-[11px] text-slate-400">{description}</p>
        </div>
        {uploadedPath && (
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> CARGADO
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] p-2 rounded-xl flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="relative">
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={loading}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className={`border-2 border-dashed rounded-xl p-3 text-center transition flex items-center justify-center gap-2 ${
          uploadedPath 
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' 
            : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
        }`}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold">Subiendo al baúl seguro...</span>
            </>
          ) : uploadedPath ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Archivo guardado. Haz clic para reemplazar</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium">Seleccionar foto o PDF (máx. 10 MB)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}