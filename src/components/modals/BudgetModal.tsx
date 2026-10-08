import React, { useState } from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import { calculateProjectBudgetSummary, formatCurrency } from '../../utils/costUtils';
import {
  X,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  User,
  Plus,
  Trash2,
  Calendar,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

interface BudgetModalProps {
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ onClose }) => {
  const {
    tasks,
    resources,
    settings,
    updateResource,
    addResource,
    deleteResource,
    updateSettings,
  } = useGanttStore();

  const theme = getTheme(settings.colorMode, settings.themePalette);
  const summary = calculateProjectBudgetSummary(tasks, resources);

  // New resource state
  const [newResName, setNewResName] = useState('');
  const [newResRole, setNewResRole] = useState('');
  const [newResRate, setNewResRate] = useState('60');
  const [isAddingResource, setIsAddingResource] = useState(false);

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) return;
    addResource({
      name: newResName.trim(),
      role: newResRole.trim() || 'Colaborador',
      hourlyRate: parseFloat(newResRate) || 50,
      color: '#3B82F6',
    });
    setNewResName('');
    setNewResRole('');
    setNewResRate('60');
    setIsAddingResource(false);
  };

  const toggleDay = (dayIndex: number) => {
    const current = settings.nonWorkingDays;
    const next = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex];
    updateSettings({ nonWorkingDays: next });
  };

  const DAYS_OF_WEEK = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Costes, Presupuestos y Calendario</h2>
              <p className="text-xs text-neutral-400">
                Tarifas por hora, costes fijos, desviaciones presupuestarias y días laborables
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
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div
              className="p-3.5 rounded-xl border"
              style={{ backgroundColor: `${theme.colors.bgApp}90`, borderColor: theme.colors.border }}
            >
              <span className="text-[11px] text-neutral-400 block mb-1">Presupuesto Total</span>
              <span className="text-base font-bold font-mono text-white">
                {formatCurrency(summary.totalBudget)}
              </span>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{ backgroundColor: `${theme.colors.bgApp}90`, borderColor: theme.colors.border }}
            >
              <span className="text-[11px] text-neutral-400 block mb-1">Coste Real Actual</span>
              <span className="text-base font-bold font-mono text-blue-400">
                {formatCurrency(summary.totalActualCost)}
              </span>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{ backgroundColor: `${theme.colors.bgApp}90`, borderColor: theme.colors.border }}
            >
              <span className="text-[11px] text-neutral-400 block mb-1">Coste Estimado Final</span>
              <span className="text-base font-bold font-mono text-neutral-300">
                {formatCurrency(summary.totalEstimatedCost)}
              </span>
            </div>

            <div
              className="p-3.5 rounded-xl border"
              style={{ backgroundColor: `${theme.colors.bgApp}90`, borderColor: theme.colors.border }}
            >
              <span className="text-[11px] text-neutral-400 block mb-1">Margen / Variación</span>
              <span
                className={`text-base font-bold font-mono ${
                  summary.isOverBudget ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {summary.variance >= 0 ? `+${formatCurrency(summary.variance)}` : formatCurrency(summary.variance)}
              </span>
            </div>
          </div>

          {/* Budget Warning Banner if over-budget tasks exist */}
          {summary.overBudgetTasksCount > 0 && (
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center gap-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">Alerta Presupuestaria: </span>
                {summary.overBudgetTasksCount} {summary.overBudgetTasksCount === 1 ? 'tarea ha' : 'tareas han'} excedido su presupuesto asignado debido a horas extra o costes imprevistos.
              </div>
            </div>
          )}

          {/* Team Resources & Hourly Rates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-400" /> Tarifas de Recursos del Equipo ({resources.length})
              </h3>
              <button
                onClick={() => setIsAddingResource(!isAddingResource)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo Recurso
              </button>
            </div>

            {/* Add Resource Form */}
            {isAddingResource && (
              <form onSubmit={handleAddResource} className="p-3.5 rounded-xl border bg-black/40 space-y-3" style={{ borderColor: theme.colors.borderLight }}>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    className="px-3 py-1.5 rounded border bg-neutral-900 text-white text-xs outline-none"
                    style={{ borderColor: theme.colors.borderLight }}
                  />
                  <input
                    type="text"
                    placeholder="Rol (ej. Arquitecto Cloud)"
                    value={newResRole}
                    onChange={(e) => setNewResRole(e.target.value)}
                    className="px-3 py-1.5 rounded border bg-neutral-900 text-white text-xs outline-none"
                    style={{ borderColor: theme.colors.borderLight }}
                  />
                  <input
                    type="number"
                    placeholder="Tarifa €/hora"
                    value={newResRate}
                    onChange={(e) => setNewResRate(e.target.value)}
                    className="px-3 py-1.5 rounded border bg-neutral-900 text-white text-xs outline-none"
                    style={{ borderColor: theme.colors.borderLight }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingResource(false)}
                    className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-500"
                  >
                    Guardar Recurso
                  </button>
                </div>
              </form>
            )}

            {/* Resources list */}
            <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: theme.colors.border }}>
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 transition-colors hover:bg-white/5"
                  style={{ backgroundColor: `${theme.colors.bgApp}40` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: res.color }}
                    >
                      {res.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">{res.name}</div>
                      <div className="text-[11px] text-neutral-400">{res.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-400">Tarifa:</span>
                      <input
                        type="number"
                        value={res.hourlyRate}
                        onChange={(e) =>
                          updateResource(res.id, { hourlyRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 rounded border bg-black/40 text-right font-mono text-xs text-white outline-none"
                        style={{ borderColor: theme.colors.borderLight }}
                      />
                      <span className="text-xs text-neutral-400">€/h</span>
                    </div>

                    <button
                      onClick={() => deleteResource(res.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition-colors"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Non-working days & Work Calendar */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" /> Calendario Laboral y Días No Laborables
            </h3>
            <p className="text-xs text-neutral-400">
              Selecciona los días considerados no laborables (se sombrearán en el diagrama Gantt):
            </p>

            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((d) => {
                const isNonWorking = settings.nonWorkingDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDay(d.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                      isNonWorking
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-white/10 hover:border-white/30 text-neutral-300'
                    }`}
                  >
                    <div>{d.label}</div>
                    <span className="text-[10px] opacity-75 mt-0.5 block">
                      {isNonWorking ? 'Festivo' : 'Laboral'}
                    </span>
                  </button>
                );
              })}
            </div>
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
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
