import { useState, useEffect } from 'react';
import { useVocabulary } from '../hooks/useVocabulary';
import VocabularyCard from './VocabularyCard';
import TagFilter from './TagFilter';
import ImportModal from './ImportModal';
import ExportModal from './ExportModal';
import { essentialEnglish } from '../../../data/vocabularyPacks/essential-english';
import { academicEnglish } from '../../../data/vocabularyPacks/academic-english';
import { businessEnglish } from '../../../data/vocabularyPacks/business-english';

const ALL_PACKS = [essentialEnglish, academicEnglish, businessEnglish];

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

  // Auto-load all built-in packs on mount
  useEffect(() => {
    for (const pack of ALL_PACKS) {
      loadPack(pack);
    }
  }, [loadPack]);

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
          <p className="vocab-list__empty">No items match your filters.</p>
        ) : (
          filteredItems.map(item => (
            <VocabularyCard key={item.id} item={item} onDelete={deleteItem} />
          ))
        )}
      </div>

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
