import React, { useState, useMemo, useEffect } from 'react';
import { Fuel, CircleDollarSign, Droplets, PlusCircle, Clock, FileText, Trash2, ClipboardList, Database, Ruler, AlertTriangle, ArrowRight, Send, CalendarDays, Truck, CheckCircle2, Save, User, X, Lock, Unlock, Download, ShieldAlert, Key, Info, PackagePlus, Calendar, Loader2, Calculator, History, Edit3 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';


// ==========================================
// INICIALIZACIÓN DE BASE DE DATOS EN LA NUBE
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
const appId = "mi-estacion-crespo"; 

// Combustibles reales
const FUEL_TYPES = {
  super: { id: 'super', name: 'Súper', defaultPrice: 1000, color: 'bg-sky-400', hover: 'hover:bg-sky-500' },
  quantium_nafta: { id: 'quantium_nafta', name: 'Quantium N.', defaultPrice: 1200, color: 'bg-violet-400', hover: 'hover:bg-violet-500' },
  x10: { id: 'x10', name: 'X10', defaultPrice: 1050, color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  quantium_diesel: { id: 'quantium_diesel', name: 'Quantium D.', defaultPrice: 1250, color: 'bg-slate-400', hover: 'hover:bg-slate-500' }
};

// Configuración REAL de Tanques
const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 41562, diameterMm: 2264, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 41562, diameterMm: 2264, color: 'bg-sky-400', fuel: 'super' },
  { id: 't14', name: 'T14 (Quantium D)', maxLiters: 20880, diameterMm: 2264, color: 'bg-slate-400', fuel: 'quantium_diesel' },
  { id: 't15', name: 'T15 (Quantium N)', maxLiters: 20880, diameterMm: 2264, color: 'bg-violet-400', fuel: 'quantium_nafta' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 10000, diameterMm: 1837, color: 'bg-sky-400', fuel: 'super' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 10000, diameterMm: 2088, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't10', name: 'T10 (Quantium D)', maxLiters: 10000, diameterMm: 2088, color: 'bg-slate-400', fuel: 'quantium_diesel' }
];

// Configuración REAL de Camiones 
const CAMIONES_CONFIG = {
  estandar: [
    { id: 'C1', max: 8000, min: 6800 }, { id: 'C2', max: 8000, min: 6200 }, { id: 'C3', max: 6000, min: 5200 },
    { id: 'C4', max: 6000, min: 5200 }, { id: 'C5', max: 6000, min: 5200 }, { id: 'C6', max: 6000, min: 5200 },
    { id: 'C7', max: 8000, min: 6800 }
  ],
  chico: [
    { id: 'C1', max: 8000, min: 6800 }, { id: 'C2', max: 7000, min: 5950 }, { id: 'C3', max: 5900, min: 5015 },
    { id: 'C4', max: 4900, min: 4165 }, { id: 'C5', max: 6000, min: 5100 }, { id: 'C6', max: 7900, min: 6715 }
  ]
};

// ==========================================
// TRANSCRIPCIÓN EXACTA DE LA IMAGEN DE EXCEL
// ==========================================
const DATOS_HISTORICOS = [
  {
    id: 1714348800000, date: '2026-04-29', responsable: 'Sistema',
    tanks: { t12: { inicio: 6156, desc: 0, fin: 6156, lv: 0 }, t13: { inicio: 9853, desc: 0, fin: 9853, lv: 0 }, t14: { inicio: 1422, desc: 0, fin: 1422, lv: 0 }, t15: { inicio: 5931, desc: 0, fin: 5931, lv: 0 }, t8: { inicio: 100, desc: 0, fin: 100, lv: 0 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 242, desc: 0, fin: 242, lv: 0 } }
  },
  {
    id: 1714435200000, date: '2026-04-30', responsable: 'Sistema',
    tanks: { t12: { inicio: 6156, desc: 399, fin: 6555, lv: 0 }, t13: { inicio: 9853, desc: -422, fin: 9431, lv: 0 }, t14: { inicio: 1422, desc: 1176, fin: 2598, lv: 0 }, t15: { inicio: 5931, desc: -1103, fin: 4828, lv: 0 }, t8: { inicio: 100, desc: 5460, fin: 5560, lv: 0 }, t9: { inicio: 806, desc: 8039, fin: 8845, lv: 0 }, t10: { inicio: 242, desc: 6027, fin: 6269, lv: 0 } }
  },
  {
    id: 1714521600000, date: '2026-05-01', responsable: 'Zingraf L.',
    tanks: { t12: { inicio: 6555, desc: 0, fin: 2884, lv: 3671 }, t13: { inicio: 9431, desc: 0, fin: 5037, lv: 4394 }, t14: { inicio: 2598, desc: 0, fin: 1607, lv: 991 }, t15: { inicio: 4828, desc: 0, fin: 2966, lv: 1862 }, t8: { inicio: 5560, desc: 0, fin: 5925, lv: -365 }, t9: { inicio: 8845, desc: 0, fin: 5291, lv: 3554 }, t10: { inicio: 6269, desc: 0, fin: 3000, lv: 3269 } }
  },
  {
    id: 1714608000000, date: '2026-05-02', responsable: 'Zingraf L.',
    tanks: { t12: { inicio: 2884, desc: 8094, fin: 10492, lv: 486 }, t13: { inicio: 5037, desc: 0, fin: 1873, lv: 3164 }, t14: { inicio: 1607, desc: 8036, fin: 9821, lv: -178 }, t15: { inicio: 2966, desc: 0, fin: 2393, lv: 573 }, t8: { inicio: 5925, desc: 0, fin: 5235, lv: 690 }, t9: { inicio: 5291, desc: 0, fin: 813, lv: 4478 }, t10: { inicio: 3000, desc: 0, fin: 1530, lv: 1470 } }
  },
  {
    id: 1714694400000, date: '2026-05-03', responsable: 'Céspedes D.',
    tanks: { t12: { inicio: 10492, desc: 0, fin: 7690, lv: 2802 }, t13: { inicio: 1873, desc: 0, fin: 2528, lv: -655 }, t14: { inicio: 9821, desc: 0, fin: 9244, lv: 577 }, t15: { inicio: 2393, desc: 0, fin: 1468, lv: 925 }, t8: { inicio: 5235, desc: 0, fin: 1893, lv: 3342 }, t9: { inicio: 813, desc: 0, fin: 806, lv: 7 }, t10: { inicio: 1530, desc: 0, fin: 185, lv: 1345 } }
  },
  {
    id: 1714780800000, date: '2026-05-04', responsable: 'Céspedes D.',
    tanks: { t12: { inicio: 7690, desc: 23938, fin: 22813, lv: 8815 }, t13: { inicio: 2528, desc: 5056, fin: 6709, lv: 875 }, t14: { inicio: 9244, desc: 10410, fin: 7960, lv: 11694 }, t15: { inicio: 1468, desc: 5231, fin: 5700, lv: 999 }, t8: { inicio: 1893, desc: 0, fin: 451, lv: 1442 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 185, desc: 0, fin: 185, lv: 0 } }
  }
];

