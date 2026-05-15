import React from 'react';

export default function App() {
  // Funciones de navegación provisionales
  const navegarA = (modulo) => {
    console.log(`Navegando a: ${modulo}`);
    alert(`Abriendo Módulo ${modulo}`);
  };

  return (
    // FONDO: Magenta oficial de AXION Energy
    <div className="min-h-screen bg-[#E20074] flex flex-col justify-between font-sans">
      
      {/* HEADER / BIENVENIDA CON DESENFOQUE DE FONDO */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-4 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {/* LOGO GENERAL DE LA PLATAFORMA */}
            <div className="h-12 bg-white/90 p-2 rounded-xl shadow-sm flex items-center justify-center">
              <img 
                src="logo.png" 
                alt="AXION Energy Logo" 
                className="h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Plataforma de Gestión Integral
              </h1>
              <p className="text-xs text-white/80">
                A y A Jacob S.R.L. — Crespo, Entre Ríos
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 shadow-inner">
              ● Sistema Activo
            </span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: LAS TRES TARJETAS */}
      <main className="flex-grow flex items-center justify-center p-6 my-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          
          {/* MÓDULO: PLAYA */}
          <div 
            onClick={() => navegarA('PLAYA')}
            className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer border border-white/10"
          >
            <div>
              {/* Ícono específico de Playa */}
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center p-2 mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="playa.png" 
                  alt="Logo Playa" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = '⛽'; }}
                />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-3 tracking-tight group-hover:text-[#E20074] transition-colors">
                PLAYA
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Control de operaciones en pista, despacho de combustibles, asignación de turnos, control de playeros y cierres de surtidores.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-[#E20074] font-bold text-sm">
              <span>Ingresar a Pista</span>
              <span className="transform group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

          {/* MÓDULO: SPOT */}
          <div 
            onClick={() => navegarA('SPOT')}
            className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer border border-white/10"
          >
            <div>
              {/* Logo específico de Spot */}
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center p-2 mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="spot.png" 
                  alt="Logo Spot" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = '☕'; }}
                />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-3 tracking-tight group-hover:text-amber-600 transition-colors">
                SPOT
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Gestión integral de la tienda de conveniencia y cafetería, control de stock, facturación rápida, minutas y caja de salón.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-amber-600 font-bold text-sm">
              <span>Ingresar a Tienda</span>
              <span className="transform group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

          {/* MÓDULO: GERENCIA */}
          <div 
            onClick={() => navegarA('GERENCIA')}
            className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between cursor-pointer border border-white/10"
          >
            <div>
              {/* Contenedor corporativo para Gerencia usando el logo general */}
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center p-3 mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="logo.png" 
                  alt="Logo Gerencia" 
                  className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  onError={(e) => { e.target.src = '📊'; }}
                />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-3 tracking-tight group-hover:text-slate-700 transition-colors">
                GERENCIA
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Auditorías del programa ERA, paneles analíticos avanzados, conciliaciones, métricas clave de facturación y toma de decisiones.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-slate-700 font-bold text-sm">
              <span>Panel de Control</span>
              <span className="transform group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-black/10 backdrop-blur-sm border-t border-white/10 py-4 px-8 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} - AXION Network. Gestión Operativa de Estaciones.
      </footer>

    </div>
  );
}