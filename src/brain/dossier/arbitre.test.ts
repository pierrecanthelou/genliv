import fs from 'node:fs'
import path from 'node:path'
import { classifierIssue, doitArbitrer, epreuvesReussies, issueDuJet, xpDuJet } from './arbitre'
import {
	analyserSaisie,
	executerCommande,
	type Commande,
	type ResultatCommande,
	type ResultatSaisie,
} from './commandes'
import { consignerJet, fixerHeros, ouvrirSession, type EtatSession } from './session'
import type { Dossier } from './types'
import type { HeroState } from '../../player/types'
import { MARGE_FRANCHE, tierOf, challengeXp } from '../xp'
import { CHALLENGE_TIERS, challengeTierValue } from '../challenge'

/**
 * LE ROUTAGE ET LA RÉSOLUTION DU NEUVIÈME RÔLE (n° 11 `moteur-arbitre`, lot
 * `contrat`, it2) — § 7 du plan d'itération.
 *
 * LES DOSSIERS SONT LUS DU DISQUE, LES SESSIONS OUVERTES PAR `ouvrirSession` PUIS
 * DÉPLACÉES PAR LE PRODUIT (précédent `commandes.test.ts`) : aucune session n'est
 * forgée à la main.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')

function lire(chemin: string): Dossier {
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

function commandeDe(saisie: string): Commande {
	const resultat: ResultatSaisie = analyserSaisie(saisie)
	if (!resultat.ok) throw new Error(`saisie refusée (${resultat.refus}) : ${resultat.message}`)
	return resultat.commande
}

function sessionDe(resultat: ResultatCommande): EtatSession {
	if (!resultat.ok) throw new Error(`commande refusée (${resultat.refus}) : ${resultat.message}`)
	return resultat.session
}

function executer(dossier: Dossier, session: EtatSession, saisie: string): ResultatCommande {
	return executerCommande(dossier, session, commandeDe(saisie))
}

/** Un `HeroState` plausible — précédent `commandes.test.ts`. */
function heroDeTest(): HeroState {
	return {
		name: 'Aldric le Temeraire',
		caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
		pvMax: 21,
		pv: 14,
		peMax: 8,
		pe: 8,
		mcBonus: 0,
		xp: 12,
	}
}

describe('doitArbitrer — le routage de R2 (KR-262/244 etendus)', () => {
	it('aller, heros present : jamais R2', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = fixerHeros(ouverture(dossier), heroDeTest())

		expect(doitArbitrer(commandeDe('ALLER lieu.tour-effondree'), depart)).toBe(false)
	})

	it('agir, sans heros : jamais R2', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)
		expect('heros' in depart).toBe(false)

		expect(doitArbitrer(commandeDe('AGIR'), depart)).toBe(false)
	})

	it('agir, heros present, lieu courant AVEC dangers rediges : appelle R2', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = fixerHeros(ouverture(dossier), heroDeTest())
		// `lieu.foyer-du-guet`, le lieu de depart de ce dossier, porte un `dangers` redige.
		expect(dossier.monde.lieux.find((l) => l.id === depart.monde.lieu_courant)?.dangers).toBeTruthy()

		expect(doitArbitrer(commandeDe('AGIR'), depart)).toBe(true)
	})

	it('agir, heros present, lieu courant SANS dangers (absent) : appelle quand meme R2', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const avecHeros = fixerHeros(ouverture(dossier), heroDeTest())
		// `lieu.marche-des-cendres` n a ni description ni dangers.
		const surLeMarche = sessionDe(executer(dossier, avecHeros, 'ALLER lieu.marche-des-cendres'))
		expect(dossier.monde.lieux.find((l) => l.id === surLeMarche.monde.lieu_courant)?.dangers).toBeUndefined()

		expect(doitArbitrer(commandeDe('AGIR'), surLeMarche)).toBe(true)
	})
})