const STOCK_INICIAL_AL_DIA_ACTUAL = TANKS_CONFIG.reduce((acc, tank) => {
  acc[tank.id] = { mm: '', liters: DATOS_HISTORICOS[DATOS_HISTORICOS.length - 1].tanks[tank.id].fin, desc: '' };
  return acc;
}, {} as any);

const MONTH_NAMES: any = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };

// Obtiene fecha ISO (Ayer)
const getYesterdayISOString = () => {
  const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const yyyy = yesterday.getFullYear(); const mm = String(yesterday.getMonth() + 1).padStart(2, '0'); const dd = String(yesterday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('varillas'); 
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // ==========================================
  // ESTADOS PRINCIPALES 
  // ==========================================
  const [tankReadings, setTankReadings] = useState<any>(STOCK_INICIAL_AL_DIA_ACTUAL);
  const [dailyLogs, setDailyLogs] = useState<any[]>(DATOS_HISTORICOS); 

  const [selectedTruck, setSelectedTruck] = useState<'estandar' | 'chico'>('estandar');
  const currentCisterns = CAMIONES_CONFIG[selectedTruck];

  const initialOrdersState = TANKS_CONFIG.reduce((acc, tank) => { acc[tank.id] = []; return acc; }, {} as any);
  const [tankOrders, setTankOrders] = useState<any>(initialOrdersState);

  // ESTADO DE PRECIOS
  const initialPrices = { super: FUEL_TYPES.super.defaultPrice, quantium_nafta: FUEL_TYPES.quantium_nafta.defaultPrice, x10: FUEL_TYPES.x10.defaultPrice, quantium_diesel: FUEL_TYPES.quantium_diesel.defaultPrice };
  const [fuelPrices, setFuelPrices] = useState<any>(initialPrices);
  const [editPrices, setEditPrices] = useState<any>(initialPrices);

  // ESTADO PARA EDICIÓN MANUAL DE REGISTROS
  const [manualEdit, setManualEdit] = useState<any>({
    isOpen: false, id: null, date: getYesterdayISOString(), responsable: 'Gerencia (Ajuste)',
    tanks: TANKS_CONFIG.reduce((acc, t) => ({ ...acc, [t.id]: { inicio: '', desc: '', fin: '' } }), {})
  });

  const [isAdmin, setIsAdmin] = useState(false); 
  const [pinInput, setPinInput] = useState('');
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', message: '', inputValue: '', onConfirm: null });

  const closeModal = () => setModalConfig((prev: any) => ({ ...prev, isOpen: false }));
  const handleModalConfirm = () => { if (modalConfig.onConfirm) modalConfig.onConfirm(modalConfig.inputValue); closeModal(); };

  // ==========================================
  // CONEXIÓN A LA NUBE Y SISTEMA DE RESCATE
  // ==========================================
  useEffect(() => {
    // Fallback de seguridad: si después de 5 segundos Firebase no responde, forzamos la entrada al panel
    const fallbackTimer = setTimeout(() => setIsInitializing(false), 5000);

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { 
        console.error("Error de Autenticación:", err);
        setIsInitializing(false); 
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let isSubscribed = true;
    let unsubLogs = () => {};
    let unsubState = () => {};
    let unsubPrices = () => {};

    const initializeAndRescueData = async () => {
      try {
        const officialLogsCol = collection(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4');
        const officialLogsSnap = await getDocs(officialLogsCol);

        if (officialLogsSnap.empty) {
           console.log("Sembrando base de datos con los datos exactos del Excel (Mayo 1 al 4)...");
           const batch = writeBatch(db);
           DATOS_HISTORICOS.forEach(log => {
              const ref = doc(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4', log.id.toString());
              batch.set(ref, log);
           });
           
           const officialStateRef = doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4');
           batch.set(officialStateRef, { readings: STOCK_INICIAL_AL_DIA_ACTUAL });
           
           await batch.commit();
        }

        if (!isSubscribed) return;

        unsubLogs = onSnapshot(officialLogsCol, (snap) => {
           const fetchedLogs = snap.docs.map(d => d.data());
           fetchedLogs.sort((a: any, b: any) => a.date.localeCompare(b.date));
           if (fetchedLogs.length > 0) setDailyLogs(fetchedLogs);
           setIsInitializing(false);
        }, (error) => {
           console.error("Error cargando historial en vivo:", error);
           setIsInitializing(false);
        });

        const officialStateRef = doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4');
        unsubState = onSnapshot(officialStateRef, (docSnap) => {
           if (docSnap.exists()) setTankReadings(docSnap.data().readings);
        }, (error) => {
           console.error("Error cargando varillas en vivo:", error);
        });

        const pricesDoc = doc(db, 'artifacts', appId, 'public', 'data', 'configuracion', 'precios');
        unsubPrices = onSnapshot(pricesDoc, (docSnap) => {
          if (docSnap.exists()) {
            setFuelPrices(docSnap.data());
            setEditPrices(docSnap.data());
          }
        }, (error) => {
           console.error("Error cargando precios en vivo:", error);
        });

      } catch (error) {
        console.error("Error general de conexión con la base de datos:", error);
        setIsInitializing(false); 
      }
    };

    initializeAndRescueData();

    return () => {
      isSubscribed = false;
      unsubLogs(); unsubState(); unsubPrices();
    };
  }, [user]);

  const saveCurrentStateToCloud = async (readings: any) => {
    if (!user) return;
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings }); } catch (err) {}
  };

  const saveLogToCloud = async (log: any) => {
    if (!user) return;
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4', log.id.toString()), log); } catch (err) {}
  };

  const handleSavePrices = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'configuracion', 'precios'), editPrices);
      setModalConfig({ isOpen: true, type: 'success', title: 'Precios Actualizados', message: 'Los precios de costo se han guardado correctamente.', inputValue: '', onConfirm: null });
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // FILTRADO POR MES
  // ==========================================
  const availableMonths = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const months = new Set([currentMonth, ...dailyLogs.map(log => log.date.substring(0, 7))]);
    return [...months].sort().reverse();
  }, [dailyLogs]);

  const [selectedMonthStr, setSelectedMonthStr] = useState('');

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonthStr)) {
      setSelectedMonthStr(availableMonths[0]);
    }
  }, [availableMonths, selectedMonthStr]);

  const filteredLogs = useMemo(() => {
    if (!selectedMonthStr) return [];
    const logs = dailyLogs.filter(log => log.date.startsWith(selectedMonthStr));
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyLogs, selectedMonthStr]);

  const formatMonthDisplay = (yyyyMm: string) => {
    if (!yyyyMm) return '';
    const [year, month] = yyyyMm.split('-');
    return `${MONTH_NAMES[month]} ${year}`;
  };

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  // ==========================================
  // EXPORTACIÓN ORDENADA A EXCEL
  // ==========================================
  const exportarExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFFecha;";
    TANKS_CONFIG.forEach(t => { csvContent += `${t.name};;;;`; });
    csvContent += "Responsable\n;";
    TANKS_CONFIG.forEach(() => { csvContent += "Inicio;Desc.;Fin;LV;"; });
    csvContent += "\n";

    const sortedLogs = [...filteredLogs].sort((a, b) => a.date.localeCompare(b.date));

    sortedLogs.forEach(log => {
      let row = `${formatDateDisplay(log.date)};`;
      TANKS_CONFIG.forEach(t => {
        const data = log.tanks[t.id];
        row += `${Math.round(data.inicio)};${data.desc > 0 ? Math.round(data.desc) : ''};${Math.round(data.fin)};${Math.round(data.lv)};`;
      });
      row += `${log.responsable}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Declaracion_${formatMonthDisplay(selectedMonthStr).replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setModalConfig({ isOpen: true, type: 'success', title: 'Archivo Descargado', message: `La planilla se ha exportado correctamente en orden cronológico.`, inputValue: '', onConfirm: null });
  };

  // ==========================================
  // LÓGICA DE SEGURIDAD (PIN: 225903)
  // ==========================================
  const handleLogin = (e: any) => {
    e.preventDefault();
    if (pinInput === '225903') { 
      setIsAdmin(true); setPinInput(''); 
    } else { 
      setModalConfig({ isOpen: true, type: 'error', title: 'Acceso Denegado', message: 'El PIN ingresado es incorrecto.', inputValue: '', onConfirm: null }); 
      setPinInput(''); 
    }
  };
  const handleLogout = () => { setIsAdmin(false); setActiveTab('varillas'); };

  // ==========================================
  // LÓGICA DE EDICIÓN MANUAL (EDITOR HISTORIAL)
  // ==========================================
  const loadDataForDate = (selectedDate: string) => {
    const existingLog = dailyLogs.find(log => log.date === selectedDate);
    
    if (existingLog) {
      setManualEdit({
        isOpen: true, id: existingLog.id, date: existingLog.date, responsable: existingLog.responsable,
        tanks: { ...existingLog.tanks }
      });
    } else {
      const priorLogs = dailyLogs.filter(log => log.date < selectedDate).sort((a,b) => b.date.localeCompare(a.date));
      const lastLog = priorLogs.length > 0 ? priorLogs[0] : null;

      const freshTanks: any = {};
      TANKS_CONFIG.forEach(t => {
        freshTanks[t.id] = { inicio: lastLog ? lastLog.tanks[t.id].fin : 0, desc: 0, fin: 0, lv: 0 };
      });

      setManualEdit({
        isOpen: true, id: null, date: selectedDate, responsable: 'Gerencia (Carga Manual)',
        tanks: freshTanks
      });
    }
  };

  const handleManualTankChange = (tankId: string, field: string, value: string) => {
    setManualEdit((prev: any) => ({
      ...prev,
      tanks: { ...prev.tanks, [tankId]: { ...prev.tanks[tankId], [field]: value } }
    }));
  };

  const saveManualEntry = async () => {
    if (!user) return;
    const logIdToSave = manualEdit.id || Date.now();
    const newLog: any = { id: logIdToSave, date: manualEdit.date, responsable: manualEdit.responsable, tanks: {} };

    TANKS_CONFIG.forEach(tank => {
      const tData = manualEdit.tanks[tank.id];
      const inicio = parseFloat(tData.inicio) || 0;
      const desc = parseFloat(tData.desc) || 0;
      const fin = parseFloat(tData.fin) || 0;
      newLog.tanks[tank.id] = { inicio, desc, fin, lv: inicio + desc - fin };
    });

    try {
      await saveLogToCloud(newLog);
      setManualEdit((prev: any) => ({ ...prev, isOpen: false }));
      setModalConfig({ isOpen: true, type: 'success', title: 'Registro Actualizado', message: `El registro del día ${formatDateDisplay(manualEdit.date)} fue guardado correctamente.`, inputValue: '', onConfirm: null });
    } catch (error) { console.error(error); }
  };

  // ==========================================
  // LÓGICA DE OPERACIÓN GENERAL
  // ==========================================
  const getAssignedTank = (cisternId: string) => {
    for (const [tankId, cisterns] of Object.entries(tankOrders)) { if ((cisterns as any).includes(cisternId)) return tankId; }
    return null;
  };
  const assignCistern = (tankId: string, cisternId: string) => { if (cisternId) setTankOrders((prev: any) => ({ ...prev, [tankId]: [...prev[tankId], cisternId] })); };
  const removeCistern = (tankId: string, cisternId: string) => { setTankOrders((prev: any) => ({ ...prev, [tankId]: prev[tankId].filter((id: any) => id !== cisternId) })); };
  const handleTruckChange = (truckType: 'estandar' | 'chico') => { setSelectedTruck(truckType); setTankOrders(TANKS_CONFIG.reduce((acc, tank) => { acc[tank.id] = []; return acc; }, {} as any)); };

  const calcularCostoPedido = () => {
    let summary: any = { super: 0, quantium_nafta: 0, x10: 0, quantium_diesel: 0 };
    Object.keys(tankOrders).forEach(tankId => {
      const fuelType: any = TANKS_CONFIG.find(t => t.id === tankId)?.fuel;
      const assignedLiters = tankOrders[tankId].reduce((sum: number, cid: string) => {
        const c = currentCisterns.find(x => x.id === cid);
        return sum + (c ? c.max : 0);
      }, 0);
      summary[fuelType] += assignedLiters;
    });

    const details = Object.keys(summary).filter(k => summary[k] > 0).map(k => ({
      name: (FUEL_TYPES as any)[k].name, color: (FUEL_TYPES as any)[k].color, liters: summary[k], cost: summary[k] * fuelPrices[k]
    }));
    const total = details.reduce((sum, item) => sum + item.cost, 0);
    return { details, total };
  };

 // ==========================================
  // CÁLCULO VOLUMÉTRICO BLINDADO (Evita el caché viejo)
  // ==========================================
  const handleTankChange = (tankId: string, field: string, value: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tankId]: { ...prev[tankId], [field]: value } };
      
      if (field === 'mm') { 
        const mm = parseFloat(value) || 0;
        
        // Medidas EXACTAS inyectadas directamente a la fuerza (Tk 40m3, 20m3, 10m3)
        const DIMENSIONES: any = {
          't12': { max: 41562, dia: 2264 },
          't13': { max: 41562, dia: 2264 },
          't14': { max: 20880, dia: 2264 },
          't15': { max: 20880, dia: 2264 },
          't10': { max: 10000, dia: 2088 },
          't9':  { max: 10000, dia: 2088 },
          't8':  { max: 10000, dia: 1837 }
        };
        
        const tank = DIMENSIONES[tankId];
        
        if (!tank || mm <= 0) {
          updated[tankId].liters = 0;
        } else if (mm >= tank.dia) {
          updated[tankId].liters = tank.max;
        } else {
          // Fórmula trigonométrica real para tanques horizontales
          const r = tank.dia / 2;
          const h = mm;
          const area = Math.pow(r, 2) * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - Math.pow(h, 2));
          const totalArea = Math.PI * Math.pow(r, 2);
          updated[tankId].liters = Math.round((area / totalArea) * tank.max);
        }
      }
      return updated;
    });
  };

  const guardarDescarga = async () => {
    await saveCurrentStateToCloud(tankReadings);
    
    // Limpiamos SOLO las casillas de descarga después de guardar
    setTankReadings((prev: any) => {
      const reset = { ...prev };
      Object.keys(reset).forEach(k => {
         reset[k] = { ...reset[k], desc: '' };
      });
      return reset;
    });

    setModalConfig({ 
      isOpen: true, 
      type: 'success', 
      title: 'Descarga Sincronizada', 
      message: 'Los litros del camión se guardaron en la nube y ya se sumaron al monitor.', 
      inputValue: '', 
      onConfirm: () => setActiveTab('monitor') 
    });
  };

  const iniciarCierreDia = () => {
    if (!TANKS_CONFIG.some(tank => tankReadings[tank.id].mm !== '' || tankReadings[tank.id].liters > 0)) {
       setModalConfig({ isOpen: true, type: 'error', title: 'Faltan datos', message: 'Debe ingresar al menos una medición de varilla final o los litros finales correspondientes.', inputValue: '', onConfirm: null });
       return;
    }
    const fechaAyerIso = getYesterdayISOString();
    setModalConfig({ isOpen: true, type: 'prompt', title: 'Firma de Responsable', message: `Este registro corresponderá al cierre de ayer (${formatDateDisplay(fechaAyerIso)}). Ingrese su firma:`, inputValue: '', onConfirm: (responsable: string) => ejecutarCierreDia(responsable, fechaAyerIso) });
  };

  const ejecutarCierreDia = async (responsable: string, fechaAyerIso: string) => {
    if (!responsable || responsable.trim() === '') return;
    
    const priorLogs = dailyLogs.filter(log => log.date < fechaAyerIso).sort((a,b) => b.date.localeCompare(a.date));
    const lastLog = priorLogs.length > 0 ? priorLogs[0] : null; 
    
    const newLog: any = { id: Date.now(), date: fechaAyerIso, responsable: responsable, tanks: {} };

    TANKS_CONFIG.forEach(tank => {
      const inicio = lastLog ? lastLog.tanks[tank.id].fin : 0; 
      const desc = parseFloat(tankReadings[tank.id].desc) || 0; 
      const fin = parseFloat(tankReadings[tank.id].liters) || 0; 
      newLog.tanks[tank.id] = { inicio, desc, fin, lv: inicio + desc - fin };
    });

    await saveLogToCloud(newLog);
    
    const nuevoEstado: any = {};
    TANKS_CONFIG.forEach(t => { nuevoEstado[t.id] = { mm: '', liters: newLog.tanks[t.id].fin, desc: '' }; });
    await saveCurrentStateToCloud(nuevoEstado); 

    setTimeout(() => {
      setModalConfig({ isOpen: true, type: 'success', title: '¡Cierre Exitoso!', message: `Los datos se han guardado con fecha ${formatDateDisplay(fechaAyerIso)} en la nube.`, inputValue: '', onConfirm: () => setActiveTab('registro') });
    }, 100);
  };

  // ==========================================
  // PANTALLA DE CARGA 
  // ==========================================
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg flex flex-col items-center max-w-sm w-full">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Conectando...</h2>
          <p className="text-slate-500 text-center mt-2 text-sm">Rescatando información previa y sincronizando la estación...</p>
        </div>
      </div>
    );
  }

  const orderCotization = calcularCostoPedido();

  // ==========================================
  // UI - RENDERIZADO PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-8 font-sans text-slate-800 relative">
      
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${modalConfig.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : modalConfig.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
              {modalConfig.type === 'error' && <AlertTriangle className="w-6 h-6" />}
              {modalConfig.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {modalConfig.type === 'prompt' && <User className="w-6 h-6" />}
              <h3 className="font-bold text-lg">{modalConfig.title}</h3>
              <button onClick={closeModal} className="ml-auto text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4 font-medium">{modalConfig.message}</p>
              {modalConfig.type === 'prompt' && (
                <input type="text" autoFocus value={modalConfig.inputValue} onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})} onKeyDown={(e) => { if (e.key === 'Enter' && modalConfig.inputValue.trim() !== '') handleModalConfirm(); }} placeholder="Ej. Bauman D." className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700" />
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
              {modalConfig.type === 'prompt' && <button onClick={closeModal} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>}
              <button onClick={handleModalConfirm} disabled={modalConfig.type === 'prompt' && modalConfig.inputValue.trim() === ''} className={`px-6 py-2 font-bold text-white rounded-lg transition-colors ${modalConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' : modalConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'}`}>
                {modalConfig.type === 'prompt' ? 'Confirmar' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {manualEdit.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-indigo-600"/> 
                Editor de Historial (Carga Manual)
              </h3>
              <button onClick={() => setManualEdit({...manualEdit, isOpen: false})} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-800">Seleccione la fecha que desea corregir. Si el día no existe, el sistema pre-completará el "Inicio" tomando los datos del último día cerrado. Modifique los litros y presione Guardar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha del Registro</label>
                  <input type="date" value={manualEdit.date} onChange={(e) => loadDataForDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsable</label>
                  <input type="text" value={manualEdit.responsable} onChange={(e) => setManualEdit({...manualEdit, responsable: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold focus:border-indigo-500 outline-none" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tanque / Producto</th>
                      <th className="px-4 py-3">Stock Inicio (L)</th>
                      <th className="px-4 py-3 text-amber-600">Descarga (L)</th>
                      <th className="px-4 py-3">Varilla Fin (L)</th>
                      <th className="px-4 py-3 text-indigo-600">Litros Vendidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {TANKS_CONFIG.map(tank => {
                      const tData = manualEdit.tanks[tank.id];
                      const inicio = parseFloat(tData.inicio) || 0;
                      const desc = parseFloat(tData.desc) || 0;
                      const fin = parseFloat(tData.fin) || 0;
                      const lv = inicio + desc - fin;
                      
                      return (
                        <tr key={tank.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${tank.color}`}></div> {tank.name}
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" value={tData.inicio} onChange={(e) => handleManualTankChange(tank.id, 'inicio', e.target.value)} className="w-24 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium" />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" value={tData.desc} onChange={(e) => handleManualTankChange(tank.id, 'desc', e.target.value)} className="w-24 p-1.5 border border-amber-300 bg-amber-50 text-amber-800 rounded focus:ring-1 focus:ring-amber-500 outline-none font-bold" />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" value={tData.fin} onChange={(e) => handleManualTankChange(tank.id, 'fin', e.target.value)} className="w-24 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium" />
                          </td>
                          <td className="px-4 py-3 font-black text-indigo-600">
                            {Math.round(lv)} L
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setManualEdit({...manualEdit, isOpen: false})} className="px-4 py-2 text-slate-600 hover:bg-slate-200 font-bold rounded-lg transition-colors">Cancelar</button>
              <button onClick={saveManualEntry} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg">
                <Save className="w-4 h-4"/> Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full mb-6 flex flex-wrap lg:flex-nowrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <button onClick={() => setActiveTab('varillas')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'varillas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Ruler className="w-5 h-5" /> 1. Varillado</button>
        <button onClick={() => setActiveTab('descarga')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'descarga' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Truck className="w-5 h-5" /> 2. Descarga</button>
        <button onClick={() => setActiveTab('monitor')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'monitor' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Database className="w-5 h-5" /> 3. Tanques</button>
        <button onClick={() => setActiveTab('registro')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'registro' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarDays className="w-5 h-5" /> 4. Mensual</button>
        <button onClick={() => setActiveTab('gerencia')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 md:px-4 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'gerencia' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-600 hover:bg-rose-50'}`}>
          {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />} 5. Gerencia
        </button>
      </div>

      <div className="max-w-7xl w-full">
        
        {activeTab === 'varillas' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 xl:p-10 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Ruler className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Cierre de Día Anterior (Matutino)</h1>
                <p className="text-slate-500 text-sm">Ingresa la varilla. Si el litro no coincide con tu tabla, puedes editarlo directamente.</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {TANKS_CONFIG.map((tank) => {
                const descRegistrada = parseFloat(tankReadings[tank.id].desc) || 0;
                return (
                  <div key={tank.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-1/4">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${tank.color}`}></div>{tank.name}</h3>
                      <span className="text-xs text-slate-400">Cap: {tank.maxLiters.toLocaleString('es-AR')} L</span>
                    </div>
                    
                    <div className="flex-1 flex gap-3 w-full">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descarga (Ayer)</label>
                         <div className={`px-3 py-2 rounded-lg text-sm font-bold border ${descRegistrada > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {descRegistrada > 0 ? `+ ${descRegistrada} L` : 'Sin descarga'}
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Varilla (mm)</label>
                        <div className="relative">
                          <input type="number" value={tankReadings[tank.id].mm} onChange={(e) => handleTankChange(tank.id, 'mm', e.target.value)} className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900" placeholder="mm"/>
                          <span className="absolute right-2 top-2 text-slate-400 text-xs font-medium">mm</span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="hidden sm:block w-5 h-5 text-slate-300" />

                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        Stock Final (L) <Edit3 className="w-3 h-3 text-indigo-400" />
                      </label>
                      <div className="w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-between items-center focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                        <input 
                          type="number" 
                          value={tankReadings[tank.id].liters === 0 && tankReadings[tank.id].mm === '' ? '' : Math.round(tankReadings[tank.id].liters)} 
                          onChange={(e) => handleTankChange(tank.id, 'liters', e.target.value)}
                          className="bg-transparent w-full outline-none font-bold text-indigo-700" 
                          placeholder="0"
                        />
                        <span className="text-indigo-400 text-xs font-bold ml-1">L</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 leading-tight">Si no coincide con la tabla de aforo, edítalo.</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={iniciarCierreDia} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 text-lg">
              <Send className="w-6 h-6" /> Registrar Cierre de Ayer
            </button>
          </div>
        )}

        {activeTab === 'descarga' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 xl:p-10 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Truck className="w-8 h-8" /></div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Cargar Información de Descarga</h1>
                <p className="text-slate-500 text-sm font-medium text-amber-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Los litros ingresados actualizan el stock en la nube al instante.</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {TANKS_CONFIG.map((tank) => {
                const lastLog = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1] : null;
                const inicio = lastLog ? lastLog.tanks[tank.id].fin : 0;
                const descIngresada = parseFloat(tankReadings[tank.id].desc) || 0;
                const stockPostDescarga = inicio + descIngresada;

                return (
                  <div key={tank.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-1/4">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${tank.color}`}></div>{tank.name}</h3>
                      <span className="text-xs text-slate-400">Cap: {tank.maxLiters.toLocaleString('es-AR')} L</span>
                    </div>
                    <div className="flex-1 flex gap-3 w-full">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descarga (L)</label>
                        <div className="relative">
                          <input type="number" value={tankReadings[tank.id].desc} onChange={(e) => handleTankChange(tank.id, 'desc', e.target.value)} className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-900" placeholder="Ej. 6000"/>
                          <span className="absolute right-2 top-2 text-slate-400 text-xs font-medium">L</span>
                        </div>
                      </div>
                    </div>
                     <ArrowRight className="hidden sm:block w-5 h-5 text-slate-300" />
                    <div className="w-full sm:w-1/4">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Stock Post Descarga</label>
                      <div className="w-full px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg font-bold text-amber-700 flex justify-between">
                        <span>{Math.round(stockPostDescarga).toLocaleString('es-AR')}</span><span className="text-amber-400 text-xs">L</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={guardarDescarga} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/30 text-lg">
              <CheckCircle2 className="w-6 h-6" /> Confirmar e Ir al Monitor
            </button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-6 text-white flex flex-col h-[600px] animate-in fade-in duration-300">
            <div className="flex justify-between items-start mb-8 pb-4 border-b border-slate-700">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3"><Database className="w-7 h-7 text-emerald-400" /> Monitor de Tanques</h1>
                <p className="text-slate-400 text-sm mt-1">Muestra el volumen en tiempo real (Cierre Anterior + Descargas del Día).</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-wrap items-end justify-center gap-4 md:gap-8 mt-4">
              {TANKS_CONFIG.map((tank) => {
                const lastLog = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1] : null;
                const inicio = lastLog ? lastLog.tanks[tank.id].fin : 0;
                const descHoy = parseFloat(tankReadings[tank.id].desc) || 0;
                const currentLiters = inicio + descHoy;
                const percentage = Math.min(100, Math.max(0, (currentLiters / tank.maxLiters) * 100));
                const isLow = percentage < 20 && currentLiters > 0;
                
                const visualHeight = tank.maxLiters === 39000 ? 'h-64' : tank.maxLiters === 19000 ? 'h-48' : 'h-36';
                const visualWidth = tank.maxLiters === 39000 ? 'w-24' : 'w-20';

                return (
                  <div key={`visual-${tank.id}`} className="flex flex-col items-center flex-shrink-0">
                    <div className="text-center mb-2"><div className="text-xs font-bold text-white">{Math.round(percentage)}%</div></div>
                    
                    <div className={`${visualWidth} ${visualHeight} bg-slate-700 rounded-t-xl rounded-b-lg relative overflow-hidden shadow-inner border border-slate-600 flex items-end justify-center group`}>
                      <div className="absolute inset-0 bg-slate-800/60 z-10"></div>
                      <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 flex items-center justify-center p-2 text-center backdrop-blur-sm">
                        <span className="text-xs font-bold text-white">{Math.round(currentLiters).toLocaleString('es-AR')} L</span>
                      </div>
                      <div className={`w-full transition-all duration-1000 ease-out relative z-20 ${tank.color}`} style={{ height: `${percentage}%` }}>
                        <div className="absolute top-0 left-1.5 w-2 h-full bg-white/20 blur-[1px]"></div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center h-14 w-20 flex flex-col items-center">
                      <div className="text-[10px] font-semibold text-slate-300 leading-tight text-center">{tank.name.replace(/[()]/g, '')}</div>
                      {isLow && <div className="mt-1 inline-flex items-center justify-center gap-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse shadow-md"><AlertTriangle className="w-2.5 h-2.5" /> PEDIR</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><FileText className="w-8 h-8" /></div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Planilla de Declaración</h1>
                  <p className="text-slate-500 text-sm">Registro de movimientos guardados en la nube.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <Calendar className="w-5 h-5 text-slate-400" />
                <select className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer" value={selectedMonthStr} onChange={(e) => setSelectedMonthStr(e.target.value)}>
                  {availableMonths.map(month => (<option key={month} value={month}>{formatMonthDisplay(month)}</option>))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 pb-4">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 border-b border-r font-bold sticky left-0 bg-slate-50 z-10">Fecha</th>
                    {TANKS_CONFIG.map(t => (
                      <th key={t.id} colSpan={4} className="px-2 py-2 border-b border-r text-center font-bold">
                        <div className="flex items-center justify-center gap-1"><div className={`w-2 h-2 rounded-full ${t.color}`}></div>{t.name}</div>
                      </th>
                    ))}
                    <th rowSpan={2} className="px-4 py-3 border-b border-l font-bold sticky right-0 bg-slate-50 z-10">Resp.</th>
                  </tr>
                  <tr>
                    {TANKS_CONFIG.map(t => (
                      <React.Fragment key={t.id + '-sub'}>
                        <th className="px-2 py-2 border-b border-r bg-slate-100/50 text-center font-medium">Inicio</th>
                        <th className="px-2 py-2 border-b border-r bg-amber-50/50 text-center font-medium text-amber-700">Desc.</th>
                        <th className="px-2 py-2 border-b border-r bg-slate-100/50 text-center font-medium">Fin</th>
                        <th className="px-2 py-2 border-b border-r bg-indigo-50/50 text-center font-bold text-indigo-700">LV</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                      <td className="px-4 py-3 border-r sticky left-0 bg-white font-medium text-slate-700 z-10">{formatDateDisplay(log.date)}</td>
                      {TANKS_CONFIG.map(t => {
                        const data = log.tanks[t.id];
                        return (
                          <React.Fragment key={t.id + '-data'}>
                            <td className="px-2 py-3 border-r text-center text-slate-600">{Math.round(data.inicio)}</td>
                            <td className="px-2 py-3 border-r text-center text-amber-600 font-medium">{data.desc > 0 ? Math.round(data.desc) : ''}</td>
                            <td className="px-2 py-3 border-r text-center text-slate-800 font-bold">{Math.round(data.fin)}</td>
                            <td className="px-2 py-3 border-r text-center text-indigo-600 font-bold bg-indigo-50/30">{Math.round(data.lv)}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-4 py-3 border-l sticky right-0 bg-white text-slate-600 font-medium z-10">{log.responsable}</td>
                    </tr>
                  ))}
                  
                  {selectedMonthStr === getYesterdayISOString().substring(0, 7) && (
                    <tr className="bg-amber-50/60 hover:bg-amber-100 border-b border-amber-200 transition-colors">
                      <td className="px-4 py-3 border-r sticky left-0 bg-amber-50 font-bold text-amber-700 z-10"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> En curso</div></td>
                      {TANKS_CONFIG.map(t => {
                        const lastLog = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1] : null;
                        const inicio = lastLog ? lastLog.tanks[t.id].fin : 0;
                        const desc = parseFloat(tankReadings[t.id].desc) || 0;
                        const hasVarilla = tankReadings[t.id].mm !== '';
                        const fin = hasVarilla ? tankReadings[t.id].liters : null;
                        const lv = hasVarilla ? (inicio + desc - fin) : null;
                        
                        return (
                          <React.Fragment key={t.id + '-live'}>
                            <td className="px-2 py-3 border-r text-center text-slate-500 font-medium">{Math.round(inicio)}</td>
                            <td className="px-2 py-3 border-r text-center text-amber-700 font-bold">{desc > 0 ? `+${Math.round(desc)}` : '-'}</td>
                            <td className="px-2 py-3 border-r text-center text-slate-500 font-medium">{hasVarilla ? Math.round(fin) : '-'}</td>
                            <td className="px-2 py-3 border-r text-center text-indigo-500 font-bold">{hasVarilla ? Math.round(lv) : '-'}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-4 py-3 border-l sticky right-0 bg-amber-50 text-amber-600 font-medium z-10">Pendiente...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gerencia' && (
          <div className="animate-in fade-in duration-300">
            {!isAdmin ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 max-w-sm mx-auto text-center mt-10">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldAlert className="w-8 h-8" /></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
                <form onSubmit={handleLogin} className="space-y-4 mt-8">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Key className="w-5 h-5" /></div>
                    <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Ingrese su PIN" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-bold text-center tracking-widest text-lg"/>
                  </div>
                  <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">Desbloquear Panel</button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 xl:p-10 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><Unlock className="w-8 h-8" /></div>
                    <div><h1 className="text-2xl font-bold text-slate-800">Panel de Gerencia</h1><p className="text-slate-500 text-sm">Visión general y descargas.</p></div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <select className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-sm" value={selectedMonthStr} onChange={(e) => setSelectedMonthStr(e.target.value)}>
                        {availableMonths.map(month => (<option key={month} value={month}>{formatMonthDisplay(month)}</option>))}
                      </select>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors">Cerrar Sesión</button>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Database className="w-6 h-6 text-indigo-600" /> Planificador de Pedidos (Tanques)
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">Asigne cisternas a cada tanque para armar el pedido de forma exacta.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {TANKS_CONFIG.map(tank => {
                        const lastLog = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1] : null;
                        const inicio = lastLog ? lastLog.tanks[tank.id].fin : 0;
                        const descHoy = parseFloat(tankReadings[tank.id].desc) || 0;
                        const currentStock = inicio + descHoy;
                        const freeSpace = tank.maxLiters - currentStock;
                        
                        const orderTotal = tankOrders[tank.id].reduce((sum: number, cid: string) => {
                          const c = currentCisterns.find(x => x.id === cid);
                          return sum + (c ? c.max : 0);
                        }, 0);
                        const isOverfilled = orderTotal > freeSpace;

                        return (
                          <div key={tank.id} className="bg-white border border-slate-200 rounded-2xl p-4 relative overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-indigo-300">
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${tank.color}`}></div>
                            <h4 className="font-bold text-slate-700 mb-3 mt-1">{tank.name}</h4>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Stock Actual</span>
                                <span className="text-xs font-black text-slate-700">{Math.round(currentStock).toLocaleString('es-AR')} L</span>
                              </div>
                              <div className="flex justify-between items-center bg-indigo-50 p-1.5 rounded border border-indigo-100">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase">Puede Recibir</span>
                                <span className="text-sm font-black text-indigo-700">{Math.round(freeSpace).toLocaleString('es-AR')} L</span>
                              </div>
                            </div>

                            <div className={`mt-auto p-2 rounded-lg border ${orderTotal > 0 ? (isOverfilled ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${orderTotal > 0 ? (isOverfilled ? 'text-red-600' : 'text-amber-600') : 'text-slate-400'}`}>
                                  <PackagePlus className="w-3 h-3" /> Pedido
                                </span>
                                <span className={`text-sm font-black ${orderTotal > 0 ? (isOverfilled ? 'text-red-600' : 'text-amber-700') : 'text-slate-400'}`}>
                                  {orderTotal > 0 ? `${orderTotal.toLocaleString('es-AR')} L` : '0 L'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 items-center">
                                {tankOrders[tank.id].map((cid: string) => (
                                  <span key={cid} className="text-[10px] bg-white text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                    {cid}
                                    <button onClick={() => removeCistern(tank.id, cid)} className="hover:text-red-500 outline-none"><X className="w-3 h-3"/></button>
                                  </span>
                                ))}
                                
                                <select 
                                  className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-slate-600 outline-none cursor-pointer hover:border-amber-400 font-medium"
                                  value=""
                                  onChange={(e) => assignCistern(tank.id, e.target.value)}
                                >
                                  <option value="" disabled>+ Añadir</option>
                                  {currentCisterns.filter(c => !getAssignedTank(c.id)).map(c => (
                                    <option key={c.id} value={c.id}>{c.id} ({c.max}L)</option>
                                  ))}
                                </select>
                              </div>
                              {isOverfilled && <div className="text-[9px] text-red-500 font-bold mt-1.5 leading-tight">¡Atención! El pedido supera el espacio libre.</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-amber-50/50 rounded-3xl border border-amber-100 p-6 shadow-sm lg:col-span-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Truck className="w-6 h-6 text-amber-500" />
                          <h3 className="text-xl font-bold text-slate-800">Distribución de Cisternas</h3>
                        </div>
                        
                        <div className="flex bg-white rounded-lg p-1 border border-amber-200 shadow-sm">
                          <button onClick={() => handleTruckChange('estandar')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedTruck === 'estandar' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-amber-50'}`}>Camión Estándar</button>
                          <button onClick={() => handleTruckChange('chico')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedTruck === 'chico' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-amber-50'}`}>Camión Chico</button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
                        {currentCisterns.map(cisterna => {
                          const assignedTankId = getAssignedTank(cisterna.id);
                          const tankInfo = assignedTankId ? TANKS_CONFIG.find(t=>t.id === assignedTankId) : null;

                          return (
                            <div key={cisterna.id} className={`border rounded-xl p-3 text-center transition-all ${tankInfo ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-amber-300 shadow-sm hover:border-amber-400'}`}>
                              <div className={`font-black text-lg mb-1 border-b pb-1 ${tankInfo ? 'text-slate-400 border-slate-200' : 'text-amber-700 border-amber-100'}`}>{cisterna.id}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Capacidad</div>
                              <div className={`text-sm font-bold ${tankInfo ? 'text-slate-400' : 'text-slate-700'}`}>{cisterna.max.toLocaleString('es-AR')} L</div>
                              
                              <div className="mt-3">
                                {tankInfo ? (
                                  <div className={`text-[9px] font-bold text-white px-2 py-1 rounded-full ${tankInfo.color} truncate shadow-sm`}>En {tankInfo.name.split(' ')[0]}</div>
                                ) : (
                                  <div className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Disponible</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 text-white shadow-xl flex flex-col">
                      <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5" /> Costo del Pedido Actual
                      </h3>
                      
                      <div className="flex-1 space-y-3">
                        {orderCotization.details.length === 0 ? (
                          <div className="text-slate-400 text-sm text-center py-6 border border-dashed border-slate-600 rounded-xl">
                            No hay cisternas asignadas al pedido.
                          </div>
                        ) : (
                          orderCotization.details.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-end border-b border-slate-700 pb-2">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                  <span className="font-bold text-sm text-slate-200">{item.name}</span>
                                </div>
                                <div className="text-xs text-slate-400">{item.liters.toLocaleString('es-AR')} L</div>
                              </div>
                              <div className="font-bold text-emerald-300">
                                ${item.cost.toLocaleString('es-AR')}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="pt-4 mt-2 border-t border-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400 uppercase font-bold tracking-wider">Total a Pagar</span>
                          <span className="text-2xl font-black text-white">${orderCotization.total.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-indigo-600" /> Litros Vendidos ({formatMonthDisplay(selectedMonthStr).split(' ')[0]})
                    </h3>
                    <div className="space-y-3">
                      {['super', 'quantium_nafta', 'x10', 'quantium_diesel'].map(fuelId => {
                        const fuelConf: any = (FUEL_TYPES as any)[fuelId];
                        let totalLV = 0;
                        filteredLogs.forEach(log => {
                          if (log.responsable.includes('Sistema')) return;
                          TANKS_CONFIG.filter(t => t.fuel === fuelId).forEach(t => { totalLV += log.tanks[t.id].lv; });
                        });
                        const textColorClass = fuelConf.color.replace('bg-', 'text-');
                        return (
                          <div key={fuelId} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className="text-slate-500 text-sm font-semibold">{fuelConf.name}</span>
                            <span className={`text-base font-black ${textColorClass}`}>{Math.round(totalLV).toLocaleString('es-AR')} L</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <CircleDollarSign className="w-5 h-5 text-amber-500" /> Precios de Costo
                    </h3>
                    <p className="text-slate-500 text-xs mb-4">Actualice el precio unitario para calcular el pedido.</p>
                    
                    <div className="space-y-2 flex-1">
                      {['super', 'quantium_nafta', 'x10', 'quantium_diesel'].map(fuelId => {
                        return (
                          <div key={`price-${fuelId}`} className="flex justify-between items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-24">{(FUEL_TYPES as any)[fuelId].name}</span>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1.5 text-slate-400 font-bold">$</span>
                              <input type="number" value={editPrices[fuelId]} onChange={(e) => setEditPrices({...editPrices, [fuelId]: parseFloat(e.target.value) || 0})} className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-amber-400" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <button onClick={handleSavePrices} className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 text-sm">
                      <Save className="w-4 h-4" /> Guardar Precios
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col shadow-sm flex-1">
                      <h3 className="text-lg font-bold text-indigo-800 mb-1 flex items-center gap-2">
                        <Edit3 className="w-5 h-5" /> Editor de Historial
                      </h3>
                      <p className="text-indigo-700 text-xs mb-4 flex-1">
                        Cargue días olvidados o modifique registros con errores.
                      </p>
                      <button onClick={() => loadDataForDate(getYesterdayISOString())} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm">
                         Editar / Cargar Días
                      </button>
                    </div>

                    <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col shadow-sm flex-1">
                      <h3 className="text-lg font-bold text-emerald-800 mb-1 flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Exportar a Excel
                      </h3>
                      <p className="text-emerald-700 text-xs mb-4 flex-1">
                        Descargue el registro completo y ordenado.
                      </p>
                      <button onClick={exportarExcel} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm">
                        <Download className="w-4 h-4" /> Exportar CSV 
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}