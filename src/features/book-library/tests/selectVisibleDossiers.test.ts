import { selectVisibleDossiers } from '../utils/selectVisibleDossiers'
import { type DossierResume } from '../../../brain'

/** Minimal readable-dossier fixture — only the fields selectVisibleDossiers reads. */
function lisible(id: string, titre: string, updatedAt: string): DossierResume {
	return { id, lisible: true, titre, updatedAt }
}

/** Minimal unreadable-dossier fixture — the branch that carries no `titre`. */
function illisible(id: string): DossierResume {
	return { id, lisible: false }
}

describe('selectVisibleDossiers', () => {
	const alpha = lisible('alpha', 'Alpha', '2026-01-01T00:00:00Z')
	const zebra = lisible('zebra', 'Zebra', '2026-03-01T00:00:00Z')
	const brise = illisible('brise')
	// Pre-ordered as DossierService.list() would already deliver it: illisibles first.
	const dossiers = [brise, zebra, alpha]

	it('returns everything (illisible pinned first, recent order) for an empty or whitespace query', () => {
		expect(selectVisibleDossiers(dossiers, '', 'recent')).toEqual([brise, zebra, alpha])
		expect(selectVisibleDossiers(dossiers, '   ', 'recent')).toEqual([brise, zebra, alpha])
	})

	it('filters by a case-insensitive title substring, never dropping an illisible dossier', () => {
		expect(selectVisibleDossiers(dossiers, 'ZEB', 'recent')).toEqual([brise, zebra])
		expect(selectVisibleDossiers(dossiers, 'xyz', 'recent')).toEqual([brise])
	})

	it('orders the readable subset by most-recently-modified (recent) or title (alpha); illisible always first', () => {
		expect(selectVisibleDossiers(dossiers, '', 'recent')).toEqual([brise, zebra, alpha])
		expect(selectVisibleDossiers(dossiers, '', 'alpha')).toEqual([brise, alpha, zebra])
	})

	it('breaks an updatedAt tie by keeping the order already set by the service (stable sort)', () => {
		const memeInstant = '2026-08-06T10:00:00.000Z'
		const beta = lisible('beta', 'Bêta', memeInstant)
		const gamma = lisible('gamma', 'Gamma', memeInstant)
		// Pre-ordered by id, as DossierService.list() would already have tie-broken them.
		expect(selectVisibleDossiers([beta, gamma], '', 'recent')).toEqual([beta, gamma])
	})

	it('returns an empty list for an empty input', () => {
		expect(selectVisibleDossiers([], '', 'recent')).toEqual([])
		expect(selectVisibleDossiers([], 'quoi que ce soit', 'alpha')).toEqual([])
	})

	it('never mutates the input snapshot (sorts a copy)', () => {
		const input = [brise, zebra, alpha]
		const before = [...input]
		selectVisibleDossiers(input, '', 'alpha')
		expect(input).toEqual(before)
	})
})
