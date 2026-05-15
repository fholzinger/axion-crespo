import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, orderBy } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import * as XLSX from 'xlsx';
import { 
  Ruler, Truck, Users, X, Settings, Loader2, Save, PlusCircle, LogOut, 
  Calendar, Send, Camera, FileText, Trash2, MessageSquare, Clock, Eye,
  BarChart3, Database, CircleDollarSign, Printer, AlertTriangle, Edit3, Check, Table as TableIcon, Download
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

// --- COMPONENTE RRHH (REUTILIZABLE) ---
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
        empleado: sesionActiva, tipo, contenido, fecha: new Date().toISOString(), leido: false
      });
      alert("Enviado con éxito ✅"); setSubPantalla(null); setImgCertificado(null); setTextoMensaje("");
    } catch (e) { alert("Error al enviar"); }
  };

  if (!sesionActiva) return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border-t-8 border-blue-600">
      <h2 className="text-xl font-black italic text-center mb-6 uppercase text-slate-800">Identificación Personal</h2>
      <select value={empleadoSel} onChange={(e) => setEmpleadoSel(e.target.value)} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold mb-4 outline-none">
        <option value="">-- SELECCIONAR NOMBRE --</option>
        {EMPLEADOS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
      </select>
      {empleadoSel && <div className="space-y-4 animate-in fade-in">
        <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" className="w-full p-4 text-center text-3xl border-2 rounded-2xl font-black outline-none bg-slate-50" />
        <button onClick={() => {
          const emp = EMPLEADOS.find(e => e.nombre === empleadoSel);
          if (emp && pinInput === emp.pin) { setSesionActiva(emp.nombre); setPinInput(""); } else { alert("PIN Incorrecto"); setPinInput(""); }
        }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase italic tracking-widest">Ingresar</button>
      </div>}
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100">
        <p className="font-black text-blue-900 text-xs uppercase italic">{sesionActiva}</p>
        <button onClick={() => setSesionActiva(null)} className="text-red-500 font-bold text-[10px] uppercase">Cerrar Sesión</button>
      </div>
      {!subPantalla ? (
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border-t-8 border-blue-600 space-y-3">
          <button onClick={() => setSubPantalla('vacaciones')} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-black text-xs uppercase italic flex items-center gap-3"><Calendar className="w-4 h-4 text-blue-600"/> Solicitar Vacaciones</button>
          <button onClick={() => setSubPantalla('medico')} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-black text-xs uppercase italic flex items-center gap-3"><FileText className="w-4 h-4 text-emerald-600"/> Subir Certificado Médico</button>
          <button onClick={() => setSubPantalla('reclamo')} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-black text-xs uppercase italic flex items-center gap-3"><MessageSquare className="w-4 h-4 text-rose-600"/> Sugerencias / Reclamos</button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl relative animate-in zoom-in-95">
          <button onClick={() => setSubPantalla(null)} className="absolute top-4 right-4 text-slate-300 p-2"><X /></button>
          {subPantalla === 'vacaciones' && <div className="space-y-4">
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
            <button onClick={() => enviar("VACACIONES", `Del ${fechaDesde} al ${fechaHasta}`)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase italic">Enviar Pedido</button>
          </div>}
          {subPantalla === 'medico' && <div className="space-y-4 text-center">
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { const reader = new FileReader(); reader.onloadend = () => setImgCertificado(reader.result as string); reader.readAsDataURL(file); }
            }} />
            {!imgCertificado ? <button onClick={() => fileRef.current?.click()} className="w-full py-12 border-4 border-dashed rounded-2xl text-slate-400 font-black text-[10px] uppercase flex flex-col items-center gap-2"><Camera className="w-6 h-6"/> Toca para cargar certificado</button> : <img src={imgCertificado} className="w-full rounded-2xl shadow-lg border" />}
            <button disabled={!imgCertificado} onClick={() => enviar("MEDICO", imgCertificado)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase mt-4 italic">Confirmar Envío</button>
          </div>}
          {subPantalla === 'reclamo' && <div className="space-y-4">
            <textarea value={textoMensaje} onChange={(e) => setTextoMensaje(e.target.value)} className="w-full h-40 p-4 bg-slate-50 border rounded-2xl font-bold outline-none" placeholder="Escriba aquí su mensaje..." />
            <button onClick={() => enviar("SUGERENCIA", textoMensaje)} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase italic">Enviar Mensaje</button>
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
  const [tankReadings, setTankReadings] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [viewImg, setViewImg] = useState<string | null>(null);
  const [tipoCamion, setTipoCamion] = useState<'estandar' | 'chico'>('estandar');
  const [fuelPrices, setFuelPrices] = useState<any>({ super: 1025.5, quantium_nafta: 1240.2, x10: 1085, quantium_diesel: 1290.4 });
  const [camionState, setCamionState] = useState<any[]>(new Array(7).fill({ fuel: 'vacio', tankId: '' }));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), (snap) => { if (snap.exists()) setTankReadings(snap.data().readings); });
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh'), orderBy('fecha', 'desc')), (snap) => setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const totalCostoPedido = useMemo(() => {
    return camionState.reduce((acc, cis, idx) => {
      if (cis.fuel === 'vacio') return acc;
      const cap = CAMIONES_MEDIDAS[tipoCamion][idx] || 0;
      return acc + (cap * (fuelPrices[cis.fuel] || 0));
    }, 0);
  }, [camionState, tipoCamion, fuelPrices]);

  const validacionPorTanque = useMemo(() => {
    const asignaciones: any = {}; const alertas: any = [];
    camionState.forEach((cis, idx) => {
      if (cis.fuel !== 'vacio' && cis.tankId) {
        const cap = CAMIONES_MEDIDAS[tipoCamion][idx] || 0;
        asignaciones[cis.tankId] = (asignaciones[cis.tankId] || 0) + cap;
      }
    });
    Object.keys(asignaciones).forEach(tId => {
      const config = TANKS_CONFIG.find(t => t.id === tId);
      const libre = (config?.maxLiters || 0) - (tankReadings?.[tId]?.liters || 0);
      if (asignaciones[tId] > libre) alertas.push({ name: config?.name, sobra: asignaciones[tId] - libre });
    });
    return alertas;
  }, [camionState, tipoCamion, tankReadings]);

  const exportarExcel = () => {
    const data = TANKS_CONFIG.map(t => ({
      'Tanque': t.name,
      'Producto': t.fuel.toUpperCase(),
      'Stock Actual (L)': Math.round(tankReadings?.[t.id]?.liters || 0),
      'Medición (mm)': tankReadings?.[t.id]?.mm || 0,
      'Descarga Hoy (L)': tankReadings?.[t.id]?.descarga || 0,
      'Capacidad Máx': t.maxLiters
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Control");
    XLSX.writeFile(wb, `AXION_Planilla_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleUpdateField = async (tId: string, field: string) => {
    const updated = { ...tankReadings };
    const val = parseFloat(editValue) || 0;
    updated[tId][field] = val;
    if (field === 'mm') {
      const config = TANKS_CONFIG.find(t => t.id === tId);
      if (config) {
        const r = config.diameterMm / 2;
        const h = Math.min(val, config.diameterMm);
        const area = Math.pow(r, 2) * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - Math.pow(h, 2));
        updated[tId].liters = Math.round((area / (Math.PI * Math.pow(r, 2))) * config.maxLiters) + (updated[tId].descarga || 0);
      }
    }
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: updated });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-800">
      {viewImg && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImg(null)}><img src={viewImg} className="max-h-full max-w-full" /></div>}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col shadow-2xl z-20">
        <h1 className="font-black italic text-xl mb-8 text-[#E20074]">GERENCIA</h1>
        <nav className="space-y-1 flex-1">
          {[{ id: 'pedido', label: 'Carga Camión', icon: <Truck className="w-4"/> }, 
            { id: 'edicion', label: 'Edición Datos', icon: <Edit3 className="w-4"/> },
            { id: 'ventas', label: 'Resumen Ventas', icon: <BarChart3 className="w-4"/> },
            { id: 'datos', label: 'Planilla Mes', icon: <TableIcon className="w-4"/> },
            { id: 'rrhh', label: 'Buzón RRHH', icon: <MessageSquare className="w-4"/> }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase transition-all ${activeMenu === item.id ? 'bg-[#E20074] text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>{item.icon} {item.label}</button>
          ))}
        </nav>
        <button onClick={() => navigate('/')} className="mt-6 p-4 text-slate-500 font-bold text-[9px] uppercase border border-white/10 rounded-xl">SALIR</button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeMenu === 'pedido' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-t-8 border-emerald-500">
                <h3 className="font-black uppercase italic text-gray-800 mb-4 flex items-center gap-2 text-xs"><CircleDollarSign className="w-4 text-emerald-500"/> Costos por Litro ($)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                  {Object.keys(fuelPrices).map(f => (
                    <div key={f} className="bg-slate-50 p-2 rounded-xl border">
                      <p className="text-[7px] font-black text-slate-400 uppercase italic mb-1">{f.replace('_',' ')}</p>
                      <input type="number" value={fuelPrices[f]} onChange={(e) => setFuelPrices({...fuelPrices, [f]: parseFloat(e.target.value)})} className="w-full bg-transparent font-black text-sm outline-none text-emerald-600 text-center" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border-t-8 border-slate-900">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase italic text-gray-800">Configuración Camión</h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => { setTipoCamion('estandar'); setCamionState(new Array(7).fill({fuel:'vacio', tankId:''})); }} className={`px-4 py-1.5 rounded-lg text-[8px] font-black ${tipoCamion === 'estandar' ? 'bg-white shadow' : 'text-slate-400'}`}>ESTÁNDAR</button>
                    <button onClick={() => { setTipoCamion('chico'); setCamionState(new Array(6).fill({fuel:'vacio', tankId:''})); }} className={`px-4 py-1.5 rounded-lg text-[8px] font-black ${tipoCamion === 'chico' ? 'bg-white shadow' : 'text-slate-400'}`}>CHICO</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {CAMIONES_MEDIDAS[tipoCamion].map((cap, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center gap-3 transition-all ${camionState[idx].fuel !== 'vacio' ? 'border-[#E20074] bg-pink-50/20' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="w-24 text-center sm:text-left"><p className="text-[8px] font-black text-slate-400 uppercase leading-none italic mb-1">Cisterna {idx+1}</p><p className="text-sm font-black text-slate-800 italic">{cap.toLocaleString()} L</p></div>
                      <select value={camionState[idx].fuel} onChange={(e) => { const nc = [...camionState]; nc[idx] = { fuel: e.target.value, tankId: '' }; setCamionState(nc); }} className="flex-1 p-3 rounded-xl font-black text-[10px] uppercase border bg-white outline-none focus:border-[#E20074]">
                        <option value="vacio">-- PRODUCTO --</option><option value="super">🔵 SÚPER</option><option value="quantium_nafta">🟣 QUANTIUM N</option><option value="x10">🟠 X10</option><option value="quantium_diesel">⚫ QUANTIUM D</option>
                      </select>
                      <select disabled={camionState[idx].fuel === 'vacio'} value={camionState[idx].tankId} onChange={(e) => { const nc = [...camionState]; nc[idx].tankId = e.target.value; setCamionState(nc); }} className="flex-1 p-3 rounded-xl font-black text-[10px] uppercase border bg-white outline-none disabled:opacity-30">
                        <option value="">-- TANQUE --</option>
                        {TANKS_CONFIG.filter(t => t.fuel === camionState[idx].fuel).map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Libre: {Math.round(t.maxLiters - (tankReadings?.[t.id]?.liters || 0)).toLocaleString()}L)</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6 text-center">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl sticky top-4">
                <h3 className="font-black uppercase italic mb-6 text-[#E20074] text-xs">Validación</h3>
                {validacionPorTanque.length > 0 ? validacionPorTanque.map((al, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-red-500/20 border border-red-500 mb-2 animate-pulse">
                    <p className="text-[10px] font-black uppercase text-red-500">NO ENTRA EN {al.name}</p>
                    <p className="text-lg font-black">+{al.sobra.toLocaleString()} L</p>
                  </div>
                )) : <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-black text-[10px] uppercase italic">Pedido Seguro</div>}
                <div className="mt-8 pt-8 border-t border-white/10">
                   <p className="text-[9px] font-black text-[#E20074] uppercase italic mb-1">Costo Total</p>
                   <p className="text-4xl font-black italic tracking-tighter mb-8 text-white">$ {totalCostoPedido.toLocaleString()}</p>
                   <button onClick={() => window.print()} className="w-full bg-[#E20074] py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"><Printer className="w-4"/> Imprimir Nota</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeMenu === 'edicion' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border-t-8 border-slate-900 animate-in fade-in">
            <h3 className="font-black uppercase italic text-gray-800 mb-6 flex items-center gap-2"><Edit3 className="text-[#E20074]"/> Editor de Mediciones Actuales</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] font-black text-slate-400 uppercase border-b"><th className="pb-4">Tanque</th><th className="pb-4">Varilla (mm)</th><th className="pb-4">Descarga (L)</th><th className="pb-4 text-right">Stock Final</th></tr></thead>
                <tbody>
                  {TANKS_CONFIG.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-black text-xs uppercase italic">{t.name}</td>
                      <td className="py-4">
                        {editingId === `${t.id}-mm` ? (
                          <div className="flex gap-1"><input autoFocus type="number" className="w-20 p-1 border rounded font-bold" value={editValue} onChange={e=>setEditValue(e.target.value)} /><button onClick={()=>handleUpdateField(t.id, 'mm')} className="text-emerald-500"><Check className="w-4"/></button></div>
                        ) : (
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={()=>{setEditingId(`${t.id}-mm`); setEditValue(tankReadings?.[t.id]?.mm || "")}}><span className="font-bold">{tankReadings?.[t.id]?.mm || 0}</span><Edit3 className="w-3 text-slate-200 group-hover:text-[#E20074]"/></div>
                        )}
                      </td>
                      <td className="py-4">
                        {editingId === `${t.id}-descarga` ? (
                          <div className="flex gap-1"><input autoFocus type="number" className="w-24 p-1 border rounded font-bold" value={editValue} onChange={e=>setEditValue(e.target.value)} /><button onClick={()=>handleUpdateField(t.id, 'descarga')} className="text-emerald-500"><Check className="w-4"/></button></div>
                        ) : (
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={()=>{setEditingId(`${t.id}-descarga`); setEditValue(tankReadings?.[t.id]?.descarga || "")}}><span className="font-bold">{tankReadings?.[t.id]?.descarga || 0} L</span><Edit3 className="w-3 text-slate-200 group-hover:text-amber-500"/></div>
                        )}
                      </td>
                      <td className="py-4 text-right font-black text-[#E20074] italic">{Math.round(tankReadings?.[t.id]?.liters || 0).toLocaleString()} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeMenu === 'ventas' && (
          <div className="space-y-6 animate-in fade-in">
             <h2 className="text-2xl font-black italic uppercase">Ventas por Producto (Hoy)</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['super', 'quantium_nafta', 'x10', 'quantium_diesel'].map(f => {
                   const venta = TANKS_CONFIG.filter(t => t.fuel === f).reduce((acc, t) => acc + (parseFloat(tankReadings?.[t.id]?.descarga || 0)), 0);
                   return (
                     <div key={f} className="bg-white p-8 rounded-[2.5rem] shadow-sm border-b-8 border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{f.replace('_',' ')}</p>
                       <p className="text-3xl font-black text-slate-800 italic">{venta.toLocaleString()} L</p>
                     </div>
                   );
                })}
             </div>
          </div>
        )}
        {activeMenu === 'datos' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border-t-8 border-[#E20074] animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase italic text-gray-800">Planilla de Control</h3>
              <button onClick={exportarExcel} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg"><Download className="w-3"/> Exportar Excel</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[9px] font-black text-slate-400 uppercase border-b"><th className="pb-4">Tanque</th><th className="pb-4">Descarga Hoy</th><th className="pb-4">Stock Actual</th><th className="pb-4 text-right">Estado</th></tr></thead>
                <tbody className="text-[10px] font-bold italic">
                  {TANKS_CONFIG.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-4 uppercase text-[#E20074]">{t.name}</td>
                      <td className="py-4 text-amber-600">+{tankReadings?.[t.id]?.descarga || 0} L</td>
                      <td className="py-4">{Math.round(tankReadings?.[t.id]?.liters || 0).toLocaleString()} L</td>
                      <td className="py-4 text-right text-emerald-600 uppercase">Sincronizado</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeMenu === 'rrhh' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
             {solicitudes.map(sol => (
               <div key={sol.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-8 border-slate-900 flex justify-between items-center group">
                  <div className="flex-1">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full text-white ${sol.tipo === 'VACACIONES' ? 'bg-blue-500' : sol.tipo === 'MEDICO' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{sol.tipo}</span>
                    <h3 className="font-black text-slate-800 text-sm mt-1 italic uppercase">{sol.empleado}</h3>
                    <div className="p-3 bg-slate-50 rounded-xl mt-2">{sol.tipo === 'MEDICO' ? <button onClick={()=>setViewImg(sol.contenido)} className="text-emerald-600 font-black text-xs uppercase flex items-center gap-1"><Eye className="w-3"/> Ver Certificado</button> : <p className="text-slate-600 text-xs italic">"{sol.contenido}"</p>}</div>
                    <p className="text-[8px] text-slate-300 font-bold mt-2 uppercase">{new Date(sol.fecha).toLocaleString()}</p>
                  </div>
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

  if (!tankReadings) return <div className="min-h-screen flex items-center justify-center text-[#E20074] font-black uppercase animate-pulse">Sincronizando AXION...</div>;

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
            <h2 className="text-lg font-black mb-6 italic uppercase flex items-center gap-3 text-slate-800"><Ruler className="text-[#E20074]"/> Carga Varilla</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(tank => (
                <div key={tank.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase italic leading-none">{tank.name}</span>
                  <div className="flex items-center gap-4">
                    <input type="number" value={tankReadings[tank.id]?.mm || ''} onChange={(e) => handleTankChange(tank.id, 'mm', e.target.value)} className="w-24 p-2 border-2 rounded-xl text-center font-black text-lg focus:border-[#E20074] outline-none" placeholder="0"/>
                    <div className="w-20 text-right font-black text-[#E20074] italic leading-none">{Math.round(tankReadings[tank.id]?.liters || 0).toLocaleString()}L</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={async () => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: tankReadings }); alert("Guardado ✅"); }} className="w-full mt-8 bg-[#E20074] text-white py-5 rounded-2xl font-black uppercase italic shadow-xl shadow-pink-900/10">Sincronizar Mediciones</button>
          </div>
        )}
        {activeTab === 'descarga' && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-b-8 border-amber-500 animate-in fade-in text-slate-800">
             <h2 className="text-lg font-black mb-4 italic uppercase flex items-center gap-2"><Truck className="text-amber-500 w-4 h-4"/> Descarga Camión</h2>
             <div className="space-y-2">
                {TANKS_CONFIG.map(tank => (
                  <div key={tank.id} className="flex items-center justify-between p-3 bg-amber-50/30 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-black text-slate-600 uppercase italic">{tank.name}</span>
                    <input type="number" value={tankReadings[tank.id]?.descarga || ''} onChange={(e) => handleTankChange(tank.id, 'descarga', e.target.value)} className="w-24 p-2 border rounded font-black text-sm text-center outline-none focus:border-amber-500" placeholder="Litros"/>
                  </div>
                ))}
             </div>
             <button onClick={async () => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: tankReadings }); alert("Descarga Registrada ✅"); }} className="w-full mt-6 bg-amber-500 text-white py-4 rounded-xl font-black uppercase shadow-lg italic tracking-widest">Sincronizar Descarga</button>
          </div>
        )}
        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white text-center animate-in zoom-in-95">
             <h2 className="text-sm font-black italic uppercase text-emerald-400 mb-6">Nivel Online</h2>
             <div className="flex items-end justify-around gap-1 h-48 px-2">
              {TANKS_CONFIG.map(tank => {
                const percent = Math.min(100, ((tankReadings[tank.id]?.liters || 0) / tank.maxLiters) * 100);
                return (
                  <div key={tank.id} className="flex flex-col items-center gap-1 w-full">
                    <div className="text-[7px] font-black">{Math.round(percent)}%</div>
                    <div className="w-full max-w-[24px] bg-white/5 rounded-t relative h-32 flex items-end shadow-inner"><div className={`w-full ${tank.color} opacity-80`} style={{ height: `${percent}%` }}></div></div>
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

// --- HOME ---
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

  return (
    <div className="min-h-screen bg-[#E20074] flex flex-col justify-between text-white font-sans relative overflow-hidden">
      {targetModulo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-xs text-center border-t-8 border-[#E20074] animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8">Seguridad</h3>
            <form onSubmit={verificarPin}>
              <input autoFocus type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 border-b-4 border-[#E20074] bg-slate-50 text-center text-4xl tracking-[0.5rem] mb-10 outline-none font-black text-gray-800" placeholder="••••" />
              <div className="flex gap-4"><button type="button" onClick={() => setTargetModulo(null)} className="flex-1 font-bold text-slate-400 uppercase text-[9px]">Atrás</button><button type="submit" className="flex-1 bg-[#E20074] text-white py-4 rounded-2xl font-black uppercase text-[10px]">Entrar</button></div>
            </form>
          </div>
        </div>
      )}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-8 px-10 flex items-center gap-4 shadow-xl">
        <div className="h-14 w-14 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center font-black italic text-pink-600 text-xs tracking-widest">AXION</div>
        <div><h1 className="text-2xl font-black uppercase italic leading-none tracking-tighter">Gestión Operativa</h1><p className="text-white/80 text-[9px] font-bold uppercase tracking-widest mt-1 italic text-white">AXION Crespo</p></div>
      </header>
      <main className="flex-grow flex items-center justify-center p-6 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[ { id: 'playa', label: 'Playa / Tanques' }, { id: 'spot', label: 'Spot / Ventas' }, { id: 'gerencia', label: 'Gerencia' } ].map(m => (
            <div key={m.id} onClick={() => setTargetModulo(m.id)} className="bg-white p-12 rounded-[3.5rem] shadow-2xl cursor-pointer hover:scale-105 transition-all text-center group border-4 border-transparent hover:border-white/50">
              <div className="h-20 w-20 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center border-4 border-slate-800 text-3xl font-black italic">{m.id === 'gerencia' ? '⚙️' : m.id === 'playa' ? '⛽' : '☕'}</div>
              <h2 className="text-2xl font-black text-slate-800 italic uppercase leading-none">{m.label}</h2>
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800"><nav className="bg-amber-500 p-4 text-white flex justify-between items-center shadow-lg"><button onClick={() => navigate('/')} className="font-black italic text-[10px] uppercase flex items-center gap-1"><X className="w-3 h-3"/> Volver</button></nav><main className="p-4 max-w-xl mx-auto w-full"><RRHHView /></main></div>
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