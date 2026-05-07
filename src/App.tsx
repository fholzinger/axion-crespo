import React, { useState, useEffect } from 'react';
import { 
  Fuel, Coffee, Database, Ruler, FileText, Truck, Lock, Download, AlertTriangle, ChevronRight, Save, Trash2
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

// --- TABLA DE AFORO (PRECISIÓN AXION) ---
const TANK_AFORO = {
  'T15': { p1: { mm: 211, l: 1004 }, p2: { mm: 2264, l: 20880 } },
  'T14': { p1: { mm: 211, l: 1004 }, p2: { mm: 2264, l: 20880 } },
  'T13': { p1: { mm: 212, l: 2007 }, p2: { mm: 2264, l: 41562 } },
  'T12': { p1: { mm: 212, l: 2007 }, p2: { mm: 2264, l: 41562 } },
  'T10': { p1: { mm: 190, l: 400 }, p2: { mm: 2088, l: 10000 } },
  'T9': { p1: { mm: 190, l: 400 }, p2: { mm: 2088, l: 10000 } },
  'T8': { p1: { mm: 135, l: 400 }, p2: { mm: 1837, l: 10000 } }
};

const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 39000, color: 'bg-orange-500' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 39000, color: 'bg-sky-400' },
  { id: 't14', name: 'T14 (Quantium D)', maxLiters: 19000, color: 'bg-slate-400' },
  { id: 't15', name: 'T15 (Quantium N)', maxLiters: 19000, color: 'bg-violet-400' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 9500, color: 'bg-sky-400' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 9500, color: 'bg-orange-500' },
  { id: 't10', name: 'T10 (Quantium D)', maxLiters: 9500, color: 'bg-slate-400' }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const q = query(collection(db, "planilla_v5"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDailyLogs(snap.docs.map(d => d.data()));
    });
    return () => unsub();
  }, []);

  const calcularInterpolado = (tid: string, mm: number) => {
    const key = tid.toUpperCase().replace('T', 'T') as keyof typeof TANK_AFORO;
    const config = TANK_AFORO[key];
    if (!config || isNaN(mm)) return 0;
    const { p1, p2 } = config;
    if (mm <= p1.mm) return p1.l;
    return Math.round(p1.l + ((mm - p1.mm) / (p2.mm - p1.mm)) * (p2.l - p1.l));
  };

  const handleInputChange = (tid: string, field: string, val: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tid]: { ...prev[tid], [field]: val } };
      if (field === 'mm') updated[tid].liters = calcularInterpolado(tid, parseFloat(val));
      return updated;
    });
  };

  if (!isAppUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs text-center">
          <img src="https://www.axionenergy.com/LogoAxion.png" className="h-10 mx-auto mb-6" alt="Axion" />
          <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-3 border rounded-xl text-center text-2xl font-bold mb-4" placeholder="PIN" />
          <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : null} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">ENTRAR</button>
        </div>
      </div>
    );
  }

  if (activeSector === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
        <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 w-48 h-48 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform">
          <Fuel size={60} /> <span className="text-xl font-bold mt-2">PLAYA</span>
        </button>
        <button onClick={() => setActiveSector('spot')} className="bg-orange-500 w-48 h-48 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform">
          <Coffee size={60} /> <span className="text-xl font-bold mt-2">SPOT!</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-2 md:p-4 text-[13px]">
      {/* MENÚ DE NAVEGACIÓN COMPACTO */}
      <div className="w-full max-w-6xl bg-white p-1 rounded-xl shadow-sm border mb-4 flex gap-1 flex-wrap">
        {[
          { id: 'varillas', label: 'Varilla', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Camión', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' },
          { id: 'gerencia', label: 'Gerencia', icon: Lock, color: 'bg-rose-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[80px] py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${activeTab === tab.id ? `${tab.color} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-3 text-slate-300 font-bold">X</button>
      </div>

      <div className="w-full max-w-6xl">
        {activeTab === 'varillas' && (
          <div className="bg-white p-4 rounded-xl border shadow-sm max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="font-bold text-slate-700">Cierre de Día</h2>
                <span className="text-slate-400 text-[10px] uppercase font-black">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="space-y-1">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                  <div className="w-32 font-bold text-slate-500">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleInputChange(t.id, 'mm', e.target.value)} placeholder="mm" className="w-24 p-1 border rounded text-center font-bold" />
                  <div className="flex-1 bg-white p-1 rounded text-center font-bold text-indigo-600 border border-indigo-100">{tankReadings[t.id].liters.toLocaleString()} L</div>
                </div>
              ))}
            </div>
            <button onClick={() => alert("Registrando...")} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-bold">GUARDAR CIERRE</button>
          </div>
        )}

        {activeTab === 'gerencia' && (
          <div className="bg-white p-6 rounded-xl border shadow-sm max-w-4xl mx-auto text-center">
            <Lock className="mx-auto mb-4 text-rose-500" size={40} />
            <h2 className="text-xl font-bold mb-4">Panel de Control Gerencial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border-2 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
                    <FileText className="mx-auto mb-2 text-slate-400" />
                    <span className="font-bold block">Subir Excel de Mayo</span>
                    <span className="text-[10px] text-slate-400">Actualizar historial desde archivo</span>
                </button>
                <button className="p-4 border-2 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
                    <AlertTriangle className="mx-auto mb-2 text-rose-400" />
                    <span className="font-bold block text-rose-600">Corregir Stock Manual</span>
                    <span className="text-[10px] text-slate-400">Solo para ajustes de auditoría</span>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <span className="font-bold">Planilla Mensual - Sincronizada</span>
              <button className="bg-emerald-600 text-white px-3 py-1 rounded text-[11px] font-bold">DESCARGAR EXCEL</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase text-slate-500 border-b">
                  <tr>
                    <th className="p-2 border-r font-bold">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-2 text-center border-r font-bold">{t.name}</th>)}
                    <th className="p-2 font-bold">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {dailyLogs.length === 0 ? (
                    <tr><td colSpan={9} className="p-10 text-center text-slate-400">Esperando sincronización o carga de Excel...</td></tr>
                  ) : (
                    dailyLogs.map(log => (
                      <tr key={log.date} className="hover:bg-slate-50">
                        <td className="p-2 border-r font-bold">{log.date}</td>
                        {TANKS_CONFIG.map(t => <td key={t.id} className="p-2 border-r text-center font-bold text-indigo-600">{log.tanks[t.id]?.lv?.toLocaleString() || 0}</td>)}
                        <td className="p-2 text-slate-400">{log.responsable}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-6 rounded-2xl text-white text-center">
            <div className="flex flex-wrap justify-center items-end gap-4 md:gap-8">
              {TANKS_CONFIG.map(t => {
                const cur = (parseFloat(tankReadings[t.id].liters) || 0) + (parseFloat(tankReadings[t.id].desc) || 0);
                const p = Math.min(100, (cur / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-emerald-400 mb-1">{Math.round(p)}%</div>
                    <div className="w-12 h-32 md:w-16 md:h-48 bg-slate-800 rounded-t-xl rounded-b-md relative overflow-hidden border border-slate-700 flex items-end">
                      <div className={`w-full transition-all duration-700 ${t.color}`} style={{ height: `${p}%` }} />
                    </div>
                    <span className="mt-2 text-[9px] font-bold text-slate-500 uppercase">{t.name.split(' ')[0]}</span>
                    <span className="text-[11px] font-bold">{Math.round(cur).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Pestaña Camión simplificada */}
        {activeTab === 'descarga' && (
          <div className="bg-white p-4 rounded-xl border shadow-sm max-w-2xl mx-auto">
            <h2 className="font-bold mb-4 border-b pb-2 text-amber-600">Descarga de Camión</h2>
            <div className="space-y-1">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 bg-amber-50/30 rounded-lg border border-amber-100">
                  <div className="w-32 font-bold text-amber-800">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].desc} onChange={(e) => handleInputChange(t.id, 'desc', e.target.value)} placeholder="0" className="flex-1 p-1 border-amber-200 border rounded text-center font-bold text-amber-700" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}