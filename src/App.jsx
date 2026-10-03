import { useApp } from './store.jsx'
import { Landing, Login } from './views/Public.jsx'
import Familia from './views/Familia.jsx'
import Acompanante from './views/Acompanante.jsx'
import Admin from './views/Admin.jsx'
import RegistroAcompanante from './views/RegistroAcompanante.jsx'
import { R, total } from './lib.js'

export default function App() {
  const { role, setRole, sheet, setSheet, cobrar, V } = useApp()

  // Buscar el servicio seleccionado para el modal de pago
  const v = sheet?.id ? V.find(x => x.id === sheet.id) : null

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* BARRA SUPERIOR - Visible solo cuando ya iniciaste sesión */}
      {!['landing', 'login', 'registro_acompanante'].includes(role) && (
        <div className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-3 shadow-sm border-b">
          <div className="flex items-center gap-2">
            <img src="/logo-juntos.jpg" alt="JUNTOS" className="h-8 w-8 rounded-lg bg-black object-contain shadow-sm" />
            <span className="font-black tracking-tight">JUNTOS</span>
          </div>
          
          {/* Selector de roles (Siempre desbloqueado para tus pruebas) */}
          <select 
            className="rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-bold text-[#0A4DA1] border border-blue-100 outline-none"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="familia">👨‍👩‍👧 Familia RD</option>
            <option value="diaspora">✈️ Diáspora</option>
            <option value="aco">💙 Acompañante</option>
            <option value="admin">🗺️ Mesa Op.</option>
            <option value="landing">Cerrar Sesión</option>
          </select>
        </div>
      )}

      {/* RUTAS DE PANTALLAS */}
      <main>
        {role === 'landing' && <Landing />}
        {role === 'login' && <Login />}
        {role === 'registro_acompanante' && <RegistroAcompanante />}
        {(role === 'familia' || role === 'diaspora') && <Familia />}
        {role === 'aco' && <Acompanante />}
        {role === 'admin' && <Admin />}
      </main>

      {/* MODALES EMERGENTES (Pago, SOS, Facturas) */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 p-4 pb-8 fade-in" onClick={() => setSheet(null)}>
          <div className="bg-white rounded-3xl p-6 shadow-xl slide-up" onClick={e => e.stopPropagation()}>
            
            {/* Modal de Pago Simulado */}
            {sheet.t === 'pago' && v && (
              <>
                <h3 className="text-xl font-bold mb-4">Pago · {R(total(v))}</h3>
                <div className="space-y-3">
                  <button className="btn !bg-white !text-slate-900 border-2 border-slate-200 flex justify-between items-center" onClick={() => cobrar(v.id, 'Azul')}>
                    <span className="flex items-center gap-2">🇩🇴 Azul Dominicana</span>
                    <b>{R(total(v))}</b>
                  </button>
                  <button className="btn !bg-white !text-slate-900 border-2 border-slate-200 flex justify-between items-center" onClick={() => cobrar(v.id, 'Stripe')}>
                    <span className="flex items-center gap-2">💳 Stripe (USA/España)</span>
                    <b>US${(total(v) / 60).toFixed(2)}</b>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">Demo: simula el pago. En producción abre el link de Azul o Stripe Checkout de forma segura.</p>
              </>
            )}

            {/* Modal de Emergencia SOS */}
            {sheet.t === 'sos' && (
              <div className="text-center pt-2">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl animate-pulse">🚨</div>
                <h3 className="text-2xl font-black mb-2 text-slate-900">Emergencia SOS</h3>
                <p className="text-sm text-slate-600 mb-6 px-4">Se enviará tu ubicación GPS y se notificará inmediatamente a la Mesa Operacional y a los contactos de emergencia de la familia.</p>
                <button className="btn !bg-red-600 !text-white font-bold mb-3 !py-4 text-lg shadow-lg shadow-red-200" onClick={() => { alert('Alerta enviada a la Mesa Operacional.'); setSheet(null); }}>Emitir Alerta SOS</button>
                <button className="btn btn-g" onClick={() => setSheet(null)}>Cancelar</button>
              </div>
            )}

            {/* Modal de Factura */}
            {sheet.t === 'factura' && (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🧾</div>
                <h3 className="text-xl font-bold mb-2">Factura Generada</h3>
                <p className="text-sm text-slate-600 mb-6">La factura con comprobante fiscal (NCF) ha sido enviada al correo registrado de la familia.</p>
                <button className="btn btn-y" onClick={() => setSheet(null)}>Cerrar</button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}