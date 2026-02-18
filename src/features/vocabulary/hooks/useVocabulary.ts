import { useState, useCallback, useRef, useMemo } from 'react';
import { QuizItem } from '../../quiz/types';
import { VocabularyPack, VocabularyFilter } from '../types';
import { VocabularyService } from '../services/vocabularyService';
import { importVocabulary, detectFormat } from '../services/importService';
import { exportVocabulary, downloadExport } from '../services/exportService';
import { ExportFormat } from '../types';

const DEFAULT_FILTER: VocabularyFilter = {
  search: '',
  tags: [],
  difficulty: 'all',
  mastery: 'all',
};

/**
 * Hook for managing vocabulary state — loading packs, CRUD, filtering,
 * import/export.
 */
export function useVocabulary() {
  const serviceRef = useRef(new VocabularyService());
  const [revision, setRevision] = useState(0); // bump to trigger re-render
  const [filter, setFilter] = useState<VocabularyFilter>(DEFAULT_FILTER);

  const bump = useCallback(() => setRevision(r => r + 1), []);

  // ── Pack management ────────────────────────────────────────────────
  const loadPack = useCallback((pack: VocabularyPack) => {
    serviceRef.current.loadPack(pack);
    bump();
  }, [bump]);

  const removePack = useCallback((packId: string) => {
    serviceRef.current.removePack(packId);
    bump();
  }, [bump]);

  // ── CRUD ───────────────────────────────────────────────────────────
  const addItem = useCallback((item: QuizItem) => {
    serviceRef.current.upsertItem(item);
    bump();
  }, [bump]);

  const updateItem = useCallback((item: QuizItem) => {
    serviceRef.current.upsertItem(item);
    bump();
  }, [bump]);

  const deleteItem = useCallback((id: string) => {
    serviceRef.current.deleteItem(id);
    bump();
  }, [bump]);

  // ── Filtering ──────────────────────────────────────────────────────
  const updateFilter = useCallback((partial: Partial<VocabularyFilter>) => {
    setFilter(prev => ({ ...prev, ...partial }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  // ── Import ─────────────────────────────────────────────────────────
  const importFromFile = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const format = detectFormat(file.name, text);
          const items = importVocabulary(text, format);
          for (const item of items) {
            serviceRef.current.upsertItem(item);
          }
          bump();
          resolve(items.length);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }, [bump]);

  const importFromText = useCallback((text: string, filename: string): number => {
    const format = detectFormat(filename, text);
    const items = importVocabulary(text, format);
    for (const item of items) {
      serviceRef.current.upsertItem(item);
    }
    bump();
    return items.length;
  }, [bump]);

  // ── Export ─────────────────────────────────────────────────────────
  const exportItems = useCallback((format: ExportFormat, filename?: string) => {
    const items = serviceRef.current.filterItems(filter);
    const content = exportVocabulary(items, format);
    const ext = format === 'json' ? 'json' : format === 'anki' ? 'txt' : 'csv';
    downloadExport(content, filename ?? `vocabulary.${ext}`);
  }, [filter]);

  // ── Derived state ──────────────────────────────────────────────────
  const allItems = useMemo(
    () => serviceRef.current.getAllItems(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision]
  );

  const filteredItems = useMemo(
    () => serviceRef.current.filterItems(filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision, filter]
  );

  const allTags = useMemo(
    () => serviceRef.current.getAllTags(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision]
  );

  const packs = useMemo(
    () => serviceRef.current.getPacks(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision]
  );

  const totalCount = allItems.length;

  return {
    // State
    allItems,
    filteredItems,
    allTags,
    packs,
    filter,
    totalCount,

    // Pack management
    loadPack,
    removePack,

    // CRUD
    addItem,
    updateItem,
    deleteItem,

    // Filtering
    updateFilter,
    resetFilter,

    // Import / Export
    importFromFile,
    importFromText,
    exportItems,
  };
}