describe('classifierIssue — classification qualitative, le CODE jamais le modele (3 etats depuis it3)', () => {
	it('success true, marge sous MARGE_FRANCHE -> reussit (comportement inchange depuis it2)', () => {
		expect(classifierIssue({ roll: 4, success: true, margin: MARGE_FRANCHE - 1 })).toBe('reussit')
	})

	it('success false -> echoue, quelle que soit la marge', () => {
		expect(classifierIssue({ roll: 11, success: false, margin: -2 })).toBe('echoue')
	})

	it('classifierIssue : marge >= MARGE_FRANCHE rend reussit_nettement', () => {
		// Frontiere exacte, des deux cotes.
		expect(classifierIssue({ roll: 1, success: true, margin: MARGE_FRANCHE - 1 })).toBe('reussit')
		expect(classifierIssue({ roll: 1, success: true, margin: MARGE_FRANCHE })).toBe('reussit_nettement')
	})

	it('KR-261 : seuil unique, un MARGE_FRANCHE mocke a 5 deplace la frontiere des deux cotes', async () => {
		// Si classifierIssue dupliquait son propre seuil au lieu de lire
		// brain/xp.ts, ce mock resterait sans effet et le test rougirait. Portee au
		// SEUL test : resetModules + doMock isolent cette instance fraiche
		// d arbitre.ts des bindings statiques deja resolus par les autres tests.
		jest.resetModules()
		jest.doMock('../xp', () => ({ ...jest.requireActual('../xp'), MARGE_FRANCHE: 5 }))
		const { classifierIssue: classifierIssueMocke } = await import('./arbitre')

		expect(classifierIssueMocke({ roll: 1, success: true, margin: 4 })).toBe('reussit')
		expect(classifierIssueMocke({ roll: 1, success: true, margin: 5 })).toBe('reussit_nettement')

		jest.dontMock('../xp')
		jest.resetModules()
	})
})

describe('issueDuJet — SEULE appelante de resolveChallenge, determinisme (critere 3)', () => {
	it('aucune entree jet pour ce tour : undefined', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const avecHeros = fixerHeros(ouverture(dossier), heroDeTest())
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))

		expect(issueDuJet(apresAgir, apresAgir.horloge.tour)).toBeUndefined()
	})

	it('sans heros : undefined, meme avec un jet consigne', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const sansHeros = ouverture(dossier)
		const apresAgir = sessionDe(executer(dossier, sansHeros, 'AGIR'))
		const avecJet = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC2' })

		expect(issueDuJet(avecJet, avecJet.horloge.tour)).toBeUndefined()
	})

	it('meme session, meme tour : deux appels rendent la MEME issue (meme graine)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const avecHeros = fixerHeros(ouverture(dossier), heroDeTest())
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))
		const avecJet = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC2' })

		const issue1 = issueDuJet(avecJet, avecJet.horloge.tour)
		const issue2 = issueDuJet(avecJet, avecJet.horloge.tour)

		expect(issue1).not.toBeUndefined()
		expect(issue1).toEqual(issue2)
	})

	it('resout bien avec la caracteristique DESIGNEE par le jet, pas une autre', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const hero = heroDeTest()
		const avecHeros = fixerHeros(ouverture(dossier), hero)
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))
		const avecJetFO = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC1' })
		const avecJetCA = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'CA', tc: 'TC1' })

		// FO=7, CA=3 (`heroDeTest`) : deux caracteristiques DISTINCTES, deux seuils
		// de reussite differents — une resolution qui lirait toujours la meme
		// caracteristique donnerait le meme `success` pour un roll identique.
		const issueFO = issueDuJet(avecJetFO, avecJetFO.horloge.tour)
		const issueCA = issueDuJet(avecJetCA, avecJetCA.horloge.tour)
		expect(issueFO?.roll).toBe(issueCA?.roll) // meme graine, meme tour, meme TC : meme tirage
		expect(issueFO?.success).toBe(issueFO !== undefined && issueFO.roll <= hero.caracs.FO)
		expect(issueCA?.success).toBe(issueCA !== undefined && issueCA.roll <= hero.caracs.CA)
	})
})

