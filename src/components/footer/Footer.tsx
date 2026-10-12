import React from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import {
  Info,
  BookOpen,
  Keyboard,
  Code2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface FooterProps {
  onOpenAbout: (tab?: 'overview' | 'instructions' | 'stack' | 'shortcuts') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  const { tasks, settings } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <footer
      className="h-8 border-t flex items-center justify-between px-4 select-none shrink-0 text-[11px] transition-colors z-30"
      style={{
        backgroundColor: theme.colors.bgHeader,
        borderColor: theme.colors.border,
        color: theme.colors.textSecondary,
      }}
    >
      {/* Left Links Group */}
      <div className="flex items-center gap-3">
        {/* Main "Acerca de..." Link as requested */}
        <button
          onClick={() => onOpenAbout('overview')}
          className="flex items-center gap-1.5 font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Ver funcionalidad, instrucciones y stack técnico"
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span className="hover:underline">Acerca de KronoGantt...</span>
        </button>

        <span className="opacity-30">•</span>

        <button
          onClick={() => onOpenAbout('instructions')}
          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <BookOpen className="w-3 h-3 text-purple-400" />
          <span className="hover:underline">Instrucciones de Uso</span>
        </button>

        <span className="opacity-30 hidden sm:inline">•</span>

        <button
          onClick={() => onOpenAbout('stack')}
          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer hidden sm:flex"
        >
          <Code2 className="w-3 h-3 text-emerald-400" />
          <span className="hover:underline">Stack Tecnológico</span>
        </button>

        <span className="opacity-30 hidden md:inline">•</span>

        <button
          onClick={() => onOpenAbout('shortcuts')}
          className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer hidden md:flex"
        >
          <Keyboard className="w-3 h-3 text-amber-400" />
          <span className="hover:underline">Atajos de Teclado</span>
        </button>
      </div>

      {/* Right Stats & Badge */}
      <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
        <div className="flex items-center gap-1.5 hidden lg:flex">
          <Layers className="w-3 h-3 opacity-60" />
          <span>
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'} ({completedCount} completadas)
          </span>
        </div>

        <span className="opacity-30 hidden lg:inline">•</span>

        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px]">Autoguardado Local</span>
        </div>

        <span className="opacity-30">•</span>

        <span className="font-mono text-[10px] opacity-70">v1.2.0</span>
      </div>
    </footer>
  );
};
