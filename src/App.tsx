import React, { useState, useMemo, useEffect } from 'react';
import { 
  Fuel, Coffee, CircleDollarSign, Droplets, PlusCircle, Clock, FileText, 
  Trash2, ClipboardList, Database, Ruler, AlertTriangle, ArrowRight, 
  Send, CalendarDays, Truck, CheckCircle2, Save, User, X, Lock, 
  Unlock, Download, ShieldAlert, Key, Info, PackagePlus, Calendar, 
  Loader2, Calculator, History, Edit3, ChevronRight 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch, getDocs, query, orderBy } from 'firebase/firestore';

// ==========================================
// 1. TABLAS DE AFORO (PRECISIÓN TK 40M3)
// ==========================================
const TANK_AFORO = {
  'T12': [{ mm: 212, liters: 2007 }, { mm: 2264, liters: 41562 }],
  'T13': [{ mm: 212, liters: 2007 }, { mm: 2264, liters: 41562 }],
  'T14': [{ mm: 211, liters: 1004 }, { mm: 2264, liters: 20880 }],
  'T15': [{ mm: 211, liters: 1004 }, { mm: 2264, liters: 20880 }],
  'T8': [{ mm: 135, liters: 400 }, { mm: 1837, liters: 10000 }],
  'T9': [{ mm: 190, liters: 400 }, { mm: 2088, liters: 10000 }],
  'T10': [{ mm: 190, liters: 400 }, { mm: 2088, liters: 10000 }]
};

const calcularLitros = (tankId: string, mm: number): number => {
  const match = tankId.match(/T\d+/i);
  if (!match) return 0;
  const idLimpio = match[0].toUpperCase() as keyof typeof TANK_AFORO;
  const table = TANK_AFORO[idLimpio];
  if (!table || isNaN(mm)) return 0;
  const p1 = table[0]; const p2 = table[1];
  if (mm <= p1.mm) return Math.round((mm / p1.mm) * p1.liters);
  const fraction = (mm - p1.mm) / (p2.mm - p1.mm);
  return Math.round(p1.liters + fraction * (p2.liters - p1.liters));
};

// ==========================================
// 2. CONFIGURACIÓN Y DATOS DE MAYO (EXCEL)
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
const auth = getAuth(app);
const db = getFirestore(app);

const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 39000, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 39000, color: 'bg-sky-400', fuel: 'super' },
  { id: 't14', name: 'T14 (Q. Diesel)', maxLiters: 19000, color: 'bg-slate-400', fuel: 'quantium_diesel' },
  { id: 't15', name: 'T15 (Q. Nafta)', maxLiters: 19000, color: 'bg-violet-400', fuel: 'quantium_nafta' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 9500, color: 'bg-sky-400', fuel: 'super' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 9500, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't10', name: 'T10 (Q. Diesel)', maxLiters: 9500, color: 'bg-slate-400', fuel: 'quantium_diesel' }
];

