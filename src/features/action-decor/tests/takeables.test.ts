import { takeablesOf, blankTakeable, TAKEABLE_KINDS } from '../utils/takeables'
import type { DecorConfig } from '../../../brain'

describe('takeablesOf (décor object migration)', () => {
	it('returns the objects list when present', () => {
		const decor: DecorConfig = {
			interaction: 'prendre',
			objects: [{ object: { id: 'o1', name: 'Clé', description: '' }, kind: 'utile' }],
		}
		expect(takeablesOf(decor)).toHaveLength(1)
		expect(takeablesOf(decor)[0].object.name).toBe('Clé')
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
		expect(takeablesOf(decor).map((t) => t.object.id)).toEqual(['o1'])
	})

	it('returns an empty list when no object is authored', () => {
		expect(takeablesOf({ interaction: 'prendre' })).toEqual([])
	})
})

describe('blankTakeable', () => {
	it('mints a fresh object id and defaults to « utile »', () => {
		const a = blankTakeable()
		const b = blankTakeable()
		expect(a.object.id).not.toBe(b.object.id) // collision-free (KR-003)
		expect(a.kind).toBe('utile')
		expect(a.object.name).toBe('')
	})
})

describe('TAKEABLE_KINDS registry (KR-117)', () => {
	it('uses non-semantic tones (réussite/échec colours reserved, KR-091)', () => {
		expect(TAKEABLE_KINDS.utile.tone).not.toBe('good')
		expect(TAKEABLE_KINDS.leurre.tone).not.toBe('bad')
	})
})
