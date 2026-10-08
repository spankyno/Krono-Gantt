import React, { useState } from 'react';
import { ViewMode, ThemePalette, ColorMode, FontFamily } from '../../types/gantt';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Ghost,
  DollarSign,
  Download,
  Upload,
  Camera,
  Sun,
  Moon,
  RotateCcw,
  RotateCw,
  Search,
  Filter,
  Type,
  Palette,
  Sliders,
  Plus,
  HelpCircle,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';

interface ToolbarProps {
  onOpenBaselines: () => void;
  onOpenBudget: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onToggleZenMode: () => void;
  zenMode: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenBaselines,
  onOpenBudget,
  onOpenImport,
  onOpenExport,
  onToggleZenMode,
  zenMode,
}) => {
  const {
    settings,
    updateSettings,
    filter,
    setFilter,
    undo,
    redo,
    canUndo,
    canRedo,
    addTask,
    resetToDemo,
  } = useGanttStore();

  const theme = getTheme(settings.colorMode, settings.themePalette);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);

  // Zoom handlers
  const handleZoomIn = () => {
    updateSettings({ columnWidth: Math.min(120, settings.columnWidth + 8) });
  };

  const handleZoomOut = () => {
    updateSettings({ columnWidth: Math.max(16, settings.columnWidth - 8) });
  };

  const THEMES: { id: ThemePalette; name: string }[] = [
    { id: 'neon', name: 'Neón Minimalista' },
    { id: 'corporate', name: 'Corporativa Formal' },
    { id: 'pastel', name: 'Pastel Suave' },
    { id: 'neutral', name: 'Neutral Profesional' },
  ];

  const FONTS: { id: FontFamily; name: string }[] = [
    { id: 'Inter', name: 'Inter (SaaS)' },
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
    { id: 'Fira Code', name: 'Fira Code (Mono)' },
  ];

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-4 select-none shrink-0 transition-colors z-40 relative"
      style={{
        backgroundColor: theme.colors.bgHeader,
        borderColor: theme.colors.border,
      }}
    >
      {/* 1. Left: Brand & Quick Action */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-sm tracking-tighter">
            KG
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              KronoGantt
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 uppercase tracking-widest">
                PRO
              </span>
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Add Task Button */}
        <button
          onClick={() => addTask()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Tarea</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Middle: View Modes (Día / Semana / Mes / Trimestre) */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center p-0.5 rounded-xl border"
          style={{
            backgroundColor: `${theme.colors.bgSurface}90`,
            borderColor: theme.colors.borderLight,
          }}
        >
          {(['day', 'week', 'month', 'quarter'] as ViewMode[]).map((mode) => {
            const isActive = settings.viewMode === mode;
            const labels: Record<ViewMode, string> = {
              day: 'Día',
              week: 'Semana',
              month: 'Mes',
              quarter: 'Trimestre',
            };
            return (
              <button
                key={mode}
                onClick={() => {
                  let defaultW = 38;
                  if (mode === 'week') defaultW = 68;
                  if (mode === 'month') defaultW = 90;
                  if (mode === 'quarter') defaultW = 120;
                  updateSettings({ viewMode: mode, columnWidth: defaultW });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {/* Zoom In / Out */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
          <button
            onClick={handleZoomOut}
            title="Alejar Zoom"
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Acercar Zoom"
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ghost Mode Toggle */}
        <button
          onClick={() => updateSettings({ showGhostMode: !settings.showGhostMode })}
          title="Alternar Modo Fantasma (Línea Base original)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            settings.showGhostMode
              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
              : 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Ghost className="w-3.5 h-3.5" />
          <span>Modo Fantasma</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              settings.showGhostMode ? 'bg-purple-400 animate-pulse' : 'bg-neutral-600'
            }`}
          />
        </button>
      </div>

      {/* 3. Right: Tools, Features & Menus */}
      <div className="flex items-center gap-2">
        {/* Baselines Modal Trigger */}
        <button
          onClick={onOpenBaselines}
          title="Gestor de Líneas Base"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5 transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline">Líneas Base</span>
        </button>

        {/* Budget Modal Trigger */}
        <button
          onClick={onOpenBudget}
          title="Control de Costes y Presupuesto"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5 transition-colors"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Costes</span>
        </button>

        {/* Import Modal Trigger */}
        <button
          onClick={onOpenImport}
          title="Importar Excel / MS Project"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden xl:inline">Importar</span>
        </button>

        {/* Export Modal Trigger */}
        <button
          onClick={onOpenExport}
          title="Exportar a PDF / PNG / SVG / MS Project"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden xl:inline">Exportar</span>
        </button>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* Settings / Proportions Drawer Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setShowConfigMenu(!showConfigMenu);
              setShowThemeMenu(false);
            }}
            title="Ajustes de Proporciones y Visualización"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {showConfigMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl border p-4 shadow-2xl backdrop-blur-md z-50 animate-in fade-in duration-100"
              style={{
                backgroundColor: `${theme.colors.bgSurface}fa`,
                borderColor: theme.colors.borderLight,
                color: theme.colors.textPrimary,
              }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                Configurar Proporciones
              </h4>

              {/* Column Width */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Ancho Columnas Tiempo:</span>
                  <span className="font-mono">{settings.columnWidth}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={settings.columnWidth}
                  onChange={(e) => updateSettings({ columnWidth: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Row Height */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Altura de Filas:</span>
                  <span className="font-mono">{settings.rowHeight}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="60"
                  value={settings.rowHeight}
                  onChange={(e) => updateSettings({ rowHeight: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Left Grid Width */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Ancho Tabla Lateral:</span>
                  <span className="font-mono">{settings.gridWidth}px</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="700"
                  value={settings.gridWidth}
                  onChange={(e) => updateSettings({ gridWidth: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t space-y-2" style={{ borderColor: theme.colors.border }}>
                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                  <span>Líneas de Dependencia</span>
                  <input
                    type="checkbox"
                    checked={settings.showDependencies}
                    onChange={(e) => updateSettings({ showDependencies: e.target.checked })}
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                  <span>Días No Laborables (Festivos)</span>
                  <input
                    type="checkbox"
                    checked={settings.showNonWorkingDays}
                    onChange={(e) => updateSettings({ showNonWorkingDays: e.target.checked })}
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                  <span>Ajuste a la Cuadrícula (Snapping)</span>
                  <input
                    type="checkbox"
                    checked={settings.snapToGrid}
                    onChange={(e) => updateSettings({ snapToGrid: e.target.checked })}
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                  <span>Mostrar Leyenda Flotante</span>
                  <input
                    type="checkbox"
                    checked={settings.showLegend}
                    onChange={(e) => updateSettings({ showLegend: e.target.checked })}
                  />
                </label>
              </div>

              <div className="pt-3 border-t mt-3 flex justify-between">
                <button
                  onClick={resetToDemo}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400"
                  title="Restablecer proyecto de demostración"
                >
                  <RefreshCw className="w-3 h-3" /> Reiniciar Demo
                </button>
                <button
                  onClick={() => setShowConfigMenu(false)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme & Palette Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowConfigMenu(false);
            }}
            title="Personalizar Tema y Tipografía"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showThemeMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl border p-4 shadow-2xl backdrop-blur-md z-50 animate-in fade-in duration-100"
              style={{
                backgroundColor: `${theme.colors.bgSurface}fa`,
                borderColor: theme.colors.borderLight,
                color: theme.colors.textPrimary,
              }}
            >
              {/* Color Mode Switch */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: theme.colors.border }}>
                <span className="text-xs font-semibold text-neutral-300">Modo de Color</span>
                <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/5">
                  <button
                    onClick={() => updateSettings({ colorMode: 'dark' })}
                    className={`p-1.5 rounded ${
                      settings.colorMode === 'dark' ? 'bg-white/20 text-white' : 'text-neutral-500'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSettings({ colorMode: 'light' })}
                    className={`p-1.5 rounded ${
                      settings.colorMode === 'light' ? 'bg-white/20 text-white' : 'text-neutral-500'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Theme Palettes */}
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Paleta de Autor
                </span>
                <div className="space-y-1.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateSettings({ themePalette: t.id })}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        settings.themePalette === t.id
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'hover:bg-white/5 text-neutral-300'
                      }`}
                    >
                      <span>{t.name}</span>
                      {settings.themePalette === t.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Tipografía
                </span>
                <div className="space-y-1.5">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateSettings({ fontFamily: f.id })}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        settings.fontFamily === f.id
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'hover:bg-white/5 text-neutral-300'
                      }`}
                      style={{ fontFamily: f.id }}
                    >
                      <span>{f.name}</span>
                      {settings.fontFamily === f.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zen Mode / Fullscreen Toggle */}
        <button
          onClick={onToggleZenMode}
          title={zenMode ? 'Salir del Modo Zen' : 'Modo Zen / Presentación (Pantalla Completa)'}
          className={`p-1.5 rounded-lg transition-colors ${
            zenMode
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
