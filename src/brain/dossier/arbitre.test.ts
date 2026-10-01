import fs from 'node:fs'
import path from 'node:path'
import { classifierIssue, doitArbitrer, issueDuJet, xpDuJet } from './arbitre'
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

describe('resolveChallenge n est JAMAIS appele hors de issueDuJet (KR-013, balayage de fichiers)', () => {
	const RACINE_FEATURES = path.join(__dirname, '..', '..', 'features')

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
})
