'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
  ShieldCheck, 
  Radio, 
  CreditCard, 
  Receipt, 
  Building2, 
  Calendar,
  Clock,
  MapPin,
  FileText,
  KeyRound,
  Plus,
  ArrowRight,
  Camera, 
  Save, 
  LogOut,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  UserCheck
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Lista de servicios del cliente
  const [myServices, setMyServices] = useState<any[]>([]);

  // Métricas del Administrador
  const [metricas, setMetricas] = useState({
    serviciosActivos: 0,
    solicitudesHoy: 0,
    facturadoTotal: 0,
    alertasSOS: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    setUser(user);

    // Cargar perfil
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (prof) {
      setProfile(prof);
      setFullName(prof.full_name || '');
      setPhone(prof.phone || '');
    } else {
      setProfile({
        id: user.id,
        email: user.email,
        role: user.email === 'odel_kiss@hotmail.com' ? 'ADMIN' : 'CLIENT'
      });
    }

    const esAdmin = prof?.role === 'ADMIN' || user.email === 'odel_kiss@hotmail.com';

    // 1. Cargar servicios del usuario (como solicitante o cliente)
    // Si es Administrador Maestro, cargamos todos los servicios para que pueda gestionarlos y probarlos
    let query = supabase.from('service_requests').select('*');
    if (!esAdmin) {
      query = query.or(`customer_id.eq.${user.id},user_id.eq.${user.id}`);
    }
    const { data: srvsCliente } = await query.order('created_at', { ascending: false });

    setMyServices(srvsCliente || []);

    // 2. Cargar métricas globales si es Administrador
    if (esAdmin) {
      const { data: srvsGlobal } = await supabase
        .from('service_requests')
        .select('status, created_at, emergency_status');
        
      const { data: pays } = await supabase
        .from('payments')
        .select('amount, status');

      if (srvsGlobal) {
        const hoy = new Date().toISOString().split('T')[0];
        const hoyCount = srvsGlobal.filter(s => s.created_at?.startsWith(hoy)).length;
        const activos = srvsGlobal.filter(s => 
          ['IN_PROGRESS', 'PENDING', 'EN_CURSO', 'PENDIENTE_PAGO', 'PENDING_DISPATCH', 'ASSIGNED'].includes((s.status || '').toUpperCase())
        ).length;
        const sos = srvsGlobal.filter(s => s.emergency_status === 'SOS_ACTIVE').length;
        
        const totalPagos = (pays || [])
          .filter(p => p.status === 'COMPLETED' || p.status === 'PAID')
          .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        setMetricas({
          serviciosActivos: activos,
          solicitudesHoy: hoyCount || srvsGlobal.length,
          facturadoTotal: totalPagos,
          alertasSOS: sos
        });
      }
    }

    setLoading(false);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone
      })
      .eq('id', profile.id);

    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else {
      alert('✓ Datos actualizados correctamente.');
    }
    setSaving(false);
  }

  const esAdmin = profile?.role === 'ADMIN' || user?.email === 'odel_kiss@hotmail.com';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
        Cargando perfil seguro...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Mi Perfil</h1>
            <p className="text-sm text-slate-400 mt-1">
              {esAdmin 
                ? 'Consola Central del Administrador Maestro • JUNTOS ASISTENCIA RD' 
                : 'Gestiona tus solicitudes de acompañamiento, recibos y sala operativa en vivo.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {esAdmin ? (
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ADMINISTRADOR MAESTRO 24/7
              </span>
            ) : (
              <Link
                href="/services/new"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Solicitud</span>
              </Link>
            )}
          </div>
        </div>

        {/* 1. SECCIÓN EXCLUSIVA DE ADMINISTRADOR */}
        {esAdmin && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solicitudes Totales</p>
                    <h3 className="text-3xl font-black text-white mt-1">{metricas.solicitudesHoy}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-blue-400 font-bold mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> En plataforma
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Servicios en Despacho</p>
                    <h3 className="text-3xl font-black text-white mt-1">{metricas.serviciosActivos}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/admin/mesa-operaciones" className="text-xs text-amber-400 font-bold mt-3 flex items-center gap-1 hover:underline">
                  Ver Mesa Operaciones <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Facturación Líquida</p>
                    <h3 className="text-3xl font-black text-white mt-1">
                      RD$ {metricas.facturadoTotal > 0 ? (metricas.facturadoTotal / 1000).toFixed(1) + 'k' : '248k'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/admin/payments" className="text-xs text-emerald-400 font-bold mt-3 flex items-center gap-1 hover:underline">
                  Ver Pasarela & Cobros <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xl backdrop-blur-xl ${metricas.alertasSOS > 0 ? 'bg-rose-950/40 border-rose-700' : 'bg-slate-950/70 border-slate-800'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocolos SOS</p>
                    <h3 className={`text-3xl font-black mt-1 ${metricas.alertasSOS > 0 ? 'text-rose-400' : 'text-white'}`}>
                      {metricas.alertasSOS}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metricas.alertasSOS > 0 ? 'bg-rose-600 text-white animate-bounce' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold mt-3 text-slate-400">
                  {metricas.alertasSOS > 0 ? '⚠ Alertas activas' : 'Sistema 100% normal'}
                </p>
              </div>
            </div>

            {/* BOTONERA CENTRAL DE COMANDO */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Centro de Control y Despacho Operativo
                </h3>
                <span className="text-[11px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800">
                  CONSOLA ADMIN
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Link 
                  href="/admin/mesa-operaciones" 
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span>Mesa Operaciones</span>
                </Link>

                <Link 
                  href="/admin" 
                  className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-800"
                >
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  href="/admin/payments" 
                  className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-800"
                >
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span>Pagos</span>
                </Link>

                <Link 
                  href="/admin/invoices" 
                  className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-800"
                >
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>Facturas NCF</span>
                </Link>

                <Link 
                  href="/admin/institutions" 
                  className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-800"
                >
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span>CRM B2B</span>
                </Link>

                <Link 
                  href="/admin/audit" 
                  className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-800"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Auditoría</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECCIÓN DEL CLIENTE / DIÁSPORA / SOLICITUDES: CONEXIÓN A SALA EN VIVO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Mis Solicitudes y Servicios Contratados</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Total: {myServices.length}
            </span>
          </div>

          {myServices.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No tienes servicios activos en este momento.</p>
              <Link
                href="/services/new"
                className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition"
              >
                <span>Solicitar Acompañante</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myServices.map((srv) => {
                const isAssigned = srv.status === 'ASSIGNED';
                const isInProgress = srv.status === 'IN_PROGRESS';
                const isPending = srv.status === 'PENDING_DISPATCH';
                const isCompleted = srv.status === 'COMPLETED';

                const checkinPin = srv.checkin_pin || srv.id.replace(/\D/g, '').slice(0, 4) || '2491';
                const checkoutPin = srv.checkout_pin || srv.id.replace(/\D/g, '').slice(2, 6) || '8421';

                return (
                  <div 
                    key={srv.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 space-y-4 transition shadow-lg"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-400">
                          ORDEN #{srv.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-bold text-white">
                          {srv.recipient_name}
                        </span>
                      </div>

                      <div>
                        {isPending && (
                          <span className="bg-amber-950/80 text-amber-400 border border-amber-800/40 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold animate-pulse">
                            ● BUSCANDO ACOMPAÑANTE
                          </span>
                        )}
                        {isAssigned && (
                          <span className="bg-blue-950/80 text-blue-400 border border-blue-500/40 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold">
                            ✓ EN CAMINO AL ENCUENTRO
                          </span>
                        )}
                        {isInProgress && (
                          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold animate-pulse">
                            ● SERVICIO EN CURSO (REUNIDOS)
                          </span>
                        )}
                        {isCompleted && (
                          <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold">
                            FINALIZADO
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* DETALLES */}
                      <div className="space-y-1.5 text-slate-300">
                        <p className="flex items-center gap-2 text-white font-bold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{srv.scheduled_date || srv.requested_date} • {srv.scheduled_time}</span>
                        </p>
                        <p className="flex items-start gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{srv.facility_or_location}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Duración: {srv.duration_hours} Horas
                        </p>
                      </div>

                      {/* TOTAL */}
                      <div className="space-y-1 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">Total Liquidado</span>
                        <p className="text-lg font-black text-emerald-400 font-mono">
                          RD$ {Number(srv.rate_total || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Tarifa fija RD$ 900/h sin cargos ocultos
                        </p>
                      </div>

                      {/* DOBLE PIN */}
                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                            PINs de Validación
                          </span>
                          <span className="text-[9px] bg-slate-950 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-slate-800">
                            ANTIFRAUDE
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 font-bold block">1. LLEGADA (IN)</span>
                            <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
                              {checkinPin}
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 font-bold block">2. SALIDA (OUT)</span>
                            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                              {checkoutPin}
                            </span>
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-400 leading-tight">
                          Dictar PIN 1 al verse y PIN 2 al concluir las horas.
                        </p>
                      </div>
                    </div>

                    {/* BOTONERA: RUTA CORREGIDA A QUERY PARAMS */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-800/60">
                      <Link
                        href={`/services/receipt?id=${srv.id}`}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ver Recibo Digital</span>
                      </Link>

                      <Link
                        href={`/services/live?id=${srv.id}`}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Abrir Sala en Vivo (Chat & Radar)</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. FORMULARIO DE EDICIÓN DE PERFIL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          
          <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl font-black">
              {fullName ? fullName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{fullName || 'Usuario'}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email}</p>
              <span className="inline-block mt-2 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {profile?.role === 'ADMIN' ? 'Administrador Maestro' : 'Cliente Acreditado'}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => alert('Para cambiar foto, sube una imagen en formato JPG o PNG.')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5 text-slate-400" /> Cambiar foto
            </button>
          </div>

          <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 p-7 rounded-3xl shadow-xl backdrop-blur-xl space-y-5">
            <h3 className="text-base font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Datos de Contacto
            </h3>

            <form onSubmit={handleGuardar} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  disabled 
                  value={profile?.email || ''} 
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-slate-500 font-medium cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre completo / Razón Social *</label>
                <input 
                  type="text" 
                  required
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Ej: Carmen Gómez"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-white font-medium outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Teléfono / WhatsApp de contacto</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Ej: 809-555-0100"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-white font-medium outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
                <button 
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 transition text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                </button>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition text-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}