export type TaskType = 'task' | 'milestone' | 'group';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  duration: number;  // In days
  progress: number;  // 0 - 100
  color?: string;
  assigneeId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  parentId?: string | null;
  isExpanded?: boolean;
  dependencies: string[]; // IDs of tasks this task depends on (Finish-to-Start)
  hourlyRate?: number;
  estimatedHours?: number;
  actualHours?: number;
  fixedCost?: number;
  budget?: number;
  notes?: string;
  tags?: string[];
  order: number;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  hourlyRate: number;
  color: string;
}

export interface BaselineTask {
  taskId: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
}

export interface Baseline {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  tasks: Record<string, BaselineTask>;
}

export type ViewMode = 'day' | 'week' | 'month' | 'quarter';

export type ThemePalette = 'pastel' | 'corporate' | 'neon' | 'neutral';

export type ColorMode = 'dark' | 'light';

export type FontFamily = 'Inter' | 'Plus Jakarta Sans' | 'Fira Code';

export interface GanttSettings {
  viewMode: ViewMode;
  columnWidth: number; // width in px per unit (day/week/month)
  rowHeight: number;   // height in px per task row
  showGhostMode: boolean;
  activeBaselineId: string | null;
  showCriticalPath: boolean;
  showDependencies: boolean;
  showProgressBars: boolean;
  showNonWorkingDays: boolean;
  nonWorkingDays: number[]; // 0 = Sunday, 6 = Saturday
  snapToGrid: boolean;
  themePalette: ThemePalette;
  colorMode: ColorMode;
  fontFamily: FontFamily;
  fontSize: 'sm' | 'md' | 'lg';
  showCostColumns: boolean;
  showLegend: boolean;
  zenMode: boolean;
  gridWidth: number; // Width of left task table panel
  compactMode: boolean;
}

export interface FilterState {
  searchQuery: string;
  assigneeFilter: string; // 'all' or resourceId
  statusFilter: string;   // 'all' or TaskStatus
  priorityFilter: string; // 'all' or TaskPriority
}

export interface DragState {
  taskId: string;
  type: 'move' | 'resize-start' | 'resize-end' | 'progress' | 'dependency-create';
  initialX: number;
  initialStartDate: string;
  initialEndDate: string;
  initialDuration: number;
  initialProgress: number;
  currentX: number;
  targetDependencyTaskId?: string;
}
