import fs from 'node:fs'
import path from 'node:path'
import { AMORCE, MARQUEUR_A_ECRIRE, construireAmorce } from './amorce'
import { executerCommande } from './commandes'
import { evenementARencontrer } from './evaluate'
import {
	consignerJet,
	crediterConfiance,
	crediterXp,
	resoudreRencontre,
	SCHEMA_SESSION,
	fixerHeros,
	ouvrirSession,
	type EntreeJournal,
	type EtatSession,
} from './session'
import {
	cloreCombat,
	fuirRencontre,
	jouerPosture,
	type BilanCombat,
	type EtatCombat,
	type IssueCombat,
} from './sessionCombat'
import type { Dossier } from './types'
import { POSTURE_VALUES, type Posture } from '../combat'
import type { HeroState } from '../../player/types'

/**
 * `ouvrirSession` — LE CONTRAT D'OUVERTURE D'UNE PARTIE.
 *
 * Deux propriétés, et elles ne se prouvent pas de la même façon :
 *  · le REFUS sur le marqueur, qui se prouve PAR OPPOSITION dans le même test —
 *    un seul cas positif ne distingue pas un refus d'un rejet universel
 *    (KR-197/202/244) ;
 *  · les VALEURS À L'OUVERTURE, qui se prouvent sur un dossier où « le lieu de
 *    départ » et « le premier lieu déclaré » NE COÏNCIDENT PAS — sinon le témoin
 *    épingle une coïncidence (BUG-113).
 *
 * LE DOSSIER EST FABRIQUÉ pour les valeurs d'ouverture, jamais lu du disque : les
 * deux fixtures partagées ont un départ posé sur leur unique lieu, donc aucune ne
 * porte l'état séparateur du second critère. Même choix, même motif que
 * `tourzero.test.ts`.
 *
 * ⚠ SAUF POUR LES JALONS D'OUVERTURE (itération 3), qui se prouvent au CONTRAIRE
 * sur les DEUX fixtures du disque : la chaîne « départ → condition vraie → effet »
 * y est écrite, et c'est un fait du dépôt, pas un montage de test. La fabriquer
 * prouverait le comportement sur un dossier que personne n'a jamais écrit.
 */

const MAINTENANT = '2026-09-20T10:00:00.000Z'

/** Une fixture du disque, LUE à chaque appel — jamais mutée en place (KR-156). */
function fixture(nom: string): Dossier {
	return JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__', nom), 'utf8')) as Dossier
}

const dossierMinimal = (): Dossier => fixture('dossier-minimal.json')
const dossierReference = (): Dossier => fixture('dossier-reference.json')

/** Le dossier semé — ses quatre proses portent le marqueur, celle d'ouverture comprise. */
function marque(): Dossier {
	return construireAmorce('dossier-temoin', 'Le dossier témoin', MAINTENANT)
}

/** Le JUMEAU du précédent, dont la seule prose d'ouverture a été réécrite. */
function reecrit(): Dossier {
	const dossier = marque()
	dossier.charpente.depart.texte_ouverture_joueur = "Vous poussez la porte ; la salle se tait d'un coup."
	return dossier
}

/** La session d'un résultat accepté — et l'échec est NOMMÉ, jamais un `!`. */
function sessionDe(dossier: Dossier, graine = 0): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: graine })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

describe('ouvrirSession, le refus sur le texte d ouverture', () => {
	it('refuse le dossier marque et accepte son jumeau reecrit, dans le MEME test', () => {
		// KR-244 : le refus se prouve par OPPOSITION. Un test à un seul dossier ne
		// distingue pas « refuse quand le marqueur est là » de « refuse toujours » —
		// et c'est la seconde forme qu'une implémentation fautive produit.
		expect(ouvrirSession(marque(), { graine_alea: 0 })).toEqual({ ok: false, refus: 'ouverture_a_ecrire' })

		const accepte = ouvrirSession(reecrit(), { graine_alea: 0 })
		expect(accepte.ok).toBe(true)
	})

	it('ne lit QUE le texte d ouverture — les trois autres proses semees ne bloquent rien', () => {
		// LA PROPRIÉTÉ « PLUS GROSSIER QUE `controles.ts`, JAMAIS PLUS FIN » (§ 8, D-7).
		// Le dossier ci-dessous porte encore le marqueur sur les TROIS proses de canon,
		// que `controles.ts` classe `alerte` — et l'ouverture, elle, est rédigée. Un
		// `ouvrirSession` qui aurait réimplémenté les quatre proses le refuserait.
		const dossier = reecrit()

		expect(dossier.canon.mj.synopsis_mj).toContain(MARQUEUR_A_ECRIRE)
		expect(dossier.canon.partage.accroche_joueur).toContain(MARQUEUR_A_ECRIRE)
		expect(dossier.canon.ton).toContain(MARQUEUR_A_ECRIRE)

		expect(ouvrirSession(dossier, { graine_alea: 0 }).ok).toBe(true)
	})

	it('une fin encore marquee n empeche pas d ouvrir la partie', () => {
		// KR-244, PORTÉE EXACTE : seul `charpente.depart.texte_ouverture_joueur` bloque
		// l'OUVERTURE. Une `fins[].texte` encore marquée ne bloque que l'atteinte de SA
		// fin — refuser ici interdirait de tester une aventure dont la dernière scène
		// n'est pas écrite, ce qui est l'usage même du CTA.
		const dossier = reecrit()
		dossier.charpente.fins = [
			{
				id: 'fin.temoin',
				condition_texte: 'Le héros ressort du Gouffre.',
				texte: AMORCE.texte_ouverture_joueur,
			},
		]

		expect(dossier.charpente.fins[0].texte).toContain(MARQUEUR_A_ECRIRE)
		expect(ouvrirSession(dossier, { graine_alea: 0 }).ok).toBe(true)
	})
})

