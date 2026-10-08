import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Task, DragState } from '../../types/gantt';
import { useGanttStore } from '../../store/useGanttStore';
import {
  calculateTimelineRange,
  generateTimelineHeader,
  dateToCoordinate,
  coordinateToDate,
  formatISODate,
  diffDays,
  addDays,
} from '../../utils/dateUtils';
import { getTheme } from '../../utils/themeUtils';
import { TimelineHeader } from './TimelineHeader';
import { TaskBar } from './TaskBar';
import { DependencyLines } from './DependencyLines';
import { GanttTooltip } from './GanttTooltip';

interface GanttChartProps {
  visibleTasks: Task[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  visibleTasks,
  scrollContainerRef,
  svgRef,
}) => {
  const {
    tasks,
    resources,
    baselines,
    settings,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    addDependency,
    removeDependency,
    dragState,
    setDragState,
  } = useGanttStore();

  const theme = getTheme(settings.colorMode, settings.themePalette);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Tooltip state
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connecting dependency state
  const [connectingLine, setConnectingLine] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    fromTaskId: string;
  } | null>(null);

  // Find active baseline
  const activeBaseline = useMemo(() => {
    if (!settings.activeBaselineId) return null;
    return baselines.find((b) => b.id === settings.activeBaselineId) || null;
  }, [baselines, settings.activeBaselineId]);

  // Compute timeline range
  const { startDate, endDate } = useMemo(() => {
    const dates = visibleTasks.map((t) => ({ startDate: t.startDate, endDate: t.endDate }));
    return calculateTimelineRange(dates, settings.viewMode);
  }, [visibleTasks, settings.viewMode]);

  // Generate header data
  const headerData = useMemo(() => {
    return generateTimelineHeader(
      startDate,
      endDate,
      settings.viewMode,
      settings.columnWidth,
      settings.nonWorkingDays
    );
  }, [startDate, endDate, settings.viewMode, settings.columnWidth, settings.nonWorkingDays]);

  // Map coordinates for visible tasks
  const coordsMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number; baselineX?: number; baselineWidth?: number }>();

    visibleTasks.forEach((task, index) => {
      const x = dateToCoordinate(task.startDate, startDate, settings.viewMode, settings.columnWidth);
      const endX = dateToCoordinate(task.endDate, startDate, settings.viewMode, settings.columnWidth);
      let width = Math.max(8, endX - x);

      if (task.type === 'milestone') {
        width = 24;
      }

      const y = index * settings.rowHeight;
      const height = settings.rowHeight;

      let baselineX: number | undefined = undefined;
      let baselineWidth: number | undefined = undefined;

      if (activeBaseline && activeBaseline.tasks[task.id]) {
        const bTask = activeBaseline.tasks[task.id];
        baselineX = dateToCoordinate(bTask.startDate, startDate, settings.viewMode, settings.columnWidth);
        const bEndX = dateToCoordinate(bTask.endDate, startDate, settings.viewMode, settings.columnWidth);
        baselineWidth = Math.max(8, bEndX - baselineX);
      }

      map.set(task.id, { x, y, width, height, baselineX, baselineWidth });
    });

    return map;
  }, [visibleTasks, startDate, settings.viewMode, settings.columnWidth, settings.rowHeight, activeBaseline]);

  // Total dimensions
  const totalChartHeight = Math.max(500, visibleTasks.length * settings.rowHeight);
  const totalChartWidth = headerData.totalWidth;

  // Today coordinate
  const todayX = useMemo(() => {
    const todayStr = formatISODate(new Date());
    return dateToCoordinate(todayStr, startDate, settings.viewMode, settings.columnWidth);
  }, [startDate, settings.viewMode, settings.columnWidth]);

  // Handle Dragging
  const handleStartDrag = useCallback(
    (
      e: React.MouseEvent,
      taskId: string,
      type: 'move' | 'resize-start' | 'resize-end' | 'progress' | 'dependency-create'
    ) => {
      e.stopPropagation();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const coord = coordsMap.get(taskId);
      if (type === 'dependency-create' && coord) {
        setConnectingLine({
          startX: coord.x + coord.width,
          startY: coord.y + coord.height / 2,
          currentX: coord.x + coord.width,
          currentY: coord.y + coord.height / 2,
          fromTaskId: taskId,
        });
        return;
      }

      const drag: DragState = {
        taskId,
        type,
        initialX: e.clientX,
        initialStartDate: task.startDate,
        initialEndDate: task.endDate,
        initialDuration: task.duration,
        initialProgress: task.progress,
        currentX: e.clientX,
      };

      setDragState(drag);
    },
    [tasks, coordsMap, setDragState]
  );

  // Global mousemove and mouseup listeners for drag interactions
  useEffect(() => {
    if (!dragState && !connectingLine) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 1. Dependency creation line
      if (connectingLine && chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
        const scrollTop = scrollContainerRef.current?.scrollTop || 0;

        setConnectingLine((prev) =>
          prev
            ? {
                ...prev,
                currentX: e.clientX - rect.left + scrollLeft,
                currentY: e.clientY - rect.top + scrollTop - 56, // subtract header height
              }
            : null
        );
        return;
      }

      // 2. Task move or resize
      if (!dragState) return;
      const dx = e.clientX - dragState.initialX;
      const task = tasks.find((t) => t.id === dragState.taskId);
      if (!task) return;

      if (dragState.type === 'move') {
        const initialStartX = dateToCoordinate(dragState.initialStartDate, startDate, settings.viewMode, settings.columnWidth);
        const newStartX = initialStartX + dx;
        const newStartDate = coordinateToDate(newStartX, startDate, settings.viewMode, settings.columnWidth, settings.snapToGrid);
        const newEndDate = addDays(newStartDate, dragState.initialDuration);

        updateTask(dragState.taskId, { startDate: newStartDate, endDate: newEndDate }, false);
      } else if (dragState.type === 'resize-start') {
        const initialStartX = dateToCoordinate(dragState.initialStartDate, startDate, settings.viewMode, settings.columnWidth);
        const newStartX = initialStartX + dx;
        const newStartDate = coordinateToDate(newStartX, startDate, settings.viewMode, settings.columnWidth, settings.snapToGrid);

        if (newStartDate <= dragState.initialEndDate) {
          const newDuration = Math.max(1, diffDays(newStartDate, dragState.initialEndDate));
          updateTask(dragState.taskId, { startDate: newStartDate, duration: newDuration }, false);
        }
      } else if (dragState.type === 'resize-end') {
        const initialEndX = dateToCoordinate(dragState.initialEndDate, startDate, settings.viewMode, settings.columnWidth);
        const newEndX = initialEndX + dx;
        const newEndDate = coordinateToDate(newEndX, startDate, settings.viewMode, settings.columnWidth, settings.snapToGrid);

        if (newEndDate >= dragState.initialStartDate) {
          const newDuration = Math.max(1, diffDays(dragState.initialStartDate, newEndDate));
          updateTask(dragState.taskId, { endDate: newEndDate, duration: newDuration }, false);
        }
      } else if (dragState.type === 'progress') {
        const coord = coordsMap.get(dragState.taskId);
        if (coord) {
          const newProgWidth = Math.max(0, Math.min(coord.width, (coord.width * dragState.initialProgress) / 100 + dx));
          const newProgress = Math.round((newProgWidth / coord.width) * 100);
          updateTask(dragState.taskId, { progress: newProgress }, false);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (connectingLine) {
        // Check if mouse released over another task
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetBar = elements.find((el) => el.closest('.gantt-task-bar') || el.closest('.gantt-milestone'));
        if (targetBar) {
          // Find task id from attributes or list
          for (const t of visibleTasks) {
            const coord = coordsMap.get(t.id);
            if (coord && t.id !== connectingLine.fromTaskId) {
              const rect = chartContainerRef.current?.getBoundingClientRect();
              const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
              const scrollTop = scrollContainerRef.current?.scrollTop || 0;
              const mouseChartX = e.clientX - (rect?.left || 0) + scrollLeft;
              const mouseChartY = e.clientY - (rect?.top || 0) + scrollTop - 56;

              if (
                mouseChartX >= coord.x &&
                mouseChartX <= coord.x + coord.width &&
                mouseChartY >= coord.y &&
                mouseChartY <= coord.y + coord.height
              ) {
                addDependency(t.id, connectingLine.fromTaskId);
                break;
              }
            }
          }
        }
        setConnectingLine(null);
      }

      if (dragState) {
        // Commit final state to history
        const finalTask = tasks.find((t) => t.id === dragState.taskId);
        if (finalTask) {
          updateTask(dragState.taskId, { ...finalTask }, true);
        }
        setDragState(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState,
    connectingLine,
    tasks,
    visibleTasks,
    startDate,
    settings.viewMode,
    settings.columnWidth,
    settings.snapToGrid,
    coordsMap,
    setDragState,
    updateTask,
    addDependency,
    scrollContainerRef,
  ]);

  return (
    <div
      ref={chartContainerRef}
      className="relative flex flex-col select-none overflow-visible"
      style={{
        backgroundColor: theme.colors.bgTimeline,
        width: `${totalChartWidth}px`,
        minHeight: '100%',
      }}
    >
      {/* 1. Header (Sticky Top) */}
      <TimelineHeader headerData={headerData} theme={theme} height={56} />

      {/* 2. Main Timeline Canvas / SVG Surface */}
      <div
        className="relative"
        style={{
          width: `${totalChartWidth}px`,
          height: `${totalChartHeight}px`,
        }}
        onClick={() => setSelectedTaskId(null)}
      >
        {/* SVG Plane for Grid Lines, Weekends, Today Line, Dependencies & Task Bars */}
        <svg
          ref={svgRef}
          width={totalChartWidth}
          height={totalChartHeight}
          className="absolute inset-0 block"
          style={{ width: `${totalChartWidth}px`, height: `${totalChartHeight}px` }}
        >
          {/* Clip paths for task bar labels */}
          <defs>
            {visibleTasks.map((t) => {
              const coord = coordsMap.get(t.id);
              if (!coord) return null;
              return (
                <clipPath key={`clip-${t.id}`} id={`clip-${t.id}`}>
                  <rect
                    x={coord.x + 8}
                    y={coord.y + 4}
                    width={Math.max(0, coord.width - 24)}
                    height={coord.height - 8}
                  />
                </clipPath>
              );
            })}
          </defs>

          {/* Background Grid: Columns (Days/Weeks/Months) */}
          <g className="grid-columns pointer-events-none">
            {headerData.secondaryHeader.map((interval) => (
              <g key={`col-${interval.id}`}>
                {/* Non-working days (weekend) shaded background */}
                {interval.isWeekend && settings.showNonWorkingDays && (
                  <rect
                    x={interval.left}
                    y={0}
                    width={interval.width}
                    height={totalChartHeight}
                    fill={theme.colors.weekendBg}
                  />
                )}
                {/* Vertical column line */}
                <line
                  x1={interval.left}
                  y1={0}
                  x2={interval.left}
                  y2={totalChartHeight}
                  stroke={theme.colors.gridLine}
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>

          {/* Horizontal Row Lines */}
          <g className="grid-rows pointer-events-none">
            {visibleTasks.map((_, idx) => (
              <line
                key={`row-${idx}`}
                x1={0}
                y1={(idx + 1) * settings.rowHeight}
                x2={totalChartWidth}
                y2={(idx + 1) * settings.rowHeight}
                stroke={theme.colors.gridLine}
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Today Indicator Line */}
          {todayX >= 0 && todayX <= totalChartWidth && (
            <g className="today-indicator pointer-events-none">
              <line
                x1={todayX}
                y1={0}
                x2={todayX}
                y2={totalChartHeight}
                stroke={theme.colors.todayLine}
                strokeWidth="2"
                strokeDasharray="4,2"
              />
              <circle cx={todayX} cy={4} r="4" fill={theme.colors.todayLine} />
            </g>
          )}

          {/* Dependencies Connecting Arrows */}
          {settings.showDependencies && (
            <DependencyLines
              tasks={visibleTasks}
              coordsMap={coordsMap}
              theme={theme}
              onRemoveDependency={removeDependency}
              connectingLine={connectingLine}
            />
          )}

          {/* Task Bars Rendering */}
          <g className="task-bars">
            {visibleTasks.map((task) => {
              const coord = coordsMap.get(task.id);
              if (!coord) return null;
              const resource = resources.find((r) => r.id === task.assigneeId);

              return (
                <TaskBar
                  key={task.id}
                  task={task}
                  x={coord.x}
                  y={coord.y}
                  width={coord.width}
                  height={coord.height}
                  baseline={activeBaseline}
                  showGhostMode={settings.showGhostMode}
                  baselineX={coord.baselineX}
                  baselineWidth={coord.baselineWidth}
                  theme={theme}
                  resource={resource}
                  isSelected={selectedTaskId === task.id}
                  onSelect={(e) => {
                    e.stopPropagation();
                    setSelectedTaskId(task.id);
                  }}
                  onStartDrag={(e, type) => handleStartDrag(e, task.id, type)}
                  onMouseEnter={(e) => {
                    setHoveredTask(task);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredTask(null)}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredTask && !dragState && (
        <GanttTooltip
          task={hoveredTask}
          x={tooltipPos.x}
          y={tooltipPos.y}
          theme={theme}
          resources={resources}
          activeBaseline={activeBaseline}
        />
      )}
    </div>
  );
};
