import * as XLSX from 'xlsx';
import { Task, Resource, TaskStatus, TaskPriority, TaskType } from '../types/gantt';
import { addDays, diffDays, formatISODate } from './dateUtils';

export interface ColumnMapping {
  name: string;
  startDate: string;
  endDate: string;
  duration?: string;
  progress?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  type?: string;
  budget?: string;
  notes?: string;
}

export interface ExcelPreviewData {
  sheets: string[];
  selectedSheet: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export function readExcelFile(file: File): Promise<ExcelPreviewData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('El archivo Excel está vacío.');
        }

        const headers = (jsonData[0] as string[]).map((h, i) => String(h || `Columna_${i + 1}`).trim());
        const rawRows = jsonData.slice(1) as any[][];

        const rows: Record<string, any>[] = rawRows
          .filter((r) => r.some((cell) => cell !== null && cell !== undefined && cell !== ''))
          .map((row) => {
            const rowObj: Record<string, any> = {};
            headers.forEach((header, colIdx) => {
              rowObj[header] = row[colIdx];
            });
            return rowObj;
          });

        resolve({
          sheets: workbook.SheetNames,
          selectedSheet: sheetName,
          headers,
          rows: rows.slice(0, 50), // preview first 50 rows
          totalRows: rows.length,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function parseDateCell(val: any): string {
  if (!val) return formatISODate(new Date());
  if (val instanceof Date) return formatISODate(val);
  if (typeof val === 'number') {
    // Excel serial number
    const date = new Date((val - (25567 + 2)) * 86400 * 1000);
    return formatISODate(date);
  }
  const str = String(val).trim();
  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Check DD/MM/YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD-MM-YYYY
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatISODate(parsed);
  return formatISODate(new Date());
}

export function convertMappedDataToTasks(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  resources: Resource[]
): Task[] {
  return rows.map((row, index) => {
    const name = mapping.name && row[mapping.name] ? String(row[mapping.name]).trim() : `Tarea ${index + 1}`;
    const startDate = mapping.startDate && row[mapping.startDate] 
      ? parseDateCell(row[mapping.startDate]) 
      : formatISODate(new Date());

    let endDate = mapping.endDate && row[mapping.endDate]
      ? parseDateCell(row[mapping.endDate])
      : '';

    let duration = 3;
    if (mapping.duration && row[mapping.duration]) {
      const parsedDur = parseInt(row[mapping.duration], 10);
      if (!isNaN(parsedDur) && parsedDur >= 0) duration = parsedDur;
    }

    if (!endDate) {
      endDate = addDays(startDate, duration);
    } else {
      duration = Math.max(1, diffDays(startDate, endDate));
    }

    let progress = 0;
    if (mapping.progress && row[mapping.progress] !== undefined) {
      let p = parseFloat(row[mapping.progress]);
      if (p <= 1 && p > 0) p = p * 100; // was fraction (0.5 -> 50%)
      if (!isNaN(p)) progress = Math.min(100, Math.max(0, Math.round(p)));
    }

    let status: TaskStatus = 'todo';
    if (progress === 100) status = 'done';
    else if (progress > 0) status = 'in_progress';
    if (mapping.status && row[mapping.status]) {
      const s = String(row[mapping.status]).toLowerCase();
      if (s.includes('hech') || s.includes('don') || s.includes('complet')) status = 'done';
      else if (s.includes('prog') || s.includes('curso')) status = 'in_progress';
      else if (s.includes('rev')) status = 'review';
      else if (s.includes('bloq') || s.includes('block')) status = 'blocked';
    }

    let priority: TaskPriority = 'medium';
    if (mapping.priority && row[mapping.priority]) {
      const pr = String(row[mapping.priority]).toLowerCase();
      if (pr.includes('urg')) priority = 'urgent';
      else if (pr.includes('alt') || pr.includes('high')) priority = 'high';
      else if (pr.includes('baj') || pr.includes('low')) priority = 'low';
    }

    let assigneeId: string | undefined = undefined;
    if (mapping.assignee && row[mapping.assignee]) {
      const aName = String(row[mapping.assignee]).toLowerCase();
      const matched = resources.find((r) => r.name.toLowerCase().includes(aName));
      if (matched) assigneeId = matched.id;
    }

    let type: TaskType = 'task';
    if (duration === 0) type = 'milestone';
    if (mapping.type && row[mapping.type]) {
      const t = String(row[mapping.type]).toLowerCase();
      if (t.includes('hit') || t.includes('milest')) type = 'milestone';
      else if (t.includes('grup') || t.includes('fase') || t.includes('summ')) type = 'group';
    }

    let budget: number | undefined = undefined;
    if (mapping.budget && row[mapping.budget]) {
      const b = parseFloat(row[mapping.budget]);
      if (!isNaN(b)) budget = b;
    }

    return {
      id: `task-imp-${Date.now()}-${index}`,
      name,
      startDate,
      endDate,
      duration,
      progress,
      status,
      priority,
      type,
      assigneeId,
      budget,
      notes: mapping.notes && row[mapping.notes] ? String(row[mapping.notes]) : '',
      dependencies: [],
      order: index,
    };
  });
}

export function exportTasksToExcel(tasks: Task[], resources: Resource[], filename: string = 'KronoGantt_Plan.xlsx') {
  const resourceMap = new Map(resources.map((r) => [r.id, r.name]));

  const data = tasks.map((t, idx) => ({
    'ID': idx + 1,
    'Nombre de Tarea': t.name,
    'Tipo': t.type === 'milestone' ? 'Hito' : t.type === 'group' ? 'Fase / Grupo' : 'Tarea',
    'Fecha Inicio': t.startDate,
    'Fecha Fin': t.endDate,
    'Duración (días)': t.duration,
    'Progreso (%)': t.progress,
    'Estado': t.status,
    'Prioridad': t.priority,
    'Responsable': t.assigneeId ? resourceMap.get(t.assigneeId) || '' : '',
    'Presupuesto (€)': t.budget || '',
    'Notas': t.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KronoGantt');

  XLSX.writeFile(workbook, filename);
}
