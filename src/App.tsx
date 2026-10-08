import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useGanttStore } from './store/useGanttStore';
import { getTheme } from './utils/themeUtils';
import { Task } from './types/gantt';
import { Toolbar } from './components/toolbar/Toolbar';
import { FilterBar } from './components/toolbar/FilterBar';
import { TaskTable } from './components/table/TaskTable';
import { GanttChart } from './components/gantt/GanttChart';
import { LegendPanel } from './components/legend/LegendPanel';
import { TaskDetailModal } from './components/modals/TaskDetailModal';
import { BaselineModal } from './components/modals/BaselineModal';
import { BudgetModal } from './components/modals/BudgetModal';
import { ImportModal } from './components/modals/ImportModal';
import { ExportModal } from './components/modals/ExportModal';

export default function App() {
  const {
    tasks,
    settings,
    filter,
    selectedTaskId,
    setSelectedTaskId,
    deleteTask,
    undo,
    redo,
    updateSettings,
  } = useGanttStore();

  const theme = getTheme(settings.colorMode, settings.themePalette);

  // Modals state
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // References for synchronized scrolling & exports
  const appContainerRef = useRef<HTMLDivElement>(null);
  const leftTableContainerRef = useRef<HTMLDivElement>(null);
  const rightGanttContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Divider resize state
  const [isResizingGrid, setIsResizingGrid] = useState(false);

  // Filter tasks
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesNotes = t.notes ? t.notes.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesNotes) return false;
      }
      // Status filter
      if (filter.statusFilter !== 'all' && t.status !== filter.statusFilter) {
        return false;
      }
      // Priority filter
      if (filter.priorityFilter !== 'all' && t.priority !== filter.priorityFilter) {
        return false;
      }
      // Assignee filter
      if (filter.assigneeFilter !== 'all' && t.assigneeId !== filter.assigneeFilter) {
        return false;
      }

      // Group collapse filter: if parent is collapsed, hide subtask
      if (t.parentId) {
        const parent = tasks.find((p) => p.id === t.parentId);
        if (parent && parent.isExpanded === false) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filter]);

  // Horizontal scroll tracking
  const [scrollProgress, setScrollProgress] = useState(0);

  // Synchronized Vertical Scrolling between Task Table and Gantt Chart
  const handleLeftScroll = () => {
    if (leftTableContainerRef.current && rightGanttContainerRef.current) {
      rightGanttContainerRef.current.scrollTop = leftTableContainerRef.current.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (leftTableContainerRef.current && rightGanttContainerRef.current) {
      leftTableContainerRef.current.scrollTop = rightGanttContainerRef.current.scrollTop;
    }
    if (rightGanttContainerRef.current) {
      const maxScroll = rightGanttContainerRef.current.scrollWidth - rightGanttContainerRef.current.clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((rightGanttContainerRef.current.scrollLeft / maxScroll) * 100);
      }
    }
  };

  const handleHorizontalPan = (delta: number) => {
    if (rightGanttContainerRef.current) {
      rightGanttContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const handleScrollbarSlider = (valuePercent: number) => {
    if (rightGanttContainerRef.current) {
      const maxScroll = rightGanttContainerRef.current.scrollWidth - rightGanttContainerRef.current.clientWidth;
      rightGanttContainerRef.current.scrollLeft = (valuePercent / 100) * maxScroll;
      setScrollProgress(valuePercent);
    }
  };

  const handleJumpToToday = () => {
    if (rightGanttContainerRef.current) {
      const todayEl = rightGanttContainerRef.current.querySelector('.today-indicator line');
      if (todayEl) {
        const x = parseFloat(todayEl.getAttribute('x1') || '0');
        rightGanttContainerRef.current.scrollTo({
          left: Math.max(0, x - rightGanttContainerRef.current.clientWidth / 2),
          behavior: 'smooth',
        });
      }
    }
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected task: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTaskId) {
        e.preventDefault();
        deleteTask(selectedTaskId);
        return;
      }

      // Edit selected task details: Enter or Space
      if (e.key === 'Enter' && selectedTaskId) {
        e.preventDefault();
        setShowTaskDetailModal(true);
        return;
      }

      // Escape: Deselect or close modals
      if (e.key === 'Escape') {
        setSelectedTaskId(null);
        setShowTaskDetailModal(false);
        setShowBaselineModal(false);
        setShowBudgetModal(false);
        setShowImportModal(false);
        setShowExportModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, undo, redo, deleteTask, setSelectedTaskId]);

  // Split view dragging
  useEffect(() => {
    if (!isResizingGrid) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(800, e.clientX));
      updateSettings({ gridWidth: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizingGrid(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingGrid, updateSettings]);

  return (
    <div
      ref={appContainerRef}
      className={`w-screen h-screen flex flex-col overflow-hidden select-none transition-colors ${
        settings.colorMode === 'dark' ? 'dark' : ''
      }`}
      style={{
        backgroundColor: theme.colors.bgApp,
        color: theme.colors.textPrimary,
        fontFamily: settings.fontFamily,
      }}
    >
      {/* 1. Header Toolbar */}
      <Toolbar
        onOpenBaselines={() => setShowBaselineModal(true)}
        onOpenBudget={() => setShowBudgetModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onToggleZenMode={() => setZenMode(!zenMode)}
        zenMode={zenMode}
      />

      {/* 2. Sub-toolbar Filter Bar (Hidden in Zen Mode) */}
      {!zenMode && <FilterBar />}

      {/* 3. Main Split View: Left Task Table + Right Gantt Chart */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Table Panel */}
        <div
          ref={leftTableContainerRef}
          onScroll={handleLeftScroll}
          className="shrink-0 overflow-y-auto overflow-x-hidden no-scrollbar border-r transition-all"
          style={{
            width: `${settings.gridWidth}px`,
            backgroundColor: theme.colors.bgSurface,
            borderColor: theme.colors.border,
          }}
          onDoubleClick={() => {
            if (selectedTaskId) setShowTaskDetailModal(true);
          }}
        >
          <TaskTable visibleTasks={visibleTasks} />
        </div>

        {/* Resizable Divider Handle */}
        <div
          onMouseDown={() => setIsResizingGrid(true)}
          className="w-1.5 hover:w-2 -ml-1 z-30 cursor-col-resize hover:bg-blue-500 transition-all bg-transparent group relative shrink-0"
          title="Arrastra para cambiar el ancho de la tabla"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Right Gantt Chart Area + Dedicated Horizontal Scrollbar */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          <div
            ref={rightGanttContainerRef}
            onScroll={handleRightScroll}
            className="gantt-chart-area flex-1 min-w-0 min-h-0 overflow-x-auto overflow-y-auto relative"
            style={{
              backgroundColor: theme.colors.bgTimeline,
            }}
            onDoubleClick={() => {
              if (selectedTaskId) setShowTaskDetailModal(true);
            }}
          >
            <GanttChart
              visibleTasks={visibleTasks}
              scrollContainerRef={rightGanttContainerRef}
              svgRef={svgRef}
            />
          </div>

          {/* Integrated Horizontal Timeline Scrollbar Track */}
          <div
            className="h-9 border-t flex items-center justify-between px-3 shrink-0 select-none z-30"
            style={{
              backgroundColor: theme.colors.bgHeader,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleHorizontalPan(-200)}
                title="Desplazar a la izquierda"
                className="px-2 py-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 text-xs font-semibold"
              >
                ◀
              </button>
              <button
                onClick={handleJumpToToday}
                className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30"
                title="Centrar cronograma en el día de hoy"
              >
                Hoy
              </button>
            </div>

            {/* Slider track representing horizontal timeline scrollbar */}
            <div className="flex-1 mx-4 flex items-center gap-2 max-w-xl">
              <span className="text-[10px] text-neutral-500 uppercase font-mono shrink-0">Inicio</span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={scrollProgress}
                onChange={(e) => handleScrollbarSlider(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                title="Barra de desplazamiento horizontal del cronograma"
              />
              <span className="text-[10px] text-neutral-500 uppercase font-mono shrink-0">Fin</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleHorizontalPan(200)}
                title="Desplazar a la derecha"
                className="px-2 py-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/10 text-xs font-semibold"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Floating Legend Dock */}
        {settings.showLegend && <LegendPanel />}
      </main>

      {/* Modals */}
      {showTaskDetailModal && selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setShowTaskDetailModal(false)}
        />
      )}

      {showBaselineModal && (
        <BaselineModal onClose={() => setShowBaselineModal(false)} />
      )}

      {showBudgetModal && (
        <BudgetModal onClose={() => setShowBudgetModal(false)} />
      )}

      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          containerRef={appContainerRef}
          svgRef={svgRef}
        />
      )}
    </div>
  );
}
