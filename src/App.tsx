import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, orderBy } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { 
  Ruler, Truck, Users, X, Settings, Loader2, Save, PlusCircle, LogOut, 
  Calendar, Send, Camera, FileText, Trash2, MessageSquare, Clock, Eye,
  BarChart3, Database, CircleDollarSign, Calculator, Edit3, ChevronRight, AlertTriangle, Download
} from 'lucide-react';

// ==========================================
// CONFIGURACIÓN FIREBASE & CONSTANTES
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCAUGdQVkpbRK0udGv8iHAN-9Qf3GEDBWw",
  authDomain: "axion-crespo.firebaseapp.com",
  projectId: "axion-crespo",
  storageBucket: "axion-crespo.firebasestorage.app",
  messagingSenderId: "1023938369376",
  appId: "1:1023938369376:web:917b29b40e4062d2ebf005"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "mi-estacion-crespo"; 

const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 41562, diameterMm: 2264, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 41562, diameterMm: 2264, color: 'bg-sky-400', fuel: 'super' },
  { id: 't14', name: 'T14 (Quantium D)', maxLiters: 20880, diameterMm: 2264, color: 'bg-slate-400', fuel: 'quantium_diesel' },
  { id: 't15', name: 'T15 (Quantium N)', maxLiters: 20880, diameterMm: 2264, color: 'bg-violet-400', fuel: 'quantium_nafta' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 10000, diameterMm: 1837, color: 'bg-sky-400', fuel: 'super' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 10000, diameterMm: 2088, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't10', name: 'T10 (Quantium D)', maxLiters: 10000, diameterMm: 2088, color: 'bg-slate-400', fuel: 'quantium_diesel' }
];

const CAMIONES_MEDIDAS = {
  estandar: [8000, 8000, 6000, 6000, 6000, 6000, 8000],
  chico: [8000, 7000, 5900, 4900, 6000, 7900]
};

const EMPLEADOS = [
  { nombre: "Bauman Daniel", pin: "3801" }, { nombre: "Céspedes Diego", pin: "2056" }, { nombre: "Herman Giuliano", pin: "3467" },
  { nombre: "Mayer Romina", pin: "1545" }, { nombre: "Ulrich Mailin", pin: "1475" }, { nombre: "Zingraf Lucas", pin: "3638" }
];

