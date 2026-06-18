import { type Book } from '../../../brain'

/** Sort order for the library grid. */
export type SortMode = 'recent' | 'alpha'

/**
 * The grid's visible-books derivation: filter the live list by a search query
 * (case-insensitive title match), then order it ('recent' = most-recently
 * modified first, 'alpha' = title A→Z, French collation). Pure and view-agnostic
 * so the rule is tested once and the component stays declarative.
 *
 * Never mutates the input: the snapshot from useBooks is the cached
 * useSyncExternalStore reference, so we sort a COPY (KR-013/020/071).
 */
export function selectVisibleBooks(books: Book[], query: string, sort: SortMode): Book[] {
	const needle = query.trim().toLowerCase()
	const filtered = needle === '' ? books : books.filter((b) => b.title.toLowerCase().includes(needle))
	return [...filtered].sort((a, b) =>
		sort === 'alpha' ? a.title.localeCompare(b.title, 'fr') : b.updatedAt.localeCompare(a.updatedAt),
	)
}
