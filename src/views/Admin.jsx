import { useState } from 'react'
import { useApp } from '../store.jsx'
import { dt, tm } from '../lib.js'
import { Chip } from './Shared.jsx'

// Perfil de prueba para que veas cómo entra una solicitud
const MOCK_ASPIRANTES = [
  {
    id: 101,
    nombre: 'Juana Bautista',
    cedula: '402-1234567-8',
    refFamiliar: '809-555-0011 (Hermana)',
    idAcademia: 'JUN-2026-08',
    fecha: new Date().toISOString(),
    estado: 'Pendiente'
  }
]

export default function Admin() {
  const { V, go } = useApp()
  const [tab, setTab] = useState('aspirantes')
  const [aspirantes, setAspirantes] = useState(MOCK_ASPIRANTES)
  const [sel, setSel] = useState(null)

  const a = aspirantes.find(x => x.id === sel)

  const aprobar = () => {
    alert(`La acompañante ${a.nombre} ha sido APROBADA y se ha activado su perfil en la plataforma.`)
    setAspirantes(prev => prev.filter(x => x.id !== sel))
    setSel(null)
  }

  const rechazar = () => {
    if(window.confirm('¿Estás segura de rechazar definitivamente esta solicitud?')) {
      setAspirantes(prev => prev.filter(x => x.id !== sel))
      setSel(null)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 pb-20 font-sans text-slate-900">
      {/* Cabecera Admin */}
      <div className="bg-[#0A4DA1] px-4 pt-10 pb-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Mesa Operacional</h1>
          <button className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold" onClick={() => go('landing')}>
            Salir
          </button>
        </div>
        
        {/* Pestañas de Navegación */}
        <div className="mt-4 flex gap-2">
          <button 
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${tab === 'servicios' ? 'bg-white text-[#0A4DA1]' : 'bg-white/20'}`} 
            onClick={() => setTab('servicios')}
          >
            📡 Servicios Activos
          </button>
          <button 
            className={`flex-1 rounded-lg py-2 text-sm font-bold relative ${tab === 'aspirantes' ? 'bg-white text-[#0A4DA1]' : 'bg-white/20'}`} 
            onClick={() => {setTab('aspirantes'); setSel(null)}}
          >
            📋 Solicitudes
            {aspirantes.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {aspirantes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* PESTAÑA 1: REVISIÓN DE ASPIRANTES */}
        {tab === 'aspirantes' && (
          sel ? (
            <div className="fade-in space-y-4">
              <button className="btn btn-g btn-s !w-auto" onClick={() => setSel(null)}>‹ Volver a la bandeja</button>
              
              <div className="card border-l-4 border-l-yellow-400">
                <h2 className="text-xl font-bold">{a.nombre}</h2>
                <p className="mu text-sm">Aplicó el {dt(a.fecha)} a las {tm(a.fecha)}</p>
                <Chip e="Pendiente de Revisión" />
              </div>

              <h3 className="font-bold text-lg mt-4">1. Identidad y Biometría</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border bg-slate-200 h-24 flex flex-col items-center justify-center text-xs text-slate-500">
                  <span>📷 Cédula Frontal</span>
                  <span className="font-bold text-slate-700">{a.cedula}</span>
                </div>
                <div className="rounded-xl border bg-slate-200 h-24 flex items-center justify-center text-xs text-slate-500">
                  🤳 Selfie (Liveness)
                </div>
              </div>

              <h3 className="font-bold text-lg mt-4">2. Depuración</h3>
              <div className="card space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="mu">Academia JUNTOS</span>
                  <span className="font-bold text-green-600">✅ {a.idAcademia}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="mu">Ref. Familiar</span>
                  <span className="font-bold">{a.refFamiliar} 📞</span>
                </div>
                <div className="pt-1">
                  <span className="mu block mb-2">Papel de Buena Conducta (PGR)</span>
                  <div className="flex gap-2">
                    <button className="btn btn-g btn-s flex-1 text-xs">📄 Ver PDF adjunto</button>
                    <a 
                      href="https://pgr.gob.do/servicios/certificado-de-no-antecedentes-penales/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-s flex-1 text-xs !bg-blue-100 !text-blue-800 flex items-center justify-center"
                    >
                      🔍 Validar en PGR
                    </a>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-lg mt-4">3. Contratos y Legalidad</h3>
              <div className="card text-sm space-y-2">
                <p>✅ Autorización de Depuración (Ley 172-13)</p>
                <p>✅ Contrato Protección Envejeciente (Ley 352-98)</p>
                <p>✅ Acuerdo de Confidencialidad (NDA)</p>
                <div className="mt-3 p-3 bg-slate-100 rounded-lg text-center border-2 border-slate-300 border-dashed">
                  <span className="font-serif italic text-xl text-slate-700">{a.nombre}</span>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Firma Digital (Ley 126-02)</p>
                </div>
              </div>

              {/* Botones de Decisión */}
              <div className="flex gap-2 pt-4">
                <button className="btn !bg-red-100 !text-red-700 flex-1 font-bold" onClick={rechazar}>❌ Rechazar</button>
                <button className="btn !bg-green-600 !text-white flex-1 font-bold" onClick={aprobar}>✅ Aprobar</button>
              </div>
            </div>
          ) : (
            <div className="fade-in space-y-3">
              <h2 className="text-lg font-bold text-slate-700">Nuevas Solicitudes</h2>
              {aspirantes.length === 0 ? (
                <div className="card text-center py-8 text-slate-500">Bandeja limpia. No hay solicitudes pendientes.</div>
              ) : (
                aspirantes.map(x => (
                  <div key={x.id} className="card cursor-pointer hover:border-[#1B9DF5] transition-colors border-l-4 border-l-yellow-400" onClick={() => setSel(x.id)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{x.nombre}</h3>
                        <p className="text-sm text-slate-500">Cédula: {x.cedula}</p>
                      </div>
                      <span className="text-2xl text-slate-300">›</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        )}

        {/* PESTAÑA 2: MONITOREO DE SERVICIOS */}
        {tab === 'servicios' && (
          <div className="fade-in space-y-3">
            <h2 className="text-lg font-bold text-slate-700">Monitor de Operaciones</h2>
            {V.length === 0 ? (
              <div className="card text-center py-8 text-slate-500">No hay servicios activos en este momento.</div>
            ) : (
              V.map(x => (
                <div key={x.id} className="card text-sm">
                  <div className="flex justify-between mb-1">
                    <b className="text-base">{x.ab}</b>
                    <Chip e={x.estado} />
                  </div>
                  <p className="text-slate-600">Acompañante: {x.estado === 'Pendiente' ? 'Buscando en la zona...' : x.acoInfo?.n}</p>
                  <p className="text-slate-600">Zona: {x.prov} · {x.dir}</p>
                  <p className="text-xs text-slate-400 mt-2">{dt(x.fecha)} {x.hora} · ID: {x.id}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}