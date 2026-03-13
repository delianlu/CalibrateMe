import { useState, useEffect, useMemo } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVocabulary } from '../hooks/useVocabulary';
import VocabularyCard from './VocabularyCard';
import TagFilter from './TagFilter';
import ImportModal from './ImportModal';
import ExportModal from './ExportModal';
import { essentialEnglish } from '../../../data/vocabularyPacks/essential-english';
import { academicEnglish } from '../../../data/vocabularyPacks/academic-english';
import { businessEnglish } from '../../../data/vocabularyPacks/business-english';

const ALL_PACKS = [essentialEnglish, academicEnglish, businessEnglish];
const PAGE_SIZE = 24;

export default function VocabularyList() {
  const {
    filteredItems,
    allTags,
    packs,
    filter,
    totalCount,
    loadPack,
    removePack,
    deleteItem,
    updateFilter,
    resetFilter,
    importFromFile,
    importFromText,
    exportItems,
  } = useVocabulary();

  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [page, setPage] = useState(0);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filter]);

  // Auto-load all built-in packs on mount
  useEffect(() => {
    for (const pack of ALL_PACKS) {
      loadPack(pack);
    }
  }, [loadPack]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(
    () => filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredItems, page]
  );

  return (
    <div className="vocab-list">
      <div className="vocab-list__header">
        <h2>Vocabulary</h2>
        <div className="vocab-list__actions">
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            Import
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowExport(true)}
            disabled={filteredItems.length === 0}
          >
            Export
          </button>
        </div>
      </div>

      {/* Pack toggles */}
      <div className="vocab-list__packs">
        {ALL_PACKS.map(pack => {
          const loaded = packs.some(p => p.id === pack.id);
          return (
            <button
              key={pack.id}
              className={`vocab-list__pack-btn ${loaded ? 'vocab-list__pack-btn--active' : ''}`}
              onClick={() => (loaded ? removePack(pack.id) : loadPack(pack))}
            >
              {pack.name}
              <span className="vocab-list__pack-count">{pack.items.length}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <TagFilter
        allTags={allTags}
        filter={filter}
        onUpdate={updateFilter}
        onReset={resetFilter}
        totalCount={totalCount}
        filteredCount={filteredItems.length}
      />

      {/* Items */}
      <div className="vocab-list__items">
        {filteredItems.length === 0 ? (
          <div className="vocab-list__empty-state">
            <div className="empty-state__icon-container">
              <BookOpen size={32} style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <h3 className="empty-state__title">No Items Found</h3>
            <p className="empty-state__desc">No vocabulary items match your current filters. Try adjusting your search or loading a word pack.</p>
          </div>
        ) : (
          pagedItems.map(item => (
            <VocabularyCard key={item.id} item={item} onDelete={deleteItem} />
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredItems.length > PAGE_SIZE && (
        <div className="vocab-list__pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="vocab-list__page-info">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showImport && (
        <ImportModal
          onImportFile={importFromFile}
          onImportText={importFromText}
          onClose={() => setShowImport(false)}
        />
      )}
      {showExport && (
        <ExportModal
          itemCount={filteredItems.length}
          onExport={exportItems}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
