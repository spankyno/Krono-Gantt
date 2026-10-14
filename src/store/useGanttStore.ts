import { create } from 'zustand';
import { Task, Resource, Baseline, GanttSettings, FilterState, DragState } from '../types/gantt';
import { INITIAL_TASKS, INITIAL_RESOURCES, INITIAL_BASELINES } from '../data/mockData';
import { createBaselineSnapshot } from '../utils/baselineUtils';
import { addDays, diffDays, isValidISODate } from '../utils/dateUtils';
import {
  LIMITS,
  newId,
  sanitizeBaselines,
  sanitizeResources,
  sanitizeSettings,
  sanitizeTasks,
} from '../utils/sanitize';

interface HistoryState {
  tasks: Task[];
}

interface GanttStoreState {
  tasks: Task[];
  resources: Resource[];
  baselines: Baseline[];
  settings: GanttSettings;
  filter: FilterState;
  selectedTaskId: string | null;
  dragState: DragState | null;

  // History for Undo / Redo
  past: HistoryState[];
  future: HistoryState[];
  canUndo: boolean;
  canRedo: boolean;

  // Tasks
  addTask: (task?: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>, recordHistory?: boolean) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  toggleGroupExpand: (id: string) => void;
  addDependency: (targetTaskId: string, predecessorTaskId: string) => void;
  removeDependency: (targetTaskId: string, predecessorTaskId: string) => void;
  /** Registra en el historial el estado previo a un arrastre (una sola entrada por gesto). */
  commitDrag: (snapshot: Task[]) => void;

  // Baselines
  saveBaseline: (name: string, description?: string) => Baseline;
  deleteBaseline: (id: string) => void;
  setActiveBaseline: (id: string | null) => void;
  toggleGhostMode: (val?: boolean) => void;

  // Resources
  addResource: (res: Omit<Resource, 'id'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;

  // Settings & Filter
  updateSettings: (updates: Partial<GanttSettings>) => void;
  setFilter: (updates: Partial<FilterState>) => void;
  setSelectedTaskId: (id: string | null) => void;
  setDragState: (drag: DragState | null) => void;

  // Interop
  importTasks: (tasks: Task[], replaceAll?: boolean) => void;
  resetToDemo: () => void;
  startNewProject: (projectName?: string, mode?: 'blank' | 'starter') => void;

  undo: () => void;
  redo: () => void;
}

const STORAGE_KEY = 'kronogantt_state_v1';
const HISTORY_LIMIT = 25;
const PERSIST_DEBOUNCE_MS = 300;

const DEFAULT_SETTINGS: GanttSettings = {
  viewMode: 'day',
  columnWidth: 38,
  rowHeight: 44,
  showGhostMode: true,
  activeBaselineId: 'bl-kickoff',
  showDependencies: true,
  showNonWorkingDays: true,
  nonWorkingDays: [0, 6],
  snapToGrid: true,
  themePalette: 'neon',
  colorMode: 'dark',
  fontFamily: 'Inter',
  showCostColumns: true,
  showLegend: true,
  gridWidth: 540,
};

/** Lee y SANEA el estado guardado: el localStorage es entrada no confiable (editable por el usuario o por otro script). */
function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const d = data as Record<string, unknown>;
    return {
      tasks: sanitizeTasks(d.tasks),
      resources: sanitizeResources(d.resources),
      baselines: sanitizeBaselines(d.baselines),
      settings: sanitizeSettings(d.settings, DEFAULT_SETTINGS),
    };
  } catch {
    return null;
  }
}

const historyWith = (past: HistoryState[], tasks: Task[]) => [...past.slice(-HISTORY_LIMIT), { tasks }];

const DEFAULT_FILTER: FilterState = {
  searchQuery: '',
  assigneeFilter: 'all',
  statusFilter: 'all',
  priorityFilter: 'all',
};

const stored = loadPersistedState();

