import React from 'react';
import { Task, Resource, Baseline } from '../../types/gantt';
import { ThemeConfig, STATUS_LABELS, PRIORITY_LABELS } from '../../utils/themeUtils';
import { compareTaskWithBaseline } from '../../utils/baselineUtils';
import { calculateTaskCost, formatCurrency } from '../../utils/costUtils';
import { Calendar, Clock, DollarSign, User, AlertTriangle } from 'lucide-react';

interface GanttTooltipProps {
  task: Task;
  x: number;
  y: number;
  theme: ThemeConfig;
  resources: Resource[];
  activeBaseline: Baseline | null;
}

export const GanttTooltip: React.FC<GanttTooltipProps> = ({
  task,
  x,
  y,
  theme,
  resources,
  activeBaseline,
}) => {
  const resource = resources.find((r) => r.id === task.assigneeId);
  const baselineDiff = compareTaskWithBaseline(task, activeBaseline);
  const cost = calculateTaskCost(task, resources);

  return (
    <div
      className="fixed z-50 pointer-events-none rounded-xl p-3.5 shadow-2xl border text-xs max-w-xs transition-opacity duration-150 backdrop-blur-md"
      style={{
        left: `${x + 15}px`,
        top: `${y - 10}px`,
        backgroundColor: `${theme.colors.bgSurface}f2`,
        borderColor: theme.colors.borderLight,
        color: theme.colors.textPrimary,
        boxShadow: '0 12px 30px -4px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b pb-2 mb-2" style={{ borderColor: theme.colors.border }}>
        <div>
          <div className="font-semibold text-sm leading-tight text-white">{task.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${theme.colors.statusBar[task.status]}25`,
                color: theme.colors.statusBar[task.status],
              }}
            >
              {STATUS_LABELS[task.status]}
            </span>
            <span className="text-[10px] opacity-75">
              Prioridad: {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 opacity-60" />
          <span>
            {task.startDate} al {task.endDate}
          </span>
          <span className="opacity-60 ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.duration} {task.duration === 1 ? 'día' : 'días'}
          </span>
        </div>

        {/* Assignee */}
        {resource && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 opacity-60" />
            <span>{resource.name}</span>
            <span className="text-[10px] opacity-60 ml-auto">({resource.role})</span>
          </div>
        )}

        {/* Progress */}
        <div className="pt-1">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="opacity-75">Progreso</span>
            <span className="font-semibold">{task.progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${task.progress}%`,
                backgroundColor: theme.colors.primary,
              }}
            />
          </div>
        </div>

        {/* Baseline (Modo Fantasma) Info */}
        {baselineDiff.hasBaseline && (
          <div
            className="mt-2 pt-2 border-t flex items-center justify-between"
            style={{ borderColor: theme.colors.border }}
          >
            <span className="opacity-75">Plan Original:</span>
            <span
              className={`font-medium px-1.5 py-0.5 rounded text-[10px] ${
                baselineDiff.status === 'delayed'
                  ? 'bg-red-500/20 text-red-400'
                  : baselineDiff.status === 'ahead'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {baselineDiff.displayText}
            </span>
          </div>
        )}

        {/* Cost & Budget Info */}
        <div
          className="mt-2 pt-2 border-t flex flex-col gap-1"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center justify-between">
            <span className="opacity-75 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Coste Actual:
            </span>
            <span className="font-mono font-medium">{formatCurrency(cost.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-75">Presupuesto:</span>
            <span className="font-mono">{formatCurrency(cost.budget)}</span>
          </div>
          {cost.isOverBudget && (
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-medium mt-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Supera presupuesto por +{cost.overBudgetPercentage}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
