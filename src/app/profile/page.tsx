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
  Plus,
  ArrowRight,
  Save, 
  LogOut,
  Activity,
  UserCheck,
  Radio,
  CheckCircle2
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

    // Redirección si es Administradora
    const esAdmin = 
      user.email?.toLowerCase() === 'odel_kiss@hotmail.com' || 
      user.user_metadata?.role === 'ADMIN';

    if (esAdmin) {
      router.replace('/admin/mesa-operaciones');
      return;
    }

    setUser(user);

    // Cargar perfil del cliente
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

    // Cargar SOLAMENTE las órdenes asociadas estrictamente a este usuario
    const { data: srvsCliente } = await supabase
      .from('service_requests')
      .select('*')
      .eq('client_id', user.id)
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

  // Filtrar si hay una cita en curso o pendiente
  const citaActiva = myServices.find((s) =>
    ['PENDING', 'PENDING_DISPATCH', 'ASSIGNED', 'IN_PROGRESS'].includes(s.status)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        
        {/* ENCABEZADO PERFIL */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mi Perfil</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
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

        {/* BANNER DIRECTO SI TIENE CITA ACTIVA */}
        {citaActiva && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-black tracking-wider uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Cita en Curso Activa
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full">
                {citaActiva.status}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-lg font-black text-white">
                Paciente: {citaActiva.recipient_name || 'Paciente Registrado'}
              </p>
              <p className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{citaActiva.facility_or_location}</span>
              </p>
              <p className="text-slate-400 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{citaActiva.scheduled_date} • {citaActiva.scheduled_time || '08:00'}</span>
              </p>
            </div>

            <Link
              href={`/services/live?id=${citaActiva.id}`}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Entrar a la Sala Operativa en Vivo (Chat y PINs)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* LISTADO DE SOLICITUDES DEL CLIENTE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Mis Solicitudes Registradas</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Total: {myServices.length}
            </span>
          </div>

          {myServices.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No tienes servicios registrados en este momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myServices.map((srv) => (
                <div 
                  key={srv.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        #{srv.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="font-bold text-white">
                        {srv.recipient_name || 'Paciente'}
                      </span>
                      <span className="bg-slate-950 text-emerald-400 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded">
                        {srv.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {srv.scheduled_date} • {srv.facility_or_location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/services/receipt?id=${srv.id}`}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <FileText className="w-3 h-3 text-emerald-400" /> Recibo
                    </Link>
                    <Link
                      href={`/services/live?id=${srv.id}`}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-[11px] flex items-center gap-1 transition"
                    >
                      <Radio className="w-3 h-3" /> Sala en Vivo
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DATOS DE CONTACTO Y PERFIL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl font-black">
              {fullName ? fullName.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{fullName || 'Usuario'}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email}</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-2.5 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Datos de Contacto
            </h3>

            <form onSubmit={handleGuardar} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-400 block mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  disabled 
                  value={profile?.email || ''} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-500 font-medium cursor-not-allowed font-mono text-xs"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium outline-none focus:border-emerald-500 transition text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Teléfono / WhatsApp</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Ej: 809-555-0100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium outline-none focus:border-emerald-500 transition text-xs"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800/80">
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
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition text-xs disabled:opacity-50"
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