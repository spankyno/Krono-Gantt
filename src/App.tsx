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
          className="shrink-0 overflow-y-auto overflow-x-hidden border-r transition-all"
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

        {/* Right Gantt Chart Area */}
        <div
          ref={rightGanttContainerRef}
          onScroll={handleRightScroll}
          className="gantt-chart-area flex-1 overflow-auto relative"
          style={{
            backgroundColor: theme.colors.bgTimeline,
            overflowX: 'auto', // Forzar la aparición de la barra horizontal
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
