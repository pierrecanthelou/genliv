import fs from 'node:fs'
import path from 'node:path'
import { construireAmorce } from './amorce'
import type { ExprNode } from './expr'
import type { EspaceDeNoms } from './identifiers'
import { PREDICATES, type PredicatId } from './predicates'
import { premiereFeuilleVraieAuTourZero, type FeuilleVraieAuTourZero } from './tourzero'
import type { Dossier } from './types'

/**
 * LA VALUATION À L'OUVERTURE — ce que le DOCUMENT détermine de la partie avant la
 * première action du joueur, et surtout ce qu'il ne détermine PAS.
 *
 * AUCUNE DES DEUX FIXTURES PARTAGÉES N'EST LUE ICI, et c'est délibéré : les
 * témoins de ce fichier exercent des BRAS DE TABLE que ni `dossier-minimal.json`
 * ni `dossier-reference.json` ne portent — un départ non posé, un prédicat
 * indécidable sous une négation simple. Le dossier fabriqué est celui que
 * `DossierService.create()` produit (`construireAmorce`), dont le départ résout
 * par construction. La preuve sur MATÉRIAU RÉEL, elle, vit dans
 * `controles.test.ts`, sur le dossier de référence non muté.
 *
 * LES CIBLES NE RÉSOLVENT AUCUNE ENTITÉ, ET C'EST LE CONTRAT : ce module ne
 * résout rien — une référence pendante est l'affaire du validateur (KR-225). La
 * SEULE cible qui doive désigner une entité réelle est celle d'un LIEU, que la
 * table compare au départ ; le dossier fabriqué pose donc son départ sur elle.
 */

const MODULE_DOSSIER = __dirname

/**
 * LES SOURCES BALAYÉES, fins de ligne NORMALISÉES — l'arbre de travail est en
 * CRLF et `prettier` écrit en LF ; une garde qui dépendrait de l'une ou de
 * l'autre rougirait après un simple `git checkout`.
 */
function source(nom: string): string {
	return fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8').replace(/\r\n/g, '\n')
}

/**
 * La source PRIVÉE DE SES COMMENTAIRES — même fonction que `deltas.test.ts` et
 * `pastilles.test.ts`. Sans elle, la garde d'absence de cache serait rouge sur de
 * la PROSE : la docstring du module écrit « AUCUNE MÉMOÏSATION, AUCUN CACHE » pour
 * dire ce qu'il s'interdit, et une règle qui empêcherait d'écrire un mot
 * empêcherait aussi d'expliquer pourquoi.
 */
