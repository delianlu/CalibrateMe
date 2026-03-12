// =============================================================================
// ExportableChart — Wrapper that adds PNG/SVG export buttons to any chart
// =============================================================================

import React from 'react';
import { exportAsPNG, exportAsSVG } from '../utils/chartExport';

interface ExportableChartProps {
  /** Unique DOM id for the chart container */
  id: string;
  /** Used as default filename prefix */
  title: string;
  children: React.ReactNode;
}

const ExportableChart: React.FC<ExportableChartProps> = ({ id, title, children }) => {
  const filename = `calibrateme_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

  return (
    <div style={{ position: 'relative' }}>
      <div id={id}>
        {children}
      </div>
      <div className="export-btn-bar">
        <button
          className="export-btn"
          onClick={() => exportAsPNG(id, filename, 3)}
          title="Export as PNG"
          aria-label={`Export ${title} as PNG`}
        >
          PNG
        </button>
        <button
          className="export-btn"
          onClick={() => exportAsSVG(id, filename)}
          title="Export as SVG"
          aria-label={`Export ${title} as SVG`}
        >
          SVG
        </button>
      </div>
    </div>
  );
};

export default ExportableChart;
