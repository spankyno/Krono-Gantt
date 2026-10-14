import { Task, Resource, TaskType } from '../types/gantt';
import { addDays, diffDays, formatISODate } from './dateUtils';
import { LIMITS, newId, sanitizeTasks } from './sanitize';

/** Escapa texto para XML (los nombres/notas son datos del usuario y no pueden alterar la estructura). */
function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // caracteres de control no válidos en XML 1.0
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportToMSProjectXML(
  tasks: Task[],
  resources: Resource[],
  projectName: string = 'KronoGantt Proyecto'
): string {
  const uidMap = new Map<string, number>();
  tasks.forEach((t, i) => uidMap.set(t.id, i + 1));

  let tasksXml = '';
  tasks.forEach((task, index) => {
    const uid = index + 1;
    const startIso = `${task.startDate}T08:00:00`;
    const finishIso = `${task.endDate}T17:00:00`;
    const durationHours = task.duration * 8;
    const isMilestone = task.type === 'milestone' ? 1 : 0;
    const isSummary = task.type === 'group' ? 1 : 0;

    let predecessorsXml = '';
    task.dependencies.forEach((depId) => {
      const predUid = uidMap.get(depId);
      if (predUid) {
        predecessorsXml += `
        <PredecessorLink>
          <PredecessorUID>${predUid}</PredecessorUID>
          <Type>1</Type> <!-- Finish-to-Start -->
          <CrossProject>0</CrossProject>
        </PredecessorLink>`;
      }
    });

    tasksXml += `
    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${escapeXml(task.name)}</Name>
      <Type>0</Type>
      <CreateDate>${new Date().toISOString()}</CreateDate>
      <Start>${startIso}</Start>
      <Finish>${finishIso}</Finish>
      <Duration>PT${durationHours}H0M0S</Duration>
      <DurationFormat>21</DurationFormat>
      <PercentComplete>${Math.round(task.progress)}</PercentComplete>
      <Milestone>${isMilestone}</Milestone>
      <Summary>${isSummary}</Summary>
      <Critical>0</Critical>
      <OutlineLevel>${task.parentId ? 2 : 1}</OutlineLevel>
      <Notes>${escapeXml(task.notes || '')}</Notes>
      ${predecessorsXml}
    </Task>`;
  });

  let resourcesXml = '';
  resources.forEach((r, idx) => {
    resourcesXml += `
    <Resource>
      <UID>${idx + 1}</UID>
      <ID>${idx + 1}</ID>
      <Name>${escapeXml(r.name)}</Name>
      <Type>1</Type>
      <StandardRate>${r.hourlyRate}</StandardRate>
      <StandardRateFormat>2</StandardRateFormat>
    </Resource>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${escapeXml(projectName)}</Name>
  <Title>${escapeXml(projectName)}</Title>
  <CreationDate>${new Date().toISOString()}</CreationDate>
  <LastSaved>${new Date().toISOString()}</LastSaved>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>${tasks[0]?.startDate || '2026-10-01'}T08:00:00</StartDate>
  <FinishDate>${tasks[tasks.length - 1]?.endDate || '2026-12-31'}T17:00:00</FinishDate>
  <Tasks>
    ${tasksXml}
  </Tasks>
  <Resources>
    ${resourcesXml}
  </Resources>
</Project>`;
}

export function importFromMSProjectXML(xmlString: string): { tasks: Task[]; projectName?: string } {
  if (xmlString.length > LIMITS.MAX_FILE_BYTES) throw new Error('El archivo XML supera el tamaño máximo permitido.');
  // Sin DTD ni entidades: evita expansión de entidades ("billion laughs") y XXE en cualquier parser.
  if (/<!DOCTYPE|<!ENTITY/i.test(xmlString)) throw new Error('El XML contiene una declaración DOCTYPE/ENTITY no permitida.');

  const xmlDoc = new DOMParser().parseFromString(xmlString, 'text/xml');
  if (xmlDoc.querySelector('parsererror')) throw new Error('El archivo no es un XML válido.');

  const projectName = xmlDoc.querySelector('Project > Name')?.textContent?.slice(0, LIMITS.MAX_NAME) || 'Proyecto Importado';
  const taskNodes = Array.from(xmlDoc.querySelectorAll('Project > Tasks > Task')).slice(0, LIMITS.MAX_TASKS);

  const parsedTasks: Task[] = [];
  const uidToId = new Map<string, string>();

  // Pasada 1: crear tareas y mapear UIDs
  taskNodes.forEach((node, index) => {
    const text = (tag: string) => node.querySelector(tag)?.textContent ?? '';
    const startStr = text('Start').substring(0, 10) || formatISODate(new Date());
    let finishStr = text('Finish').substring(0, 10) || addDays(startStr, 3);

    const isMilestone = text('Milestone') === '1';
    const percentComplete = parseFloat(text('PercentComplete') || '0');

    let duration = Math.max(1, diffDays(startStr, finishStr));
    if (isMilestone) {
      duration = 0;
      finishStr = startStr;
    }

    const type: TaskType = isMilestone ? 'milestone' : text('Summary') === '1' ? 'group' : 'task';
    const taskId = newId('task');
    uidToId.set(text('UID') || `${index + 1}`, taskId);

    parsedTasks.push({
      id: taskId,
      name: text('Name').trim() || `Tarea ${index + 1}`,
      startDate: startStr,
      endDate: finishStr,
      duration,
      progress: Math.min(100, Math.max(0, percentComplete)),
      type,
      priority: 'medium',
      status: percentComplete === 100 ? 'done' : percentComplete > 0 ? 'in_progress' : 'todo',
      dependencies: [],
      notes: text('Notes'),
      order: index,
    });
  });

  // Pasada 2: predecesoras
  taskNodes.forEach((node, index) => {
    const task = parsedTasks[index];
    node.querySelectorAll('PredecessorLink').forEach((link) => {
      const depId = uidToId.get(link.querySelector('PredecessorUID')?.textContent ?? '');
      if (depId && depId !== task.id && !task.dependencies.includes(depId)) task.dependencies.push(depId);
    });
  });

  // Validación final (fechas reales y acotadas, tope de tareas, referencias coherentes)
  return { tasks: sanitizeTasks(parsedTasks), projectName };
}
