import { repeter, PAS_MAX, ROUNDS_MAX, creerHerosSynthetique } from '../utils/repeter'

jest.mock('../../../brain', () => ({
	CHARACTERISTIC_VALUES: ['FO', 'AG', 'DX', 'EN', 'IN', 'IG', 'SE', 'CA'],
	controlerDossier: jest.fn(),
	creerRng: jest.fn(() => () => 0.5),
	destinationsPossibles: jest.fn(),
	executerCommande: jest.fn(),
	ouvrirSession: jest.fn(),
	fixerHeros: jest.fn(),
	jouerPosture: jest.fn((s) => s),
	cloreCombat: jest.fn((s) => s),
}))

jest.mock('../../../player/engine/charCreation', () => ({
	rollCreationPool: jest.fn(() => ({ rolls: [5, 5, 5, 5, 5, 5, 5, 5], bonusPool: 2 })),
	emptyAssignment: jest.fn(() => ({
		rollIndices: { FO: -1, AG: -1, DX: -1, EN: -1, IN: -1, IG: -1, SE: -1, CA: -1 },
		bonus: { FO: 0, AG: 0, DX: 0, EN: 0, IN: 0, IG: 0, SE: 0, CA: 0 },
	})),
	buildHeroFromCreation: jest.fn(() => ({
		name: 'Heros synthetique',
		caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 5, IG: 5, SE: 5, CA: 5 },
		pvMax: 15,
		pv: 15,
		peMax: 5,
		pe: 5,
		mcBonus: 0,
		xp: 0,
	})),
}))

jest.mock('../../../player/engine/fin', () => ({
	finAtteinte: jest.fn(),
}))

jest.mock('../../../player/engine/rencontre', () => ({
	ouvrirRencontreSiDue: jest.fn(),
	rejouerCombat: jest.fn(),
	bilanDe: jest.fn(),
}))

import {
	controlerDossier,
	creerRng,
	destinationsPossibles,
	executerCommande,
	ouvrirSession,
	fixerHeros,
	jouerPosture,
	cloreCombat,
} from '../../../brain'
import { finAtteinte } from '../../../player/engine/fin'
import { ouvrirRencontreSiDue, rejouerCombat, bilanDe } from '../../../player/engine/rencontre'

const mockControler = controlerDossier as jest.Mock
const mockOuvrir = ouvrirSession as jest.Mock
const mockFixer = fixerHeros as jest.Mock
const mockDest = destinationsPossibles as jest.Mock
const mockExec = executerCommande as jest.Mock
const mockFin = finAtteinte as jest.Mock
const mockRencontre = ouvrirRencontreSiDue as jest.Mock
const mockRng = creerRng as jest.Mock
const mockJouerPosture = jouerPosture as jest.Mock
const mockCloreCombat = cloreCombat as jest.Mock
const mockRejouerCombat = rejouerCombat as jest.Mock
const mockBilanDe = bilanDe as jest.Mock

const SENTINELLE_HEROS = Symbol('heros')

function sessionDeBase(lieu = 'lieu.a', heros?: unknown) {
	return {
		schema: 1,
		dossier_id: 'test',
		dossier_maj: '2026-01-01',
		graine_alea: 1,
		horloge: { tour: 0 },
		monde: {
			lieu_courant: lieu,
			lieux_visites: [lieu],
			objets_possedes: [] as string[],
			indices_connus: [] as string[],
			jalons_atteints: [] as string[],
			evenements_consommes: [] as string[],
			pnj: {},
		},
		journal: [],
		memoire: null,
		...(heros !== undefined ? { heros } : {}),
	}
}

const DOSSIER = { schema: 1, id: 'test' } as never

