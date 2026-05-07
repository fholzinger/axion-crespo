import React, { useState, useEffect } from 'react';
import { 
  Fuel, Coffee, Database, Ruler, FileText, Truck, Download, Lock, ShieldAlert, Calculator, X, Save
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

// --- CONSTANTES Y CONFIGURACIÓN ---
const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', max: 39000, color: 'bg-orange-500', factor: 18.31 },
  { id: 't13', name: 'T13 (Súper)', max: 39000, color: 'bg-sky-400', factor: 18.31 },
  { id: 't14', name: 'T14 (Q. Diesel)', max: 19000, color: 'bg-slate-400', factor: 9.22 },
  { id: 't15', name: 'T15 (Q. Nafta)', max: 19000, color: 'bg-violet-400', factor: 9.22 },
  { id: 't8', name: 'T8 (Súper)', max: 9500, color: 'bg-sky-400', factor: 5.44 },
  { id: 't9', name: 'T9 (X10)', max: 9500, color: 'bg-orange-500', factor: 5.44 },
  { id: 't10', name: 'T10 (Q. Diesel)', max: 9500, color: 'bg-slate-400', factor: 5.44 }
];

// DATA EXTRAÍDA DEL EXCEL (MAYO 2026)
const MAYO_DATA = [
  { date: '2026-05-07', resp: 'Bauman D.', lv: { t12: 3099, t13: 4614, t14: 3060, t15: 9092, t8: 8271, t9: 2873, t10: 8653 } },
  { date: '2026-05-06', resp: 'Bauman D.', lv: { t12: 2471, t13: 3122, t14: 6761, t15: 938, t8: 1442, t9: 5963, t10: -599 } },
  { date: '2026-05-05', resp: 'Céspedes D.', lv: { t12: 8815, t13: 875, t14: 11694, t15: 999, t8: 1442, t9: 0, t10: 0 } },
  { date: '2026-05-04', resp: 'Zingraf L.', lv: { t12: 2802, t13: -655, t14: 577, t15: 925, t8: 3342, t9: 7, t10: 1345 } }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appPinInput, setAppPinInput] = useState('');
  const [pinAdmin, setPinAdmin] = useState('');
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {}));
  const [history, setHistory] = useState<any[]>(MAYO_DATA);

  useEffect(() => {
    signInAnonymously(auth);
    const q = query(collection(db, "cierres_v6"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const dbDocs = snap.docs.map(d => d.data());
      setHistory(dbDocs.length > 0 ? dbDocs : MAYO_DATA);
    });
  }, []);

  const handleCalc = (tid: string, val: string) => {
    const mm = parseFloat(val);
    const tank = TANKS_CONFIG.find(t => t.id === tid);
    const liters = !isNaN(mm) && tank ? Math.round(mm * tank.factor) : 0;
    setTankReadings((p: any) => ({ ...p, [tid]: { ...p[tid], mm: val, liters } }));
  };

  const saveCierre = async () => {
    const firma = prompt("Firma del Responsable:");
    if (!firma) return;
    const docData = {
      date: new Date().toISOString().split('T')[0],
      resp: firma,
      lv: Object.keys(tankReadings).reduce((acc: any, tid) => {
        acc[tid] = tankReadings[tid].liters;
        return acc;
      }, {})
    };
    await setDoc(doc(db, "cierres_v6", docData.date), docData);
    alert("Sincronizado con éxito.");
  };

  if (!isAppUnlocked) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs text-center">
        <img src="/logo.png" className="h-12 mx-auto mb-6" alt="Axion" />
        <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center text-3xl mb-4 font-bold" placeholder="PIN" />
        <button onClick={() => appPinInput === '6227' ? setIsAppUnlocked(true) : alert("Error")} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">INGRESAR</button>
      </div>
    </div>
  );

  if (activeSector === null) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
      <div className="flex gap-6">
        <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 w-44 h-44 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Fuel size={50} /> <span className="text-lg font-bold mt-2">PLAYA</span>
        </button>
        <button onClick={() => setActiveSector('spot')} className="bg-orange-500 w-44 h-44 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-all">
          <Coffee size={50} /> <span className="text-lg font-bold mt-2">SPOT!</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-2 md:p-4 text-[12px]">
      <div className="w-full max-w-6xl bg-white p-1 rounded-xl shadow-sm border mb-4 flex gap-1 items-center">
        {[
          { id: 'varillas', label: 'Varilla', icon: Ruler, color: 'bg-indigo-600' },
          { id: 'descarga', label: 'Camión', icon: Truck, color: 'bg-amber-500' },
          { id: 'monitor', label: 'Tanques', icon: Database, color: 'bg-slate-800' },
          { id: 'registro', label: 'Mensual', icon: FileText, color: 'bg-emerald-600' },
          { id: 'gerencia', label: 'Gerencia', icon: Lock, color: 'bg-rose-600' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-2 ${activeTab === tab.id ? `${tab.color} text-white` : 'text-slate-400 hover:bg-slate-50'}`}>
            <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
        <button onClick={() => setActiveSector(null)} className="px-3 text-slate-300 font-bold hover:text-red-500">SALIR</button>
      </div>

      <div className="w-full max-w-6xl">
        {activeTab === 'varillas' && (
          <div className="bg-white p-4 rounded-xl border shadow-sm max-w-2xl mx-auto">
            <h2 className="font-bold mb-4 border-b pb-1 text-slate-700">Cierre de Día (Automático)</h2>
            <div className="space-y-1">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border">
                  <div className="w-28 font-bold text-slate-500 text-[11px]">{t.name}</div>
                  <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleCalc(t.id, e.target.value)} placeholder="mm" className="w-20 p-1 border rounded text-center font-bold" />
                  <div className="flex-1 bg-white p-1 rounded text-center font-bold text-indigo-600 border border-indigo-100">{tankReadings[t.id].liters.toLocaleString()} L</div>
                </div>
              ))}
            </div>
            <button onClick={saveCierre} className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg font-bold">GUARDAR REGISTRO</button>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-2 bg-slate-50 border-b flex justify-between items-center font-bold">
              <span>Planilla Mayo 2026</span>
              <button className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">EXCEL</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 border-b">
                    <th className="p-2 border-r font-bold">Fecha</th>
                    {TANKS_CONFIG.map(t => <th key={t.id} className="p-2 text-center border-r font-bold">{t.name}</th>)}
                    <th className="p-2 font-bold">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {history.map(log => (
                    <tr key={log.date} className="hover:bg-slate-50">
                      <td className="p-2 border-r font-bold">{log.date}</td>
                      {TANKS_CONFIG.map(t => <td key={t.id} className="p-2 border-r text-center font-bold text-indigo-600">{log.lv[t.id]?.toLocaleString()} L</td>)}
                      <td className="p-2 text-slate-400">{log.resp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gerencia' && (
          <div className="max-w-md mx-auto">
            {!isAdmin ? (
              <div className="bg-white p-6 rounded-xl border text-center">
                <ShieldAlert className="mx-auto mb-4 text-rose-500" size={30} />
                <input type="password" value={pinAdmin} onChange={(e) => setPinAdmin(e.target.value)} className="w-full p-2 border rounded-lg text-center mb-4" placeholder="PIN ADMIN" />
                <button onClick={() => pinAdmin === '225903' ? setIsAdmin(true) : null} className="w-full bg-rose-600 text-white py-2 rounded-lg font-bold">ACCEDER</button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border text-center space-y-4">
                <h2 className="font-bold text-lg">Panel Gerencial Activo</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-4 border rounded-xl hover:bg-slate-50 flex flex-col items-center gap-2">
                    <Calculator size={20} className="text-indigo-500"/>
                    <span className="text-[10px] font-bold">Ajuste de Precios</span>
                  </button>
                  <button className="p-4 border rounded-xl hover:bg-slate-50 flex flex-col items-center gap-2">
                    <X size={20} className="text-red-500"/>
                    <span className="text-[10px] font-bold" onClick={() => setIsAdmin(false)}>Salir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-6 rounded-2xl flex flex-wrap justify-center items-end gap-6 text-white">
            {TANKS_CONFIG.map(t => {
              const cur = (parseFloat(tankReadings[t.id].liters) || 0);
              const p = Math.min(100, (cur / t.max) * 100);
              return (
                <div key={t.id} className="flex flex-col items-center">
                  <div className="text-[9px] font-bold text-emerald-400 mb-1">{Math.round(p)}%</div>
                  <div className="w-12 h-32 bg-slate-800 rounded-t-xl relative overflow-hidden border border-slate-700 flex items-end">
                    <div className={`w-full transition-all duration-700 ${t.color}`} style={{ height: `${p}%` }} />
                  </div>
                  <span className="mt-2 text-[9px] font-bold text-slate-500">{t.name.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}