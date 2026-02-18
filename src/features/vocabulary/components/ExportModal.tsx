import { useState } from 'react';
import { ExportFormat } from '../types';

interface ExportModalProps {
  itemCount: number;
  onExport: (format: ExportFormat, filename?: string) => void;
  onClose: () => void;
}

export default function ExportModal({ itemCount, onExport, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');

  const ext = format === 'json' ? 'json' : format === 'anki' ? 'txt' : 'csv';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Export Vocabulary</h3>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal__body">
          <p>Export {itemCount} items (filtered) in your preferred format:</p>

          <div className="export-options">
            <label className="export-option">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
              />
              <span className="export-option__label">
                <strong>CSV</strong> — Spreadsheet-compatible
              </span>
            </label>

            <label className="export-option">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
              />
              <span className="export-option__label">
                <strong>JSON</strong> — Full data with metadata
              </span>
            </label>

            <label className="export-option">
              <input
                type="radio"
                name="format"
                value="anki"
                checked={format === 'anki'}
                onChange={() => setFormat('anki')}
              />
              <span className="export-option__label">
                <strong>Anki</strong> — Tab-separated for Anki import
              </span>
            </label>
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={() => onExport(format, `vocabulary.${ext}`)}
          >
            Download as .{ext}
          </button>
        </div>
      </div>
    </div>
  );
}