describe('ouvrirSession, les valeurs a l ouverture', () => {
	/**
	 * L'ÉTAT SÉPARATEUR DU CRITÈRE 5 : un départ qui n'est PAS le premier lieu
	 * déclaré. Sur un dossier à un seul lieu — les deux fixtures partagées, et le
	 * document semé —, `lieu_courant = depart` et `lieu_courant = lieux[0].id` sont
	 * indistinguables, et le témoin épinglerait une coïncidence (BUG-113).
	 */
	function departEnSecondeposition(): Dossier {
		const dossier = reecrit()
		dossier.monde.lieux = [{ id: 'lieu.le-fanal' }, { id: 'lieu.val-cendre' }]
		dossier.charpente.depart.lieu_id = 'lieu.val-cendre'
		return dossier
	}

	it('le lieu courant est le DEPART, et non le premier lieu declare', () => {
		const dossier = departEnSecondeposition()

		// La séparation est ASSERTÉE, pas supposée : si un jour la fixture cessait de
		// porter deux lieux distincts, cette ligne rougirait avant les deux suivantes.
		expect(dossier.monde.lieux[0].id).not.toBe(dossier.charpente.depart.lieu_id)

		const session = sessionDe(dossier)

		expect(session.monde.lieu_courant).toBe(dossier.charpente.depart.lieu_id)
		expect(session.monde.lieux_visites).toEqual([dossier.charpente.depart.lieu_id])
	})

	it('les sept champs du monde partent tous vides, sauf les deux que le depart determine', () => {
		// La TOTALITÉ est la précondition de la bivalence d'it3 (KR-254) : un champ
		// manquant y ferait une branche `undefined` sous un aiguillage qui doit lever.
		//
		// LE DOSSIER EST CELUI DU SEED, ET SA LISTE DE JALONS EST VIDE — ce qui est
		// exactement ce que ce témoin doit exercer depuis l'itération 3 : « tous vides »
		// n'est vrai QU'À DÉFAUT DE JALON DÉCLENCHABLE. Le cas contraire a son propre
		// témoin, juste en dessous.
		expect(reecrit().charpente.jalons).toEqual([])
		const session = sessionDe(departEnSecondeposition())

		expect(session.monde).toEqual({
			lieu_courant: 'lieu.val-cendre',
			lieux_visites: ['lieu.val-cendre'],
			objets_possedes: [],
			indices_connus: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: {},
		})
	})

	it('les jalons d ouverture sont RESOLUS avant la premiere action', () => {
		// CRITÈRE 4, MOITIÉ MOTEUR — décision (i) de H6 (`tourzero.ts`), tranchée à
		// l'itération 1 et LIVRÉE ici (KR-252). La chaîne est ÉCRITE AU DÉPÔT, et c'est
		// pour ça que ce témoin lit la fixture plutôt que de fabriquer : départ
		// `lieu.val-cendre` → `jalon.premiere-nuit` se déclenche sur
		// `lieu_visite(lieu.val-cendre)`, vrai dès l'ouverture puisque
		// `lieux_visites = [depart]` → effet `reveler_indice(indice.sceau-brise)`.
		const session = sessionDe(dossierMinimal())

		expect(session.monde.jalons_atteints).toEqual(['jalon.premiere-nuit'])
		expect(session.monde.indices_connus).toEqual(['indice.sceau-brise'])

		// ET LE JOURNAL RESTE VIDE : aucune entrée n'est écrite à l'ouverture (retenu à
		// l'itération 1, inchangé). Il n'y a pas de tour zéro à raconter.
		expect(session.journal).toEqual([])
		expect(session.horloge).toEqual({ tour: 0 })

		// DISCRIMINANCE (KR-199) : le dossier de RÉFÉRENCE, lui, n'atteint RIEN à
		// l'ouverture — son seul jalon à condition vise un lieu qu'il faut aller
		// visiter. Sans cette ligne, les deux assertions ci-dessus seraient vraies d'un
		// moteur qui pré-remplirait tout ce qu'il trouve.
		const reference = sessionDe(dossierReference())
		expect(reference.monde.jalons_atteints).toEqual([])
		expect(reference.monde.indices_connus).toEqual([])
	})

	it('pnj part a {} meme quand le dossier declare des personnages', () => {
		// KR-013 : pré-semer une entrée par `monde.personnages[]` serait une COPIE
		// DÉRIVÉE d'une collection du dossier, que rien ne re-synchroniserait. Clé
		// absente = état légal, jamais un trou — `pnj[p]?.a_dit … ?? false`.
		const dossier = reecrit()
		dossier.monde.personnages = [
			{ id: 'pnj.aldur-le-sage', portee: 'premier', plan_actions: [], savoirs: [] },
			{ id: 'pnj.corvin-le-marchand', portee: 'second', plan_actions: [], savoirs: [] },
		]

		expect(sessionDe(dossier).monde.pnj).toEqual({})
	})

	it('l enveloppe porte le schema, le dossier par REFERENCE, la graine injectee, et rien de plus', () => {
		const dossier = reecrit()
		const session = sessionDe(dossier, 424242)

		expect(session.schema).toBe(SCHEMA_SESSION)
		expect(session.dossier_id).toBe(dossier.id)
		// La graine est REQUISE et INJECTÉE : la fonction ne tire jamais elle-même
		// (KR-242). Deux ouvertures à graines différentes le prouvent — une seule
		// serait vraie d'une constante en dur.
		expect(session.graine_alea).toBe(424242)
		expect(sessionDe(dossier, 7).graine_alea).toBe(7)
		expect(session.horloge).toEqual({ tour: 0 })
		expect(session.journal).toEqual([])
		expect(session.memoire).toBeNull()

		// L'ESTAMPILLE est celle de L'OUVERTURE, recopiée de `dossier.updatedAt` —
		// et l'état séparateur est qu'elle ne s'y CONFONDE plus dès que le dossier
		// bouge : sans ce second temps, le témoin épinglerait une coïncidence
		// (BUG-113), `dossier.updatedAt` et `session.dossier_maj` étant égaux au
		// nominal. C'est TOUTE la raison d'être du champ (KR-249, 2ᵉ exemption).
		//
		// LA TROISIÈME LIGNE EST LA PORTEUSE, et ce n'est pas une intuition : elle est
		// la SEULE à tuer le mutant `dossier_maj: dossier.createdAt`. `construireAmorce`
		// pose `createdAt` et `updatedAt` à la même valeur, donc les deux premières
		// lignes restent VERTES sous ce mutant — elles épinglent une coïncidence.
		// Ne la supprime pas comme redondante : sans elle, ce témoin ne mesure rien.
		expect(session.dossier_maj).toBe(dossier.updatedAt)
		const plusTard = { ...dossier, updatedAt: '2030-01-01T00:00:00.000Z' }
		expect(session.dossier_maj).not.toBe(plusTard.updatedAt)
		expect(sessionDe(plusTard, 1).dossier_maj).toBe(plusTard.updatedAt)

		// AUCUNE COPIE DU DOSSIER dans la session : le lien est `dossier_id` + son
		// estampille, et rien d'autre (seconde source de vérité, KR-013). Les huit
		// clés racines, et huit seulement — une neuvième glissée ici échapperait à
		// la table d'audience.
		expect(Object.keys(session).sort()).toEqual(
			['dossier_id', 'dossier_maj', 'graine_alea', 'horloge', 'journal', 'memoire', 'monde', 'schema'].sort(),
		)
	})

	it('une entree de journal SANS deltas reste legale — undefined n est pas []', () => {
		// KR-251 : tout champ de session ajouté après le premier lot `contrat` est
		// OPTIONNEL À VIE — `schema: 1` n'a aucun chemin de migration, et la session est
		// PERSISTÉE depuis l'itération 1. Une entrée écrite par l'itération 2, relue
		// telle quelle, doit rester lisible sans convertisseur.
		//
		// `undefined` ET `[]` NE SONT PAS LE MÊME ÉTAT, et c'est la distinction que ce
		// témoin épingle : « cette entrée n'a demandé aucun effet » n'est pas « cette
		// entrée a demandé zéro effet ». `toEqual` ne les sépare pas ; `in` si.
		const it2: EntreeJournal = { tour: 1, role: 'moteur', texte: 'lieu_courant : lieu.a → lieu.b', origine: 'aller' }
		const it3: EntreeJournal = {
			tour: 1,
			role: 'moteur',
			texte: 'jalons_atteints : jalon.premiere-nuit',
			deltas: [{ delta: 'atteindre_jalon', cibles: ['jalon.premiere-nuit'], effet: 'applique' }],
		}

		expect('deltas' in it2).toBe(false)
		expect(it2.deltas).toBeUndefined()
		// Le ROUND-TRIP de persistance : la clé absente le reste, elle ne se remplit pas
		// d'un tableau vide au passage.
		const relue = JSON.parse(JSON.stringify([it2, it3])) as EntreeJournal[]
		expect('deltas' in relue[0]).toBe(false)
		expect(relue[0]).toEqual(it2)

		// Discriminance (KR-199) : la clé PRÉSENTE survit au même round-trip. Sans cette
		// moitié, les lignes ci-dessus seraient vraies d'un champ que rien n'écrit.
		expect('deltas' in relue[1]).toBe(true)
		expect(relue[1]).toEqual(it3)
	})

	it('elle est PURE — elle ne touche pas le dossier et rend un etat neuf a chaque appel', () => {
		// KR-169 : une propriété affirmée dans une docstring sans test est une
		// intention. « Pure, totale, synchrone » est écrit au contrat ; voici sa porte.
		const dossier = reecrit()
		const avant = JSON.stringify(dossier)

		const premiere = sessionDe(dossier)
		const seconde = sessionDe(dossier)

		expect(JSON.stringify(dossier)).toBe(avant)
		expect(seconde).toEqual(premiere)
		expect(seconde).not.toBe(premiere)
		expect(seconde.monde).not.toBe(premiere.monde)
	})
})

