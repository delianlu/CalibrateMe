// =============================================================================
// Vocabulary Service — CRUD operations for vocabulary items
// =============================================================================

import { QuizItem } from '../../quiz/types';
import { VocabularyPack, VocabularyFilter } from '../types';

/**
 * In-memory vocabulary store with CRUD, filtering, and pack management.
 */
export class VocabularyService {
  private items: Map<string, QuizItem> = new Map();
  private packs: Map<string, VocabularyPack> = new Map();

  /** Load a vocabulary pack, merging items into the store. */
  loadPack(pack: VocabularyPack): void {
    this.packs.set(pack.id, pack);
    for (const item of pack.items) {
      this.items.set(item.id, item);
    }
  }

  /** Remove a pack and its items (unless shared with another pack). */
  removePack(packId: string): void {
    const pack = this.packs.get(packId);
    if (!pack) return;

    const otherPackItemIds = new Set<string>();
    for (const [id, p] of this.packs) {
      if (id !== packId) {
        for (const item of p.items) otherPackItemIds.add(item.id);
      }
    }

    for (const item of pack.items) {
      if (!otherPackItemIds.has(item.id)) {
        this.items.delete(item.id);
      }
    }
    this.packs.delete(packId);
  }

  /** Get all loaded packs. */
  getPacks(): VocabularyPack[] {
    return Array.from(this.packs.values());
  }

  /** Get a single item by ID. */
  getItem(id: string): QuizItem | undefined {
    return this.items.get(id);
  }

  /** Add or update a single item. */
  upsertItem(item: QuizItem): void {
    this.items.set(item.id, item);
  }

  /** Delete a single item. */
  deleteItem(id: string): void {
    this.items.delete(id);
    // Also remove from packs
    for (const pack of this.packs.values()) {
      pack.items = pack.items.filter(i => i.id !== id);
    }
  }

  /** Get all items as an array. */
  getAllItems(): QuizItem[] {
    return Array.from(this.items.values());
  }

  /** Get all unique tags across all items. */
  getAllTags(): string[] {
    const tags = new Set<string>();
    for (const item of this.items.values()) {
      for (const tag of item.tags) tags.add(tag);
    }
    return Array.from(tags).sort();
  }

  /** Filter items based on criteria. */
  filterItems(filter: VocabularyFilter): QuizItem[] {
    let results = this.getAllItems();

    // Search by word or translation
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        i =>
          i.word.toLowerCase().includes(q) ||
          i.translation.toLowerCase().includes(q)
      );
    }

    // Filter by tags (AND logic — item must have all selected tags)
    if (filter.tags.length > 0) {
      results = results.filter(i =>
        filter.tags.every(t => i.tags.includes(t))
      );
    }

    // Filter by difficulty band
    if (filter.difficulty !== 'all') {
      results = results.filter(i => {
        if (filter.difficulty === 'easy') return i.difficulty < 0.4;
        if (filter.difficulty === 'medium') return i.difficulty >= 0.4 && i.difficulty < 0.65;
        if (filter.difficulty === 'hard') return i.difficulty >= 0.65;
        return true;
      });
    }

    return results;
  }

  /** Total item count. */
  getItemCount(): number {
    return this.items.size;
  }
}
