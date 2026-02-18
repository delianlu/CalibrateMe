import { useState, useRef } from 'react';

interface ImportModalProps {
  onImportFile: (file: File) => Promise<number>;
  onImportText: (text: string, filename: string) => number;
  onClose: () => void;
}

export default function ImportModal({ onImportFile, onImportText, onClose }: ImportModalProps) {
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const count = await onImportFile(file);
      setStatus(`Imported ${count} items from ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    try {
      setError(null);
      const count = onImportText(pasteText, 'pasted.csv');
      setStatus(`Imported ${count} items`);
      setPasteText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Import Vocabulary</h3>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal__tabs">
          <button
            className={`modal__tab ${mode === 'file' ? 'modal__tab--active' : ''}`}
            onClick={() => setMode('file')}
          >
            Upload File
          </button>
          <button
            className={`modal__tab ${mode === 'paste' ? 'modal__tab--active' : ''}`}
            onClick={() => setMode('paste')}
          >
            Paste Text
          </button>
        </div>

        <div className="modal__body">
          {mode === 'file' ? (
            <div className="import-file">
              <p className="import-file__hint">
                Supported formats: CSV, JSON, Anki (tab-separated)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,.txt,.tsv"
                className="import-file__input"
              />
              <button className="btn btn-primary" onClick={handleFile}>
                Import File
              </button>
            </div>
          ) : (
            <div className="import-paste">
              <p className="import-paste__hint">
                Paste CSV (word,translation,difficulty,tags) or tab-separated text:
              </p>
              <textarea
                className="import-paste__textarea"
                rows={8}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={'apple,elma,0.2,food;noun\nbook,kitap,0.2,object;noun'}
              />
              <button className="btn btn-primary" onClick={handlePaste}>
                Import Text
              </button>
            </div>
          )}

          {status && <p className="import-status import-status--success">{status}</p>}
          {error && <p className="import-status import-status--error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
