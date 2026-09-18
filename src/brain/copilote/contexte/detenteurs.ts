/**
 * L'ASSEMBLEUR DU SECOND RÔLE — qui, parmi les personnages, pourrait savoir cela.
 *
 * Le SEUL assembleur qui NUMÉROTE des candidats et rend une table de rangs : ce
 * qui le distingue est son CORPS, pas une donnée (§ 8, TL-4).
 */
import type { Dossier } from '../../dossier/types'
// CYCLE DE TYPE SEUL — voir `./prose`. `import type` est effacé à l'émission.
import type { CibleIndice } from '../../CopiloteService'
import type { RangInjecte } from '../types'
import { PREFIXE_INDICE, PREFIXE_PERSONNAGE, textesDuChemin, textesRediges, type ContexteDetenteurs } from './noyau'
import { BUDGET_CARACTERES_CONTEXTE, CANDIDATS_MAX, CHAMPS_INJECTES, PARTIES_REQUISES } from './registres'

const ROLE_DETENTEURS = 'indice-detenteurs'

/** LE CHEMIN SANS LEQUEL LA DEMANDE DE DÉTENTEURS N'A PAS DE SENS. Il n'est pas
 *  re-listé : un test asserte son appartenance à `CHAMPS_INJECTES`. Nommé plutôt
 *  qu'écrit au site du refus, parce qu'un chemin en dur au milieu d'un corps de
 *  fonction est exactement ce que `CHAMPS_INJECTES` existe pour éviter. */
const CHEMIN_VERITE_CIBLE = 'monde.indices[].verite'

/** LE SEUL chemin de liste TRONQUÉ, et à son PREMIER élément. Un plan d'actions
 *  entier par candidat, à K saturé, ferait exploser le contexte pour une valeur
 *  discriminante qui décroît à chaque étape : ce qui dit « qui pourrait savoir
 *  cela » est la PREMIÈRE intention du personnage, pas la cinquième. */
const CHEMIN_TRONQUE = 'monde.personnages[].plan_actions[].action'

/**
 * L'ASSEMBLEUR DU SECOND RÔLE.
 *
 * SÉLECTION DES CANDIDATS — déterministe, sans modèle :
 *  1. exclure tout personnage dont un `savoirs[].indice_id` vaut `cible.indiceId` ;
 *  2. ordre : `portee === 'premier'` d'abord, puis l'ordre du document. `portee` est
 *     d'audience `moteur` : elle SÉLECTIONNE, elle n'est JAMAIS injectée ;
 *  3. tronquer à `CANDIDATS_MAX` ;
 *  4. un candidat dont les QUATRE chemins de personnage sont vides ou marqués n'est
 *     PAS injecté et ne consomme PAS de rang — un bloc de rang sans une seule ligne
 *     enseignerait « ce personnage n'a rien », ce qui est une AFFIRMATION ; le repli
 *     est le SILENCE (même doctrine que le filtre `MARQUEUR_A_ECRIRE` de l'it1) ;
 *  5. numéroter les survivants `P1`, `P2`, … dans cet ordre.
 *
 * TRONCATURE DE LISTE, JAMAIS DE CHAÎNE : `plan_actions[].action` est réduit à son
 * PREMIER élément RÉDIGÉ ; aucune chaîne n'est jamais coupée. Dépassement de budget
 * ⇒ REFUS, jamais coupure (KR-230 : en rédaction, le dégradé EST le refus).
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — la `verite` de l'indice cible manque, est vide ou marquée
 *   3. `aucun-candidat` — table des rangs vide
 *   4. `trop-long`      — `texte.length > BUDGET_CARACTERES_CONTEXTE[rôle]`
 *
 * CE QUI N'EST PAS ICI, et c'est une décision : `controlerDossier`. Le constat
 * `indice-sans-source` gouverne QUEL indice l'auteur peut confier — côté client,
 * dans le `Select` ; il n'entre ni dans le contexte, ni dans la légalité d'une
 * demande. L'injecter apprendrait au modèle à faire disparaître l'alerte plutôt
 * qu'à répondre à la question.
 */
export function assemblerDetenteurs(dossier: Dossier, cible: CibleIndice): ContexteDetenteurs {
	const chemins = CHAMPS_INJECTES[ROLE_DETENTEURS]
	const blocs: string[] = []
	const retenus = new Set<string>()

	// ── LE CANON, global ──────────────────────────────────────────────────────
	for (const chemin of chemins) {
		if (chemin.startsWith(PREFIXE_INDICE) || chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 1 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[ROLE_DETENTEURS]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── L'INDICE CIBLE ────────────────────────────────────────────────────────
	// La cible ne résout pas (le dossier a changé sous l'écran) : sa `verite` est
	// alors vide, et le refus 2 la couvre — il n'y a pas deux états à distinguer,
	// « pas de vérité écrite » et « plus d'indice du tout » demandent le même geste.
	const indice = dossier.monde.indices.find((candidat) => candidat.id === cible.indiceId)
	const blocsDeLIndice: string[] = []
	for (const chemin of chemins) {
		if (!chemin.startsWith(PREFIXE_INDICE)) continue
		const textes = textesRediges(indice, chemin, PREFIXE_INDICE)
		if (chemin === CHEMIN_VERITE_CIBLE && textes.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
		if (textes.length === 0) continue
		blocsDeLIndice.push(`${chemin}\n${textes.join('\n')}`)
	}
	blocs.push(...blocsDeLIndice)

	// ── LES CANDIDATS ─────────────────────────────────────────────────────────
	// `textesDuChemin` et non `savoirs.some(…)` : la lecture d'un dossier venu du
	// disque reste TOTALE (KR-116), et c'est la même primitive que l'injection —
	// sauf que celle-ci SÉLECTIONNE et n'injecte rien.
	const detientDeja = (candidat: unknown): boolean =>
		textesDuChemin(candidat, ['savoirs[]', 'indice_id']).includes(cible.indiceId)
	const libres = dossier.monde.personnages.filter((candidat) => !detientDeja(candidat))
	const ordonnes = [
		...libres.filter((candidat) => candidat.portee === 'premier'),
		...libres.filter((candidat) => candidat.portee !== 'premier'),
	]

	const rangs = new Map<RangInjecte, string>()
	// UNE traversée, DEUX projections — jamais deux listes à tenir en phase.
	const entitesInjectees: string[] = [cible.indiceId]

	for (const candidat of ordonnes.slice(0, CANDIDATS_MAX)) {
		const lignes: string[] = []
		for (const chemin of chemins) {
			if (!chemin.startsWith(PREFIXE_PERSONNAGE)) continue
			const textes = textesRediges(candidat, chemin, PREFIXE_PERSONNAGE)
			const retenues = chemin === CHEMIN_TRONQUE ? textes.slice(0, 1) : textes
			if (retenues.length === 0) continue
			lignes.push(`${chemin}\n${retenues.join('\n')}`)
		}
		// Règle 4 de la sélection — pas une ligne, pas de rang.
		if (lignes.length === 0) continue
		const rang = `P${rangs.size + 1}`
		rangs.set(rang, candidat.id)
		entitesInjectees.push(candidat.id)
		blocs.push(`${rang}\n${lignes.join('\n')}`)
	}

	// Refus 3 — personne à désigner : il n'y a RIEN à demander.
	if (rangs.size === 0) return { ok: false, motif: 'aucun-candidat' }

	const texte = blocs.join('\n\n')
	// Refus 4 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_DETENTEURS]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees, rangs }
}