describe('EtatSession.memoire — la forme gelee par la n 10 it3', () => {
	it('I1 — l ouverture ecrit null, jamais un objet vide, sur les DEUX fixtures', () => {
		// « Rien retenu » n'a qu'UNE représentation. Un `{ faits_etablis: [] }` à l'ouverture
		// serait un second encodage de `null`, que chaque lecteur devrait ramener au premier.
		for (const dossier of [dossierMinimal(), dossierReference()]) {
			const session = sessionDe(dossier)
			expect(session.memoire).toBeNull()
			expect('memoire' in session).toBe(true)
		}
	})

	it('KR-251 — une session ecrite AVANT l it3 (memoire: null) reste legale, et la cle est toujours la', () => {
		// Le type est ÉLARGI, aucun champ n'est ajouté : une session persistée par la n° 9 ou
		// par l'it2 se relit telle quelle, sans convertisseur.
		const ecriteEnIt2: EtatSession = JSON.parse(JSON.stringify(sessionDe(reecrit(), 7))) as EtatSession
		expect(ecriteEnIt2.memoire).toBeNull()
		expect(Object.keys(ecriteEnIt2)).toContain('memoire')
	})

	it('un resume ABSENT le reste au round-trip de persistance — undefined n est jamais null', () => {
		// `resume?` et JAMAIS `resume: null` (précédent `attente?`) : un résumé qui n'existe pas
		// n'est pas un résumé vide. `toEqual` ne sépare pas absent et `undefined` ; `in`, si.
		const sansResume: EtatSession['memoire'] = { faits_etablis: [{ fait: 'Le foyer fume.', sur: ['lieu.x'] }] }
		const avecResume: EtatSession['memoire'] = {
			faits_etablis: [],
			resume: { texte: 'Vous avez veillé.', jusqu_au_pas: 10 },
		}

		const relus = JSON.parse(JSON.stringify([sansResume, avecResume])) as Array<NonNullable<EtatSession['memoire']>>

		expect('resume' in relus[0]).toBe(false)
		expect(relus[0]).toEqual(sansResume)
		// Discriminance (KR-199) : la clé PRÉSENTE survit au même round-trip, pointeur compris.
		expect(relus[1].resume).toEqual({ texte: 'Vous avez veillé.', jusqu_au_pas: 10 })
	})
})

describe('fixerHeros — le seul ecrivain de EtatSession.heros (n 11 moteur-arbitre, lot contrat)', () => {
	/** Un `HeroState` plausible — non `défaut` (`defaultHero`), pour que cette
	 *  instance ne se confonde jamais avec un héros jamais vraiment construit. */
	const HEROS: HeroState = {
		name: 'Aldric le Téméraire',
		caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
		pvMax: 21,
		pv: 14,
		peMax: 8,
		pe: 3,
		mcBonus: 0,
		xp: 12,
	}

	it('ecrit heros PAR REFERENCE, et laisse le reste de la session intact', () => {
		const session = sessionDe(reecrit(), 7)

		const avecHeros = fixerHeros(session, HEROS)

		// RÉFÉRENCE, jamais une copie : une copie égale au bon argument passerait
		// `toEqual` mais ne prouverait pas que c'est bien CE `HeroState`, sans
		// seconde forme (§ 4 du plan).
		expect(avecHeros.heros).toBe(HEROS)
		// RIEN D'AUTRE N'A CHANGÉ : la session rendue est l'argument, plus la seule
		// clé `heros`.
		expect(avecHeros).toEqual({ ...session, heros: HEROS })

		// PURE : l'argument n'est pas muté, et il ne portait pas la clé avant.
		expect('heros' in session).toBe(false)
		expect(session.heros).toBeUndefined()
	})

	it('la session d ouverture ne porte jamais heros — la cle reste ABSENTE, jamais undefined', () => {
		// KR-251 : avant ce lot, aucune session n'a jamais porté `heros` — et
		// `ouvrirSession` elle-même ne l'écrit toujours pas (seul `fixerHeros` le
		// peut). `in`, jamais `toBeUndefined` seul : une clé PRÉSENTE à `undefined`
		// passerait `toBeUndefined`, mais pas `'heros' in session === false`.
		const session = sessionDe(reecrit(), 1)

		expect('heros' in session).toBe(false)
		expect(Object.keys(session)).not.toContain('heros')
	})
})

describe('consignerJet — le seul ecrivain de EntreeJournal.jet (n 11 moteur-arbitre, lot contrat, it2)', () => {
	/** La session APRÈS une commande `agir` acceptée — l'entrée moteur qui porte
	 *  `origine` pour CE tour est celle que `consignerJet` doit trouver. */
	function apresAgir(dossier: Dossier, graine = 7): EtatSession {
		const ouverte = sessionDe(dossier, graine)
		const resultat = executerCommande(dossier, ouverte, { commande: 'agir', cibles: [] })
		if (!resultat.ok) throw new Error(`commande refusée (${resultat.refus}) : ${resultat.message}`)
		return resultat.session
	}

	function entreeMoteurDuPas(session: EtatSession, tour: number): EntreeJournal | undefined {
		return session.journal.find(
			(entree) => entree.tour === tour && entree.role === 'moteur' && entree.origine !== undefined,
		)
	}

	it('attache jet a l entree moteur qui porte origine pour CE tour, laisse le reste intact', () => {
		const session = apresAgir(reecrit())
		const tour = session.horloge.tour

		const avecJet = consignerJet(session, tour, { carac: 'FO', tc: 'TC2' })

		expect(entreeMoteurDuPas(avecJet, tour)?.jet).toEqual({ carac: 'FO', tc: 'TC2' })
		// RIEN D'AUTRE N'A CHANGÉ : l'entrée JOUEUR du même pas reste identique, et le
		// reste de la session aussi.
		expect(avecJet.journal[0]).toEqual(session.journal[0])
		expect({ ...avecJet, journal: session.journal }).toEqual(session)
		// PURE : l'argument n'est pas muté.
		expect(entreeMoteurDuPas(session, tour)?.jet).toBeUndefined()
	})

	it('EntreeJournal.jet ne porte QUE carac et tc — jamais lieu_id, jamais la prose, jamais marge/issue (§ 8 #4 du plan it2)', () => {
		const session = apresAgir(reecrit())
		const tour = session.horloge.tour

		const avecJet = consignerJet(session, tour, { carac: 'SE', tc: 'TC3' })
		const jet = entreeMoteurDuPas(avecJet, tour)?.jet

		expect(jet).toEqual({ carac: 'SE', tc: 'TC3' })
		expect(Object.keys(jet ?? {}).sort()).toEqual(['carac', 'tc'])
	})

	it('sans entree moteur pour ce tour, la session est rendue INCHANGEE — rien a quoi attacher le jet', () => {
		const session = apresAgir(reecrit())

		const inchangee = consignerJet(session, 999, { carac: 'FO', tc: 'TC1' })

		expect(inchangee).toEqual(session)
		expect(inchangee.journal.some((entree) => entree.jet !== undefined)).toBe(false)
	})

	it('un second appel, sur un tour different, n ecrase pas le jet du premier (au plus un jet par pas)', () => {
		const dossier = reecrit()
		const premierPas = apresAgir(dossier)
		const resultatSecond = executerCommande(dossier, premierPas, { commande: 'agir', cibles: [] })
		if (!resultatSecond.ok) throw new Error('second agir refusé')
		const secondPas = resultatSecond.session

		const avecPremierJet = consignerJet(secondPas, premierPas.horloge.tour, { carac: 'FO', tc: 'TC1' })
		const avecLesDeux = consignerJet(avecPremierJet, secondPas.horloge.tour, { carac: 'CA', tc: 'TC4' })

		expect(entreeMoteurDuPas(avecLesDeux, premierPas.horloge.tour)?.jet).toEqual({ carac: 'FO', tc: 'TC1' })
		expect(entreeMoteurDuPas(avecLesDeux, secondPas.horloge.tour)?.jet).toEqual({ carac: 'CA', tc: 'TC4' })
	})
})

describe('crediterXp — la seule ecrivaine de HeroState.xp (n 11 moteur-arbitre, lot contrat, it3)', () => {
	const HEROS_XP: HeroState = {
		name: 'Aldric le Temeraire',
		caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
		pvMax: 21,
		pv: 14,
		peMax: 8,
		pe: 3,
		mcBonus: 0,
		xp: 12,
	}

	it('credite heros.xp du montant exact, et laisse TOUT le reste intact', () => {
		const session = fixerHeros(sessionDe(reecrit(), 7), HEROS_XP)

		const creditee = crediterXp(session, 5)

		expect(creditee.heros?.xp).toBe(17)
		// RIEN D AUTRE N A CHANGE : la session renvoyee est l argument, plus la
		// seule feuille heros.xp — temoin negatif sur les AUTRES feuilles du heros.
		expect(creditee).toEqual({ ...session, heros: { ...HEROS_XP, xp: 17 } })
		expect(creditee.heros?.pv).toBe(HEROS_XP.pv)
		expect(creditee.heros?.pe).toBe(HEROS_XP.pe)
		expect(creditee.heros?.caracs).toEqual(HEROS_XP.caracs)

		// PURE : l argument n est pas mute.
		expect(session.heros?.xp).toBe(12)
	})

	it('no-op (meme reference) sans heros', () => {
		const sansHeros = sessionDe(reecrit(), 7)
		expect('heros' in sansHeros).toBe(false)

		expect(crediterXp(sansHeros, 5)).toBe(sansHeros)
	})

	it('no-op (meme reference) sur xp <= 0 — 0 et un montant negatif ne sont jamais crediter ici', () => {
		const session = fixerHeros(sessionDe(reecrit(), 7), HEROS_XP)

		expect(crediterXp(session, 0)).toBe(session)
		expect(crediterXp(session, -3)).toBe(session)
	})
})