function preparerCheminHeureux() {
	const sessionSansHeros = sessionDeBase()
	const sessionAvecHeros = sessionDeBase('lieu.a', SENTINELLE_HEROS)
	mockControler.mockReturnValue({ jouable: true, controles: [] })
	mockOuvrir.mockReturnValue({ ok: true, session: sessionSansHeros })
	mockFixer.mockReturnValue(sessionAvecHeros)
	mockRng.mockReturnValue(() => 0.5)
	mockDest.mockReturnValue(['lieu.b'])
	mockExec.mockImplementation((_d: unknown, _s: unknown, cmd: { cibles: string[] }) => ({
		ok: true,
		session: sessionDeBase(cmd.cibles[0], SENTINELLE_HEROS),
	}))
	mockFin.mockReturnValue(undefined)
	mockRencontre.mockImplementation((_d: unknown, s: unknown) => s)
	return { sessionSansHeros, sessionAvecHeros }
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe('repeter', () => {
	it('fin_pas_0 — fin atteinte des l ouverture', () => {
		preparerCheminHeureux()
		mockFin.mockReturnValueOnce({ fin_id: 'fin.victoire', texte: 'Gagne' })

		const r = repeter(DOSSIER, 42)

		expect(r).toEqual({
			ok: true,
			rapport: { graine: 42, pas: 0, lieu_id: 'lieu.a', combats_traverses: 0, arret: 'fin', fin_id: 'fin.victoire' },
		})
	})

	it('fin_pas_n — fin atteinte au pas 3', () => {
		preparerCheminHeureux()
		mockFin
			.mockReturnValueOnce(undefined)
			.mockReturnValueOnce(undefined)
			.mockReturnValueOnce(undefined)
			.mockReturnValueOnce({ fin_id: 'fin.tardive' })

		const r = repeter(DOSSIER, 7)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({
				arret: 'fin',
				fin_id: 'fin.tardive',
				pas: 3,
				graine: 7,
				combats_traverses: 0,
			}),
		})
	})

	it('mort_ne_clot_pas — hero-mort ne clot pas, executerCommande ne repond pas', () => {
		preparerCheminHeureux()
		mockRencontre.mockImplementation((_d: unknown, s: Record<string, unknown>) => ({
			...s,
			combat: { monstre_ref: 'bestiaire.gobelin', postures: [] },
		}))
		mockRejouerCombat.mockReturnValue({
			ok: true,
			etat: { outcome: 'hero-mort', heroPv: 0, heroPe: 5, pendingXp: 0, pendingPvMaxDelta: 0, pendingEnMaxDelta: 0 },
		})
		mockBilanDe.mockReturnValue({
			issue: 'hero-mort',
			pv: 0,
			pe: 5,
			xp: 0,
			pv_max_delta: 0,
			pe_max_delta: 0,
		})

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({
				arret: 'mort',
				monstre_ref: 'bestiaire.gobelin',
				pas: 1,
				combats_traverses: 0,
			}),
		})
		// cloreCombat JAMAIS appelé sur mort
		expect(mockCloreCombat).not.toHaveBeenCalled()
		// executerCommande appelé 1 seule fois (le pas qui a mené au combat), pas après
		expect(mockExec).toHaveBeenCalledTimes(1)
	})

	it('combat_sans_issue — ROUNDS_MAX postures sans issue, mutant ±1 rouge', () => {
		preparerCheminHeureux()
		mockRencontre.mockImplementation((_d: unknown, s: Record<string, unknown>) => ({
			...s,
			combat: { monstre_ref: 'bestiaire.dragon', postures: [] },
		}))
		mockRejouerCombat.mockReturnValue({
			ok: true,
			etat: { outcome: 'ongoing', heroPv: 10, heroPe: 3, pendingXp: 0, pendingPvMaxDelta: 0, pendingEnMaxDelta: 0 },
		})
		mockBilanDe.mockReturnValue(undefined) // ongoing → undefined

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({
				arret: 'combat_sans_issue',
				monstre_ref: 'bestiaire.dragon',
				pas: 1,
				combats_traverses: 0,
			}),
		})
		// Vérifier que jouerPosture a été appelé exactement ROUNDS_MAX fois
		expect(ROUNDS_MAX).toBe(50)
		expect(mockJouerPosture).toHaveBeenCalledTimes(ROUNDS_MAX)
	})

	it('survie_et_suite — combat non mortel appelle cloreCombat, continue, combats_traverses +1', () => {
		preparerCheminHeureux()
		mockRencontre.mockImplementation((_d: unknown, s: Record<string, unknown>) => ({
			...s,
			combat: { monstre_ref: 'bestiaire.ork', postures: [] },
		}))
		const sessionApresCombat = sessionDeBase('lieu.b', SENTINELLE_HEROS)
		mockRejouerCombat.mockReturnValue({
			ok: true,
			etat: {
				outcome: 'hero-victory',
				heroPv: 8,
				heroPe: 2,
				pendingXp: 50,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			},
		})
		mockBilanDe.mockReturnValue({
			issue: 'hero-victory',
			pv: 8,
			pe: 2,
			xp: 50,
			pv_max_delta: 0,
			pe_max_delta: 0,
		})
		mockCloreCombat.mockImplementation((s: Record<string, unknown>) => {
			const { combat: _, ...sansCombat } = s
			return { ...sansCombat, monde: (sessionApresCombat as Record<string, unknown>).monde }
		})
		mockRencontre.mockImplementationOnce((_d: unknown, s: Record<string, unknown>) => ({
			...s,
			combat: { monstre_ref: 'bestiaire.ork', postures: [] },
		})).mockImplementation((_d: unknown, s: Record<string, unknown>) => s)
		mockFin.mockReturnValueOnce(undefined).mockReturnValueOnce({ fin_id: 'fin.x' })

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({
				arret: 'fin',
				fin_id: 'fin.x',
				combats_traverses: 1,
			}),
		})
		expect(mockCloreCombat).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ issue: 'hero-victory' }))
	})

	it('combat_puis_fin_meme_pas — finAtteinte evalué après combat résolu (KR-303)', () => {
		preparerCheminHeureux()
		mockRencontre.mockImplementation((_d: unknown, s: Record<string, unknown>) => ({
			...s,
			combat: { monstre_ref: 'bestiaire.troll', postures: [] },
		}))
		mockRejouerCombat.mockReturnValue({
			ok: true,
			etat: {
				outcome: 'hero-victory',
				heroPv: 5,
				heroPe: 1,
				pendingXp: 30,
				pendingPvMaxDelta: 0,
				pendingEnMaxDelta: 0,
			},
		})
		mockBilanDe.mockReturnValue({
			issue: 'hero-victory',
			pv: 5,
			pe: 1,
			xp: 30,
			pv_max_delta: 0,
			pe_max_delta: 0,
		})
		let combatClot = false
		mockCloreCombat.mockImplementation((s: Record<string, unknown>) => {
			combatClot = true
			const { combat: _, ...sansCombat } = s
			return sansCombat
		})
		mockFin.mockImplementation(() => {
			if (!combatClot) return undefined
			return { fin_id: 'fin.tardive' }
		})

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({ arret: 'fin', fin_id: 'fin.tardive', pas: 1 }),
		})
		expect(mockCloreCombat).toHaveBeenCalled()
		// finAtteinte never called with an open combat session
		for (const call of mockFin.mock.calls) {
			const session = call[1] as Record<string, unknown>
			expect(session.combat).toBeUndefined()
		}
	})

	it('rejeu_refuse — rejouerCombat ok:false lance une erreur', () => {
		preparerCheminHeureux()
		mockRencontre.mockImplementation((_d: unknown, s: Record<string, unknown>) => ({
			...s,
			combat: { monstre_ref: 'bestiaire.unknown', postures: [] },
		}))
		mockRejouerCombat.mockReturnValue({ ok: false, refus: 'monstre_inconnu' })

		expect(() => repeter(DOSSIER, 1)).toThrow('repeter: rejouerCombat failed')
	})

	it('impasse_pas_1 — aucune destination des le premier pas', () => {
		preparerCheminHeureux()
		mockDest.mockReturnValue([])

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: { graine: 1, pas: 1, lieu_id: 'lieu.a', combats_traverses: 0, arret: 'impasse' },
		})
	})

	it('impasse_pas_n — refus de commande au pas 2', () => {
		preparerCheminHeureux()
		let appels = 0
		mockExec.mockImplementation((_d: unknown, _s: unknown, cmd: { cibles: string[] }) => {
			appels++
			if (appels === 2) return { ok: false, refus: 'porte_fermee', message: 'Acces bloque' }
			return { ok: true, session: sessionDeBase(cmd.cibles[0], SENTINELLE_HEROS) }
		})

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({ arret: 'impasse', pas: 2, combats_traverses: 0 }),
		})
	})

	it('va_et_vient_PAS_MAX — boucle 20 pas sans sortie', () => {
		preparerCheminHeureux()

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({
			ok: true,
			rapport: expect.objectContaining({ arret: 'pas_max', pas: PAS_MAX, combats_traverses: 0 }),
		})
		expect(PAS_MAX).toBe(20)
		expect(mockExec).toHaveBeenCalledTimes(PAS_MAX)
		expect(mockRng).toHaveBeenCalledWith(1, 'repetition', PAS_MAX)
		expect(mockRng).not.toHaveBeenCalledWith(1, 'repetition', PAS_MAX + 1)
	})

	it('reproductibilite_graine — meme graine, meme destination choisie', () => {
		preparerCheminHeureux()
		mockDest.mockReturnValue(['lieu.x', 'lieu.y'])
		mockRng.mockImplementation((seed: number) => () => ((seed * 7) % 100) / 100)
		mockFin.mockReturnValueOnce(undefined).mockReturnValueOnce({ fin_id: 'fin.x' })

		const r1 = repeter(DOSSIER, 42)

		jest.clearAllMocks()
		preparerCheminHeureux()
		mockDest.mockReturnValue(['lieu.x', 'lieu.y'])
		mockRng.mockImplementation((seed: number) => () => ((seed * 7) % 100) / 100)
		mockFin.mockReturnValueOnce(undefined).mockReturnValueOnce({ fin_id: 'fin.x' })

		const r2 = repeter(DOSSIER, 42)

		expect(r1).toEqual(r2)
	})

	it('dossier_injouable — refus avec controle bloquant', () => {
		const bloquant = { id: 'ctrl.depart', niveau: 'bloquant', section: 'depart', message: 'Depart manquant' }
		mockControler.mockReturnValue({ jouable: false, controles: [bloquant] })

		const r = repeter(DOSSIER, 1)

		expect(r).toEqual({ ok: false, refus: 'dossier_injouable', bloquant })
		expect(mockOuvrir).not.toHaveBeenCalled()
	})

	it('graines_differentes — deux graines choisissent des destinations differentes', () => {
		preparerCheminHeureux()
		mockDest.mockReturnValue(['lieu.x', 'lieu.y'])
		mockRng.mockImplementation((seed: number) => () => (seed === 1 ? 0.1 : 0.9))
		mockExec.mockImplementation((_d: unknown, _s: unknown, cmd: { cibles: string[] }) => ({
			ok: true,
			session: sessionDeBase(cmd.cibles[0], SENTINELLE_HEROS),
		}))
		mockFin.mockReturnValueOnce(undefined).mockReturnValueOnce({ fin_id: 'fin.x' })

		const r1 = repeter(DOSSIER, 1)

		jest.clearAllMocks()
		preparerCheminHeureux()
		mockDest.mockReturnValue(['lieu.x', 'lieu.y'])
		mockRng.mockImplementation((seed: number) => () => (seed === 1 ? 0.1 : 0.9))
		mockExec.mockImplementation((_d: unknown, _s: unknown, cmd: { cibles: string[] }) => ({
			ok: true,
			session: sessionDeBase(cmd.cibles[0], SENTINELLE_HEROS),
		}))
		mockFin.mockReturnValueOnce(undefined).mockReturnValueOnce({ fin_id: 'fin.x' })

		const r2 = repeter(DOSSIER, 2)

		// seed 1 → rng 0.1 → floor(0.1*2)=0 → 'lieu.x'
		// seed 2 → rng 0.9 → floor(0.9*2)=1 → 'lieu.y'
		expect(r1.ok && r1.rapport.lieu_id).toBe('lieu.x')
		expect(r2.ok && r2.rapport.lieu_id).toBe('lieu.y')
	})

	it('choix_destination — rng indexe dans les accessibles et envoie commande aller', () => {
		preparerCheminHeureux()
		mockDest.mockReturnValue(['lieu.x', 'lieu.y', 'lieu.z'])
		mockRng.mockImplementation((_seed: number, domaine: string) => (domaine === 'repetition' ? () => 0.66 : () => 0.5))
		mockExec.mockImplementation((_d: unknown, _s: unknown, cmd: { cibles: string[] }) => ({
			ok: true,
			session: sessionDeBase(cmd.cibles[0], SENTINELLE_HEROS),
		}))
		mockFin.mockReturnValueOnce(undefined).mockReturnValueOnce({ fin_id: 'fin.y' })

		repeter(DOSSIER, 1)

		// floor(0.66 * 3) = 1 → 'lieu.y'
		expect(mockExec).toHaveBeenCalledWith(DOSSIER, expect.anything(), {
			commande: 'aller',
			cibles: ['lieu.y'],
		})
	})

	it('invariant — ouvrirSession echoue apres jouable leve une erreur', () => {
		mockControler.mockReturnValue({ jouable: true, controles: [] })
		mockOuvrir.mockReturnValue({ ok: false })

		expect(() => repeter(DOSSIER, 1)).toThrow('repeter: ouvrirSession failed after controlerDossier.jouable')
	})
})

