import { VocabularyFilter } from '../types';

interface TagFilterProps {
  allTags: string[];
  filter: VocabularyFilter;
  onUpdate: (partial: Partial<VocabularyFilter>) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export default function TagFilter({
  allTags,
  filter,
  onUpdate,
  onReset,
  totalCount,
  filteredCount,
}: TagFilterProps) {
  return (
    <div className="tag-filter">
      {/* Search */}
      <input
        className="tag-filter__search"
        type="text"
        placeholder="Search words or translations..."
        value={filter.search}
        onChange={e => onUpdate({ search: e.target.value })}
      />

      <div className="tag-filter__row">
        {/* Difficulty filter */}
        <select
          className="tag-filter__select"
          value={filter.difficulty}
          onChange={e =>
            onUpdate({ difficulty: e.target.value as VocabularyFilter['difficulty'] })
          }
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Tag chips */}
        <div className="tag-filter__tags">
          {allTags.slice(0, 20).map(tag => {
            const active = filter.tags.includes(tag);
            return (
              <button
                key={tag}
                className={`tag-filter__chip ${active ? 'tag-filter__chip--active' : ''}`}
                onClick={() => {
                  const next = active
                    ? filter.tags.filter(t => t !== tag)
                    : [...filter.tags, tag];
                  onUpdate({ tags: next });
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count + reset */}
      <div className="tag-filter__footer">
        <span className="tag-filter__count">
          {filteredCount} / {totalCount} items
        </span>
        {(filter.search || filter.tags.length > 0 || filter.difficulty !== 'all') && (
          <button className="btn btn-secondary tag-filter__reset" onClick={onReset}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
