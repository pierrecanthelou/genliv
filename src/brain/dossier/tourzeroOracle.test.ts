import fs from 'node:fs'
import path from 'node:path'
import type { ExprNode } from './expr'
import { collectIds, type EspaceDeNoms } from './identifiers'
import { PREDICATES, type PredicatId } from './predicates'
import { ouvrirSession, type EtatMonde } from './session'
import { premiereFeuilleVraieAuTourZero } from './tourzero'
import type { Dossier } from './types'
import { validateDossier } from './validate'

/**
 * L'ORACLE DU TOUR ZÉRO — le PREMIER instrument qui confronte la table
 * `VALEUR_AU_TOUR_ZERO` de `tourzero.ts` à un ÉTAT DE SESSION RÉEL (KR-252).
 *
 * CE QUE `tourzero.test.ts` NE PEUT PAS FAIRE, et ce n'est pas un défaut de sa
 * part : il recopie la table attendue dans le test et la compare à un double
 * d'elle-même. Deux écritures du même choix restent d'accord même quand le choix
 * est faux. Il fallait une TROISIÈME source, extérieure à la table : l'état que
 * `ouvrirSession` produit réellement. C'est ce fichier.
 *
 * IL NE LIT NI `VALEUR_AU_TOUR_ZERO` (privée) NI `Trivalent` (dont KR-237
 * interdit l'export : un type trivalent exporté fabriquerait l'évaluateur unique
 * qui supprime l'indécidable). Il passe par la FONCTION PUBLIQUE, et reconstruit
 * la valeur de chaque cellule par DEUX appels :
 *
 *   P = premiereFeuilleVraieAuTourZero(dossier, feuille)         → cellule 'vrai'
 *   N = premiereFeuilleVraieAuTourZero(dossier, non(feuille))    → cellule 'faux'
 *   P et N tous deux nuls                                        → 'indecidable'
 *
 * LES `indecidable` NE SONT PAS ASSERTÉS — SOLIDITÉ SEULE, direction sûre. La
 * règle ne tire que sur le certain-vrai, et une cellule muette ne peut pas
 * mentir sur l'état. Ce fichier ne dit donc jamais « la table devrait décider
 * ici » ; il dit seulement « là où elle décide, elle a raison ».
 *
 * ASYMÉTRIE MESURÉE, ET NON SUPPOSÉE : l'oracle couvre la décision (i) — les
 * `declencheur_expr` résolus avant la première action, dont `indice_connu` est le
 * consommateur au dépôt — et JAMAIS la décision (ii) — le lieu de départ
 * compte-t-il comme visité. Sous le mutant de direction d'it2
 * (`lieux_visites = [depart]`), cet oracle reste VERT, parce que la cellule
 * `lieu_visite` est `indecidable` et qu'une cellule muette n'est pas assertée.
 * Les deux cellules partent ensemble dans le lot `contrat` d'it3 ; ce fichier
 * n'en amende aucune, et `tourzero.test.ts` reste 8/8 sans avoir été modifié.
 */

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

