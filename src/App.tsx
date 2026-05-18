import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Fuel, CircleDollarSign, Droplets, PlusCircle, Clock, FileText, Trash2, ClipboardList, Database, Ruler, AlertTriangle, ArrowRight, Send, Truck, CheckCircle2, Save, User, X, Lock, Unlock, Download, ShieldAlert, Key, Info, PackagePlus, Calendar, Loader2, Calculator, History, Edit3, MessageSquare, Camera, Eye, Printer, Check, BarChart3 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch, getDocs, addDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// IMPORTACIÓN DE ICONOS PERSONALIZADOS
import PlayaIcon from './assets/playa.png'; 
import SpotIcon from './assets/spot.png';
import AxionLogo from './assets/logo.png'; 

// ==========================================
// CONFIGURACIONES Y LISTAS OPERATIVAS
// ==========================================
const SPOT_TASKS = [
  { id: 's1', title: 'SACAR MEDIALUNAS (21HS / 22HS SAB)', category: 'TAREAS', shift: 'TARDE' },
  { id: 's2', title: 'HORNEAR MEDIALUNAS (06HS / 07HS DOM)', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's3', title: 'ELABORACIÓN DE CARLITOS', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's4', title: 'ELABORACIÓN DE PEBETES', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's5', title: 'ELABORACIÓN DE SANDWICH DE MIGA', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's6', title: 'ELABORACIÓN DE DONAS (DÍA POR MEDIO)', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's7', title: 'ELABORACIÓN DE TRIPLES', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's8', title: 'HORNEAR EMPANADAS (10:00 - 12:30 - 18:00)', category: 'TAREAS', shift: 'AMBOS' },
  { id: 's9', title: 'ELABORACIÓN EMPANADAS J&Q', category: 'TAREAS', shift: 'MAÑANA' },
  { id: 's10', title: 'CORTAR JAMÓN Y QUESOS (15:30HS)', category: 'TAREAS', shift: 'TARDE' },
  { id: 'c1', title: 'COMPRA: VERDULERÍA (JUEVES)', category: 'COMPRAS', shift: 'MAÑANA' },
  { id: 'c2', title: 'COMPRA: PRODUCTOS LIMPIEZA (MIÉRCOLES)', category: 'COMPRAS', shift: 'MAÑANA' },
  { id: 'c3', title: 'COMPRA: SUPERMERCADO (VIERNES)', category: 'COMPRAS', shift: 'MAÑANA' },
  { id: 'c4', title: 'COMPRA: CARNICERÍA (VIERNES)', category: 'COMPRAS', shift: 'MAÑANA' },
  { id: 'p1', title: 'PEDIDO POTIGIAN (VIERNES ANTES 13HS)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p2', title: 'PEDIDO MASSALIN (MARTES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p3', title: 'PEDIDO COCA COLA (MIÉRCOLES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p4', title: 'PEDIDO HORIZONTE (MARTES/JUEVES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p5', title: 'PEDIDO MARTIN LÓPEZ (MARTES/VIERNES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p6', title: 'PEDIDO LA FAMILIA (LUNES/JUEVES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p7', title: 'PEDIDO DIMARKY / BLUMENTHAL (MENSUAL)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p8', title: 'REVISIÓN DE STOCK (JUEVES/VIERNES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p9', title: 'PEDIDO ANTARTIDA (QUINCENAL)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p10', title: 'PEDIDO AXION LOG (BIMESTRAL)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'p11', title: 'PEDIDO DON LUCAS (LUNES)', category: 'PEDIDOS', shift: 'MAÑANA' },
  { id: 'l1', title: 'LIMPIEZA HORNO CON VINAGRE', category: 'LIMPIEZA', shift: 'MAÑANA' },
  { id: 'l2', title: 'LIMPIEZA CARAMELERA (MIÉRCOLES)', category: 'LIMPIEZA', shift: 'MAÑANA' },
  { id: 'l3', title: 'LIMPIEZA MUEBLES (JUEVES)', category: 'LIMPIEZA', shift: 'MAÑANA' },
  { id: 'l4', title: 'LIMPIEZA TOTAL HELADERAS/FREEZER (MENSUAL)', category: 'LIMPIEZA', shift: 'MAÑANA' },
  { id: 'l5', title: 'LIMPIEZA DE PISO', category: 'LIMPIEZA', shift: 'AMBOS' },
  { id: 'l6', title: 'LIMPIEZA VIDRIOS (MIER A VIER)', category: 'LIMPIEZA', shift: 'MAÑANA' },
  { id: 'l7', title: 'LIMPIEZA HORNO CON PASTILLA (CADA 2 DÍAS)', category: 'LIMPIEZA', shift: 'TARDE' },
  { id: 'l8', title: 'REVISIÓN VENCIMIENTOS (DOMINGOS)', category: 'REVISIONES', shift: 'MAÑANA' },
  { id: 'l9', title: 'REVISIÓN PRECIOS IMPRESOS', category: 'REVISIONES', shift: 'MAÑANA' }
];

const CAMIONES_CONFIG = {
  estandar: [
    { id: 'C1', max: 8000 }, { id: 'C2', max: 8000 }, { id: 'C3', max: 6000 },
    { id: 'C4', max: 6000 }, { id: 'C5', max: 6000 }, { id: 'C6', max: 6000 },
    { id: 'C7', max: 8000 }
  ],
  chico: [
    { id: 'C1', max: 8000 }, { id: 'C2', max: 7000 }, { id: 'C3', max: 5900 },
    { id: 'C4', max: 4900 }, { id: 'C5', max: 6000 }, { id: 'C6', max: 7900 }
  ]
};

const TANKS_CONFIG = [
  { id: 't12', name: 'T12 (X10)', maxLiters: 41562, diameterMm: 2264, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't13', name: 'T13 (Súper)', maxLiters: 41562, diameterMm: 2264, color: 'bg-sky-400', fuel: 'super' },
  { id: 't14', name: 'T14 (Quantium D)', maxLiters: 20880, diameterMm: 2264, color: 'bg-slate-400', fuel: 'quantium_diesel' },
  { id: 't15', name: 'T15 (Quantium N)', maxLiters: 20880, diameterMm: 2264, color: 'bg-violet-400', fuel: 'quantium_nafta' },
  { id: 't8', name: 'T8 (Súper)', maxLiters: 10000, diameterMm: 1837, color: 'bg-sky-400', fuel: 'super' },
  { id: 't9', name: 'T9 (X10)', maxLiters: 10000, diameterMm: 2088, color: 'bg-orange-500', fuel: 'x10' },
  { id: 't10', name: 'T10 (Quantium D)', maxLiters: 10000, diameterMm: 2088, color: 'bg-slate-400', fuel: 'quantium_diesel' }
];

const EMPLEADOS = [
  { nombre: "Bauman Daniel", pin: "3801" }, { nombre: "Céspedes Diego", pin: "2056" }, { nombre: "Herman Giuliano", pin: "3467" },
  { nombre: "Mayer Romina", pin: "1545" }, { nombre: "Ulrich Mailin", pin: "1475" }, { nombre: "Zingraf Lucas", pin: "3638" }
];

const DATOS_HISTORICOS = [
  { id: 1714348800000, date: '2026-04-29', responsable: 'Sistema', tanks: { t12: { inicio: 6156, desc: 0, fin: 6156, lv: 0 }, t13: { inicio: 9853, desc: 0, fin: 9853, lv: 0 }, t14: { inicio: 1422, desc: 0, fin: 1422, lv: 0 }, t15: { inicio: 5931, desc: 0, fin: 5931, lv: 0 }, t8: { inicio: 100, desc: 0, fin: 100, lv: 0 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 242, desc: 0, fin: 242, lv: 0 } } },
  { id: 1714435200000, date: '2026-04-30', responsable: 'Sistema', tanks: { t12: { inicio: 6156, desc: 399, fin: 6555, lv: 0 }, t13: { inicio: 9853, desc: -422, fin: 9431, lv: 0 }, t14: { inicio: 1422, desc: 1176, fin: 2598, lv: 0 }, t15: { inicio: 5931, desc: -1103, fin: 4828, lv: 0 }, t8: { inicio: 100, desc: 5460, fin: 5560, lv: 0 }, t9: { inicio: 806, desc: 8039, fin: 8845, lv: 0 }, t10: { inicio: 242, desc: 6027, fin: 6269, lv: 0 } } }
];

const STOCK_INICIAL_AL_DIA_ACTUAL = TANKS_CONFIG.reduce((acc, tank) => {
  acc[tank.id] = { mm: '', liters: DATOS_HISTORICOS[DATOS_HISTORICOS.length - 1].tanks[tank.id].fin, desc: '' };
  return acc;
}, {} as any);

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

signInAnonymously(auth).catch(() => console.log("Firebase Conectado"));

const tankLitrosTrig = (mm: number, config: any): number => {
  if (!mm || mm <= 0) return 0;
  if (mm >= config.diameterMm) return config.maxLiters;
  const r = config.diameterMm / 2;
  const h = Math.max(0, Math.min(mm, config.diameterMm));
  const cosValue = Math.max(-1, Math.min(1, (r - h) / r));
  const area = Math.pow(r, 2) * Math.acos(cosValue) - (r - h) * Math.sqrt(Math.max(0, 2 * r * h - Math.pow(h, 2)));
  return Math.round((area / (Math.PI * Math.pow(r, 2))) * config.maxLiters);
};

// ==========================================
// COMPONENTE BUZÓN RRHH
// ==========================================
const RRHHView = () => {
  const [empleadoSel, setEmpleadoSel] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [sesionActiva, setSesionActiva] = useState<string | null>(null);
  const [subPantalla, setSubPantalla] = useState<string | null>(null);
  const [imgCertificado, setImgCertificado] = useState<string | null>(null);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const enviar = async (tipo: string, contenido: any) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh'), {
        empleado: sesionActiva, tipo, contenido, fecha: new Date().toISOString(), archivado: false
      });
      alert("Enviado con éxito a Gerencia ✅"); setSubPantalla(null); setImgCertificado(null); setTextoMensaje("");
    } catch (e) { alert("Error al enviar"); }
  };

  if (!sesionActiva) return (
    <div className="bg-white p-6 rounded-2xl border max-w-md mx-auto my-4 text-slate-800 shadow-sm">
      <h2 className="text-sm font-black text-center mb-4 uppercase italic flex items-center justify-center gap-2 text-[#E20074]"><User className="w-4 h-4"/> Identificación Personal</h2>
      <select value={empleadoSel} onChange={(e) => setEmpleadoSel(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold mb-3 outline-none text-xs text-slate-700">
        <option value="">-- SELECCIONE SU NOMBRE --</option>
        {EMPLEADOS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
      </select>
      {empleadoSel && <div className="space-y-3 animate-in fade-in">
        <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" className="w-full p-3 text-center text-3xl border rounded-xl font-black outline-none bg-slate-50 tracking-widest text-slate-800" />
        <button onClick={() => {
          const emp = EMPLEADOS.find(e => e.nombre === empleadoSel);
          if (emp && pinInput === emp.pin) { setSesionActiva(emp.nombre); setPinInput(""); } else { alert("PIN Incorrecto"); }
        }} className="w-full bg-[#E20074] text-white py-3 rounded-xl font-black uppercase italic text-xs tracking-wider">Ingresar</button>
      </div>}
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in text-slate-800 max-w-md mx-auto my-2">
      <div className="bg-white p-4 rounded-xl flex justify-between items-center border shadow-sm">
        <p className="font-black text-slate-800 text-xs uppercase italic">Sesión: {sesionActiva}</p>
        <button onClick={() => setSesionActiva(null)} className="text-red-500 font-bold text-[10px] uppercase underline">Salir</button>
      </div>
      {!subPantalla ? (
        <div className="bg-white p-5 rounded-2xl border space-y-2 shadow-sm">
          <button onClick={() => setSubPantalla('vacaciones')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left font-bold text-xs uppercase flex items-center gap-3">📅 Solicitar Vacaciones</button>
          <button onClick={() => setSubPantalla('medico')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left font-bold text-xs uppercase flex items-center gap-3">🏥 Subir Certificado Médico</button>
          <button onClick={() => setSubPantalla('reclamo')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left font-bold text-xs uppercase flex items-center gap-3">✍️ Sugerencias / Reclamos</button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border relative animate-in zoom-in-95 shadow-md">
          <button onClick={() => setSubPantalla(null)} className="absolute top-4 right-4 text-slate-300"><X className="w-5 h-5"/></button>
          {subPantalla === 'vacaciones' && <div className="space-y-3">
            <input type="date" value={fechaOriginalDesde => setFechaDesde(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm text-slate-700" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm text-slate-700" />
            <button onClick={() => enviar("VACACIONES", `Del ${fechaDesde} al ${fechaHasta}`)} className="w-full bg-[#E20074] text-white py-3 rounded-xl font-black uppercase text-xs">Enviar Solicitud</button>
          </div>}
          {subPantalla === 'medico' && <div className="space-y-3 text-center">
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { const reader = new FileReader(); reader.onloadend = () => setImgCertificado(reader.result as string); reader.readAsDataURL(file); }
            }} />
            {!imgCertificado ? <button onClick={() => fileRef.current?.click()} className="w-full py-10 border-2 border-dashed rounded-xl text-slate-400 font-bold text-xs uppercase flex flex-col items-center gap-2"><Camera className="w-5 h-5"/> Tomar Foto</button> : <img src={imgCertificado} className="w-full rounded-xl border mb-2" />}
            <button disabled={!imgCertificado} onClick={() => enviar("MEDICO", imgCertificado)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-xs">Confirmar Envío</button>
          </div>}
          {subPantalla === 'reclamo' && <div className="space-y-3">
            <textarea value={textoMensaje} onChange={(e) => setTextoMensaje(e.target.value)} className="w-full h-32 p-3 bg-slate-50 border rounded-xl font-medium text-sm outline-none text-slate-700" placeholder="Escriba su mensaje..." />
            <button onClick={() => enviar("SUGERENCIA", textoMensaje)} className="w-full bg-rose-600 text-white py-3 rounded-xl font-black uppercase text-xs">Enviar Nota</button>
          </div>}
        </div>
      )}
    </div>
  );
};

// ==========================================
// MÓDULO INDEPENDIENTE DE GERENCIA
// ==========================================
function GerenciaPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('tanques'); 
  const [tankReadings, setTankReadings] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [historialOficial, setHistorialOficial] = useState<any[]>([]);
  const [viewImg, setViewImg] = useState<string | null>(null);
  
  const [tipoCamion, setTipoCamion] = useState<'estandar' | 'chico'>('estandar');
  const [fuelPrices, setFuelPrices] = useState<any>({ super: 1000, quantium_nafta: 1200, x10: 1050, quantium_diesel: 1250 });
  
  // camionState almacena el Tanque ID asignado a cada compartimento de flete [C1, C2, C3...]
  const [camionState, setCamionState] = useState<string[]>(new Array(7).fill('vacio'));

  const [manualEdit, setManualEdit] = useState<any>({
    isOpen: false, id: null, date: getYesterdayISOString(), responsable: 'Gerencia (Ajuste)',
    tanks: TANKS_CONFIG.reduce((acc, t) => ({ ...acc, [t.id]: { inicio: '', desc: '', fin: '' } }), {})
  });

  useEffect(() => {
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), (snap) => {
      if (snap.exists()) setTankReadings(snap.data().readings);
    });
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4'), orderBy('date', 'desc')), (snap) => {
      setHistorialOficial(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh'), orderBy('fecha', 'desc')), (snap) => {
      setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.archivado));
    });
    // Recupera costos guardados de Firebase en tiempo real
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'precios_combustible'), (snap) => {
      if (snap.exists()) setFuelPrices(snap.data().prices);
    });
  }, []);

  const handleTipoCamionChange = (tipo: 'estandar' | 'chico') => {
    setTipoCamion(tipo);
    setCamionState(new Array(tipo === 'estandar' ? 7 : 6).fill('vacio'));
  };

  // Sube el cambio de precios en vivo a Firestore
  const handlePriceChange = async (fuelKey: string, val: number) => {
    const updatedPrices = { ...fuelPrices, [fuelKey]: val };
    setFuelPrices(updatedPrices);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'precios_combustible'), { prices: updatedPrices });
    } catch(e) { console.error(e); }
  };

  // Agrupa y acumula los litros del flete apuntados al mismo tanque
  const litrosAsignadosPorTanque = useMemo(() => {
    const totales: Record<string, number> = {};
    camionState.forEach((tankId, idx) => {
      if (tankId && tankId !== 'vacio') {
        const capacidadCisterna = CAMIONES_CONFIG[tipoCamion][idx]?.max || 0;
        totales[tankId] = (totales[tankId] || 0) + capacidadCisterna;
      }
    });
    return totales;
  }, [camionState, tipoCamion]);

  // Costo total del flete multiplicando la cisterna por su precio correspondiente
  const totalCostoPedido = useMemo(() => {
    return camionState.reduce((acc, tankId, idx) => {
      if (!tankId || tankId === 'vacio') return acc;
      const configTanque = TANKS_CONFIG.find(t => t.id === tankId);
      if (!configTanque) return acc;
      const capacidadCisterna = CAMIONES_CONFIG[tipoCamion][idx]?.max || 0;
      return acc + (capacidadCisterna * (fuelPrices[configTanque.fuel] || 0));
    }, 0);
  }, [camionState, tipoCamion, fuelPrices]);

  // Validación multi-cisterna: detecta excesos sumados por tanque
  const validacionEspacioLibre = useMemo(() => {
    const alertas: any = [];
    if (!tankReadings) return [];

    Object.keys(litrosAsignadosPorTanque).forEach(tId => {
      const config = TANKS_CONFIG.find(t => t.id === tId);
      if (!config) return;
      const currentLiters = parseFloat(tankReadings?.[tId]?.liters) || 0;
      const libre = config.maxLiters - currentLiters;
      const asignado = litrosAsignadosPorTanque[tId] || 0;

      if (asignado > libre) {
        alertas.push({ name: config.name, sobra: asignado - libre });
      }
    });
    return alertas;
  }, [litrosAsignadosPorTanque, tankReadings]);

  const saveManualEntry = async () => {
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
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4', newLog.id.toString()), newLog);
      if (tankReadings) {
        const updatedMonitor = { ...tankReadings };
        TANKS_CONFIG.forEach(tank => {
          if (updatedMonitor[tank.id]) {
            updatedMonitor[tank.id].liters = newLog.tanks[tank.id].fin;
            updatedMonitor[tank.id].mm = '';
          }
        });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: updatedMonitor });
      }
      setManualEdit((prev: any) => ({ ...prev, isOpen: false }));
      alert("Registro Guardado e Inyectado al Monitor Online ✅");
    } catch (error) { console.error(error); }
  };

  const formatMonthDisplay = (yyyyMm: string) => { if (!yyyyMm) return ''; const [year, month] = yyyyMm.split('-'); return `${MONTH_NAMES[month]} ${year}`; };
  const formatDateDisplay = (isoDate: string) => { if (!isoDate) return ''; const [y, m, d] = isoDate.split('-'); return `${d}/${m}/${y}`; };

  const handleManualTankChange = (tankId: string, field: string, value: string) => {
    setManualEdit((prev: any) => ({ ...prev, tanks: { ...prev.tanks, [tankId]: { ...prev.tanks[tankId], [field]: value } } }));
  };

  const loadDataForDate = (selectedDate: string) => {
    const existingLog = historialOficial.find(log => log.date === selectedDate);
    if (existingLog) {
      setManualEdit({ isOpen: true, id: existingLog.id, date: existingLog.date, responsable: existingLog.responsable, tanks: { ...existingLog.tanks } });
    } else {
      const priorLogs = historialOficial.filter(log => log.date < selectedDate).sort((a,b) => b.date.localeCompare(a.date));
      const lastLog = priorLogs.length > 0 ? priorLogs[0] : null;
      const freshTanks: any = {};
      TANKS_CONFIG.forEach(t => { freshTanks[t.id] = { inicio: lastLog ? lastLog.tanks[t.id].fin : 0, desc: 0, fin: 0, lv: 0 }; });
      setManualEdit({ isOpen: true, id: null, date: selectedDate, responsable: 'Gerencia (Carga Manual)', tanks: freshTanks });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans relative text-slate-800">
      {viewImg && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImg(null)}><img src={viewImg} className="max-w-full max-h-full object-contain" /></div>}
      
      {manualEdit.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg text-slate-800">Editor de Historial Manual</h3><button onClick={() => setManualEdit({...manualEdit, isOpen: false})}><X className="w-5 h-5"/></button></div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="date" value={manualEdit.date} onChange={(e) => loadDataForDate(e.target.value)} className="p-2 border rounded-xl font-bold text-slate-800 outline-none" />
                <input type="text" value={manualEdit.responsable} onChange={(e) => setManualEdit({...manualEdit, responsable: e.target.value})} className="p-2 border rounded-xl font-bold text-slate-800 outline-none" />
              </div>
              <table className="w-full text-left text-xs">
                <thead><tr className="bg-slate-100 font-bold"><th className="p-3">Tanque</th><th className="p-3">Inicio (L)</th><th className="p-3">Descarga (L)</th><th className="p-3">Fin (L)</th><th className="p-3 text-indigo-600">Vendido</th></tr></thead>
                <tbody>{TANKS_CONFIG.map(tank => {
                  const tData = manualEdit.tanks[tank.id] || { inicio: 0, desc: 0, fin: 0 };
                  const v = (parseFloat(tData.inicio)||0) + (parseFloat(tData.desc)||0) - (parseFloat(tData.fin)||0);
                  return (
                    <tr key={tank.id} className="border-b">
                      <td className="p-3 font-bold">{tank.name}</td>
                      <td><input type="number" value={tData.inicio} onChange={(e) => handleManualTankChange(tank.id, 'inicio', e.target.value)} className="border p-1 rounded w-24 font-bold text-slate-800 outline-none" /></td>
                      <td><input type="number" value={tData.desc} onChange={(e) => handleManualTankChange(tank.id, 'desc', e.target.value)} className="border p-1 bg-amber-50 rounded w-24 font-bold text-slate-800 outline-none" /></td>
                      <td><input type="number" value={tData.fin} onChange={(e) => handleManualTankChange(tank.id, 'fin', e.target.value)} className="border p-1 rounded w-24 font-bold text-slate-800 outline-none" /></td>
                      <td className="p-3 font-black text-indigo-600">{Math.round(v).toLocaleString()} L</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2"><button onClick={saveManualEntry} className="bg-[#E20074] text-white font-bold px-6 py-2 rounded-lg">Guardar Cambios</button></div>
          </div>
        </div>
      )}

      {/* SIDEBAR EXCLUSIVO MAGENTA Y BLANCO */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm z-20">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b">
          <div className="h-9 w-9 bg-[#E20074] rounded-xl flex items-center justify-center font-black text-white text-xs italic">AX</div>
          <div><h2 className="font-black text-xs uppercase tracking-wider text-[#E20074] leading-none">Panel Central</h2><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Gerencia Operativa</p></div>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { id: 'tanques', label: 'Stock Online', icon: <Database className="w-4 h-4"/> },
            { id: 'pedido', label: 'Pedido de Combustible', icon: <Truck className="w-4 h-4"/> },
            { id: 'datos', label: 'Planilla del Mes', icon: <ClipboardList className="w-4 h-4"/> },
            { id: 'rrhh', label: 'Buzón de RRHH', icon: <MessageSquare className="w-4 h-4"/> }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeMenu === item.id ? 'bg-[#E20074] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>{item.icon} {item.label}</button>
          ))}
        </nav>
        <button onClick={() => navigate('/')} className="mt-6 p-3 text-slate-400 hover:text-[#E20074] font-black text-[10px] uppercase tracking-widest border border-dashed rounded-xl transition-colors">Salir al Home</button>
      </aside>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        {/* 1. STOCK ONLINE */}
        {activeMenu === 'tanques' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-black italic uppercase text-slate-800 flex items-center gap-2 border-b pb-2"><Database className="text-[#E20074]"/> Monitor Online en Tiempo Real (Sincronizado)</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tankReadings && TANKS_CONFIG.map(t => {
                const currentLiters = parseFloat(tankReadings?.[t.id]?.liters) || 0;
                const percentage = Math.min(100, Math.max(0, Math.round((currentLiters / t.maxLiters) * 100)));
                return (
                  <div key={t.id} className="bg-white p-5 rounded-[2rem] text-center border relative overflow-hidden shadow-sm flex flex-col items-center">
                    <div className="w-14 bg-slate-50 h-36 rounded-2xl relative overflow-hidden flex items-end border shadow-inner mb-3 mx-auto">
                      <div className={`w-full ${t.color} opacity-90 transition-all duration-1000`} style={{ height: `${percentage}%` }}></div>
                      <div className="absolute inset-0 flex items-center justify-center font-black text-[11px] text-slate-800">{percentage}%</div>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase italic mb-0.5">{t.name}</p>
                    <p className="text-sm font-black italic text-slate-800">{Math.round(currentLiters).toLocaleString('es-AR')} L</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PEDIDO DE COMBUSTIBLE */}
        {activeMenu === 'pedido' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-center animate-in fade-in">
            <div className="xl:col-span-2 space-y-4 text-left">
              <div className="bg-white p-5 rounded-3xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-4 border-[#E20074]">
                 <div><h3 className="font-black uppercase italic text-slate-800 text-sm flex items-center gap-2"><Truck className="text-[#E20074]"/> Distribución de Cisternas del Camión</h3></div>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => handleTipoCamionChange('estandar')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${tipoCamion === 'estandar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>ESTÁNDAR (7)</button>
                   <button onClick={() => handleTipoCamionChange('chico')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${tipoCamion === 'chico' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>CHICO (6)</button>
                 </div>
              </div>

              {/* Recorre las Cisternas del camión y permite apuntar múltiples de ellas a un mismo Tanque */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-3">
                {CAMIONES_CONFIG[tipoCamion].map((cisterna, idx) => {
                  const tanqueAsignadoId = camionState[idx] || 'vacio';
                  return (
                    <div key={cisterna.id} className="p-4 bg-slate-50 border rounded-2xl flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
                      <div className="w-40">
                        <p className="font-black text-xs text-slate-700 flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-slate-400" /> Compartimento {idx + 1}
                        </p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase">Capacidad: {cisterna.max.toLocaleString()} L</p>
                      </div>
                      <div className="flex-1 flex gap-2 items-center w-full lg:w-auto mt-2 lg:mt-0">
                        <select 
                          value={tanqueAsignadoId} 
                          onChange={(e) => {
                            const newState = [...camionState];
                            newState[idx] = e.target.value;
                            setCamionState(newState);
                          }} 
                          className="w-full lg:w-64 p-2 text-[10px] font-bold uppercase border bg-white rounded-xl outline-none text-slate-700"
                        >
                          <option value="vacio">-- CISTERNA VACÍA --</option>
                          {TANKS_CONFIG.map(t => {
                            const currentStock = tankReadings?.[t.id]?.liters ? parseFloat(tankReadings[t.id].liters) : 0;
                            const libre = Math.max(0, Math.round(t.maxLiters - currentStock));
                            
                            // Bloqueo Inteligente de Opciones Seleccionadas en otros compartimentos
                            const yaAsignadoEnOtroCompartimento = camionState.some((id, cIdx) => id === t.id && cIdx !== idx);
                            if (yaAsignadoEnOtroCompartimento) return null;

                            return (
                              <option key={t.id} value={t.id}>
                                {t.name} (Libre: {libre.toLocaleString()} L)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablero sumador acumulativo por Tanque para control de rebalses */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 italic mb-2">Resumen de Carga Acumulada por Tanque</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {TANKS_CONFIG.map(t => {
                    const currentStock = tankReadings?.[t.id]?.liters ? parseFloat(tankReadings[t.id].liters) : 0;
                    const libre = Math.max(0, t.maxLiters - currentStock);
                    const asignado = litrosAsignadosPorTanque[t.id] || 0;
                    const supera = asignado > libre;
                    return (
                      <div key={t.id} className={`p-2 border rounded-xl flex justify-between items-center ${supera ? 'bg-red-50 border-red-200' : 'bg-slate-50'}`}>
                        <div>
                          <p className="font-bold text-slate-700">{t.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Asignado: {asignado.toLocaleString()} L</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-black ${supera ? 'text-red-600' : 'text-emerald-600'}`}>
                            {supera ? `Exceso: +${Math.round(asignado - libre).toLocaleString()} L` : `Disponible: ${Math.round(libre - asignado).toLocaleString()} L`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border text-left border-t-4 border-emerald-500">
                <h3 className="font-black uppercase italic text-slate-700 mb-4 text-xs flex items-center gap-2"><CircleDollarSign className="text-emerald-500"/> Precios de Costo</h3>
                <div className="space-y-2">
                  {Object.keys(fuelPrices).map(f => (
                    <div key={f} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border"><p className="text-[10px] font-black text-slate-500 uppercase">{f}</p><div className="flex items-center font-black text-sm text-emerald-600">$<input type="number" value={fuelPrices[f]} onChange={(e) => handlePriceChange(f, parseFloat(e.target.value) || 0)} className="w-16 bg-transparent text-center font-black outline-none ml-0.5 text-emerald-600 border-none" /></div></div>
                  ))}
                </div>
              </div>
              
              {/* ALARMA INTERACTIVA CONTRA SOBRE-CAPACIDADES ACUMULADAS */}
              <div className={`p-6 rounded-[2.5rem] text-white text-left shadow-xl sticky top-4 transition-all duration-300 ${validacionEspacioLibre.length > 0 ? 'bg-rose-950 border-4 border-red-500 shadow-red-900/20' : 'bg-slate-900'}`}>
                <h3 className="font-black uppercase italic mb-4 text-[#E20074] text-xs">Cálculo del Pedido</h3>
                {validacionEspacioLibre.length > 0 ? (
                  <div className="space-y-2">
                    {validacionEspacioLibre.map((al, i) => (
                      <div key={i} className="p-3 rounded-xl bg-red-500/20 border border-red-500 animate-pulse flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-red-400">REBALSARÍA: {al.name}</p>
                          <p className="text-xs font-black">Supera por +{Math.round(al.sobra).toLocaleString()} L</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-black text-[10px] uppercase italic tracking-wider text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Capacidad de Recepción Segura
                  </div>
                )}
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                   <p className="text-[9px] font-black text-[#E20074] uppercase italic tracking-widest">Total flete</p>
                   <p className="text-3xl font-black italic tracking-tighter text-emerald-400 my-3">$ {totalCostoPedido.toLocaleString('es-AR')}</p>
                   <button 
                     disabled={validacionEspacioLibre.length > 0} 
                     onClick={() => window.print()} 
                     className={`w-full py-3.5 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg transition-all italic text-white ${validacionEspacioLibre.length > 0 ? 'bg-slate-700 opacity-40 cursor-not-allowed shadow-none' : 'bg-[#E20074] hover:bg-pink-700'}`}
                   >
                     <Printer className="w-4 h-4"/> Nota de Pedido
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PLANILLA DEL MES - CORREGIDO ERROR DE MAPEADO EN ESPEJO */}
        {activeMenu === 'datos' && (
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
               <div><h3 className="font-black uppercase italic text-slate-800 flex items-center gap-2"><ClipboardList className="text-[#E20074]"/> Libro Diario Oficial Histórico</h3></div>
               <div className="flex gap-2">
                 <button onClick={() => loadDataForDate(getYesterdayISOString())} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"><History className="w-3.5 h-3.5"/> Cargar Manual</button>
                 <button onClick={exportarPlanillaOficial} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"><Download className="w-3.5 h-3.5"/> Exportar Excel (.xlsx)</button>
               </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b"><tr><th className="p-3">Fecha</th><th className="p-3">Responsable Oficial</th>{TANKS_CONFIG.map(t=>(<th key={t.id} className="p-3 font-bold text-center">{t.name} (L)</th>))}<th className="p-3 text-right font-bold">Estado</th></tr></thead>
                <tbody>{historialOficial.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-800 font-black">{log.date}</td>
                    <td className="p-3 text-slate-600">{log.responsable}</td>
                    {TANKS_CONFIG.map(t => (
                      <td key={t.id} className="p-3 text-center text-slate-800">{Math.round(log.tanks?.[t.id]?.fin || 0).toLocaleString()} L</td>
                    ))}
                    <td className="p-3 text-right text-emerald-600">Auditado</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeMenu === 'rrhh' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-5 rounded-3xl border shadow-sm flex justify-between items-center border-t-4 border-[#E20074]">
               <div><h3 className="font-black uppercase italic text-slate-800 text-sm">Mensajes del Personal ({solicitudes.length})</h3></div>
               <button onClick={exportarRRHHeExcel} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm transition-all"><Download className="w-3.5 h-3.5"/> Exportar Reporte</button>
            </div>
            
            {solicitudes.length === 0 ? (
              <div className="bg-white border rounded-2xl p-10 text-center font-bold text-slate-400 italic">Buzón de sugerencias vacío.</div>
            ) : solicitudes.map(sol => (
               <div key={sol.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1"><div className="flex items-center gap-2 mb-1.5"><span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-wider">{sol.tipo}</span><span className="text-[10px] text-slate-300 font-bold">{new Date(sol.fecha).toLocaleString()}</span></div><h4 className="font-black text-slate-800 text-sm uppercase italic mb-2">{sol.empleado}</h4><div className="p-3 bg-slate-50 rounded-xl">{sol.tipo === 'MEDICO' ? <button onClick={()=>setViewImg(sol.contenido)} className="text-emerald-600 font-black text-xs uppercase flex items-center gap-1.5"><Eye className="w-4 h-4"/> Ver Certificado</button> : <p className="text-slate-600 text-xs font-semibold leading-relaxed">"{sol.contenido}"</p>}</div></div>
                  <button onClick={() => archivarMensaje(sol.id)} className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-black text-[9px] uppercase tracking-wider rounded-xl border transition-colors">Seleccionar como Leído</button>
               </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// CENTRAL OPERATIVA: PLAYA / SPOT!
// ==========================================
function OperacionesEstacion() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSpotView = location.pathname === '/spot';
  
  const [activeTab, setActiveTab] = useState('varillas');
  const [spotTab, setSpotTab] = useState<'mañana' | 'tarde'>('mañana');
  const [responsableSpot, setResponsableSpot] = useState('');
  const [spotChecklist, setSpotChecklist] = useState<Record<string, string>>({});

  const updateSpotTask = (taskId: string, status: string) => {
    setSpotChecklist(prev => ({ ...prev, [taskId]: status }));
  };

  const [tankReadings, setTankReadings] = useState<any>(STOCK_INICIAL_AL_DIA_ACTUAL);
  const [dailyLogs, setDailyLogs] = useState<any[]>(DATOS_HISTORICOS); 
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', message: '', inputValue: '', onConfirm: null });

  const closeModal = () => setModalConfig((prev: any) => ({ ...prev, isOpen: false }));
  const handleModalConfirm = () => { if (modalConfig.onConfirm) modalConfig.onConfirm(modalConfig.inputValue); closeModal(); };

  useEffect(() => {
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4'), (snap) => {
      const fetchedLogs = snap.docs.map(d => d.data());
      fetchedLogs.sort((a: any, b: any) => a.date.localeCompare(b.date));
      if (fetchedLogs.length > 0) setDailyLogs(fetchedLogs);
    });

    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), (docSnap) => {
      if (docSnap.exists()) setTankReadings(docSnap.data().readings);
    });
  }, []);

  const saveCurrentStateToCloud = async (readings: any) => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings }); };
  const saveLogToCloud = async (log: any) => { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4', log.id.toString()), log); };

  const [selectedMonthStr, setSelectedMonthStr] = useState('');
  const availableMonths = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const months = new Set([currentMonth, ...dailyLogs.map(log => log.date.substring(0, 7))]);
    return [...months].sort().reverse();
  }, [dailyLogs]);

  useEffect(() => { if (availableMonths.length > 0 && !availableMonths.includes(selectedMonthStr)) setSelectedMonthStr(availableMonths[0]); }, [availableMonths, selectedMonthStr]);
  const filteredLogs = useMemo(() => { if (!selectedMonthStr) return []; return dailyLogs.filter(log => log.date.startsWith(selectedMonthStr)).sort((a, b) => a.date.localeCompare(b.date)); }, [dailyLogs, selectedMonthStr]);

  const formatMonthDisplay = (yyyyMm: string) => { if (!yyyyMm) return ''; const [year, month] = yyyyMm.split('-'); return `${MONTH_NAMES[month]} ${year}`; };
  const formatDateDisplay = (isoDate: string) => { if (!isoDate) return ''; const [y, m, d] = isoDate.split('-'); return `${d}/${m}/${y}`; };

  const handleTankChange = (tankId: string, field: string, value: string) => {
    setTankReadings((prev: any) => {
      const updated = { ...prev, [tankId]: { ...prev[tankId], [field]: value } };
      const tankConfig = TANKS_CONFIG.find(t => t.id === tankId);
      
      if (tankConfig && (field === 'mm' || field === 'liters')) {
        if (field === 'mm') {
          const mm = parseFloat(value) || 0;
          if (mm <= 0) updated[tankId].liters = 0;
          else if (mm >= tankConfig.diameterMm) updated[tankId].liters = tankConfig.maxLiters;
          else updated[tankId].liters = tankLitrosTrig(mm, tankConfig);
        } else {
          updated[tankId].liters = parseFloat(value) || 0;
        }
      }
      return updated;
    });
  };

  const guardarDescarga = async () => {
    await saveCurrentStateToCloud(tankReadings);
    setTankReadings((prev: any) => { const reset = { ...prev }; Object.keys(reset).forEach(k => { reset[k] = { ...reset[k], desc: '' }; }); return reset; });
    setModalConfig({ isOpen: true, type: 'success', title: 'Descarga Sincronizada', message: 'Los litros del camión se guardaron y ya impactaron en el monitor.', inputValue: '', onConfirm: () => setActiveTab('monitor') });
  };

  const iniciarCierreDia = () => {
    if (!TANKS_CONFIG.some(tank => tankReadings[tank.id]?.mm !== '' || tankReadings[tank.id]?.liters > 0)) { alert('Faltan datos de varilla.'); return; }
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
      const desc = parseFloat(tankReadings[tank.id]?.desc) || 0; 
      const fin = parseFloat(tankReadings[tank.id]?.liters) || 0; 
      newLog.tanks[tank.id] = { inicio, desc, fin, lv: inicio + desc - fin };
    });
    
    await saveLogToCloud(newLog);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registros_diarios'), { fecha: new Date().toISOString(), readings: tankReadings });
    
    const nuevoEstado: any = {};
    TANKS_CONFIG.forEach(t => { nuevoEstado[t.id] = { mm: '', liters: newLog.tanks[t.id].fin, desc: '' }; });
    await saveCurrentStateToCloud(nuevoEstado); 
    setModalConfig({ isOpen: true, type: 'success', title: '¡Cierre Exitoso!', message: `Los datos se han guardado con fecha ${formatDateDisplay(fechaAyerIso)} en la nube.`, inputValue: '', onConfirm: () => setActiveTab('registro') });
  };

  if (isSpotView) {
    if (!responsableSpot) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[30px] shadow-xl max-w-md w-full text-slate-800">
            <h2 className="text-xl font-bold text-center mb-6">Operador en Turno (Spot!):</h2>
            <div className="grid gap-3">
              {['Cintia', 'Fiorella', 'Tatiana'].map(nombre => (
                <button key={nombre} onClick={() => setResponsableSpot(nombre)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-lg flex items-center justify-between hover:bg-slate-100 text-slate-700">{nombre} <ArrowRight/></button>
              ))}
            </div>
            <button onClick={() => navigate('/')} className="mt-4 text-slate-400 font-bold block mx-auto text-xs uppercase tracking-wider outline-none">Volver al Inicio</button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden text-slate-800">
           <div className="bg-[#D6006E] p-6 flex justify-between items-center text-white">
              <div><h2 className="text-2xl font-black ">CHECKLIST SPOT!</h2><p className="text-xs font-bold">OPERADOR: {responsableSpot.toUpperCase()}</p></div>
              <button onClick={() => { setResponsableSpot(''); navigate('/'); }} className="p-2 bg-white/20 rounded-full"><X/></button>
           </div>
           <div className="flex border-b">
             <button onClick={() => setSpotTab('mañana')} className={`flex-1 py-4 font-bold ${spotTab === 'mañana' ? 'text-[#D6006E] border-b-4 border-[#D6006E]' : 'text-slate-400'}`}>☀️ Mañana / Tareas</button>
             <button onClick={() => setSpotTab('tarde')} className={`flex-1 py-4 font-bold ${spotTab === 'tarde' ? 'text-[#D6006E] border-b-4 border-[#D6006E]' : 'text-slate-400'}`}>📅 Buzón RRHH</button>
           </div>
           <div className="p-4 bg-slate-50 min-h-[400px]">
              {spotTab === 'mañana' ? (
                SPOT_TASKS.filter(task => task.shift === 'AMBOS' || task.shift === 'MAÑANA').map(task => {
                  const status = spotChecklist[task.id] || null;
                  return (
                    <div key={task.id} className={`flex flex-col gap-2 p-4 rounded-2xl border bg-white mb-2 ${status === 'REALIZADO' ? 'bg-green-50' : ''}`}>
                      <p className="font-bold">{task.title}</p>
                      <div className="flex gap-2"><button onClick={() => updateSpotTask(task.id, 'REALIZADO')} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Hecho</button></div>
                    </div>
                  );
                })
              ) : <RRHHView />}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-8 font-sans text-slate-800 w-full">
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-indigo-50 font-bold border-b flex justify-between"><h3>{modalConfig.title}</h3><button onClick={closeModal}><X/></button></div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">{modalConfig.message}</p>
              {modalConfig.type === 'prompt' && <input type="text" autoFocus value={modalConfig.inputValue} onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2"><button onClick={handleModalConfirm} className="px-5 py-1.5 bg-indigo-600 text-white font-bold rounded-lg">Confirmar</button></div>
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full mb-6 flex flex-wrap lg:flex-nowrap gap-2 bg-white p-2 rounded-2xl shadow-sm border">
        <button onClick={() => setActiveTab('varillas')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'varillas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><Ruler className="w-4 h-4"/> 1. Varillado</button>
        <button onClick={() => setActiveTab('descarga')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'descarga' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500'}`}><Truck className="w-4 h-4"/> 2. Descarga Camión</button>
        <button onClick={() => setActiveTab('monitor')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'monitor' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}><Database className="w-4 h-4"/> 3. Monitor Online</button>
        <button onClick={() => setActiveTab('registro')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'registro' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}><ClipboardList className="w-4 h-4"/> 4. Planilla Mes</button>
        <button onClick={() => setActiveTab('rrhh')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'rrhh' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500'}`}><MessageSquare className="w-4 h-4"/> 5. Buzón RRHH</button>
        <button onClick={() => navigate('/')} className="px-4 py-3 text-slate-400 hover:text-red-500"><X/></button>
      </div>

      <div className="max-w-7xl w-full">
        {activeTab === 'varillas' && (
          <div className="bg-white rounded-3xl shadow-sm border p-6 xl:p-10 max-w-4xl mx-auto">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800"><Ruler /> Medición de Varilla Final (Playa)</h2>
            <div className="space-y-4 mb-8">
              {TANKS_CONFIG.map((tank) => {
                const descVal = parseFloat(tankReadings?.[tank.id]?.desc) || 0;
                return (
                  <div key={tank.id} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-1/4">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${tank.color}`}></div>{tank.name}</h3>
                      <span className="text-xs text-slate-400">Cap: {tank.maxLiters.toLocaleString('es-AR')} L</span>
                    </div>
                    <div className="flex-1 flex gap-3 w-full">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descarga</label>
                        <div className="px-3 py-2.5 bg-slate-100 border rounded-lg text-xs font-bold text-slate-500">{descVal > 0 ? `+ ${descVal} L` : 'Sin descarga'}</div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Varilla (mm)</label>
                        <input type="number" value={tankReadings?.[tank.id]?.mm || ''} onChange={(e) => handleTankChange(tank.id, 'mm', e.target.value)} className="w-full px-3 py-2 border rounded-lg font-black text-slate-800 outline-none" placeholder="0"/>
                      </div>
                    </div>
                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Litros</label>
                      <input type="number" value={tankReadings?.[tank.id]?.mm === '' ? '' : Math.round(tankReadings?.[tank.id]?.liters || 0)} onChange={(e) => handleTankChange(tank.id, 'liters', e.target.value)} className="w-full px-3 py-2 bg-indigo-50 border rounded-lg font-black text-indigo-700 outline-none" />
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={iniciarCierreDia} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg"><Send className="w-5 h-5"/> Registrar Medición Oficial</button>
          </div>
        )}

        {activeTab === 'descarga' && (
          <div className="bg-white rounded-3xl shadow-sm border p-6 xl:p-10 max-w-4xl mx-auto">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800"><Truck /> Carga de Descarga de Camión</h2>
            <div className="space-y-4 mb-8">
              {TANKS_CONFIG.map((tank) => (
                <div key={tank.id} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-1/4"><h3 className="font-bold text-slate-700">{tank.name}</h3></div>
                  <div className="flex-1"><input type="number" value={tankReadings?.[tank.id]?.desc || ''} onChange={(e) => handleTankChange(tank.id, 'desc', e.target.value)} className="w-full p-2.5 border rounded-lg font-bold outline-none focus:border-amber-500" placeholder="0 L"/></div>
                </div>
              ))}
            </div>
            <button onClick={guardarDescarga} className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-md"><CheckCircle2 className="w-5 h-5"/> Sincronizar Descarga</button>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="bg-slate-800 rounded-3xl shadow-xl border p-6 text-white flex flex-col h-[600px]">
            <h1 className="text-2xl font-bold flex items-center gap-3 mb-6"><Database className="text-emerald-400" /> Nivel Online</h1>
            <div className="flex-1 flex items-end justify-center gap-4 md:gap-8 mt-4">
              {tankReadings && TANKS_CONFIG.map((tank) => {
                const currentLiters = tankReadings?.[tank.id]?.liters || 0;
                const percentage = Math.min(100, Math.max(0, (currentLiters / tank.maxLiters) * 100));
                return (
                  <div key={tank.id} className="flex flex-col items-center">
                    <span className="text-xs font-bold mb-2">{Math.round(percentage)}%</span>
                    <div className="w-20 h-48 bg-slate-700 rounded-t-xl overflow-hidden border flex items-end relative group">
                      <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 flex items-center justify-center font-bold text-xs">{Math.round(currentLiters).toLocaleString('es-AR')} L</div>
                      <div className={`w-full transition-all duration-500 ${tank.color}`} style={{ height: `${percentage}%` }}></div>
                    </div>
                    <span className="text-[10px] mt-2 font-bold uppercase">{tank.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'registro' && (
          <div className="bg-white rounded-3xl shadow-sm border p-6 text-slate-800">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h1 className="text-xl font-bold flex items-center gap-2"><ClipboardList /> Declaraciones Consolidadas</h1>
              <select className="border p-2 rounded-xl font-bold bg-slate-50 outline-none text-sm text-slate-700" value={selectedMonthStr} onChange={(e) => setSelectedMonthStr(e.target.value)}>
                {availableMonths.map(month => (<option key={month} value={month}>{formatMonthDisplay(month)}</option>))}
              </select>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50"><tr><th className="p-3 border-b font-bold">Fecha</th>{TANKS_CONFIG.map(t => (<th key={t.id} className="p-3 border-b text-center font-bold">{t.name}</th>))}<th className="p-3 border-b font-bold">Resp.</th></tr></thead>
                <tbody>{filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-bold">{formatDateDisplay(log.date)}</td>
                    {TANKS_CONFIG.map(t => (<td key={t.id} className="p-3 text-center font-bold">{Math.round(log.tanks?.[t.id]?.fin || 0).toLocaleString('es-AR')} L</td>))}
                    <td className="p-3 text-slate-600 font-medium">{log.responsable}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rrhh' && <RRHHView />}
      </div>
    </div>
  );
}

// --- HOME CENTRAL ---
function Home() {
  const navigate = useNavigate();
  const [pinInput, setPinInput] = useState('');
  const [targetModulo, setTargetModulo] = useState<string | null>(null);
  const PINS = { playa: "6227", spot: "3071", gerencia: "225903" };

  const verificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetModulo && pinInput === PINS[targetModulo as keyof typeof PINS]) { navigate(`/${targetModulo}`); } 
    else { alert("PIN INCORRECTO ❌"); setPinInput(''); }
  };

  return (
    <div className="min-h-screen bg-[#E20074] flex flex-col justify-between text-white font-sans relative overflow-hidden">
      {targetModulo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-slate-800">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-xs text-center border-t-8 border-[#E20074] animate-in zoom-in-95">
            <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8">Security</h3>
            <form onSubmit={verificarPin}>
              <input autoFocus type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 border-b-4 border-[#E20074] bg-slate-50 text-center text-4xl tracking-[0.5rem] mb-10 outline-none font-black text-gray-800" placeholder="••••" />
              <div className="flex gap-4"><button type="button" onClick={() => setTargetModulo(null)} className="flex-1 font-bold text-slate-400 uppercase text-[9px] italic">Atrás</button><button type="submit" className="flex-1 bg-[#E20074] text-white py-4 rounded-2xl font-black uppercase text-[10px]">Entrar</button></div>
            </form>
          </div>
        </div>
      )}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-8 px-10 flex items-center gap-4 shadow-xl">
        <div className="h-14 w-14 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center font-black italic text-pink-600 text-xs">AXION</div>
        <div><h1 className="text-2xl font-black uppercase italic leading-none text-white tracking-tighter">Gestión Operativa</h1><p className="text-white/80 text-[9px] font-bold uppercase tracking-widest mt-1 italic">AXION Crespo — A y A Jacob S.R.L.</p></div>
      </header>
      <main className="flex-grow flex items-center justify-center p-6 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[ 
            { id: 'playa', label: 'Playa / Tanques', img: 'playa.png', fallback: '⛽' }, 
            { id: 'spot', label: 'Spot / Ventas', img: 'spot.png', fallback: '☕' }, 
            { id: 'gerencia', label: 'Gerencia', img: 'gerencia.png', fallback: '⚙️' } 
          ].map(m => (
            <div key={m.id} onClick={() => setTargetModulo(m.id)} className="bg-white p-12 rounded-[3.5rem] shadow-2xl cursor-pointer hover:scale-105 transition-all text-center group border-4 border-transparent hover:border-white/50 shadow-pink-900/10">
              <div className="h-28 w-full mx-auto mb-6 flex items-center justify-center">
                <img src={m.img} alt={m.label} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<div class="text-4xl">${m.fallback}</div>`; }} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">{m.label}</h2>
            </div>
          ))}
        </div>
      </main>
      <footer className="py-6 text-center text-white/40 text-[9px] font-black uppercase tracking-widest italic tracking-widest">A y A Jacob S.R.L. — 2026</footer>
    </div>
  );
}

// ==========================================
// EXPORT DEFAULT ÚNICO COMPATIBLE VITE
// ==========================================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playa" element={<OperacionesEstacion />} />
        <Route path="/spot" element={<OperacionesEstacion />} />
        <Route path="/gerencia" element={<GerenciaPage />} />
      </Routes>
    </Router>
  );
}