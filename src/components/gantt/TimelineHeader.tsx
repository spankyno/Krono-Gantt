import React from 'react';
import { TimelineHeaderData } from '../../utils/dateUtils';
import { ThemeConfig } from '../../utils/themeUtils';

interface TimelineHeaderProps {
  headerData: TimelineHeaderData;
  theme: ThemeConfig;
  height?: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  headerData,
  theme,
  height = 56,
}) => {
  return (
    <div
      className="sticky top-0 z-30 select-none border-b font-medium transition-colors"
      style={{
        height: `${height}px`,
        backgroundColor: theme.colors.bgHeader,
        borderColor: theme.colors.border,
        width: `${headerData.totalWidth}px`,
      }}
    >
      {/* Tier 1: Months / Years */}
      <div
        className="flex border-b text-xs font-semibold uppercase tracking-wider overflow-hidden"
        style={{
          height: `${height / 2}px`,
          borderColor: theme.colors.borderLight,
          color: theme.colors.textSecondary,
        }}
      >
        {headerData.primaryHeader.map((interval) => (
          <div
            key={interval.id}
            className="flex items-center px-3 border-r shrink-0 whitespace-nowrap overflow-hidden text-ellipsis truncate"
            style={{
              width: `${interval.width}px`,
              borderColor: theme.colors.border,
            }}
          >
            {interval.label}
          </div>
        ))}
      </div>

      {/* Tier 2: Days / Weeks */}
      <div
        className="flex text-[11px] font-medium overflow-hidden"
        style={{
          height: `${height / 2}px`,
          color: theme.colors.textMuted,
        }}
      >
        {headerData.secondaryHeader.map((interval) => {
          const isToday = interval.isToday;
          const isWeekend = interval.isWeekend;

          return (
            <div
              key={interval.id}
              className={`flex flex-col items-center justify-center border-r shrink-0 transition-colors ${
                isToday ? 'font-bold' : ''
              }`}
              style={{
                width: `${interval.width}px`,
                borderColor: theme.colors.border,
                backgroundColor: isToday
                  ? `${theme.colors.primary}22`
                  : isWeekend
                  ? theme.colors.weekendBg
                  : 'transparent',
                color: isToday ? theme.colors.primary : undefined,
              }}
            >
              <span className="leading-tight text-[11px]">{interval.label}</span>
              {interval.subLabel && (
                <span className="leading-none text-[9px] opacity-70">
                  {interval.subLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
