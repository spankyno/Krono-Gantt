import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  includeSidebar: boolean;
  quality?: number;
  filename?: string;
  themeMode?: 'dark' | 'light';
}

export async function exportGanttView(
  containerElement: HTMLElement,
  svgElement: SVGSVGElement | null,
  options: ExportOptions
): Promise<void> {
  const filename = options.filename || `KronoGantt_${new Date().toISOString().substring(0, 10)}`;

  if (options.format === 'svg') {
    if (!svgElement) {
      throw new Error('No se encontró el elemento SVG para la exportación.');
    }
    // Clone SVG and prepare for standalone download
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // PNG / JPG / PDF
  // We capture the target element
  const canvas = await html2canvas(containerElement, {
    scale: 2, // High DPI resolution
    useCORS: true,
    allowTaint: true,
    backgroundColor: options.themeMode === 'light' ? '#FFFFFF' : '#0B0F17',
    logging: false,
    scrollX: 0,
    scrollY: 0,
  });

  if (options.format === 'png' || options.format === 'jpg') {
    const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, options.quality || 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.${options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  if (options.format === 'pdf') {
    const imgData = canvas.toDataURL('image/png');
    // Calculate landscape orientation dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [imgWidth, imgHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
  }
}
