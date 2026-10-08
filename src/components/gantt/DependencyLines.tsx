import React, { useState } from 'react';
import { Task } from '../../types/gantt';
import { ThemeConfig } from '../../utils/themeUtils';

interface TaskCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DependencyLinesProps {
  tasks: Task[];
  coordsMap: Map<string, TaskCoordinates>;
  theme: ThemeConfig;
  onRemoveDependency?: (targetId: string, predId: string) => void;
  connectingLine?: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
}

export const DependencyLines: React.FC<DependencyLinesProps> = ({
  tasks,
  coordsMap,
  theme,
  onRemoveDependency,
  connectingLine,
}) => {
  const [hoveredDep, setHoveredDep] = useState<{ targetId: string; predId: string } | null>(null);

  // Generate paths
  const paths: {
    id: string;
    path: string;
    targetId: string;
    predId: string;
    midX: number;
    midY: number;
  }[] = [];

  tasks.forEach((task) => {
    const targetCoord = coordsMap.get(task.id);
    if (!targetCoord) return;

    const targetX = targetCoord.x;
    const targetY = targetCoord.y + targetCoord.height / 2;

    task.dependencies.forEach((predId) => {
      const predCoord = coordsMap.get(predId);
      if (!predCoord) return;

      const predX = predCoord.x + predCoord.width;
      const predY = predCoord.y + predCoord.height / 2;

      // Smart routing bezier curve
      const dx = targetX - predX;
      let path = '';

      if (dx >= 15) {
        // Forward flow
        const controlOffset = Math.min(40, Math.max(15, dx / 2));
        path = `M ${predX} ${predY} C ${predX + controlOffset} ${predY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`;
      } else {
        // Backward loop: task starts before predecessor finishes
        const loopOut = 20;
        const midY = (predY + targetY) / 2;
        path = `M ${predX} ${predY} L ${predX + loopOut} ${predY} C ${predX + loopOut + 15} ${predY}, ${predX + loopOut + 15} ${midY}, ${targetX - 25} ${midY} C ${targetX - 10} ${midY}, ${targetX - 10} ${targetY}, ${targetX} ${targetY}`;
      }

      paths.push({
        id: `${predId}->${task.id}`,
        path,
        targetId: task.id,
        predId,
        midX: (predX + targetX) / 2,
        midY: (predY + targetY) / 2,
      });
    });
  });

  return (
    <g className="dependency-lines pointer-events-none">
      <defs>
        <marker
          id="dep-arrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={theme.colors.dependencyArrow} />
        </marker>
        <marker
          id="dep-arrow-hover"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
        </marker>
        <marker
          id="dep-arrow-connecting"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={theme.colors.primary} />
        </marker>
      </defs>

      {/* Render actual dependencies */}
      {paths.map(({ id, path, targetId, predId, midX, midY }) => {
        const isHovered = hoveredDep?.targetId === targetId && hoveredDep?.predId === predId;

        return (
          <g key={id} className="pointer-events-auto group">
            {/* Wider transparent hit zone for easy hovering & clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="12"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredDep({ targetId, predId })}
              onMouseLeave={() => setHoveredDep(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (onRemoveDependency) {
                  onRemoveDependency(targetId, predId);
                }
              }}
            />
            {/* Visible line */}
            <path
              d={path}
              fill="none"
              stroke={isHovered ? '#EF4444' : theme.colors.dependencyLine}
              strokeWidth={isHovered ? '2.5' : '1.75'}
              strokeDasharray={isHovered ? '4,3' : 'none'}
              markerEnd={isHovered ? 'url(#dep-arrow-hover)' : 'url(#dep-arrow)'}
              className="transition-colors duration-150"
            />
            {isHovered && (
              <g
                transform={`translate(${midX - 10}, ${midY - 10})`}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDependency?.(targetId, predId);
                }}
              >
                <circle cx="10" cy="10" r="10" fill="#EF4444" />
                <path d="M 6 6 L 14 14 M 14 6 L 6 14" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}

      {/* Currently connecting dependency line while dragging connector */}
      {connectingLine && (
        <path
          d={`M ${connectingLine.startX} ${connectingLine.startY} L ${connectingLine.currentX} ${connectingLine.currentY}`}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth="2.5"
          strokeDasharray="5,4"
          markerEnd="url(#dep-arrow-connecting)"
          className="pointer-events-none"
        />
      )}
    </g>
  );
};