describe('xpDuJet — XP gagnee par le jet (it3) : meme selection, meme garde undefined que issueDuJet', () => {
	it('aucune entree jet pour ce tour : undefined, comme issueDuJet', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const avecHeros = fixerHeros(ouverture(dossier), heroDeTest())
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))

		expect(xpDuJet(apresAgir, apresAgir.horloge.tour)).toBeUndefined()
	})

	it('sans heros : undefined, meme avec un jet consigne', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const sansHeros = ouverture(dossier)
		const apresAgir = sessionDe(executer(dossier, sansHeros, 'AGIR'))
		const avecJet = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC2' })

		expect(xpDuJet(avecJet, avecJet.horloge.tour)).toBeUndefined()
	})

	it('0 est une valeur legale, jamais undefined : bande insignifiante (FO au plafond contre TC1)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const hero = { ...heroDeTest(), caracs: { ...heroDeTest().caracs, FO: 12 } }
		const avecHeros = fixerHeros(ouverture(dossier), hero)
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))
		const avecJet = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC1' })

		// heroTier(FO=12)=T4, challengeTier(TC1)=1 : delta = 1-4 = -3 -> insignifiant,
		// TOUJOURS 0 (§ 5). Le succes est de surcroit GARANTI (1D6 <= 12), ce qui
		// distingue « 0 parce que la bande n accorde rien » de « 0 parce que l echec ».
		expect(issueDuJet(avecJet, avecJet.horloge.tour)?.success).toBe(true)
		expect(xpDuJet(avecJet, avecJet.horloge.tour)).toBe(0)
	})

	it('credite 1 XP, exact : bande facile, succes garanti (FO au plafond contre TC3)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const hero = { ...heroDeTest(), caracs: { ...heroDeTest().caracs, FO: 12 } }
		const avecHeros = fixerHeros(ouverture(dossier), hero)
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))
		const avecJet = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC3' })

		// heroTier(FO=12)=T4, challengeTier(TC3)=3 : delta = 3-4 = -1 -> facile, et le
		// succes est GARANTI (3D4 va de 3 a 12, toujours <= 12) : XP = 1, exact (§ 5).
		expect(issueDuJet(avecJet, avecJet.horloge.tour)?.success).toBe(true)
		expect(xpDuJet(avecJet, avecJet.horloge.tour)).toBe(1)
	})

	it('heroTier se lit sur la caracteristique TESTEE par le jet, jamais une autre (KR-130)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const hero = heroDeTest() // FO=7 (tier T3), CA=3 (tier T1)
		const avecHeros = fixerHeros(ouverture(dossier), hero)
		const apresAgir = sessionDe(executer(dossier, avecHeros, 'AGIR'))
		const avecJetFO = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'FO', tc: 'TC1' })
		const avecJetCA = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'CA', tc: 'TC1' })

		const resultatFO = issueDuJet(avecJetFO, avecJetFO.horloge.tour)
		const resultatCA = issueDuJet(avecJetCA, avecJetCA.horloge.tour)
		if (resultatFO === undefined || resultatCA === undefined) throw new Error('resultat attendu, le jet est consigne')

		// Une resolution qui lirait toujours la MEME caracteristique donnerait le
		// meme xp pour les deux sessions : chaque attendu est recalcule avec le
		// TIER DE LA CARACTERISTIQUE CHOISIE PAR LE JET, pas une autre.
		expect(xpDuJet(avecJetFO, avecJetFO.horloge.tour)).toBe(
			challengeXp({
				challengeTier: challengeTierValue('TC1'),
				heroTier: tierOf(hero.caracs.FO),
				success: resultatFO.success,
				baseXp: CHALLENGE_TIERS.TC1.baseXp,
				margin: resultatFO.margin,
			}),
		)
		expect(xpDuJet(avecJetCA, avecJetCA.horloge.tour)).toBe(
			challengeXp({
				challengeTier: challengeTierValue('TC1'),
				heroTier: tierOf(hero.caracs.CA),
				success: resultatCA.success,
				baseXp: CHALLENGE_TIERS.TC1.baseXp,
				margin: resultatCA.margin,
			}),
		)
	})
})

/**
 * `epreuvesReussies` (n° 12 `moteur-acteurs`, it4, lot `contrat`) — les réussites
 * acquises d'UN PNJ, DÉRIVÉES du journal (KR-013), jamais stockées. Les sessions sont
 * produites par le moteur (`PARLER <pnj>` via la console), jamais forgées : le jet
 * s'attache par `consignerJet` à l'entrée `parler` du pas, qui porte `interlocuteur`.
 *
 * LES ISSUES SONT FORCÉES PAR LA CARACTÉRISTIQUE DU HÉROS, jamais par la graine : un
 * jet TC1 (1D6, total ≥ 1) réussit TOUJOURS contre une caractéristique ≥ 6 et ÉCHOUE
 * TOUJOURS contre 0, un jet TC2 (2D5, total de 2 à 10) réussit TOUJOURS contre 12 —
 * l'issue ne dépend d'aucun tirage, donc d'aucune graine.
 */
