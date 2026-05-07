import React, { useState, useEffect } from 'react';
import { 
    Fuel, Coffee, CircleDollarSign, Droplets, PlusCircle, Clock, FileText, 
    Trash2, ClipboardList, Database, Ruler, AlertTriangle, ArrowRight, 
    Send, CalendarDays, Truck, CheckCircle2, Save, User, X, Lock, 
    Unlock, Download, ShieldAlert, Key, Info, PackagePlus, Calendar, 
    Loader2, Calculator, History, Edit3, ChevronRight 
  } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- CONFIGURACIÓN FIREBASE ---
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

// --- TABLA DE AFORO EXACTA (40m3 y 20m3) ---
const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 39000, color: 'bg-orange-500', factor: 18.35 },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 39000, color: 'bg-sky-400', factor: 18.35 },
  { id: 't14', name: 'T14 (Q. Diesel)', maxLiters: 19000, color: 'bg-slate-400', factor: 9.22 },
  { id: 't15', name: 'T15 (Q. Nafta)', maxLiters: 19000, color: 'bg-violet-400', factor: 9.22 },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 9500, color: 'bg-sky-400', factor: 5.44 },
  { id: 't9', name: 'T9 (X10)', maxLiters: 9500, color: 'bg-orange-500', factor: 5.44 },
  { id: 't10', name: 'T10 (Q. Diesel)', maxLiters: 9500, color: 'bg-slate-400', factor: 5.44 }
];

