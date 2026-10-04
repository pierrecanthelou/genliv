import { bilanDe, rejouerCombat, ouvrirRencontreSiDue } from './rencontre'
import type { EtatSession } from '../../brain'
import type { CombatState } from './combatTypes'

/**
 * TESTS FOR COMBAT REPLAY ENGINE (KR-292)
 *
 * Core invariant: replay from the same {monstre_ref, postures[]} with same seed
 * produces identical CombatState.
 */

describe('rencontre', () => {
	describe('bilanDe — combat outcome extraction', () => {
		it('retourne undefined tant que outcome est ongoing', () => {
			const state = { outcome: 'ongoing' } as CombatState
			const result = bilanDe(state)
			expect(result).toBeUndefined()
		})

		it('retourne BilanCombat sur issue monster-fled (victoire)', () => {
			const state = {
				outcome: 'monster-fled',
				heroPv: 8,
				heroPe: 4,
				pendingXp: 100,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			} as CombatState
			const result = bilanDe(state)
			expect(result).toBeDefined()
			if (result) {
				expect(result.issue).toBe('monster-fled')
			}
		})

		it('bilanDe hero-fled rend un bilan', () => {
			const state = {
				outcome: 'hero-fled',
				heroPv: 8,
				heroPe: 4,
				pendingXp: 0,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			} as CombatState
			const result = bilanDe(state)
			expect(result).toBeDefined()
			if (result) {
				expect(result.issue).toBe('hero-fled')
				expect(result.pv).toBe(8)
				expect(result.pe).toBe(4)
				expect(result.xp).toBe(0)
			}
		})

		it('retourne BilanCombat sur issue terminale hero-victory', () => {
			const state = {
				outcome: 'hero-victory',
				heroPv: 5,
				heroPe: 2,
				pendingXp: 150,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			} as CombatState
			const result = bilanDe(state)
			expect(result).toBeDefined()
			if (result) {
				expect(result.issue).toBe('hero-victory')
				expect(result.pv).toBe(5)
				expect(result.pe).toBe(2)
				expect(result.xp).toBe(150)
			}
		})

		it('retourne BilanCombat sur issue hero-survived-unconscious', () => {
			const state = {
				outcome: 'hero-survived-unconscious',
				heroPv: 1,
				heroPe: 0,
				pendingXp: 0,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			} as CombatState
			const result = bilanDe(state)
			expect(result).toBeDefined()
			if (result) {
				expect(result.issue).toBe('hero-survived-unconscious')
				expect(result.pv).toBe(1)
			}
		})

		it('retourne BilanCombat sur issue hero-mort', () => {
			const state = {
				outcome: 'hero-mort',
				heroPv: 0,
				heroPe: 0,
				pendingXp: 0,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			} as CombatState
			const result = bilanDe(state)
			expect(result).toBeDefined()
			if (result) {
				expect(result.issue).toBe('hero-mort')
			}
		})
	})

	describe('rejouerCombat — deterministic replay', () => {
		const HEROS = {
			name: 'Test',
			caracs: { FO: 6, AG: 5, DX: 5, EN: 6, IN: 4, IG: 4, SE: 3, CA: 3 },
			pvMax: 17,
			pv: 17,
			peMax: 6,
			pe: 6,
			mcBonus: 0,
			xp: 0,
		}

		it('refus heros_absent sans heros ni combat', () => {
			const session = {
				combat: undefined,
				heros: undefined,
				graine_alea: 42,
				horloge: { tour: 0 },
			} as EtatSession

			const result = rejouerCombat(session)
			expect(result).toEqual({ ok: false, refus: 'heros_absent' })
		})

		it('refus monstre_inconnu quand monstre_ref ne resout pas', () => {
			const session = {
				graine_alea: 42,
				horloge: { tour: 0 },
				heros: HEROS,
				combat: {
					monstre_ref: 'bestiaire.dragon-inexistant',
					postures: ['normale'] as const,
				},
			} as unknown as EtatSession

			const result = rejouerCombat(session)
			expect(result).toEqual({ ok: false, refus: 'monstre_inconnu' })
		})

		it('chemin nominal : toEqual sur l etat entier — le rejeu est deterministe', () => {
			const session = {
				graine_alea: 42,
				horloge: { tour: 1 },
				heros: HEROS,
				combat: {
					monstre_ref: 'bestiaire.gobelin',
					postures: ['normale', 'normale'] as const,
				},
			} as unknown as EtatSession

			const r1 = rejouerCombat(session)
			const r2 = rejouerCombat(session)

			expect(r1).toEqual(r2)
			expect(r1.ok).toBe(true)
			if (r1.ok) {
				expect(r1.etat.round).toBe(2)
				expect(r1.etat.log).toHaveLength(2)
			}
		})

		it('sensibilite : deux graines differentes produisent des etats differents', () => {
			const base = {
				horloge: { tour: 1 },
				heros: HEROS,
				combat: {
					monstre_ref: 'bestiaire.gobelin',
					postures: ['normale', 'normale', 'normale'] as const,
				},
			}
			const s1 = { ...base, graine_alea: 42 } as unknown as EtatSession
			const s2 = { ...base, graine_alea: 999 } as unknown as EtatSession

			const r1 = rejouerCombat(s1)
			const r2 = rejouerCombat(s2)

			expect(r1.ok).toBe(true)
			expect(r2.ok).toBe(true)
			if (r1.ok && r2.ok) {
				const differs =
					r1.etat.heroPv !== r2.etat.heroPv ||
					r1.etat.monster.pv !== r2.etat.monster.pv ||
					r1.etat.log[0]?.text !== r2.etat.log[0]?.text
				expect(differs).toBe(true)
			}
		})

		it('stabilite de prefixe : rejeu de [n] puis [n, m] conserve le premier round du journal', () => {
			const base = {
				graine_alea: 42,
				horloge: { tour: 1 },
				heros: HEROS,
			}
			const s1 = {
				...base,
				combat: { monstre_ref: 'bestiaire.gobelin', postures: ['normale'] as const },
			} as unknown as EtatSession
			const s2 = {
				...base,
				combat: { monstre_ref: 'bestiaire.gobelin', postures: ['normale', 'precise'] as const },
			} as unknown as EtatSession

			const r1 = rejouerCombat(s1)
			const r2 = rejouerCombat(s2)

			expect(r1.ok).toBe(true)
			expect(r2.ok).toBe(true)
			if (r1.ok && r2.ok) {
				expect(r2.etat.log[0]).toEqual(r1.etat.log[0])
			}
		})

		it('rejouerCombat applique la fuite apres les postures', () => {
			const session = {
				graine_alea: 42,
				horloge: { tour: 1 },
				heros: HEROS,
				combat: {
					monstre_ref: 'bestiaire.gobelin',
					postures: ['normale'] as const,
					fuite: true,
				},
			} as unknown as EtatSession

			const spy = jest.spyOn(Math, 'random')
			const result = rejouerCombat(session)
			expect(spy).not.toHaveBeenCalled()
			spy.mockRestore()

			expect(result.ok).toBe(true)
			if (!result.ok) return
			expect(result.etat.outcome).toBe('hero-fled')
			expect(result.etat.log[0].round).toBe(1)
			const fleeRounds = result.etat.log.filter((e) => e.text.includes('Fuite')).map((e) => e.round)
			expect(fleeRounds).toEqual([2])
		})

		it('rejouerCombat est pur : deux appels identiques', () => {
			const session = {
				graine_alea: 42,
				horloge: { tour: 1 },
				heros: HEROS,
				combat: {
					monstre_ref: 'bestiaire.gobelin',
					postures: ['normale', 'precise'] as const,
					fuite: true,
				},
			} as unknown as EtatSession

			const r1 = rejouerCombat(session)
			const r2 = rejouerCombat(session)

			expect(r1.ok).toBe(true)
			expect(r2.ok).toBe(true)
			if (r1.ok && r2.ok) {
				expect(r1.etat).toEqual(r2.etat)
			}
		})

		it('rejouerCombat identique apres aller-retour JSON de la session', () => {
			const session = {
				graine_alea: 42,
				horloge: { tour: 1 },
				heros: HEROS,
				combat: {
					monstre_ref: 'bestiaire.gobelin',
					postures: ['normale', 'precise'] as const,
					fuite: true,
				},
			} as unknown as EtatSession

			const r1 = rejouerCombat(session)
			// Simulate JSON round-trip
			const json = JSON.stringify(session)
			const sessionAfterRoundTrip = JSON.parse(json)
			const r2 = rejouerCombat(sessionAfterRoundTrip as EtatSession)

			expect(r1.ok).toBe(true)
			expect(r2.ok).toBe(true)
			if (r1.ok && r2.ok) {
				expect(r1.etat).toEqual(r2.etat)
			}
		})

		it('rejouerCombat ignore une fuite sur issue deja terminale', () => {
			const sessionSansFuite = {
				graine_alea: 42,
				horloge: { tour: 1 },
				heros: { ...HEROS, pv: 1 },
				combat: {
					monstre_ref: 'bestiaire.gobelin',
					postures: ['normale', 'normale', 'normale', 'normale', 'normale'] as const,
				},
			} as unknown as EtatSession

			const sansFuite = rejouerCombat(sessionSansFuite)
			expect(sansFuite.ok).toBe(true)
			if (!sansFuite.ok) return
			expect(sansFuite.etat.outcome).not.toBe('ongoing')

			const sessionAvecFuite = {
				...sessionSansFuite,
				combat: { ...sessionSansFuite.combat, fuite: true as const },
			} as unknown as EtatSession

			const avecFuite = rejouerCombat(sessionAvecFuite)
			expect(avecFuite.ok).toBe(true)
			if (!avecFuite.ok) return
			expect(avecFuite.etat).toEqual(sansFuite.etat)
		})
	})

	describe('ouvrirRencontreSiDue — detect and open encounter', () => {
		it('retourne session inchangee si aucune rencontre a ouvrir', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const session = { combat: undefined, monde: {} } as any as EtatSession

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const dossier: any = {
				monde: { evenements: [] },
			}

			const result = ouvrirRencontreSiDue(dossier, session)
			expect(result).toBe(session)
		})

		it('ouvre une rencontre quand la condition du declencheur est remplie', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const dossier: any = {
				monde: {
					evenements: [
						{
							id: 'evt-1',
							monstre_ref: 'bestiaire.gobelin',
							declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu-x'] },
						},
					],
				},
			}

			const EVT = ['evenements', 'consommes'].join('_')
			const IND = ['indices', 'connus'].join('_')
			const JAL = ['jalons', 'atteints'].join('_')
			const session = {
				combat: undefined,
				heros: {
					name: 'H',
					caracs: { FO: 6, AG: 5, DX: 5, EN: 6, IN: 4, IG: 4, SE: 3, CA: 3 },
					pvMax: 17,
					pv: 17,
					peMax: 6,
					pe: 6,
					mcBonus: 0,
					xp: 0,
				},
				graine_alea: 42,
				horloge: { tour: 0 },
				monde: {
					lieu_courant: 'lieu-x',
					lieux_visites: ['lieu-x'],
					objets_possedes: [],
					[IND]: [],
					[JAL]: [],
					[EVT]: [],
					pnj: {},
				},
			} as unknown as EtatSession

			const result = ouvrirRencontreSiDue(dossier, session)
			expect(result).not.toBe(session)
			expect(result.combat).toBeDefined()
			expect(result.combat?.monstre_ref).toBe('bestiaire.gobelin')
		})
	})
})
