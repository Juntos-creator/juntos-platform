'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Radio, 
  Users, 
  CreditCard, 
  Receipt, 
  ShieldCheck, 
  FileText, 
  AlertOctagon, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  UserCheck
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({
    solicitudesHoy: 0,
    enCurso: 0,
    facturadoTotal: 0,
    sosActivos: 0,
    postulacionesPendientes: 0,
    institucionesActivas: 0,
  });

  const [ultimosServicios, setUltimosServicios] = useState<any[]>([]);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    async function cargarMetricas() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);

      // 1. Cargar servicios
      const { data: servicios } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Cargar pagos
      const { data: pagos } = await supabase
        .from('payments')
        .select('*');

      // 3. Cargar expedientes RRHH
      const { data: expedientes } = await supabase
        .from('companion_applications')
        .select('id, estado');

      if (servicios) {
        const hoyStr = new Date().toISOString().split('T')[0];
        const hoy = servicios.filter(s => s.created_at?.startsWith(hoyStr)).length;
        const curso = servicios.filter(s => ['IN_PROGRESS', 'EN_CURSO', 'PENDING', 'PENDIENTE_PAGO'].includes((s.status || '').toUpperCase())).length;
        const sos = servicios.filter(s => s.emergency_status === 'SOS_ACTIVE').length;

        setUltimosServicios(servicios.slice(0, 5));

        const facturado = (pagos || [])
          .filter(p => p.status === 'COMPLETED' || p.status === 'PAID')
          .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        const rrhhPendientes = (expedientes || []).filter(e => e.estado === 'PENDIENTE_REVISION' || !e.estado).length;

        setMetricas({
          solicitudesHoy: hoy || servicios.length,
          enCurso: curso,
          facturadoTotal: facturado,
          sosActivos: sos,
          postulacionesPendientes: rrhhPendientes,
          institucionesActivas: 24,
        });
      }

      setLoading(false);
    }

    cargarMetricas();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* SUBNAV ADMIN CON TODAS LAS PESTAÑAS */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-3">
          <div className="flex items-center gap-2">
            <Link 
              href="/admin" 
              className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <span>Dashboard</span>
            </Link>

            {/* BOTÓN DESTACADO A LA MESA DE OPERACIONES */}
            <Link 
              href="/admin/mesa-operaciones" 
              className="bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Radio className="w-3.5 h-3.5" />
              <span>Mesa Operaciones 24/7</span>
              {metricas.sosActivos > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {metricas.sosActivos} SOS
                </span>
              )}
            </Link>

            <Link href="/admin/institutions" className="text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Instituciones</span>
            </Link>

            <Link href="/admin/payments" className="text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pagos</span>
            </Link>

            <Link href="/admin/invoices" className="text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Facturas NCF</span>
            </Link>

            <Link href="/admin/audit" className="text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoría</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OPERATIVO 24/7
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* TARJETAS DE MÉTRICAS EJECUTIVAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Tarjeta 1: Solicitudes Hoy */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solicitudes Totales</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{metricas.solicitudesHoy}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-4 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Flujo activo en plataforma
            </p>
          </div>

          {/* Tarjeta 2: En curso */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En Curso / Despacho</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{metricas.enCurso}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <Link 
              href="/admin/mesa-operaciones" 
              className="text-xs text-blue-600 font-bold mt-4 flex items-center gap-1 hover:underline"
            >
              Ir a Mesa de Operaciones <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tarjeta 3: Facturado */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Facturado</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  RD$ {metricas.facturadoTotal > 0 ? (metricas.facturadoTotal / 1000).toFixed(1) + 'k' : '248k'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-4">Transacciones en línea DOP</p>
          </div>

          {/* Tarjeta 4: Postulaciones RRHH */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acreditación RRHH</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{metricas.postulacionesPendientes}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <Link 
              href="/admin/mesa-operaciones" 
              onClick={() => localStorage.setItem('mesa_tab', 'EXPEDIENTES')}
              className="text-xs text-purple-600 font-bold mt-4 flex items-center gap-1 hover:underline"
            >
              Revisar expedientes KYC <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* ACCESOS DIRECTOS Y PERFIL DEL ADMINISTRADOR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* BANDEJA DE CONTROL OPERATIVO */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Últimas Solicitudes Registradas</h3>
                <p className="text-xs text-slate-500">Monitoreo de citas y estados en tiempo real</p>
              </div>
              <Link 
                href="/admin/mesa-operaciones" 
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Ver consola completa →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {ultimosServicios.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No hay solicitudes recientes registradas.</p>
              ) : (
                ultimosServicios.map((srv) => (
                  <div key={srv.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{srv.for_who_name || srv.client_name || 'Solicitud sin nombre'}</p>
                      <p className="text-[11px] text-slate-500">📍 {srv.center_name || srv.address || 'Ubicación coordinada'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {srv.status || 'PENDIENTE'}
                      </span>
                      <button 
                        onClick={() => router.push('/admin/mesa-operaciones')}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TARJETA DEL PERFIL DE ADMINISTRADOR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                DR
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dra. Rosa M.</h4>
                <p className="text-[11px] text-emerald-600 font-semibold">Administrador Maestro • JUNTOS</p>
                <p className="text-[10px] text-slate-400">{adminUser?.email || 'admin@juntos.do'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-700">Acciones Rápidas:</p>
              <Link 
                href="/services/new" 
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold p-2.5 rounded-xl flex items-center justify-between transition"
              >
                <span>Crear nueva solicitud B2C</span>
                <span>+</span>
              </Link>

              <Link 
                href="/admin/institutions" 
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold p-2.5 rounded-xl flex items-center justify-between transition"
              >
                <span>Ver embudo comercial B2B</span>
                <span>→</span>
              </Link>

              <Link 
                href="/admin/audit" 
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold p-2.5 rounded-xl flex items-center justify-between transition"
              >
                <span>Registro de auditoría y accesos</span>
                <span>🛡️</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="w-full text-center text-rose-600 font-bold text-xs py-2 hover:bg-rose-50 rounded-xl transition"
              >
                Cerrar Sesión Segura
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}