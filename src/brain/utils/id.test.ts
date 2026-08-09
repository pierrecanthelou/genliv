import { createId, randomToken } from './id'

/**
 * L'ENTROPIE et son EMBALLAGE, éprouvés séparément — c'est tout l'objet de
 * l'extraction de `randomToken` : `createId` emballe (`prefix_…`), et l'identifiant
 * de dossier, lui, ne peut PAS être emballé (le `_` est refusé par la forme d'un
 * identifiant de dossier, qui devient une clé de stockage telle quelle). Les deux
 * appelants partagent donc la source d'entropie et rien d'autre.
 */

/** La forme que les DEUX branches de `randomToken` doivent respecter. */
const FORME_TOKEN = /^[a-z0-9-]+$/

/** Combien de tirages : assez pour qu'une source constante se voie immédiatement. */
const TIRAGES = 50

/**
 * Exécute une action avec `crypto.randomUUID` NEUTRALISÉ, puis rétablit
 * exactement l'état d'avant — que la fonction ait été une propriété propre (le
 * polyfill de `jest.setup.cjs`) ou héritée du prototype de jsdom.
 *
 * Sans ce dispositif, la branche de repli de `randomToken` ne serait jamais
 * exercée : l'environnement de test a toujours `randomUUID`. C'est pourtant elle
 * qui frappe les identifiants sur un navigateur sans `crypto.randomUUID`, et un
 * identifiant mal formé y serait refusé par le validateur à la relecture.
 */
function sansRandomUUID<T>(action: () => T): T {
	const porteur = globalThis.crypto as { randomUUID?: unknown }
	const descripteur = Object.getOwnPropertyDescriptor(porteur, 'randomUUID')
	Object.defineProperty(porteur, 'randomUUID', { value: undefined, configurable: true, writable: true })
	try {
		return action()
	} finally {
		if (descripteur === undefined) delete porteur.randomUUID
		else Object.defineProperty(porteur, 'randomUUID', descripteur)
	}
}

function tirer(combien: number, tirage: () => string): string[] {
	return Array.from({ length: combien }, tirage)
}

describe('randomToken', () => {
	it('rend une forme conforme et distincte, avec crypto.randomUUID', () => {
		const tokens = tirer(TIRAGES, randomToken)

		expect(new Set(tokens).size).toBe(TIRAGES)
		for (const token of tokens) {
			expect(token).toMatch(FORME_TOKEN)
			// Le `_` est ce qui distingue un identifiant d'entité d'un identifiant de
			// dossier : sa présence ici casserait `DossierService.create()`.
			expect(token).not.toContain('_')
		}
	})

	it('reste conforme et distinct sans crypto.randomUUID', () => {
		const tokens = sansRandomUUID(() => tirer(TIRAGES, randomToken))

		// DISCRIMINANT : le repli concatène DEUX base 36 (un seul tiret) là où un UUID
		// en compte quatre. Sans cette ligne, ce test mesurerait la branche
		// `crypto.randomUUID` en croyant mesurer l'autre, et le jour où la
		// neutralisation cesserait de fonctionner, personne ne le verrait.
		expect(tokens.every((token) => token.split('-').length === 2)).toBe(true)
		expect(new Set(tokens).size).toBe(TIRAGES)
		for (const token of tokens) {
			expect(token).toMatch(FORME_TOKEN)
			expect(token).not.toContain('_')
		}
	})

	it('retablit crypto.randomUUID apres la neutralisation', () => {
		// Discriminant du dispositif ci-dessus : sans ce rétablissement, tout test
		// exécuté ensuite dans ce fichier mesurerait la branche de repli en croyant
		// mesurer l'autre.
		sansRandomUUID(() => randomToken())

		expect(typeof globalThis.crypto.randomUUID).toBe('function')
	})
})

describe('createId', () => {
	it('emballe le token derriere un prefixe separe par un souligne', () => {
		// Régression : la sortie de `createId` ne change pas d'un caractère avec
		// l'extraction de `randomToken` — six appelants la stockent déjà (`BookService`,
		// `MonsterLibraryService`).
		expect(createId('book')).toMatch(/^book_[a-z0-9-]+$/)
		expect(createId('node')).toMatch(/^node_[a-z0-9-]+$/)
	})

	it('retombe sur le prefixe id quand aucun n est fourni', () => {
		expect(createId()).toMatch(/^id_[a-z0-9-]+$/)
	})

	it('rend des identifiants distincts', () => {
		expect(new Set(tirer(TIRAGES, () => createId('node'))).size).toBe(TIRAGES)
	})
})
