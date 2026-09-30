import fs from 'node:fs'
import path from 'node:path'
import { analyserSaisie, executerCommande } from './commandes'
import {
	CADENCE,
	FAITS_INJECTES_MAX,
	FENETRE_MAX,
	FENETRE_MIN,
	borneDeFenetre,
	faitsPertinents,
	pasACondenser,
} from './memoire'
import { consignerNarration } from './recit'
import { ouvrirSession, type EtatSession, type FaitEtabli } from './session'
import type { Dossier } from './types'

/**
 * LA POLITIQUE DE RÉTENTION DU NARRATEUR (n° 10 it3) — `memoire.ts`, pur, sans IA.
 *
 * LES SESSIONS SONT PRODUITES PAR LE MOTEUR (`ouvrirSession` + `executerCommande`) et la
 * MÉMOIRE PAR SA SEULE PORTE D'ÉCRITURE (`consignerNarration`) — jamais un `memoire`
 * forgé à la main pour arriver à l'état voulu : une propriété prouvée sur un état que le
 * produit ne sait pas atteindre ne prouve rien (précédent `commandes.test.ts`). Seul
 * `monde.objets_possedes` est posé à la main quand un test en a besoin : aucun jalon du
 * dossier de référence ne donne d'objet.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')

function lire(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

/** Un pas joué EN CONSOLE, par le produit — l'échec est NOMMÉ. */
function unPas(dossier: Dossier, session: EtatSession, saisie = 'AGIR'): EtatSession {
	const analyse = analyserSaisie(saisie)
	if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
	const resultat = executerCommande(dossier, session, analyse.commande)
	if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
	return resultat.session
}

/** `n` pas `agir` joués en console depuis `depart` — sans récit, sans mémoire. */
function agirNFois(dossier: Dossier, depart: EtatSession, n: number): EtatSession {
	let session = depart
	for (let rang = 0; rang < n; rang += 1) session = unPas(dossier, session)
	return session
}

/** La taille de la fenêtre au pas `pas` — le nombre de pas de `(borneDeFenetre(pas), pas]`. */
const tailleDeFenetre = (pas: number): number => pas - borneDeFenetre(pas)

