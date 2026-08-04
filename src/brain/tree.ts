/**
 * Le modèle d'ARBRE — la structure de graphe d'un livre : ses nœuds, ses arêtes
 * et les deux règles portées par un choix (prérequis caché, compte à rebours).
 *
 * Extrait de `types.ts` par la feature n° 1 `dossier-format` (roadmap de la
 * bascule IA). Le sens de la dépendance est à SENS UNIQUE et il est structurant :
 * `tree.ts` importe les configurations d'action de `./types` — jamais l'inverse.
 * `types.ts` porte les types de RÈGLES (`GameObject`, `SkillRoll`, `MonsterConfig`,
 * `CreatureType`…) que `src/player/` consomme et qui SURVIVENT à la bascule ;
 * l'arbre, lui, est condamné (n° 2 pour la moitié `BookService` + `kinds.ts`,
 * n° 9 pour `playExport` + `Book`/`Edge`).
 *
 * C'est cette asymétrie qui rend KR-167 vérifiable : tant que `Dossier` et
 * `BookNode` partagent un fichier, le premier qui écrit `objets: GameObject[]` a
 * `TakeableObject` sous les yeux et le convertisseur apparaît. AUCUNE fonction ne
 * convertit un `Book` en `Dossier` ni l'inverse, dans aucun sens.
 *
 * Les références (objets, monstres, cibles de nœud) sont TOUJOURS par identifiant
 * stable, jamais par nom.
 */
import type { NodeKind, EdgeKind } from './kinds'
import type { DecorConfig, MonsterConfig, PnjConfig, TrapConfig } from './types'

/** Required-action slot on a node (its editors left with the bascule, roadmap D3). */
export type NodeActionType = 'aucune' | 'pnj' | 'decor' | 'piege' | 'monstre'

export interface BookNode {
	id: string
	kind: NodeKind
	/** Author-written screen text. Empty on a freshly seeded node. */
	text: string
	/**
	 * Locked nodes (the `mort` leaf) cannot be deleted, duplicated or
	 * retyped — only their text is editable. See KR-002.
	 */
	locked?: boolean
	/** Canvas position; optional until tree-canvas owns layout. */
	position?: { x: number; y: number }
	/** End-leaf flags (Fin victoire / Fin échec). Drive the FIN badge (KR-054). */
	endVictory?: boolean
	endFailure?: boolean
	/** Required-action type to continue; defaults to 'aucune'. */
	actionType?: NodeActionType
	/** Décor action config when `actionType === 'decor'` (owned by action-decor). */
	decor?: DecorConfig
	/** PNJ action config when `actionType === 'pnj'` (owned by action-pnj). */
	pnj?: PnjConfig
	/** Monster action config when `actionType === 'monstre'` (owned by action-monster). */
	monster?: MonsterConfig
	/** Trap action config when `actionType === 'piege'` (owned by action-trap). */
	trap?: TrapConfig
	/** Illustration — data URL d'une image uploadée par l'auteur (non disponible sur les écrans structurels). */
	illustration?: string
}

/**
 * A per-choice HIDDEN PREREQUISITE (§ 05): the choice is hidden from the player
 * unless they own the referenced object. References an acquirable object by its
 * STABLE id (KR-062), resolved against the book's derived object catalog
 * (collectObjects) — never by name. A dangling id (the object was deleted, or
 * none chosen yet) is detected and surfaced, never silently treated as met.
 */
export interface ChoicePrereq {
	/** Stable id of the required object (from collectObjects); '' = not yet chosen. */
	objectId: string
}

/**
 * A per-choice COUNTDOWN (§ 05): the choice expires after `delay` seconds to the
 * `fallback` node. The fallback is a node id reference (KR-063) — a deleted target
 * dangles and is surfaced (KR-021), never silently broken. The countdown only
 * ticks while the choice is VISIBLE (a hidden-prereq gate met, KR-065) — a
 * play-mode semantic; the editor just captures the rule.
 */
export interface ChoiceCountdown {
	/** Seconds before the choice expires (clamped 5–60, default 15). */
	delay: number
	/** Node the choice expires to; '' = not yet chosen (surfaced as unconfigured). */
	fallback: string
}

export interface Edge {
	id: string
	from: string
	to: string
	kind: EdgeKind
	/** Player-facing choice label (for `choice` edges). */
	label?: string
	/** Hidden-prerequisite rule: the choice is hidden unless the object is owned (KR-062). */
	prereq?: ChoicePrereq
	/** Countdown rule: the choice expires after a délai to a fallback node (KR-063/065). */
	countdown?: ChoiceCountdown
}

export interface Book {
	id: string
	title: string
	createdAt: string
	updatedAt: string
	nodes: BookNode[]
	edges: Edge[]
}
