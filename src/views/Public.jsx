import {useState} from 'react'
import {useApp} from '../store.jsx'

export function Landing(){
  const {go,setRole}=useApp()

  const entrarDirecto = (rolElegido) => {
    setRole(rolElegido)
    go(rolElegido)
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-20 font-sans text-slate-900">
      <div className="py-6 text-center">
        <img src="/logo-juntos.jpg" alt="JUNTOS" className="mx-auto h-16 w-16 rounded-2xl object-contain bg-black shadow-md" />
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">JUNTOS</h1>
        <p className="mt-1 text-sm text-slate-600 font-medium">Acompañamiento profesional y humano para adultos mayores en RD 🇩🇴</p>
      </div>

      <div className="card my-4 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-950 mb-1">Acceso Rápido (Modo Evaluación)</h3>
        <p className="text-xs text-blue-800 mb-3">Ingresa directamente con el perfil que deseas probar:</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn !bg-[#1B9DF5] !text-white text-xs py-2.5 font-bold" onClick={()=>entrarDirecto('familia')}>👨‍👩‍👧 Familia RD</button>
          <button className="btn !bg-emerald-600 !text-white text-xs py-2.5 font-bold" onClick={()=>entrarDirecto('aco')}>💙 Acompañante</button>
          <button className="btn btn-g text-xs py-2.5 font-bold" onClick={()=>entrarDirecto('diaspora')}>✈️ Diáspora</button>
          <button className="btn btn-g text-xs py-2.5 font-bold" onClick={()=>entrarDirecto('admin')}>🗺️ Mesa Op.</button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="card">
          <h3 className="font-bold text-base flex items-center gap-2">🛡️ Personal Verificado con Cédula</h3>
          <p className="mu mt-1 text-sm">Validación rigurosa de identidad, antecedentes penales y formación geriátrica práctica. Portan su chaleco azul oficial.</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-base flex items-center gap-2">📍 Check-in con Foto y GPS</h3>
          <p className="mu mt-1 text-sm">Sabes el minuto exacto de llegada y salida con marca de agua inalterable en el domicilio.</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-base flex items-center gap-2">💬 Reporte de Jornada y Video-Abrazo</h3>
          <p className="mu mt-1 text-sm">Recibe detalles de alimentación, medicación, estado de ánimo y un video de 30 segundos de tu familiar.</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-base flex items-center gap-2">💳 JUNTOS Wallet</h3>
          <p className="mu mt-1 text-sm">Billetera digital segura para recargar fondos exclusivos para la reserva y pago directo de tus acompañantes verificadas.</p>
        </div>
      </div>

      <div className="mt-6">
        <button className="btn btn-y text-base font-bold !py-3.5" onClick={()=>go('login')}>
          Iniciar sesión con WhatsApp / Celular
        </button>
      </div>

      <div className="mt-6 text-center">
        <button 
          className="text-sm font-bold text-blue-600 underline" 
          onClick={() => go('registro_acompanante')}
        >
          ¿Quieres ser acompañante? Aplica y únete a nuestro equipo
        </button>
      </div>
    </div>
  )
}

export function Login(){
  const {login,confirmarOtp,go,setRole}=useApp()
  const [tel,setTel]=useState('')
  const [code,setCode]=useState('')
  const [paso,setPaso]=useState(1)
  const [rolSel,setRolSel]=useState('familia')
  const [busy,setBusy]=useState(false)

  const handlePedirCodigo = async () => {
    if(!tel) return alert('Ingresa tu número de teléfono')
    setBusy(true)
    await login(tel, rolSel)
    setBusy(false)
    setPaso(2)
  }

  const handleValidarCodigo = async () => {
    setBusy(true)
    await confirmarOtp(code || '123456', rolSel)
    setBusy(false)
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pt-10 font-sans text-slate-900">
      <button className="btn btn-g btn-s mb-4 !w-auto" onClick={()=>go('landing')}>‹ Volver</button>
      
      <h2 className="text-2xl font-black">Acceso a JUNTOS</h2>
      <p className="mu mb-4">Ingresa tu número para coordinar el acompañamiento.</p>

      {paso === 1 ? (
        <div className="space-y-4">
          <label className="lbl">¿Cómo deseas entrar hoy?</label>
          <div className="flex gap-2">
            <button 
              type="button" 
              className={'flex-1 rounded-xl border p-2.5 text-xs font-bold ' + (rolSel==='familia'?'border-[#1B9DF5] bg-blue-50 text-[#1B9DF5]':'border-slate-200')} 
              onClick={()=>setRolSel('familia')}
            >
              👨‍👩‍👧 Familia
            </button>
            <button 
              type="button" 
              className={'flex-1 rounded-xl border p-2.5 text-xs font-bold ' + (rolSel==='aco'?'border-[#1B9DF5] bg-blue-50 text-[#1B9DF5]':'border-slate-200')} 
              onClick={()=>setRolSel('aco')}
            >
              💙 Acompañante
            </button>
            <button 
              type="button" 
              className={'flex-1 rounded-xl border p-2.5 text-xs font-bold ' + (rolSel==='diaspora'?'border-[#1B9DF5] bg-blue-50 text-[#1B9DF5]':'border-slate-200')} 
              onClick={()=>setRolSel('diaspora')}
            >
              ✈️ Diáspora
            </button>
          </div>

          <div>
            <label className="lbl">Número de WhatsApp o Celular</label>
            <input 
              className="inp" 
              type="tel" 
              placeholder="Ej: +18095550101" 
              value={tel} 
              onChange={e=>setTel(e.target.value)} 
            />
          </div>

          <button className="btn btn-y" disabled={busy} onClick={handlePedirCodigo}>
            {busy ? 'Verificando...' : 'Enviar código / Entrar'}
          </button>

          <div className="pt-2 text-center">
            <button 
              className="text-xs text-slate-500 underline" 
              onClick={()=>{ setRole(rolSel); go(rolSel); }}
            >
              Entrar inmediatamente sin código (Demo)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="lbl">Ingresa el código recibido (o usa 123456)</label>
          <input 
            className="inp text-center tracking-widest text-lg font-bold" 
            placeholder="123456" 
            value={code} 
            onChange={e=>setCode(e.target.value)} 
          />

          <button className="btn btn-y" disabled={busy} onClick={handleValidarCodigo}>
            {busy ? 'Validando...' : 'Confirmar y Entrar'}
          </button>
        </div>
      )}
    </div>
  )
}