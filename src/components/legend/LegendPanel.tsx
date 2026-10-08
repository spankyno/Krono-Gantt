import React from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme, STATUS_LABELS } from '../../utils/themeUtils';
import { Flag, Layers, ArrowRight, Ghost, Calendar, X } from 'lucide-react';

interface LegendPanelProps {
  onClose?: () => void;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ onClose }) => {
  const { settings, updateSettings } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  if (!settings.showLegend) return null;

  return (
    <div
      className="absolute bottom-4 right-6 z-40 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs select-none max-w-xs transition-all animate-in slide-in-from-bottom-2 duration-200"
      style={{
        backgroundColor: `${theme.colors.bgSurface}ee`,
        borderColor: theme.colors.borderLight,
        color: theme.colors.textPrimary,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: theme.colors.border }}>
        <span className="font-bold text-[11px] uppercase tracking-wider text-neutral-400">
          Leyenda del Diagrama
        </span>
        <button
          onClick={() => (onClose ? onClose() : updateSettings({ showLegend: false }))}
          className="text-neutral-400 hover:text-white p-0.5 rounded"
          title="Ocultar leyenda"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Statuses */}
        <div>
          <span className="text-[10px] font-semibold text-neutral-400 block mb-1.5">Estados de Tarea</span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {Object.entries(theme.colors.statusBar).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                <span>{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Types */}
        <div className="pt-2 border-t" style={{ borderColor: theme.colors.border }}>
          <span className="text-[10px] font-semibold text-neutral-400 block mb-1.5">Tipos de Barra</span>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-2 rounded bg-blue-500" />
              <span>Tarea Estándar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rotate-45 bg-emerald-400" />
              <span>Hito / Milestone (Duración 0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-2 bg-indigo-500 rounded-t" />
              <span>Fase o Grupo Resumen</span>
            </div>
          </div>
        </div>

        {/* Ghost Mode & Lines */}
        <div className="pt-2 border-t" style={{ borderColor: theme.colors.border }}>
          <span className="text-[10px] font-semibold text-neutral-400 block mb-1.5">Guías y Análisis</span>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-2 rounded border border-dashed"
                style={{ backgroundColor: theme.colors.baselineBar, borderColor: theme.colors.baselineBorder }}
              />
              <span className="flex items-center gap-1">
                <Ghost className="w-3 h-3 text-purple-400" /> Modo Fantasma (Línea Base)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-0.5" style={{ backgroundColor: theme.colors.dependencyLine }} />
              <span>Precedencia (Dependencia)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-0.5 border-b-2 border-dashed" style={{ borderColor: theme.colors.todayLine }} />
              <span>Día Actual (Hoy)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