/** La fixture, LUE DU DISQUE et VALIDÉE (KR-156) — jamais un littéral inline. */
function dossierMinimal(): Dossier {
	const validation = validateDossier(JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')))
	if (validation.dossier === null) {
		throw new Error(`la fixture minimale ne valide plus : ${validation.errors.map((e) => e.code).join(', ')}`)
	}
	return validation.dossier
}

/**
 * CE QUE L'ÉTAT DIT D'UN PRÉDICAT — une ligne par identifiant de `PREDICATES`,
 * `Record` TOTAL donc exhaustif PAR COMPILATION (KR-117) : un huitième prédicat
 * ne compile pas tant que personne n'a dit quel champ de session y répond.
 *
 * CE N'EST PAS L'ÉVALUATEUR BIVALENT D'it3 : celui-là traverse un `ExprNode` et
 * LÈVE sur une entrée non reconnue (KR-238). Celui-ci lit UN prédicat contre UN
 * état, et il n'existe que pour donner à l'oracle une seconde lecture,
 * indépendante de la table qu'il éprouve. Chaque ligne recopie, dans le sens
 * inverse, le champ que la docstring du prédicat nomme déjà.
 */
const ETAT_SATISFAIT: Record<PredicatId, (monde: EtatMonde, cibles: readonly string[]) => boolean> = {
	possede_objet: (monde, cibles) => monde.objets_possedes.includes(cibles[0]),
	indice_connu: (monde, cibles) => monde.indices_connus.includes(cibles[0]),
	jalon_atteint: (monde, cibles) => monde.jalons_atteints.includes(cibles[0]),
	lieu_visite: (monde, cibles) => monde.lieux_visites.includes(cibles[0]),
	lieu_courant_est: (monde, cibles) => monde.lieu_courant === cibles[0],
	evenement_consomme: (monde, cibles) => monde.evenements_consommes.includes(cibles[0]),
	pnj_a_revele: (monde, cibles) => monde.pnj[cibles[0]]?.a_dit.includes(cibles[1]) ?? false,
}

/** Les identifiants de prédicat, BALAYÉS DEPUIS LE REGISTRE (KR-117) — jamais sept littéraux. */
const PREDICATS = Object.keys(PREDICATES) as PredicatId[]

/** Les identifiants RÉELS du dossier, par espace de noms — jamais des cibles inventées. */
function identifiantsPar(dossier: Dossier, espace: EspaceDeNoms): string[] {
	return collectIds(dossier)
		.filter((collecte) => collecte.espace === espace && collecte.id !== null)
		.map((collecte) => collecte.id as string)
}

/**
 * TOUTES LES CIBLES POSSIBLES D'UN PRÉDICAT sur ce dossier — produit cartésien de
 * `refKinds`, DÉRIVÉ du descripteur. L'arité n'est jamais écrite : c'est
 * `refKinds.length`, comme le dit `predicates.ts`. Le seul prédicat d'arité 2 du
 * schéma 1 (`pnj_a_revele`) est donc balayé sur toutes ses paires sans un mot de
 * code de plus.
 */
function ciblesPossibles(dossier: Dossier, predicat: PredicatId): string[][] {
	return PREDICATES[predicat].refKinds.reduce<string[][]>(
		(tuples, espace) => tuples.flatMap((tuple) => identifiantsPar(dossier, espace).map((id) => [...tuple, id])),
		[[]],
	)
}

function feuille(predicat: PredicatId, cibles: string[]): ExprNode {
	return { op: 'predicat', predicat, cibles }
}

function nier(noeud: ExprNode): ExprNode {
	return { op: 'non', enfant: noeud }
}

describe('tourzero, confronte a l etat rendu par ouvrirSession', () => {
	it('aucune cellule vrai ou faux ne contredit la session d ouverture', () => {
		const dossier = dossierMinimal()
		const ouverture = ouvrirSession(dossier, { graine_alea: 0 })

		// La fixture porte une ouverture RÉDIGÉE : si elle cessait de l'être, tout ce
		// qui suit deviendrait vide et l'oracle se tairait au lieu de rougir.
		if (!ouverture.ok) throw new Error(`la fixture minimale ne s ouvre plus : ${ouverture.refus}`)
		const monde = ouverture.session.monde

		const assertions: string[] = []
		const observees: string[] = []
		const balayees: string[] = []

		for (const predicat of PREDICATS) {
			for (const cibles of ciblesPossibles(dossier, predicat)) {
				const repere = `${predicat}(${cibles.join(', ')})`
				balayees.push(repere)

				const certainVrai = premiereFeuilleVraieAuTourZero(dossier, feuille(predicat, cibles)) !== null
				const certainFaux = premiereFeuilleVraieAuTourZero(dossier, nier(feuille(predicat, cibles))) !== null

				// `indecidable` — la table se tait, l'oracle se tait avec elle.
				if (!certainVrai && !certainFaux) continue

				const satisfait = ETAT_SATISFAIT[predicat](monde, cibles)
				// La cellule dit `vrai` : l'état DOIT satisfaire le prédicat. Elle dit
				// `faux` : il NE DOIT PAS. L'échec nomme la cellule, jamais un compte.
				assertions.push(`${repere} · table ${certainVrai ? 'vrai' : 'faux'} → état ${certainVrai}`)
				observees.push(`${repere} · table ${certainVrai ? 'vrai' : 'faux'} → état ${satisfait}`)
			}
		}

		expect(observees).toEqual(assertions)

		// NON-VACUITÉ (KR-199) : sans cette ligne, un balayage qui ne produirait aucune
		// cellule décidée passerait pour une confrontation réussie. Mesuré à SIX au
		// raffinage — 1 `lieu_courant_est` vrai, 1 objet, 2 indices, 2 paires
		// personnage × indice —, les trois cellules indécidables restant muettes.
		expect(assertions.length).toBeGreaterThanOrEqual(6)

		// Et CHAQUE prédicat a été balayé au moins une fois : une dérivation de cibles
		// qui se viderait en silence réduirait la confrontation sans rien faire rougir
		// (KR-199, énumération échantillonnée).
		for (const predicat of PREDICATS) {
			const vues = balayees.filter((repere) => repere.startsWith(`${predicat}(`)).length
			expect(`${predicat} → ${vues > 0}`).toBe(`${predicat} → true`)
		}
	})

	it('la lecture d etat couvre exactement les sept predicats du registre', () => {
		// KR-117 : le `Record` est total par compilation ; cette ligne ajoute ce que le
		// typage ne porte pas — que son domaine soit EXACTEMENT celui du registre qui
		// fait foi, et non un domaine assoupli un jour par un `Partial`.
		expect(Object.keys(ETAT_SATISFAIT).sort()).toEqual(Object.keys(PREDICATES).sort())
	})

	it('la lecture d etat sait rendre vrai — sinon l oracle serait vert par impuissance', () => {
		// DISCRIMINANCE DE L'INSTRUMENT (BUG-084) : toutes les cellules décidées de la
		// fixture sauf une valent `faux`, si bien qu'une lecture d'état qui rendrait
		// TOUJOURS `false` passerait presque partout. Ces lignes prouvent que chacune
		// des sept lectures sait aussi répondre oui.
		const monde: EtatMonde = {
			lieu_courant: 'lieu.val-cendre',
			lieux_visites: ['lieu.val-cendre'],
			objets_possedes: ['objet.clef-de-basalte'],
			indices_connus: ['indice.sceau-brise'],
			jalons_atteints: ['jalon.premiere-nuit'],
			evenements_consommes: ['evenement.embuscade-du-fanal'],
			pnj: { 'pnj.aldur-le-sage': { a_dit: ['indice.sceau-brise'] } },
		}
		const CIBLES: Record<PredicatId, string[]> = {
			possede_objet: ['objet.clef-de-basalte'],
			indice_connu: ['indice.sceau-brise'],
			jalon_atteint: ['jalon.premiere-nuit'],
			lieu_visite: ['lieu.val-cendre'],
			lieu_courant_est: ['lieu.val-cendre'],
			evenement_consomme: ['evenement.embuscade-du-fanal'],
			pnj_a_revele: ['pnj.aldur-le-sage', 'indice.sceau-brise'],
		}

		for (const predicat of PREDICATS) {
			expect(`${predicat} → ${ETAT_SATISFAIT[predicat](monde, CIBLES[predicat])}`).toBe(`${predicat} → true`)
			// Et elle sait rendre FAUX sur une cible que l'état ne porte pas : sans cette
			// ligne, une lecture qui rendrait toujours `true` passerait celle du dessus.
			expect(`${predicat} → ${ETAT_SATISFAIT[predicat](monde, ['lieu.ailleurs', 'indice.ailleurs'])}`).toBe(
				`${predicat} → false`,
			)
		}
	})
})