// --- VISTA RRHH (EMPLEADOS) ---
const RRHHView = () => {
  const [empleadoSel, setEmpleadoSel] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [sesionActiva, setSesionActiva] = useState<string | null>(null);
  const [subPantalla, setSubPantalla] = useState<string | null>(null);
  const [imgCertificado, setImgCertificado] = useState<string | null>(null);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const enviar = async (tipo: string, contenido: any) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh'), {
        empleado: sesionActiva, tipo, contenido, fecha: new Date().toISOString()
      });
      alert("Enviado ✅"); setSubPantalla(null); setImgCertificado(null); setTextoMensaje("");
    } catch (e) { alert("Error"); }
  };

  if (!sesionActiva) return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border-t-8 border-blue-600">
      <h2 className="text-xl font-black italic text-center mb-6 uppercase">Identificación</h2>
      <select value={empleadoSel} onChange={(e) => setEmpleadoSel(e.target.value)} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold mb-4 outline-none">
        <option value="">NOMBRE</option>
        {EMPLEADOS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
      </select>
      {empleadoSel && <div className="space-y-4">
        <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" className="w-full p-4 text-center text-2xl border-2 rounded-2xl font-black outline-none" />
        <button onClick={() => {
          const emp = EMPLEADOS.find(e => e.nombre === empleadoSel);
          if (emp && pinInput === emp.pin) setSesionActiva(emp.nombre); else alert("PIN Incorrecto");
        }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">INGRESAR</button>
      </div>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
        <p className="font-black text-blue-900 text-xs uppercase italic">{sesionActiva}</p>
        <button onClick={() => setSesionActiva(null)} className="text-red-500 font-bold text-xs uppercase underline">Cerrar</button>
      </div>
      {!subPantalla ? (
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border-t-8 border-blue-600 space-y-3">
          <button onClick={() => setSubPantalla('vacaciones')} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-black text-xs uppercase">📅 Vacaciones</button>
          <button onClick={() => setSubPantalla('medico')} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-black text-xs uppercase">🏥 Certificado Médico</button>
          <button onClick={() => setSubPantalla('reclamo')} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-black text-xs uppercase">✍️ Sugerencias</button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl relative">
          <button onClick={() => setSubPantalla(null)} className="absolute top-4 right-4"><X /></button>
          {subPantalla === 'vacaciones' && <div className="space-y-4">
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
            <button onClick={() => enviar("VACACIONES", `Del ${fechaDesde} al ${fechaHasta}`)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase">Enviar Pedido</button>
          </div>}
          {subPantalla === 'medico' && <div className="space-y-4 text-center">
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { const reader = new FileReader(); reader.onloadend = () => setImgCertificado(reader.result as string); reader.readAsDataURL(file); }
            }} />
            {!imgCertificado ? <button onClick={() => fileRef.current?.click()} className="w-full py-10 border-4 border-dashed rounded-2xl text-slate-400 font-black">TOCA PARA CARGAR FOTO</button> : <img src={imgCertificado} className="w-full rounded-2xl" />}
            <button disabled={!imgCertificado} onClick={() => enviar("MEDICO", imgCertificado)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase">Confirmar Envío</button>
          </div>}
          {subPantalla === 'reclamo' && <div className="space-y-4">
            <textarea value={textoMensaje} onChange={(e) => setTextoMensaje(e.target.value)} className="w-full h-32 p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Escriba aquí..." />
            <button onClick={() => enviar("SUGERENCIA", textoMensaje)} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase">Enviar Mensaje</button>
          </div>}
        </div>
      )}
    </div>
  );
};

// --- MÓDULO GERENCIA ---
function GerenciaPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveTab] = useState('pedido');
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [tankReadings, setTankReadings] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [viewImg, setViewImg] = useState<string | null>(null);
  const [tipoCamion, setTipoCamion] = useState<'estandar' | 'chico'>('estandar');
  
  // PRECIOS DE COSTO (Variables de estado para poder editarlos)
  const [fuelPrices, setFuelPrices] = useState<any>({
    super: 1025.50,
    quantium_nafta: 1240.20,
    x10: 1085.00,
    quantium_diesel: 1290.40
  });

  const [camionState, setCamionState] = useState<string[]>(new Array(7).fill('vacio'));

  useEffect(() => {
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh'), orderBy('fecha', 'desc')), (snap) => setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), (snap) => { if (snap.exists()) setTankReadings(snap.data().readings); });
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4'), orderBy('date', 'desc')), (snap) => setHistorial(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const espacioLibre = useMemo(() => {
    const espacio: any = { super: 0, quantium_nafta: 0, x10: 0, quantium_diesel: 0 };
    if (!tankReadings) return espacio;
    TANKS_CONFIG.forEach(t => { espacio[t.fuel] += (t.maxLiters - (tankReadings[t.id]?.liters || 0)); });
    return espacio;
  }, [tankReadings]);

  const pedidoTotales = useMemo(() => {
    const totales: any = { super: 0, quantium_nafta: 0, x10: 0, quantium_diesel: 0 };
    camionState.forEach((fuel, idx) => { 
      const cap = CAMIONES_MEDIDAS[tipoCamion][idx] || 0;
      if (fuel !== 'vacio') totales[fuel] += cap; 
    });
    return totales;
  }, [camionState, tipoCamion]);

  const totalCostoPedido = useMemo(() => {
    return Object.keys(pedidoTotales).reduce((acc, f) => acc + (pedidoTotales[f] * fuelPrices[f]), 0);
  }, [pedidoTotales, fuelPrices]);

  const handlePriceChange = (fuel: string, value: string) => {
    setFuelPrices((prev: any) => ({ ...prev, [fuel]: parseFloat(value) || 0 }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {viewImg && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImg(null)}><img src={viewImg} className="max-w-full max-h-full" /></div>}
      
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="font-black italic text-xl mb-8 text-[#E20074]">GERENCIA</h1>
        <nav className="space-y-1 flex-1">
          {[{ id: 'pedido', label: 'Pedido Camión', icon: <Truck className="w-4"/> }, { id: 'tanques', label: 'Estado Stock', icon: <Database className="w-4"/> }, { id: 'rrhh', label: 'Buzón RRHH', icon: <MessageSquare className="w-4"/> }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase transition-all ${activeMenu === item.id ? 'bg-[#E20074] text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>{item.icon} {item.label}</button>
          ))}
        </nav>
        <button onClick={() => navigate('/')} className="mt-6 p-4 text-slate-500 font-bold text-[9px] uppercase border border-white/10 rounded-xl flex items-center justify-center gap-2">SALIR</button>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {activeMenu === 'pedido' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              
              {/* TABLA DE PRECIOS DE COSTO EDITABLES */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-t-8 border-emerald-500">
                <h3 className="font-black uppercase italic text-gray-800 mb-4 flex items-center gap-2"><CircleDollarSign className="w-4 text-emerald-500"/> Precios de Costo Actuales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(fuelPrices).map(f => (
                    <div key={f} className="bg-slate-50 p-3 rounded-2xl border">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{f.replace('_', ' ')}</p>
                      <div className="flex items-center">
                        <span className="text-xs font-black text-slate-400 mr-1">$</span>
                        <input 
                          type="number" 
                          value={fuelPrices[f]} 
                          onChange={(e) => handlePriceChange(f, e.target.value)}
                          className="w-full bg-transparent font-black text-sm outline-none text-emerald-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SELECTOR DE CISTERNAS */}
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border-t-8 border-slate-900">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase italic text-gray-800">Cisternas Camión</h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                     <button onClick={() => { setTipoCamion('estandar'); setCamionState(new Array(7).fill('vacio')); }} className={`px-3 py-1 rounded-lg text-[8px] font-black ${tipoCamion === 'estandar' ? 'bg-white shadow' : 'text-slate-400'}`}>ESTÁNDAR (7)</button>
                     <button onClick={() => { setTipoCamion('chico'); setCamionState(new Array(6).fill('vacio')); }} className={`px-3 py-1 rounded-lg text-[8px] font-black ${tipoCamion === 'chico' ? 'bg-white shadow' : 'text-slate-400'}`}>CHICO (6)</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CAMIONES_MEDIDAS[tipoCamion].map((cap, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${camionState[idx] !== 'vacio' ? 'border-[#E20074] bg-pink-50/30' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Cisterna {idx+1}</p>
                        <p className="text-sm font-black text-slate-800 italic">{cap.toLocaleString()} L</p>
                      </div>
                      <select value={camionState[idx]} onChange={(e) => { const nc = [...camionState]; nc[idx] = e.target.value; setCamionState(nc); }} className="w-full p-2 rounded-xl font-black text-[10px] uppercase border bg-white shadow-sm outline-none">
                        <option value="vacio">-- VACÍO --</option><option value="super">🔵 SÚPER</option><option value="quantium_nafta">🟣 QUANTIUM N</option><option value="x10">🟠 X10</option><option value="quantium_diesel">⚫ QUANTIUM D</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* VALIDACIÓN Y TOTALES */}
            <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl sticky top-6">
                <h3 className="font-black uppercase italic mb-6 text-[#E20074] text-xs tracking-widest">Validación de Carga</h3>
                <div className="space-y-3">
                  {Object.keys(pedidoTotales).map(f => {
                    if (pedidoTotales[f] === 0) return null;
                    const sobra = espacioLibre[f] - pedidoTotales[f];
                    const error = sobra < 0;
                    return (
                      <div key={f} className={`p-4 rounded-2xl border ${error ? 'bg-red-500/10 border-red-500' : 'bg-emerald-500/10 border-emerald-500'}`}>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>{f.replace('_',' ')}</span><span>{pedidoTotales[f].toLocaleString()} L</span></div>
                        <p className={`text-[8px] font-bold ${error ? 'text-red-400' : 'text-emerald-400'}`}>{error ? `¡NO ENTRA! Supera en ${Math.abs(sobra).toLocaleString()}L` : `Entra (Libre: ${sobra.toLocaleString()}L)`}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-[9px] font-black text-[#E20074] uppercase italic mb-1">Total a Pagar (Costo)</p>
                  <p className="text-4xl font-black italic tracking-tighter leading-none">$ {totalCostoPedido.toLocaleString()}</p>
                  <button onClick={() => window.print()} className="w-full mt-8 bg-[#E20074] py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4"/> Descargar Nota
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'tanques' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
            {TANKS_CONFIG.map(t => {
              const liters = tankReadings?.[t.id]?.liters || 0;
              const pct = Math.round((liters / t.maxLiters) * 100);
              return (
                <div key={t.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm text-center border">
                  <div className="w-16 bg-slate-50 h-40 rounded-2xl relative overflow-hidden flex items-end border shadow-inner mb-4 mx-auto">
                    <div className={`w-full ${t.color} transition-all duration-1000`} style={{ height: `${pct}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-[10px]">{pct}%</div>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase italic">{t.name}</p>
                  <p className="text-sm font-black text-slate-800">{Math.round(liters).toLocaleString()} L</p>
                </div>
              );
            })}
          </div>
        )}

        {activeMenu === 'rrhh' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
             {solicitudes.map(sol => (
               <div key={sol.id} className="bg-white p-6 rounded-[2rem] shadow-sm border-l-8 border-slate-900 flex justify-between items-center">
                  <div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full text-white ${sol.tipo === 'VACACIONES' ? 'bg-blue-500' : sol.tipo === 'MEDICO' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{sol.tipo}</span>
                    <h3 className="font-black text-slate-800 text-sm uppercase mt-1 italic">{sol.empleado}</h3>
                    <p className="text-slate-500 text-xs mt-1 italic">{sol.tipo === 'MEDICO' ? 'Certificado Médico Adjunto' : `"${sol.contenido}"`}</p>
                  </div>
                  {sol.tipo === 'MEDICO' && <button onClick={() => setViewImg(sol.contenido)} className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl"><Eye/></button>}
               </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}

// --- MÓDULO PLAYA ---
function PlayaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('varillas');
  const [tankReadings, setTankReadings] = useState<any>(null);

  useEffect(() => {
    signInAnonymously(auth);
    return onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), (snap) => { if (snap.exists()) setTankReadings(snap.data().readings); });
  }, []);

  const handleTankChange = (tId: string, field: string, val: string) => {
    const updated = { ...tankReadings };
    updated[tId][field] = val;
    const config = TANKS_CONFIG.find(t => t.id === tId);
    if (field === 'mm' && config) {
      const r = config.diameterMm / 2;
      const h = Math.min(parseFloat(val) || 0, config.diameterMm);
      const area = Math.pow(r, 2) * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - Math.pow(h, 2));
      updated[tId].liters = Math.round((area / (Math.PI * Math.pow(r, 2))) * config.maxLiters) + (parseFloat(updated[tId].descarga) || 0);
    }
    setTankReadings(updated);
  };

  if (!tankReadings) return <div className="min-h-screen flex items-center justify-center text-[#E20074] font-black uppercase italic tracking-widest">Sincronizando AXION...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <nav className="bg-[#E20074] p-4 text-white flex justify-between items-center shadow-lg sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="font-black italic text-[10px] uppercase flex items-center gap-1"><X className="w-3 h-3"/> Salir</button>
        <div className="flex bg-black/20 p-1 rounded-xl gap-1">
          {['varillas', 'descarga', 'monitor', 'rrhh'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-[#E20074]' : 'text-white/60'}`}>{tab}</button>
          ))}
        </div>
      </nav>
      <main className="p-4 max-w-xl mx-auto w-full">
        {activeTab === 'varillas' && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-b-8 border-[#E20074]">
            <h2 className="text-lg font-black mb-6 italic uppercase flex items-center gap-3"><Ruler className="text-[#E20074]"/> Carga de Varilla</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(tank => (
                <div key={tank.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase italic leading-none">{tank.name}</span>
                  <div className="flex items-center gap-4">
                    <input type="number" value={tankReadings[tank.id]?.mm || ''} onChange={(e) => handleTankChange(tank.id, 'mm', e.target.value)} className="w-20 p-2 border-2 rounded-xl text-center font-black text-lg focus:border-[#E20074] outline-none" placeholder="0"/>
                    <div className="w-20 text-right"><span className="text-xs font-black text-[#E20074] italic leading-none">{Math.round(tankReadings[tank.id]?.liters || 0).toLocaleString()}</span><span className="block text-[8px] font-black text-slate-300 uppercase leading-none">Litros</span></div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={async () => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: tankReadings }); alert("Datos Guardados Correctamente ✅"); }} className="w-full mt-8 bg-[#E20074] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 italic"><Save className="w-4 h-4"/> Guardar Mediciones</button>
          </div>
        )}
        {activeTab === 'descarga' && (
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border-b-8 border-amber-500">
            <h2 className="text-lg font-black mb-4 italic text-gray-800 uppercase flex items-center gap-2"><Truck className="text-amber-500 w-4 h-4"/> Descarga Camión</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(tank => (
                <div key={`d-${tank.id}`} className="flex items-center justify-between p-3 bg-amber-50/30 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-black text-slate-600 uppercase">{tank.name}</span>
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-amber-500"/>
                    <input type="number" value={tankReadings[tank.id]?.descarga || ''} onChange={(e) => handleTankChange(tank.id, 'descarga', e.target.value)} className="w-20 p-1 border border-amber-200 rounded text-center font-bold text-sm outline-none focus:border-amber-500" placeholder="Litros"/>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={async () => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: tankReadings }); alert("Descarga Registrada ✅"); }} className="w-full mt-6 bg-amber-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest italic flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Registrar</button>
          </div>
        )}
        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white text-center">
             <h2 className="text-sm font-black italic uppercase tracking-widest text-emerald-400 mb-6 uppercase italic">Stock Actual Online</h2>
             <div className="flex items-end justify-around gap-1 h-48 px-2">
              {TANKS_CONFIG.map(tank => {
                const liters = tankReadings[tank.id]?.liters || 0;
                const percent = Math.min(100, (liters / tank.maxLiters) * 100);
                return (
                  <div key={`mon-${tank.id}`} className="flex flex-col items-center gap-1 w-full">
                    <div className="text-[7px] font-black">{Math.round(percent)}%</div>
                    <div className="w-full max-w-[24px] bg-white/5 rounded-t relative h-32 border border-white/5 flex items-end">
                      <div className={`w-full ${tank.color} opacity-80 transition-all`} style={{ height: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'rrhh' && <RRHHView />}
      </main>
    </div>
  );
}

// --- HOME & SPOT ---
function Home() {
  const navigate = useNavigate();
  const [pinInput, setPinInput] = useState('');
  const [targetModulo, setTargetModulo] = useState<string | null>(null);
  const PINS = { playa: "6227", spot: "3071", gerencia: "225903" };

  const verificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetModulo && pinInput === PINS[targetModulo as keyof typeof PINS]) navigate(`/${targetModulo}`);
    else { alert("PIN INCORRECTO ❌"); setPinInput(''); }
  };

  const logoGeneralImg = "/logo.png";
  const logoPlayaImg = "/playa.png";
  const logoSpotImg = "/spot.png";

  return (
    <div className="min-h-screen bg-[#E20074] flex flex-col justify-between text-white font-sans relative overflow-hidden">
      {targetModulo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-xs text-center border-t-8 border-[#E20074]">
            <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8 tracking-tighter leading-none">Acceso Restringido</h3>
            <form onSubmit={verificarPin}>
              <input autoFocus type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 border-b-4 border-[#E20074] bg-slate-50 text-center text-4xl tracking-[0.6rem] mb-10 outline-none font-black text-gray-800" placeholder="••••" />
              <div className="flex gap-4">
                <button type="button" onClick={() => setTargetModulo(null)} className="flex-1 font-bold text-slate-400 uppercase text-[9px] italic">Cancelar</button>
                <button type="submit" className="flex-1 bg-[#E20074] text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-8 px-10 flex items-center gap-4">
        <div className="h-14 w-14 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center"><img src={logoGeneralImg} className="h-full object-contain" /></div>
        <div>
          <h1 className="text-2xl font-black uppercase italic leading-none tracking-tighter">Gestión Operativa</h1>
          <p className="text-white/80 text-[9px] font-bold uppercase tracking-widest mt-1 italic">AXION ENERGY CRESPO</p>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-6 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[ { id: 'playa', logo: logoPlayaImg, label: 'Playa / Tanques' }, { id: 'spot', logo: logoSpotImg, label: 'Spot / Ventas' }, { id: 'gerencia', icon: '⚙️', label: 'Gerencia' } ].map(m => (
            <div key={m.id} onClick={() => setTargetModulo(m.id)} className="bg-white p-12 rounded-[3.5rem] shadow-2xl cursor-pointer hover:scale-105 transition-all text-center group border-4 border-transparent hover:border-white/50">
              {m.logo ? <img src={m.logo} className="h-20 mx-auto mb-6 object-contain group-hover:rotate-3 transition-transform" /> : <div className="h-20 w-20 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center border-4 border-slate-800 text-3xl group-hover:rotate-12 transition-transform">{m.icon}</div>}
              <h2 className="text-2xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">{m.label}</h2>
            </div>
          ))}
        </div>
      </main>
      <footer className="py-6 text-center text-white/40 text-[9px] font-black uppercase tracking-widest italic tracking-widest">A y A Jacob S.R.L. — 2026</footer>
    </div>
  );
}

function SpotPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <nav className="bg-amber-500 p-4 text-white flex justify-between items-center shadow-lg">
        <button onClick={() => navigate('/')} className="font-black italic text-[10px] uppercase flex items-center gap-1"><X className="w-3 h-3"/> Volver</button>
        <div className="flex bg-black/20 p-1 rounded-xl">
           <button className="px-5 py-2 rounded-lg text-[9px] font-black bg-white text-amber-600 uppercase italic">Recursos Humanos</button>
        </div>
      </nav>
      <main className="p-4 max-w-xl mx-auto w-full"><RRHHView /></main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playa" element={<PlayaPage />} />
        <Route path="/spot" element={<SpotPage />} />
        <Route path="/gerencia" element={<GerenciaPage />} />
      </Routes>
    </Router>
  );
}