function enPositionDeCode(texte: string): string {
	return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

/** UNE CIBLE PAR ESPACE DE NOMS — bien formée, et JAMAIS résolue par ce module. */
function cibleDe(espace: EspaceDeNoms): string {
	return `${espace}.temoin`
}

/** Le lieu sur lequel le dossier fabriqué pose son départ — la cible générique des lieux. */
const LIEU_DU_DEPART = cibleDe('lieu')

/** Un lieu qui n'est PAS le départ — le second bras de la cellule `lieu_courant_est`. */
const LIEU_AILLEURS = 'lieu.ailleurs'

/**
 * Le dossier fabriqué : celui du seed, son unique lieu et son départ portés sur la
 * cible générique, de sorte que le balayage ci-dessous exerce le bras `'vrai'` de
 * la seule cellule qui en ait un.
 */
function fabrique(): Dossier {
	const dossier = construireAmorce('dossier-du-tour-zero', 'Le tour zéro', '2026-09-17T10:00:00.000Z')
	dossier.monde.lieux = [{ id: LIEU_DU_DEPART }]
	dossier.charpente.depart.lieu_id = LIEU_DU_DEPART
	return dossier
}

/** La feuille NUE d'un prédicat, ses cibles DÉRIVÉES de `refKinds` — jamais re-listées. */
function feuilleNue(id: PredicatId): ExprNode {
	return { op: 'predicat', predicat: id, cibles: PREDICATES[id].refKinds.map(cibleDe) }
}

/** La même, sous une négation SIMPLE. */
function nier(noeud: ExprNode): ExprNode {
	return { op: 'non', enfant: noeud }
}

/** Une feuille de lieu sur une cible choisie — le seul prédicat que le départ décide. */
function lieuCourant(cible: string): ExprNode {
	return { op: 'predicat', predicat: 'lieu_courant_est', cibles: [cible] }
}

/** Le verdict PROJETÉ en ligne nommée : un échec dit QUEL témoin a bougé. */
function ligne(feuille: FeuilleVraieAuTourZero | null): string {
	if (feuille === null) return 'silence'
	return `${feuille.predicat} · ${feuille.cibles.join(', ')} · ${feuille.nie ? 'nié' : 'nu'}`
}

/**
 * LA TABLE DU TOUR ZÉRO, ÉCRITE DEPUIS LE PLAN D'ITÉRATION (§ 4) ET JAMAIS DEPUIS
 * CE QUE LE CODE REND. `Record<PredicatId, …>` TOTAL, donc exhaustif PAR
 * COMPILATION (KR-117) : un huitième prédicat au registre ne compile pas ici tant
 * que personne n'a décidé ce qu'il vaut à l'ouverture.
 *
 * `lieu_courant_est` y vaut `'vrai'` pour la cible ÉGALE AU DÉPART — c'est cette
 * cible que le balayage lui donne. Ses deux autres bras — une cible différente, un
 * départ non posé — ont leurs propres témoins, juste au-dessus et juste en dessous.
 */
type ValeurAuTourZero = 'vrai' | 'faux' | 'indecidable'

const VALEUR_ATTENDUE: Record<PredicatId, ValeurAuTourZero> = {
	possede_objet: 'faux',
	indice_connu: 'faux',
	jalon_atteint: 'indecidable',
	lieu_visite: 'indecidable',
	lieu_courant_est: 'vrai',
	evenement_consomme: 'indecidable',
	pnj_a_revele: 'faux',
}

/** Les identifiants de prédicat, BALAYÉS DEPUIS LE REGISTRE — jamais sept littéraux. */
const PREDICATS = Object.keys(PREDICATES) as PredicatId[]

/** Le sous-ensemble INDÉCIDABLE, dérivé de la table — jamais une seconde liste. */
const INDECIDABLES = PREDICATS.filter((id) => VALEUR_ATTENDUE[id] === 'indecidable')

describe('premiereFeuilleVraieAuTourZero, la valuation a l ouverture', () => {
	it('le lieu de depart rend la feuille non niee certaine, et la niee certaine fausse', () => {
		// LE FAUX POSITIF QUE LE MODÈLE NAÏF PRODUIRAIT. Un évaluateur qui supposerait
		// tous les champs de session vides rendrait `lieu_courant_est(<départ>)` FAUX,
		// donc `non(...)` VRAI — et la règle tirerait sur un dossier où le héros est
		// exactement là où l'auteur l'a mis. C'est la cellule qui l'interdit.
		const dossier = fabrique()
		const depart = dossier.charpente.depart.lieu_id

		// (a) NU SUR LE DÉPART — certain-VRAI, la feuille est rendue, `nie` est faux.
		const surLeDepart = lieuCourant(depart)
		expect(premiereFeuilleVraieAuTourZero(dossier, surLeDepart)).toEqual({
			predicat: PREDICATES.lieu_courant_est.label,
			cibles: [depart],
			nie: false,
		})
		// LE LIBELLÉ EST CELUI DU REGISTRE, JAMAIS LA CLÉ : c'est le mot que le
		// sélecteur de conditions présente à l'auteur.
		expect(PREDICATES.lieu_courant_est.label).not.toBe('lieu_courant_est')

		// (b) NIÉ SUR LE DÉPART — certain-FAUX, silence. La moitié qui compte.
		expect(ligne(premiereFeuilleVraieAuTourZero(dossier, nier(surLeDepart)))).toBe('silence')

		// (c) LE SECOND BRAS, DANS LE MÊME TEST : un AUTRE lieu, départ posé et résolu
		// — certain-FAUX nu, donc certain-VRAI nié, et le témoin porte `nie`. Sans
		// cette moitié, le silence de (b) serait indistinguable d'une cellule qui ne
		// rendrait jamais `'vrai'`.
		const ailleurs = lieuCourant(LIEU_AILLEURS)
		expect(ligne(premiereFeuilleVraieAuTourZero(dossier, ailleurs))).toBe('silence')
		expect(premiereFeuilleVraieAuTourZero(dossier, nier(ailleurs))).toEqual({
			predicat: PREDICATES.lieu_courant_est.label,
			cibles: [LIEU_AILLEURS],
			nie: true,
		})
	})

	it('un depart vide ou pendant rend la cellule indecidable, sous les deux polarites', () => {
		// UN DÉPART NON POSÉ NE DÉTERMINE PAS DAVANTAGE OÙ LE HÉROS N'EST PAS. Les deux
		// formes du « non posé » sont exercées ENSEMBLE : le champ VIDE, et le champ
		// qui ne résout aucun `monde.lieux[].id`. Sans le troisième bras, ce dossier
		// rendrait `non(lieu_courant_est(X))` certain-VRAI — un faux positif sur un
		// document qui ne dit rien.
		const DEPARTS_NON_POSES: Record<string, string> = { vide: '', pendant: 'lieu.jamais-pose' }
		const surUnLieu = lieuCourant(LIEU_DU_DEPART)

		for (const [nom, lieuId] of Object.entries(DEPARTS_NON_POSES)) {
			const dossier = fabrique()
			dossier.charpente.depart.lieu_id = lieuId
			for (const [polarite, condition] of [
				['nu', surUnLieu],
				['nié', nier(surUnLieu)],
			] as const) {
				const feuille = premiereFeuilleVraieAuTourZero(dossier, condition)
				expect(`${nom} · ${polarite} → ${ligne(feuille)}`).toBe(`${nom} · ${polarite} → silence`)
			}
		}

		// DISCRIMINANCE, DANS LE MÊME TEST (KR-199) : le MÊME témoin sur un départ
		// POSÉ parle, nu. Sans cette ligne, les quatre silences ci-dessus seraient
		// ceux d'une fonction qui ne rend jamais rien.
		expect(premiereFeuilleVraieAuTourZero(fabrique(), surUnLieu)).not.toBeNull()
	})

	it('chaque predicat indecidable de la table se tait, nu', () => {
		// LE BALAYAGE PORTE SUR LES SEPT, et la table dit ce que chacun doit rendre :
		// une feuille NUE ne parle que si sa cellule vaut `'vrai'`. Les trois
		// indécidables sont le SUJET de ce test ; les quatre autres y sont la
		// discriminance, dans le même balayage — un test qui n'exercerait que des
		// cellules muettes serait vert sur une fonction qui ne rend jamais rien.
		const dossier = fabrique()

		// Discriminance de l'ENSEMBLE lui-même : un sous-ensemble vide rendrait la
		// boucle vraie sans rien prouver.
		expect(INDECIDABLES.length).toBeGreaterThan(0)

		for (const id of PREDICATS) {
			const condition = feuilleNue(id)
			const parle = premiereFeuilleVraieAuTourZero(dossier, condition) !== null
			expect(`${id} · nu → ${parle}`).toBe(`${id} · nu → ${VALEUR_ATTENDUE[id] === 'vrai'}`)
		}
	})

	it('chaque predicat indecidable de la table se tait, nie', () => {
		// CE TEST NE REMPLACE PAS LE PRÉCÉDENT, ET LE PRÉCÉDENT NE LE REMPLACE PAS —
		// c'est mesuré, pas supposé. Sous une négation simple, une cellule
		// `'indecidable'` reste indécidable : `non('?')` vaut `'?'`, jamais `'vrai'`.
		// Deux implémentations fautives OPPOSÉES — un `non` qui rend certain-vrai dès
		// que l'enfant n'est pas certain-vrai, et des cellules indécidables rendues
		// certaines-fausses — font toutes deux tirer CE témoin-ci ; c'est la lecture
		// CONJOINTE avec le test précédent, resté vert, qui les sépare.
		const dossier = fabrique()

		for (const id of PREDICATS) {
			const condition = nier(feuilleNue(id))
			const feuille = premiereFeuilleVraieAuTourZero(dossier, condition)
			expect(`${id} · nié → ${feuille !== null}`).toBe(`${id} · nié → ${VALEUR_ATTENDUE[id] === 'faux'}`)
			// ET LE TÉMOIN PORTE SA POLARITÉ : sans `nie`, le message affirmerait
			// « possède l'objet » là où le fait établi est l'ABSENCE de l'objet.
			if (feuille !== null) expect(`${id} → ${feuille.nie}`).toBe(`${id} → true`)
		}
	})

	it('les connecteurs suivent Kleene, et le temoin est celui du PREMIER enfant qui decide', () => {
		const dossier = fabrique()
		const VRAI = lieuCourant(dossier.charpente.depart.lieu_id)
		const FAUX = feuilleNue('possede_objet')
		const INDECIS = feuilleNue('lieu_visite')
		const NON_FAUX = nier(FAUX)
		const verdict = (condition: ExprNode): string => ligne(premiereFeuilleVraieAuTourZero(dossier, condition))

		const VRAI_NU = `${PREDICATES.lieu_courant_est.label} · ${dossier.charpente.depart.lieu_id} · nu`
		const FAUX_NIE = `${PREDICATES.possede_objet.label} · ${cibleDe('objet')} · nié`

		// `et` — VRAI si TOUS le sont, et le témoin est celui du PREMIER enfant. Les
		// deux enfants sont vrais pour des raisons DIFFÉRENTES — une détermination du
		// document, une négation d'une cellule certaine-fausse —, donc « le premier,
		// ordre du document » devient une assertion et non un vœu.
		expect(verdict({ op: 'et', enfants: [VRAI, NON_FAUX] })).toBe(VRAI_NU)
		expect(verdict({ op: 'et', enfants: [NON_FAUX, VRAI] })).toBe(FAUX_NIE)
		// Une seule branche indécidable suffit à faire taire le `et`.
		expect(verdict({ op: 'et', enfants: [VRAI, INDECIS] })).toBe('silence')
		expect(verdict({ op: 'et', enfants: [VRAI, FAUX] })).toBe('silence')

		// `ou` — VRAI dès qu'UNE branche l'est, et c'est cette branche-là qui est
		// nommée, où qu'elle soit dans la liste.
		expect(verdict({ op: 'ou', enfants: [FAUX, VRAI] })).toBe(VRAI_NU)
		expect(verdict({ op: 'ou', enfants: [VRAI, NON_FAUX] })).toBe(VRAI_NU)
		// LA FORME EXACTE DE `dossier-minimal.json` — `ou('indecidable', 'faux')` se
		// tait exactement comme `ou('faux', 'faux')` : c'est le coût NUL de la cellule
		// `evenement_consomme` laissée indécidable.
		expect(verdict({ op: 'ou', enfants: [INDECIS, FAUX] })).toBe('silence')
		expect(verdict({ op: 'ou', enfants: [FAUX, FAUX] })).toBe('silence')
		// UN `ou` TOUT FAUX EST CERTAIN-FAUX, donc sa négation est certaine-VRAIE, et
		// le témoin remonte du premier enfant avec sa polarité BASCULÉE. Sans cette
		// ligne, la propagation du témoin sous `ou` faux ne serait prouvée nulle part.
		expect(verdict(nier({ op: 'ou', enfants: [FAUX, FAUX] }))).toBe(FAUX_NIE)
	})

	it('la table couvre les sept predicats, totale par compilation', () => {
		// KR-117 — la table du module est un `Record<PredicatId, …>` : un huitième
		// prédicat au registre ne compile pas tant que personne n'a décidé ce qu'il
		// vaut à l'ouverture. Ce que le typage ne porte PAS, et que cette ligne porte :
		// que la table ÉPINGLÉE ci-dessus ait exactement le même domaine que le
		// registre qui fait foi, et non un domaine assoupli un jour par un `Partial`.
		expect(Object.keys(VALEUR_ATTENDUE).sort()).toEqual(Object.keys(PREDICATES).sort())
		expect(PREDICATS).toHaveLength(Object.keys(PREDICATES).length)

		// ET LES TROIS VALEURS SONT TOUTES REPRÉSENTÉES : une table qui aurait dérivé
		// vers une seule colonne passerait les deux balayages ci-dessus.
		expect([...new Set(PREDICATS.map((id) => VALEUR_ATTENDUE[id]))].sort()).toEqual(['faux', 'indecidable', 'vrai'])
	})

	it('aucun cache ni memoisation dans le module', () => {
		// KR-013/113 — PROUVÉ PAR LE COMPORTEMENT d'abord : le MÊME objet dossier,
		// muté entre deux appels, rend deux verdicts différents. Un cache posé sur sa
		// référence rendrait ici deux fois le premier.
		const dossier = fabrique()
		const condition = lieuCourant(dossier.charpente.depart.lieu_id)

		expect(premiereFeuilleVraieAuTourZero(dossier, condition)).not.toBeNull()
		dossier.charpente.depart.lieu_id = LIEU_AILLEURS
		expect(premiereFeuilleVraieAuTourZero(dossier, condition)).toBeNull()

		// ET PAR LA SOURCE ensuite, PRIVÉE DE SES COMMENTAIRES : la docstring du module
		// nomme ce qu'il s'interdit, et une règle qui interdirait le mot interdirait
		// aussi d'expliquer pourquoi.
		const code = enPositionDeCode(source('tourzero.ts'))
		for (const interdit of ['new Map', 'new WeakMap', 'cache', 'memo']) {
			expect(`${interdit} → ${code.toLowerCase().includes(interdit.toLowerCase())}`).toBe(`${interdit} → false`)
		}
	})

	it('les deux lecteurs semantiques d arbre ne s importent jamais, dans aucun sens', () => {
		// LA MESURE QUI A TRANCHÉ LE DOMICILE DE CE MODULE : les deux traversées ne
		// partagent AUCUNE machinerie — seulement `ExprNode` et `PREDICATES`, deux
		// contrats publics. Une dépendance dans l'un ou l'autre sens serait le premier
		// pas vers le paramètre de mode qu'un lecteur futur poserait sur deux
		// traversées quasi jumelles.
		expect(source('tourzero.ts')).not.toContain("from './atteignabilite'")
		expect(source('atteignabilite.ts')).not.toContain("from './tourzero'")

		// LES DEUX MOITIÉS : sans celle-ci, deux fichiers vides passeraient les
		// interdictions ci-dessus sans rien prouver.
		expect(source('tourzero.ts')).toContain("from './predicates'")
		expect(source('atteignabilite.ts')).toContain("from './predicates'")
	})
})
