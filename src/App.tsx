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
// TABLAS DE AFORO OFICIALES (CALIBRACIÓN)
// ==========================================
const TANK_AFORO = {
  'T15': [{ mm: 211, liters: 1004 }, { mm: 342, liters: 2006 }, { mm: 454, liters: 3004 }, { mm: 556, liters: 4000 }, { mm: 653, liters: 5008 }, { mm: 745, liters: 6008 }, { mm: 834, liters: 7007 }, { mm: 921, liters: 8007 }, { mm: 1007, liters: 9010 }, { mm: 1092, liters: 10010 }, { mm: 1176, liters: 11000 }, { mm: 1261, liters: 12000 }, { mm: 1347, liters: 13001 }, { mm: 1435, liters: 14009 }, { mm: 1524, liters: 15005 }, { mm: 1616, liters: 16000 }, { mm: 1713, liters: 17001 }, { mm: 1817, liters: 18007 }, { mm: 1931, liters: 19007 }, { mm: 2065, liters: 20003 }, { mm: 2264, liters: 20880 }],
  'T14': [{ mm: 211, liters: 1004 }, { mm: 342, liters: 2006 }, { mm: 454, liters: 3004 }, { mm: 556, liters: 4000 }, { mm: 653, liters: 5008 }, { mm: 745, liters: 6008 }, { mm: 834, liters: 7007 }, { mm: 921, liters: 8007 }, { mm: 1007, liters: 9010 }, { mm: 1092, liters: 10010 }, { mm: 1176, liters: 11000 }, { mm: 1261, liters: 12000 }, { mm: 1347, liters: 13001 }, { mm: 1435, liters: 14009 }, { mm: 1524, liters: 15005 }, { mm: 1616, liters: 16000 }, { mm: 1713, liters: 17001 }, { mm: 1817, liters: 18007 }, { mm: 1931, liters: 19007 }, { mm: 2065, liters: 20003 }, { mm: 2264, liters: 20880 }],
  'T13': [{ mm: 212, liters: 2007 }, { mm: 343, liters: 4000 }, { mm: 456, liters: 6006 }, { mm: 559, liters: 8011 }, { mm: 655, liters: 10001 }, { mm: 748, liters: 12017 }, { mm: 837, liters: 14009 }, { mm: 924, liters: 16001 }, { mm: 1010, liters: 18001 }, { mm: 1096, liters: 20017 }, { mm: 1181, liters: 22015 }, { mm: 1266, liters: 24005 }, { mm: 1353, liters: 26022 }, { mm: 1440, liters: 28006 }, { mm: 1530, liters: 30007 }, { mm: 1623, liters: 32005 }, { mm: 1721, liters: 34001 }, { mm: 1825, liters: 36001 }, { mm: 1941, liters: 38005 }, { mm: 2080, liters: 40011 }, { mm: 2171, liters: 41002 }, { mm: 2264, liters: 41562 }],
  'T12': [{ mm: 212, liters: 2007 }, { mm: 343, liters: 4000 }, { mm: 456, liters: 6006 }, { mm: 559, liters: 8011 }, { mm: 655, liters: 10001 }, { mm: 748, liters: 12017 }, { mm: 837, liters: 14009 }, { mm: 924, liters: 16001 }, { mm: 1010, liters: 18001 }, { mm: 1096, liters: 20017 }, { mm: 1181, liters: 22015 }, { mm: 1266, liters: 24005 }, { mm: 1353, liters: 26022 }, { mm: 1440, liters: 28006 }, { mm: 1530, liters: 30007 }, { mm: 1623, liters: 32005 }, { mm: 1721, liters: 34001 }, { mm: 1825, liters: 36001 }, { mm: 1941, liters: 38005 }, { mm: 2080, liters: 40011 }, { mm: 2171, liters: 41002 }, { mm: 2264, liters: 41562 }],
  'T10': [{ mm: 190, liters: 400 }, { mm: 367, liters: 1000 }, { mm: 450, liters: 1400 }, { mm: 586, liters: 2000 }, { mm: 665, liters: 2400 }, { mm: 764, liters: 3000 }, { mm: 850, liters: 3400 }, { mm: 955, liters: 4000 }, { mm: 1020, liters: 4400 }, { mm: 1124, liters: 5000 }, { mm: 1190, liters: 5400 }, { mm: 1286, liters: 6000 }, { mm: 1350, liters: 6400 }, { mm: 1455, liters: 7000 }, { mm: 1525, liters: 7400 }, { mm: 1643, liters: 8000 }, { mm: 1722, liters: 8400 }, { mm: 1847, liters: 9000 }, { mm: 1940, liters: 9400 }, { mm: 2088, liters: 10000 }],
  'T9': [{ mm: 190, liters: 400 }, { mm: 367, liters: 1000 }, { mm: 450, liters: 1400 }, { mm: 586, liters: 2000 }, { mm: 665, liters: 2400 }, { mm: 764, liters: 3000 }, { mm: 850, liters: 3400 }, { mm: 955, liters: 4000 }, { mm: 1020, liters: 4400 }, { mm: 1124, liters: 5000 }, { mm: 1190, liters: 5400 }, { mm: 1286, liters: 6000 }, { mm: 1350, liters: 6400 }, { mm: 1455, liters: 7000 }, { mm: 1525, liters: 7400 }, { mm: 1643, liters: 8000 }, { mm: 1722, liters: 8400 }, { mm: 1847, liters: 9000 }, { mm: 1940, liters: 9400 }, { mm: 2088, liters: 10000 }],
  'T8': [{ mm: 135, liters: 400 }, { mm: 275, liters: 1000 }, { mm: 355, liters: 1400 }, { mm: 463, liters: 2000 }, { mm: 540, liters: 2400 }, { mm: 630, liters: 3000 }, { mm: 695, liters: 3400 }, { mm: 787, liters: 4000 }, { mm: 856, liters: 4400 }, { mm: 941, liters: 5000 }, { mm: 1005, liters: 5400 }, { mm: 1089, liters: 6000 }, { mm: 1155, liters: 6400 }, { mm: 1244, liters: 7000 }, { mm: 1310, liters: 7400 }, { mm: 1410, liters: 8000 }, { mm: 1480, liters: 8400 }, { mm: 1595, liters: 9000 }, { mm: 1680, liters: 9400 }, { mm: 1837, liters: 10000 }]
};

