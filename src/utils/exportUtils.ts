import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  includeSidebar: boolean;
  quality?: number;
  filename?: string;
  themeMode?: 'dark' | 'light';
}

/**
 * Helper to convert any modern CSS color (like oklch) into standard rgb/rgba
 * using a canvas 2D context which natively resolves the color.
 */
function convertColorToRgb(color: string): string {
  if (!color || !color.includes('oklch')) return color;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = color;
      return ctx.fillStyle; // Browser returns rgb(...) or #hex
    }
  } catch (e) {
    // fallback
  }
  return '#6366f1';
}

/**
 * Sanitizes an element and all style tags inside a cloned document to remove
 * or convert unsupported modern CSS functions (like oklch) before html2canvas parses them.
 */
function sanitizeClonedDocumentForHtml2Canvas(clonedDoc: Document): void {
  const oklchRegex = /oklch\([^)]+\)/gi;

  // 1. Replace oklch in all <style> tag contents
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleEl) => {
    if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
      styleEl.textContent = styleEl.textContent.replace(oklchRegex, (match) => {
        return convertColorToRgb(match);
      });
    }
  });

  // 2. Remove external linked stylesheets that might contain raw oklch,
  // or inline their safe converted rules
  const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
  linkTags.forEach((link) => {
    // Avoid cross-origin stylesheet parsing crashes
    link.setAttribute('crossorigin', 'anonymous');
  });

  // 3. Clean up computed inline styles on all cloned nodes
  const allElements = clonedDoc.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const styleAttr = htmlEl.getAttribute('style');
    if (styleAttr && styleAttr.includes('oklch')) {
      htmlEl.setAttribute('style', styleAttr.replace(oklchRegex, (m) => convertColorToRgb(m)));
    }
  });
}

/**
 * Direct SVG-to-Canvas rasterizer for pure Gantt chart exports
 * bypasses html2canvas completely for 100% precision and speed.
 */
async function rasterizeSvgToCanvas(
  svgElement: SVGSVGElement,
  scale: number = 2,
  bgColor: string = '#0d1117'
): Promise<HTMLCanvasElement> {
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const width = parseFloat(svgElement.getAttribute('width') || String(svgElement.clientWidth || 1200));
  const height = parseFloat(svgElement.getAttribute('height') || String(svgElement.clientHeight || 800));

  svgClone.setAttribute('width', String(width));
  svgClone.setAttribute('height', String(height));

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Error rasterizando el elemento SVG'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(url);
  return canvas;
}

export async function exportGanttView(
  containerElement: HTMLElement,
  svgElement: SVGSVGElement | null,
  options: ExportOptions
): Promise<void> {
  const filename = options.filename || `KronoGantt_${new Date().toISOString().substring(0, 10)}`;
  const bgColor = options.themeMode === 'light' ? '#FFFFFF' : '#0B0F17';

  // 1. Export as Native SVG
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

  // 2. Export as PNG / JPG / PDF
  let canvas: HTMLCanvasElement;

  if (!options.includeSidebar && svgElement) {
    // Pure Gantt chart export via direct SVG rasterizer (crisp, zero oklch issues)
    canvas = await rasterizeSvgToCanvas(svgElement, 2, bgColor);
  } else {
    // Full view export via html2canvas with oklch sanitizer
    canvas = await html2canvas(containerElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        sanitizeClonedDocumentForHtml2Canvas(clonedDoc);
      },
    });
  }

  // Output formatting
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
