import React, { useState } from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import { readExcelFile, convertMappedDataToTasks, ColumnMapping, ExcelPreviewData } from '../../utils/excelUtils';
import { importFromMSProjectXML } from '../../utils/msProjectUtils';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
} from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { resources, importTasks, settings } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  const [activeTab, setActiveTab] = useState<'excel' | 'msproject'>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelPreviewData | null>(null);
  const [replaceAll, setReplaceAll] = useState(true);

  // Column mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    startDate: '',
    endDate: '',
    duration: '',
    progress: '',
    status: '',
    priority: '',
    assignee: '',
    budget: '',
  });

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const fileName = uploadedFile.name.toLowerCase();

      if (fileName.endsWith('.xml')) {
        // MS Project XML file
        setActiveTab('msproject');
        const text = await uploadedFile.text();
        const { tasks: importedTasks, projectName } = importFromMSProjectXML(text);
        if (importedTasks.length === 0) {
          throw new Error('No se encontraron tareas válidas en el archivo XML de MS Project.');
        }
        importTasks(importedTasks, replaceAll);
        onClose();
        return;
      }

      // Excel or CSV
      setActiveTab('excel');
      const data = await readExcelFile(uploadedFile);
      setExcelData(data);

      // Smart auto-detect mapping based on header strings
      const newMapping: ColumnMapping = { name: '', startDate: '', endDate: '' };
      data.headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('nom') || lower.includes('task') || lower.includes('tarea') || lower.includes('title')) {
          if (!newMapping.name) newMapping.name = h;
        } else if (lower.includes('ini') || lower.includes('start') || lower.includes('desde')) {
          if (!newMapping.startDate) newMapping.startDate = h;
        } else if (lower.includes('fin') || lower.includes('end') || lower.includes('hasta')) {
          if (!newMapping.endDate) newMapping.endDate = h;
        } else if (lower.includes('dur') || lower.includes('dias') || lower.includes('days')) {
          if (!newMapping.duration) newMapping.duration = h;
        } else if (lower.includes('prog') || lower.includes('complet') || lower.includes('%')) {
          if (!newMapping.progress) newMapping.progress = h;
        } else if (lower.includes('est') || lower.includes('stat')) {
          if (!newMapping.status) newMapping.status = h;
        } else if (lower.includes('prio')) {
          if (!newMapping.priority) newMapping.priority = h;
        } else if (lower.includes('resp') || lower.includes('asig') || lower.includes('owner')) {
          if (!newMapping.assignee) newMapping.assignee = h;
        } else if (lower.includes('pres') || lower.includes('budg') || lower.includes('cost')) {
          if (!newMapping.budget) newMapping.budget = h;
        }
      });

      // Defaults if not matched
      if (!newMapping.name && data.headers[0]) newMapping.name = data.headers[0];
      if (!newMapping.startDate && data.headers[1]) newMapping.startDate = data.headers[1];
      if (!newMapping.endDate && data.headers[2]) newMapping.endDate = data.headers[2];

      setMapping(newMapping);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el archivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExcelImport = () => {
    if (!excelData || !mapping.name) return;
    try {
      const tasks = convertMappedDataToTasks(excelData.rows, mapping, resources);
      importTasks(tasks, replaceAll);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al generar las tareas.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Importar Datos al Diagrama</h2>
              <p className="text-xs text-neutral-400">
                Soporta Microsoft Project XML, Excel (.xlsx) y archivos CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Dropzone if no file selected yet */}
          {!excelData && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-white/5 transition-all"
              style={{ borderColor: theme.colors.borderLight }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls,.csv,.xml';
                input.onchange = (e: any) => {
                  if (e.target.files[0]) handleFileUpload(e.target.files[0]);
                };
                input.click();
              }}
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Arrastra tu archivo aquí o haz clic para seleccionarlo
              </h4>
              <p className="text-xs text-neutral-400 max-w-md mb-4">
                Archivos compatibles: Microsoft Project XML (.xml), libros de Excel (.xlsx, .xls) o CSV con separadores estándar.
              </p>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel / CSV
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" /> MS Project XML
                </span>
              </div>
            </div>
          )}

          {/* Smart Column Mapping View for Excel */}
          {excelData && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.colors.border }}>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Mapeo Inteligente de Columnas
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Archivo: {file?.name} ({excelData.totalRows} filas detectadas)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExcelData(null);
                    setFile(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Column Selectors Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    * Nombre de Tarea
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-neutral-900 text-xs text-white"
                    style={{ borderColor: theme.colors.borderLight }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {excelData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    * Fecha de Inicio
                  </label>
                  <select
                    value={mapping.startDate}
                    onChange={(e) => setMapping({ ...mapping, startDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-neutral-900 text-xs text-white"
                    style={{ borderColor: theme.colors.borderLight }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {excelData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    Fecha de Fin (o Duración)
                  </label>
                  <select
                    value={mapping.endDate}
                    onChange={(e) => setMapping({ ...mapping, endDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-neutral-900 text-xs text-white"
                    style={{ borderColor: theme.colors.borderLight }}
                  >
                    <option value="">-- Automático por duración --</option>
                    {excelData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Progreso (%)</label>
                  <select
                    value={mapping.progress || ''}
                    onChange={(e) => setMapping({ ...mapping, progress: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-neutral-900 text-xs text-white"
                    style={{ borderColor: theme.colors.borderLight }}
                  >
                    <option value="">-- Opcional --</option>
                    {excelData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Responsable</label>
                  <select
                    value={mapping.assignee || ''}
                    onChange={(e) => setMapping({ ...mapping, assignee: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-neutral-900 text-xs text-white"
                    style={{ borderColor: theme.colors.borderLight }}
                  >
                    <option value="">-- Opcional --</option>
                    {excelData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Presupuesto (€)</label>
                  <select
                    value={mapping.budget || ''}
                    onChange={(e) => setMapping({ ...mapping, budget: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-neutral-900 text-xs text-white"
                    style={{ borderColor: theme.colors.borderLight }}
                  >
                    <option value="">-- Opcional --</option>
                    {excelData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample Preview Table */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-neutral-400">
                  Vista Previa de Filas (primeras {Math.min(5, excelData.rows.length)}):
                </span>
                <div className="border rounded-xl overflow-x-auto max-h-36" style={{ borderColor: theme.colors.border }}>
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-black/40 text-neutral-400 font-semibold border-b" style={{ borderColor: theme.colors.border }}>
                      <tr>
                        {excelData.headers.slice(0, 5).map((h) => (
                          <th key={h} className="px-3 py-1.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {excelData.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          {excelData.headers.slice(0, 5).map((h) => (
                            <td key={h} className="px-3 py-1 truncate max-w-[150px]">
                              {String(row[h] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mode switch: replace or append */}
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={replaceAll}
                    onChange={() => setReplaceAll(true)}
                  />
                  <span>Reemplazar todas las tareas actuales</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!replaceAll}
                    onChange={() => setReplaceAll(false)}
                  />
                  <span>Añadir al final del proyecto existente</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t shrink-0"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bgHeader }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Cancelar
          </button>
          {excelData && (
            <button
              onClick={handleConfirmExcelImport}
              disabled={!mapping.name || !mapping.startDate}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              <span>Importar Tareas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
