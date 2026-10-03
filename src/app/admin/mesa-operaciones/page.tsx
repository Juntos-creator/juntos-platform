'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Radio, 
  Clock, 
  History, 
  FileText, 
  PhoneCall, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

interface SolicitudServicio {
  id: string;
  client_id?: string;
  companion_id?: string;
  client_name?: string;
  companion_name?: string;
  client_phone?: string;
  companion_phone?: string;
  status: string;
  created_at: string;
  scheduled_date?: string;
  notes?: string;
  address?: string;
  emergency_status?: string;
}

export default function MesaOperacionesPage() {
  const [tab, setTab] = useState<'EN_CURSO' | 'POSTERIORES' | 'PREVIOS' | 'EXPEDIENTES'>('EXPEDIENTES');
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Visor modal de documentos KYC
  const [docModal, setDocModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: ''
  });

  const supabase = createClient();

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    // 1. Cargar servicios desde service_requests
    const { data: srvData } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (srvData && srvData.length > 0) {
      setSolicitudes(srvData);
    } else {
      setSolicitudes([]);
    }

    // 2. Cargar expedientes RRHH desde companion_applications o profiles
    const { data: compApps } = await supabase
      .from('companion_applications')
      .select('*')
      .order('fecha_solicitud', { ascending: false });

    if (compApps && compApps.length > 0) {
      setExpedientes(compApps);
      if (!selectedItem) setSelectedItem(compApps[0]);
    } else {
      const { data: profCompanions } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COMPANION');
      setExpedientes(profCompanions || []);
      if (!selectedItem && profCompanions && profCompanions.length > 0) {
        setSelectedItem(profCompanions[0]);
      }
    }

    setLoading(false);
  }

  // Decisión de RRHH: Aprobar acompañante
  async function handleAprobar(expediente: any) {
    if (!confirm(`¿Confirmas la APROBACIÓN y acreditación oficial de ${expediente.nombre || expediente.full_name}? Podrá recibir servicios de inmediato.`)) {
      return;
    }

    setUpdating(true);
    const userId = expediente.user_id || expediente.id;

    // Actualizar tabla de aplicaciones
    if (expediente.user_id) {
      await supabase
        .from('companion_applications')
        .update({
          estado: 'APROBADO',
          estado_depuracion: 'APROBADO',
          fecha_aprobacion: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    // Actualizar perfil oficial del usuario
    await supabase
      .from('profiles')
      .update({
        status: 'ACTIVE',
        kyc_verified: true,
        verification_status: 'VERIFIED'
      })
      .eq('id', userId);

    alert(`✓ Expediente de ${expediente.nombre || expediente.full_name} APROBADO exitosamente.`);
    setUpdating(false);
    cargarDatos();
  }

  // Decisión de RRHH: Rechazar o requerir corrección
  async function handleRechazar(expediente: any) {
    const motivo = prompt(
      `Indica el motivo de rechazo u observación para ${expediente.nombre || expediente.full_name}:`,
      'Documento de antecedentes penales no visible o excede los 30 días hábiles requeridos.'
    );

    if (!motivo) return;

    setUpdating(true);
    const userId = expediente.user_id || expediente.id;

    if (expediente.user_id) {
      await supabase
        .from('companion_applications')
        .update({
          estado: 'RECHAZADO',
          estado_depuracion: 'OBSERVADO',
          motivo_rechazo: motivo
        })
        .eq('user_id', userId);
    }

    await supabase
      .from('profiles')
      .update({
        status: 'RECHAZADO',
        rejection_reason: motivo
      })
      .eq('id', userId);

    alert(`Expediente marcado con observación: "${motivo}"`);
    setUpdating(false);
    cargarDatos();
  }

  // Filtrado de servicios
  const serviciosFiltrados = solicitudes.filter(s => {
    const st = (s.status || '').toUpperCase();
    if (tab === 'EN_CURSO') return st === 'IN_PROGRESS' || st === 'EN_CURSO' || st === 'PENDING';
    if (tab === 'POSTERIORES') return st === 'SCHEDULED' || st === 'AGENDADO';
    if (tab === 'PREVIOS') return st === 'COMPLETED' || st === 'CANCELLED' || st === 'FINALIZADO';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      
      {/* HEADER DE MESA CENTRAL */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            Mesa de Operaciones Central JUNTOS
          </h1>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
            CENTRO DE DESPACHO & RRHH
          </span>
        </div>

        <button 
          onClick={cargarDatos}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
        >
          ↻ Actualizar en vivo
        </button>
      </header>

      {/* PESTAÑAS DE CONTROL */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => { setTab('EN_CURSO'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'EN_CURSO' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          Servicios en Tiempo Real ({solicitudes.filter(s => ['IN_PROGRESS', 'PENDING', 'EN_CURSO'].includes((s.status || '').toUpperCase())).length})
        </button>

        <button
          onClick={() => { setTab('POSTERIORES'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'POSTERIORES' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Servicios Posteriores / Agendados ({solicitudes.filter(s => ['SCHEDULED', 'AGENDADO'].includes((s.status || '').toUpperCase())).length})
        </button>

        <button
          onClick={() => { setTab('PREVIOS'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'PREVIOS' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-slate-400" />
          Servicios Previos / Historial ({solicitudes.filter(s => ['COMPLETED', 'CANCELLED', 'FINALIZADO'].includes((s.status || '').toUpperCase())).length})
        </button>

        <button
          onClick={() => { setTab('EXPEDIENTES'); setSelectedItem(expedientes[0] || null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'EXPEDIENTES' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-white" />
          Expedientes RRHH / Postulaciones ({expedientes.length})
        </button>
      </div>

      {/* CUERPO CENTRAL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* PANEL IZQUIERDO: LISTADO (5 COLUMNAS) */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto">
          {tab !== 'EXPEDIENTES' ? (
            serviciosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                No hay servicios en este estado.
              </div>
            ) : (
              serviciosFiltrados.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedItem(s)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedItem?.id === s.id
                      ? 'bg-blue-950/50 border-blue-500'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        ID: {s.id.slice(0, 8)}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1">
                        {s.client_name || `Solicitud #${s.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-blue-400">
                        Acompañante: {s.companion_name || 'Pendiente'}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                      {s.status}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            /* LISTADO EXPEDIENTES RRHH */
            expedientes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                No hay postulaciones registradas.
              </div>
            ) : (
              expedientes.map((exp, idx) => {
                const nombre = exp.nombre || exp.full_name || 'Postulante';
                const estado = exp.estado || exp.status || 'PENDIENTE_REVISION';
                const esAprobado = estado === 'APROBADO' || estado === 'ACTIVE';

                return (
                  <div
                    key={exp.id || idx}
                    onClick={() => setSelectedItem(exp)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      selectedItem?.id === exp.id
                        ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {nombre}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Doc: <span className="font-mono text-slate-200">{exp.numero_documento || 'No especificado'}</span>
                        </p>
                        <p className="text-xs text-amber-400 mt-0.5">
                          Tel: {exp.telefono || exp.phone || exp.telefono_whatsapp || 'S/N'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        esAprobado
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : estado === 'RECHAZADO'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {estado}
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* PANEL DERECHO: INSPECCIÓN PROFUNDA Y DECISIÓN RRHH (7 COLUMNAS) */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-6">
              
              {/* CABECERA EXPEDIENTE */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {tab === 'EXPEDIENTES' ? 'Expediente Oficial de Acompañante' : 'Detalles de la Operación'}
                  </span>
                  <h2 className="text-xl font-black text-white mt-1">
                    {selectedItem.nombre || selectedItem.client_name || selectedItem.full_name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    ID Usuario: <span className="font-mono text-slate-300">{selectedItem.user_id || selectedItem.id}</span>
                  </p>
                </div>

                {tab === 'EXPEDIENTES' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAprobar(selectedItem)}
                      disabled={updating}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprobar y Activar
                    </button>
                    <button
                      onClick={() => handleRechazar(selectedItem)}
                      disabled={updating}
                      className="bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Observar
                    </button>
                  </div>
                )}
              </div>

              {/* CONTENIDO DEL EXPEDIENTE RRHH */}
              {tab === 'EXPEDIENTES' && (
                <div className="space-y-5 text-xs">
                  
                  {/* SECCIÓN 1: IDENTIDAD Y DOMICILIO */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                    <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> 1. Identidad y Domicilio Legal
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Tipo & Cédula:</span>
                        <span className="font-mono font-bold text-white">
                          {selectedItem.tipo_documento || 'CEDULA'}: {selectedItem.numero_documento || 'No especificado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Nacionalidad:</span>
                        <span>{selectedItem.nacionalidad || 'Dominicana'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Dirección Residencial:</span>
                        <span className="text-white">
                          {selectedItem.domicilio_direccion || selectedItem.metadata?.domicilio_direccion || 'No especificado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sector & Municipio:</span>
                        <span>
                          {selectedItem.domicilio_sector || selectedItem.metadata?.domicilio_sector || '---'}, {selectedItem.domicilio_municipio_provincia || selectedItem.metadata?.domicilio_municipio_provincia || '---'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Contacto de Emergencia:</span>
                        <span className="text-white">
                          {selectedItem.contacto_emergencia_nombre || selectedItem.metadata?.contacto_emergencia_nombre || '---'} ({selectedItem.contacto_emergencia_telefono || selectedItem.metadata?.contacto_emergencia_telefono || '---'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: AUDITORÍA DE ANTECEDENTES Y REQUISITOS LEGALES */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
                    <h4 className="font-bold text-blue-400 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> 2. Cumplimiento Legal y Academia
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Emisión Antecedentes PGR:</span>
                        <span className="font-mono text-white">
                          {selectedItem.fecha_antecedentes_pgr || selectedItem.fecha_antecedentes || 'Sin fecha registrada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Código Academia JUNTOS:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {selectedItem.codigo_academia || selectedItem.metadata?.codigo_academia || 'Pendiente'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Años de Experiencia:</span>
                        <span>{selectedItem.experiencia_anios || selectedItem.experiencia || '1-3 años'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cuenta Bancaria Pago:</span>
                        <span>
                          {selectedItem.datos_pago_banco || 'Banreservas'} - {selectedItem.datos_pago_numero_cuenta || '---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: DOCUMENTOS Y COMPROBANTES ADJUNTOS */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h4 className="font-bold text-slate-300 uppercase text-[11px] tracking-wide">
                      3. Evidencias y Archivos Adjuntos
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => setDocModal({
                          open: true,
                          title: 'Cédula de Identidad (Frontal)',
                          url: selectedItem.url_doc_frontal || 'https://placehold.co/600x400/0f172a/white?text=Cedula+Frontal'
                        })}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-slate-200 transition"
                      >
                        <span className="truncate">🪪 Cédula Frontal</span>
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      <button
                        onClick={() => setDocModal({
                          open: true,
                          title: 'Cédula de Identidad (Posterior)',
                          url: selectedItem.url_doc_dorsal || 'https://placehold.co/600x400/0f172a/white?text=Cedula+Posterior'
                        })}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-slate-200 transition"
                      >
                        <span className="truncate">🔄 Cédula Posterior</span>
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      <button
                        onClick={() => setDocModal({
                          open: true,
                          title: 'Certificado No Antecedentes Penales (PGR)',
                          url: selectedItem.url_cert_antecedentes || 'https://placehold.co/600x400/0f172a/white?text=Certificado+PGR'
                        })}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-slate-200 transition"
                      >
                        <span className="truncate">📜 Certificado PGR</span>
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      <button
                        onClick={() => setDocModal({
                          open: true,
                          title: 'Comprobante de Domicilio',
                          url: selectedItem.url_comprobante_domicilio || 'https://placehold.co/600x400/0f172a/white?text=Comprobante+Domicilio'
                        })}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-slate-200 transition"
                      >
                        <span className="truncate">🏠 Comprobante Dom.</span>
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      <button
                        onClick={() => setDocModal({
                          open: true,
                          title: 'Diploma de Bachiller / Título',
                          url: selectedItem.url_cert_bachiller || 'https://placehold.co/600x400/0f172a/white?text=Titulo+Bachiller'
                        })}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-slate-200 transition"
                      >
                        <span className="truncate">🎓 Título Bachiller</span>
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {/* SECCIÓN 4: ACCIONES RÁPIDAS DE CONTACTO */}
                  <div className="pt-2 flex gap-3">
                    <a
                      href={`tel:${selectedItem.telefono || selectedItem.phone || selectedItem.telefono_whatsapp}`}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-400" /> Llamar Postulante
                    </a>
                  </div>

                </div>
              )}

              {/* VISTA SI ES UN SERVICIO */}
              {tab !== 'EXPEDIENTES' && (
                <div className="space-y-4 text-xs">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${selectedItem.client_phone}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl text-center flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-4 h-4" /> Llamar Cliente
                    </a>
                    {selectedItem.companion_phone && (
                      <a
                        href={`tel:${selectedItem.companion_phone}`}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-center flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="w-4 h-4" /> Llamar Acompañante
                      </a>
                    )}
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                    <p><b>Dirección:</b> {selectedItem.address || 'No especificada'}</p>
                    <p><b>Fecha Programada:</b> {selectedItem.scheduled_date || selectedItem.created_at}</p>
                    <p><b>Notas de despacho:</b> {selectedItem.notes || 'Ninguna novedad registrada.'}</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-2" />
              Selecciona un elemento para auditar sus detalles y tomar acción.
            </div>
          )}
        </div>

      </div>

      {/* MODAL VISOR DE DOCUMENTO KYC */}
      {docModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> {docModal.title}
              </h3>
              <button 
                onClick={() => setDocModal({ open: false, url: '', title: '' })}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900 rounded-xl p-2 min-h-[300px]">
              <img 
                src={docModal.url} 
                alt={docModal.title} 
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}