/**
 * `crediterConfiance` — LA SEULE ÉCRIVAINE de `EtatPnj.confiance` (n° 12
 * `moteur-acteurs`, lot `contrat`, it3 — `docs/REGLES-DU-JEU.md` § 6). § 7 du
 * plan d'itération : « session.test.ts — crediterConfiance, saturation » et
 * « session.test.ts / revelation.test.ts — défaut ».
 */
describe('crediterConfiance — la seule ecrivaine de EtatPnj.confiance (n 12 moteur-acteurs, lot contrat, it3)', () => {
	const PNJ = 'pnj.harek-le-forgeron'

	it('credite le delta exact depuis CONFIANCE_DEPART quand le PNJ n a jamais ete credite (critere #4 du plan)', () => {
		const session = sessionDe(reecrit(), 7)
		expect(session.monde.pnj).toEqual({})

		const creditee = crediterConfiance(session, PNJ, 1)

		expect(creditee.monde.pnj[PNJ]).toEqual({ a_dit: [], confiance: 1 })
		// RIEN D AUTRE N A CHANGE : la session renvoyee est l argument, plus la
		// seule feuille monde.pnj[PNJ].confiance.
		expect({ ...creditee, monde: session.monde }).toEqual(session)
		// PURE : l argument n est pas mute.
		expect(session.monde.pnj[PNJ]).toBeUndefined()
	})

	it('sature a CONFIANCE_MIN : -3 + (-1) reste -3 (critere #3 du plan, DEUX bornes)', () => {
		const base = sessionDe(reecrit(), 7)
		const auPlancher: EtatSession = { ...base, monde: { ...base.monde, pnj: { [PNJ]: { a_dit: [], confiance: -3 } } } }

		expect(crediterConfiance(auPlancher, PNJ, -1).monde.pnj[PNJ]?.confiance).toBe(-3)
	})

	it('sature a CONFIANCE_MAX : +3 + (+1) reste +3 (critere #3 du plan, DEUX bornes)', () => {
		const base = sessionDe(reecrit(), 7)
		const auPlafond: EtatSession = { ...base, monde: { ...base.monde, pnj: { [PNJ]: { a_dit: [], confiance: 3 } } } }

		expect(crediterConfiance(auPlafond, PNJ, 1).monde.pnj[PNJ]?.confiance).toBe(3)
	})

	it('preserve a_dit deja ecrit — jamais un ecrasement litteral (precedent avecIndiceConfie, recit.ts)', () => {
		const base = sessionDe(reecrit(), 7)
		const avecSavoir: EtatSession = {
			...base,
			monde: { ...base.monde, pnj: { [PNJ]: { a_dit: ['indice.sceau-brise-a-nouveau'] } } },
		}

		const creditee = crediterConfiance(avecSavoir, PNJ, 1)

		expect(creditee.monde.pnj[PNJ]).toEqual({ a_dit: ['indice.sceau-brise-a-nouveau'], confiance: 1 })
	})

	it('no-op (meme reference) quand delta vaut 0, meme sans aucune entree pour ce PNJ', () => {
		const session = sessionDe(reecrit(), 7)

		expect(crediterConfiance(session, PNJ, 0)).toBe(session)
	})

	it('no-op (meme reference) quand delta vaut 0 ET qu une entree existe deja', () => {
		const base = sessionDe(reecrit(), 7)
		const session: EtatSession = { ...base, monde: { ...base.monde, pnj: { [PNJ]: { a_dit: [], confiance: 2 } } } }

		expect(crediterConfiance(session, PNJ, 0)).toBe(session)
	})
})

/**
 * LE COMBAT EN SESSION (n° 13 `moteur-combat`, it1 puis it2, lots `contrat`) — QUATRE
 * PORTES D'ÉCRITURE de `EtatSession.combat`, et rien d'autre (`fuirRencontre` depuis
 * l'it2).
 *
 * LES VALEURS ATTENDUES SONT ÉCRITES À LA MAIN depuis le contrat du plan (§ 4,
 * « Sémantique `cloreCombat` ») et, pour la fuite, depuis `docs/REGLES-PLAY.md` D5
 * (PV et PE du bilan écrêtés aux plafonds INTACTS, aucune XP, aucun déplacement),
 * jamais lues dans ce que le code rend : un attendu
 * recopié d'un `received` figerait le défaut au lieu de le verrouiller. Ces
 * fonctions ne sont pas dans le périmètre muté (KR-243) : `jest` est leur UNIQUE
 * instrument, d'où des assertions de VALEUR — PV, PE, plafonds, XP — et non de
 * déroulé.
 *
 * LE HÉROS EST FIXE ET NON DÉFAUT sur tous les axes (pv ≠ pvMax, pe ≠ peMax,
 * xp ≠ 0) : un héros frais rendrait indistinguables « écrit » et « jamais touché ».
 */