describe('les constantes de la politique de retention', () => {
	it('les valeurs de decision, et FENETRE_MAX DERIVEE — jamais ecrite en dur', () => {
		expect([FENETRE_MIN, CADENCE, FAITS_INJECTES_MAX]).toEqual([5, 10, 8])
		expect(FENETRE_MAX).toBe(14)
		// MUTANT « FENETRE_MAX écrit en dur » — la VALEUR ne le distingue pas (14 dans les
		// deux cas), seule la SOURCE le peut (KR-169). Vérifié ROUGE en écrivant `= 14`.
		const source = fs.readFileSync(path.join(__dirname, 'memoire.ts'), 'utf8')
		expect(source).toContain('export const FENETRE_MAX = FENETRE_MIN + CADENCE - 1')
		expect(source).not.toMatch(/export const FENETRE_MAX = \d/)
	})

	it('memoire.ts ne nomme aucun motif balaye par moteurSansIA, meme en commentaire (KR-260)', () => {
		const source = fs.readFileSync(path.join(__dirname, 'memoire.ts'), 'utf8')
		for (const motif of [/\bfetch\s*\(/, /CopiloteService/, /\/ia\//, /\.demander\s*\(/]) {
			expect(`${String(motif)} → ${motif.test(source)}`).toBe(`${String(motif)} → false`)
		}
	})
})

describe('borneDeFenetre — la fenetre derivee de l horloge SEULE (AC#2)', () => {
	it('la table du plan : 4 → 4, 14 → 14, 15 → 5, 24 → 14, 25 → 5 pas', () => {
		// MUTANTS vérifiés ROUGES : `Math.max(0, …)` retiré (le pas 4 donne une borne de −10,
		// donc une fenêtre de 14) ; une fenêtre forcée à au moins `FENETRE_MIN` pas.
		const table = [4, 14, 15, 24, 25].map((pas) => [pas, tailleDeFenetre(pas)])
		expect(table).toEqual([
			[4, 4],
			[14, 14],
			[15, 5],
			[24, 14],
			[25, 5],
		])
	})

	it('les bornes elles-memes, au debut de partie et a chaque bascule', () => {
		const bornes = [0, 1, 3, 4, 5, 14, 15, 16, 24, 25, 34, 35, 40].map((pas) => [pas, borneDeFenetre(pas)])
		expect(bornes).toEqual([
			[0, 0],
			[1, 0],
			[3, 0],
			[4, 0],
			[5, 0],
			[14, 0],
			[15, 10],
			[16, 10],
			[24, 10],
			[25, 20],
			[34, 20],
			[35, 30],
			[40, 30],
		])
	})

	it('sur soixante pas : multiple de CADENCE, jamais negative ni au-dela du pas, jamais plus de FENETRE_MAX pas', () => {
		const fautes: string[] = []
		for (let pas = 0; pas <= 60; pas += 1) {
			const borne = borneDeFenetre(pas)
			const taille = tailleDeFenetre(pas)
			if (borne % CADENCE !== 0) fautes.push(`${pas} : borne ${borne} non multiple`)
			if (borne < 0 || borne > pas) fautes.push(`${pas} : borne ${borne} hors de [0, pas]`)
			if (taille > FENETRE_MAX) fautes.push(`${pas} : fenêtre de ${taille}`)
			// Jamais sous le plancher une fois la partie assez longue — et jamais FORCÉE à lui
			// avant : au pas 3, la fenêtre vaut 3.
			if (taille < Math.min(pas, FENETRE_MIN)) fautes.push(`${pas} : fenêtre de ${taille} sous le plancher`)
			if (pas > 0 && borne < borneDeFenetre(pas - 1)) fautes.push(`${pas} : la borne recule`)
		}
		expect(fautes).toEqual([])
		// Discriminant : la fenêtre ATTEINT bien ses deux extrêmes, sans quoi les bornes
		// ci-dessus pourraient être vraies d'une fenêtre fixe.
		const tailles = Array.from({ length: 61 }, (_, pas) => tailleDeFenetre(pas)).filter((_, pas) => pas >= FENETRE_MIN)
		expect(Math.min(...tailles)).toBe(FENETRE_MIN)
		expect(Math.max(...tailles)).toBe(FENETRE_MAX)
	})
})

describe('pasACondenser — la tranche due, et sa reprise apres un echec', () => {
	it('rien n est du tant que la fenetre n a pas glisse : null jusqu au pas 14, la tranche 1-10 au pas 15', () => {
		const dossier = lire()
		expect(pasACondenser(agirNFois(dossier, ouverture(dossier), 14))).toBeNull()
		expect(pasACondenser(agirNFois(dossier, ouverture(dossier), 15))).toEqual({ de: 1, a: 10 })
		// À l'ouverture, `memoire` vaut `null` : la couverture se lit 0, sans lever.
		expect(pasACondenser(ouverture(dossier))).toBeNull()
	})

	it('echec au pas 15 (ou pas 15 joue en console) : au pas 16, fenetre 11-16 et tranche 1-10 — le separateur du plan', () => {
		// MUTANT vérifié ROUGE ICI : une condensation déclenchée par `t % 10 === 5` (elle rendrait
		// `null` au pas 16, et la tranche ne serait jamais rattrapée). Le mutant « fenêtre calculée
		// depuis la COUVERTURE du résumé » n'est PAS séparable par ce test (memoire vaut null au
		// pas 16, rien à lire) — il est tué par contexte.test.ts:3376 (« echec au pas 15 : au pas 16,
		// RECEMMENT porte les pas 11-15... »).
		const dossier = lire()
		const auPas16 = agirNFois(dossier, ouverture(dossier), 16)
		expect(auPas16.memoire).toBeNull()
		expect(auPas16.horloge.tour).toBe(16)

		expect(borneDeFenetre(auPas16.horloge.tour)).toBe(10)
		expect(tailleDeFenetre(auPas16.horloge.tour)).toBe(6)
		expect(pasACondenser(auPas16)).toEqual({ de: 1, a: 10 })
	})

	it('apres une condensation reussie au pas 15, plus rien n est du au pas 16 — ni avant le pas 25', () => {
		// MUTANT vérifié ROUGE : `<=` à la place de `<` — il rendrait `{11, 20}` au pas 16,
		// une tranche qui RECOUVRE la fenêtre (11-16).
		const dossier = lire()
		const auPas15 = agirNFois(dossier, ouverture(dossier), 15)
		const condense = consignerNarration(auPas15, 15, {
			recit: 'Vous attendez.',
			faits_etablis: [],
			resume: { texte: 'Vous avez longtemps attendu au foyer.', jusqu_au_pas: 10 },
		})
		expect(condense.memoire?.resume?.jusqu_au_pas).toBe(10)
		expect(pasACondenser(condense)).toBeNull()

		const auPas16 = unPas(dossier, condense)
		expect(pasACondenser(auPas16)).toBeNull()
		expect(pasACondenser(agirNFois(dossier, condense, 9))).toBeNull()
		expect(pasACondenser(agirNFois(dossier, condense, 10))).toEqual({ de: 11, a: 20 })
	})

	it('un retard cumule se rattrape D UNE cadence a la fois, jamais d un bond', () => {
		const dossier = lire()
		// Aucune condensation n'a jamais réussi : au pas 25, la tranche due reste la PREMIÈRE.
		const auPas25 = agirNFois(dossier, ouverture(dossier), 25)
		expect(borneDeFenetre(25)).toBe(20)
		expect(pasACondenser(auPas25)).toEqual({ de: 1, a: 10 })
		// Et la tranche ne dépasse JAMAIS la borne : `a <= borne` (I2).
		for (let pas = 0; pas <= 45; pas += 1) {
			const session = agirNFois(dossier, ouverture(dossier), pas)
			const tranche = pasACondenser(session)
			if (tranche !== null) expect(`${pas} → ${tranche.a <= borneDeFenetre(pas)}`).toBe(`${pas} → true`)
		}
	})
})

describe('faitsPertinents — les faits qui repartent (AC#4)', () => {
	const fait = (texte: string, ...sur: string[]): FaitEtabli => ({ fait: texte, sur })

	/** Une session jouée, qui a RETENU `faits` au pas 1 par la porte d'écriture réelle. */
	function avecFaits(dossier: Dossier, faits: readonly FaitEtabli[]): EtatSession {
		const s1 = unPas(dossier, ouverture(dossier))
		return consignerNarration(s1, 1, { recit: 'Vous regardez.', faits_etablis: faits })
	}

	it('memoire null : aucun fait, sans lever', () => {
		const dossier = lire()
		expect(faitsPertinents(ouverture(dossier))).toEqual([])
	})

	it('un fait ancre sur le lieu courant ou sur un objet POSSEDE repart ; ancre ailleurs, il reste stocke mais ne repart pas', () => {
		const dossier = lire()
		const ici = fait('Le foyer garde une braise.', 'lieu.foyer-du-guet')
		const ailleurs = fait('La tour penche vers le nord.', 'lieu.tour-effondree')
		const surObjet = fait('Le sceau est fendu.', 'objet.sceau-de-cendre')
		const mixte = fait('La lanterne vient de la tour.', 'objet.lanterne-de-corvin', 'lieu.tour-effondree')
		const session = avecFaits(dossier, [ici, ailleurs, surObjet, mixte])
		expect(session.monde.lieu_courant).toBe('lieu.foyer-du-guet')

		// Rien de possédé : seul le fait du lieu courant repart.
		expect(faitsPertinents(session)).toEqual([ici])

		// Le sceau possédé : son fait repart, DANS L'ORDRE DU STOCKAGE.
		const avecSceau: EtatSession = {
			...session,
			monde: { ...session.monde, objets_possedes: ['objet.sceau-de-cendre'] },
		}
		expect(faitsPertinents(avecSceau)).toEqual([ici, surObjet])

		// UNE ancre présente sur deux suffit.
		const avecLanterne: EtatSession = {
			...session,
			monde: { ...session.monde, objets_possedes: ['objet.lanterne-de-corvin'] },
		}
		expect(faitsPertinents(avecLanterne)).toEqual([ici, mixte])

		// Exclu du contexte, JAMAIS du stockage.
		expect(session.memoire?.faits_etablis).toEqual([ici, ailleurs, surObjet, mixte])
	})

	it('le retour au lieu fait revenir son fait — la presence peut disparaitre puis revenir', () => {
		const dossier = lire()
		const ici = fait('Le foyer garde une braise.', 'lieu.foyer-du-guet')
		const retenu = avecFaits(dossier, [ici])
		const parti = unPas(dossier, retenu, 'ALLER lieu.tour-effondree')
		const revenu = unPas(dossier, parti, 'ALLER lieu.foyer-du-guet')

		expect(faitsPertinents(parti)).toEqual([])
		expect(faitsPertinents(revenu)).toEqual([ici])
	})

	it('neuf faits pertinents : seuls les HUIT plus recents repartent, en ordre chronologique', () => {
		const dossier = lire()
		const neuf = Array.from({ length: 9 }, (_, rang) => fait(`Braise numero ${rang}.`, 'lieu.foyer-du-guet'))
		const session = avecFaits(dossier, neuf)

		expect(FAITS_INJECTES_MAX).toBe(8)
		expect(faitsPertinents(session)).toEqual(neuf.slice(1))
		// Le stockage, lui, garde les neuf : l'éviction n'existe pas.
		expect(session.memoire?.faits_etablis).toHaveLength(9)
	})

	it('le filtre de pertinence passe AVANT la limite : des faits recents hors contexte ne chassent pas les pertinents', () => {
		// MUTANT vérifié ROUGE : limiter AVANT de filtrer — les huit derniers faits stockés
		// seraient tous ancrés ailleurs, et aucun fait pertinent ne repartirait.
		const dossier = lire()
		const pertinents = Array.from({ length: 3 }, (_, rang) => fait(`Foyer ${rang}.`, 'lieu.foyer-du-guet'))
		const horsContexte = Array.from({ length: 8 }, (_, rang) => fait(`Tour ${rang}.`, 'lieu.tour-effondree'))
		const session = avecFaits(dossier, [...pertinents, ...horsContexte])

		expect(faitsPertinents(session)).toEqual(pertinents)
	})

	it('une ancre qui n est ni le lieu courant ni un objet possede ne selectionne rien — un indice connu non plus (KR-272)', () => {
		// Défense en profondeur : aucune ancre `indice.*` n'est jamais posée (l'assembleur ne
		// range pas d'indice), et si elle l'était, un indice CONNU ne ferait pas repartir le
		// fait — l'ensemble des indices connus ne fait que croître.
		const dossier = lire()
		const session = avecFaits(dossier, [fait('Le sceau est brise.', 'indice.sceau-brise-a-nouveau')])
		const connu: EtatSession = {
			...session,
			monde: { ...session.monde, indices_connus: ['indice.sceau-brise-a-nouveau'] },
		}
		expect(faitsPertinents(connu)).toEqual([])
	})
})
