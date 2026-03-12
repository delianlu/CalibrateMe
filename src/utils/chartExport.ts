// =============================================================================
// Chart Export Utilities — PNG and SVG export from DOM elements
// Uses SVG serialization (no external dependencies)
// =============================================================================

/**
 * Export a DOM element containing an SVG chart as a PNG file.
 * Serializes the SVG, draws it to a canvas at the specified scale, then downloads.
 */
export function exportAsPNG(elementId: string, filename: string, scale: number = 2): void {
  const container = document.getElementById(elementId);
  if (!container) return;

  const svgElement = container.querySelector('svg');
  if (!svgElement) {
    // Fallback: use html2canvas-like approach via foreignObject
    exportDomAsPNG(container, filename, scale);
    return;
  }

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  inlineStyles(svgElement, clonedSvg);

  const bbox = svgElement.getBoundingClientRect();
  clonedSvg.setAttribute('width', String(bbox.width));
  clonedSvg.setAttribute('height', String(bbox.height));

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const canvas = document.createElement('canvas');
  canvas.width = bbox.width * scale;
  canvas.height = bbox.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      triggerDownload(blob, ensureExtension(filename, '.png'));
    }, 'image/png');
  };
  img.src = url;
}

/**
 * Export a DOM element containing an SVG chart as an SVG file.
 * Inlines computed styles so the SVG is self-contained.
 */
export function exportAsSVG(elementId: string, filename: string): void {
  const container = document.getElementById(elementId);
  if (!container) return;

  const svgElement = container.querySelector('svg');
  if (!svgElement) return;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  inlineStyles(svgElement, clonedSvg);

  const bbox = svgElement.getBoundingClientRect();
  clonedSvg.setAttribute('width', String(bbox.width));
  clonedSvg.setAttribute('height', String(bbox.height));
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const serializer = new XMLSerializer();
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clonedSvg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, ensureExtension(filename, '.svg'));
}

/**
 * Fallback PNG export for non-SVG content (tables, etc.)
 * Uses foreignObject to render HTML into SVG, then to canvas.
 */
function exportDomAsPNG(element: HTMLElement, filename: string, scale: number): void {
  const bbox = element.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = bbox.width * scale;
  canvas.height = bbox.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', String(bbox.width));
  svg.setAttribute('height', String(bbox.height));

  const foreignObject = document.createElementNS(svgNS, 'foreignObject');
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');

  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  foreignObject.appendChild(clone);
  svg.appendChild(foreignObject);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      triggerDownload(blob, ensureExtension(filename, '.png'));
    }, 'image/png');
  };
  img.src = url;
}

/**
 * Recursively inline computed styles from source to cloned element.
 */
function inlineStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source);
  const importantProps = [
    'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity',
    'font-family', 'font-size', 'font-weight', 'text-anchor',
    'dominant-baseline', 'color', 'visibility', 'display',
  ];

  for (const prop of importantProps) {
    const value = computed.getPropertyValue(prop);
    if (value) {
      (target as SVGElement | HTMLElement).style?.setProperty(prop, value);
    }
  }

  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i++) {
    inlineStyles(sourceChildren[i], targetChildren[i]);
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ensureExtension(filename: string, ext: string): string {
  return filename.endsWith(ext) ? filename : filename + ext;
}
