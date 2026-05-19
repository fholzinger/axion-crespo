import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Fuel, CircleDollarSign, Droplets, PlusCircle, Clock, FileText, Trash2, ClipboardList, Database, Ruler, AlertTriangle, ArrowRight, Send, Truck, CheckCircle2, Save, User, X, Lock, Unlock, Download, ShieldAlert, Key, Info, PackagePlus, Calendar, Loader2, Calculator, History, Edit3, MessageSquare, Camera, Eye, Printer, Check, BarChart3, AlertCircle, HelpCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch, getDocs, addDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// IMPORTACIÓN DE ICONOS PERSONALIZADOS
import PlayaIcon from './assets/playa.png'; 
import SpotIcon from './assets/spot.png';
import AxionLogo from './assets/logo.png'; 

// ==========================================
// UTILIDADES GLOBALES (Anti-Pantalla Blanca)
// ==========================================
const MONTH_NAMES: any = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
const formatMonthDisplay = (yyyyMm: string) => { if (!yyyyMm) return ''; const [year, month] = yyyyMm.split('-'); return `${MONTH_NAMES[month] || month} ${year}`; };
const formatDateDisplay = (isoDate: string) => { if (!isoDate) return ''; const [y, m, d] = isoDate.split('-'); return `${d}/${m}/${y}`; };
const getYesterdayISOString = () => {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

// ==========================================
// CONFIGURACIONES Y LISTAS OPERATIVAS
// ==========================================
const PERSONAL_SPOT = [
  { nombre: "Cintia", pin: "4040" },
  { nombre: "Fiorella", pin: "1903" },
  { nombre: "Tatiana", pin: "4225" }
];

const CONFIG_TAREAS_SPOT = [
  // DIARIAS
  { id: 'd1', title: 'Sacar Medialunas', category: 'Tareas', freq: 'diaria', shift: 'TARDE', desc: '21 hs día habitual, 22 hs sábados/vísperas' },
  { id: 'd2', title: 'Hornear Medialunas', category: 'Tareas', freq: 'diaria', shift: 'MAÑANA', desc: '6 hs habitual, 7 hs dom/feriados' },
  { id: 'd3', title: 'Elaboración de Carlitos', category: 'Tareas', freq: 'diaria', shift: 'MAÑANA', desc: 'Entre 6 y 14 hs' },
  { id: 'd4', title: 'Elaboración de Pebetes', category: 'Tareas', freq: 'diaria', shift: 'MAÑANA', desc: 'Entre 6 y 14 hs' },
  { id: 'd5', title: 'Elaboración Sandwich de Miga', category: 'Tareas', freq: 'diaria', shift: 'MAÑANA', desc: 'Entre 6 y 14 hs' },
  { id: 'd6', title: 'Hornear Empanadas', category: 'Tareas', freq: 'diaria', shift: 'AMBOS', desc: 'Horarios: 10:00, 12:30 y 18:00 hs' },
  { id: 'd7', title: 'Elaboración Empanadas JyQ', category: 'Tareas', freq: 'diaria', shift: 'MAÑANA', desc: 'Todos los días' },
  { id: 'd8', title: 'Horno con Vinagre', category: 'Limpieza', freq: 'diaria', shift: 'MAÑANA', desc: 'Entre 6 y 14 hs' },
  { id: 'd9', title: 'Lavado de Piso (Mañana)', category: 'Limpieza', freq: 'diaria', shift: 'MAÑANA', desc: 'Entre 6 y 14 hs' },
  { id: 'd10', title: 'Lavado de Piso (Tarde)', category: 'Limpieza', freq: 'diaria', shift: 'TARDE', desc: 'Entre 14 y 22 hs' },
  // DÍA POR MEDIO
  { id: 'dxm1', title: 'Elaboración de Donas', category: 'Tareas', freq: 'dxm', shift: 'MAÑANA', desc: 'Día por medio' },
  { id: 'dxm2', title: 'Elaboración de Triples', category: 'Tareas', freq: 'dxm', shift: 'MAÑANA', desc: 'Día por medio' },
  { id: 'dxm3', title: 'Cortar Jamón', category: 'Tareas', freq: 'dxm', shift: 'TARDE', desc: 'Día por medio - 15:30 hs' },
  { id: 'dxm4', title: 'Cortar Queso Barra', category: 'Tareas', freq: 'dxm', shift: 'TARDE', desc: 'Día por medio - 15:30 hs' },
  { id: 'dxm5', title: 'Cortar Queso Muzza', category: 'Tareas', freq: 'dxm', shift: 'TARDE', desc: 'Día por medio - 15:30 hs' },
  // CADA 72 HS (CADA TRES DÍAS)
  { id: 'c2d1', title: 'Horno con Pastilla', category: 'Limpieza', freq: 'c2d', shift: 'TARDE', desc: 'Cada 72 hs (Base: 7/5/2026)' },
  // SEMANALES POR DÍA (0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab)
  { id: 'sl1', title: 'Pedido Don Lucas', category: 'Pedidos', freq: 'semanal', days: [1], shift: 'MAÑANA', desc: 'Lunes' },
  { id: 'sl2', title: 'Pedido La Familia', category: 'Pedidos', freq: 'semanal', days: [1, 4], shift: 'MAÑANA', desc: 'Lunes y Jueves' },
  { id: 'sm1', title: 'Pedido Massalin', category: 'Pedidos', freq: 'semanal', days: [2], shift: 'MAÑANA', desc: 'Martes' },
  { id: 'sm2', title: 'Pedido Horizonte', category: 'Pedidos', freq: 'semanal', days: [2, 4], shift: 'MAÑANA', desc: 'Martes y Jueves' },
  { id: 'sm3', title: 'Pedido Martin López', category: 'Pedidos', freq: 'semanal', days: [2, 5], shift: 'MAÑANA', desc: 'Martes y Viernes' },
  { id: 'sx1', title: 'Productos de Limpieza', category: 'Compras', freq: 'semanal', days: [3], shift: 'AMBOS', desc: 'Miércoles (Realizar en el día)' },
  { id: 'sx2', title: 'Pedido Coca Cola', category: 'Pedidos', freq: 'semanal', days: [3], shift: 'MAÑANA', desc: 'Miércoles' },
  { id: 'sx3', title: 'Limpieza Caramelera', category: 'Limpieza', freq: 'semanal', days: [3], shift: 'AMBOS', desc: 'Miércoles' },
  { id: 'sj1', title: 'Verdulería', category: 'Compras', freq: 'semanal', days: [4], shift: 'AMBOS', desc: 'Jueves (Realizar en el día)' },
  { id: 'sj2', title: 'Control de Stock', category: 'Pedidos', freq: 'semanal', days: [4, 5], shift: 'MAÑANA', desc: 'Jueves y Viernes' },
  { id: 'sj3', title: 'Limpieza Muebles', category: 'Limpieza', freq: 'semanal', days: [4], shift: 'TARDE', desc: 'Jueves' },
  { id: 'sv1', title: 'Supermercado', category: 'Compras', freq: 'semanal', days: [5], shift: 'AMBOS', desc: 'Viernes (Realizar en el día)' },
  { id: 'sv2', title: 'Carnicería', category: 'Compras', freq: 'semanal', days: [5], shift: 'AMBOS', desc: 'Viernes (Realizar en el día)' },
  { id: 'sv3', title: 'Pedido Potigian', category: 'Pedidos', freq: 'semanal', days: [5], shift: 'MAÑANA', desc: 'Viernes (Cerrar ANTES de las 13:00 hs)' },
  { id: 'svid', title: 'Limpieza Vidrios', category: 'Limpieza', freq: 'semanal', days: [3, 4, 5], shift: 'MAÑANA', desc: 'Miércoles a Viernes' },
  { id: 'sd1', title: 'Fechas de Vencimiento', category: 'Revisiones', freq: 'semanal', days: [0], shift: 'MAÑANA', desc: 'Domingo' },
  { id: 'sd2', title: 'Precios Impresos', category: 'Revisiones', freq: 'semanal', days: [0], shift: 'MAÑANA', desc: 'Domingo' },
  // QUINCENALES
  { id: 'q1', title: 'Pedido Antártida', category: 'Pedidos', freq: 'quincenal', shift: 'MAÑANA', desc: 'Cada 15 días (Base: 6/5/2026)' },
  // MENSUALES
  { id: 'm1', title: 'Limpieza Heladeras', category: 'Limpieza', freq: 'mensual', shift: 'MAÑANA', desc: 'Una vez al mes' },
  { id: 'm2', title: 'Limpieza Freezer', category: 'Limpieza', freq: 'mensual', shift: 'MAÑANA', desc: 'Una vez al mes' },
  { id: 'm3', title: 'Pedido Dimarky', category: 'Pedidos', freq: 'mensual', shift: 'MAÑANA', desc: 'Una vez al mes' },
  { id: 'm4', title: 'Pedido Blumenthal', category: 'Pedidos', freq: 'mensual', shift: 'MAÑANA', desc: 'Una vez al mes' },
  // BIMESTRALES
  { id: 'b1', title: 'Pedido Axion Log', category: 'Pedidos', freq: 'bimestral', shift: 'MAÑANA', desc: 'Día 15 del mes de cierre' }
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
  { nombre: "Mayer Romina", pin: "1545" }, { nombre: "Ulrich Mailin", pin: "1475" }, { nombre: "Zingraf Lucas", pin: "3638" }, { nombre: "Chiappesoni Cintia", pin: "4040" }, { nombre: "Walter Tatiana", pin: "4225" }, { nombre: "Zapata Fiorella", pin: "1903" }
];

const DATOS_HISTORICOS = [
  { id: 1714348800000, date: '2026-04-29', responsable: 'Sistema', tanks: { t12: { inicio: 6156, desc: 0, fin: 6156, lv: 0 }, t13: { inicio: 9853, desc: 0, fin: 9853, lv: 0 }, t14: { inicio: 1422, desc: 0, fin: 1422, lv: 0 }, t15: { inicio: 5931, desc: 0, fin: 5931, lv: 0 }, t8: { inicio: 100, desc: 0, fin: 100, lv: 0 }, t9: { inicio: 806, desc: 0, fin: 806, lv: 0 }, t10: { inicio: 242, desc: 0, fin: 242, lv: 0 } } }
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
// COMPONENTE BUZÓN RRHH (GENÉRICO PARA AMBOS SECTORES)
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
        {[...EMPLEADOS, ...PERSONAL_SPOT].map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
      </select>
      {empleadoSel && <div className="space-y-3 animate-in fade-in">
        <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" className="w-full p-3 text-center text-3xl border rounded-xl font-black outline-none bg-slate-50 tracking-widest text-slate-800" />
        <button onClick={() => {
          const emp = [...EMPLEADOS, ...PERSONAL_SPOT].find(e => e.nombre === empleadoSel);
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
            <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm text-slate-700" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm text-slate-700" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            <button onClick={() => enviar("VACACIONES", `Del ${fechaDesde} al ${fechaHasta}`)} className="w-full bg-[#E20074] text-white py-3 rounded-xl font-black uppercase text-xs">Enviar Solicitud</button>
          </div>}
          {subPantalla === 'medico' && <div className="space-y-3 text-center">
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { const reader = new FileReader(); reader.onloadend = () => setImgCertificado(reader.result as string); reader.readAsDataURL(file); }
            }} />
            {!imgCertificado ?
              <button onClick={() => fileRef.current?.click()} className="w-full py-10 border-2 border-dashed rounded-xl text-slate-400 font-bold text-xs uppercase flex flex-col items-center gap-2"><Camera className="w-5 h-5"/> Tomar Foto</button> : <img src={imgCertificado} className="w-full rounded-xl border mb-2" />}
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
// COMPONENTE: REPORTES DE INCIDENCIA EN PLAYA
// ==========================================
const IncidenciasView = () => {
  const [empleadoSel, setEmpleadoSel] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [sesionActiva, setSesionActiva] = useState<string | null>(null);
  const [textoIncidente, setTextoIncidente] = useState("");

  const enviarIncidente = async () => {
    if (!textoIncidente.trim()) { alert("Por favor redacte la novedad."); return; }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reportes_incidentes'), {
        empleado: sesionActiva, detalle: textoIncidente, fecha: new Date().toISOString(), archivado: false
      });
      alert("Incidencia inyectada y enviada a Gerencia ✅"); setTextoIncidente("");
    } catch (e) { alert("Error al subir a la base"); }
  };

  if (!sesionActiva) return (
    <div className="bg-white p-6 rounded-2xl border max-w-md mx-auto my-4 text-slate-800 shadow-sm">
      <h2 className="text-sm font-black text-center mb-4 uppercase italic flex items-center justify-center gap-2 text-rose-600"><AlertCircle className="w-4 h-4"/> Firma de Turno (Incidencias)</h2>
      <select value={empleadoSel} onChange={(e) => setEmpleadoSel(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold mb-3 outline-none text-xs text-slate-700">
        <option value="">-- SELECCIONE SU NOMBRE --</option>
        {EMPLEADOS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
      </select>
      {empleadoSel && <div className="space-y-3 animate-in fade-in">
        <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" className="w-full p-3 text-center text-3xl border rounded-xl font-black outline-none bg-slate-50 tracking-widest text-slate-800" />
        <button onClick={() => {
          const emp = EMPLEADOS.find(e => e.nombre === empleadoSel);
          if (emp && pinInput === emp.pin) { setSesionActiva(emp.nombre); setPinInput(""); } else { alert("PIN Incorrecto"); }
        }} className="w-full bg-rose-600 text-white py-3 rounded-xl font-black uppercase italic text-xs tracking-wider">Validar Identidad</button>
      </div>}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl border max-w-md mx-auto my-2 text-slate-800 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <p className="font-black text-xs uppercase italic text-rose-600">Responsable: {sesionActiva}</p>
        <button onClick={() => setSesionActiva(null)} className="text-slate-400 font-bold text-[10px] uppercase underline">Cerrar</button>
      </div>
      <div className="space-y-2">
        <label className="block text-[10px] uppercase font-black text-slate-400">Describa lo ocurrido en la playa o surtidores:</label>
        <textarea value={textoIncidente} onChange={(e) => setTextoIncidente(e.target.value)} className="w-full h-36 p-3 bg-slate-50 border rounded-xl font-medium text-sm outline-none text-slate-700 leading-relaxed" placeholder="Falla en manguera / diferencias en caja..." />
        <button onClick={enviarIncidente} className="w-full bg-rose-600 text-white py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-md"><Send className="w-4 h-4"/> Reportar Novedad</button>
      </div>
    </div>
  );
};

// ==========================================
// MÓDULO UNIFICADO DE GERENCIA (PLAYA + SPOT)
// ==========================================
function GerenciaPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('tanques');
  const [tankReadings, setTankReadings] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [historialOficial, setHistorialOficial] = useState<any[]>([]);
  
  // NUEVO ESTADO PARA RECIBIR DATOS DE SPOT
  const [auditoriaSpot, setAuditoriaSpot] = useState<any[]>([]);
  const [viewImg, setViewImg] = useState<string | null>(null);
  
  const [tipoCamion, setTipoCamion] = useState<'estandar' | 'chico'>('estandar');
  const [fuelPrices, setFuelPrices] = useState<any>({ super: 1000, quantium_nafta: 1200, x10: 1050, quantium_diesel: 1250 });
  const [camionState, setCamionState] = useState<string[]>(new Array(7).fill('vacio'));
  const [manualEdit, setManualEdit] = useState<any>({
    isOpen: false, id: null, date: getYesterdayISOString(), responsable: 'Gerencia (Ajuste)',
    tanks: TANKS_CONFIG.reduce((acc, t) => ({ ...acc, [t.id]: { inicio: '', desc: '', fin: '' } }), {})
  });

  useEffect(() => {
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), (snap) => {
      if (snap.exists()) setTankReadings(snap.data().readings);
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4'), (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a: any, b: any) => b.date.localeCompare(a.date));
      setHistorialOficial(logs);
    });
    // RRHH lee de la colección unificada que usan tanto Playeros como Spot
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh'), (snap) => {
      const rrhh = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((s:any) => !s.archivado);
      rrhh.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setSolicitudes(rrhh);
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'reportes_incidentes'), (snap) => {
      const inc = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((i:any) => !i.archivado);
      inc.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setIncidentes(inc);
    });
    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'precios_combustible'), (snap) => {
      if (snap.exists()) setFuelPrices(snap.data().prices);
    });
    
    // ESCUCHADOR EXCLUSIVO PARA AUDITORÍA SPOT EN GERENCIA
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'historial_checklist_spot'), (snap) => {
      const spotDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      spotDocs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditoriaSpot(spotDocs);
    });
  }, []);

  const handleTipoCamionChange = (tipo: 'estandar' | 'chico') => {
    setTipoCamion(tipo);
    setCamionState(new Array(tipo === 'estandar' ? 7 : 6).fill('vacio'));
  };

  const handlePriceChange = async (fuelKey: string, val: number) => {
    const updatedPrices = { ...fuelPrices, [fuelKey]: val };
    setFuelPrices(updatedPrices);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'precios_combustible'), { prices: updatedPrices });
    } catch(e) { console.error(e); }
  };

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

  const totalCostoPedido = useMemo(() => {
    return camionState.reduce((acc, tankId, idx) => {
      if (!tankId || tankId === 'vacio') return acc;
      const configTanque = TANKS_CONFIG.find(t => t.id === tankId);
      if (!configTanque) return acc;
      const capacidadCisterna = CAMIONES_CONFIG[tipoCamion][idx]?.max || 0;
      return acc + (capacidadCisterna * (fuelPrices[configTanque.fuel] || 0));
    }, 0);
  }, [camionState, tipoCamion, fuelPrices]);

  const validacionEspacioLibre = useMemo(() => {
    const alertas: any = [];
    if (!tankReadings) return [];
    Object.keys(litrosAsignadosPorTanque).forEach(tId => {
      const config = TANKS_CONFIG.find(t => t.id === tId);
      if (!config) return;
      const currentLiters = parseFloat(tankReadings?.[tId]?.liters) || 0;
      const libre = config.maxLiters - currentLiters;
      const asignado = litrosAsignadosPorTanque[tId] || 0;
      if (asignado > libre) alertas.push({ name: config.name, sobra: asignado - libre });
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

  const archivarMensaje = async (id: string) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'solicitudes_rrhh', id), { archivado: true });
  };

  const archivarIncidente = async (id: string) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reportes_incidentes', id), { archivado: true });
  };

  const exportarRRHHeExcel = () => {
    const data = solicitudes.map(s => ({ 'Fecha': new Date(s.fecha).toLocaleString(), 'Empleado': s.empleado, 'Tipo': s.tipo, 'Contenido': s.tipo === 'MEDICO' ? 'Certificado adjunto' : s.contenido }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Solicitudes RRHH");
    XLSX.writeFile(wb, "Reporte_Buzon_RRHH.xlsx");
  };

  const exportarPlanillaOficial = () => {
    const data = historialOficial.map(dia => {
      const row: any = { 'Fecha': dia.date, 'Responsable': dia.responsable };
      TANKS_CONFIG.forEach(t => { row[t.name] = Math.round(dia.tanks?.[t.id]?.fin || 0); });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial Oficial");
    XLSX.writeFile(wb, "Planilla_Mes_Consolidado.xlsx");
  };

  const exportarAuditoriaSpotExcel = () => {
    const data = auditoriaSpot.map(c => ({
      'Fecha Operativa': c.fecha,
      'Operador': c.operador,
      'Turno': c.turno,
      'Tarea': c.titulo,
      'Categoría': c.categoria,
      'Frecuencia Oficial': c.freq,
      'Estado Reportado': c.estado,
      'Hora Exacta del Reporte': new Date(c.timestamp).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria SPOT");
    XLSX.writeFile(wb, "Auditoria_SPOT_Consolidada.xlsx");
  };

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
      {viewImg && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewImg(null)}>
          <img src={viewImg} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95" alt="Certificado" />
        </div>
      )}
      
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

      {/* SIDEBAR DE GERENCIA UNIFICADO */}
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
            { id: 'auditoria_spot', label: 'Auditoría Spot!', icon: <Coffee className="w-4 h-4 text-[#D6006E]"/> },
            { id: 'rrhh', label: 'Buzón de RRHH', icon: <MessageSquare className="w-4 h-4"/> },
            { id: 'incidentes', label: 'Reporte de Incidentes', icon: <AlertTriangle className="w-4 h-4 text-rose-500"/> }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeMenu === item.id ? 'bg-[#E20074] text-white shadow-md shadow-pink-200' : 'text-slate-500 hover:bg-slate-50'}`}>{item.icon} {item.label}</button>
          ))}
        </nav>
        <button onClick={() => navigate('/')} className="mt-6 p-3 text-slate-400 hover:text-[#E20074] font-black text-[10px] uppercase tracking-widest border border-dashed rounded-xl transition-colors">Salir al Home</button>
      </aside>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        {/* PLAYA: MONITOR */}
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

        {/* PLAYA: PEDIDOS */}
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
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-3">
                {CAMIONES_CONFIG[tipoCamion].map((cisterna, idx) => {
                  const tanqueAsignadoId = camionState[idx] || 'vacio';
                  return (
                    <div key={cisterna.id} className="p-4 bg-slate-50 border rounded-2xl flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
                      <div className="w-40">
                        <p className="font-black text-xs text-slate-700 flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-slate-400" /> Compartimento {idx + 1}</p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase">Capacidad: {cisterna.max.toLocaleString()} L</p>
                      </div>
                      <div className="flex-1 flex gap-2 items-center w-full lg:w-auto mt-2 lg:mt-0">
                        <select value={tanqueAsignadoId} onChange={(e) => { const newState = [...camionState]; newState[idx] = e.target.value; setCamionState(newState); }} className="w-full lg:w-64 p-2 text-[10px] font-bold uppercase border bg-white rounded-xl outline-none text-slate-700">
                          <option value="vacio">-- CISTERNA VACÍA --</option>
                          {TANKS_CONFIG.map(t => {
                            const currentStock = tankReadings?.[t.id]?.liters ? parseFloat(tankReadings[t.id].liters) : 0;
                            const libre = Math.max(0, Math.round(t.maxLiters - currentStock));
                            return <option key={t.id} value={t.id}>{t.name} (Libre: {libre.toLocaleString()} L)</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 italic mb-2">Resumen de Carga Acumulada por Tanque</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {TANKS_CONFIG.map(t => {
                    const currentStock = tankReadings?.[t.id]?.liters ? parseFloat(tankReadings?.[t.id].liters) : 0;
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
              <div className={`p-6 rounded-[2.5rem] text-white text-left shadow-xl sticky top-4 transition-all duration-300 ${validacionEspacioLibre.length > 0 ? 'bg-rose-950 border-4 border-red-500 shadow-red-900/20' : 'bg-slate-900'}`}>
                <h3 className="font-black uppercase italic mb-4 text-[#E20074] text-xs">Cálculo del Pedido</h3>
                {validacionEspacioLibre.length > 0 ? (
                  <div className="space-y-2">
                    {validacionEspacioLibre.map((al, i) => (
                      <div key={i} className="p-3 rounded-xl bg-red-500/20 border border-red-500 animate-pulse flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <div><p className="text-[9px] font-black uppercase text-red-400">REBALSARÍA: {al.name}</p><p className="text-xs font-black">Supera por +{Math.round(al.sobra).toLocaleString()} L</p></div>
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
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'datos' && (
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
               <div><h3 className="font-black uppercase italic text-slate-800 flex items-center gap-2"><ClipboardList className="text-[#E20074]"/> Libro Diario Oficial Histórico</h3></div>
               <div className="flex gap-2">
                 <button onClick={() => loadDataForDate(getYesterdayISOString())} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"><History className="w-3.5 h-3.5"/> Cargar Manual</button>
                 <button onClick={exportarPlanillaOficial} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-md transition-all"><Download className="w-3.5 h-3.5"/> Exportar Excel</button>
               </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b">
                  <tr><th className="p-3">Fecha</th><th className="p-3">Responsable Oficial</th>{TANKS_CONFIG.map(t=>(<th key={t.id} className="p-3 font-bold text-center">{t.name} (L)</th>))}<th className="p-3 text-right font-bold">Estado</th></tr>
                </thead>
                <tbody>
                  {historialOficial && historialOficial.length > 0 ? (
                    historialOficial.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-800 font-black">{log.date}</td><td className="p-3 text-slate-600">{log.responsable}</td>
                        {TANKS_CONFIG.map(t => (<td key={t.id} className="p-3 text-center text-slate-800">{log.tanks && log.tanks[t.id] ? Math.round(log.tanks[t.id].fin || 0).toLocaleString() : '0'} L</td>))}
                        <td className="p-3 text-right text-emerald-600">Auditado</td>
                      </tr>
                    ))
                  ) : (<tr><td colSpan={TANKS_CONFIG.length + 3} className="p-10 text-center text-slate-400 font-bold">No hay historial oficial.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NUEVO MÓDULO: AUDITORÍA SPOT! (UBICADO EN GERENCIA) */}
        {activeMenu === 'auditoria_spot' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="bg-white p-5 rounded-3xl border shadow-sm flex justify-between items-center border-t-4 border-[#D6006E]">
               <div><h3 className="font-black uppercase italic text-slate-800 text-sm flex items-center gap-2"><Coffee className="text-[#D6006E]"/> Auditoría Operativa de Spot!</h3></div>
               <button onClick={exportarAuditoriaSpotExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm transition-all"><Download className="w-3.5 h-3.5"/> Exportar Reporte</button>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr className="font-black text-slate-500">
                      <th className="p-3">Fecha</th><th className="p-3">Operador</th><th className="p-3">Turno</th><th className="p-3">Tarea Registrada</th><th className="p-3">Frecuencia</th><th className="p-3 text-center">Estado Marcado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoriaSpot && auditoriaSpot.length > 0 ? auditoriaSpot.map(item => (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{item.fecha}</td>
                        <td className="p-3 font-semibold">{item.operador}</td>
                        <td className="p-3 font-medium text-slate-400">{item.turno}</td>
                        <td className="p-3 font-black text-slate-800 uppercase">{item.titulo}</td>
                        <td className="p-3"><span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{item.freq}</span></td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${item.estado === 'REALIZADO' ? 'bg-emerald-100 text-emerald-700' : item.estado === 'NO REALIZADO' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={6} className="p-10 text-center font-bold text-slate-400">Sin registros de auditoría de Spot!.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RRHH GENERAL UNIFICADO */}
        {activeMenu === 'rrhh' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-3xl border shadow-sm flex justify-between items-center border-t-4 border-[#E20074]">
               <div><h3 className="font-black uppercase italic text-slate-800 text-sm">Mensajes del Personal ({solicitudes.length})</h3></div>
               <button onClick={exportarRRHHeExcel} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-sm transition-all"><Download className="w-3.5 h-3.5"/> Exportar Reporte</button>
            </div>
            {solicitudes.length === 0 ? (
              <div className="bg-white border rounded-2xl p-10 text-center font-bold text-slate-400 italic">Buzón de solicitudes vacío.</div>
            ) : solicitudes.map(sol => (
               <div key={sol.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5"><span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-wider">{sol.tipo}</span><span className="text-[10px] text-slate-300 font-bold">{new Date(sol.fecha).toLocaleString()}</span></div>
                    <h4 className="font-black text-slate-800 text-sm uppercase italic mb-2">{sol.empleado}</h4>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      {sol.tipo === 'MEDICO' ? (<button onClick={() => setViewImg(sol.contenido)} className="text-emerald-600 hover:text-emerald-700 font-black text-xs uppercase flex items-center gap-1.5 outline-none transition-colors"><Eye className="w-4 h-4"/> Abrir Certificado Adjunto</button>) : (<p className="text-slate-600 text-xs font-semibold leading-relaxed">"{sol.contenido}"</p>)}
                    </div>
                  </div>
                  <button onClick={() => archivarMensaje(sol.id)} className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-black text-[9px] uppercase tracking-wider rounded-xl border transition-colors">Marcar como Leído</button>
               </div>
            ))}
          </div>
        )}

        {/* INCIDENTES */}
        {activeMenu === 'incidentes' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-3xl border shadow-sm border-t-4 border-rose-500"><h3 className="font-black uppercase italic text-slate-800 text-sm">Incidentes Reportados ({incidentes.length})</h3></div>
            {incidentes.length === 0 ? (
              <div className="bg-white border rounded-2xl p-10 text-center font-bold text-slate-400 italic">No hay incidentes reportados.</div>
            ) : incidentes.map(inc => (
               <div key={inc.id} className="bg-white p-5 rounded-[2rem] shadow-sm border flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5"><span className="text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded uppercase tracking-wider">INCIDENCIA EN TURNO</span><span className="text-[10px] text-slate-300 font-bold">{new Date(inc.fecha).toLocaleString()}</span></div>
                    <h4 className="font-black text-slate-800 text-sm uppercase italic mb-2">Operador: {inc.empleado}</h4>
                    <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl"><p className="text-slate-700 text-xs font-semibold leading-relaxed">"{inc.detalle}"</p></div>
                  </div>
                  <button onClick={() => archivarIncidente(inc.id)} className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-black text-[9px] uppercase tracking-wider rounded-xl border transition-colors">Marcar como Resuelto</button>
               </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// CENTRAL OPERATIVA: PLAYA / SPOT! UNIFICADO
// ==========================================
function OperacionesEstacion() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSpotView = location.pathname === '/spot';
  
  // ESTADOS SPOT
  const [responsableSpot, setResponsableSpot] = useState('');
  const [pinInputSpot, setPinInputSpot] = useState('');
  const [turnoSpot, setTurnoSpot] = useState<'MAÑANA' | 'TARDE' | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'rrhh'>('checklist');
  const [historialDia, setHistorialDia] = useState<Record<string, string>>({});
  const [mensualesRealizadas, setMensualesRealizadas] = useState<string[]>([]);

  // BASES MATEMÁTICAS FECHAS SPOT (Dinámicas en renderizado para evitar cacheo de hora)
  const baseHoy = useMemo(() => new Date(), []);
  const fechaHoyStr = useMemo(() => `${baseHoy.getFullYear()}-${String(baseHoy.getMonth() + 1).padStart(2, '0')}-${String(baseHoy.getDate()).padStart(2, '0')}`, [baseHoy]);
  const numeroDiaSemana = baseHoy.getDay(); 
  const diaDelAño = Math.floor((baseHoy.getTime() - new Date(baseHoy.getFullYear(), 0, 0).getTime()) / 86400000);
  const diffPastilla = Math.floor((baseHoy.getTime() - new Date('2026-05-07T00:00:00').getTime()) / 86400000);
  const diffAntartida = Math.floor((baseHoy.getTime() - new Date('2026-05-06T00:00:00').getTime()) / 86400000);

  useEffect(() => {
    if (!isSpotView || !responsableSpot) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'historial_checklist_spot'));
    
    return onSnapshot(q, (snap) => {
      const mapeo: Record<string, string> = {};
      const mensualesTerminadas: string[] = [];
      const mesActual = baseHoy.getMonth();

      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.fecha === fechaHoyStr) {
          mapeo[d.tareaId] = d.estado;
        }
        if (d.freq === 'mensual' && d.estado === 'REALIZADO') {
            const fechaDoc = new Date(d.fecha);
            if(fechaDoc.getMonth() === mesActual) mensualesTerminadas.push(d.tareaId);
        }
      });
      setHistorialDia(mapeo);
      setMensualesRealizadas(mensualesTerminadas);
    });
  }, [isSpotView, responsableSpot, fechaHoyStr, baseHoy]);

  // ALGORITMO FILTRO TAREAS SPOT (Aplica al instante)
  const tareasFiltradasHoy = useMemo(() => {
    return CONFIG_TAREAS_SPOT.filter(tarea => {
      if (tarea.shift !== 'AMBOS' && tarea.shift !== turnoSpot) return false;
      if (tarea.freq === 'diaria') return true;
      if (tarea.freq === 'semanal' && tarea.days && tarea.days.includes(numeroDiaSemana)) return true;
      if (tarea.freq === 'dxm') return diaDelAño % 2 === 0;
      if (tarea.freq === 'c2d') return diffPastilla >= 0 && diffPastilla % 3 === 0;
      if (tarea.freq === 'quincenal') return diffAntartida >= 0 && diffAntartida % 15 === 0;
      if (tarea.freq === 'mensual') return !mensualesRealizadas.includes(tarea.id);
      if (tarea.freq === 'bimestral') {
        const mesActual = baseHoy.getMonth() + 1;
        const diaDelMes = baseHoy.getDate();
        if ([6, 8, 10, 12].includes(mesActual) && diaDelMes === 15) return true;
      }
      return false;
    });
  }, [numeroDiaSemana, diaDelAño, turnoSpot, diffPastilla, diffAntartida, mensualesRealizadas]);

  // TAREAS PENDIENTES (FILTRO PARA QUE DESAPAREZCAN AL PRESIONAR)
  const tareasPendientes = tareasFiltradasHoy.filter(tarea => !historialDia[tarea.id]);

  const registrarEstadoTareaSpot = async (tarea: any, estado: string) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'historial_checklist_spot'), {
        tareaId: tarea.id, titulo: tarea.title, categoria: tarea.category, estado: estado,
        operador: responsableSpot, turno: turnoSpot, fecha: fechaHoyStr, freq: tarea.freq,
        timestamp: new Date().toISOString()
      });
    } catch (e) { alert("Error de red"); }
  };

  // ESTADOS Y EFECTOS DE PLAYA
  const [activeTab, setActiveTab] = useState('varillas');
  const [tankReadings, setTankReadings] = useState<any>(STOCK_INICIAL_AL_DIA_ACTUAL);
  const [dailyLogs, setDailyLogs] = useState<any[]>(DATOS_HISTORICOS);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', message: '', inputValue: '', onConfirm: null });
  const [selectedMonthStr, setSelectedMonthStr] = useState('');

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

  const availableMonths = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const months = new Set([currentMonth, ...dailyLogs.map(log => log.date.substring(0, 7))]);
    return [...months].sort().reverse();
  }, [dailyLogs]);

  useEffect(() => { if (availableMonths.length > 0 && !availableMonths.includes(selectedMonthStr)) setSelectedMonthStr(availableMonths[0]); }, [availableMonths, selectedMonthStr]);
  const filteredLogs = useMemo(() => { if (!selectedMonthStr) return []; return dailyLogs.filter(log => log.date.startsWith(selectedMonthStr)).sort((a, b) => a.date.localeCompare(b.date)); }, [dailyLogs, selectedMonthStr]);

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
        } else updated[tankId].liters = parseFloat(value) || 0;
      }
      return updated;
    });
  };

  const guardarDescarga = async () => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: tankReadings });
    setTankReadings((prev: any) => { const reset = { ...prev }; Object.keys(reset).forEach(k => { reset[k] = { ...reset[k], desc: '' }; }); return reset; });
    setModalConfig({ isOpen: true, type: 'success', title: 'Descarga Sincronizada', message: 'Impactó en monitor.', inputValue: '', onConfirm: () => setActiveTab('monitor') });
  };

  const iniciarCierreDia = () => {
    if (!TANKS_CONFIG.some(tank => tankReadings[tank.id]?.mm !== '' || tankReadings[tank.id]?.liters > 0)) { alert('Faltan datos de varilla.'); return; }
    const fechaAyerIso = getYesterdayISOString();
    setModalConfig({ isOpen: true, type: 'prompt', title: 'Firma de Responsable', message: `Este registro corresponderá al cierre de ayer (${fechaAyerIso}). Ingrese firma:`, inputValue: '', onConfirm: (resp: string) => ejecutarCierreDia(resp, fechaAyerIso) });
  };

  const ejecutarCierreDia = async (responsable: string, fechaAyerIso: string) => {
    if (!responsable || responsable.trim() === '') return;
    try {
      const priorLogs = dailyLogs.filter(log => log.date < fechaAyerIso).sort((a,b) => b.date.localeCompare(a.date));
      const lastLog = priorLogs.length > 0 ? priorLogs[0] : null;
      const newLog: any = { id: Date.now(), date: fechaAyerIso, responsable: responsable, tanks: {} };
      
      TANKS_CONFIG.forEach(tank => {
        const inicio = lastLog?.tanks?.[tank.id]?.fin || 0; 
        const desc = parseFloat(tankReadings?.[tank.id]?.desc) || 0; 
        const fin = parseFloat(tankReadings?.[tank.id]?.liters) || 0; 
        newLog.tanks[tank.id] = { inicio, desc, fin, lv: inicio + desc - fin };
      });

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registros_oficiales_v4', newLog.id.toString()), newLog);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registros_diarios'), { fecha: new Date().toISOString(), readings: tankReadings });
      
      const nuevoEstado: any = {};
      TANKS_CONFIG.forEach(t => { nuevoEstado[t.id] = { mm: '', liters: newLog.tanks[t.id].fin, desc: '' }; });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'estado_actual', 'varillas_oficiales_v4'), { readings: nuevoEstado });
      
      setModalConfig({ isOpen: true, type: 'success', title: '¡Cierre Exitoso!', message: `Datos guardados en la nube.`, inputValue: '', onConfirm: () => setActiveTab('registro') });
    } catch (error) { alert("Error al guardar. Revisá tu conexión."); }
  };

  // RENDER SPOT
  if (isSpotView) {
    if (!responsableSpot || !turnoSpot) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-slate-800 border">
            <div className="text-center mb-6">
              <div className="h-12 w-14 bg-[#D6006E] rounded-2xl flex items-center justify-center font-black text-white italic mx-auto text-xs mb-3">SPOT</div>
              <h2 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Control de Turno Spot!</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1.5">1. Seleccionar Colaborador:</label>
                <select value={responsableSpot} onChange={(e) => setResponsableSpot(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs text-slate-700 outline-none">
                  <option value="">-- SELECCIONE SU NOMBRE --</option>
                  {PERSONAL_SPOT.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>
              {responsableSpot && (
                <div className="animate-in fade-in duration-300 space-y-3">
                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1.5">2. Clave de Acceso:</label>
                    <input type="password" value={pinInputSpot} onChange={(e) => setPinInputSpot(e.target.value)} placeholder="••••" className="w-full p-3 border rounded-xl text-center font-black text-2xl tracking-[0.5rem] bg-slate-50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1.5">3. Asignación de Turno:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => {
                        const verif = PERSONAL_SPOT.find(p => p.nombre === responsableSpot);
                        if (verif && pinInputSpot === verif.pin) { setTurnoSpot('MAÑANA'); } else { alert("PIN INCORRECTO"); }
                      }} className="bg-slate-800 text-white font-black p-3.5 rounded-xl uppercase text-[10px] tracking-wider hover:bg-slate-900 transition-colors">☀️ Mañana (06-14)</button>
                      <button onClick={() => {
                        const verif = PERSONAL_SPOT.find(p => p.nombre === responsableSpot);
                        if (verif && pinInputSpot === verif.pin) { setTurnoSpot('TARDE'); } else { alert("PIN INCORRECTO"); }
                      }} className="bg-indigo-600 text-white font-black p-3.5 rounded-xl uppercase text-[10px] tracking-wider hover:bg-indigo-700 transition-colors">🌙 Tarde (14-22)</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/')} className="mt-6 text-slate-400 font-bold block mx-auto text-[9px] uppercase tracking-widest outline-none hover:text-slate-600">Volver a la Central</button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden text-slate-800">
           <div className="bg-[#D6006E] p-6 flex justify-between items-center text-white">
              <div><h2 className="text-2xl font-black ">CHECKLIST SPOT!</h2><p className="text-xs font-bold">OPERADOR: {responsableSpot.toUpperCase()} | {turnoSpot}</p></div>
              <button onClick={() => { setResponsableSpot(''); setTurnoSpot(null); setPinInputSpot(''); navigate('/'); }} className="p-2 bg-white/20 rounded-full"><X/></button>
           </div>
           
           {/* MENÚ SUPERIOR DE SPOT! CON BOTÓN DE DESCARGA */}
           <div className="flex border-b flex-wrap">
             <button onClick={() => setActiveSubTab('checklist')} className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider ${activeSubTab === 'checklist' ? 'text-[#D6006E] border-b-4 border-[#D6006E]' : 'text-slate-400'}`}>📋 Tareas del Día</button>
             <button onClick={() => setActiveSubTab('rrhh')} className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider ${activeSubTab === 'rrhh' ? 'text-[#D6006E] border-b-4 border-[#D6006E]' : 'text-slate-400'}`}>✉️ Buzón RRHH Directo</button>
             
             {/* NUEVO BOTÓN: MANUAL OPERATIVO SPOT */}
             <a href="/Manual_de_operaciones_Spot.pdf" target="_blank" rel="noopener noreferrer" className="flex-1 py-4 font-bold text-xs uppercase tracking-wider text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 flex items-center justify-center gap-2 border-l border-slate-100 transition-colors">
               <FileText className="w-4 h-4"/> 📖 Manual Operativo
             </a>
           </div>

           <div className="p-4 bg-slate-50 min-h-[450px]">
              {activeSubTab === 'checklist' ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-white p-3 rounded-xl border mb-3 flex justify-between items-center text-xs text-slate-400 font-bold shadow-sm">
                    <span>Tareas pendientes para este turno</span>
                    <span className="bg-[#E20074] text-white px-2 py-1 rounded-lg font-black">{tareasPendientes.length} Tareas</span>
                  </div>
                  
                  {tareasPendientes.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-3xl border-2 border-dashed border-emerald-200 shadow-sm animate-in zoom-in">
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-black text-slate-800 mb-2">¡Turno Completado!</h3>
                      <p className="font-bold text-slate-500">Has reportado el estado de todas tus tareas oficiales.</p>
                    </div>
                  ) : (
                    tareasPendientes.map(tarea => (
                      <div key={tarea.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm gap-4 hover:shadow-md transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{tarea.category}</span>
                            {tarea.desc && <span className="text-[9px] text-indigo-600 font-bold italic">{tarea.desc}</span>}
                          </div>
                          <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{tarea.title}</h4>
                        </div>
                        {/* 3 BOTONES DE REPORTE EXIGIDOS */}
                        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                          <button onClick={() => registrarEstadoTareaSpot(tarea, 'REALIZADO')} className="flex-1 md:flex-none px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm">Realizado ✓</button>
                          <button onClick={() => registrarEstadoTareaSpot(tarea, 'NO REALIZADO')} className="flex-1 md:flex-none px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">No Realizado X</button>
                          <button onClick={() => registrarEstadoTareaSpot(tarea, 'NO FUE NECESARIO')} className="flex-1 md:flex-none px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-all shadow-sm">No Necesario</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : <RRHHView />}
           </div>
        </div>
      </div>
    );
  }

  // RENDER PLAYA MAIN (Si no es SpotView)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-8 font-sans text-slate-800 w-full">
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-slate-800">{modalConfig.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{modalConfig.message}</p>
            {modalConfig.type === 'prompt' && (
              <input type="text" autoFocus value={modalConfig.inputValue} onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})} className="w-full p-2 border rounded-xl mb-4 font-bold outline-none focus:border-indigo-500 text-slate-800" placeholder="Firma / Responsable..." />
            )}
            <div className="flex gap-2">
              {modalConfig.type !== 'success' && <button onClick={closeModal} className="flex-1 p-2 rounded-xl text-slate-500 font-bold hover:bg-slate-50">Cancelar</button>}
              <button onClick={handleModalConfirm} className="flex-1 bg-indigo-600 text-white p-2 rounded-xl font-bold hover:bg-indigo-700">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl w-full mb-6 flex flex-wrap lg:flex-nowrap gap-2 bg-white p-2 rounded-2xl shadow-sm border">
        <button onClick={() => setActiveTab('varillas')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'varillas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><Ruler className="w-4 h-4"/> 1. Varillado</button>
        <button onClick={() => setActiveTab('descarga')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'descarga' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500'}`}><Truck className="w-4 h-4"/> 2. Descarga Camión</button>
        <button onClick={() => setActiveTab('monitor')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'monitor' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}><Database className="w-4 h-4"/> 3. Monitor Online</button>
        <button onClick={() => setActiveTab('registro')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'registro' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}><ClipboardList className="w-4 h-4"/> 4. Planilla Mes</button>
        <button onClick={() => setActiveTab('rrhh')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'rrhh' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500'}`}><MessageSquare className="w-4 h-4"/> 5. Buzón RRHH</button>
        <button onClick={() => setActiveTab('incidencias')} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 ${activeTab === 'incidencias' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500'}`}><AlertTriangle className="w-4 h-4"/> 6. Reporte Incidencias</button>
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
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 border-b font-bold">Fecha</th>
                    {TANKS_CONFIG.map(t => (<th key={t.id} className="p-3 border-b text-center font-bold">{t.name}</th>))}
                    <th className="p-3 border-b font-bold">Resp.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs && filteredLogs.length > 0 ? (
                    filteredLogs.map((log: any) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-bold">{formatDateDisplay(log.date)}</td>
                        {TANKS_CONFIG.map(t => (
                          <td key={t.id} className="p-3 text-center text-slate-800">
                            {log.tanks && log.tanks[t.id] ? Math.round(log.tanks[t.id].fin || 0).toLocaleString() : '0'} L
                          </td>
                        ))}
                        <td className="p-3 text-slate-600 font-medium">{log.responsable}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={TANKS_CONFIG.length + 2} className="p-10 text-center text-slate-400 font-bold">
                        No hay registros disponibles para este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rrhh' && <RRHHView />}
        {activeTab === 'incidencias' && <IncidenciasView />}
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
            <h3 className="text-xl font-black text-gray-800 uppercase italic mb-8">Seguridad</h3>
            <form onSubmit={verificarPin}>
              <input autoFocus type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 border-b-4 border-[#E20074] bg-slate-50 text-center text-4xl tracking-[0.5rem] mb-10 outline-none font-black text-gray-800" placeholder="••••" />
              <div className="flex gap-4"><button type="button" onClick={() => setTargetModulo(null)} className="flex-1 font-bold text-slate-400 uppercase text-[9px] italic">Atrás</button><button type="submit" className="flex-1 bg-[#E20074] text-white py-4 rounded-2xl font-black uppercase text-[10px]">Entrar</button></div>
            </form>
          </div>
        </div>
      )}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-8 px-10 flex items-center gap-4 shadow-xl">
        <div className="h-14 w-14 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center font-black italic text-pink-600 text-xs">AXION</div>
        <div><h1 className="text-2xl font-black uppercase italic leading-none text-white tracking-tighter">Gestión Operativa v6.0</h1><p className="text-white/80 text-[9px] font-bold uppercase tracking-widest mt-1 italic">AXION Crespo — A y A Jacob S.R.L.</p></div>
      </header>
      <main className="flex-grow flex items-center justify-center p-6 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[ 
            { id: 'playa', label: 'Playa / Tanques', img: PlayaIcon, fallback: '⛽' }, 
            { id: 'spot', label: 'Spot / Ventas', img: SpotIcon, fallback: '☕' }, 
            { id: 'gerencia', label: 'Gerencia', img: AxionLogo, fallback: '⚙️' } 
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
      <footer className="py-6 text-center text-white/40 text-[9px] font-black uppercase tracking-widest italic">A y A Jacob S.R.L. — 2026</footer>
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