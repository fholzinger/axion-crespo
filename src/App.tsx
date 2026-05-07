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
  'T15': [{ mm: 211, liters: 1004 }, { mm: 2264, liters: 20880 }],
  'T14': [{ mm: 211, liters: 1004 }, { mm: 2264, liters: 20880 }],
  'T13': [{ mm: 212, liters: 2007 }, { mm: 2264, liters: 41562 }],
  'T12': [{ mm: 212, liters: 2007 }, { mm: 2264, liters: 41562 }],
  'T10': [{ mm: 190, liters: 400 }, { mm: 2088, liters: 10000 }],
  'T9': [{ mm: 190, liters: 400 }, { mm: 2088, liters: 10000 }],
  'T8': [{ mm: 135, liters: 400 }, { mm: 1837, liters: 10000 }]
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
// 2. CONFIGURACIÓN Y DATOS DE MAYO
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
  { id: 1715040000000, date: '2026-05-07', responsable: 'Bauman D.', tanks: { t12: { inicio: 6198, desc: 0, fin: 3099, lv: 3099 }, t13: { inicio: 9228, desc: 0, fin: 4614, lv: 4614 }, t14: { inicio: 6120, desc: 0, fin: 3060, lv: 3060 }, t15: { inicio: 18184, desc: 0, fin: 9092, lv: 9092 }, t8: { inicio: 16542, desc: 0, fin: 8271, lv: 8271 }, t9: { inicio: 5746, desc: 0, fin: 2873, lv: 2873 }, t10: { inicio: 17306, desc: 0, fin: 8653, lv: 8653 } } },
  { id: 1714780800000, date: '2026-05-04', responsable: 'Céspedes D.', tanks: { t12: { inicio: 7690, desc: 23938, fin: 22813, lv: 8815 }, t13: { inicio: 2528, desc: 5056, fin: 6709, lv: 875 }, t14: { inicio: 9244, desc: 10410, fin: 7960, lv: 11694 }, t15: { inicio: 1468, desc: 5231, fin: 5700, lv: 999 }, t8: { inicio: 1893, desc: 0, fin: 451, lv: 1442 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 185, desc: 0, fin: 185, lv: 0 } } }
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
    const q = query(collection(db, "registros_v7"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      setDailyLogs(docs.length > 0 ? docs : HISTORIAL_MAYO);
    });
  }, []);

  const handleReading = (tid: string, field: string, val: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tid]: { ...prev[tid], [field]: val } };
      if (field === 'mm') updated[tid].liters = calcularLitros(tid, parseFloat(val));
      return updated;
    });
  };

  const saveCierre = async () => {
    const resp = prompt("Firma del Responsable:");
    if (!resp) return;
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      responsable: resp,
      tanks: Object.keys(tankReadings).reduce((acc: any, tid) => {
        const lastFin = dailyLogs[0]?.tanks[tid]?.fin || 0;
        const desc = parseFloat(tankReadings[tid].desc) || 0;
        acc[tid] = { inicio: lastFin, desc, fin: tankReadings[tid].liters, lv: (lastFin + desc) - tankReadings[tid].liters };
        return acc;
      }, {})
    };
    await setDoc(doc(db, "registros_v7", newLog.id.toString()), newLog);
    alert("Cierre sincronizado.");
  };

  if (!isAppUnlocked) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs text-center">
        <img src="/logo.png" className="h-10 mx-auto mb-6" alt="Axion" />
        <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center text-3xl mb-4 font-bold" placeholder="PIN" />
        <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("Error")} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">ENTRAR</button>
      </div>
    </div>
  );

  if (activeSector === null) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center gap-6">
      <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 w-44 h-44 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
        <Fuel size={60} /> <span className="text-xl font-bold mt-2">PLAYA</span>
      </button>
      <button onClick={() => setActiveSector('spot')} className="bg-orange-500 w-44 h-44 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
        <Coffee size={60} /> <span className="text-xl font-bold mt-2">SPOT!</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-2 md:p-4 text-[13px]">
      <div className="w-full max-w-6xl bg-white p-1 rounded-xl shadow-sm border mb-4 flex gap-1 items-center">
        {[
          { id: 'varillas', label: 'Varilla', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Camión', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' },
          { id: 'gerencia', label: 'Gerencia', icon: Lock, color: 'bg-rose-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-2 ${activeTab === tab.id ? `${tab.color} text-white` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={16} /> <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-3 text-slate-300 font-bold hover:text-red-500">X</button>
      </div>

      <div className="w-full max-w-6xl">
        {activeTab === 'varillas' && (
          <div className="bg-white p-4 rounded-xl border shadow-sm max-w-2xl mx-auto">
            <h2 className="font-bold mb-4 border-b pb-1 text-slate-700 uppercase text-[11px]">Cierre de Día Anterior</h2>
            <div className="space-y-1">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                  <div className="w-32 font-bold text-slate-500">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleReading(t.id, 'mm', e.target.value)} placeholder="mm" className="w-24 p-1 border rounded text-center font-bold" />
                  <div className="flex-1 bg-white p-1 rounded text-center font-bold text-indigo-600 border border-indigo-100">{tankReadings[t.id].