describe('contrat L1 — creerRng appele avec les bons domaines', () => {
	it('domaine heros pour le heros synthetique, repetition pour chaque pas', () => {
		preparerCheminHeureux()
		mockDest.mockReturnValue([])

		repeter(DOSSIER, 42)

		expect(mockRng).toHaveBeenCalledWith(42, 'heros', 0)
		expect(mockRng).toHaveBeenCalledWith(42, 'repetition', 1)
	})

	it('ouvrirSession recoit la graine', () => {
		preparerCheminHeureux()
		mockFin.mockReturnValueOnce({ fin_id: 'fin.x' })

		repeter(DOSSIER, 77)

		expect(mockOuvrir).toHaveBeenCalledWith(DOSSIER, { graine_alea: 77 })
	})
})

describe('contrat — fixerHeros et chaine de session', () => {
	it('fixerHeros retour capture et transmis a executerCommande', () => {
		const { sessionAvecHeros } = preparerCheminHeureux()
		mockDest.mockReturnValue([])

		repeter(DOSSIER, 1)

		expect(mockFixer).toHaveBeenCalledTimes(1)
		expect(mockDest).toHaveBeenCalledWith(DOSSIER, sessionAvecHeros)
	})
})

describe('creerHerosSynthetique', () => {
	it('distribue le bonus sur la plus basse carac, premiere en cas d egalite', () => {
		// rolls: FO=3 AG=5 DX=4 EN=6 IN=2 IG=7 SE=8 CA=5, bonusPool=3
		// Bonus 1: IN=2 (plus basse) → IN+1
		// Bonus 2: FO=3 et IN=3 a egalite → FO (premiere, strict <) → FO+1
		// Bonus 3: IN=3 (plus basse) → IN+1
		// Resultat: FO:1, IN:2, reste 0
		const { rollCreationPool, buildHeroFromCreation } = jest.requireMock('../../../player/engine/charCreation') as {
			rollCreationPool: jest.Mock
			buildHeroFromCreation: jest.Mock
		}

		rollCreationPool.mockReturnValueOnce({ rolls: [3, 5, 4, 6, 2, 7, 8, 5], bonusPool: 3 })

		creerHerosSynthetique(() => 0.5)

		expect(buildHeroFromCreation).toHaveBeenCalledWith(
			'Héros synthétique',
			{ rolls: [3, 5, 4, 6, 2, 7, 8, 5], bonusPool: 3 },
			expect.objectContaining({
				bonus: { FO: 1, AG: 0, DX: 0, EN: 0, IN: 2, IG: 0, SE: 0, CA: 0 },
			}),
		)
	})
})
