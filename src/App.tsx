import React, { useState, useEffect } from 'react';
import { 
  Fuel, Coffee, Database, Ruler, FileText, Truck, Download, Lock, ShieldAlert, Calculator, X, Save, Send, Clock
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

// --- CONFIGURACIÓN DE TANQUES (Factores según tus tablas de 40m3 y 20m3) ---
const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 39000, color: 'bg-orange-500', factor: 18.35 },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 39000, color: 'bg-sky-400', factor: 18.35 },
  { id: 't14', name: 'T14 (Q. Diesel)', maxLiters: 19000, color: 'bg-slate-400', factor: 9.22 },
  { id: 't15', name: 'T15 (Q. Nafta)', maxLiters: 19000, color: 'bg-violet-400', factor: 9.22 },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 9500, color: 'bg-sky-400', factor: 5.44 },
  { id: 't9', name: 'T9 (X10)', maxLiters: 9500, color: 'bg-orange-500', factor: 5.44 },
  { id: 't10', name: 'T10 (Q. Diesel)', maxLiters: 9500, color: 'bg-slate-400', factor: 5.44 }
];

// DATA HISTÓRICA INICIAL (MAYO 26)
const INITIAL_HISTORY = [
  { date: '2026-05-07', responsable: 'Bauman D.', lv: { t12: 3099, t13: 4614, t14: 3060, t15: 9092, t8: 8271, t9: 2873, t10: 8653 }, fin_liters: { t12: 3099, t13: 4614, t14: 3060, t15: 9092, t8: 8271, t9: 2873, t10: 8653 } },
  { date: '2026-05-06', responsable: 'Bauman D.', lv: { t12: 2471, t13: 3122, t14: 6761, t15: 938, t8: 1442, t9: 5963, t10: -599 }, fin_liters: { t12: 2471, t13: 3122, t14: 6761, t15: 938, t8: 1442, t9: 5963, t10: -599 } },
  { date: '2026-05-05', responsable: 'Céspedes D.', lv: { t12: 8815, t13: 875, t14: 11694, t15: 999, t8: 1442, t9: 0, t10: 0 }, fin_liters: { t12: 22813, t13: 6709, t14: 7960, t15: 5700, t8: 451, t9: 806, t10: 185 } }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [dailyLogs, setDailyLogs] = useState<any[]>(INITIAL_HISTORY);
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));

  useEffect(() => {
    signInAnonymously(auth);
    const q = query(collection(db, "registros_v9"), orderBy("date", "desc"));
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

    // Creamos un registro especial de descarga o actualizamos el estado actual
    const lastLog = dailyLogs[0];
    const newDoc = {
      date: new Date().toISOString(),
      responsable: "Descarga Camión",
      isDescarga: true,
      tanks: Object.keys(tankReadings).reduce((acc: any, tid) => {
        const descVal = parseFloat(tankReadings[tid].desc) || 0;
        acc[tid] = { 
          inicio: lastLog?.fin_liters?.[tid] || 0,
          desc: descVal,
          fin: (lastLog?.fin_liters?.[tid] || 0) + descVal,
          lv: 0 
        };
        return acc;
      }, {}),
      fin_liters: Object.keys(tankReadings).reduce((acc: any, tid) => {
        acc[tid] = (lastLog?.fin_liters?.[tid] || 0) + (parseFloat(tankReadings[tid].desc) || 0);
        return acc;
      }, {})
    };

    await setDoc(doc(db, "registros_v9", `DESC-${Date.now()}`), newDoc);
    alert("Descarga registrada y monitor actualizado.");
    setTankReadings((p:any) => {
        const reset = {...p};
        Object.keys(reset).forEach(k => reset[k].desc = '');
        return reset;
    });
  };

  if (!isAppUnlocked) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[35px] shadow-2xl max-w-sm w-full text-center">
        <img src="/logo.png" className="h-16 mx-auto mb-6" alt="Axion" />
        <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-3xl mb-6 font-bold" placeholder="PIN" />
        <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("PIN incorrecto")} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold">INGRESAR</button>
      </div>
    </div>
  );

  if (activeSector === null) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-10">
      <div className="flex flex-col md:flex-row gap-8">
        <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 w-56 h-56 rounded-[40px] flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Fuel size={70} /> <span className="text-2xl font-bold mt-4">PLAYA</span>
        </button>
        <button onClick={() => setActiveSector('spot')} className="bg-orange-500 w-56 h-56 rounded-[40px] flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Coffee size={70} /> <span className="text-2xl font-bold mt-4">SPOT!</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-2 md:p-6 font-sans text-[13px]">
      <div className="w-full max-w-7xl bg-white p-2 rounded-2xl shadow-sm border mb-6 flex gap-2 flex-wrap items-center">
        {[
          { id: 'varillas', label: 'Varillado', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Descarga', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={16} /> <span>{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-4 font-bold text-slate-300">SALIR</button>
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
                    <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleReading(t.id, 'mm', e.target.value)} className="w-full p-2 border-2 rounded-xl text-center font-bold text-lg" placeholder="mm" />
                    <div className="w-full p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center font-bold text-indigo-600 text-lg">{tankReadings[t.id].liters.toLocaleString()} L</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3">
               <Send size={20}/> REGISTRAR CIERRE
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
                  <input type="number" value={tankReadings[t.id].desc} onChange={(e) => handleReading(t.id, 'desc', e.target.value)} placeholder="0 L" className="flex-1 p-3 border-2 border-amber-200 rounded-xl text-center font-bold text-amber-700" />
                </div>
              ))}
            </div>
            <button onClick={confirmarDescarga} className="w-full mt-8 bg-amber-500 text-white font-black py-5 rounded-2xl text-xl shadow-xl flex items-center justify-center gap-3 hover:bg-amber-600 transition-all">
                <CheckCircle2 /> CONFIRMAR DESCARGA Y ACTUALIZAR MONITOR
            </button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white text-center animate-in zoom-in-95">
            <h2 className="text-2xl font-bold mb-16 text-emerald-400 flex items-center justify-center gap-4"><Database /> STOCK ACTUAL EN TIEMPO REAL</h2>
            <div className="flex flex-wrap justify-center items-end gap-10">
              {TANKS_CONFIG.map(t => {
                const lastLiters = dailyLogs[0]?.fin_liters?.[t.id] || 0;
                const cur = lastLiters;
                const p = Math.min(100, (cur / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-[11px] font-bold text-emerald-500 mb-3">{Math.round(p)}%</div>
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
                    <th className="p-3 border-r font-bold">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-3 text-center border-r font-bold">{t.name} (LV)</th>)}
                    <th className="p-3 font-bold">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {dailyLogs.map(log => (
                    <tr key={log.date} className="hover:bg-slate-50">
                      <td className="p-3 border-r font-bold">{log.date.split('T')[0]}</td>
                      {TANKS_CONFIG.map(t => <td key={t.id} className="p-3 border-r text-center font-bold text-indigo-600">{(log.tanks?.[t.id]?.lv || 0).toLocaleString()} L</td>)}
                      <td className="p-3 text-slate-400 font-medium">{log.responsable}</td>
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