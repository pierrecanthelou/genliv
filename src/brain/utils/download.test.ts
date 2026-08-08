import { downloadJson, slugifyFilename } from './download'

describe('slugifyFilename', () => {
	it('lowercases, strips accents, and hyphenates words', () => {
		expect(slugifyFilename('La Caverne Maudite')).toBe('la-caverne-maudite')
		expect(slugifyFilename('Forêt des Âmes')).toBe('foret-des-ames')
	})

	it('drops punctuation and trims leading/trailing hyphens', () => {
		expect(slugifyFilename('  « Le Donjon ! »  ')).toBe('le-donjon')
	})

	// Le repli nomme ce que le fichier contient RÉELLEMENT à la version où il est
	// livré : un dossier d'aventure, pas un livre. Assertion négative gardée
	// exprès (KR-162) — sans elle, un repli resté à « livre » passerait pour peu
	// qu'il ne soit plus asserté du tout.
	it('falls back to dossier when nothing usable remains', () => {
		expect(slugifyFilename('')).toBe('dossier')
		expect(slugifyFilename('!!!')).toBe('dossier')
		expect(slugifyFilename('')).not.toBe('livre')
	})
})

describe('downloadJson', () => {
	const realCreate = URL.createObjectURL
	const realRevoke = URL.revokeObjectURL

	afterEach(() => {
		URL.createObjectURL = realCreate
		URL.revokeObjectURL = realRevoke
		jest.restoreAllMocks()
	})

	it('builds a JSON blob, clicks an anchor with the filename, and revokes the URL', () => {
		const createObjectURL = jest.fn((_blob: Blob) => 'blob:fake')
		const revokeObjectURL = jest.fn()
		URL.createObjectURL = createObjectURL
		URL.revokeObjectURL = revokeObjectURL
		const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		downloadJson('mon-livre.jeu.json', { hello: 'world' })

		expect(createObjectURL).toHaveBeenCalledTimes(1)
		const blob = createObjectURL.mock.calls[0][0]
		expect(blob.type).toBe('application/json')
		expect(click).toHaveBeenCalledTimes(1)
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
		// The anchor is cleaned up (not left in the DOM).
		expect(document.querySelector('a[download]')).toBeNull()
	})

	it('revokes the URL even if the click throws', () => {
		URL.createObjectURL = jest.fn(() => 'blob:fake')
		const revokeObjectURL = jest.fn()
		URL.revokeObjectURL = revokeObjectURL
		jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
			throw new Error('boom')
		})

		expect(() => downloadJson('x.json', {})).toThrow('boom')
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
	})
})
