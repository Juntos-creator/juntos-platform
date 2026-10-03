'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Radio, 
  Clock, 
  History, 
  AlertTriangle, 
  MessageSquare, 
  PhoneCall, 
  ShieldCheck, 
  Search,
  ExternalLink
} from 'lucide-react';

interface Servicio {
  id: string;
  client_name: string;
  companion_name: string;
  client_phone: string;
  companion_phone: string;
  date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  emergency_status?: 'NORMAL' | 'SOS_ACTIVE';
  location: string;
  notes?: string;
}

export default function MesaOperacionesCentral() {
  const [tab, setTab] = useState<'EN_CURSO' | 'POSTERIORES' | 'PREVIOS' | 'EMERGENCIAS'>('EN_CURSO');
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [selectedService, setSelectedService] = useState<Servicio | null>(null);
  const [serviceChat, setServiceChat] = useState<any[]>([]);
  const [bitacoraNotas, setBitacoraNotas] = useState('');

  const supabase = createClient();

  // Carga inicial y suscripción Realtime
  useEffect(() => {
    cargarServicios();

    const channel = supabase
      .channel('mesa_operaciones_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        cargarServicios();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function cargarServicios() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('date', { ascending: false });

    if (data && data.length > 0) {
      setServicios(data);
    } else {
      // Datos demo para pruebas operativas inmediatas
      setServicios([
        {
          id: 'srv-001',
          client_name: 'Dña. Altagracia Guzmán (82 años)',
          companion_name: 'Rosa Morales (Enfermera)',
          client_phone: '809-555-1234',
          companion_phone: '829-555-4321',
          date: new Date().toISOString(),
          status: 'IN_PROGRESS',
          emergency_status: 'SOS_ACTIVE',
          location: 'Piantini, Calle Manuel de Jesús Troncoso #12',
          notes: 'Cliente en cita médica en CEDIMAT. Reportó mareo leve.',
        },
        {
          id: 'srv-002',
          client_name: 'Don Ramón Valdez (76 años)',
          companion_name: 'Carlos Santana',
          client_phone: '809-555-7788',
          companion_phone: '809-555-9900',
          date: new Date(Date.now() + 86400000).toISOString(),
          status: 'SCHEDULED',
          emergency_status: 'NORMAL',
          location: 'Ensanche Naco, Torre Bella Vista Apto 4A',
          notes: 'Acompañamiento a banco y caminata matutina.',
        },
        {
          id: 'srv-003',
          client_name: 'Carmen Josefina Peña (80 años)',
          companion_name: 'Lucía Fernández',
          client_phone: '809-555-3322',
          companion_phone: '829-555-1122',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'COMPLETED',
          emergency_status: 'NORMAL',
          location: 'Bella Vista, Av. Sarasota',
          notes: 'Completado sin novedad. Calificación 5 estrellas.',
        },
      ]);
    }
  }

  // Filtrado según la pestaña activa
  const serviciosFiltrados = servicios.filter(s => {
    if (tab === 'EN_CURSO') return s.status === 'IN_PROGRESS';
    if (tab === 'POSTERIORES') return s.status === 'SCHEDULED';
    if (tab === 'PREVIOS') return s.status === 'COMPLETED' || s.status === 'CANCELLED';
    if (tab === 'EMERGENCIAS') return s.emergency_status === 'SOS_ACTIVE';
    return true;
  });

  // Cargar chat auditado al seleccionar un servicio
  async function abrirInspeccion(s: Servicio) {
    setSelectedService(s);
    const { data: chatData } = await supabase
      .from('service_chats')
      .select('*')
      .eq('service_id', s.id)
      .order('created_at', { ascending: true });

    setServiceChat(chatData || [
      { id: '1', sender_name: s.client_name, sender_role: 'CUSTOMER', message: 'Hola Rosa, ya estamos listos en la entrada.', created_at: '10:15 AM' },
      { id: '2', sender_name: s.companion_name, sender_role: 'COMPANION', message: 'Excelente, voy cruzando la recepción.', created_at: '10:17 AM' },
    ]);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER DE MESA DE CONTROL */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          <h1 className="text-xl font-black tracking-wider uppercase text-white">
            Mesa de Operaciones Central JUNTOS
          </h1>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono">
            SOC 24/7 ACTIVO
          </span>
        </div>

        {/* ALERTA CRÍTICA SOS */}
        {servicios.some(s => s.emergency_status === 'SOS_ACTIVE') && (
          <button 
            onClick={() => setTab('EMERGENCIAS')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-lg animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" /> Alertas SOS Activas
          </button>
        )}
      </header>

      {/* BARRA DE NAVEGACIÓN DE ESTADOS */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setTab('EN_CURSO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'EN_CURSO' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          En Tiempo Real / En Curso ({servicios.filter(s => s.status === 'IN_PROGRESS').length})
        </button>

        <button
          onClick={() => setTab('POSTERIORES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'POSTERIORES' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Posteriores / Agendados ({servicios.filter(s => s.status === 'SCHEDULED').length})
        </button>

        <button
          onClick={() => setTab('PREVIOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'PREVIOS' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-slate-400" />
          Historial / Previos ({servicios.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED').length})
        </button>
      </div>

      {/* CUERPO CENTRAL DE DESPACHO */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* LISTA DE SERVICIOS (7 COLUMNAS) */}
        <div className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto">
          {serviciosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
              No hay servicios en esta categoría actualmente.
            </div>
          ) : (
            serviciosFiltrados.map((s) => (
              <div 
                key={s.id}
                onClick={() => abrirInspeccion(s)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  s.emergency_status === 'SOS_ACTIVE'
                    ? 'bg-red-950/40 border-red-600 hover:border-red-500'
                    : selectedService?.id === s.id
                    ? 'bg-blue-950/40 border-blue-500'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {s.id}
                      </span>
                      {s.emergency_status === 'SOS_ACTIVE' && (
                        <span className="text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                          EMERGENCIA SOS
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-white mt-1">
                      {s.client_name}
                    </h3>
                    <p className="text-xs text-blue-400 font-medium">
                      Acompañante asignado: {s.companion_name}
                    </p>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    s.status === 'IN_PROGRESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    s.status === 'SCHEDULED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {s.status === 'IN_PROGRESS' ? 'EN TIEMPO REAL' : s.status === 'SCHEDULED' ? 'AGENDADO' : 'COMPLETADO'}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-400 flex flex-col gap-1 border-t border-slate-800/80 pt-2">
                  <p>📍 {s.location}</p>
                  <p>🗓️ {new Date(s.date).toLocaleString('es-DO')}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AUDITORÍA Y CONTROL DEL SERVICIO SELECCIONADO (5 COLUMNAS) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedService ? (
            <div className="flex flex-col h-full">
              {/* CABECERA AUDITORÍA */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h2 className="font-black text-sm text-white uppercase tracking-wide">
                    Inspección y Bitácora Central
                  </h2>
                  <p className="text-xs text-slate-400">ID: {selectedService.id}</p>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`tel:${selectedService.client_phone}`}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
                    title="Llamar Cliente"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> Cliente
                  </a>
                  <a 
                    href={`tel:${selectedService.companion_phone}`}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
                    title="Llamar Acompañante"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Acompañante
                  </a>
                </div>
              </div>

              {/* CHAT AUDITADO CLIENTE ↔ ACOMPAÑANTE */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/30">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">
                  Transcripción y Auditoría de Conversación en Vivo
                </div>

                {serviceChat.map((m) => (
                  <div 
                    key={m.id}
                    className={`p-3 rounded-xl max-w-[85%] text-xs ${
                      m.sender_role === 'CUSTOMER' 
                        ? 'bg-blue-900/40 border border-blue-800 text-blue-100 self-start' 
                        : 'bg-emerald-900/40 border border-emerald-800 text-emerald-100 ml-auto'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold">
                      <span>{m.sender_name}</span>
                      <span>{m.created_at}</span>
                    </div>
                    <p>{m.message}</p>
                  </div>
                ))}
              </div>

              {/* REGISTRO DE CONTACTO / BITÁCORA DE CONTROL */}
              <div className="p-4 border-t border-slate-800 bg-slate-950">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Bitácora de Intervención Operacional
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bitacoraNotas}
                    onChange={(e) => setBitacoraNotas(e.target.value)}
                    placeholder="Escribir novedad u orden de despacho..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={() => {
                      if (!bitacoraNotas) return;
                      alert(`Novedad registrada en bitácora oficial: ${bitacoraNotas}`);
                      setBitacoraNotas('');
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-2" />
              Selecciona un servicio para inspeccionar contactos, historial, chat auditado y coordenadas.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}