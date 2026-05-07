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
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

// ==========================================
// CONFIGURACIÓN Y DATOS DE AFORO
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

const TANK_AFORO = {
  'T15': [{ mm: 211, liters: 1004 }, { mm: 2264, liters: 20880 }],
  'T14': [{ mm: 211, liters: 1004 }, { mm: 2264, liters: 20880 }],
  'T13': [{ mm: 212, liters: 2007 }, { mm: 2264, liters: 41562 }],
  'T12': [{ mm: 212, liters: 2007 }, { mm: 2264, liters: 41562 }],
  'T10': [{ mm: 190, liters: 400 }, { mm: 2088, liters: 10000 }],
  'T9': [{ mm: 190, liters: 400 }, { mm: 2088, liters: 10000 }],
  'T8': [{ mm: 135, liters: 400 }, { mm: 1837, liters: 10000 }]
};

const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 39000, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 39000, color: 'bg-sky-400', fuel: 'super' },
  { id: 't14', name: 'T14 (Quantium D)', maxLiters: 19000, color: 'bg-slate-400', fuel: 'quantium_diesel' },
  { id: 't15', name: 'T15 (Quantium N)', maxLiters: 19000, color: 'bg-violet-400', fuel: 'quantium_nafta' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 9500, color: 'bg-sky-400', fuel: 'super' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 9500, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't10', name: 'T10 (Quantium D)', maxLiters: 9500, color: 'bg-slate-400', fuel: 'quantium_diesel' }
];

// Datos históricos para que la planilla no aparezca vacía
const HISTORIAL_EXCEL = [
  { id: 1714780800000, date: '2026-05-04', responsable: 'Céspedes D.', tanks: { t12: { inicio: 7690, desc: 23938, fin: 22813, lv: 8815 }, t13: { inicio: 2528, desc: 5056, fin: 6709, lv: 875 }, t14: { inicio: 9244, desc: 10410, fin: 7960, lv: 11694 }, t15: { inicio: 1468, desc: 5231, fin: 5700, lv: 999 }, t8: { inicio: 1893, desc: 0, fin: 451, lv: 1442 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 185, desc: 0, fin: 185, lv: 0 } } }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));
  const [dailyLogs, setDailyLogs] = useState<any[]>(HISTORIAL_EXCEL);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onSnapshot(collection(db, "registros_v4"), (snap) => {
      const docs = snap.docs.map(d => d.data());
      if (docs.length > 0) setDailyLogs([...HISTORIAL_EXCEL, ...docs].sort((a:any, b:any) => b.date.localeCompare(a.date)));
    });
    return () => unsub();
  }, []);

  const handleReading = (tid: string, field: string, val: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tid]: { ...prev[tid], [field]: val } };
      if (field === 'mm') {
        const mm = parseFloat(val);
        const match = tid.match(/T\d+/i);
        const id = match ? match[0].toUpperCase() as keyof typeof TANK_AFORO : null;
        if (id && TANK_AFORO[id] && !isNaN(mm)) {
          const p1 = TANK_AFORO[id][0]; const p2 = TANK_AFORO[id][1];
          updated[tid].liters = Math.round(p1.liters + ((mm - p1.mm) / (p2.mm - p1.mm)) * (p2.liters - p1.liters));
        }
      }
      return updated;
    });
  };

  if (!isAppUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <img src="/logo.png" alt="Axion" className="h-16 mx-auto mb-6" />
          <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-4 border rounded-xl text-center text-2xl mb-4 font-bold" placeholder="PIN" />
          <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("Error")} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">INGRESAR</button>
        </div>
      </div>
    );
  }

  if (activeSector === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-white mb-12">SELECCIONE SECTOR</h1>
        <div className="flex gap-8">
          <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 p-10 rounded-3xl w-64 h-64 flex flex-col items-center justify-center gap-4 shadow-2xl hover:scale-105 transition-transform text-white">
            <Fuel size={80} /> <span className="text-2xl font-bold">PLAYA</span>
          </button>
          <button onClick={() => setActiveSector('spot')} className="bg-orange-500 p-10 rounded-3xl w-64 h-64 flex flex-col items-center justify-center gap-4 shadow-2xl hover:scale-105 transition-transform text-white">
            <Coffee size={80} /> <span className="text-2xl font-bold">SPOT!</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-6 font-sans">
      <div className="max-w-7xl w-full bg-white p-2 rounded-2xl shadow-sm border mb-6 flex gap-2 flex-wrap lg:flex-nowrap">
        {[
          { id: 'varillas', label: 'Varillado', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Descarga', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-4 font-bold text-slate-300">SALIR</button>
      </div>

      <div className="max-w-7xl w-full">
        {activeTab === 'varillas' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Cierre de Día Anterior</h2>
            <div className="space-y-3">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border flex items-center gap-4">
                  <div className="w-1/4 font-bold text-slate-600 text-sm">{t.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleReading(t.id, 'mm', e.target.value)} className="w-full p-2 border rounded-lg text-center font-bold" placeholder="mm" />
                    <input type="number" value={tankReadings[t.id].liters} readOnly className="w-full p-2 bg-indigo-50 border-indigo-100 rounded-lg text-center font-bold text-indigo-600" placeholder="Litros" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => alert("Guardado")} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg">REGISTRAR PLANILLA</button>
          </div>
        )}

        {activeTab === 'descarga' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2"><Truck size={24} className="text-amber-500" /> Carga de Camión</h2>
            <div className="space-y-3">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border flex items-center gap-4">
                  <div className="w-1/4 font-bold text-slate-600 text-sm">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].desc} onChange={(e) => handleReading(t.id, 'desc', e.target.value)} className="flex-1 p-2 border border-amber-200 rounded-lg text-center font-bold text-amber-700" placeholder="Litros de descarga" />
                </div>
              ))}
            </div>
            <button onClick={() => alert("Stock Actualizado")} className="w-full mt-6 bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg">SUMAR AL MONITOR</button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white text-center">
            <h2 className="text-2xl font-bold mb-12 text-emerald-400">ESTADO DE TANQUES</h2>
            <div className="flex flex-wrap justify-center items-end gap-8">
              {TANKS_CONFIG.map(t => {
                const liters = (parseFloat(tankReadings[t.id].liters) || 0) + (parseFloat(tankReadings[t.id].desc) || 0);
                const perc = Math.min(100, (liters / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-xs font-bold text-emerald-500 mb-2">{Math.round(perc)}%</div>
                    <div className="w-16 h-48 bg-slate-800 rounded-t-2xl rounded-b-lg relative overflow-hidden border border-slate-700 flex items-end">
                      <div className={`w-full transition-all duration-1000 ${t.color}`} style={{ height: `${perc}%` }} />
                    </div>
                    <span className="mt-4 text-[10px] font-bold text-slate-500 uppercase">{t.name.split(' ')[0]}</span>
                    <span className="text-sm font-bold mt-1">{Math.round(liters).toLocaleString()} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex justify-between items-center">Planilla Mensual <button className="bg-emerald-600 text-white px-4 py-1 rounded-lg text-sm"><Download size={14} className="inline mr-1"/> EXCEL</button></h2>
            <div className="overflow-x-auto rounded-xl border text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 font-bold">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-3 text-center border-l font-bold">{t.name} (LV)</th>)}
                    <th className="p-3 font-bold border-l">Resp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailyLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold">{log.date}</td>
                      {TANKS_CONFIG.map(t => <td key={t.id} className="p-3 border-l text-center text-indigo-600 font-bold">{log.tanks[t.id].lv.toLocaleString()} L</td>)}
                      <td className="p-3 border-l font-medium text-slate-500">{log.responsable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}