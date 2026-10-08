import React, { useState } from 'react';
import { Task, Resource, TaskStatus, TaskPriority, TaskType } from '../../types/gantt';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/themeUtils';
import { calculateTaskCost, formatCurrency } from '../../utils/costUtils';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Calendar,
  AlertTriangle,
  Flag,
  Folder,
  CheckCircle2,
  Clock,
  MoreHorizontal,
} from 'lucide-react';

interface TaskTableProps {
  visibleTasks: Task[];
}

export const TaskTable: React.FC<TaskTableProps> = ({ visibleTasks }) => {
  const {
    tasks,
    resources,
    settings,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    duplicateTask,
    addTask,
    toggleGroupExpand,
  } = useGanttStore();

  const theme = getTheme(settings.colorMode, settings.themePalette);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [inlineName, setInlineName] = useState('');

  const handleStartEdit = (taskId: string, field: string, currentValue: string) => {
    setEditingField({ id: taskId, field });
    setInlineName(currentValue);
  };

  const handleSaveEdit = (taskId: string, field: string) => {
    if (editingField) {
      if (field === 'name') {
        updateTask(taskId, { name: inlineName.trim() || 'Tarea sin título' });
      }
      setEditingField(null);
    }
  };

  return (
    <div
      className="flex flex-col select-none border-r transition-colors"
      style={{
        width: `${settings.gridWidth}px`,
        backgroundColor: theme.colors.bgSurface,
        borderColor: theme.colors.border,
      }}
    >
      {/* Table Header (56px to match Gantt timeline header) */}
      <div
        className="sticky top-0 z-20 flex items-center border-b text-xs font-semibold uppercase tracking-wider shrink-0 px-3"
        style={{
          height: '56px',
          backgroundColor: theme.colors.bgHeader,
          borderColor: theme.colors.border,
          color: theme.colors.textSecondary,
        }}
      >
        <div className="w-8 shrink-0 text-center">#</div>
        <div className="flex-1 min-w-[180px] pl-2">Nombre de Tarea</div>
        <div className="w-24 shrink-0 text-center">Estado</div>
        <div className="w-20 shrink-0 text-center">Fechas</div>
        <div className="w-16 shrink-0 text-center">Progreso</div>
        <div className="w-24 shrink-0 text-center">Responsable</div>
        {settings.showCostColumns && <div className="w-24 shrink-0 text-right pr-2">Coste</div>}
        <div className="w-12 shrink-0 text-center">Acciones</div>
      </div>

      {/* Table Body (Rows matching settings.rowHeight) */}
      <div className="flex flex-col">
        {visibleTasks.map((task, index) => {
          const isSelected = selectedTaskId === task.id;
          const resource = resources.find((r) => r.id === task.assigneeId);
          const cost = calculateTaskCost(task, resources);
          const isGroup = task.type === 'group';
          const isMilestone = task.type === 'milestone';
          const isSubtask = !!task.parentId;

          return (
            <div
              key={task.id}
              className={`flex items-center text-xs border-b transition-colors group cursor-pointer ${
                isSelected ? 'ring-1 ring-inset ring-blue-500/50' : ''
              }`}
              style={{
                height: `${settings.rowHeight}px`,
                backgroundColor: isSelected
                  ? `${theme.colors.primary}18`
                  : 'transparent',
                borderColor: theme.colors.border,
              }}
              onClick={() => setSelectedTaskId(task.id)}
            >
              {/* Row Number / Index */}
              <div
                className="w-8 shrink-0 text-center font-mono opacity-40 text-[10px]"
                style={{ color: theme.colors.textMuted }}
              >
                {index + 1}
              </div>

              {/* Task Name & Indentation */}
              <div
                className="flex-1 min-w-[180px] flex items-center pr-2 overflow-hidden"
                style={{ paddingLeft: isSubtask ? '24px' : '6px' }}
              >
                {/* Group Expand / Collapse */}
                {isGroup ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupExpand(task.id);
                    }}
                    className="p-1 mr-1 rounded hover:bg-white/10 text-white/70"
                  >
                    {task.isExpanded === false ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : isMilestone ? (
                  <Flag className="w-3.5 h-3.5 mr-2 text-emerald-400 shrink-0" />
                ) : (
                  <div
                    className="w-2 h-2 rounded-full mr-2 shrink-0"
                    style={{ backgroundColor: task.color || theme.colors.statusBar[task.status] }}
                  />
                )}

                {/* Inline Editable Name */}
                {editingField?.id === task.id && editingField?.field === 'name' ? (
                  <input
                    type="text"
                    autoFocus
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    onBlur={() => handleSaveEdit(task.id, 'name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(task.id, 'name');
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    className="w-full bg-black/40 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`truncate cursor-text ${
                      isGroup
                        ? 'font-bold text-white tracking-wide'
                        : isMilestone
                        ? 'font-medium text-emerald-300'
                        : 'text-neutral-200'
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(task.id, 'name', task.name);
                    }}
                  >
                    {task.name}
                  </span>
                )}
              </div>

              {/* Status Select */}
              <div className="w-24 shrink-0 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="bg-transparent border border-transparent hover:border-white/20 rounded px-1.5 py-1 text-[11px] font-medium outline-none cursor-pointer w-full text-center truncate"
                  style={{
                    color: theme.colors.statusBar[task.status],
                    backgroundColor: `${theme.colors.statusBar[task.status]}18`,
                  }}
                >
                  <option value="todo" className="bg-neutral-900 text-white">Por Hacer</option>
                  <option value="in_progress" className="bg-neutral-900 text-white">En Progreso</option>
                  <option value="review" className="bg-neutral-900 text-white">Revisión</option>
                  <option value="done" className="bg-neutral-900 text-white">Completada</option>
                  <option value="blocked" className="bg-neutral-900 text-white">Bloqueada</option>
                </select>
              </div>

              {/* Duration / Dates */}
              <div
                className="w-20 shrink-0 text-center font-mono text-[11px] opacity-75"
                title={`${task.startDate} al ${task.endDate}`}
              >
                {isMilestone ? 'Hito' : `${task.duration} d`}
              </div>

              {/* Progress Slider / Quick input */}
              <div className="w-16 shrink-0 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={task.progress}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      updateTask(task.id, {
                        progress: val,
                        status: val === 100 ? 'done' : val > 0 ? 'in_progress' : 'todo',
                      });
                    }}
                    className="w-10 bg-transparent text-right font-mono text-[11px] outline-none text-neutral-300"
                  />
                  <span className="text-[10px] opacity-60">%</span>
                </div>
              </div>

              {/* Assignee */}
              <div className="w-24 shrink-0 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || undefined })}
                  className="bg-transparent border border-transparent hover:border-white/20 rounded px-1 py-0.5 text-[11px] outline-none cursor-pointer w-full text-neutral-300 truncate"
                >
                  <option value="" className="bg-neutral-900 text-neutral-400">Sin Asignar</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                      {r.name.split(' ')[0]} ({r.role.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost & Budget Alert */}
              {settings.showCostColumns && (
                <div className="w-24 shrink-0 text-right pr-2 font-mono text-[11px]">
                  <div className="flex items-center justify-end gap-1">
                    <span className={cost.isOverBudget ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
                      {formatCurrency(cost.totalCost)}
                    </span>
                    {cost.isOverBudget && (
                      <span title={`Supera presupuesto (+${cost.overBudgetPercentage}%)`}>
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Button */}
              <div className="w-12 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateTask(task.id);
                  }}
                  title="Duplicar tarea"
                  className="p-1 hover:text-white text-neutral-400 rounded"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  title="Eliminar tarea"
                  className="p-1 hover:text-red-400 text-neutral-400 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Row Button at bottom of table */}
        <button
          onClick={() => addTask()}
          className="flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Añadir nueva tarea...</span>
        </button>
      </div>
    </div>
  );
};
