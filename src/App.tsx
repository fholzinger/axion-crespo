import React, { useState } from 'react';
import { 
  Fuel, Coffee, Database, Ruler, FileText, Truck, Lock, Calculator, ShieldAlert, AlertCircle 
} from 'lucide-react';

// --- TABLA DE AFORO ---
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
  const id = match[0].toUpperCase() as keyof typeof TANK_AFORO;
  const table = TANK_AFORO[id];
  if (!table || isNaN(mm)) return 0;
  const p1 = table[0]; const p2 = table[1];
  const fraction = (mm - p1.mm) / (p2.mm - p1.mm);
  return Math.round(p1.liters + fraction * (p2.liters - p1.liters));
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
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [appPinInput, setAppPinInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [tankReadings, setTankReadings] = useState<any>(
    TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: 0, desc: ''}}), {})
  );

  const handleTankReadingChange = (tankId: string, value: string) => {
    const mmVal = parseFloat(value);
    setTankReadings((prev: any) => ({
      ...prev,
      [tankId]: { ...prev[tankId], mm: value, liters: value === '' ? 0 : calcularLitros(tankId, mmVal) }
    }));
  };

  if (!isAppUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center">
          <img src="https://www.axionenergy.com/LogoAxion.png" alt="Axion" className="h-16 mx-auto mb-8" />
          <h2 className="text-2xl font-black mb-6 text-slate-800">Acceso Axion</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (appPinInput === '6227') setIsAppUnlocked(true); else setAppPinInput(''); }}>
            <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-5 border-2 rounded-3xl text-center text-4xl mb-6 font-black outline-none focus:border-indigo-500" placeholder="****" />
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700">ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  if (activeSector === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-white mb-16 tracking-tighter">¿A QUÉ SECTOR VAS?</h1>
        <div className="flex flex-col md:flex-row gap-10">
          <button onClick={() => setActiveSector('playa')} className="bg-indigo-600 p-12 rounded-[50px] w-80 h-80 flex flex-col items-center justify-center gap-6 shadow-2xl hover:scale-105 transition-transform">
            <Fuel size={120} className="text-indigo-200" /> <span className="text-4xl font-black text-white">PLAYA</span>
          </button>
          <button onClick={() => setActiveSector('spot')} className="bg-orange-500 p-12 rounded-[50px] w-80 h-80 flex flex-col items-center justify-center gap-6 shadow-2xl hover:scale-105 transition-transform">
            <Coffee size={120} className="text-orange-200" /> <span className="text-4xl font-black text-white">SPOT!</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      {/* MENÚ SUPERIOR (EL QUE FUNCIONABA BIEN) */}
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
                  <div className="w-full md:w-1/4 font-black text-slate-700 text-2xl tracking-tighter">{t.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase text-center mb-3">Varilla (mm)</label>
                      <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleTankReadingChange(t.id, e.target.value)} className="w-full p-5 border-2 rounded-3xl text-center text-3xl font-black text-indigo-900 focus:border-indigo-500 outline-none shadow-inner bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase text-center mb-3">Litros</label>
                      <input type="number" value={tankReadings[t.id].liters} readOnly className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl text-center text-3xl font-black text-indigo-600 shadow-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-12 bg-indigo-600 text-white font-black py-7 rounded-[35px] text-3xl shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">REGISTRAR PLANILLA</button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-12 rounded-[60px] shadow-2xl text-white text-center">
            <h2 className="text-4xl font-black mb-20 flex items-center justify-center gap-5 text-emerald-400">MONITOR DE VOLUMEN</h2>
            <div className="flex flex-wrap justify-center items-end gap-16">
              {TANKS_CONFIG.map(t => {
                const liters = tankReadings[t.id].liters || 0;
                const perc = Math.min(100, (liters / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-lg font-black text-emerald-500 mb-4">{Math.round(perc)}%</div>
                    <div className="w-28 h-80 bg-slate-800 rounded-t-[40px] rounded-b-2xl relative overflow-hidden border-2 border-slate-700 flex items-end shadow-2xl">
                      <div className={`w-full transition-all duration-1000 ${t.color}`} style={{ height: `${perc}%` }} />
                    </div>
                    <span className="mt-8 text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.name}</span>
                    <span className="text-2xl font-black mt-2">{liters.toLocaleString()} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OTROS MENÚS EN CONSTRUCCIÓN */}
        {(activeTab === 'descarga' || activeTab === 'registro' || activeTab === 'gerencia') && (
          <div className="bg-white p-20 rounded-[50px] shadow-sm border text-center max-w-4xl mx-auto animate-in fade-in">
            <AlertCircle size={60} className="text-slate-200 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-slate-800 mb-4">Módulo en Desarrollo</h2>
            <p className="text-xl text-slate-500 mb-10">Conectaremos este panel una vez que integremos Firebase para que los datos sean reales.</p>
            <button onClick={() => setActiveTab('varillas')} className="bg-slate-800 text-white px-10 py-4 rounded-3xl font-black">VOLVER</button>
          </div>
        )}
      </div>
    </div>
  );
}