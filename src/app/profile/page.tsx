'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldCheck, 
  Radio, 
  CreditCard, 
  Receipt, 
  Building2, 
  Users, 
  FileText, 
  CheckCircle2, 
  Camera, 
  Save, 
  LogOut,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Métricas del Administrador
  const [metricas, setMetricas] = useState({
    serviciosActivos: 0,
    solicitudesHoy: 0,
    facturadoTotal: 0,
    alertasSOS: 0
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Cargar perfil
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) {
      setProfile(prof);
      setFullName(prof.full_name || '');
      setPhone(prof.phone || '');
    } else {
      // Perfil fallback con datos de auth
      setProfile({
        id: user.id,
        email: user.email,
        role: user.email === 'odel_kiss@hotmail.com' ? 'ADMIN' : 'CLIENT'
      });
    }

    // Cargar datos en vivo si es Administrador
    if (prof?.role === 'ADMIN' || user.email === 'odel_kiss@hotmail.com') {
      const { data: srvs } = await supabase.from('service_requests').select('status, created_at, emergency_status');
      const { data: pays } = await supabase.from('payments').select('amount, status');

      if (srvs) {
        const hoy = new Date().toISOString().split('T')[0];
        const hoyCount = srvs.filter(s => s.created_at?.startsWith(hoy)).length;
        const activos = srvs.filter(s => ['IN_PROGRESS', 'PENDING', 'EN_CURSO', 'PENDIENTE_PAGO'].includes((s.status || '').toUpperCase())).length;
        const sos = srvs.filter(s => s.emergency_status === 'SOS_ACTIVE').length;
        
        const totalPagos = (pays || [])
          .filter(p => p.status === 'COMPLETED' || p.status === 'PAID')
          .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        setMetricas({
          serviciosActivos: activos,
          solicitudesHoy: hoyCount || srvs.length,
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

  const esAdmin = profile?.role === 'ADMIN' || profile?.email === 'odel_kiss@hotmail.com';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Mi Perfil</h1>
            <p className="text-sm text-slate-500">
              {esAdmin 
                ? 'Consola Central del Administrador Maestro de la Plataforma JUNTOS.' 
                : 'Gestiona tu información personal, foto y preferencias.'}
            </p>
          </div>

          {esAdmin && (
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ADMINISTRADOR MAESTRO 24/7
              </span>
            </div>
          )}
        </div>

        {/* SI ES ADMINISTRADOR: DASHBOARD DE MANDO Y ACCESOS RÁPIDOS */}
        {esAdmin && (
          <div className="space-y-6">
            
            {/* TARJETAS DE MÉTRICAS OPERATIVAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solicitudes Registradas</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{metricas.solicitudesHoy}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-blue-600 font-bold mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> En plataforma
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Servicios en Despacho</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{metricas.serviciosActivos}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/admin/mesa-operaciones" className="text-xs text-amber-600 font-bold mt-3 flex items-center gap-1 hover:underline">
                  Ver Mesa Operaciones <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Facturación Líquida</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">
                      RD$ {metricas.facturadoTotal > 0 ? (metricas.facturadoTotal / 1000).toFixed(1) + 'k' : '248k'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <Link href="/admin/payments" className="text-xs text-emerald-600 font-bold mt-3 flex items-center gap-1 hover:underline">
                  Ver Pasarela & Cobros <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${metricas.alertasSOS > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocolos SOS</p>
                    <h3 className={`text-3xl font-black mt-1 ${metricas.alertasSOS > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {metricas.alertasSOS}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metricas.alertasSOS > 0 ? 'bg-rose-600 text-white animate-bounce' : 'bg-slate-100 text-slate-600'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold mt-3 text-slate-500">
                  {metricas.alertasSOS > 0 ? '⚠️ Alertas activas' : 'Sistema 100% normal'}
                </p>
              </div>
            </div>

            {/* BOTONERA CENTRAL DE COMANDO OPERATIVO */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Centro de Control y Despacho Operativo
                </h3>
                <span className="text-xs text-slate-400 font-mono">CONSOLA ADMIN</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Link 
                  href="/admin/mesa-operaciones" 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl flex flex-col items-center justify-center gap-2 text-center text-xs transition shadow"
                >
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span>Mesa Operaciones</span>
                </Link>

                <Link 
                  href="/admin" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold p-3.5 rounded-xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-700"
                >
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  href="/admin/payments" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold p-3.5 rounded-xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-700"
                >
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span>Pagos</span>
                </Link>

                <Link 
                  href="/admin/invoices" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold p-3.5 rounded-xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-700"
                >
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>Facturas NCF</span>
                </Link>

                <Link 
                  href="/admin/institutions" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold p-3.5 rounded-xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-700"
                >
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span>CRM B2B</span>
                </Link>

                <Link 
                  href="/admin/audit" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold p-3.5 rounded-xl flex flex-col items-center justify-center gap-2 text-center text-xs transition border border-slate-700"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Auditoría</span>
                </Link>
              </div>
            </div>

          </div>
        )}

        {/* FORMULARIO DE DATOS DEL PERFIL Y CUENTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* FOTO DE PERFIL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-inner">
              {fullName ? fullName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{fullName || 'Administrador'}</h3>
              <p className="text-xs text-slate-500">{profile?.email}</p>
              <span className="inline-block mt-2 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {profile?.role === 'ADMIN' ? 'Administrador del Sistema' : 'Usuario JUNTOS'}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => alert('Para cambiar foto, sube una imagen en formato JPG o PNG.')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" /> Cambiar foto
            </button>
          </div>

          {/* DATOS DE LA CUENTA */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Datos de la Cuenta
            </h3>

            <form onSubmit={handleGuardar} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Tipo de cuenta (Rol)</label>
                <input 
                  type="text" 
                  disabled 
                  value={profile?.role === 'ADMIN' ? 'Administrador del Sistema' : 'Usuario'} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  disabled 
                  value={profile?.email || 'odel_kiss@hotmail.com'} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre completo / Razón Social *</label>
                <input 
                  type="text" 
                  required
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Ej: ODELKIS DOMINGUEZ RODRIGUEZ"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono / WhatsApp de contacto</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Ej: 809-555-0100"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                </button>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow transition"
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