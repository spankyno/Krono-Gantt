import { create } from 'zustand';
import {
  Task,
  Resource,
  Baseline,
  GanttSettings,
  FilterState,
  DragState,
  TaskType,
} from '../types/gantt';
import {
  INITIAL_TASKS,
  INITIAL_RESOURCES,
  INITIAL_BASELINES,
} from '../data/mockData';
import { createBaselineSnapshot } from '../utils/baselineUtils';
import { addDays, diffDays } from '../utils/dateUtils';

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

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task?: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>, recordHistory?: boolean) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  toggleGroupExpand: (id: string) => void;
  addDependency: (targetTaskId: string, predecessorTaskId: string) => void;
  removeDependency: (targetTaskId: string, predecessorTaskId: string) => void;

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

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const STORAGE_KEY = 'kronogantt_state_v1';

function loadStoredState(): Partial<GanttStoreState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToLocalStorage(state: {
  tasks: Task[];
  resources: Resource[];
  baselines: Baseline[];
  settings: GanttSettings;
}) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks: state.tasks,
        resources: state.resources,
        baselines: state.baselines,
        settings: state.settings,
      })
    );
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

const DEFAULT_SETTINGS: GanttSettings = {
  viewMode: 'day',
  columnWidth: 38,
  rowHeight: 44,
  showGhostMode: true,
  activeBaselineId: 'bl-kickoff',
  showCriticalPath: false,
  showDependencies: true,
  showProgressBars: true,
  showNonWorkingDays: true,
  nonWorkingDays: [0, 6],
  snapToGrid: true,
  themePalette: 'neon',
  colorMode: 'dark',
  fontFamily: 'Inter',
  fontSize: 'md',
  showCostColumns: true,
  showLegend: true,
  zenMode: false,
  gridWidth: 540,
  compactMode: false,
};

const DEFAULT_FILTER: FilterState = {
  searchQuery: '',
  assigneeFilter: 'all',
  statusFilter: 'all',
  priorityFilter: 'all',
};

const stored = loadStoredState();

