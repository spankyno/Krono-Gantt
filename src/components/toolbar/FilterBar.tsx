import React from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme, STATUS_LABELS, PRIORITY_LABELS } from '../../utils/themeUtils';
import { calculateProjectBudgetSummary, formatCurrency } from '../../utils/costUtils';
import {
  Search,
  Filter,
  X,
  AlertTriangle,
  User,
  CheckCircle2,
  DollarSign,
  Briefcase,
} from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { tasks, resources, settings, filter, setFilter } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);
  const budgetSummary = calculateProjectBudgetSummary(tasks, resources);

  const hasActiveFilters =
    filter.searchQuery ||
    filter.assigneeFilter !== 'all' ||
    filter.statusFilter !== 'all' ||
    filter.priorityFilter !== 'all';

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div
      className="h-10 border-b flex items-center justify-between px-4 text-xs select-none shrink-0 transition-colors"
      style={{
        backgroundColor: theme.colors.bgSurface,
        borderColor: theme.colors.border,
      }}
    >
      {/* Search and Filters */}
      <div className="flex items-center gap-2 flex-1 max-w-2xl">
        {/* Search input */}
        <div className="relative flex items-center w-52">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tarea..."
            value={filter.searchQuery}
            onChange={(e) => setFilter({ searchQuery: e.target.value })}
            className="w-full pl-8 pr-6 py-1 rounded-lg border bg-black/20 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none focus:border-blue-500"
            style={{ borderColor: theme.colors.borderLight }}
          />
          {filter.searchQuery && (
            <button
              onClick={() => setFilter({ searchQuery: '' })}
              className="absolute right-2 text-neutral-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filter.statusFilter}
          onChange={(e) => setFilter({ statusFilter: e.target.value })}
          className="px-2.5 py-1 rounded-lg border bg-neutral-900 text-neutral-300 text-xs outline-none cursor-pointer"
          style={{ borderColor: theme.colors.borderLight }}
        >
          <option value="all">Todos los Estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Assignee Filter */}
        <select
          value={filter.assigneeFilter}
          onChange={(e) => setFilter({ assigneeFilter: e.target.value })}
          className="px-2.5 py-1 rounded-lg border bg-neutral-900 text-neutral-300 text-xs outline-none cursor-pointer"
          style={{ borderColor: theme.colors.borderLight }}
        >
          <option value="all">Todos los Responsables</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() =>
              setFilter({
                searchQuery: '',
                assigneeFilter: 'all',
                statusFilter: 'all',
                priorityFilter: 'all',
              })
            }
            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-500/10"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Right: Quick KPI badges */}
      <div className="flex items-center gap-4 text-[11px] text-neutral-400">
        {/* Progress KPI */}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {completedCount}/{tasks.length} ({progressPercent}%)
          </span>
        </div>

        {/* Budget KPI */}
        <div className="flex items-center gap-1.5 font-mono">
          <DollarSign className="w-3.5 h-3.5 text-blue-400" />
          <span>{formatCurrency(budgetSummary.totalActualCost)}</span>
          <span className="opacity-50">/</span>
          <span>{formatCurrency(budgetSummary.totalBudget)}</span>
        </div>

        {/* Overbudget warning badge */}
        {budgetSummary.isOverBudget && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
            <AlertTriangle className="w-3 h-3" />
            <span>Sobrecoste detectado</span>
          </div>
        )}
      </div>
    </div>
  );
};
