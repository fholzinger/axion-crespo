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
// 1. CONFIGURACIÓN Y TABLAS
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCAUGdQVkpbRK0udGv8iHAN-9Qf3GEDBWw",
  authDomain: "axion-crespo.firebaseapp.com",
  projectId: "axion-crespo",
  storageBucket: "axion-crespo.firebasestorage.app",
  messagingSenderId: "1023938369376",
  appId: "1:1023938369376:web:917b29b40e4062d2ebf005",
  measurementId: "G-FL6NX8KKCF"
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

const CAMIONES_CONFIG = {
  estandar: [{ id: 'C1', max: 8000 }, { id: 'C2', max: 8000 }, { id: 'C3', max: 6000 }, { id: 'C4', max: 6000 }, { id: 'C5', max: 6000 }, { id: 'C6', max: 6000 }, { id: 'C7', max: 8000 }],
  chico: [{ id: 'C1', max: 8000 }, { id: 'C2', max: 7000 }, { id: 'C3', max: 5900 }, { id: 'C4', max: 4900 }, { id: 'C5', max: 6000 }, { id: 'C6', max: 7900 }]
};

// DATOS HISTÓRICOS CARGADOS (PARA NO EMPEZAR EN CERO)
const INITIAL_DATA = [
  { id: 1714780800000, date: '2026-05-04', responsable: 'Céspedes D.', tanks: { t12: { inicio: 7690, desc: 23938, fin: 22813, lv: 8815 }, t13: { inicio: 2528, desc: 5056, fin: 6709, lv: 875 }, t14: { inicio: 9244, desc: 10410, fin: 7960, lv: 11694 }, t15: { inicio: 1468, desc: 5231, fin: 5700, lv: 999 }, t8: { inicio: 1893, desc: 0, fin: 451, lv: 1442 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 185, desc: 0, fin: 185, lv: 0 } } }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));
  const [dailyLogs, setDailyLogs] = useState<any[]>(INITIAL_DATA);
  const [selectedTruck, setSelectedTruck] = useState<'estandar' | 'chico'>('estandar');
  const [tankOrders, setTankOrders] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: []}), {}));

  // SINCRONIZACIÓN CON FIREBASE
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onSnapshot(collection(db, "registros_playa"), (snap) => {
      const docs = snap.docs.map(d => d.data());
      if (docs.length > 0) setDailyLogs(docs.sort((a:any, b:any) => b.date.localeCompare(a.date)));
    });
    return () => unsub();
  }, []);

  const handleTankReadingChange = (tankId: string, value: string) => {
    const mmVal = parseFloat(value);
    const match = tankId.match(/T\d+/i);
    const id = match ? match[0].toUpperCase() as keyof typeof TANK_AFORO : null;
    let liters = 0;
    if (id && TANK_AFORO[id] && !isNaN(mmVal)) {
      const p1 = TANK_AFORO[id][0]; const p2 = TANK_AFORO[id][1];
      liters = Math.round(p1.liters + ((mmVal - p1.mm) / (p2.mm - p1.mm)) * (p2.liters - p1.liters));
    }
    setTankReadings((prev: any) => ({ ...prev, [tankId]: { ...prev[tankId], mm: value, liters } }));
  };

  const ejecutarCierre = async () => {
    const responsable = prompt("Ingrese su firma (Responsable):");
    if (!responsable) return;
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      responsable,
      tanks: Object.keys(tankReadings).reduce((acc:any, tid) => {
        const lastFin = dailyLogs[0]?.tanks[tid]?.fin || 0;
        acc[tid] = { inicio: lastFin, desc: parseFloat(tankReadings[tid].desc) || 0, fin: tankReadings[tid].liters, lv: (lastFin + (parseFloat(tankReadings[tid].desc) || 0)) - tankReadings[tid].liters };
        return acc;
      }, {})
    };
    await setDoc(doc(db, "registros_playa", newLog.id.toString()), newLog);
    alert("Planilla guardada en la nube con éxito.");
    setTankReadings(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));
  };

  if (!isAppUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center">
          <img src="/logo.png" alt="Axion" className="h-16 mx-auto mb-8" />
          <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-5 border-2 rounded-3xl text-center text-4xl mb-6 font-black" placeholder="****" />
          <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("PIN incorrecto")} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl">ENTRAR</button>
        </div>
      </div>
    );
  }

  if (activeSector === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-white mb-16">SELECCIONE SECTOR</h1>
        <div className="flex flex-col md:flex-row gap-10">
          <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 p-12 rounded-[50px] w-80 h-80 flex flex-col items-center justify-center gap-6 shadow-2xl hover:scale-105 transition-transform text-white">
            <Fuel size={120} /> <span className="text-4xl font-black">PLAYA</span>
          </button>
          <button onClick={() => setActiveSector('spot')} className="bg-orange-500 p-12 rounded-[50px] w-80 h-80 flex flex-col items-center justify-center gap-6 shadow-2xl hover:scale-105 transition-transform text-white">
            <Coffee size={120} /> <span className="text-4xl font-black">SPOT!</span>
          </button>
        </div>
      </div>
    );
  }

  if (activeSector === 'spot') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Coffee size={100} className="text-orange-500 mb-6" />
        <h2 className="text-4xl font-black mb-4">Módulo Spot!</h2>
        <p className="text-xl text-slate-500 mb-10">Hola Tatiana, Fiorella y Cintia. Tablero en configuración.</p>
        <button onClick={() => setActiveSector(null)} className="font-bold text-indigo-600">← VOLVER</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      <div className="max-w-7xl w-full bg-white p-3 rounded-[35px] shadow-sm border mb-8 flex gap-3 flex-wrap lg:flex-nowrap">
        {[
          { id: 'varillas', label: 'Varillado', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Descarga', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' },
          { id: 'gerencia', label: 'Gerencia', icon: Lock, color: 'bg-rose-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-4 rounded-3xl font-black flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-xl scale-105` : 'text-slate-400 hover:bg-slate-100'}`}>
            <tab.icon size={24} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl w-full">
        {activeTab === 'varillas' && (
          <div className="bg-white p-10 rounded-[50px] shadow-sm border max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-slate-800 mb-10 border-b pb-6">Cierre Matutino</h2>
            <div className="space-y-6">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="p-8 bg-slate-50 rounded-[35px] border flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-1/4 font-black text-slate-700 text-2xl">{t.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 text-center mb-2">Varilla (mm)</label>
                      <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleTankReadingChange(t.id, e.target.value)} className="w-full p-5 border-2 rounded-3xl text-center text-3xl font-black text-indigo-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 text-center mb-2">Litros</label>
                      <input type="number" value={tankReadings[t.id].liters} readOnly className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl text-center text-3xl font-black text-indigo-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={ejecutarCierre} className="w-full mt-12 bg-indigo-600 text-white font-black py-7 rounded-[35px] text-3xl shadow-2xl hover:bg-indigo-700 transition-all">REGISTRAR PLANILLA</button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-12 rounded-[60px] shadow-2xl text-white text-center">
            <h2 className="text-4xl font-black mb-20 text-emerald-400">MONITOR DE VOLUMEN</h2>
            <div className="flex flex-wrap justify-center items-end gap-16">
              {TANKS_CONFIG.map(t => {
                const liters = tankReadings[t.id].liters || dailyLogs[0]?.tanks[t.id]?.fin || 0;
                const perc = Math.min(100, (liters / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-lg font-black text-emerald-500 mb-4">{Math.round(perc)}%</div>
                    <div className="w-28 h-80 bg-slate-800 rounded-t-[40px] rounded-b-2xl relative overflow-hidden border-2 border-slate-700 flex items-end">
                      <div className={`w-full transition-all duration-1000 ${t.color}`} style={{ height: `${perc}%` }} />
                    </div>
                    <span className="mt-8 text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.name}</span>
                    <span className="text-2xl font-black mt-2">{Math.round(liters).toLocaleString()} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border">
            <div className="flex justify-between items-center mb-10 border-b pb-6">
              <h2 className="text-3xl font-black text-slate-800">Planilla Mensual</h2>
              <button className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3"><Download size={20}/> EXPORTAR</button>
            </div>
            <div className="overflow-x-auto rounded-3xl border">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-5 font-black">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-5 text-center font-black border-l">{t.name} (LV)</th>)}
                    <th className="p-5 font-black border-l">Resp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailyLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-black">{log.date}</td>
                      {TANKS_CONFIG.map(t => <td key={t.id} className="p-5 border-l text-center font-black text-indigo-600">{Math.round(log.tanks[t.id].lv).toLocaleString()} L</td>)}
                      <td className="p-5 border-l font-bold text-slate-500">{log.responsable}</td>
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