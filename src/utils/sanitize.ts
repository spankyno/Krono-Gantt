/**
 * Validación y saneamiento de TODOS los datos que no controlamos:
 * localStorage, ficheros Excel/CSV y XML de MS Project.
 *
 * Objetivos:
 *  - Que un fichero o un localStorage manipulado no pueda bloquear la app (fechas absurdas, miles de tareas…).
 *  - Que los valores usados en atributos SVG/CSS (colores, fuentes) sean de una lista cerrada.
 *  - Evitar claves peligrosas (`__proto__`, `constructor`…) en mapas indexados por id.
 */
import {
  Baseline,
  BaselineTask,
  GanttSettings,
  Resource,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../types/gantt';
import { addDays, diffDays, formatISODate, isValidISODate } from './dateUtils';

export const LIMITS = {
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  MAX_TASKS: 5000,
  MAX_RESOURCES: 500,
  MAX_BASELINES: 50,
  MAX_DEPENDENCIES: 100,
  MAX_ID: 100,
  MAX_NAME: 200,
  MAX_NOTES: 5000,
  MAX_DURATION_DAYS: 3650,
  MAX_AMOUNT: 1_000_000_000,
} as const;

const STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const TYPES: readonly TaskType[] = ['task', 'milestone', 'group'];
const VIEW_MODES = ['day', 'week', 'month', 'quarter'] as const;
const PALETTES = ['pastel', 'corporate', 'neon', 'neutral'] as const;
const COLOR_MODES = ['dark', 'light'] as const;
const FONTS = ['Inter', 'Plus Jakarta Sans', 'Fira Code'] as const;

const ID_RE = /^[A-Za-z0-9_.:-]{1,100}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function isSafeId(v: unknown): v is string {
  return typeof v === 'string' && ID_RE.test(v) && !FORBIDDEN_KEYS.has(v);
}

function str(v: unknown, max: number, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback;
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function optNum(v: unknown, max: number = LIMITS.MAX_AMOUNT): number | undefined {
  const n = num(v, 0, max, NaN);
  return Number.isNaN(n) ? undefined : n;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

export function sanitizeTask(raw: unknown, index: number): Task | null {
  if (!isObj(raw)) return null;

  const today = formatISODate(new Date());
  const type = oneOf(raw.type, TYPES, 'task');
  const startDate = isValidISODate(raw.startDate) ? raw.startDate : today;

  let duration = num(raw.duration, 0, LIMITS.MAX_DURATION_DAYS, NaN);
  let endDate: string;
  if (isValidISODate(raw.endDate) && raw.endDate >= startDate) {
    endDate = raw.endDate;
    if (Number.isNaN(duration)) duration = diffDays(startDate, endDate);
  } else {
    if (Number.isNaN(duration)) duration = 1;
    endDate = addDays(startDate, duration);
  }
  if (!isValidISODate(endDate)) endDate = startDate; // addDays pudo salirse de la ventana admitida
  if (type === 'milestone') {
    duration = 0;
    endDate = startDate;
  }

  const task: Task = {
    id: isSafeId(raw.id) ? raw.id : newId('task'),
    name: str(raw.name, LIMITS.MAX_NAME).trim() || `Tarea ${index + 1}`,
    startDate,
    endDate,
    duration,
    progress: Math.round(num(raw.progress, 0, 100, 0)),
    priority: oneOf(raw.priority, PRIORITIES, 'medium'),
    status: oneOf(raw.status, STATUSES, 'todo'),
    type,
    parentId: isSafeId(raw.parentId) ? raw.parentId : null,
    dependencies: Array.isArray(raw.dependencies)
      ? raw.dependencies.filter(isSafeId).slice(0, LIMITS.MAX_DEPENDENCIES)
      : [],
    order: num(raw.order, 0, LIMITS.MAX_TASKS * 10, index),
  };

  if (typeof raw.color === 'string' && HEX_RE.test(raw.color)) task.color = raw.color;
  if (isSafeId(raw.assigneeId)) task.assigneeId = raw.assigneeId;
  if (typeof raw.isExpanded === 'boolean') task.isExpanded = raw.isExpanded;
  if (typeof raw.notes === 'string' && raw.notes) task.notes = raw.notes.slice(0, LIMITS.MAX_NOTES);

  for (const key of ['hourlyRate', 'estimatedHours', 'actualHours', 'fixedCost', 'budget'] as const) {
    const value = optNum(raw[key]);
    if (value !== undefined) task[key] = value;
  }
  return task;
}

/** Sanea una lista de tareas: tope de cantidad, ids únicos y referencias (padre/dependencias) coherentes. */
export function sanitizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const tasks: Task[] = [];
  raw.slice(0, LIMITS.MAX_TASKS).forEach((item, i) => {
    const task = sanitizeTask(item, i);
    if (!task) return;
    if (seen.has(task.id)) task.id = newId('task');
    seen.add(task.id);
    tasks.push(task);
  });

  return tasks.map((t) => ({
    ...t,
    parentId: t.parentId && t.parentId !== t.id && seen.has(t.parentId) ? t.parentId : null,
    dependencies: [...new Set(t.dependencies)].filter((d) => d !== t.id && seen.has(d)),
  }));
}

export function sanitizeResources(raw: unknown): Resource[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Resource[] = [];
  for (const item of raw.slice(0, LIMITS.MAX_RESOURCES)) {
    if (!isObj(item)) continue;
    let id = isSafeId(item.id) ? item.id : newId('res');
    if (seen.has(id)) id = newId('res');
    seen.add(id);
    out.push({
      id,
      name: str(item.name, LIMITS.MAX_NAME).trim() || 'Sin nombre',
      role: str(item.role, LIMITS.MAX_NAME),
      hourlyRate: num(item.hourlyRate, 0, LIMITS.MAX_AMOUNT, 50),
      color: typeof item.color === 'string' && HEX_RE.test(item.color) ? item.color : '#6366F1',
    });
  }
  return out;
}

export function sanitizeBaselines(raw: unknown): Baseline[] {
  if (!Array.isArray(raw)) return [];
  const out: Baseline[] = [];
  for (const item of raw.slice(0, LIMITS.MAX_BASELINES)) {
    if (!isObj(item) || !isObj(item.tasks)) continue;

    // Objeto sin prototipo: `tasks[id]` nunca devuelve propiedades heredadas.
    const tasks: Record<string, BaselineTask> = Object.create(null);
    for (const [key, value] of Object.entries(item.tasks).slice(0, LIMITS.MAX_TASKS)) {
      if (!isSafeId(key) || !isObj(value) || !isValidISODate(value.startDate) || !isValidISODate(value.endDate)) continue;
      tasks[key] = {
        taskId: key,
        startDate: value.startDate,
        endDate: value.endDate,
        duration: num(value.duration, 0, LIMITS.MAX_DURATION_DAYS, 0),
        progress: num(value.progress, 0, 100, 0),
      };
    }

    out.push({
      id: isSafeId(item.id) ? item.id : newId('bl'),
      name: str(item.name, LIMITS.MAX_NAME).trim() || 'Línea base',
      description: str(item.description, LIMITS.MAX_NOTES),
      createdAt: typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
        ? item.createdAt
        : new Date().toISOString(),
      tasks,
    });
  }
  return out;
}

/** Solo se aceptan claves conocidas con el tipo y rango correctos; el resto se descarta. */
export function sanitizeSettings(raw: unknown, defaults: GanttSettings): GanttSettings {
  if (!isObj(raw)) return defaults;
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

  const days = Array.isArray(raw.nonWorkingDays)
    ? [...new Set(raw.nonWorkingDays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))]
    : defaults.nonWorkingDays;

  return {
    viewMode: oneOf(raw.viewMode, VIEW_MODES, defaults.viewMode),
    columnWidth: num(raw.columnWidth, 16, 120, defaults.columnWidth),
    rowHeight: num(raw.rowHeight, 24, 80, defaults.rowHeight),
    showGhostMode: bool(raw.showGhostMode, defaults.showGhostMode),
    activeBaselineId: isSafeId(raw.activeBaselineId) ? raw.activeBaselineId : null,
    showDependencies: bool(raw.showDependencies, defaults.showDependencies),
    showNonWorkingDays: bool(raw.showNonWorkingDays, defaults.showNonWorkingDays),
    nonWorkingDays: days,
    snapToGrid: bool(raw.snapToGrid, defaults.snapToGrid),
    themePalette: oneOf(raw.themePalette, PALETTES, defaults.themePalette),
    colorMode: oneOf(raw.colorMode, COLOR_MODES, defaults.colorMode),
    fontFamily: oneOf(raw.fontFamily, FONTS, defaults.fontFamily),
    showCostColumns: bool(raw.showCostColumns, defaults.showCostColumns),
    showLegend: bool(raw.showLegend, defaults.showLegend),
    gridWidth: num(raw.gridWidth, 280, 800, defaults.gridWidth),
  };
}
