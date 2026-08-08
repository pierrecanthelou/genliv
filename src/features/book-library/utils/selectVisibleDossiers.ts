import { type DossierResume } from '../../../brain'

/** Sort order for the library grid — applies only to the readable subset. */
export type SortMode = 'recent' | 'alpha'

/**
 * The grid's visible-dossiers derivation: filter the live list by a search
 * query (case-insensitive title match — an unreadable dossier has no title,
 * so text search never removes it from the results), then order the readable
 * subset ('recent' = most-recently-modified first, 'alpha' = title A→Z,
 * French collation). Unreadable dossiers stay exactly where
 * DossierService.list() already pinned them (illisibles first): they are
 * never re-sorted here, only readable entries move under the toggle.
 *
 * Never mutates the input: the snapshot from useDossiers is the cached
 * useSyncExternalStore reference, so every step below works off a COPY
 * (KR-013/020/071).
 */
export function selectVisibleDossiers(dossiers: DossierResume[], query: string, sort: SortMode): DossierResume[] {
	const needle = query.trim().toLowerCase()
	const filtered =
		needle === '' ? dossiers : dossiers.filter((d) => !d.lisible || d.titre.toLowerCase().includes(needle))

	const illisibles = filtered.filter((d) => !d.lisible)
	const lisibles = filtered.filter((d): d is Extract<DossierResume, { lisible: true }> => d.lisible)
	const sortedLisibles = [...lisibles].sort((a, b) =>
		sort === 'alpha' ? a.titre.localeCompare(b.titre, 'fr') : b.updatedAt.localeCompare(a.updatedAt),
	)

	return [...illisibles, ...sortedLisibles]
}
