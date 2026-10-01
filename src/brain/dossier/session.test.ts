import fs from 'node:fs'
import path from 'node:path'
import { AMORCE, MARQUEUR_A_ECRIRE, construireAmorce } from './amorce'
import { SCHEMA_SESSION, fixerHeros, ouvrirSession, type EntreeJournal, type EtatSession } from './session'
import type { Dossier } from './types'
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
