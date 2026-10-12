import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  includeSidebar: boolean;
  quality?: number;
  filename?: string;
  themeMode?: 'dark' | 'light';
}

/**
 * Direct SVG-to-Canvas rasterizer for pure Gantt chart exports.
 * 100% native vector drawing into Canvas 2D, zero CSS parser dependencies.
 */
async function rasterizeSvgToCanvas(
  svgElement: SVGSVGElement,
  scale: number = 2,
  bgColor: string = '#0d1117'
): Promise<HTMLCanvasElement> {
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const width = parseFloat(svgElement.getAttribute('width') || String(svgElement.clientWidth || 1400));
  const height = parseFloat(svgElement.getAttribute('height') || String(svgElement.clientHeight || 800));

  svgClone.setAttribute('width', String(width));
  svgClone.setAttribute('height', String(height));

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Error rasterizando el SVG del cronograma'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(url);
  return canvas;
}

/**
 * Captures an HTML element to an HTML5 Canvas using html-to-image.
 * html-to-image uses browser-native SVG foreignObject and natively supports oklch, flexbox, and modern CSS.
 */
async function captureElementToCanvas(
  element: HTMLElement,
  scale: number = 2,
  bgColor: string = '#0d1117'
): Promise<HTMLCanvasElement> {
  const canvas = await htmlToImage.toCanvas(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    skipAutoScale: false,
    cacheBust: true,
    filter: (node) => {
      // Exclude modals, toasts, or scrollbar handles if they shouldn't appear
      if (node instanceof HTMLElement) {
        if (
          node.classList.contains('fixed') ||
          node.classList.contains('z-50') ||
          node.getAttribute('role') === 'dialog'
        ) {
          return false;
        }
      }
      return true;
    },
  });

  return canvas;
}

export async function exportGanttView(
  containerElement: HTMLElement,
  svgElement: SVGSVGElement | null,
  options: ExportOptions
): Promise<void> {
  const filename = options.filename || `KronoGantt_${new Date().toISOString().substring(0, 10)}`;
  const bgColor = options.themeMode === 'light' ? '#FFFFFF' : '#0B0F17';

  // 1. Native Vector SVG Export
  if (options.format === 'svg') {
    if (!svgElement) {
      throw new Error('No se encontró el elemento SVG para la exportación.');
    }
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

  // 2. High Resolution Image / PDF Export
  let canvas: HTMLCanvasElement;

  if (!options.includeSidebar && svgElement) {
    // Pure Gantt chart export via direct native SVG rasterizer
    canvas = await rasterizeSvgToCanvas(svgElement, 2, bgColor);
  } else {
    // Gantt + Task Table export via html-to-image (native foreignObject, 100% oklch compatible)
    // Find the main workspace container if containerElement is the entire page
    const workspaceElement =
      containerElement.querySelector('main') || containerElement;

    canvas = await captureElementToCanvas(workspaceElement as HTMLElement, 2, bgColor);
  }

  // 3. Format Output
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
