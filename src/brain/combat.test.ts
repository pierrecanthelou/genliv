/**
 * COMBAT (§ 3) — bornes de mutation (tranche B2 `outillage-2`, lot A `bornes-combat`).
 *
 * Ce fichier ne teste pas une regression : il borne des mutants Stryker survivants
 * sur `combat.ts` (rapport du 2026-09-20). Les valeurs attendues des tests sur les
 * bandes d'Ecart et sur l'egalite des AT sont relues dans `docs/REGLES-DU-JEU.md`
 * § 3, jamais dans `combat.ts` ni dans un `received` de test rouge (KR-130).
 */
import { POSTURES, ecartBand, pfBase, resolveAssault } from './combat'

/** RNG fixe (retourne toujours `v`) pour des jets deterministes. */
const fixed = (v: number) => () => v

describe('combat (paragraphe 3)', () => {
	it('posture normale : AT vaut MC moins le jet maximal', () => {
		const at = POSTURES.normale.computeAT(10, { shield: false, rng: fixed(0.999) })
		expect(at).toBe(10 - 6)
	})

	it('posture precise : AT vaut MC moins 4 au jet minimal', () => {
		const at = POSTURES.precise.computeAT(10, { shield: false, rng: fixed(0) })
		expect(typeof at).toBe('number')
		expect(at).toBe(10 - 4)
	})

	it('assaut defensif avec bouclier : AT vaut MC plus 8, aucun degat', () => {
		// MC distincts attaquant/defenseur : l'assaut ne doit pas prendre le retour
		// anticipe de l'egalite des AT (combat.ts l.110).
		const mcAttacker = 10
		const mcDefender = 5
		const result = resolveAssault(
			{ FO: 1, MC: mcAttacker, weapon: 'mains-nues', posture: 'defensive', shield: true },
			{ FO: 1, MC: mcDefender, weapon: 'mains-nues', posture: 'defensive', shield: true },
			fixed(0.999),
		)
		expect(result.atAttacker).toBe(mcAttacker + 8)
		expect(result.atDefender).toBe(mcDefender + 8)
		expect(result.damage).toBe(0)
	})

	it('pfBase multiplie par le multiplicateur, il ne divise pas', () => {
		// Arme tranchante-2m : multiplicateur 1.3 (docs/REGLES-DU-JEU.md § 3, Equipement).
		// Jamais un multiplicateur de 1 : multiplier et diviser par 1 sont indiscernables.
		expect(pfBase({ FO: 5, MC: 4, weapon: 'tranchante-2m' })).toBeCloseTo(9.1)
	})

	it('degats = PF x facteur de posture x facteur d ecart', () => {
		const result = resolveAssault(
			{ FO: 6, MC: 10, weapon: 'epee-1m', posture: 'precise' },
			{ FO: 1, MC: 1, weapon: 'mains-nues', posture: 'normale' },
			fixed(0),
		)
		// atAttaquant = 10 - 4 = 6 ; atDefenseur = 1 - 0 = 1 ; ecart = 5 -> magistral (x1.5)
		// PF = (6 + 10/2) x 1 = 11 ; degats = 11 x 2 (precise) x 1.5 (magistral) = 33
		expect(result.band).toBe('magistral')
		expect(result.damage).toBe(33)
	})

	it('ecartBand en deca de 1 rend la bande Manque', () => {
		// Source : docs/REGLES-DU-JEU.md § 3, note de borne (ajout 1, sous la table d'Ecart)
		const zero = ecartBand(0)
		expect(zero.quality).toBe('rate')
		expect(zero.label).toBe('Manqué')
		expect(zero.factor).toBe(0)

		const negative = ecartBand(-3)
		expect(negative.quality).toBe('rate')
		expect(negative.label).toBe('Manqué')
		expect(negative.factor).toBe(0)
	})

	it('ecartBand : qualite et libelle des quatre bandes', () => {
		// Source : docs/REGLES-DU-JEU.md § 3, table d'Ecart (Calcul des degats — PF)
		expect(ecartBand(1).quality).toBe('erafle')
		expect(ecartBand(1).label).toBe('Coup éraflé')

		expect(ecartBand(3).quality).toBe('franc')
		expect(ecartBand(3).label).toBe('Coup franc')

		expect(ecartBand(5).quality).toBe('magistral')
		expect(ecartBand(5).label).toBe('Coup magistral')

		expect(ecartBand(6).quality).toBe('critique')
		expect(ecartBand(6).label).toBe('Coup critique')
	})

	it('AT egales : assaut nul, aucun vainqueur, zero degat', () => {
		// Source : docs/REGLES-DU-JEU.md § 3, ajout 2 (transcrit de docs/REGLES-PLAY.md § D2)
		const result = resolveAssault(
			{ FO: 1, MC: 5, weapon: 'mains-nues', posture: 'normale' },
			{ FO: 1, MC: 5, weapon: 'mains-nues', posture: 'normale' },
			fixed(0.5),
		)
		expect(result.winner).toBe('tie')
		expect(result.ecart).toBe(0)
		expect(result.band).toBe('rate')
		expect(result.damage).toBe(0)
	})

	it('le defenseur remporte l assaut quand son AT est plus haute', () => {
		const result = resolveAssault(
			{ FO: 1, MC: 1, weapon: 'mains-nues', posture: 'normale' },
			{ FO: 1, MC: 10, weapon: 'mains-nues', posture: 'normale' },
			fixed(0),
		)
		expect(result.winner).toBe('defender')
	})
})
