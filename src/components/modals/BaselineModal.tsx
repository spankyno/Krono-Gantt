import React, { useState } from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import { compareTaskWithBaseline } from '../../utils/baselineUtils';
import {
  X,
  Ghost,
  Camera,
  CheckCircle,
  AlertCircle,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

interface BaselineModalProps {
  onClose: () => void;
}

export const BaselineModal: React.FC<BaselineModalProps> = ({ onClose }) => {
  const {
    tasks,
    baselines,
    settings,
    saveBaseline,
    deleteBaseline,
    setActiveBaseline,
    toggleGhostMode,
  } = useGanttStore();

  const theme = getTheme(settings.colorMode, settings.themePalette);
  const [newBaselineName, setNewBaselineName] = useState('');
  const [newBaselineDesc, setNewBaselineDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const activeBaseline = baselines.find((b) => b.id === settings.activeBaselineId) || null;

  // Compute metrics for active baseline
  const metrics = React.useMemo(() => {
    if (!activeBaseline) return null;
    let delayed = 0;
    let onTrack = 0;
    let ahead = 0;
    let maxDelay = 0;

    tasks.forEach((t) => {
      const diff = compareTaskWithBaseline(t, activeBaseline);
      if (diff.hasBaseline) {
        if (diff.status === 'delayed') {
          delayed++;
          if (diff.endDelayDays > maxDelay) maxDelay = diff.endDelayDays;
        } else if (diff.status === 'ahead') {
          ahead++;
        } else {
          onTrack++;
        }
      }
    });

    return { delayed, onTrack, ahead, maxDelay, total: tasks.length };
  }, [tasks, activeBaseline]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaselineName.trim()) return;
    saveBaseline(newBaselineName.trim(), newBaselineDesc.trim());
    setNewBaselineName('');
    setNewBaselineDesc('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Ghost className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Líneas Base & Modo Fantasma</h2>
              <p className="text-xs text-neutral-400">
                Guarda planes originales y compara visualmente desviaciones en el tiempo
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Ghost Mode Toggle Banner */}
          <div
            className="p-4 rounded-xl border flex items-center justify-between transition-colors"
            style={{
              backgroundColor: settings.showGhostMode ? `${theme.colors.primary}15` : 'rgba(255,255,255,0.03)',
              borderColor: settings.showGhostMode ? theme.colors.primary : theme.colors.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  settings.showGhostMode ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/10 text-neutral-400'
                }`}
              >
                <Ghost className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Modo Fantasma (Ghost Mode)</h4>
                <p className="text-xs text-neutral-400">
                  Superpone las barras originales del plan detrás del diagrama con contornos translúcidos
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleGhostMode()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                settings.showGhostMode
                  ? 'bg-purple-600 text-white shadow-md hover:bg-purple-500'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20'
              }`}
            >
              {settings.showGhostMode ? (
                <>
                  <Eye className="w-4 h-4" /> Activado
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Desactivado
                </>
              )}
            </button>
          </div>

          {/* Deviation Metrics Overview */}
          {metrics && (
            <div className="grid grid-cols-4 gap-3">
              <div
                className="p-3 rounded-xl border text-center"
                style={{ backgroundColor: `${theme.colors.bgApp}80`, borderColor: theme.colors.border }}
              >
                <span className="text-[11px] text-neutral-400 block mb-1">En Plazo</span>
                <span className="text-lg font-bold text-emerald-400">{metrics.onTrack}</span>
              </div>
              <div
                className="p-3 rounded-xl border text-center"
                style={{ backgroundColor: `${theme.colors.bgApp}80`, borderColor: theme.colors.border }}
              >
                <span className="text-[11px] text-neutral-400 block mb-1">Con Retraso</span>
                <span className="text-lg font-bold text-red-400">{metrics.delayed}</span>
              </div>
              <div
                className="p-3 rounded-xl border text-center"
                style={{ backgroundColor: `${theme.colors.bgApp}80`, borderColor: theme.colors.border }}
              >
                <span className="text-[11px] text-neutral-400 block mb-1">Adelantadas</span>
                <span className="text-lg font-bold text-blue-400">{metrics.ahead}</span>
              </div>
              <div
                className="p-3 rounded-xl border text-center"
                style={{ backgroundColor: `${theme.colors.bgApp}80`, borderColor: theme.colors.border }}
              >
                <span className="text-[11px] text-neutral-400 block mb-1">Retraso Máx.</span>
                <span className="text-lg font-bold text-amber-400">+{metrics.maxDelay}d</span>
              </div>
            </div>
          )}

          {/* Create New Snapshot Form */}
          {isCreating ? (
            <form onSubmit={handleSave} className="p-4 rounded-xl border space-y-3 bg-black/30" style={{ borderColor: theme.colors.borderLight }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-purple-400" /> Capturar Estado Actual de {tasks.length} Tareas
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <input
                type="text"
                autoFocus
                placeholder="Nombre (ej. Plan Original de Lanzamiento v1)"
                value={newBaselineName}
                onChange={(e) => setNewBaselineName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-900 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
                required
              />

              <input
                type="text"
                placeholder="Descripción u observaciones opcionales..."
                value={newBaselineDesc}
                onChange={(e) => setNewBaselineDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-900 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  Guardar Línea Base
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 px-4 rounded-xl border border-dashed hover:border-purple-500 hover:bg-purple-500/5 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: theme.colors.borderLight }}
            >
              <Camera className="w-4 h-4" />
              <span>Guardar Nueva Línea Base (Instantánea del Plan Actual)</span>
            </button>
          )}

          {/* List of Saved Baselines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Líneas Base Guardadas ({baselines.length})
            </h4>

            {baselines.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-2">
                No hay líneas base guardadas. Captura una instantánea para comenzar a comparar.
              </p>
            ) : (
              <div className="space-y-2">
                {baselines.map((bl) => {
                  const isActive = bl.id === settings.activeBaselineId;
                  const taskCount = Object.keys(bl.tasks).length;

                  return (
                    <div
                      key={bl.id}
                      onClick={() => setActiveBaseline(bl.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isActive
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'hover:bg-white/5 border-transparent'
                      }`}
                      style={{
                        backgroundColor: isActive ? undefined : `${theme.colors.bgApp}60`,
                        borderColor: isActive ? undefined : theme.colors.border,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isActive ? 'border-purple-400 bg-purple-400' : 'border-neutral-500'
                          }`}
                        >
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-white flex items-center gap-2">
                            <span>{bl.name}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300">
                                Activa
                              </span>
                            )}
                          </div>
                          {bl.description && (
                            <p className="text-[11px] text-neutral-400 mt-0.5">{bl.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                            <span>{new Date(bl.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{taskCount} tareas capturadas</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => deleteBaseline(bl.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
                          title="Eliminar esta línea base"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-6 py-4 border-t shrink-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bgHeader }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