const calcularLitros = (tankId: string, mm: number): number => {
  const match = tankId.match(/T\d+/i);
  if (!match) return 0;
  const idLimpio = match[0].toUpperCase();
  const table = TANK_AFORO[idLimpio as keyof typeof TANK_AFORO];
  if (!table || table.length === 0 || isNaN(mm)) return 0;
  if (mm <= table[0].mm) return (mm / table[0].mm) * table[0].liters;
  if (mm >= table[table.length - 1].mm) return table[table.length - 1].liters;
  for (let i = 0; i < table.length - 1; i++) {
    const p1 = table[i];
    const p2 = table[i + 1];
    if (mm >= p1.mm && mm <= p2.mm) {
      const fraction = (mm - p1.mm) / (p2.mm - p1.mm);
      return Math.round(p1.liters + fraction * (p2.liters - p1.liters));
    }
  }
  return 0;
};

// ==========================================
// CONFIGURACIÓN AXION
// ==========================================
const FUEL_TYPES = {
  super: { id: 'super', name: 'Súper', defaultPrice: 1000, color: 'bg-sky-400' },
  quantium_nafta: { id: 'quantium_nafta', name: 'Quantium N.', defaultPrice: 1200, color: 'bg-violet-400' },
  x10: { id: 'x10', name: 'X10', defaultPrice: 1050, color: 'bg-orange-500' },
  quantium_diesel: { id: 'quantium_diesel', name: 'Quantium D.', defaultPrice: 1250, color: 'bg-slate-400' }
};

const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 39000, diameterMm: 2270, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 39000, diameterMm: 2270, color: 'bg-sky-400', fuel: 'super' },
  { id: 't14', name: 'T14 (Quantium D)', maxLiters: 19000, diameterMm: 2270, color: 'bg-slate-400', fuel: 'quantium_diesel' },
  { id: 't15', name: 'T15 (Quantium N)', maxLiters: 19000, diameterMm: 2270, color: 'bg-violet-400', fuel: 'quantium_nafta' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 9500, diameterMm: 1500, color: 'bg-sky-400', fuel: 'super' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 9500, diameterMm: 1500, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't10', name: 'T10 (Quantium D)', maxLiters: 9500, diameterMm: 1500, color: 'bg-slate-400', fuel: 'quantium_diesel' }
];

