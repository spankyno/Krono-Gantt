import { ViewMode } from '../types/gantt';

/** Ventana de fechas admitida (evita fechas absurdas que bloquearían el render). */
export const MIN_ISO_DATE = '2000-01-01';
export const MAX_ISO_DATE = '2100-12-31';
/** Máximo de días que se dibujan en el timeline (protege frente a rangos enormes). */
export const MAX_TIMELINE_DAYS = 5000;

const DAY_MS = 86_400_000;

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** true si es 'YYYY-MM-DD', una fecha real del calendario y está dentro de la ventana admitida. */
export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (value < MIN_ISO_DATE || value > MAX_ISO_DATE) return false;
  return formatISODate(parseISODate(value)) === value; // descarta 2026-02-31, etc.
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
  return Math.round(diffTime / DAY_MS);
}

function getTodayISO(): string {
  return formatISODate(new Date());
}

interface TimelineInterval {
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

/** Agrupa los días del rango por mes (cabecera superior de las vistas día y semana). */
function buildMonthHeader(startDate: Date, totalDays: number, pxPerDay: number): TimelineInterval[] {
  const months: TimelineInterval[] = [];
  const day = new Date(startDate);
  let current: TimelineInterval | null = null;
  let currentMonth = -1;
  let currentYear = 0;

  for (let i = 0; i < totalDays; i++) {
    const month = day.getMonth();
    if (month !== currentMonth) {
      currentMonth = month;
      currentYear = day.getFullYear();
      current = {
        id: `month-${currentYear}-${month}`,
        startDate: new Date(currentYear, month, 1),
        endDate: new Date(currentYear, month + 1, 0),
        label: `${MONTH_NAMES_ES[month]} ${currentYear}`,
        left: i * pxPerDay,
        width: pxPerDay,
      };
      months.push(current);
    } else {
      current!.width += pxPerDay;
    }
    day.setDate(day.getDate() + 1);
  }
  return months;
}

export function generateTimelineHeader(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
  columnWidth: number,
  nonWorkingDays: number[] = [0, 6]
): TimelineHeaderData {
  const rawDays = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS);
  const totalDays = Number.isFinite(rawDays) ? Math.min(MAX_TIMELINE_DAYS, Math.max(1, rawDays)) : 1;
  const secondaryHeader: TimelineInterval[] = [];

  if (viewMode === 'day') {
    // Arriba: meses · Abajo: días
    const todayStr = getTodayISO();
    const day = new Date(startDate);
    for (let i = 0; i < totalDays; i++) {
      const dayOfWeek = day.getDay();
      secondaryHeader.push({
        id: `day-${formatISODate(day)}`,
        startDate: new Date(day),
        endDate: new Date(day),
        label: `${day.getDate()}`,
        subLabel: DAY_NAMES_SHORT[dayOfWeek],
        isToday: formatISODate(day) === todayStr,
        isWeekend: nonWorkingDays.includes(dayOfWeek),
        left: i * columnWidth,
        width: columnWidth,
      });
      day.setDate(day.getDate() + 1);
    }
    return {
      primaryHeader: buildMonthHeader(startDate, totalDays, columnWidth),
      secondaryHeader,
      totalWidth: totalDays * columnWidth,
      startDate,
      endDate,
      daysCount: totalDays,
    };
  }

  if (viewMode === 'week') {
    // Arriba: meses · Abajo: semanas
    const weeksCount = Math.ceil(totalDays / 7);
    for (let w = 0; w < weeksCount; w++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      secondaryHeader.push({
        id: `week-${w}`,
        startDate: weekStart,
        endDate: weekEnd,
        label: `S${w + 1}`,
        subLabel: `${weekStart.getDate()} ${MONTH_NAMES_SHORT[weekStart.getMonth()]}`,
        left: w * columnWidth,
        width: columnWidth,
      });
    }
    return {
      primaryHeader: buildMonthHeader(startDate, totalDays, columnWidth / 7),
      secondaryHeader,
      totalWidth: weeksCount * columnWidth,
      startDate,
      endDate,
      daysCount: totalDays,
    };
  }

  // Mes / Trimestre — Arriba: años · Abajo: meses
  const pxPerDay = columnWidth / 30;
  const maxMonths = Math.ceil(MAX_TIMELINE_DAYS / 28) + 1;
  const primaryHeader: TimelineInterval[] = [];
  const cursor = new Date(startDate);
  cursor.setDate(1);

  let year: TimelineInterval | null = null;
  while (cursor <= endDate && secondaryHeader.length < maxMonths) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const next = new Date(y, m + 1, 1);
    const daysInMonth = Math.round((next.getTime() - cursor.getTime()) / DAY_MS);
    const left = Math.max(0, Math.round((cursor.getTime() - startDate.getTime()) / DAY_MS)) * pxPerDay;
    const width = daysInMonth * pxPerDay;

    secondaryHeader.push({
      id: `m-${y}-${m}`,
      startDate: new Date(cursor),
      endDate: new Date(y, m + 1, 0),
      label: MONTH_NAMES_SHORT[m],
      subLabel: `${y}`,
      left,
      width,
    });

    if (year && year.id === `year-${y}`) {
      year.width += width;
    } else {
      year = {
        id: `year-${y}`,
        startDate: new Date(y, 0, 1),
        endDate: new Date(y, 11, 31),
        label: `${y}`,
        left,
        width,
      };
      primaryHeader.push(year);
    }
    cursor.setTime(next.getTime());
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
  const diffDaysFromStart = (target.getTime() - timelineStartDate.getTime()) / DAY_MS;

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
