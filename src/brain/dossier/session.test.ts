import { AMORCE, MARQUEUR_A_ECRIRE, construireAmorce } from './amorce'
import { SCHEMA_SESSION, ouvrirSession, type EtatSession } from './session'
import type { Dossier } from './types'

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
 * LE DOSSIER EST FABRIQUÉ, jamais lu du disque : les deux fixtures partagées ont
 * un départ posé sur leur unique lieu, donc aucune ne porte l'état séparateur du
 * second critère. Même choix, même motif que `tourzero.test.ts`.
 */

const MAINTENANT = '2026-09-20T10:00:00.000Z'

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
		// La TOTALITÉ est la précondition de la bivalence d'it3 : un champ manquant y
		// ferait une branche `undefined` sous un aiguillage qui doit lever.
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
