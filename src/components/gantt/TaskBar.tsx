import React, { useState } from 'react';
import { Task, Baseline, Resource } from '../../types/gantt';
import { ThemeConfig } from '../../utils/themeUtils';
import { compareTaskWithBaseline } from '../../utils/baselineUtils';

interface TaskBarProps {
  task: Task;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: Baseline | null;
  showGhostMode: boolean;
  baselineX?: number;
  baselineWidth?: number;
  theme: ThemeConfig;
  resource?: Resource;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onStartDrag: (
    e: React.MouseEvent,
    type: 'move' | 'resize-start' | 'resize-end' | 'progress' | 'dependency-create'
  ) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export const TaskBar: React.FC<TaskBarProps> = ({
  task,
  x,
  y,
  width,
  height,
  baseline,
  showGhostMode,
  baselineX,
  baselineWidth,
  theme,
  resource,
  isSelected,
  onSelect,
  onStartDrag,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baselineDiff = compareTaskWithBaseline(task, baseline);
  const barHeight = Math.max(22, height - 16);
  const barY = y + (height - barHeight) / 2;

  // Bar color based on status or custom color
  const statusColor = task.color || theme.colors.statusBar[task.status] || theme.colors.primary;
  const progressWidth = Math.max(0, Math.min(width, (width * task.progress) / 100));

  // Ghost bar positioning (Modo Fantasma)
  const renderGhostBar = () => {
    if (
      !showGhostMode ||
      !baselineDiff.hasBaseline ||
      baselineX === undefined ||
      baselineWidth === undefined
    ) {
      return null;
    }

    if (task.type === 'milestone') {
      const size = barHeight * 0.7;
      const centerY = barY + barHeight / 2;
      return (
        <g className="ghost-baseline-milestone pointer-events-none opacity-60">
          <rect
            x={baselineX - size / 2}
            y={centerY - size / 2}
            width={size}
            height={size}
            transform={`rotate(45, ${baselineX}, ${centerY})`}
            fill="none"
            stroke={theme.colors.baselineBorder}
            strokeWidth="2"
            strokeDasharray="3,2"
          />
        </g>
      );
    }

    // Ghost bar for tasks and groups
    const ghostH = Math.max(16, barHeight - 4);
    const ghostY = barY + (barHeight - ghostH) / 2;

    return (
      <g className="ghost-baseline-bar pointer-events-none">
        {/* Baseline ghost rectangle */}
        <rect
          x={baselineX}
          y={ghostY}
          width={Math.max(6, baselineWidth)}
          height={ghostH}
          rx={5}
          fill={theme.colors.baselineBar}
          stroke={theme.colors.baselineBorder}
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        {/* Baseline text or diff tag */}
        {baselineDiff.status !== 'on_track' && (
          <g transform={`translate(${Math.max(baselineX + baselineWidth + 6, x + width + 6)}, ${ghostY + ghostH / 2 + 4})`}>
            <rect
              x="-4"
              y="-11"
              width={baselineDiff.status === 'delayed' ? 82 : 88}
              height="16"
              rx="4"
              fill={baselineDiff.status === 'delayed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
              stroke={baselineDiff.status === 'delayed' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)'}
              strokeWidth="1"
            />
            <text
              fill={baselineDiff.status === 'delayed' ? '#F87171' : '#34D399'}
              fontSize="10"
              fontWeight="600"
              fontFamily="inherit"
            >
              {baselineDiff.displayText}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Milestone rendering
  if (task.type === 'milestone') {
    const size = barHeight * 0.85;
    const centerY = barY + barHeight / 2;
    const isDone = task.progress === 100;

    return (
      <g
        className="gantt-milestone cursor-pointer group"
        onClick={onSelect}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onMouseEnter(e);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onMouseLeave();
        }}
      >
        {renderGhostBar()}

        {/* Milestone diamond */}
        <rect
          x={x - size / 2}
          y={centerY - size / 2}
          width={size}
          height={size}
          transform={`rotate(45, ${x}, ${centerY})`}
          fill={isDone ? '#10B981' : statusColor}
          stroke={isSelected ? '#FFFFFF' : `${statusColor}dd`}
          strokeWidth={isSelected ? '2.5' : '1.5'}
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
          className="transition-transform group-hover:scale-110 origin-center"
          onMouseDown={(e) => onStartDrag(e, 'move')}
        />

        {/* Milestone Icon/Center Dot */}
        <circle cx={x} cy={centerY} r="3" fill="#FFFFFF" pointerEvents="none" />

        {/* Milestone label next to diamond */}
        <text
          x={x + size / 2 + 8}
          y={centerY + 4}
          fill={theme.colors.textPrimary}
          fontSize="11.5"
          fontWeight="600"
          pointerEvents="none"
          className="select-none"
        >
          {task.name}
        </text>

        {/* Dependency link handle */}
        {isHovered && (
          <circle
            cx={x + size / 2 + 3}
            cy={centerY}
            r="6"
            fill={theme.colors.primary}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            className="cursor-crosshair hover:scale-125 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartDrag(e, 'dependency-create');
            }}
          />
        )}
      </g>
    );
  }

  // Group / Phase bracket rendering
  if (task.type === 'group') {
    const bracketH = 14;
    const tickH = 8;
    const topY = barY + 4;

    return (
      <g
        className="gantt-group cursor-pointer group"
        onClick={onSelect}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onMouseEnter(e);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onMouseLeave();
        }}
      >
        {renderGhostBar()}

        {/* Phase bracket path */}
        <path
          d={`M ${x} ${topY + tickH} L ${x} ${topY} L ${x + width} ${topY} L ${x + width} ${topY + tickH} L ${x + width - 6} ${topY + bracketH} L ${x + 6} ${topY + bracketH} Z`}
          fill={statusColor}
          stroke={isSelected ? '#FFFFFF' : statusColor}
          strokeWidth={isSelected ? '2' : '1'}
          opacity="0.9"
          onMouseDown={(e) => onStartDrag(e, 'move')}
        />

        {/* Progress in group */}
        {task.progress > 0 && (
          <path
            d={`M ${x} ${topY + tickH} L ${x} ${topY} L ${x + progressWidth} ${topY} L ${x + progressWidth} ${topY + bracketH} L ${x + 6} ${topY + bracketH} Z`}
            fill="#FFFFFF"
            opacity="0.25"
            pointerEvents="none"
          />
        )}

        {/* Label */}
        <text
          x={x + 10}
          y={topY - 3}
          fill={theme.colors.textPrimary}
          fontSize="11"
          fontWeight="700"
          pointerEvents="none"
          className="select-none tracking-wide"
        >
          {task.name}
        </text>

        {/* Resize Handles */}
        {isHovered && (
          <>
            <rect
              x={x}
              y={topY}
              width={8}
              height={bracketH}
              fill="transparent"
              className="cursor-ew-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartDrag(e, 'resize-start');
              }}
            />
            <rect
              x={x + width - 8}
              y={topY}
              width={8}
              height={bracketH}
              fill="transparent"
              className="cursor-ew-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartDrag(e, 'resize-end');
              }}
            />
          </>
        )}
      </g>
    );
  }

  // Standard Task bar
  return (
    <g
      className="gantt-task-bar cursor-pointer group"
      onClick={onSelect}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter(e);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave();
      }}
    >
      {/* 1. Ghost baseline underlay */}
      {renderGhostBar()}

      {/* 2. Main task bar background container */}
      <rect
        x={x}
        y={barY}
        width={Math.max(6, width)}
        height={barHeight}
        rx={6}
        fill={statusColor}
        fillOpacity="0.28"
        stroke={isSelected ? '#FFFFFF' : `${statusColor}99`}
        strokeWidth={isSelected ? '2.5' : '1.5'}
        className="transition-colors duration-150"
        onMouseDown={(e) => onStartDrag(e, 'move')}
      />

      {/* 3. Progress fill bar */}
      {task.progress > 0 && (
        <rect
          x={x}
          y={barY}
          width={progressWidth}
          height={barHeight}
          rx={6}
          fill={statusColor}
          fillOpacity="0.9"
          pointerEvents="none"
        />
      )}

      {/* 4. Task inner label and assignee avatar */}
      <g className="pointer-events-none select-none">
        {width > 45 && (
          <text
            x={x + 10}
            y={barY + barHeight / 2 + 4}
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="500"
            className="truncate font-medium shadow-sm"
            clipPath={`url(#clip-${task.id})`}
          >
            {task.name}
          </text>
        )}

        {/* Progress percentage label if space allows */}
        {width > 120 && (
          <text
            x={x + width - 12}
            y={barY + barHeight / 2 + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.85)"
            fontSize="10"
            fontWeight="600"
          >
            {task.progress}%
          </text>
        )}
      </g>

      {/* 5. Interactive Handles when hovered or selected */}
      {isHovered && (
        <>
          {/* Resize Left Handle */}
          <g
            className="cursor-w-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartDrag(e, 'resize-start');
            }}
          >
            <rect
              x={x - 2}
              y={barY}
              width={8}
              height={barHeight}
              fill="transparent"
            />
            <rect
              x={x}
              y={barY + 4}
              width={3}
              height={barHeight - 8}
              rx={1.5}
              fill="#FFFFFF"
              fillOpacity="0.8"
            />
          </g>

          {/* Resize Right Handle */}
          <g
            className="cursor-e-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartDrag(e, 'resize-end');
            }}
          >
            <rect
              x={x + width - 6}
              y={barY}
              width={8}
              height={barHeight}
              fill="transparent"
            />
            <rect
              x={x + width - 3}
              y={barY + 4}
              width={3}
              height={barHeight - 8}
              rx={1.5}
              fill="#FFFFFF"
              fillOpacity="0.8"
            />
          </g>

          {/* Progress draggable handle */}
          <circle
            cx={x + progressWidth}
            cy={barY + barHeight / 2}
            r="4.5"
            fill="#FFFFFF"
            stroke={statusColor}
            strokeWidth="2"
            className="cursor-ew-resize hover:scale-125 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartDrag(e, 'progress');
            }}
          />

          {/* Dependency Output Port (Connector dot on right) */}
          <g
            className="cursor-crosshair"
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartDrag(e, 'dependency-create');
            }}
          >
            <circle
              cx={x + width + 8}
              cy={barY + barHeight / 2}
              r="6.5"
              fill={theme.colors.primary}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="hover:scale-125 transition-transform shadow-md"
            />
            <circle
              cx={x + width + 8}
              cy={barY + barHeight / 2}
              r="2"
              fill="#FFFFFF"
            />
          </g>
        </>
      )}
    </g>
  );
};
