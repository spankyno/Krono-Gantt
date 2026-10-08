import { Baseline, Task, BaselineTask } from '../types/gantt';
import { diffDays } from './dateUtils';

export interface TaskBaselineDiff {
  hasBaseline: boolean;
  baselineStart?: string;
  baselineEnd?: string;
  baselineDuration?: number;
  baselineProgress?: number;
  startDelayDays: number; // positive = started later than planned
  endDelayDays: number;   // positive = finished/scheduled later than planned
  durationDiffDays: number;
  progressDiff: number;
  status: 'delayed' | 'ahead' | 'on_track' | 'no_baseline';
  displayText: string;
}

export function compareTaskWithBaseline(task: Task, baseline: Baseline | null): TaskBaselineDiff {
  if (!baseline || !baseline.tasks[task.id]) {
    return {
      hasBaseline: false,
      startDelayDays: 0,
      endDelayDays: 0,
      durationDiffDays: 0,
      progressDiff: 0,
      status: 'no_baseline',
      displayText: 'Sin línea base',
    };
  }

  const baseTask = baseline.tasks[task.id];
  const startDelayDays = diffDays(baseTask.startDate, task.startDate);
  const endDelayDays = diffDays(baseTask.endDate, task.endDate);
  const durationDiffDays = task.duration - baseTask.duration;
  const progressDiff = task.progress - baseTask.progress;

  let status: 'delayed' | 'ahead' | 'on_track' = 'on_track';
  let displayText = 'A tiempo';

  if (endDelayDays > 0) {
    status = 'delayed';
    displayText = `+${endDelayDays}d retraso`;
  } else if (endDelayDays < 0) {
    status = 'ahead';
    displayText = `${endDelayDays}d adelanto`;
  } else if (startDelayDays !== 0) {
    status = startDelayDays > 0 ? 'delayed' : 'ahead';
    displayText = startDelayDays > 0 ? `Inicio +${startDelayDays}d` : `Inicio ${startDelayDays}d`;
  }

  return {
    hasBaseline: true,
    baselineStart: baseTask.startDate,
    baselineEnd: baseTask.endDate,
    baselineDuration: baseTask.duration,
    baselineProgress: baseTask.progress,
    startDelayDays,
    endDelayDays,
    durationDiffDays,
    progressDiff,
    status,
    displayText,
  };
}

export function createBaselineSnapshot(name: string, description: string, tasks: Task[]): Baseline {
  const taskMap: Record<string, BaselineTask> = {};
  tasks.forEach((t) => {
    taskMap[t.id] = {
      taskId: t.id,
      startDate: t.startDate,
      endDate: t.endDate,
      duration: t.duration,
      progress: t.progress,
    };
  });

  return {
    id: `bl-${Date.now()}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    tasks: taskMap,
  };
}
