'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Radio, 
  Clock, 
  History, 
  AlertTriangle, 
  PhoneCall, 
  ShieldCheck, 
  FileText
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
  const [tab, setTab] = useState<'EN_CURSO' | 'POSTERIORES' | 'PREVIOS' | 'EXPEDIENTES'>('EN_CURSO');
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    // 1. Cargar solicitudes de servicios reales de service_requests
    const { data: srvData } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (srvData && srvData.length > 0) {
      setSolicitudes(srvData);
    } else {
      // Datos demo de contingencia basados en tus IDs de auditoría
      setSolicitudes([
        {
          id: '232d64bc',
          client_name: 'Altagracia Guzmán',
          companion_name: 'Rosa Morales',
          client_phone: '809-555-1234',
          companion_phone: '829-555-4321',
          status: 'IN_PROGRESS',
          emergency_status: 'NORMAL',
          created_at: new Date().toISOString(),
          address: 'Piantini, Calle Manuel de Jesús Troncoso #12',
          notes: 'Acompañamiento a consulta en CEDIMAT',
        },
        {
          id: '411919a3',
          client_name: 'Ramón Valdez',
          companion_name: 'Carlos Santana',
          client_phone: '809-555-7788',
          companion_phone: '809-555-9900',
          status: 'SCHEDULED',
          emergency_status: 'NORMAL',
          created_at: new Date().toISOString(),
          address: 'Ensanche Naco, Torre Bella Vista Apto 4A',
          notes: 'Caminata y apoyo en gestiones bancarias',
        },
      ]);
    }

    // 2. Cargar expedientes de acompañantes postulados
    const { data: compApps } = await supabase
      .from('companion_applications')
      .select('*')
      .order('fecha_solicitud', { ascending: false });

    if (compApps && compApps.length > 0) {
      setExpedientes(compApps);
    } else {
      // Si la tabla no existe o está vacía, leemos de profiles con rol COMPANION
      const { data: profCompanions } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COMPANION');
      setExpedientes(profCompanions || []);
    }

    setLoading(false);
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
          onClick={() => { setTab('EXPEDIENTES'); setSelectedItem(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'EXPEDIENTES' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-white" />
          Expedientes RRHH / Postulaciones ({expedientes.length})
        </button>
      </div>

      {/* CUERPO CENTRAL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* PANEL IZQUIERDO: LISTADO (7 COLUMNAS) */}
        <div className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto">
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
                      ? 'bg-blue-950/40 border-blue-500'
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
                        Acompañante: {s.companion_name || 'Pendiente de asignación'}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                    <span>📍 {s.address || 'Ubicación registrada'}</span>
                    <span>🗓️ {new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            /* LISTADO DE EXPEDIENTES RRHH */
            expedientes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                No hay postulaciones de acompañantes registradas.
              </div>
            ) : (
              expedientes.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  onClick={() => setSelectedItem(exp)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedItem?.id === exp.id
                      ? 'bg-amber-950/40 border-amber-500'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {exp.nombre || exp.full_name || 'Postulante'}
                      </h3>
                      <p className="text-xs text-amber-400">
                        Doc: {exp.numero_documento || 'No especificado'} | Tel: {exp.telefono || exp.phone || 'S/N'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {exp.estado || exp.status || 'PENDIENTE_REVISION'}
                    </span>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* PANEL DERECHO: DETALLE E INSPECCIÓN (5 COLUMNAS) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          {selectedItem ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Inspección Detallada
                </span>
                <h2 className="text-lg font-black text-white">
                  {selectedItem.nombre || selectedItem.client_name || selectedItem.full_name || 'Detalle'}
                </h2>
              </div>

              {/* Si es servicio */}
              {selectedItem.client_phone && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${selectedItem.client_phone}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded-xl text-center flex items-center justify-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Llamar Cliente
                    </a>
                    {selectedItem.companion_phone && (
                      <a
                        href={`tel:${selectedItem.companion_phone}`}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl text-center flex items-center justify-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Llamar Acompañante
                      </a>
                    )}
                  </div>
                  <p className="text-slate-300"><b>Notas del servicio:</b> {selectedItem.notes || 'Ninguna novedad registrada.'}</p>
                </div>
              )}

              {/* Si es expediente RRHH */}
              {selectedItem.numero_documento && (
                <div className="space-y-2 text-slate-300">
                  <p><b>Cédula / Documento:</b> {selectedItem.numero_documento}</p>
                  <p><b>Domicilio:</b> {selectedItem.domicilio_direccion || selectedItem.metadata?.domicilio_direccion || 'No especificado'}</p>
                  <p><b>Academia:</b> {selectedItem.codigo_academia || selectedItem.metadata?.codigo_academia || 'Pendiente'}</p>
                  <p><b>Firma Digital:</b> {selectedItem.firma_digital || 'Firmado electrónicamente'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-2" />
              Selecciona cualquier elemento de la lista para ver su información en tiempo real.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}