import { Task, Resource } from '../types/gantt';

export interface TaskCostSummary {
  taskId: string;
  hourlyRate: number;
  hours: number;
  laborCost: number;
  fixedCost: number;
  totalCost: number;
  budget: number;
  variance: number; // budget - totalCost (positive = under budget, negative = over budget)
  isOverBudget: boolean;
  overBudgetPercentage: number;
}

export interface ProjectBudgetSummary {
  totalBudget: number;
  totalLaborCost: number;
  totalFixedCost: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  variance: number;
  isOverBudget: boolean;
  overBudgetTasksCount: number;
  completedBudgetProgress: number; // % of budget represented by completed tasks
}

export function calculateTaskCost(task: Task, resources: Resource[]): TaskCostSummary {
  const resource = resources.find((r) => r.id === task.assigneeId);
  const hourlyRate = task.hourlyRate ?? resource?.hourlyRate ?? 50; // default $50/h if none set

  // Calculate hours: if estimatedHours or actualHours given, use them. Otherwise default 8 hours per day of duration
  const estimatedHours = task.estimatedHours ?? task.duration * 8;
  const actualHours = task.actualHours ?? (task.progress > 0 ? (estimatedHours * task.progress) / 100 : 0);

  const laborCost = actualHours * hourlyRate;
  const fixedCost = task.fixedCost ?? 0;
  const totalCost = laborCost + fixedCost;

  const budget = task.budget ?? (estimatedHours * hourlyRate + fixedCost);
  const variance = budget - totalCost;
  const isOverBudget = totalCost > budget && budget > 0;
  const overBudgetPercentage = budget > 0 && totalCost > budget 
    ? Math.round(((totalCost - budget) / budget) * 100) 
    : 0;

  return {
    taskId: task.id,
    hourlyRate,
    hours: actualHours,
    laborCost,
    fixedCost,
    totalCost,
    budget,
    variance,
    isOverBudget,
    overBudgetPercentage,
  };
}

export function calculateProjectBudgetSummary(tasks: Task[], resources: Resource[]): ProjectBudgetSummary {
  let totalBudget = 0;
  let totalLaborCost = 0;
  let totalFixedCost = 0;
  let totalEstimatedCost = 0;
  let totalActualCost = 0;
  let overBudgetTasksCount = 0;
  let weightedProgressSum = 0;

  // Filter out parent groups to avoid double counting if subtasks have costs
  const leafTasks = tasks.filter((t) => t.type !== 'group');
  const targetTasks = leafTasks.length > 0 ? leafTasks : tasks;

  targetTasks.forEach((task) => {
    const summary = calculateTaskCost(task, resources);
    totalBudget += summary.budget;
    totalLaborCost += summary.laborCost;
    totalFixedCost += summary.fixedCost;
    totalActualCost += summary.totalCost;

    const estimatedHours = task.estimatedHours ?? task.duration * 8;
    totalEstimatedCost += (estimatedHours * summary.hourlyRate) + summary.fixedCost;

    if (summary.isOverBudget) {
      overBudgetTasksCount++;
    }

    weightedProgressSum += (task.progress / 100) * summary.budget;
  });

  const variance = totalBudget - totalActualCost;
  const isOverBudget = totalActualCost > totalBudget && totalBudget > 0;
  const completedBudgetProgress = totalBudget > 0 ? Math.round((weightedProgressSum / totalBudget) * 100) : 0;

  return {
    totalBudget,
    totalLaborCost,
    totalFixedCost,
    totalEstimatedCost,
    totalActualCost,
    variance,
    isOverBudget,
    overBudgetTasksCount,
    completedBudgetProgress,
  };
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
