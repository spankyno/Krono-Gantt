import React, { useState } from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import {
  FolderPlus,
  X,
  FilePlus2,
  Sparkles,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const { settings, startNewProject } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  const [projectName, setProjectName] = useState('Nuevo Proyecto');
  const [templateMode, setTemplateMode] = useState<'starter' | 'blank'>('starter');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startNewProject(projectName.trim() || 'Nuevo Proyecto', templateMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
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
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <FolderPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Iniciar Nuevo Proyecto</h2>
              <p className="text-xs text-neutral-400">Crea un cronograma limpio para tu nuevo plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5 uppercase tracking-wider">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              required
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="ej. Rediseño Web 2026, Campaña Q4..."
              className="w-full px-3.5 py-2.5 rounded-xl border bg-black/30 text-white text-sm focus:border-blue-500 focus:outline-none"
              style={{ borderColor: theme.colors.borderLight }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-2 uppercase tracking-wider">
              Tipo de Inicio
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Starter Template */}
              <div
                onClick={() => setTemplateMode('starter')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  templateMode === 'starter'
                    ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/50'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Plantilla Ágil</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Incluye una fase inicial, tareas estructuradas con dependencias y un hito de aprobación.
                </p>
              </div>

              {/* Option 2: Blank Project */}
              <div
                onClick={() => setTemplateMode('blank')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  templateMode === 'blank'
                    ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/50'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FilePlus2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Lienzo en Blanco</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Comienza desde cero con una sola tarea inicial vacía para diseñar libremente.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              El proyecto previo quedará guardado en la pila de historial. Podrás pulsar <strong>Ctrl+Z</strong> si deseas deshacer este cambio.
            </span>
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-between pt-4 border-t mt-4"
            style={{ borderColor: theme.colors.border }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
            >
              <span>Crear Proyecto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