describe('epreuvesReussies — les reussites acquises, derivees du journal (KR-013)', () => {
	const HAREK = 'pnj.harek-le-forgeron'
	const CORVIN = 'pnj.corvin-le-marchand'
	/** IN = 9 (TC1 réussit toujours), AG = 0 (TC1 échoue toujours), FO = 12 (TC2 réussit toujours). */
	const heros = (): HeroState => ({ ...heroDeTest(), caracs: { ...heroDeTest().caracs, IN: 9, AG: 0, FO: 12 } })

	/** Joue `PARLER harek` puis y consigne `jet` — le pas courant porte le jet. */
	function parlerEtTenter(
		dossier: Dossier,
		depart: EtatSession,
		jet: { carac: 'IN' | 'AG' | 'FO'; tc: 'TC1' | 'TC2' },
	): EtatSession {
		const parle = sessionDe(executer(dossier, depart, `PARLER ${HAREK}`))
		return consignerJet(parle, parle.horloge.tour, jet)
	}

	it('une reussite sur un pas parler adresse a CE PNJ rend son couple {carac, tc}, rien d autre', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const session = parlerEtTenter(dossier, fixerHeros(ouverture(dossier), heros()), { carac: 'IN', tc: 'TC1' })

		expect(issueDuJet(session, session.horloge.tour)?.success).toBe(true)
		expect(epreuvesReussies(session, HAREK)).toEqual([{ carac: 'IN', tc: 'TC1' }])
	})

	it('un jet ECHOUE n acquiert rien : liste vide, meme pas, meme PNJ', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const session = parlerEtTenter(dossier, fixerHeros(ouverture(dossier), heros()), { carac: 'AG', tc: 'TC1' })

		expect(issueDuJet(session, session.horloge.tour)?.success).toBe(false)
		expect(epreuvesReussies(session, HAREK)).toEqual([])
	})

	it('aucun jet consigne, ou une session toute fraiche : liste vide', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = fixerHeros(ouverture(dossier), heros())
		expect(epreuvesReussies(depart, HAREK)).toEqual([])
		const parle = sessionDe(executer(dossier, depart, `PARLER ${HAREK}`))
		expect(epreuvesReussies(parle, HAREK)).toEqual([])
	})

	it('la reussite se tient PAR PNJ : le jet tente aupres de Harek n ouvre rien pour un autre personnage', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const session = parlerEtTenter(dossier, fixerHeros(ouverture(dossier), heros()), { carac: 'IN', tc: 'TC1' })

		expect(epreuvesReussies(session, HAREK)).toHaveLength(1)
		expect(epreuvesReussies(session, CORVIN)).toEqual([])
		expect(epreuvesReussies(session, 'pnj.fantome')).toEqual([])
	})

	it('un jet tente par AGIR (R2, aucun interlocuteur) n est jamais une reussite de PNJ', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const apresAgir = sessionDe(executer(dossier, fixerHeros(ouverture(dossier), heros()), 'AGIR'))
		const avecJet = consignerJet(apresAgir, apresAgir.horloge.tour, { carac: 'IN', tc: 'TC1' })

		expect(issueDuJet(avecJet, avecJet.horloge.tour)?.success).toBe(true)
		expect(epreuvesReussies(avecJet, HAREK)).toEqual([])
	})

	it('plusieurs pas : les reussites sont rendues DANS L ORDRE du journal, les echecs ecartes, les doublons de couple gardes', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		let session = fixerHeros(ouverture(dossier), heros())
		session = parlerEtTenter(dossier, session, { carac: 'IN', tc: 'TC1' }) // tour 1 : reussite
		session = parlerEtTenter(dossier, session, { carac: 'AG', tc: 'TC1' }) // tour 2 : echec
		session = parlerEtTenter(dossier, session, { carac: 'FO', tc: 'TC2' }) // tour 3 : reussite (FO 12 contre 2D5)
		session = parlerEtTenter(dossier, session, { carac: 'IN', tc: 'TC1' }) // tour 4 : reussite, MEME couple que le tour 1

		expect(epreuvesReussies(session, HAREK)).toEqual([
			{ carac: 'IN', tc: 'TC1' },
			{ carac: 'FO', tc: 'TC2' },
			{ carac: 'IN', tc: 'TC1' },
		])
		// Le tour 2 (echec) n'y est JAMAIS, et le doublon de couple est conserve tel quel.
		expect(epreuvesReussies(session, HAREK).filter((jet) => jet.carac === 'AG')).toEqual([])
		expect(epreuvesReussies(session, HAREK).filter((jet) => jet.carac === 'IN')).toHaveLength(2)
	})

	it('avantTour est une borne EXCLUSIVE : le jet du pas courant n y figure pas, celui d avant oui', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		let session = fixerHeros(ouverture(dossier), heros())
		session = parlerEtTenter(dossier, session, { carac: 'IN', tc: 'TC1' }) // tour 1
		session = parlerEtTenter(dossier, session, { carac: 'IN', tc: 'TC1' }) // tour 2
		expect(session.horloge.tour).toBe(2)

		expect(epreuvesReussies(session, HAREK)).toHaveLength(2)
		expect(epreuvesReussies(session, HAREK, 3)).toHaveLength(2)
		expect(epreuvesReussies(session, HAREK, 2)).toHaveLength(1) // exclusif : le tour 2 est EXCLU
		expect(epreuvesReussies(session, HAREK, 1)).toEqual([]) // exclusif : le tour 1 est EXCLU
		expect(epreuvesReussies(session, HAREK, 0)).toEqual([])
	})

	it('DERIVEE, jamais stockee (KR-013) : meme journal, autre heros, autre reponse — et la session n est pas touchee', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const session = parlerEtTenter(dossier, fixerHeros(ouverture(dossier), heros()), { carac: 'IN', tc: 'TC1' })
		const clefsAvant = Object.keys(session).sort()
		const journalAvant = JSON.stringify(session.journal)

		expect(epreuvesReussies(session, HAREK)).toEqual([{ carac: 'IN', tc: 'TC1' }])

		// MEME journal, un heros dont IN vaut 0 : la reussite DISPARAIT — elle n'est lue d'aucun
		// champ stocke, elle est re-resolue par `issueDuJet` (le risque documente a la fonction).
		const sansIntelligence: EtatSession = {
			...session,
			heros: { ...heros(), caracs: { ...heros().caracs, IN: 0 } },
		}
		expect(epreuvesReussies(sansIntelligence, HAREK)).toEqual([])

		// Aucune ecriture : ni nouvelle cle racine, ni journal reecrit.
		expect(Object.keys(session).sort()).toEqual(clefsAvant)
		expect(JSON.stringify(session.journal)).toBe(journalAvant)
	})

	it('sans heros, issueDuJet ne resout rien : aucune reussite, meme avec un jet consigne', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const session = parlerEtTenter(dossier, ouverture(dossier), { carac: 'IN', tc: 'TC1' })

		expect(session.heros).toBeUndefined()
		expect(epreuvesReussies(session, HAREK)).toEqual([])
	})
})

