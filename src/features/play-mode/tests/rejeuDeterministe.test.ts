/**
 * moteur-fins it4 — tests pur (sans DOM) de déterminisme des graines
 *
 * Critères couverts :
 *  CA2 — même graine = même pool de création (rollCreationPool)
 *  CA2 — graine différente = pool de création différent (anti-vacuité)
 *  KR-304 — graine_alea immutable
 *  KR-304 — dossier immutable (structuredClone before/after)
 *  KR-304 — Math.random = zéro appel
 */

import { ouvrirSession, creerRng, fixerHeros, type Dossier, createBrain } from '../../../brain'
import { rollCreationPool } from '../../../player/engine/charCreation'

const HEROS_TEST = {
	name: 'Aldric',
	caracs: { FO: 12, AG: 10, DX: 10, EN: 10, IN: 10, IG: 10, SE: 10, CA: 10 } as Record<string, number>,
	pvMax: 20,
	pv: 20,
	peMax: 10,
	pe: 10,
	mcBonus: 0,
	xp: 0,
}

describe('rejeuDeterministe', () => {
	let dossier: Dossier

	beforeEach(() => {
		const brain = createBrain()
		const seme = brain.dossiers.create('Test rejeu')
		dossier = {
			...brain.dossiers.get(seme.id)!,
			charpente: {
				...brain.dossiers.get(seme.id)!.charpente,
				depart: { ...brain.dossiers.get(seme.id)!.charpente.depart, texte_ouverture_joueur: 'Vous entrez...' },
			},
		}
	})

	it('même graine = même pool de création du héros', () => {
		const graine = 12345

		const rng1 = creerRng(graine, 'heros', 0)
		const pool1 = rollCreationPool(rng1)

		const rng2 = creerRng(graine, 'heros', 0)
		const pool2 = rollCreationPool(rng2)

		expect(pool1).toEqual(pool2)
		expect(pool1.rolls.length).toBe(8)
		expect(pool1.bonusPool).toBeGreaterThanOrEqual(1)
	})

	it('graine différente = pool de création différent (anti-vacuité)', () => {
		const graine1 = 111
		const graine2 = 222

		const pool1 = rollCreationPool(creerRng(graine1, 'heros', 0))
		const pool2 = rollCreationPool(creerRng(graine2, 'heros', 0))

		expect(pool1).not.toEqual(pool2)
	})

	it("graine_alea inchangée de l'ouverture à la fin", () => {
		const graine = 42
		const ouverture = ouvrirSession(dossier, { graine_alea: graine })
		expect(ouverture.ok).toBe(true)
		if (!ouverture.ok) return

		expect(ouverture.session.graine_alea).toBe(graine)
		const session = fixerHeros(ouverture.session, HEROS_TEST)
		expect(session.graine_alea).toBe(graine)
	})

	it('dossier immutable après ouvrirSession + fixerHeros', () => {
		const graine = 99
		const avant = JSON.parse(JSON.stringify(dossier))

		const ouverture = ouvrirSession(dossier, { graine_alea: graine })
		expect(ouverture.ok).toBe(true)
		if (!ouverture.ok) return
		fixerHeros(ouverture.session, HEROS_TEST)

		expect(dossier).toEqual(avant)
	})

	it('Math.random = zéro appel pendant ouvrirSession + fixerHeros', () => {
		const graine = 55
		const randomSpy = jest.spyOn(Math, 'random')

		try {
			const ouverture = ouvrirSession(dossier, { graine_alea: graine })
			expect(ouverture.ok).toBe(true)
			if (!ouverture.ok) return

			fixerHeros(ouverture.session, HEROS_TEST)

			expect(randomSpy).not.toHaveBeenCalled()
		} finally {
			randomSpy.mockRestore()
		}
	})
})