export const useGanttStore = create<GanttStoreState>((set, get) => {
  /** Aplica un nuevo array de tareas registrando el estado anterior en el historial. */
  const commitTasks = (tasks: Task[], extra: Partial<GanttStoreState> = {}) =>
    set((state) => ({
      ...extra,
      tasks,
      past: historyWith(state.past, state.tasks),
      future: [],
      canUndo: true,
      canRedo: false,
    }));

  return {
    tasks: stored && stored.tasks.length > 0 ? stored.tasks : INITIAL_TASKS,
    resources: stored && stored.resources.length > 0 ? stored.resources : INITIAL_RESOURCES,
    baselines: stored && stored.baselines.length > 0 ? stored.baselines : INITIAL_BASELINES,
    settings: stored ? stored.settings : DEFAULT_SETTINGS,
    filter: DEFAULT_FILTER,
    selectedTaskId: null,
    dragState: null,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    addTask: (customTask = {}) => {
      const tasks = get().tasks;
      if (tasks.length >= LIMITS.MAX_TASKS) return tasks[tasks.length - 1];

      const today = new Date().toISOString().substring(0, 10);
      const order = tasks.length;
      const newTask: Task = {
        id: newId('task'),
        name: customTask.name || `Nueva Tarea ${order + 1}`,
        startDate: customTask.startDate || today,
        endDate: customTask.endDate || addDays(today, 5),
        duration: customTask.duration ?? 5,
        progress: customTask.progress ?? 0,
        priority: customTask.priority || 'medium',
        status: customTask.status || 'todo',
        type: customTask.type || 'task',
        parentId: customTask.parentId ?? null,
        assigneeId: customTask.assigneeId,
        dependencies: customTask.dependencies || [],
        budget: customTask.budget ?? 1500,
        estimatedHours: customTask.estimatedHours ?? 40,
        actualHours: customTask.actualHours ?? 0,
        order,
        ...customTask,
      };
      commitTasks([...tasks, newTask], { selectedTaskId: newTask.id });
      return newTask;
    },

    updateTask: (id, updates, recordHistory = true) => {
      const currentTasks = get().tasks;
      const taskIndex = currentTasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) return;

      // Entrada no confiable (inputs de fecha parciales, etc.): se ignoran fechas inválidas.
      const u: Partial<Task> = { ...updates };
      if (u.startDate !== undefined && !isValidISODate(u.startDate)) delete u.startDate;
      if (u.endDate !== undefined && !isValidISODate(u.endDate)) delete u.endDate;
      if (typeof u.name === 'string') u.name = u.name.slice(0, LIMITS.MAX_NAME);
      if (typeof u.notes === 'string') u.notes = u.notes.slice(0, LIMITS.MAX_NOTES);

      const merged: Task = { ...currentTasks[taskIndex], ...u };
      const minDuration = merged.type === 'milestone' ? 0 : 1;

      // Mantener sincronizados fechas y duración
      if (u.startDate && u.endDate) {
        merged.duration = Math.max(minDuration, diffDays(u.startDate, u.endDate));
      } else if (u.startDate) {
        merged.endDate = addDays(u.startDate, merged.duration);
      } else if (u.endDate) {
        merged.duration = Math.max(minDuration, diffDays(merged.startDate, u.endDate));
      } else if (u.duration !== undefined) {
        merged.endDate = addDays(merged.startDate, u.duration);
      }
      if (merged.type === 'milestone') {
        merged.duration = 0;
        merged.endDate = merged.startDate;
      }
      if (!isValidISODate(merged.endDate)) return; // p. ej. duración que sale de la ventana admitida

      const tasks = [...currentTasks];
      tasks[taskIndex] = merged;

      if (recordHistory) commitTasks(tasks);
      else set({ tasks });
    },

    deleteTask: (id) => {
      const tasks = get().tasks
        .filter((t) => t.id !== id && t.parentId !== id) // la tarea y sus subtareas directas
        .map((t) => ({ ...t, dependencies: t.dependencies.filter((d) => d !== id) }));
      commitTasks(tasks, {
        selectedTaskId: get().selectedTaskId === id ? null : get().selectedTaskId,
      });
    },

    duplicateTask: (id) => {
      const tasks = get().tasks;
      const task = tasks.find((t) => t.id === id);
      if (!task || tasks.length >= LIMITS.MAX_TASKS) return;

      const copy: Task = {
        ...task,
        id: newId('task'),
        name: `${task.name} (Copia)`.slice(0, LIMITS.MAX_NAME),
        order: tasks.length,
        dependencies: [...task.dependencies],
      };
      commitTasks([...tasks, copy], { selectedTaskId: copy.id });
    },

    toggleGroupExpand: (id) =>
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, isExpanded: t.isExpanded === false } : t)),
      })),

    addDependency: (targetTaskId, predecessorTaskId) => {
      if (targetTaskId === predecessorTaskId) return;
      const tasks = get().tasks;
      const target = tasks.find((t) => t.id === targetTaskId);
      if (!target || target.dependencies.includes(predecessorTaskId)) return;
      if (target.dependencies.length >= LIMITS.MAX_DEPENDENCIES) return;
      commitTasks(
        tasks.map((t) =>
          t.id === targetTaskId ? { ...t, dependencies: [...t.dependencies, predecessorTaskId] } : t
        )
      );
    },

    removeDependency: (targetTaskId, predecessorTaskId) =>
      commitTasks(
        get().tasks.map((t) =>
          t.id === targetTaskId
            ? { ...t, dependencies: t.dependencies.filter((d) => d !== predecessorTaskId) }
            : t
        )
      ),

    commitDrag: (snapshot) =>
      set((state) =>
        state.tasks === snapshot
          ? {}
          : { past: historyWith(state.past, snapshot), future: [], canUndo: true, canRedo: false }
      ),

    // Baselines
    saveBaseline: (name, description = '') => {
      const baseline = createBaselineSnapshot(name, description, get().tasks);
      set((state) => ({
        baselines: [...state.baselines, baseline].slice(-LIMITS.MAX_BASELINES),
        settings: { ...state.settings, activeBaselineId: baseline.id, showGhostMode: true },
      }));
      return baseline;
    },

    deleteBaseline: (id) =>
      set((state) => {
        const baselines = state.baselines.filter((b) => b.id !== id);
        const activeBaselineId =
          state.settings.activeBaselineId === id ? baselines[0]?.id || null : state.settings.activeBaselineId;
        return { baselines, settings: { ...state.settings, activeBaselineId } };
      }),

    setActiveBaseline: (id) => set((state) => ({ settings: { ...state.settings, activeBaselineId: id } })),

    toggleGhostMode: (val) =>
      set((state) => ({
        settings: { ...state.settings, showGhostMode: val !== undefined ? val : !state.settings.showGhostMode },
      })),

    // Resources
    addResource: (res) =>
      set((state) =>
        state.resources.length >= LIMITS.MAX_RESOURCES
          ? {}
          : { resources: [...state.resources, { ...res, id: newId('res') }] }
      ),

    updateResource: (id, updates) =>
      set((state) => ({ resources: state.resources.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

    deleteResource: (id) =>
      set((state) => ({
        resources: state.resources.filter((r) => r.id !== id),
        tasks: state.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: undefined } : t)),
      })),

    updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),
    setFilter: (updates) => set((state) => ({ filter: { ...state.filter, ...updates } })),
    setSelectedTaskId: (id) => set({ selectedTaskId: id }),
    setDragState: (drag) => set({ dragState: drag }),

    importTasks: (newTasks, replaceAll = true) => {
      const tasks = replaceAll ? newTasks : [...get().tasks, ...newTasks].slice(0, LIMITS.MAX_TASKS);
      commitTasks(tasks);
    },

    resetToDemo: () =>
      set({
        tasks: INITIAL_TASKS,
        resources: INITIAL_RESOURCES,
        baselines: INITIAL_BASELINES,
        settings: DEFAULT_SETTINGS,
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
        selectedTaskId: null,
        dragState: null,
      }),

    // `_projectName`: el modal lo pide pero todavía no se muestra en ninguna parte de la UI.
    startNewProject: (_projectName = 'Nuevo Proyecto', mode = 'starter') => {
      const today = new Date().toISOString().substring(0, 10);
      const [t1, t2, t3, t4] = [newId('task'), newId('task'), newId('task'), newId('task')];

      const newTasks: Task[] =
        mode === 'blank'
          ? [
              {
                id: t1,
                name: 'Primera Tarea del Proyecto',
                startDate: today,
                endDate: addDays(today, 5),
                duration: 5,
                progress: 0,
                priority: 'medium',
                status: 'todo',
                type: 'task',
                dependencies: [],
                order: 0,
                budget: 1000,
              },
            ]
          : [
              {
                id: t1,
                name: 'Fase 1: Planificación y Kickoff',
                startDate: today,
                endDate: addDays(today, 12),
                duration: 12,
                progress: 0,
                status: 'todo',
                priority: 'high',
                type: 'group',
                isExpanded: true,
                dependencies: [],
                order: 0,
                budget: 3500,
              },
              {
                id: t2,
                name: 'Definición de requerimientos y alcance',
                startDate: today,
                endDate: addDays(today, 5),
                duration: 5,
                progress: 0,
                status: 'todo',
                priority: 'high',
                type: 'task',
                parentId: t1,
                dependencies: [],
                order: 1,
                estimatedHours: 40,
                actualHours: 0,
                budget: 1500,
              },
              {
                id: t3,
                name: 'Diseño de la solución y prototipo inicial',
                startDate: addDays(today, 5),
                endDate: addDays(today, 12),
                duration: 7,
                progress: 0,
                status: 'todo',
                priority: 'medium',
                type: 'task',
                parentId: t1,
                dependencies: [t2],
                order: 2,
                estimatedHours: 48,
                actualHours: 0,
                budget: 2000,
              },
              {
                id: t4,
                name: 'Hito: Aprobación del Plan de Trabajo',
                startDate: addDays(today, 12),
                endDate: addDays(today, 12),
                duration: 0,
                progress: 0,
                status: 'todo',
                priority: 'urgent',
                type: 'milestone',
                parentId: t1,
                dependencies: [t3],
                order: 3,
              },
            ];

      commitTasks(newTasks, {
        baselines: [],
        settings: { ...get().settings, activeBaselineId: null, showGhostMode: false },
        selectedTaskId: newTasks[0].id,
      });
    },

    undo: () => {
      const { past, tasks, future } = get();
      if (past.length === 0) return;
      const newPast = past.slice(0, -1);
      set({
        tasks: past[past.length - 1].tasks,
        past: newPast,
        future: [{ tasks }, ...future],
        canUndo: newPast.length > 0,
        canRedo: true,
      });
    },

    redo: () => {
      const { past, tasks, future } = get();
      if (future.length === 0) return;
      const newFuture = future.slice(1);
      set({
        tasks: future[0].tasks,
        past: [...past, { tasks }],
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      });
    },
  };
});

// ── Persistencia ────────────────────────────────────────────────────────────
// Un único punto de guardado, con debounce: antes se serializaba TODO el estado a localStorage
// en cada movimiento de ratón durante un arrastre.
let persistTimer: ReturnType<typeof setTimeout> | undefined;

function persistNow() {
  clearTimeout(persistTimer);
  persistTimer = undefined;
  const { tasks, resources, baselines, settings } = useGanttStore.getState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, resources, baselines, settings }));
  } catch (e) {
    console.error('No se pudo guardar en localStorage', e);
  }
}

useGanttStore.subscribe((state, prev) => {
  if (
    state.tasks === prev.tasks &&
    state.resources === prev.resources &&
    state.baselines === prev.baselines &&
    state.settings === prev.settings
  ) {
    return;
  }
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, PERSIST_DEBOUNCE_MS);
});

// Garantiza que un cambio pendiente se guarda al cerrar/ocultar la pestaña.
window.addEventListener('pagehide', () => persistTimer !== undefined && persistNow());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && persistTimer !== undefined) persistNow();
});
