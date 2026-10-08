import { ViewMode } from '../types/gantt';

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseISODate(dateStr);
  d.setDate(d.getDate() + days);
  return formatISODate(d);
}

export function diffDays(startDateStr: string, endDateStr: string): number {
  const start = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isNonWorkingDay(date: Date, nonWorkingDays: number[] = [0, 6]): boolean {
  return nonWorkingDays.includes(date.getDay());
}

export function getTodayISO(): string {
  return formatISODate(new Date());
}

export interface TimelineInterval {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
  subLabel?: string;
  isToday?: boolean;
  isWeekend?: boolean;
  left: number;
  width: number;
}

export interface TimelineHeaderData {
  primaryHeader: TimelineInterval[];
  secondaryHeader: TimelineInterval[];
  totalWidth: number;
  startDate: Date;
  endDate: Date;
  daysCount: number;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const DAY_NAMES_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export function calculateTimelineRange(
  tasksDates: { startDate: string; endDate: string }[],
  viewMode: ViewMode
): { startDate: Date; endDate: Date } {
  let minDate: Date;
  let maxDate: Date;

  if (tasksDates.length === 0) {
    minDate = new Date();
    maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
  } else {
    minDate = parseISODate(tasksDates[0].startDate);
    maxDate = parseISODate(tasksDates[0].endDate);

    for (const t of tasksDates) {
      const s = parseISODate(t.startDate);
      const e = parseISODate(t.endDate);
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    }
  }

  // Add padding according to view mode
  const start = new Date(minDate);
  const end = new Date(maxDate);

  if (viewMode === 'day') {
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 21);
  } else if (viewMode === 'week') {
    start.setDate(start.getDate() - 14);
    end.setDate(end.getDate() + 45);
  } else if (viewMode === 'month') {
    start.setDate(start.getDate() - 30);
    end.setDate(end.getDate() + 90);
  } else {
    // quarter
    start.setDate(start.getDate() - 60);
    end.setDate(end.getDate() + 180);
  }

  // Normalize start to Monday or first day of month
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { startDate: start, endDate: end };
}

export function generateTimelineHeader(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
  columnWidth: number,
  nonWorkingDays: number[] = [0, 6]
): TimelineHeaderData {
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const primaryHeader: TimelineInterval[] = [];
  const secondaryHeader: TimelineInterval[] = [];

  const todayStr = getTodayISO();

  if (viewMode === 'day') {
    // Top: Months/Years, Bottom: Individual days
    let currentDay = new Date(startDate);
    let currentMonthIndex = -1;
    let currentMonthStartLeft = 0;
    let currentMonthWidth = 0;
    let currentMonthYear = 0;

    for (let i = 0; i < totalDays; i++) {
      const left = i * columnWidth;
      const dayDateStr = formatISODate(currentDay);
      const dayOfWeek = currentDay.getDay();
      const monthIndex = currentDay.getMonth();
      const year = currentDay.getFullYear();
      const isWeekend = nonWorkingDays.includes(dayOfWeek);

      secondaryHeader.push({
        id: `day-${dayDateStr}`,
        startDate: new Date(currentDay),
        endDate: new Date(currentDay),
        label: `${currentDay.getDate()}`,
        subLabel: DAY_NAMES_SHORT[dayOfWeek],
        isToday: dayDateStr === todayStr,
        isWeekend,
        left,
        width: columnWidth,
      });

      if (monthIndex !== currentMonthIndex) {
        if (currentMonthIndex !== -1) {
          primaryHeader.push({
            id: `month-${currentMonthYear}-${currentMonthIndex}`,
            startDate: new Date(currentMonthYear, currentMonthIndex, 1),
            endDate: new Date(currentMonthYear, currentMonthIndex + 1, 0),
            label: `${MONTH_NAMES_ES[currentMonthIndex]} ${currentMonthYear}`,
            left: currentMonthStartLeft,
            width: currentMonthWidth,
          });
        }
        currentMonthIndex = monthIndex;
        currentMonthYear = year;
        currentMonthStartLeft = left;
        currentMonthWidth = columnWidth;
      } else {
        currentMonthWidth += columnWidth;
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Push the final month
    if (currentMonthIndex !== -1) {
      primaryHeader.push({
        id: `month-${currentMonthYear}-${currentMonthIndex}`,
        startDate: new Date(currentMonthYear, currentMonthIndex, 1),
        endDate: new Date(currentMonthYear, currentMonthIndex + 1, 0),
        label: `${MONTH_NAMES_ES[currentMonthIndex]} ${currentMonthYear}`,
        left: currentMonthStartLeft,
        width: currentMonthWidth,
      });
    }

    return {
      primaryHeader,
      secondaryHeader,
      totalWidth: totalDays * columnWidth,
      startDate,
      endDate,
      daysCount: totalDays,
    };
  }

  if (viewMode === 'week') {
    // Top: Months, Bottom: Weeks (Semana N o rango)
    const pxPerDay = columnWidth / 7;
    let currentDay = new Date(startDate);
    let currentMonthIndex = -1;
    let currentMonthStartLeft = 0;
    let currentMonthWidth = 0;
    let currentMonthYear = 0;

    const weeksCount = Math.ceil(totalDays / 7);

    for (let w = 0; w < weeksCount; w++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const left = w * columnWidth;
      secondaryHeader.push({
        id: `week-${w}`,
        startDate: weekStart,
        endDate: weekEnd,
        label: `S${w + 1}`,
        subLabel: `${weekStart.getDate()} ${MONTH_NAMES_SHORT[weekStart.getMonth()]}`,
        left,
        width: columnWidth,
      });
    }

    // Months
    for (let i = 0; i < totalDays; i++) {
      const left = i * pxPerDay;
      const monthIndex = currentDay.getMonth();
      const year = currentDay.getFullYear();

      if (monthIndex !== currentMonthIndex) {
        if (currentMonthIndex !== -1) {
          primaryHeader.push({
            id: `month-${currentMonthYear}-${currentMonthIndex}`,
            startDate: new Date(currentMonthYear, currentMonthIndex, 1),
            endDate: new Date(currentMonthYear, currentMonthIndex + 1, 0),
            label: `${MONTH_NAMES_ES[currentMonthIndex]} ${currentMonthYear}`,
            left: currentMonthStartLeft,
            width: currentMonthWidth,
          });
        }
        currentMonthIndex = monthIndex;
        currentMonthYear = year;
        currentMonthStartLeft = left;
        currentMonthWidth = pxPerDay;
      } else {
        currentMonthWidth += pxPerDay;
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }

    if (currentMonthIndex !== -1) {
      primaryHeader.push({
        id: `month-${currentMonthYear}-${currentMonthIndex}`,
        startDate: new Date(currentMonthYear, currentMonthIndex, 1),
        endDate: new Date(currentMonthYear, currentMonthIndex + 1, 0),
        label: `${MONTH_NAMES_ES[currentMonthIndex]} ${currentMonthYear}`,
        left: currentMonthStartLeft,
        width: currentMonthWidth,
      });
    }

    return {
      primaryHeader,
      secondaryHeader,
      totalWidth: weeksCount * columnWidth,
      startDate,
      endDate,
      daysCount: totalDays,
    };
  }

  // Month or Quarter mode
  const pxPerDay = columnWidth / 30;
  let currentMonth = new Date(startDate);
  currentMonth.setDate(1);

  let currentYear = -1;
  let currentYearStartLeft = 0;
  let currentYearWidth = 0;
  let mIndex = 0;

  while (currentMonth <= endDate) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const nextMonth = new Date(year, month + 1, 1);
    const daysInMonth = Math.round((nextMonth.getTime() - currentMonth.getTime()) / (1000 * 60 * 60 * 24));
    
    // Day offset from timeline start
    const diffFromStart = Math.max(0, Math.round((currentMonth.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const left = diffFromStart * pxPerDay;
    const width = daysInMonth * pxPerDay;

    secondaryHeader.push({
      id: `m-${year}-${month}`,
      startDate: new Date(currentMonth),
      endDate: new Date(year, month + 1, 0),
      label: MONTH_NAMES_SHORT[month],
      subLabel: `${year}`,
      left,
      width,
    });

    if (year !== currentYear) {
      if (currentYear !== -1) {
        primaryHeader.push({
          id: `year-${currentYear}`,
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 11, 31),
          label: `${currentYear}`,
          left: currentYearStartLeft,
          width: currentYearWidth,
        });
      }
      currentYear = year;
      currentYearStartLeft = left;
      currentYearWidth = width;
    } else {
      currentYearWidth += width;
    }

    currentMonth = nextMonth;
    mIndex++;
  }

  if (currentYear !== -1) {
    primaryHeader.push({
      id: `year-${currentYear}`,
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 11, 31),
      label: `${currentYear}`,
      left: currentYearStartLeft,
      width: currentYearWidth,
    });
  }

  return {
    primaryHeader,
    secondaryHeader,
    totalWidth: totalDays * pxPerDay,
    startDate,
    endDate,
    daysCount: totalDays,
  };
}

export function dateToCoordinate(
  dateStr: string,
  timelineStartDate: Date,
  viewMode: ViewMode,
  columnWidth: number
): number {
  const target = parseISODate(dateStr);
  const diffDaysFromStart = (target.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24);

  if (viewMode === 'day') {
    return diffDaysFromStart * columnWidth;
  }
  if (viewMode === 'week') {
    return (diffDaysFromStart / 7) * columnWidth;
  }
  // Month / quarter
  return (diffDaysFromStart / 30) * columnWidth;
}

export function coordinateToDate(
  coordX: number,
  timelineStartDate: Date,
  viewMode: ViewMode,
  columnWidth: number,
  snapToGrid: boolean = true
): string {
  let days: number;
  if (viewMode === 'day') {
    days = coordX / columnWidth;
  } else if (viewMode === 'week') {
    days = (coordX / columnWidth) * 7;
  } else {
    days = (coordX / columnWidth) * 30;
  }

  if (snapToGrid) {
    days = Math.round(days);
  }

  const result = new Date(timelineStartDate);
  result.setDate(result.getDate() + Math.round(days));
  return formatISODate(result);
}