const firebaseConfig = {
  apiKey: "AIzaSyCAUGdQVkpbRK0udGv8iHAN-9Qf3GEDBWw",
  authDomain: "axion-crespo.firebaseapp.com",
  projectId: "axion-crespo",
  storageBucket: "axion-crespo.firebasestorage.app",
  messagingSenderId: "1023938369376",
  appId: "1:1023938369376:web:917b29b40e4062d2ebf005"
};

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [appPinInput, setAppPinInput] = useState('');
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0}}), {}));
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  useEffect(() => {
    setTimeout(() => setIsInitializing(false), 2000);
  }, []);

  const handleTankReadingChange = (tankId: string, field: 'mm' | 'liters', value: string) => {
    setTankReadings((prev: any) => {
      const newReadings = { ...prev };
      newReadings[tankId] = { ...newReadings[tankId], [field]: value };
      if (field === 'mm') {
        newReadings[tankId].liters = value === '' ? '' : calcularLitros(tankId, parseFloat(value));
      }
      return newReadings;
    });
  };

  // 1. CARGANDO
  if (isInitializing) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>;
  }

  // 2. PIN DE ACCESO
  if (!isAppUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full">
          <img src="/logo.png" alt="Axion" className="h-24 mb-6" />
          <h2 className="text-2xl font-bold mb-4">Acceso al Sistema</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (appPinInput === '6227') { setIsAppUnlocked(true); } else { alert('Incorrecto'); setAppPinInput(''); } }} className="w-full space-y-4">
            <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center text-2xl outline-none focus:border-indigo-500" placeholder="PIN" />
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // 3. SELECTOR DE SECTOR
  if (activeSector === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-white mb-10">Seleccione Sector</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 p-10 rounded-[40px] text-white font-bold text-3xl flex flex-col items-center gap-6 w-72 shadow-2xl hover:scale-105 transition-transform"><Fuel size={80} /> PLAYA</button>
          <button onClick={() => setActiveSector('spot')} className="bg-orange-500 p-10 rounded-[40px] text-white font-bold text-3xl flex flex-col items-center gap-6 w-72 shadow-2xl hover:scale-105 transition-transform"><Coffee size={80} /> SPOT!</button>
        </div>
      </div>
    );
  }

  // 4. MÓDULO SPOT
  if (activeSector === 'spot') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl border-t-8 border-orange-500 text-center max-w-lg">
          <Coffee size={80} className="text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Bienvenidas al Spot!</h2>
          <p className="text-slate-600 mb-8">Preparando tablero para Tatiana, Fiorella y Cintia.</p>
          <button onClick={() => setActiveSector(null)} className="text-indigo-600 font-bold">← Volver al inicio</button>
        </div>
      </div>
    );
  }

  // 5. MÓDULO PLAYA (Final)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 font-sans">
      <div className="max-w-7xl w-full mb-6 flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <button onClick={() => setActiveTab('varillas')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold ${activeTab === 'varillas' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Ruler size={20}/> 1. Varillado</button>
        <button onClick={() => setActiveTab('monitor')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold ${activeTab === 'monitor' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Database size={20}/> 2. Tanques</button>
        <button onClick={() => setActiveSector(null)} className="px-4 py-3 text-slate-400 font-bold">Salir</button>
      </div>

      <div className="max-w-7xl w-full">
        {activeTab === 'varillas' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 max-w-4xl mx-auto animate-in fade-in">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Cierre (Automático)</h1>
            <div className="space-y-4">
              {TANKS_CONFIG.map(tank => (
                <div key={tank.id} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-1/4 font-bold text-slate-700">{tank.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase text-center">Varilla (mm)</label><input type="number" value={tankReadings[tank.id].mm} onChange={(e) => handleTankReadingChange(tank.id, 'mm', e.target.value)} className="w-full p-2 border rounded-lg text-center font-bold text-indigo-900" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase text-center">Litros</label><input type="number" value={tankReadings[tank.id].liters} readOnly className="w-full p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-center font-bold text-indigo-700" /></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg">Registrar Cierre</button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-800 rounded-3xl p-8 text-white text-center animate-in fade-in">
            <h1 className="text-2xl font-bold mb-10">Monitor de Tanques</h1>
            <div className="flex flex-wrap justify-center items-end gap-10">
              {TANKS_CONFIG.map(tank => {
                const liters = tankReadings[tank.id].liters || 0;
                const percentage = Math.min(100, (liters / tank.maxLiters) * 100);
                return (
                  <div key={tank.id} className="flex flex-col items-center">
                    <div className="text-xs font-bold text-emerald-400 mb-2">{Math.round(percentage)}%</div>
                    <div className={`w-20 h-48 bg-slate-700 rounded-t-xl relative overflow-hidden border border-slate-600 flex items-end shadow-inner`}>
                      <div className={`w-full ${tank.color}`} style={{ height: `${percentage}%` }}></div>
                    </div>
                    <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase">{tank.name.replace(/[()]/g, '')}</span>
                    <span className="text-sm font-black">{Math.round(liters).toLocaleString('es-AR')} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}