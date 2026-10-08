import React, { useState } from 'react';
import { useGanttStore } from '../../store/useGanttStore';
import { getTheme } from '../../utils/themeUtils';
import { exportGanttView, ExportOptions } from '../../utils/exportUtils';
import { exportToMSProjectXML } from '../../utils/msProjectUtils';
import { exportTasksToExcel } from '../../utils/excelUtils';
import {
  X,
  Download,
  FileImage,
  FileText,
  FileCode,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, containerRef, svgRef }) => {
  const { tasks, resources, settings } = useGanttStore();
  const theme = getTheme(settings.colorMode, settings.themePalette);

  const [format, setFormat] = useState<'png' | 'pdf' | 'svg' | 'msproject' | 'excel' | 'jpg'>('png');
  const [includeSidebar, setIncludeSidebar] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setSuccessMessage(null);

    try {
      if (format === 'msproject') {
        const xml = exportToMSProjectXML(tasks, resources, 'KronoGantt Plan');
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KronoGantt_MSProject_${new Date().toISOString().substring(0, 10)}.xml`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccessMessage('¡Archivo XML de MS Project exportado con éxito!');
        setIsExporting(false);
        return;
      }

      if (format === 'excel') {
        exportTasksToExcel(tasks, resources, `KronoGantt_Plan_${new Date().toISOString().substring(0, 10)}.xlsx`);
        setSuccessMessage('¡Libro Excel exportado con éxito!');
        setIsExporting(false);
        return;
      }

      // Visual exports (PNG, JPG, SVG, PDF)
      const targetElement = includeSidebar
        ? containerRef.current
        : (containerRef.current?.querySelector('.gantt-chart-area') as HTMLElement) || containerRef.current;

      if (!targetElement) {
        throw new Error('No se pudo localizar el contenedor para la exportación.');
      }

      const options: ExportOptions = {
        format: format === 'jpg' ? 'jpg' : format === 'svg' ? 'svg' : format === 'pdf' ? 'pdf' : 'png',
        includeSidebar,
        quality: 0.98,
        filename: `KronoGantt_${new Date().toISOString().substring(0, 10)}`,
        themeMode: settings.colorMode,
      };

      await exportGanttView(targetElement, svgRef.current, options);
      setSuccessMessage(`¡Exportación a ${format.toUpperCase()} completada!`);
    } catch (err: any) {
      alert(`Error durante la exportación: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const EXPORT_FORMATS = [
    {
      id: 'png',
      name: 'Imagen PNG (Alta Resolución 2x)',
      desc: 'Ideal para informes, presentaciones y compartir por chat',
      icon: <FileImage className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'pdf',
      name: 'Documento PDF Apaisado',
      desc: 'Formato vectorial para imprimir o anexar a documentación ejecutiva',
      icon: <FileText className="w-5 h-5 text-red-400" />,
    },
    {
      id: 'svg',
      name: 'Vector SVG Nativo',
      desc: 'Escalable sin pérdida de calidad para Illustrator o Figma',
      icon: <FileCode className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'msproject',
      name: 'Microsoft Project XML (.xml)',
      desc: 'Interoperabilidad total con MS Project, Primavera y Smartsheet',
      icon: <FileCode className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'excel',
      name: 'Libro Excel (.xlsx)',
      desc: 'Hoja de cálculo estructurada con tareas, costes, fechas y responsables',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Exportación de Alta Fidelidad</h2>
              <p className="text-xs text-neutral-400">
                Guarda tu diagrama en formatos estándar profesionales
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
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Format selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Selecciona el Formato de Salida
            </label>
            <div className="space-y-2">
              {EXPORT_FORMATS.map((f) => {
                const isSelected = format === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="shrink-0">{f.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">{f.name}</div>
                      <div className="text-[11px] text-neutral-400">{f.desc}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-blue-400 bg-blue-400' : 'border-neutral-500'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options */}
          {(format === 'png' || format === 'pdf' || format === 'svg') && (
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: theme.colors.border }}>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                Composición de la Exportación
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={includeSidebar}
                    onChange={() => setIncludeSidebar(true)}
                  />
                  <span>Diagrama Gantt completo + Panel de Tareas lateral (Recomendado)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={!includeSidebar}
                    onChange={() => setIncludeSidebar(false)}
                  />
                  <span>Solo el cronograma gráfico (Diagrama de barras únicamente)</span>
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
            Cerrar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exportar Ahora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
