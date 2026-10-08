import { Task, Resource, TaskPriority, TaskStatus, TaskType } from '../types/gantt';
import { addDays, diffDays, formatISODate } from './dateUtils';

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
    const outlineLevel = task.parentId ? 2 : 1;

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
      <Name><![CDATA[${task.name}]]></Name>
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
      <OutlineLevel>${outlineLevel}</OutlineLevel>
      <Notes><![CDATA[${task.notes || ''}]]></Notes>
      ${predecessorsXml}
    </Task>`;
  });

  let resourcesXml = '';
  resources.forEach((r, idx) => {
    resourcesXml += `
    <Resource>
      <UID>${idx + 1}</UID>
      <ID>${idx + 1}</ID>
      <Name><![CDATA[${r.name}]]></Name>
      <Type>1</Type>
      <StandardRate>${r.hourlyRate}</StandardRate>
      <StandardRateFormat>2</StandardRateFormat>
    </Resource>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${projectName}</Name>
  <Title>${projectName}</Title>
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
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const projectName = xmlDoc.querySelector('Project > Name')?.textContent || 'Proyecto Importado';
  const taskNodes = xmlDoc.querySelectorAll('Project > Tasks > Task');

  const parsedTasks: Task[] = [];
  const uidToId = new Map<string, string>();

  // Pass 1: Create tasks and map UIDs
  taskNodes.forEach((node, index) => {
    const uid = node.querySelector('UID')?.textContent || `${index + 1}`;
    const name = node.querySelector('Name')?.textContent?.trim() || `Tarea ${index + 1}`;
    const startStr = node.querySelector('Start')?.textContent?.substring(0, 10) || formatISODate(new Date());
    let finishStr = node.querySelector('Finish')?.textContent?.substring(0, 10) || addDays(startStr, 3);

    const isMilestone = node.querySelector('Milestone')?.textContent === '1';
    const isSummary = node.querySelector('Summary')?.textContent === '1';
    const percentComplete = parseFloat(node.querySelector('PercentComplete')?.textContent || '0');
    const outlineLevel = parseInt(node.querySelector('OutlineLevel')?.textContent || '1', 10);
    const notes = node.querySelector('Notes')?.textContent || '';

    let duration = Math.max(1, diffDays(startStr, finishStr));
    if (isMilestone) {
      duration = 0;
      finishStr = startStr;
    }

    let type: TaskType = 'task';
    if (isMilestone) type = 'milestone';
    else if (isSummary) type = 'group';

    const taskId = `task-${Date.now()}-${index}`;
    uidToId.set(uid, taskId);

    parsedTasks.push({
      id: taskId,
      name,
      startDate: startStr,
      endDate: finishStr,
      duration,
      progress: Math.min(100, Math.max(0, percentComplete)),
      type,
      priority: 'medium',
      status: percentComplete === 100 ? 'done' : percentComplete > 0 ? 'in_progress' : 'todo',
      dependencies: [],
      notes,
      order: index,
    });
  });

  // Pass 2: Map predecessors (dependencies)
  taskNodes.forEach((node, index) => {
    const task = parsedTasks[index];
    if (!task) return;

    const predLinks = node.querySelectorAll('PredecessorLink');
    predLinks.forEach((link) => {
      const predUid = link.querySelector('PredecessorUID')?.textContent;
      if (predUid && uidToId.has(predUid)) {
        const depId = uidToId.get(predUid)!;
        if (depId !== task.id && !task.dependencies.includes(depId)) {
          task.dependencies.push(depId);
        }
      }
    });
  });

  return { tasks: parsedTasks, projectName };
}
