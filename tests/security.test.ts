import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTimelineHeader, MAX_TIMELINE_DAYS, isValidISODate } from '../src/utils/dateUtils';
import { LIMITS, sanitizeBaselines, sanitizeSettings, sanitizeTasks } from '../src/utils/sanitize';
import { exportToMSProjectXML, importFromMSProjectXML } from '../src/utils/msProjectUtils';

const base = { id: 'a', name: 'x', startDate: '2026-10-01', endDate: '2026-10-05', duration: 4 };

test('fechas fuera de ventana o inexistentes se rechazan', () => {
  for (const d of ['9999-12-31', '1970-01-01', '2026-02-31', '', 'hoy', 20261001, null]) assert.equal(isValidISODate(d), false);
  assert.equal(isValidISODate('2026-10-14'), true);
});

test('una tarea con fecha 9999-12-31 se normaliza y el timeline queda acotado', () => {
  const [t] = sanitizeTasks([{ ...base, endDate: '9999-12-31', duration: 5 }]);
  assert.ok(t.endDate <= '2100-12-31');
  const h = generateTimelineHeader(new Date('2026-10-01'), new Date('9999-12-31'), 'day', 38);
  assert.equal(h.daysCount, MAX_TIMELINE_DAYS);
});

test('enums, colores y números se validan', () => {
  const [t] = sanitizeTasks([{ ...base, status: 'x', priority: {}, type: 'z', color: 'red;}</style>', progress: 5000, budget: -5, notes: 'n'.repeat(99999) }]);
  assert.equal(t.status, 'todo'); assert.equal(t.priority, 'medium'); assert.equal(t.type, 'task');
  assert.equal(t.color, undefined); assert.equal(t.progress, 100); assert.equal(t.budget, 0);
  assert.equal(t.notes!.length, LIMITS.MAX_NOTES);
});

test('ids duplicados/peligrosos y referencias rotas se corrigen', () => {
  const ts = sanitizeTasks([{ ...base, id: '__proto__' }, { ...base, id: 'b', dependencies: ['b', 'ghost', 'b'], parentId: 'ghost' }, { ...base, id: 'b' }]);
  assert.equal(new Set(ts.map((t) => t.id)).size, 3);
  assert.notEqual(ts[0].id, '__proto__');
  assert.deepEqual(ts[1].dependencies, []); assert.equal(ts[1].parentId, null);
});

test('tope de tareas', () => {
  assert.equal(sanitizeTasks(Array.from({ length: 9000 }, (_, i) => ({ ...base, id: `t${i}` }))).length, LIMITS.MAX_TASKS);
});

test('baselines: sin contaminación de prototipo', () => {
  const raw = JSON.parse('[{"id":"b1","name":"n","tasks":{"__proto__":{"startDate":"2026-01-01","endDate":"2026-01-02"},"ok":{"startDate":"2026-01-01","endDate":"2026-01-02"}}}]');
  const [b] = sanitizeBaselines(raw);
  assert.deepEqual(Object.keys(b.tasks), ['ok']);
  assert.equal(({} as any).startDate, undefined);
  assert.equal((b.tasks as any).constructor, undefined);
});

test('settings: solo claves y valores conocidos', () => {
  const d = sanitizeSettings({}, { viewMode: 'day', columnWidth: 38, rowHeight: 44, showGhostMode: true, activeBaselineId: null, showDependencies: true, showNonWorkingDays: true, nonWorkingDays: [0, 6], snapToGrid: true, themePalette: 'neon', colorMode: 'dark', fontFamily: 'Inter', showCostColumns: true, showLegend: true, gridWidth: 540 });
  const s = sanitizeSettings({ fontFamily: 'x}body{display:none', columnWidth: 1e9, viewMode: 'evil', evil: 1 }, d);
  assert.equal(s.fontFamily, 'Inter'); assert.equal(s.columnWidth, 120); assert.equal(s.viewMode, 'day');
  assert.equal('evil' in s, false);
});

test('XML: nombres hostiles quedan escapados (sin inyección de nodos)', () => {
  const [t] = sanitizeTasks([{ ...base, name: 'A]]><Task><Name>inyectada</Name></Task>&"\'<' }]);
  const xml = exportToMSProjectXML([t], [], 'P & <Q>');
  assert.equal((xml.match(/<Task>/g) || []).length, 1);
  assert.ok(!xml.includes('CDATA') && !xml.includes('<Name>inyectada'));
  assert.ok(xml.includes('&lt;Task&gt;') && xml.includes('P &amp; &lt;Q&gt;'));
});

test('XML: DOCTYPE/ENTITY rechazado', () => {
  assert.throws(() => importFromMSProjectXML('<!DOCTYPE x [<!ENTITY a "b">]><Project/>'), /DOCTYPE/);
});