const HISTORIAL_MAYO = [
  { date: '2026-05-07', responsable: 'Bauman D.', tanks: { t12: { lv: 3099 }, t13: { lv: 4614 }, t14: { lv: 3060 }, t15: { lv: 9092 }, t8: { lv: 8271 }, t9: { lv: 2873 }, t10: { lv: 8653 } }, fin_liters: { t12: 3099, t13: 4614, t14: 3060, t15: 9092, t8: 8271, t9: 2873, t10: 8653 } },
  { date: '2026-05-06', responsable: 'Bauman D.', tanks: { t12: { lv: 2471 }, t13: { lv: 3122 }, t14: { lv: 6761 }, t15: { lv: 938 }, t8: { lv: 1442 }, t9: { lv: 5963 }, t10: { lv: -599 } } },
  { date: '2026-05-05', responsable: 'Céspedes D.', tanks: { t12: { lv: 8815 }, t13: { lv: 875 }, t14: { lv: 11694 }, t15: { lv: 999 }, t8: { lv: 1442 }, t9: { lv: 0 }, t10: { lv: 0 } } },
  { date: '2026-05-04', responsable: 'Zingraf L.', tanks: { t12: { lv: 2802 }, t13: { lv: -655 }, t14: { lv: 577 }, t15: { lv: 925 }, t8: { lv: 3342 }, t9: { lv: 7 }, t10: { lv: 1345 } } }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [adminPinInput, setAdminPinInput] = useState('');
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));
  const [dailyLogs, setDailyLogs] = useState<any[]>(HISTORIAL_MAYO);

  useEffect(() => {
    signInAnonymously(auth);
    const q = query(collection(db, "registros_v8"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      if (docs.length > 0) setDailyLogs(docs);
    });
  }, []);

  const handleReading = (tid: string, field: string, val: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tid]: { ...prev[tid], [field]: val } };
      if (field === 'mm') updated[tid].liters = calcularLitros(tid, parseFloat(val));
      return updated;
    });
  };

  const ejecutarCierre = async () => {
    const firma = prompt("Ingrese su firma para el cierre:");
    if (!firma) return;
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      responsable: firma,
      tanks: Object.keys(tankReadings).reduce((acc: any, tid) => {
        const lastFin = dailyLogs[0]?.fin_liters?.[tid] || dailyLogs[0]?.tanks?.[tid]?.fin || 0;
        const desc = parseFloat(tankReadings[tid].desc) || 0;
        const fin = tankReadings[tid].liters;
        acc[tid] = { inicio: lastFin, desc, fin, lv: (lastFin + desc) - fin };
        return acc;
      }, {}),
      fin_liters: Object.keys(tankReadings).reduce((acc: any, tid) => {
        acc[tid] = tankReadings[tid].liters;
        return acc;
      }, {})
    };
    await setDoc(doc(db, "registros_v8", newLog.date), newLog);
    alert("Cierre guardado en la nube.");
  };

  if (!isAppUnlocked) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[35px] shadow-2xl max-w-sm w-full text-center">
        <img src="/logo.png" className="h-16 mx-auto mb-6" alt="Axion" />
        <h2 className="text-xl font-bold mb-6 text-slate-800 tracking-tight">Acceso Axion Crespo</h2>
        <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-3xl mb-6 font-bold focus:border-indigo-500 outline-none" placeholder="PIN" />
        <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("PIN incorrecto")} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700">INGRESAR</button>
      </div>
    </div>
  );

  if (activeSector === null) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-10">
      <h1 className="text-3xl font-bold text-white tracking-tight">SELECCIONE SECTOR</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 w-56 h-56 rounded-[40px] flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Fuel size={70} /> <span className="text-2xl font-bold mt-4 tracking-wider">PLAYA</span>
        </button>
        <button onClick={() => setActiveSector('spot')} className="bg-orange-500 w-56 h-56 rounded-[40px] flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Coffee size={70} /> <span className="text-2xl font-bold mt-4 tracking-wider">SPOT!</span>
        </button>
      </div>
    </div>
  );

  if (activeSector === 'spot') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Coffee size={100} className="text-orange-500 mb-8" />
      <h2 className="text-4xl font-bold mb-4">Bienvenidas al Spot!</h2>
      <p className="text-xl text-slate-500 mb-10 max-w-md leading-relaxed">Hola Tatiana, Fiorella y Cintia. Estamos preparando su tablero de tareas diarias.</p>
      <button onClick={() => setActiveSector(null)} className="font-bold text-indigo-600 text-lg hover:underline">← VOLVER AL INICIO</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-2 md:p-6 font-sans text-[13px]">
      <div className="w-full max-w-7xl bg-white p-2 rounded-2xl shadow-sm border mb-6 flex gap-2 flex-wrap items-center">
        {[
          { id: 'varillas', label: 'Varillado', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Descarga', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' },
          { id: 'gerencia', label: 'Gerencia', icon: Lock, color: 'bg-rose-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-md scale-105` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={18} /> <span>{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-4 font-bold text-slate-300 hover:text-red-500">SALIR</button>
      </div>

      <div className="w-full max-w-7xl">
        {activeTab === 'varillas' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm max-w-4xl mx-auto animate-in fade-in">
            <h2 className="text-xl font-bold mb-6 border-b pb-2 text-slate-800">Cierre de Día Anterior (Automático)</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border hover:border-indigo-200 transition-colors">
                  <div className="w-1/4 font-bold text-slate-600">{t.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 text-center">Varilla (mm)</label>
                      <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleReading(t.id, 'mm', e.target.value)} className="w-full p-2 border-2 rounded-xl text-center font-bold text-lg outline-none focus:border-indigo-500" placeholder="mm" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 text-center">Litros</label>
                      <div className="w-full p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center font-bold text-indigo-600 text-lg">{tankReadings[t.id].liters.toLocaleString()} L</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={ejecutarCierre} className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Send size={20}/> REGISTRAR PLANILLA DE CIERRE
            </button>
          </div>
        )}

        {activeTab === 'descarga' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm max-w-4xl mx-auto animate-in fade-in">
            <h2 className="text-xl font-bold mb-6 border-b pb-2 text-amber-600 flex items-center gap-3"><Truck /> Ingreso de Camión</h2>
            <div className="space-y-2">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                  <div className="w-1/3 font-bold text-amber-900">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].desc} onChange={(e) => handleReading(t.id, 'desc', e.target.value)} placeholder="Ingrese litros de descarga" className="flex-1 p-3 border-2 border-amber-200 rounded-xl text-center font-bold text-amber-700 focus:border-amber-500 outline-none shadow-inner" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white text-center animate-in zoom-in-95">
            <h2 className="text-2xl font-bold mb-16 text-emerald-400 flex items-center justify-center gap-4"><Database /> ESTADO DE TANQUES EN TIEMPO REAL</h2>
            <div className="flex flex-wrap justify-center items-end gap-10">
              {TANKS_CONFIG.map(t => {
                const lastLiters = dailyLogs[0]?.fin_liters?.[t.id] || 0;
                const descLiters = parseFloat(tankReadings[t.id].desc) || 0;
                const cur = lastLiters + descLiters;
                const p = Math.min(100, (cur / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center group">
                    <div className="text-[11px] font-bold text-emerald-500 mb-3 group-hover:scale-125 transition-transform">{Math.round(p)}%</div>
                    <div className={`w-20 h-56 bg-slate-800 rounded-t-[20px] rounded-b-lg relative overflow-hidden border-2 border-slate-700 flex items-end shadow-inner`}>
                      <div className={`w-full transition-all duration-1000 ${t.color} relative`} style={{ height: `${p}%` }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                      </div>
                    </div>
                    <span className="mt-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.name.split(' ')[0]}</span>
                    <span className="text-sm font-black mt-1">{Math.round(cur).toLocaleString()} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <span className="font-bold text-slate-700">Planilla Mensual - Mayo 2026</span>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-emerald-700"><Download size={16}/> EXPORTAR EXCEL</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 border-b">
                    <th className="p-3 border-r font-bold sticky left-0 bg-slate-100">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-3 text-center border-r font-bold">{t.name} (LV)</th>)}
                    <th className="p-3 font-bold">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {dailyLogs.map(log => (
                    <tr key={log.date} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 border-r font-bold sticky left-0 bg-white">{log.date}</td>
                      {TANKS_CONFIG.map(t => {
                         const valor = log.tanks?.[t.id]?.lv || log.lv?.[t.id] || 0;
                         return <td key={t.id} className="p-3 border-r text-center font-bold text-indigo-600">{valor.toLocaleString()} L</td>;
                      })}
                      <td className="p-3 text-slate-400 font-medium">{log.responsable || log.resp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gerencia' && (
          <div className="max-w-xl mx-auto animate-in fade-in">
            {!isAdmin ? (
              <div className="bg-white p-10 rounded-[35px] border shadow-xl text-center">
                <ShieldAlert className="mx-auto mb-6 text-rose-500" size={40} />
                <h3 className="text-xl font-bold mb-6">Panel de Control Gerencial</h3>
                <input type="password" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-3xl mb-6 font-bold" placeholder="PIN ADMIN" />
                <button onClick={() => adminPinInput === '225903' ? setIsAdmin(true) : alert("Error")} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">ACCEDER AL PANEL</button>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[35px] border shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                   <h3 className="font-bold text-rose-600 text-lg flex items-center gap-3"><Unlock /> Panel Administrativo Activo</h3>
                   <button onClick={() => setIsAdmin(false)} className="text-slate-400 hover:text-red-500"><X /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <button className="p-6 bg-slate-50 border-2 border-dashed rounded-3xl hover:bg-indigo-50 flex flex-col items-center gap-3 transition-colors group">
                      <Calculator size={30} className="text-indigo-400 group-hover:text-indigo-600" />
                      <span className="font-bold text-slate-600">Planificar Pedido</span>
                   </button>
                   <button className="p-6 bg-slate-50 border-2 border-dashed rounded-3xl hover:bg-amber-50 flex flex-col items-center gap-3 transition-colors group">
                      <Edit3 size={30} className="text-amber-400 group-hover:text-amber-600" />
                      <span className="font-bold text-slate-600">Corregir Cierres</span>
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