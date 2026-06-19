import {
	takeablesOf,
	blankTakeable,
	refTakeable,
	isRefTakeable,
	takeableId,
	resolveTakeableObject,
	TAKEABLE_KINDS,
} from '../utils/takeables'
import type { Book, BookNode, DecorConfig, GameObject } from '../../../brain'

describe('takeablesOf (décor object migration)', () => {
	it('returns the objects list when present', () => {
		const decor: DecorConfig = {
			interaction: 'prendre',
			objects: [{ object: { id: 'o1', name: 'Clé', description: '' }, kind: 'utile' }],
		}
		expect(takeablesOf(decor)).toHaveLength(1)
		expect(takeablesOf(decor)[0].object?.name).toBe('Clé')
	})

	it('migrates the walking-skeleton single object to one « utile » takeable', () => {
		const decor: DecorConfig = { interaction: 'prendre', object: { id: 'o1', name: 'Vieux livre', description: '' } }
		const list = takeablesOf(decor)
		expect(list).toEqual([{ object: { id: 'o1', name: 'Vieux livre', description: '' }, kind: 'utile' }])
	})

	it('prefers the objects list over a legacy single object when both exist', () => {
		const decor: DecorConfig = {
			interaction: 'prendre',
			object: { id: 'legacy', name: 'Ancien', description: '' },
			objects: [{ object: { id: 'o1', name: 'Nouveau', description: '' }, kind: 'leurre' }],
		}
		expect(takeablesOf(decor).map((t) => t.object?.id)).toEqual(['o1'])
	})

	it('returns an empty list when no object is authored', () => {
		expect(takeablesOf({ interaction: 'prendre' })).toEqual([])
	})
})

describe('blankTakeable', () => {
	it('mints a fresh object id and defaults to « utile »', () => {
		const a = blankTakeable()
		const b = blankTakeable()
		expect(a.object?.id).not.toBe(b.object?.id) // collision-free (KR-003)
		expect(a.kind).toBe('utile')
		expect(a.object?.name).toBe('')
	})
})

describe('reference takeables (« prendre dans la liste », iter 3)', () => {
	const obj = (id: string, name = id): GameObject => ({ id, name, description: '' })
	function bookWith(objectOnNode: GameObject): Book {
		const node: BookNode = {
			id: 'owner',
			kind: 'choix',
			text: '',
			decor: { interaction: 'prendre', objects: [{ object: objectOnNode, kind: 'utile' }] },
		}
		return { id: 'b', title: 'B', createdAt: '', updatedAt: '', nodes: [node], edges: [] }
	}

	it('refTakeable references by id (no inline object) and reports as a ref', () => {
		const t = refTakeable('o1')
		expect(t.objectRef).toBe('o1')
		expect(t.object).toBeUndefined()
		expect(isRefTakeable(t)).toBe(true)
		expect(takeableId(t)).toBe('o1')
	})

	it('takeableId / isRefTakeable distinguish an own takeable', () => {
		const own = { object: obj('o1'), kind: 'utile' as const }
		expect(isRefTakeable(own)).toBe(false)
		expect(takeableId(own)).toBe('o1')
	})

	it('resolveTakeableObject returns the inline object, or the live catalog lookup for a ref', () => {
		const book = bookWith(obj('o1', 'Clé'))
		expect(resolveTakeableObject(book, { object: obj('o2', 'Inline'), kind: 'utile' })?.name).toBe('Inline')
		expect(resolveTakeableObject(book, refTakeable('o1'))?.name).toBe('Clé')
	})

	it('resolveTakeableObject returns null for a dangling ref (target deleted, KR-021)', () => {
		const book = bookWith(obj('o1'))
		expect(resolveTakeableObject(book, refTakeable('ghost'))).toBeNull()
	})
})

describe('TAKEABLE_KINDS registry (KR-117)', () => {
	it('uses non-semantic tones (réussite/échec colours reserved, KR-091)', () => {
		expect(TAKEABLE_KINDS.utile.tone).not.toBe('good')
		expect(TAKEABLE_KINDS.leurre.tone).not.toBe('bad')
	})
})