describe('le combat en session — resoudreRencontre, jouerPosture, cloreCombat (n 13 moteur-combat, lot contrat)', () => {
	const HEROS_DE_COMBAT: HeroState = {
		name: 'Aldric le Temeraire',
		caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
		pvMax: 21,
		pv: 14,
		peMax: 8,
		pe: 3,
		mcBonus: 0,
		xp: 12,
	}
	const RENCONTRE = { evenement_id: 'evenement.embuscade-a-la-tour', monstre_ref: 'bestiaire.squelette' }

	/** La session d'un héros AU REPOS : une partie ouverte, un héros posé, aucun combat. */
	function auRepos(): EtatSession {
		return fixerHeros(sessionDe(dossierReference(), 7), HEROS_DE_COMBAT)
	}

	/** La même session, un combat OUVERT par le produit, puis les postures jouées par le produit. */
	function enCombat(postures: readonly Posture[] = []): EtatSession {
		return postures.reduce(jouerPosture, resoudreRencontre(auRepos(), RENCONTRE))
	}

	/** Un bilan de VICTOIRE par défaut, dont chaque test ne surcharge que ce qu'il mesure. */
	function bilan(issue: IssueCombat, surcharges: Partial<Omit<BilanCombat, 'issue'>> = {}): BilanCombat {
		return { issue, pv: 9, pe: 1, xp: 3, pv_max_delta: 0, pe_max_delta: 0, ...surcharges }
	}

	describe('resoudreRencontre — la seule porte qui POSE combat', () => {
		it('pose combat ET consomme l evenement, en UN retour — et ne touche ni l horloge ni le journal', () => {
			// CRITÈRE 1 DU PLAN, MOITIÉ SESSION. KR-295 : un combat n'ajoute AUCUN pas
			// d'horloge, il se greffe sur le pas de la commande qui l'a déclenché.
			const session = auRepos()

			const ouvert = resoudreRencontre(session, RENCONTRE)

			expect(ouvert.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: [] })
			expect(ouvert.monde.evenements_consommes).toEqual(['evenement.embuscade-a-la-tour'])
			// RIEN D'AUTRE N'A CHANGÉ : les autres feuilles du monde, et chaque autre racine
			// PAR RÉFÉRENCE — `toBe`, jamais `toEqual`, qui ne verrait pas une copie.
			expect({ ...ouvert.monde, evenements_consommes: session.monde.evenements_consommes }).toEqual(session.monde)
			expect(ouvert.horloge).toBe(session.horloge)
			expect(ouvert.journal).toBe(session.journal)
			expect(ouvert.heros).toBe(session.heros)
			expect(Object.keys(ouvert).sort()).toEqual([...Object.keys(session), 'combat'].sort())

			// PURE : l'argument n'est pas muté, et il ne portait ni la clé ni l'événement.
			expect('combat' in session).toBe(false)
			expect(session.monde.evenements_consommes).toEqual([])
		})

		it('AJOUTE a la liste des evenements deja consommes — jamais un ecrasement', () => {
			const base = auRepos()
			const session: EtatSession = { ...base, monde: { ...base.monde, evenements_consommes: ['evenement.passe'] } }

			expect(resoudreRencontre(session, RENCONTRE).monde.evenements_consommes).toEqual([
				'evenement.passe',
				'evenement.embuscade-a-la-tour',
			])
		})

		it('ne duplique pas un evenement deja consomme — semantique d ensemble, la liste est rendue telle quelle', () => {
			// Précédent `lieux_visites` / `avecAjout` : un identifiant déjà là n'est pas
			// ajouté deux fois, et la liste d'entrée n'est pas remplacée par une copie.
			const base = auRepos()
			const consommes = ['evenement.embuscade-a-la-tour']
			const session: EtatSession = { ...base, monde: { ...base.monde, evenements_consommes: consommes } }

			const ouvert = resoudreRencontre(session, RENCONTRE)

			expect(ouvert.monde.evenements_consommes).toBe(consommes)
			// Et le combat s'ouvre quand même : la consommation n'est pas une condition.
			expect(ouvert.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: [] })
		})

		it('no-op (meme reference) quand un combat existe — le premier n est jamais ecrase', () => {
			const ouvert = enCombat(['normale'])

			const second = resoudreRencontre(ouvert, { evenement_id: 'evenement.autre', monstre_ref: 'bestiaire.gobelin' })

			expect(second).toBe(ouvert)
			expect(second.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: ['normale'] })
			// ET LE SECOND ÉVÉNEMENT N'EST PAS CONSOMMÉ : un combat qui ne s'ouvre pas ne
			// consomme rien.
			expect(second.monde.evenements_consommes).not.toContain('evenement.autre')
		})

		it('no-op (meme reference) sans heros — et la cle combat reste ABSENTE', () => {
			const sansHeros = sessionDe(dossierReference(), 7)
			expect('heros' in sansHeros).toBe(false)

			const resultat = resoudreRencontre(sansHeros, RENCONTRE)

			expect(resultat).toBe(sansHeros)
			expect('combat' in resultat).toBe(false)
			expect(resultat.monde.evenements_consommes).toEqual([])
		})

		it('la session d ouverture ne porte jamais combat — la cle reste ABSENTE, jamais undefined', () => {
			// KR-251 : `in`, jamais `toBeUndefined` seul — une clé PRÉSENTE à `undefined`
			// passerait `toBeUndefined`, mais pas `'combat' in session === false`.
			const session = sessionDe(reecrit(), 1)

			expect('combat' in session).toBe(false)
			expect(Object.keys(session)).not.toContain('combat')
		})

		it('le renvoi de rejeu survit au round-trip de persistance, postures dans l ordre', () => {
			// KR-292 : seuls `monstre_ref` et `postures[]` sont stockés. L'ORDRE est
			// l'information — le rejeu consomme les postures round après round.
			const session = enCombat(['precise', 'normale', 'defensive'])

			const relue = JSON.parse(JSON.stringify(session)) as EtatSession

			expect(relue.combat).toEqual({
				monstre_ref: 'bestiaire.squelette',
				postures: ['precise', 'normale', 'defensive'],
			})
			expect(relue).toEqual(session)
		})
	})

	describe('jouerPosture — la seule porte qui ETEND postures', () => {
		it('ajoute la posture a la FIN : postures.length + 1, et l ordre des choix est conserve', () => {
			const avant = enCombat(['precise'])

			const apres = jouerPosture(avant, 'defensive')
			const encore = jouerPosture(apres, 'normale')

			expect(apres.combat?.postures).toEqual(['precise', 'defensive'])
			expect(apres.combat?.postures.length).toBe((avant.combat?.postures.length ?? 0) + 1)
			expect(encore.combat?.postures).toEqual(['precise', 'defensive', 'normale'])
			// PURE : ni `avant` ni `apres` ne sont mutés.
			expect(avant.combat?.postures).toEqual(['precise'])
			expect(apres.combat?.postures).toEqual(['precise', 'defensive'])
		})

		it('ne touche que postures — monstre_ref et chaque autre racine, PAR REFERENCE', () => {
			const avant = enCombat(['normale'])

			const apres = jouerPosture(avant, 'precise')

			expect(apres.combat?.monstre_ref).toBe('bestiaire.squelette')
			expect(apres.monde).toBe(avant.monde)
			expect(apres.horloge).toBe(avant.horloge)
			expect(apres.journal).toBe(avant.journal)
			expect(apres.heros).toBe(avant.heros)
			expect(Object.keys(apres.combat ?? {}).sort()).toEqual(['monstre_ref', 'postures'])
		})

		it('accepte CHAQUE posture du registre — balayage depuis POSTURE_VALUES, jamais trois litteraux', () => {
			// KR-117/199 : une posture de plus au registre entre ici sans qu'on y pense.
			expect(POSTURE_VALUES.length).toBeGreaterThan(0)
			for (const posture of POSTURE_VALUES) {
				const apres = jouerPosture(enCombat(), posture)
				expect(`${posture} → ${apres.combat?.postures.join(',')}`).toBe(`${posture} → ${posture}`)
			}
		})

		it('no-op (meme reference) sans combat — jamais un combat invente', () => {
			const session = auRepos()

			const resultat = jouerPosture(session, 'normale')

			expect(resultat).toBe(session)
			expect('combat' in resultat).toBe(false)
		})

		it('jouerPosture apres fuite rend la meme reference', () => {
			// KR-297, D5 : la fuite est TERMINALE — aucune posture ne se joue après. Balayage
			// depuis `POSTURE_VALUES` (KR-117/199) : un no-op prouvé sur UNE posture laisserait
			// les autres s'ajouter derrière une fuite.
			const fuie = fuirRencontre(enCombat(['precise', 'normale']))
			expect(fuie.combat?.fuite).toBe(true)

			expect(POSTURE_VALUES.length).toBeGreaterThan(0)
			for (const posture of POSTURE_VALUES) {
				const apres = jouerPosture(fuie, posture)
				expect(`${posture} → ${apres === fuie}`).toBe(`${posture} → true`)
			}
			// Et RIEN n'a bougé sous la référence : les postures sont celles d'avant la fuite.
			expect(fuie.combat?.postures).toEqual(['precise', 'normale'])

			// DISCRIMINANT, DANS LE MÊME TEST : la MÊME posture, sur la MÊME session sans
			// `fuite`, est ajoutée — c'est `fuite` qui coupe, et rien d'autre.
			const avantFuite = enCombat(['precise', 'normale'])
			const etendue = jouerPosture(avantFuite, 'defensive')
			expect(etendue).not.toBe(avantFuite)
			expect(etendue.combat?.postures).toEqual(['precise', 'normale', 'defensive'])
		})
	})

	describe('fuirRencontre — la seule porte qui POSE fuite (it2, KR-297, D5)', () => {
		it('fuirRencontre pose fuite et ne touche ni postures ni monde ni horloge ni journal ni heros', () => {
			const avant = enCombat(['precise', 'defensive'])
			// AVANT : la clé est ABSENTE, jamais `false` ni `undefined` (KR-251) — `in`, que
			// `toEqual` ne voit pas (il traite une clé à `undefined` comme absente).
			expect('fuite' in (avant.combat ?? {})).toBe(false)

			const apres = fuirRencontre(avant)

			expect(apres.combat?.fuite).toBe(true)
			expect(apres.combat).toEqual({
				monstre_ref: 'bestiaire.squelette',
				postures: ['precise', 'defensive'],
				fuite: true,
			})
			expect(Object.keys(apres.combat ?? {}).sort()).toEqual(['fuite', 'monstre_ref', 'postures'])
			// RIEN D'AUTRE N'A BOUGÉ — PAR RÉFÉRENCE (`toBe`), jamais `toEqual`, qui ne verrait
			// pas une copie. Ni le lieu courant : la fuite ne déplace pas le héros (D5).
			expect(apres.combat?.postures).toBe(avant.combat?.postures)
			expect(apres.monde).toBe(avant.monde)
			expect(apres.horloge).toBe(avant.horloge)
			expect(apres.journal).toBe(avant.journal)
			expect(apres.heros).toBe(avant.heros)
			expect(apres.monde.lieu_courant).toBe(avant.monde.lieu_courant)
			expect(Object.keys(apres).sort()).toEqual(Object.keys(avant).sort())
			// L'événement RESTE consommé (D5) : la fuite ne le rend pas.
			expect(apres.monde.evenements_consommes).toEqual(['evenement.embuscade-a-la-tour'])

			// PURE : l'argument n'est pas muté — ni sa session, ni son `combat`.
			expect(apres).not.toBe(avant)
			expect(apres.combat).not.toBe(avant.combat)
			expect('fuite' in (avant.combat ?? {})).toBe(false)
			expect(avant.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: ['precise', 'defensive'] })
		})

		it('fuir au debut d un round : sans aucune posture jouee, la fuite se pose quand meme', () => {
			// D5 : « au début d'un round, tant que le combat est en cours » — le premier round
			// l'est aussi. `postures` reste la liste vide, la MÊME.
			const ouvert = enCombat()
			expect(ouvert.combat?.postures).toEqual([])

			const fuie = fuirRencontre(ouvert)

			expect(fuie.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: [], fuite: true })
			expect(fuie.combat?.postures).toBe(ouvert.combat?.postures)
		})

		it('fuirRencontre sans combat rend la meme reference', () => {
			const session = auRepos()

			const resultat = fuirRencontre(session)

			expect(resultat).toBe(session)
			// Jamais un combat inventé : en poser un ouvrirait un combat sans monstre.
			expect('combat' in resultat).toBe(false)
		})

		it('fuirRencontre deux fois rend la meme reference', () => {
			const fuie = fuirRencontre(enCombat(['normale']))
			// Discriminant : la PREMIÈRE fuite a bien écrit, sinon « idempotente » serait vraie
			// d'une fonction qui ne fait jamais rien.
			expect(fuie.combat?.fuite).toBe(true)

			const encore = fuirRencontre(fuie)

			expect(encore).toBe(fuie)
			expect(encore.combat).toBe(fuie.combat)
		})

		it('la fuite survit au round-trip de persistance — et la cle fuite reste absente tant qu on n a pas fui', () => {
			// KR-292 : `fuite` est une ENTRÉE du joueur, stockée avec `postures`, dans l'ordre
			// où le rejeu la consomme. L'issue `hero-fled`, elle, n'est PAS stockée (KR-013).
			const fuie = fuirRencontre(enCombat(['precise', 'normale']))

			const relue = JSON.parse(JSON.stringify(fuie)) as EtatSession

			expect(relue).toEqual(fuie)
			expect(relue.combat?.fuite).toBe(true)
			expect(JSON.stringify(fuie)).not.toContain('hero-fled')
			// ET SANS FUITE, la clé n'apparaît pas dans le JSON : ni `false`, ni `null`.
			expect(JSON.stringify(enCombat(['precise']).combat)).toBe(
				'{"monstre_ref":"bestiaire.squelette","postures":["precise"]}',
			)
		})
	})

	describe('cloreCombat — la seule porte qui RETIRE combat', () => {
		it('victoire : PV, PE et XP exacts, combat RETIRE, le reste du heros et de la session intact', () => {
			// 14/21 PV, 3/8 PE, 12 XP → le bilan dit 9 PV, 1 PE, +3 XP, plafonds inchangés.
			const session = enCombat(['normale', 'precise'])

			const close = cloreCombat(session, bilan('hero-victory', { pv: 9, pe: 1, xp: 3 }))

			expect(close.heros).toEqual({ ...HEROS_DE_COMBAT, pv: 9, pe: 1, xp: 15 })
			expect(close.heros?.pvMax).toBe(21)
			expect(close.heros?.peMax).toBe(8)
			// LA CLÉ EST RETIRÉE, JAMAIS POSÉE À `undefined` (KR-251).
			expect('combat' in close).toBe(false)
			expect(Object.keys(close)).not.toContain('combat')
			expect(JSON.stringify(close)).not.toContain('combat')
			// AUCUN PAS D'HORLOGE, AUCUNE LIGNE DE JOURNAL, L'ÉVÉNEMENT RESTE CONSOMMÉ.
			expect(close.horloge).toBe(session.horloge)
			expect(close.journal).toBe(session.journal)
			expect(close.monde).toBe(session.monde)
			expect(close.monde.evenements_consommes).toEqual(['evenement.embuscade-a-la-tour'])
			// PURE : l'argument garde son combat et son héros d'avant.
			expect(session.combat?.postures).toEqual(['normale', 'precise'])
			expect(session.heros).toEqual(HEROS_DE_COMBAT)
		})

		it('monster-fled : la MEME resolution que la victoire, valeur par valeur', () => {
			const surcharges = { pv: 9, pe: 1, xp: 3, pv_max_delta: -2, pe_max_delta: 1 }

			const victoire = cloreCombat(enCombat(), bilan('hero-victory', surcharges))
			const fuite = cloreCombat(enCombat(), bilan('monster-fled', surcharges))

			expect(fuite).toEqual(victoire)
			// Et les valeurs sont celles attendues, pas seulement égales entre elles :
			// pvMax 21 − 2 = 19, peMax 8 + 1 = 9, xp 12 + 3 = 15.
			expect(fuite.heros).toEqual({ ...HEROS_DE_COMBAT, pvMax: 19, peMax: 9, pv: 9, pe: 1, xp: 15 })
			expect('combat' in fuite).toBe(false)
		})

		it('l XP passe par crediterXp : un gain de 0 laisse xp intact, un gain de 5 le porte a 17', () => {
			// `crediterXp` est la SEULE porte de `heros.xp` : son no-op (`xp <= 0`) est donc
			// observable ICI — un `+ bilan.xp` écrit en direct rendrait aussi 12, mais un
			// gain NÉGATIF, lui, ne doit JAMAIS retirer d'XP.
			expect(cloreCombat(enCombat(), bilan('hero-victory', { xp: 0 })).heros?.xp).toBe(12)
			expect(cloreCombat(enCombat(), bilan('hero-victory', { xp: 5 })).heros?.xp).toBe(17)
			expect(cloreCombat(enCombat(), bilan('hero-victory', { xp: -4 })).heros?.xp).toBe(12)
		})

		it('les plafonds bougent de delta, les jauges sont ECRETEES au plafond neuf — jamais relevees par lui', () => {
			// (pvMax 21, peMax 8), delta (-2, -1) → (19, 7). Le bilan dit 20 PV et 8 PE :
			// au-dessus des plafonds neufs, donc écrêtés.
			const reduit = cloreCombat(
				enCombat(),
				bilan('hero-victory', { pv: 20, pe: 8, pv_max_delta: -2, pe_max_delta: -1 }),
			)
			expect(reduit.heros).toMatchObject({ pvMax: 19, peMax: 7, pv: 19, pe: 7 })

			// Sous le plafond neuf, la jauge reste ce que le bilan dit : jamais remontée.
			const basse = cloreCombat(enCombat(), bilan('hero-victory', { pv: 5, pe: 2, pv_max_delta: -2, pe_max_delta: -1 }))
			expect(basse.heros).toMatchObject({ pvMax: 19, peMax: 7, pv: 5, pe: 2 })

			// Un plafond RELEVÉ ne relève pas la jauge : (21, 8) + (3, 2) → (24, 10), pv/pe du bilan.
			const releve = cloreCombat(enCombat(), bilan('hero-victory', { pv: 9, pe: 1, pv_max_delta: 3, pe_max_delta: 2 }))
			expect(releve.heros).toMatchObject({ pvMax: 24, peMax: 10, pv: 9, pe: 1 })

			// Un bilan AU-DESSUS des plafonds SANS variation est écrêté aux plafonds d'origine.
			const trop = cloreCombat(enCombat(), bilan('hero-victory', { pv: 25, pe: 12 }))
			expect(trop.heros).toMatchObject({ pvMax: 21, peMax: 8, pv: 21, pe: 8 })
		})

		it('plancher 1 sur pvMax et peMax : A LA LIMITE (1) et LIMITE+1 (0), jamais en dessous', () => {
			// pvMax 21 : delta −19 → 2 ; −20 → 1 (la limite) ; −21 → 0 attendu, plancher → 1 ;
			// −30 → plancher → 1. peMax 8 : −6 → 2 ; −7 → 1 ; −8 → 0 → 1 ; −20 → 1.
			// Le bilan dit 9 PV et 1 PE : la jauge est écrêtée au plafond PLANCHÉ (2 PV au
			// premier cas, 1 ensuite), jamais laissée au-dessus de lui. TOUT EST ÉCRIT EN
			// LITTÉRAL — aucun `Math.min` dans l'attendu, qui recopierait l'implémentation.
			const CAS: ReadonlyArray<
				readonly [pvDelta: number, peDelta: number, pvMax: number, peMax: number, pv: number, pe: number]
			> = [
				[-19, -6, 2, 2, 2, 1],
				[-20, -7, 1, 1, 1, 1],
				[-21, -8, 1, 1, 1, 1],
				[-30, -20, 1, 1, 1, 1],
			]
			for (const [pvDelta, peDelta, pvMax, peMax, pv, pe] of CAS) {
				const close = cloreCombat(enCombat(), bilan('hero-victory', { pv_max_delta: pvDelta, pe_max_delta: peDelta }))
				expect(
					`${pvDelta}/${peDelta} → ${close.heros?.pvMax}/${close.heros?.peMax} ${close.heros?.pv}/${close.heros?.pe}`,
				).toBe(`${pvDelta}/${peDelta} → ${pvMax}/${peMax} ${pv}/${pe}`)
			}
		})

		it('inconscient : pv = 1 quel que soit le bilan, PE du bilan, AUCUNE XP, plafonds INTACTS, combat retire', () => {
			// Le bilan d'un héros à terre porte un PV ≤ 0 : il n'est PAS écrit. Ni son XP
			// (5), ni ses variations de plafonds (−3, −2), qui ne sont pas des gains d'une
			// victoire.
			const close = cloreCombat(
				enCombat(['defensive']),
				bilan('hero-survived-unconscious', { pv: -2, pe: 1, xp: 5, pv_max_delta: -3, pe_max_delta: -2 }),
			)

			expect(close.heros).toEqual({ ...HEROS_DE_COMBAT, pv: 1, pe: 1 })
			expect(close.heros?.xp).toBe(12)
			expect(close.heros?.pvMax).toBe(21)
			expect(close.heros?.peMax).toBe(8)
			expect('combat' in close).toBe(false)

			// PE écrêtée au plafond (INCHANGÉ à 8) : un bilan de 99 n'ouvre pas de réserve.
			expect(cloreCombat(enCombat(), bilan('hero-survived-unconscious', { pv: 0, pe: 99 })).heros?.pe).toBe(8)
		})

		it('cloreCombat hero-fled retire combat, ecrete pv et pe, aucune xp, plafonds intacts', () => {
			// D5 : le héros sort du combat avec ses PV RESTANTS — jamais remis à 1 (c'est
			// l'inconscient), jamais relevé. Héros : 14/21 PV, 3/8 PE, 12 XP. Le bilan dit
			// 6 PV, 2 PE, et PORTE un gain d'XP (5) et des variations de plafonds (−3, −2) que
			// la fuite n'emporte PAS : ce ne sont pas les gains d'une victoire.
			const session = fuirRencontre(enCombat(['normale', 'precise']))

			const close = cloreCombat(
				session,
				bilan('hero-fled', { pv: 6, pe: 2, xp: 5, pv_max_delta: -3, pe_max_delta: -2 }),
			)

			expect(close.heros).toEqual({ ...HEROS_DE_COMBAT, pv: 6, pe: 2 })
			expect(close.heros?.xp).toBe(12)
			expect(close.heros?.pvMax).toBe(21)
			expect(close.heros?.peMax).toBe(8)
			// LA CLÉ `combat` EST RETIRÉE — et `fuite` avec elle, qui n'a pas d'existence propre.
			expect('combat' in close).toBe(false)
			expect(Object.keys(close)).not.toContain('combat')
			expect(JSON.stringify(close)).not.toContain('combat')
			expect(JSON.stringify(close)).not.toContain('fuite')
			// PURE : l'argument garde son combat, sa fuite et son héros d'avant.
			expect(session.combat?.fuite).toBe(true)
			expect(session.heros).toEqual(HEROS_DE_COMBAT)

			// PV ≠ 1 : le PV du bilan est CELUI qui est écrit, à la limite basse comme plus haut.
			expect(cloreCombat(session, bilan('hero-fled', { pv: 1, pe: 0 })).heros).toMatchObject({ pv: 1, pe: 0 })
			expect(cloreCombat(session, bilan('hero-fled', { pv: 13, pe: 7 })).heros).toMatchObject({ pv: 13, pe: 7 })

			// ÉCRÊTAGE AUX PLAFONDS INTACTS (21 PV, 8 PE), à la limite (=) et à limite+1.
			expect(cloreCombat(session, bilan('hero-fled', { pv: 21, pe: 8 })).heros).toMatchObject({ pv: 21, pe: 8 })
			expect(cloreCombat(session, bilan('hero-fled', { pv: 22, pe: 9 })).heros).toMatchObject({ pv: 21, pe: 8 })
			expect(cloreCombat(session, bilan('hero-fled', { pv: 99, pe: 99 })).heros).toMatchObject({ pv: 21, pe: 8 })

			// PLAFONDS INTACTS MÊME SOUS UNE VARIATION : un plafond baissé de 3 (21 → 18)
			// écrêterait 20 PV à 18 ; ici 20 PV restent 20. Et un plafond relevé de 3 (→ 24)
			// n'ouvre pas 24 PV : 22 PV restent écrêtés à 21.
			expect(
				cloreCombat(session, bilan('hero-fled', { pv: 20, pe: 7, pv_max_delta: -3, pe_max_delta: -2 })).heros,
			).toEqual({
				...HEROS_DE_COMBAT,
				pv: 20,
				pe: 7,
			})
			expect(
				cloreCombat(session, bilan('hero-fled', { pv: 22, pe: 9, pv_max_delta: 3, pe_max_delta: 2 })).heros,
			).toEqual({
				...HEROS_DE_COMBAT,
				pv: 21,
				pe: 8,
			})
		})

		it('cloreCombat hero-fled laisse monde horloge journal identiques', () => {
			// D5 : « reste au lieu courant : aucun déplacement ». `lieu_courant` vit dans `monde`,
			// et `monde` est la MÊME référence — donc ni le lieu, ni les lieux visités, ni
			// l'événement consommé n'ont bougé. Un combat est UN pas d'horloge, déjà consommé.
			const session = fuirRencontre(enCombat(['normale']))

			const close = cloreCombat(session, bilan('hero-fled', { pv: 6, pe: 2 }))

			expect(close.monde).toBe(session.monde)
			expect(close.horloge).toBe(session.horloge)
			expect(close.journal).toBe(session.journal)
			expect(close.monde.lieu_courant).toBe(session.monde.lieu_courant)
			expect(close.monde.evenements_consommes).toEqual(['evenement.embuscade-a-la-tour'])
			// La session n'a perdu QUE `combat` : aucune autre racine n'a disparu ni paru.
			expect(Object.keys(close).sort()).toEqual(
				Object.keys(session)
					.filter((cle) => cle !== 'combat')
					.sort(),
			)
			// Aucune XP, et le héros n'a changé que dans ses deux jauges.
			expect(close.heros?.xp).toBe(12)
		})

		it('mort : la session est rendue A L IDENTIQUE, combat RESTE, et le heros n est pas touche', () => {
			// `hero-mort` est la seule issue qui NE CLÔT PAS — l'écran de fin est la n° 15.
			const session = enCombat(['normale', 'normale'])

			const resultat = cloreCombat(session, bilan('hero-mort', { pv: -10, pe: 0, xp: 5, pv_max_delta: -3 }))

			expect(resultat).toBe(session)
			expect(resultat.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: ['normale', 'normale'] })
			expect(resultat.heros).toEqual(HEROS_DE_COMBAT)
		})

		it('no-op (meme reference) SANS combat, quelle que soit l issue — rien a clore', () => {
			const session = auRepos()

			for (const issue of [
				'hero-victory',
				'monster-fled',
				'hero-survived-unconscious',
				'hero-mort',
				'hero-fled',
			] as const) {
				expect(cloreCombat(session, bilan(issue, { xp: 5 }))).toBe(session)
			}
			// Et l'XP n'a pas bougé : le no-op n'a RIEN écrit.
			expect(session.heros?.xp).toBe(12)
		})

		it('no-op (meme reference) SANS heros — un etat inatteignable par construction, garde par defense', () => {
			// `resoudreRencontre` n'ouvre rien sans héros ; une session forgée à la main
			// qui porterait `combat` seul n'a rien sur quoi appliquer un bilan.
			const sansHeros: EtatSession = {
				...sessionDe(dossierReference(), 7),
				combat: { monstre_ref: 'bestiaire.gobelin', postures: [] },
			}
			expect('heros' in sansHeros).toBe(false)

			const resultat = cloreCombat(sansHeros, bilan('hero-victory'))

			expect(resultat).toBe(sansHeros)
			expect('heros' in resultat).toBe(false)
		})

		it('CHAQUE issue du registre a un comportement : cinq issues, quatre retirent combat, une le garde', () => {
			// KR-117/199 : `Record<IssueCombat, …>` est EXHAUSTIF PAR COMPILATION — une
			// sixième issue ne compile pas tant que ce témoin n'a pas dit ce qu'elle fait.
			const COMPORTEMENT: Record<IssueCombat, 'retire' | 'garde'> = {
				'hero-victory': 'retire',
				'monster-fled': 'retire',
				'hero-survived-unconscious': 'retire',
				'hero-mort': 'garde',
				'hero-fled': 'retire',
			}
			const issues = Object.keys(COMPORTEMENT) as IssueCombat[]
			expect(issues).toHaveLength(5)

			for (const issue of issues) {
				const close = cloreCombat(enCombat(['normale']), bilan(issue))
				expect(`${issue} → ${'combat' in close ? 'garde' : 'retire'}`).toBe(`${issue} → ${COMPORTEMENT[issue]}`)
			}
		})

		it('EtatCombat ne represente aucun instantane (KR-292) — ni PV, ni round, ni posture hors registre, ni null', () => {
			// `@ts-expect-error` ÉCHOUE À LA COMPILATION si l'erreur attendue n'a PAS lieu :
			// c'est le seul instrument qui épingle une NON-représentabilité.

			// @ts-expect-error — un PV de monstre posé dans le renvoi de rejeu.
			const avecPv: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: [], pv: 7 }
			// @ts-expect-error — un round stocké : le rejeu le DÉRIVE de postures.length.
			const avecRound: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: [], round: 2 }
			// @ts-expect-error — une posture hors du registre fermé POSTURES.
			const horsRegistre: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: ['attaque'] }
			// @ts-expect-error — `combat` n'est JAMAIS `EtatCombat | null` : absent, ou présent.
			const nul: EtatSession['combat'] = null
			// @ts-expect-error — `fuite` est le littéral `true`, JAMAIS `false` (KR-251) : un
			// second état « pas de fuite » distinct de l'absence, que rien ne départagerait.
			const fuiteFausse: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: [], fuite: false }
			// @ts-expect-error — l'issue n'est PAS stockée : `hero-fled` se dérive du rejeu (KR-013).
			const avecIssue: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: [], issue: 'hero-fled' }

			// Discriminant : les formes LÉGALES compilent, elles — y compris l'ABSENCE, et la
			// fuite posée. Sans cette moitié, les directives seraient satisfaites par n'importe
			// quelle erreur de type.
			const legal: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: ['normale'] }
			const fuyant: EtatCombat = { monstre_ref: 'bestiaire.gobelin', postures: ['normale'], fuite: true }
			const absent: EtatSession['combat'] = undefined

			expect([avecPv, avecRound, horsRegistre, nul, fuiteFausse, avecIssue, legal, fuyant, absent]).toHaveLength(9)
		})
	})

	describe('le cycle complet — l evenement est consomme a l OUVERTURE, jamais a la cloture', () => {
		it('due → ouvert → joue → clos : la rencontre ne se rouvre pas, et aucun pas d horloge n a ete ajoute', () => {
			// LE CHEMIN DU PRODUIT, de bout en bout, sur la FIXTURE DU DISQUE : le pas qui
			// amène à la tour, la rencontre due, l'ouverture, deux rounds, la clôture.
			const dossier = dossierReference()
			const pas = executerCommande(dossier, sessionDe(dossier, 7), {
				commande: 'aller',
				cibles: ['lieu.tour-effondree'],
			})
			if (!pas.ok) throw new Error(`commande refusée (${pas.refus}) : ${pas.message}`)
			const arrivee = fixerHeros(pas.session, HEROS_DE_COMBAT)
			const tour = arrivee.horloge.tour
			expect(tour).toBe(1)

			const due = evenementARencontrer(dossier, arrivee)
			expect(due).toEqual(RENCONTRE)
			if (due === undefined) throw new Error('rencontre attendue')

			// OUVERTURE : l'événement est consommé TOUT DE SUITE.
			const ouvert = resoudreRencontre(arrivee, due)
			expect(ouvert.monde.evenements_consommes).toEqual([due.evenement_id])
			expect(evenementARencontrer(dossier, ouvert)).toBeUndefined()

			// CLÔTURE : le combat disparaît, l'événement RESTE consommé — sans quoi la même
			// rencontre se rouvrirait au pas suivant, indéfiniment.
			const clos = cloreCombat(
				jouerPosture(jouerPosture(ouvert, 'normale'), 'defensive'),
				bilan('hero-victory', { pv: 10, pe: 2, xp: 1 }),
			)
			expect('combat' in clos).toBe(false)
			expect(clos.monde.evenements_consommes).toEqual([due.evenement_id])
			expect(evenementARencontrer(dossier, clos)).toBeUndefined()

			// UN COMBAT = UN PAS : l'horloge est celle du pas qui a déclenché la rencontre.
			expect(ouvert.horloge.tour).toBe(tour)
			expect(clos.horloge.tour).toBe(tour)
			expect(clos.heros).toEqual({ ...HEROS_DE_COMBAT, pv: 10, pe: 2, xp: 13 })
		})

		it('due → ouvert → joue → fuit → clos : le heros reste au lieu courant, l evenement reste consomme, les commandes reprennent', () => {
			// LE CHEMIN DE LA FUITE (n° 13 it2, D5), sur la FIXTURE DU DISQUE : mêmes quatre
			// portes que ci-dessus, `fuirRencontre` entre la posture et la clôture.
			const dossier = dossierReference()
			const pas = executerCommande(dossier, sessionDe(dossier, 7), {
				commande: 'aller',
				cibles: ['lieu.tour-effondree'],
			})
			if (!pas.ok) throw new Error(`commande refusée (${pas.refus}) : ${pas.message}`)
			const arrivee = fixerHeros(pas.session, HEROS_DE_COMBAT)
			const due = evenementARencontrer(dossier, arrivee)
			if (due === undefined) throw new Error('rencontre attendue')

			const fuyant = fuirRencontre(jouerPosture(resoudreRencontre(arrivee, due), 'defensive'))
			expect(fuyant.combat).toEqual({ monstre_ref: due.monstre_ref, postures: ['defensive'], fuite: true })
			// TANT QUE LE COMBAT EXISTE — fuite posée comprise — AUCUNE commande n'est acceptée :
			// c'est la CLÔTURE qui rend la main, jamais le drapeau.
			const refus = executerCommande(dossier, fuyant, { commande: 'aller', cibles: ['lieu.foyer-du-guet'] })
			expect(refus.ok === false && refus.refus).toBe('combat_en_cours')

			const clos = cloreCombat(fuyant, bilan('hero-fled', { pv: 11, pe: 2, xp: 4 }))

			expect('combat' in clos).toBe(false)
			// AUCUN DÉPLACEMENT : le héros est où le pas qui a déclenché la rencontre l'a mené.
			expect(clos.monde.lieu_courant).toBe('lieu.tour-effondree')
			expect(clos.monde.lieu_courant).toBe(arrivee.monde.lieu_courant)
			// L'événement RESTE consommé : sans quoi la même rencontre se rouvrirait au pas suivant.
			expect(clos.monde.evenements_consommes).toEqual([due.evenement_id])
			expect(evenementARencontrer(dossier, clos)).toBeUndefined()
			// UN COMBAT = UN PAS ; ni XP (12 reste 12), ni plafonds.
			expect(clos.horloge.tour).toBe(arrivee.horloge.tour)
			expect(clos.heros).toEqual({ ...HEROS_DE_COMBAT, pv: 11, pe: 2 })
			// Et la main est rendue : la même commande, refusée sous combat, est acceptée.
			const reprise = executerCommande(dossier, clos, { commande: 'aller', cibles: ['lieu.foyer-du-guet'] })
			expect(reprise.ok).toBe(true)
		})
	})
})
