'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/navbar';
import { 
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
  Activity,
  UserCheck,
  Radio,
  ShieldCheck
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
  
  // Lista de servicios del solicitante
  const [myServices, setMyServices] = useState<any[]>([]);

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

    // 1. COMPROBACIÓN DE ADMINISTRADORA: REDIRIGIR INMEDIATAMENTE A LA NUEVA MESA CENTRAL
    const esAdmin = 
      user.email?.toLowerCase() === 'odel_kiss@hotmail.com' || 
      user.user_metadata?.role === 'ADMIN';

    if (esAdmin) {
      router.replace('/admin/operations');
      return;
    }

    setUser(user);

    // Cargar perfil del solicitante
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
        role: 'CLIENT'
      });
    }

    // Cargar solo las solicitudes del cliente autenticado
    const { data: srvsCliente } = await supabase
      .from('service_requests')
      .select('*')
      .or(`customer_id.eq.${user.id},user_id.eq.${user.id},client_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setMyServices(srvsCliente || []);
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
      alert('✓ Datos de contacto actualizados correctamente.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs gap-3 font-mono">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando información segura...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        
        {/* ENCABEZADO CLIENTE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Mi Perfil</h1>
            <p className="text-sm text-slate-400 mt-1">
              Gestiona tus solicitudes de asistencia, recibos fiscales y acceso a la sala en vivo.
            </p>
          </div>

          <Link
            href="/services/new"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Solicitud</span>
          </Link>
        </div>

        {/* LISTADO DE SERVICIOS DEL CLIENTE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Mis Solicitudes de Acompañamiento</span>
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
                <span>Solicitar Acompañante Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myServices.map((srv) => {
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
                          {srv.recipient_name || srv.client_name || 'Paciente'}
                        </span>
                      </div>

                      <span className="bg-slate-900 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold">
                        {srv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* DETALLES DE CITA */}
                      <div className="space-y-1.5 text-slate-300">
                        <p className="flex items-center gap-2 text-white font-bold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{srv.scheduled_date || srv.requested_date} • {srv.scheduled_time || 'Horario coordinado'}</span>
                        </p>
                        <p className="flex items-start gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{srv.facility_or_location || srv.address || 'Ubicación coordinada'}</span>
                        </p>
                      </div>

                      {/* TARIFA */}
                      <div className="space-y-1 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">Total Liquidado</span>
                        <p className="text-lg font-black text-emerald-400 font-mono">
                          RD$ {Number(srv.rate_total || 2700).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Tarifa transparente de asistencia
                        </p>
                      </div>

                      {/* DOBLE PIN */}
                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                            PINs Antifraude
                          </span>
                          <span className="text-[9px] bg-slate-950 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-slate-800">
                            VALIDACIÓN
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 font-bold block">1. LLEGADA</span>
                            <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
                              {checkinPin}
                            </span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 font-bold block">2. SALIDA</span>
                            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                              {checkoutPin}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOTONES */}
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
                        <span>Abrir Sala en Vivo</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FORMULARIO DE EDICIÓN DE DATOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl font-black">
              {fullName ? fullName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{fullName || 'Usuario'}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email}</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 p-7 rounded-3xl shadow-xl space-y-5">
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
                <label className="font-bold text-slate-300 block mb-1">Nombre completo *</label>
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
                <label className="font-bold text-slate-300 block mb-1">Teléfono / WhatsApp</label>
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