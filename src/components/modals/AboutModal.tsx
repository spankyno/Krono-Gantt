import React, { useState } from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import {
  X,
  Info,
  Layers,
  Code2,
  BookOpen,
  Keyboard,
  Sparkles,
  Ghost,
  DollarSign,
  Upload,
  Download,
  Calendar,
  CheckCircle2,
  MousePointer,
  Move,
  ArrowRight,
  ExternalLink,
  Cpu,
  Palette,
  ShieldCheck,
} from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
  defaultTab?: 'overview' | 'instructions' | 'stack' | 'shortcuts';
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose, defaultTab = 'overview' }) => {
  const { settings } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  const [activeTab, setActiveTab] = useState<'overview' | 'instructions' | 'stack' | 'shortcuts'>(defaultTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        }}
      >
        {/* Modal Top Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bgHeader }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-sm">
              KG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">KronoGantt</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wider">
                  v1.2.0 • Pro
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Plataforma SPA de alto rendimiento para creación y gestión de Diagramas de Gantt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex items-center px-6 border-b shrink-0 gap-2 overflow-x-auto text-xs font-medium"
          style={{ borderColor: theme.colors.border, backgroundColor: `${theme.colors.bgHeader}80` }}
        >
          {[
            { id: 'overview', label: 'Funcionalidades', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'instructions', label: 'Instrucciones de Uso', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'stack', label: 'Stack Tecnológico', icon: <Code2 className="w-3.5 h-3.5" /> },
            { id: 'shortcuts', label: 'Atajos de Teclado', icon: <Keyboard className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300 leading-relaxed">
          {/* TAB 1: FUNCIONALIDADES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-transparent border border-blue-500/20">
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" /> Rendimiento sin compromisos inspirado en Linear y Notion
                </h3>
                <p className="text-neutral-300">
                  KronoGantt ha sido diseñado desde cero para proyectos complejos con cientos de tareas. Combina un editor de tabla estructurado en árbol con un motor gráfico reactivo capaz de proporcionar respuesta visual inmediata en 60 FPS sin retrasos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border space-y-2 bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <MousePointer className="w-4 h-4" />
                    </span>
                    Drag & Drop Multidimensional
                  </div>
                  <p className="text-neutral-400">
                    Desplaza tareas en bloque con ajuste inteligente a la cuadrícula temporal. Redimensiona fechas de inicio y fin desde tiradores dedicados en los extremos y ajusta el progreso arrastrando el deslizador interno.
                  </p>
                </div>

                <div className="p-4 rounded-xl border space-y-2 bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Ghost className="w-4 h-4" />
                    </span>
                    Líneas Base & Modo Fantasma
                  </div>
                  <p className="text-neutral-400">
                    Captura instantáneas del plan original en cualquier fase. El "Modo Fantasma" superpone el plan base como siluetas translúcidas con indicadores de retraso o adelanto exacto (+Nd / -Nd).
                  </p>
                </div>

                <div className="p-4 rounded-xl border space-y-2 bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    Control Financiero y Presupuestario
                  </div>
                  <p className="text-neutral-400">
                    Asigna tarifas horarias a tu equipo de recursos y costes fijos a las tareas. KronoGantt calcula automáticamente el presupuesto vs coste real, emitiendo alertas cuando se supera el margen.
                  </p>
                </div>

                <div className="p-4 rounded-xl border space-y-2 bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Upload className="w-4 h-4" />
                    </span>
                    Interoperabilidad Total (XML & Excel)
                  </div>
                  <p className="text-neutral-400">
                    Importa y exporta en el estándar XML de Microsoft Project (compatible con MS Project, Primavera y Smartsheet), así como importación de hojas de cálculo Excel (.xlsx / .csv) con mapeo asistido de columnas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTRUCCIONES DE USO */}
          {activeTab === 'instructions' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  Gestión y Creación de Tareas
                </h3>
                <div className="pl-8 space-y-2 text-neutral-300">
                  <p>• <strong>Nueva Tarea:</strong> Haz clic en el botón azul superior <em>"+ Añadir Tarea"</em> o en la fila inferior de la tabla lateral.</p>
                  <p>• <strong>Edición Rápida (Inline):</strong> Haz <em>doble clic</em> sobre el nombre de cualquier tarea en la tabla para renombrarla inmediatamente con el teclado (pulsa <em>Enter</em> para guardar o <em>Escape</em> para cancelar).</p>
                  <p>• <strong>Fases y Grupos:</strong> Puedes estructurar tu proyecto en Fases jerárquicas colapsables con el icono de flecha.</p>
                  <p>• <strong>Hitos (Milestones):</strong> Las tareas con duración de 0 días se convierten automáticamente en hitos con forma de rombo en el cronograma.</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4" style={{ borderColor: theme.colors.border }}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">2</span>
                  Interacciones en el Diagrama Gráfico
                </h3>
                <div className="pl-8 space-y-2 text-neutral-300">
                  <p>• <strong>Mover Tarea:</strong> Haz clic sobre el cuerpo de la barra y arrastra hacia la izquierda o derecha. Las fechas de inicio y fin se desplazarán juntas ajustándose a los días.</p>
                  <p>• <strong>Redimensionar Inicio / Fin:</strong> Pasa el ratón sobre los extremos de la barra y arrastra los tiradores izquierdo o derecho.</p>
                  <p>• <strong>Ajustar Progreso:</strong> Arrastra el círculo blanco central que aparece al pasar el cursor sobre la barra para fijar el porcentaje (0% a 100%).</p>
                  <p>• <strong>Crear Dependencias:</strong> Pasa el cursor sobre una tarea, haz clic en el punto conector derecho y arrastra la línea punteada hacia la tarea sucesora para vincularlas con una flecha.</p>
                  <p>• <strong>Eliminar Dependencia:</strong> Pasa el cursor sobre la flecha que une dos tareas y haz clic en el icono rojo con la cruz (x).</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4" style={{ borderColor: theme.colors.border }}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  Líneas Base y Modo Fantasma
                </h3>
                <div className="pl-8 space-y-2 text-neutral-300">
                  <p>• Abre el panel <strong>"Líneas Base"</strong> en la barra superior y pulsa <em>"Guardar Nueva Línea Base"</em> para capturar una instantánea del plan original.</p>
                  <p>• Activa el interruptor <strong>"Modo Fantasma"</strong> en la barra superior. Verás barras fantasma translúcidas con el plan original proyectadas detrás de las barras reales y etiquetas de desvío automático (ej. <em>+3d retraso</em>).</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4" style={{ borderColor: theme.colors.border }}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">4</span>
                  Exportación de Alta Resolución
                </h3>
                <div className="pl-8 space-y-2 text-neutral-300">
                  <p>• Pulsa <strong>"Exportar"</strong> para generar documentos en PDF apaisado, imágenes PNG a 2x de resolución, vectores SVG nativos, archivos XML de Microsoft Project o libros Excel (.xlsx).</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STACK TECNOLÓGICO */}
          {activeTab === 'stack' && (
            <div className="space-y-5">
              <p className="text-neutral-400">
                KronoGantt está construido utilizando tecnologías web modernas de última generación, optimizado para ejecutarse como Single Page Application (SPA) ultra veloz y desplegable con cero configuración en Vercel:
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">React 19 + TypeScript</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Core</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Arquitectura basada en componentes funcionales estrictamente tipados con hooks avanzados y concurrencia.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">Zustand</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Estado</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Gestión de estado global reactivo sin boilerplate, con pila inmutable de Deshacer/Rehacer (Undo/Redo) y persistencia en localStorage.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">Vite 8 & Tailwind CSS v4</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Build & Estilos</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Empaquetado ultrarrápido con soporte nativo de CSS variables, 4 paletas de autor y alternancia instantánea Dark/Light.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">SVG Vectorial Directo</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Motor Gráfico</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Renderizado gráfico por capas SVG con curvas Bézier cúbicas, aceleración por hardware y nula pixelación a cualquier nivel de zoom.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">SheetJS (xlsx)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Excel</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Procesamiento e importación en el navegador de hojas de cálculo con detección y mapeo automático de cabeceras.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border bg-black/20" style={{ borderColor: theme.colors.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">jsPDF + Sanitizador Color</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">Exportación</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    Motor de rasterización y conversión vectorial de alta fidelidad con resolución 2x y conversión segura de espacios de color modernos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATAJOS DE TECLADO */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <p className="text-neutral-400">
                Aumenta tu velocidad de trabajo en KronoGantt con los siguientes atajos de teclado globales:
              </p>

              <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: theme.colors.border }}>
                {[
                  { keys: ['Ctrl', 'Z'], desc: 'Deshacer la última acción de edición o movimiento' },
                  { keys: ['Ctrl', 'Y'], desc: 'Rehacer la última acción deshecha' },
                  { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Rehacer alternativa (Mac y Linux)' },
                  { keys: ['Enter'], desc: 'Abrir el modal de detalle completo de la tarea seleccionada' },
                  { keys: ['Supr', 'o', 'Backspace'], desc: 'Eliminar la tarea actualmente seleccionada' },
                  { keys: ['Esc'], desc: 'Deseleccionar tarea activa o cerrar modales abiertos' },
                  { keys: ['Doble Clic'], desc: 'Edición rápida en línea del nombre de la tarea' },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-black/10 hover:bg-white/5 transition-colors">
                    <span className="text-neutral-300">{s.desc}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-[11px] font-semibold shadow"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          className="flex items-center justify-between px-6 py-3.5 border-t shrink-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bgHeader }}
        >
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>KronoGantt • 100% Client-Side SPA • Listo para desplegar en Vercel</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
