import React, { useState } from 'react';
import { Task, Resource, TaskStatus, TaskPriority, TaskType } from '../../types/gantt';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme, STATUS_LABELS, PRIORITY_LABELS } from '../../utils/themeUtils';
import { calculateTaskCost, formatCurrency } from '../../utils/costUtils';
import { addDays } from '../../utils/dateUtils';
import {
  X,
  Calendar,
  DollarSign,
  User,
  Clock,
  Link,
  Trash2,
  AlertTriangle,
  Flag,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const { tasks, resources, settings, updateTask, deleteTask, addDependency, removeDependency } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const cost = calculateTaskCost(task, resources);

  // Available tasks to add as dependency
  const otherTasks = tasks.filter((t) => t.id !== task.id && !task.dependencies.includes(t.id));

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
            <span
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${theme.colors.primary}20` }}
            >
              {task.type === 'milestone' ? (
                <Flag className="w-5 h-5 text-emerald-400" />
              ) : task.type === 'group' ? (
                <Layers className="w-5 h-5 text-indigo-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-blue-400" />
              )}
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Detalle de la Tarea</h2>
              <p className="text-xs text-neutral-400">ID: {task.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Name & Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Nombre de la Tarea / Hito
            </label>
            <input
              type="text"
              value={task.name}
              onChange={(e) => updateTask(task.id, { name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border bg-black/30 text-white text-sm focus:border-blue-500 focus:outline-none"
              style={{ borderColor: theme.colors.borderLight }}
            />
          </div>

          {/* 2. Type, Status, Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Tipo</label>
              <select
                value={task.type}
                onChange={(e) => updateTask(task.id, { type: e.target.value as TaskType })}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-900 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
              >
                <option value="task">Tarea Estándar</option>
                <option value="milestone">Hito (Milestone)</option>
                <option value="group">Fase / Grupo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Estado</label>
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-900 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
              >
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="done">Completada</option>
                <option value="blocked">Bloqueada</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Prioridad</label>
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 rounded-lg border bg-neutral-900 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* 3. Dates & Progress */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Fecha Inicio</label>
              <input
                type="date"
                value={task.startDate}
                onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-black/30 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Fecha Fin</label>
              <input
                type="date"
                value={task.endDate}
                onChange={(e) => updateTask(task.id, { endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-black/30 text-white text-xs focus:outline-none"
                style={{ borderColor: theme.colors.borderLight }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">
                Progreso ({task.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={task.progress}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateTask(task.id, {
                    progress: val,
                    status: val === 100 ? 'done' : val > 0 ? 'in_progress' : 'todo',
                  });
                }}
                className="w-full mt-2 cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* 4. Assignee & Resource */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Responsable Asignado</label>
            <select
              value={task.assigneeId || ''}
              onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg border bg-neutral-900 text-white text-xs focus:outline-none"
              style={{ borderColor: theme.colors.borderLight }}
            >
              <option value="">Sin Asignar</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.role} ({formatCurrency(r.hourlyRate)}/h)
                </option>
              ))}
            </select>
          </div>

          {/* 5. Cost & Budget Tracking */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{ backgroundColor: `${theme.colors.bgApp}80`, borderColor: theme.colors.border }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Control Financiero de la Tarea
              </span>
              {cost.isOverBudget && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" /> Excede presupuesto (+{cost.overBudgetPercentage}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 text-[11px] block mb-1">Presupuesto (€)</label>
                <input
                  type="number"
                  value={task.budget ?? ''}
                  placeholder="0"
                  onChange={(e) => updateTask(task.id, { budget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded border bg-black/40 text-white text-xs focus:outline-none"
                  style={{ borderColor: theme.colors.borderLight }}
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] block mb-1">Horas Est.</label>
                <input
                  type="number"
                  value={task.estimatedHours ?? ''}
                  placeholder="40"
                  onChange={(e) => updateTask(task.id, { estimatedHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded border bg-black/40 text-white text-xs focus:outline-none"
                  style={{ borderColor: theme.colors.borderLight }}
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] block mb-1">Horas Reales</label>
                <input
                  type="number"
                  value={task.actualHours ?? ''}
                  placeholder="0"
                  onChange={(e) => updateTask(task.id, { actualHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded border bg-black/40 text-white text-xs focus:outline-none"
                  style={{ borderColor: theme.colors.borderLight }}
                />
              </div>

              <div>
                <label className="text-neutral-400 text-[11px] block mb-1">Coste Fijo (€)</label>
                <input
                  type="number"
                  value={task.fixedCost ?? ''}
                  placeholder="0"
                  onChange={(e) => updateTask(task.id, { fixedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded border bg-black/40 text-white text-xs focus:outline-none"
                  style={{ borderColor: theme.colors.borderLight }}
                />
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: theme.colors.border }}>
              <span className="text-neutral-400">Coste Total Calculado:</span>
              <span className="font-mono font-bold text-white text-sm">{formatCurrency(cost.totalCost)}</span>
            </div>
          </div>

          {/* 6. Dependencies (Predecessors) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 block flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-blue-400" /> Dependencias (Tareas Predecesoras)
            </label>
            <div className="flex flex-wrap gap-2">
              {task.dependencies.map((depId) => {
                const dep = tasks.find((t) => t.id === depId);
                return (
                  <span
                    key={depId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white/10 text-white"
                  >
                    <span>{dep ? dep.name : depId}</span>
                    <button
                      onClick={() => removeDependency(task.id, depId)}
                      className="hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {task.dependencies.length === 0 && (
                <span className="text-xs text-neutral-500 italic">No tiene predecesoras asociadas.</span>
              )}
            </div>

            {otherTasks.length > 0 && (
              <div className="pt-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addDependency(task.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 rounded border bg-neutral-900 text-xs text-neutral-300 focus:outline-none"
                  style={{ borderColor: theme.colors.borderLight }}
                >
                  <option value="">+ Vincular tarea predecesora...</option>
                  {otherTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 7. Notes */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 mb-1.5 block">Notas y Observaciones</label>
            <textarea
              rows={3}
              value={task.notes || ''}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              placeholder="Detalles técnicos, especificaciones o enlaces..."
              className="w-full px-3 py-2 rounded-lg border bg-black/30 text-white text-xs focus:outline-none"
              style={{ borderColor: theme.colors.borderLight }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t shrink-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bgHeader }}
        >
          <button
            onClick={() => {
              deleteTask(task.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Eliminar Tarea
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