export const useGanttStore = create<GanttStoreState>((set, get) => ({
  tasks: stored?.tasks && stored.tasks.length > 0 ? stored.tasks : INITIAL_TASKS,
  resources: stored?.resources && stored.resources.length > 0 ? stored.resources : INITIAL_RESOURCES,
  baselines: stored?.baselines && stored.baselines.length > 0 ? stored.baselines : INITIAL_BASELINES,
  settings: stored?.settings ? { ...DEFAULT_SETTINGS, ...stored.settings } : DEFAULT_SETTINGS,
  filter: DEFAULT_FILTER,
  selectedTaskId: null,
  dragState: null,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  setTasks: (tasks) => {
    const currentTasks = get().tasks;
    set((state) => ({
      tasks,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));
    saveToLocalStorage({
      tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  addTask: (customTask = {}) => {
    const currentTasks = get().tasks;
    const today = new Date().toISOString().substring(0, 10);
    const order = currentTasks.length;

    const newTask: Task = {
      id: `task-${Date.now()}`,
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

    const updatedTasks = [...currentTasks, newTask];

    set((state) => ({
      tasks: updatedTasks,
      selectedTaskId: newTask.id,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));

    saveToLocalStorage({
      tasks: updatedTasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });

    return newTask;
  },

  updateTask: (id, updates, recordHistory = true) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return;

    const oldTask = currentTasks[taskIndex];
    let merged = { ...oldTask, ...updates };

    // Synchronize dates and duration if dates changed
    if (updates.startDate && updates.endDate) {
      merged.duration = Math.max(merged.type === 'milestone' ? 0 : 1, diffDays(updates.startDate, updates.endDate));
    } else if (updates.startDate && !updates.endDate) {
      merged.endDate = addDays(updates.startDate, merged.duration);
    } else if (updates.endDate && !updates.startDate) {
      merged.duration = Math.max(merged.type === 'milestone' ? 0 : 1, diffDays(merged.startDate, updates.endDate));
    } else if (updates.duration !== undefined) {
      merged.endDate = addDays(merged.startDate, updates.duration);
    }

    if (merged.type === 'milestone') {
      merged.duration = 0;
      merged.endDate = merged.startDate;
    }

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = merged;

    set((state) => ({
      tasks: updatedTasks,
      past: recordHistory ? [...state.past.slice(-25), { tasks: currentTasks }] : state.past,
      future: recordHistory ? [] : state.future,
      canUndo: recordHistory ? true : state.canUndo,
      canRedo: recordHistory ? false : state.canRedo,
    }));

    saveToLocalStorage({
      tasks: updatedTasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  deleteTask: (id) => {
    const currentTasks = get().tasks;
    const updatedTasks = currentTasks
      .filter((t) => t.id !== id && t.parentId !== id) // Remove task and direct subtasks
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((d) => d !== id),
      }));

    set((state) => ({
      tasks: updatedTasks,
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));

    saveToLocalStorage({
      tasks: updatedTasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  duplicateTask: (id) => {
    const currentTasks = get().tasks;
    const task = currentTasks.find((t) => t.id === id);
    if (!task) return;

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      name: `${task.name} (Copia)`,
      order: currentTasks.length,
      dependencies: [...task.dependencies],
    };

    const updatedTasks = [...currentTasks, newTask];

    set((state) => ({
      tasks: updatedTasks,
      selectedTaskId: newTask.id,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));

    saveToLocalStorage({
      tasks: updatedTasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  toggleGroupExpand: (id) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, isExpanded: t.isExpanded === false ? true : false } : t
      );
      return { tasks: updatedTasks };
    });
  },

  addDependency: (targetTaskId, predecessorTaskId) => {
    if (targetTaskId === predecessorTaskId) return;
    const currentTasks = get().tasks;
    const targetTask = currentTasks.find((t) => t.id === targetTaskId);
    if (!targetTask) return;

    if (targetTask.dependencies.includes(predecessorTaskId)) return;

    const updatedTasks = currentTasks.map((t) =>
      t.id === targetTaskId ? { ...t, dependencies: [...t.dependencies, predecessorTaskId] } : t
    );

    set((state) => ({
      tasks: updatedTasks,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));

    saveToLocalStorage({
      tasks: updatedTasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  removeDependency: (targetTaskId, predecessorTaskId) => {
    const currentTasks = get().tasks;
    const updatedTasks = currentTasks.map((t) =>
      t.id === targetTaskId
        ? { ...t, dependencies: t.dependencies.filter((d) => d !== predecessorTaskId) }
        : t
    );

    set((state) => ({
      tasks: updatedTasks,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));

    saveToLocalStorage({
      tasks: updatedTasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  // Baselines
  saveBaseline: (name, description = '') => {
    const tasks = get().tasks;
    const newBaseline = createBaselineSnapshot(name, description, tasks);
    const updatedBaselines = [...get().baselines, newBaseline];

    const updatedSettings = {
      ...get().settings,
      activeBaselineId: newBaseline.id,
      showGhostMode: true,
    };

    set({
      baselines: updatedBaselines,
      settings: updatedSettings,
    });

    saveToLocalStorage({
      tasks,
      resources: get().resources,
      baselines: updatedBaselines,
      settings: updatedSettings,
    });

    return newBaseline;
  },

  deleteBaseline: (id) => {
    const updatedBaselines = get().baselines.filter((b) => b.id !== id);
    const activeBaselineId =
      get().settings.activeBaselineId === id
        ? updatedBaselines[0]?.id || null
        : get().settings.activeBaselineId;

    const updatedSettings = {
      ...get().settings,
      activeBaselineId,
    };

    set({
      baselines: updatedBaselines,
      settings: updatedSettings,
    });

    saveToLocalStorage({
      tasks: get().tasks,
      resources: get().resources,
      baselines: updatedBaselines,
      settings: updatedSettings,
    });
  },

  setActiveBaseline: (id) => {
    const updatedSettings = {
      ...get().settings,
      activeBaselineId: id,
    };
    set({ settings: updatedSettings });
    saveToLocalStorage({
      tasks: get().tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: updatedSettings,
    });
  },

  toggleGhostMode: (val) => {
    const showGhostMode = val !== undefined ? val : !get().settings.showGhostMode;
    const updatedSettings = {
      ...get().settings,
      showGhostMode,
    };
    set({ settings: updatedSettings });
    saveToLocalStorage({
      tasks: get().tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: updatedSettings,
    });
  },

  // Resources
  addResource: (res) => {
    const newResource: Resource = {
      ...res,
      id: `res-${Date.now()}`,
    };
    const updatedResources = [...get().resources, newResource];
    set({ resources: updatedResources });
    saveToLocalStorage({
      tasks: get().tasks,
      resources: updatedResources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  updateResource: (id, updates) => {
    const updatedResources = get().resources.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ resources: updatedResources });
    saveToLocalStorage({
      tasks: get().tasks,
      resources: updatedResources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  deleteResource: (id) => {
    const updatedResources = get().resources.filter((r) => r.id !== id);
    // Unassign deleted resource
    const updatedTasks = get().tasks.map((t) =>
      t.assigneeId === id ? { ...t, assigneeId: undefined } : t
    );
    set({ resources: updatedResources, tasks: updatedTasks });
    saveToLocalStorage({
      tasks: updatedTasks,
      resources: updatedResources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  updateSettings: (updates) => {
    const updatedSettings = { ...get().settings, ...updates };
    set({ settings: updatedSettings });
    saveToLocalStorage({
      tasks: get().tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: updatedSettings,
    });
  },

  setFilter: (updates) => {
    set((state) => ({ filter: { ...state.filter, ...updates } }));
  },

  setSelectedTaskId: (id) => {
    set({ selectedTaskId: id });
  },

  setDragState: (drag) => {
    set({ dragState: drag });
  },

  importTasks: (newTasks, replaceAll = true) => {
    const currentTasks = get().tasks;
    const tasks = replaceAll ? newTasks : [...currentTasks, ...newTasks];
    set((state) => ({
      tasks,
      past: [...state.past.slice(-25), { tasks: currentTasks }],
      future: [],
      canUndo: true,
      canRedo: false,
    }));
    saveToLocalStorage({
      tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  resetToDemo: () => {
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
    });
    saveToLocalStorage({
      tasks: INITIAL_TASKS,
      resources: INITIAL_RESOURCES,
      baselines: INITIAL_BASELINES,
      settings: DEFAULT_SETTINGS,
    });
  },

  undo: () => {
    const { past, tasks, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      tasks: previous.tasks,
      past: newPast,
      future: [{ tasks }, ...future],
      canUndo: newPast.length > 0,
      canRedo: true,
    });

    saveToLocalStorage({
      tasks: previous.tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },

  redo: () => {
    const { past, tasks, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      tasks: next.tasks,
      past: [...past, { tasks }],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });

    saveToLocalStorage({
      tasks: next.tasks,
      resources: get().resources,
      baselines: get().baselines,
      settings: get().settings,
    });
  },
}));
