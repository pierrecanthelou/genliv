import type { EtatPnj } from './faits'

/**
 * `EtatPnj.confiance` — LE CONTRAT DE TYPE (n° 12 `moteur-acteurs`, it3, lot
 * `contrat`). `faits.ts` ne contient AUCUNE LOGIQUE (sa propre docstring de
 * tête) : ce fichier ne garde donc que la FORME — `a_dit` REQUIS (inchangé),
 * `confiance?` OPTIONNEL À VIE (KR-251). Les replis de LECTURE
 * (`CONFIANCE_DEPART`) et la SATURATION vivent ailleurs, chacun sa propre
 * porte : `session.ts` (`crediterConfiance`, écriture) et `revelation.ts`
 * (`portesOuvertes`, lecture de la règle) — ce fichier-ci ne les duplique pas.
 *
 * `@ts-expect-error` ÉCHOUE À LA COMPILATION si l'erreur attendue n'a PAS lieu :
 * seul instrument qui épingle une exigence ou un refus DE TYPE, précédent
 * `sessionCouverture.test.ts`.
 */
describe('EtatPnj.confiance — optionnelle a vie, jamais plus large qu un nombre', () => {
	it('a_dit seul compile (etat legal avant ce lot) ; confiance numerique compile ; confiance mal typee ne compile pas', () => {
		const sansConfiance: EtatPnj = { a_dit: ['indice.sceau-brise'] }
		const avecConfiance: EtatPnj = { a_dit: [], confiance: 2 }
		// @ts-expect-error — `confiance` n'est jamais une chaîne.
		const confianceChaine: EtatPnj = { a_dit: [], confiance: '2' }

		// Discriminant : les formes LÉGALES compilent, elles — sans cette moitié, la
		// directive serait satisfaite par n'importe quelle erreur de type, y compris
		// « ce type n'existe pas ».
		expect([sansConfiance, avecConfiance, confianceChaine]).toHaveLength(3)
	})
})
