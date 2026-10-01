import fs from 'node:fs'
import path from 'node:path'
import { classifierIssue, doitArbitrer, issueDuJet } from './arbitre'
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

describe('classifierIssue — classification qualitative, le CODE jamais le modele', () => {
	it('success true -> reussit', () => {
		expect(classifierIssue({ roll: 4, success: true, margin: 3 })).toBe('reussit')
	})

	it('success false -> echoue', () => {
		expect(classifierIssue({ roll: 11, success: false, margin: -2 })).toBe('echoue')
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
