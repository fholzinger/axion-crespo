import React, { useState, useMemo, useEffect } from 'react';
import { 
  Fuel, Coffee, CircleDollarSign, Droplets, PlusCircle, Clock, FileText, 
  Trash2, ClipboardList, Database, Ruler, AlertTriangle, ArrowRight, 
  Send, CalendarDays, Truck, CheckCircle2, Save, User, X, Lock, 
  Unlock, Download, ShieldAlert, Key, Info, PackagePlus, Calendar, 
  Loader2, Calculator, History, Edit3, ChevronRight 
} from 'lucide-react';

// ==========================================
// 1. TABLA DE AFORO (CÁLCULOS)
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
    const p1 = table[i]; const p2 = table[i + 1];
    if (mm >= p1.mm && mm <= p2.mm) {
      const fraction = (mm - p1.mm) / (p2.mm - p1.mm);
      return Math.round(p1.liters + fraction * (p2.liters - p1.liters));
    }
  }
  return 0;
};

// ==========================================
// 2. CONFIGURACIÓN AXION
// ==========================================
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

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [activeSector, setActiveSector] = useState<'playa' | 'spot' | null>(null);
  const [activeTab, setActiveTab] = useState('varillas');
  const [appPinInput, setAppPinInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Datos temporales de la app
  const [tankReadings, setTankReadings] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: {mm: '', liters: '', desc: ''}}), {}));
  const [tankOrders, setTankOrders] = useState<any>(TANKS_CONFIG.reduce((acc, t) => ({...acc, [t.id]: []}), {}));
  const [selectedTruck, setSelectedTruck] = useState<'estandar' | 'chico'>('estandar');

  const handleTankReadingChange = (tankId: string, field: string, value: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tankId]: { ...prev[tankId], [field]: value } };
      if (field === 'mm') {
        const mmVal = parseFloat(value);
        updated[tankId].liters = value === '' ? '' : calcularLitros(tankId, mmVal);
      }
      return updated;
    });
  };

  // --- LÓGICA DE RENDERIZADO ---

  // PANTALLA 1: PIN
  if (!isAppUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center">
          <img src="/logo.png" alt="Axion" className="h-24 mx-auto mb-8" />
          <h2 className="text-2xl font-black mb-6 text-slate-800 tracking-tight">Acceso Axion</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (appPinInput === '6227') setIsAppUnlocked(true); else { alert('PIN Incorrecto'); setAppPinInput(''); } }}>
            <input type="password" value={appPinInput} onChange={(e) => setAppPinInput(e.target.value)} className="w-full p-5 border-2 rounded-3xl text-center text-4xl mb-6 outline-none focus:border-indigo-500 font-black" placeholder="****" />
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700">DESBLOQUEAR</button>
          </form>
        </div>
      </div>
    );
  }

  // PANTALLA 2: SECTOR
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

  // PANTALLA 3: SPOT
  if (activeSector === 'spot') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl border-t-[16px] border-orange-500 text-center max-w-2xl">
          <Coffee size={120} className="text-orange-500 mx-auto mb-8" />
          <h2 className="text-5xl font-black text-slate-800 mb-6">Módulo Spot!</h2>
          <p className="text-2xl text-slate-500 font-medium leading-relaxed mb-12">Estamos terminando el panel de tareas para Tatiana, Fiorella y Cintia. ¡Vuelve pronto!</p>
          <button onClick={() => setActiveSector(null)} className="text-indigo-600 font-black text-2xl hover:scale-110 transition-transform">← VOLVER AL INICIO</button>
        </div>
      </div>
    );
  }

  // PANTALLA 4: PLAYA COMPLETA
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      {/* MENÚ DE NAVEGACIÓN */}
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
        <button onClick={() => setActiveSector(null)} className="px-8 font-black text-slate-300 hover:text-red-500 transition-colors">SALIR</button>
      </div>

      <div className="max-w-7xl w-full">
        {/* VARILLADO */}
        {activeTab === 'varillas' && (
          <div className="bg-white p-10 rounded-[50px] shadow-sm border max-w-4xl mx-auto animate-in fade-in">
            <h2 className="text-3xl font-black text-slate-800 mb-10 border-b pb-6">Cierre Matutino (Automático)</h2>
            <div className="space-y-6">
              {TANKS_CONFIG.map(t => (
                <div key={t.id} className="p-8 bg-slate-50 rounded-[35px] border flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-1/4 font-black text-slate-700 text-2xl tracking-tighter">{t.name}</div>
                  <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase text-center mb-3">Varilla (mm)</label>
                      <input type="number" value={tankReadings[t.id].mm} onChange={(e) => handleTankReadingChange(t.id, 'mm', e.target.value)} className="w-full p-5 border-2 rounded-3xl text-center text-3xl font-black text-indigo-900 focus:border-indigo-500 outline-none shadow-inner bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase text-center mb-3">Litros Calculados</label>
                      <input type="number" value={tankReadings[t.id].liters} readOnly className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl text-center text-3xl font-black text-indigo-600 shadow-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-12 bg-indigo-600 text-white font-black py-7 rounded-[35px] text-3xl shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">REGISTRAR CIERRE</button>
          </div>
        )}

        {/* MONITOR */}
        {activeTab === 'monitor' && (
          <div className="bg-slate-900 p-12 rounded-[60px] shadow-2xl text-white text-center animate-in zoom-in-95">
            <h2 className="text-4xl font-black mb-20 flex items-center justify-center gap-5 text-emerald-400"><Database size={50}/> MONITOR DE VOLUMEN</h2>
            <div className="flex flex-wrap justify-center items-end gap-16">
              {TANKS_CONFIG.map(t => {
                const liters = parseFloat(tankReadings[t.id].liters) || 0;
                const perc = Math.min(100, (liters / t.maxLiters) * 100);
                return (
                  <div key={t.id} className="flex flex-col items-center">
                    <div className="text-lg font-black text-emerald-500 mb-4">{Math.round(perc)}%</div>
                    <div className={`w-28 h-80 bg-slate-800 rounded-t-[40px] rounded-b-2xl relative overflow-hidden border-2 border-slate-700 flex items-end shadow-2xl`}>
                      <div className={`w-full transition-all duration-1000 ${t.color}`} style={{ height: `${perc}%` }} />
                    </div>
                    <span className="mt-8 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.name.split(' ')[0]}</span>
                    <span className="text-2xl font-black mt-2">{Math.round(liters).toLocaleString()} L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LAS DEMÁS PESTAÑAS (Muestra cartel temporal si no hay datos cargados) */}
        {(activeTab === 'descarga' || activeTab === 'registro' || activeTab === 'gerencia') && (
          <div className="bg-white p-20 rounded-[50px] shadow-sm border text-center max-w-4xl mx-auto animate-in fade-in">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-dashed border-slate-300">
               <AlertCircle size={48} className="text-slate-300" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">¡Casi listo!</h2>
            <p className="text-xl text-slate-500 font-medium mb-10">La pestaña de {activeTab.toUpperCase()} se está sincronizando con la nueva base de datos del Spot. Estará disponible en la próxima actualización.</p>
            <button onClick={() => setActiveTab('varillas')} className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black text-lg shadow-lg">VOLVER AL VARILLADO</button>
          </div>
        )}
      </div>
    </div>
  );
}