// --- DATOS INICIALES (MAYO 2026 - RECUPERADOS) ---
const INITIAL_HISTORY = [
  { date: '2026-05-07', responsable: 'Bauman D.', lv: { t12: 3099, t13: 4614, t14: 3060, t15: 9092, t8: 8271, t9: 2873, t10: 8653 }, fin_liters: { t12: 3099, t13: 4614, t14: 3060, t15: 9092, t8: 8271, t9: 2873, t10: 8653 } },
  { date: '2026-05-06', responsable: 'Bauman D.', lv: { t12: 2471, t13: 3122, t14: 6761, t15: 938, t8: 1442, t9: 5963, t10: -599 }, fin_liters: { t12: 2471, t13: 3122, t14: 6761, t15: 938, t8: 1442, t9: 5963, t10: -599 } },
  { date: '2026-05-05', responsable: 'Céspedes D.', lv: { t12: 8815, t13: 875, t14: 11694, t15: 999, t8: 1442, t9: 0, t10: 0 }, fin_liters: { t12: 22813, t13: 6709, t14: 7960, t15: 5700, t8: 451, t9: 806, t10: 185 } }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  {activeTab === 'descarga' && (
    <div className="bg-white p-6 rounded-3xl border shadow-sm max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6 border-b pb-2 text-amber-600 flex items-center gap-2"><Truck size={24} className="mr-2"/> Ingreso de Camión</h2>
      <div className="space-y-3">
        {TANKS_CONFIG.map(t => (
          <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border">
            <div className="w-1/4 font-bold text-slate-600 text-sm">{t.name}</div>
            <input type="number" value={tankReadings[t.id].desc} onChange={(e) => handleTankReadingChange(t.id, 'desc', e.target.value)} className="flex-1 p-2 border border-amber-200 rounded-lg text-center font-bold text-amber-700" placeholder="Litros de descarga" />
          </div>
        ))}
      </div>
      <button onClick={confirmarDescarga} className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg transition-colors">
        <CheckCircle2 size={24}/> SUMAR AL MONITOR
      </button>
    </div>
  )}
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [dailyLogs, setDailyLogs] = useState<any[]>(INITIAL_HISTORY);
  
  const [tankReadings, setTankReadings] = useState<any>(
    TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {})
  );

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const q = query(collection(db, "registros_final"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      if (docs.length > 0) setDailyLogs(docs);
    });
  }, []);

  const handleReading = (tid: string, field: string, val: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tid]: { ...prev[tid], [field]: val } };
      if (field === 'mm') {
        const mm = parseFloat(val);
        const tank = TANKS_CONFIG.find(t => t.id === tid);
        updated[tid].liters = !isNaN(mm) && tank ? Math.round(mm * tank.factor) : 0;
      }
      return updated;
    });
  };

  const confirmarDescarga = async () => {
    const confirmacion = window.confirm("¿Confirmar la descarga de camión? Esto actualizará el stock inmediatamente.");
    if (!confirmacion) return;

    const lastLog = dailyLogs[0];
    const newDoc = {
      date: new Date().toISOString(),
      responsable: "Descarga Camión",
      isDescarga: true,
      tanks: Object.keys(tankReadings).reduce((acc: any, tid) => {
        const descVal = parseFloat(tankReadings[tid].desc) || 0;
        acc[tid] = { inicio: lastLog?.fin_liters?.[tid] || 0, desc: descVal, fin: (lastLog?.fin_liters?.[tid] || 0) + descVal, lv: 0 };
        return acc;
      }, {}),
      fin_liters: Object.keys(tankReadings).reduce((acc: any, tid) => {
        acc[tid] = (lastLog?.fin_liters?.[tid] || 0) + (parseFloat(tankReadings[tid].desc) || 0);
        return acc;
      }, {})
    };

    await setDoc(doc(db, "registros_final", `DESC-${Date.now()}`), newDoc);
    alert("Descarga registrada y monitor actualizado.");
    setTankReadings((p:any) => {
        const reset = {...p};
        Object.keys(reset).forEach(k => reset[k].desc = '');
        return reset;
    });
  };

  const ejecutarCierre = async () => {
    const firma = prompt("Ingrese su firma para el cierre:");
    if (!firma) return;
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      responsable: firma,
      tanks: Object.keys(tankReadings).reduce((acc: any, tid) => {
        const lastFin = dailyLogs[0]?.fin_liters?.[tid] || 0;
        const desc = parseFloat(tankReadings[tid].desc) || 0;
        const fin = tankReadings[tid].liters;
        acc[tid] = { inicio: lastFin, desc, fin, lv: (lastFin + desc) - fin };
        return acc;
      }, {}),
      fin_liters: Object.keys(tankReadings).reduce((acc: any, tid) => {
        acc[tid] = tankReadings[tid].liters;
        return acc;
      }, {}),
      lv: Object.keys(tankReadings).reduce((acc: any, tid) => {
        const lastFin = dailyLogs[0]?.fin_liters?.[tid] || 0;
        const desc = parseFloat(tankReadings[tid].desc) || 0;
        acc[tid] = (lastFin + desc) - tankReadings[tid].liters;
        return acc;
      }, {})
    };
    await setDoc(doc(db, "registros_final", newLog.date), newLog);
    alert("Cierre guardado en la nube.");
  };

  if (!isAppUnlocked) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[30px] shadow-2xl max-w-sm w-full text-center">
        <img src="/logo.png" className="h-16 mx-auto mb-6" alt="Axion" />
        <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-4 border-2 rounded-xl text-center text-3xl mb-6 font-bold" placeholder="PIN" />
        <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("PIN incorrecto")} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">INGRESAR</button>
      </div>
    </div>
  );

  if (activeSector === null) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-10">
      <h1 className="text-3xl font-bold text-white tracking-tight">SELECCIONE SECTOR</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 w-48 h-48 rounded-[30px] flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Fuel size={60} /> <span className="text-xl font-bold mt-4">PLAYA</span>
        </button>
        <button onClick={() => setActiveSector('spot')} className="bg-orange-500 w-48 h-48 rounded-[30px] flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Coffee size={60} /> <span className="text-xl font-bold mt-4">SPOT!</span>
        </button>
      </div>
    </div>
  );

  if (activeSector === 'spot') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Coffee size={100} className="text-orange-500 mb-8" />
      <h2 className="text-3xl font-bold mb-4">Bienvenidas al Spot!</h2>
      <p className="text-lg text-slate-500 mb-10 max-w-md">Tablero de tareas diarias en construcción.</p>
      <button onClick={() => setActiveSector(null)} className="font-bold text-indigo-600">← VOLVER</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-2 md:p-4 text-[13px]">
      <div className="w-full max-w-6xl bg-white p-2 rounded-xl shadow-sm border mb-4 flex gap-2 flex-wrap items-center">
        {[
          { id: 'varillas', label: 'Varillado', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Descarga', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' },
          { id: 'gerencia', label: 'Gerencia', icon: Lock, color: 'bg-rose-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[90px] py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-3 font-bold text-slate-300 hover:text-red-500">X</button>
      </div>

      <div className="w-full max-w-6xl">
        
        {/* PESTAÑA 1: VARILLADO */}
        {activeTab === 'varillas' && (
          <div className="bg-white p-5 rounded-2xl border shadow-sm max-w-3xl mx-auto animate-in fade-in">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-slate-800">Cierre de Día Anterior</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-2 bg-slate-50 rounded-xl border">
                  <div className="w-1/4 font-bold text-slate-600">{t.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleReading(t.id, 'mm', e.target.value)} className="w-full p-2 border rounded-lg text-center font-bold outline-none focus:border-indigo-500" placeholder="mm" />
                    <div className="w-full p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-center font-bold text-indigo-600">{tankReadings[t.id].liters.toLocaleString()} L</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={ejecutarCierre} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700">
              <Send size={18}/> GUARDAR CIERRE
            </button>
          </div>
        )}

        {/* PESTAÑA 2: DESCARGA */}
        {activeTab === 'descarga' && (
          <div className="bg-white p-5 rounded-2xl border shadow-sm max-w-3xl mx-auto animate-in fade-in">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-amber-600 flex items-center gap-2"><Truck size={20}/> Ingreso de Camión</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-3 bg-amber-50/30 rounded-xl border border-amber-100">
                  <div className="w-1/3 font-bold text-amber-900">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].desc} onChange={(e) => handleReading(t.id, 'desc', e.target.value)} placeholder="0 L" className="flex-1 p-2 border border-amber-200 rounded-lg text-center font-bold text-amber-700 focus:border-amber-500 outline-none" />
                </div>
              ))}
            </div>
            <button onClick={confirmarDescarga} className="w-full mt-6 bg-amber-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-amber-600">
                <CheckCircle2 size={20}/> CONFIRMAR Y ACTUALIZAR
            </button>
          </div>
        )}

        {/* PESTAÑA 3: MONITOR */}
        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white text-center animate-in zoom-in-95">
            <div className="flex flex-wrap justify-center items-end gap-6 md:gap-10 mt-4">
              {TANKS_CONFIG.map(t => {
                const lastLiters = dailyLogs[0]?.fin_liters?.[t.id] || 0;
                const cur = lastLiters + (parseFloat(tankReadings[t.id].desc) || 0);
                const p = Math.min(100, (cur / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-emerald-500 mb-2">{Math.round(p)}%</div>
                    <div className={`w-14 h-40 md:w-16 md:h-48 bg-slate-800 rounded-t-xl rounded-b-md relative overflow-hidden border border-slate-700 flex items-end shadow-inner`}>
                      <div className={`w-full transition-all duration-700 ${t.color}`} style={{ height: `${p}%` }}></div>
                    </div>
                    <span className="mt-3 text-[9px] font-bold text-slate-500 uppercase">{t.name.split(' ')[0]}</span>
                    <span className="text-[11px] font-bold mt-1">{Math.round(cur).toLocaleString()} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: MENSUAL */}
        {activeTab === 'registro' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <span className="font-bold text-slate-700">Planilla Mensual - Mayo 2026</span>
              <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 text-[11px] shadow-sm hover:bg-emerald-700"><Download size={14}/> EXCEL</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 text-slate-500 border-b">
                  <tr>
                    <th className="p-2 border-r font-bold">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-2 text-center border-r font-bold">{t.name} (LV)</th>)}
                    <th className="p-2 font-bold">Resp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {dailyLogs.filter(log => !log.isDescarga).map(log => (
                    <tr key={log.date} className="hover:bg-slate-50">
                      <td className="p-2 border-r font-bold">{log.date.split('T')[0]}</td>
                      {TANKS_CONFIG.map(t => <td key={t.id} className="p-2 border-r text-center font-bold text-indigo-600">{(log.lv?.[t.id] || 0).toLocaleString()}</td>)}
                      <td className="p-2 text-slate-400 font-medium">{log.responsable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: GERENCIA */}
        {activeTab === 'gerencia' && (
          <div className="max-w-md mx-auto animate-in fade-in">
            {!isAdmin ? (
              <div className="bg-white p-8 rounded-2xl border shadow-md text-center">
                <ShieldAlert className="mx-auto mb-4 text-rose-500" size={40} />
                <h3 className="font-bold mb-6 text-lg">Acceso Gerencial</h3>
                <input type="password" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center text-2xl mb-4 font-bold outline-none focus:border-rose-500" placeholder="PIN" />
                <button onClick={() => adminPinInput === '225903' ? setIsAdmin(true) : alert("Error")} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-rose-700">ACCEDER</button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border shadow-md space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                   <h3 className="font-bold text-rose-600 flex items-center gap-2"><Unlock size={18}/> Panel Activo</h3>
                   <button onClick={() => setIsAdmin(false)} className="text-slate-400 hover:text-red-500"><X size={18}/></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button className="p-4 bg-slate-50 border border-dashed rounded-xl hover:bg-indigo-50 flex flex-col items-center gap-2 transition-colors">
                      <Calculator size={24} className="text-indigo-400" />
                      <span className="font-bold text-slate-600 text-[11px]">Planificar Pedido</span>
                   </button>
                   <button className="p-4 bg-slate-50 border border-dashed rounded-xl hover:bg-amber-50 flex flex-col items-center gap-2 transition-colors">
                      <Edit3 size={24} className="text-amber-400" />
                      <span className="font-bold text-slate-600 text-[11px]">Editar Historial</span>
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}