describe('resolveChallenge n est JAMAIS appele hors de issueDuJet (KR-013, balayage de fichiers)', () => {
	const RACINE_FEATURES = path.join(__dirname, '..', '..', 'features')
	const RACINE_BRAIN = path.join(__dirname, '..')

	function fichiersSous(racine: string): string[] {
		return fs
			.readdirSync(racine, { withFileTypes: true })
			.flatMap((entree) => {
				const chemin = path.join(racine, entree.name)
				if (entree.isDirectory()) return fichiersSous(chemin)
				if (!/\.tsx?$/.test(entree.name)) return []
				return [chemin]
			})
			.sort()
	}

	it('aucune occurrence de resolveChallenge sous src/features/**', () => {
		const fichiers = fichiersSous(RACINE_FEATURES)
		expect(fichiers.length).toBeGreaterThan(0)

		const fautifs = fichiers.filter((chemin) => fs.readFileSync(chemin, 'utf8').includes('resolveChallenge'))
		expect(fautifs).toEqual([])
	})

	/**
	 * LE SECOND BALAYAGE (n° 12 `moteur-acteurs`, it4, KR-281) — la porte `jet` de R4 ajoute
	 * TROIS lecteurs d'issue dans `brain/` (`epreuvesReussies`, l'assembleur de R4,
	 * `consignerReponseActeur`) : aucun ne doit appeler `resolveChallenge` lui-même. ANCRÉ SUR
	 * L'APPEL (`resolveChallenge(`), jamais le mot nu — les docstrings le NOMMENT. Portée
	 * réellement tenue : `src/brain/`, hors tests — pas `src/player/engine/`, dont les trois
	 * orphelins gelés l'appellent encore (KR-240, hors périmètre).
	 */
	it('sous src/brain/ hors tests, seuls challenge.ts (la definition) et dossier/arbitre.ts appellent resolveChallenge(', () => {
		const fichiers = fichiersSous(RACINE_BRAIN).filter((chemin) => !/\.test\.tsx?$/.test(chemin))
		// NON-VACUITÉ (BUG-084) : MESURÉ le 2026-10-04, 106 fichiers de production sous
		// `src/brain/` ; le plancher est un FILET contre un balayage vidé (répertoire
		// renommé), pas une garde sur le nombre de fichiers — d'où 100, sous `floor(106/5)×5`.
		expect(fichiers.length).toBeGreaterThanOrEqual(100)

		const porteurs = fichiers
			.filter((chemin) => fs.readFileSync(chemin, 'utf8').includes('resolveChallenge('))
			.map((chemin) => path.relative(RACINE_BRAIN, chemin).split(path.sep).join('/'))
		expect(porteurs).toEqual(['challenge.ts', 'dossier/arbitre.ts'])
	})
})
