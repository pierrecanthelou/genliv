import type { Book, BookNode, Edge, GameObject } from '../types'
import { deriveAutomaticEdges } from './automaticEdges'
import { collectObjects } from './objects'
import { getNode } from './book'
import { nodeTitle } from './nodeView'

/** Format marker + schema version stamped into every exported play file. */
export const PLAY_EXPORT_FORMAT = 'genliv-play'
export const PLAY_EXPORT_VERSION = 1

/**
 * A play node is the authored node MINUS `position` — the canvas layout is an
 * editor-only concern (KR-022/023), irrelevant to a play runtime. Every other
 * field (text, kind, end flags, the décor/pnj/monstre/piège action configs) is
 * play data and carried verbatim.
 */
export type PlayNode = Omit<BookNode, 'position'>

/**
 * One referential-integrity problem found while exporting (KR-021): a reference
 * by stable id that does not resolve. The export still succeeds (non-blocking,
 * user decision) but every dangling reference is surfaced so the author — and the
 * play runtime — can see what is broken, never silently dropped.
 */
export interface PlayWarning {
	/** Stable machine code (counts/grouping); the message is the human summary. */
	code:
		| 'dangling-edge-target'
		| 'unconfigured-prereq'
		| 'dangling-prereq-object'
		| 'unconfigured-countdown'
		| 'dangling-countdown-fallback'
		| 'dangling-monster-target'
		| 'dangling-pnj-target'
		| 'dangling-object-ref'
	/** Human-readable French summary of the problem. */
	message: string
	/** The node the problem is anchored on, when applicable. */
	nodeId?: string
	/** The edge the problem is anchored on, when applicable. */
	edgeId?: string
	/** The unresolved reference id, when applicable. */
	ref?: string
}

/**
 * A self-contained, versioned PLAY document — the file the editor exports for the
 * (deferred) play runtime. It bakes in everything a runtime needs WITHOUT having
 * to recompute: the authored nodes (minus layout) + edges, the AUTOMATIC edges
 * derived from configs (the échec→Mort fatal links, KR-067) folded into one edge
 * list, the resolved object catalog (KR-062), and a referential-integrity report.
 */
export interface PlayExport {
	format: typeof PLAY_EXPORT_FORMAT
	version: typeof PLAY_EXPORT_VERSION
	exportedAt: string
	book: { id: string; title: string }
	nodes: PlayNode[]
	edges: Edge[]
	objects: GameObject[]
	warnings: PlayWarning[]
}

/** Strip the editor-only `position` from a node — play data carries no layout. */
function toPlayNode(node: BookNode): PlayNode {
	// Copy then drop the optional layout field; everything else is play data verbatim.
	const play: BookNode = { ...node }
	delete play.position
	return play
}

/**
 * Collect every dangling reference in the book (KR-021) — references are by
 * stable id (KR-003), so a target/object that no longer resolves is a real
 * authoring gap. Validates: edge targets, the per-choice hidden-prereq object +
 * countdown fallback (choice-linking, KR-062/063), the monster victoire/fuite
 * targets + PNJ « mène à »/réutilisé refs, and a décor « prendre dans la liste »
 * objectRef (action-decor, KR-021). Each is surfaced, never silently dropped.
 */
/** True when `target` is set (non-empty) but not present in `nodeIds` — a dangling reference. */
function isDanglingRef(target: string | undefined, nodeIds: Set<string>): boolean {
	return target !== undefined && target !== '' && !nodeIds.has(target)
}

function collectWarnings(book: Book, objectIds: Set<string>): PlayWarning[] {
	const warnings: PlayWarning[] = []
	const nodeIds = new Set(book.nodes.map((n) => n.id))
	const titleOf = (id: string): string => {
		const node = getNode(book, id)
		return node === null ? id : nodeTitle(node)
	}

	for (const edge of book.edges) {
		if (!nodeIds.has(edge.to)) {
			warnings.push({
				code: 'dangling-edge-target',
				message: `Le choix « ${edge.label ?? edge.kind} » mène à une cible supprimée.`,
				edgeId: edge.id,
				ref: edge.to,
			})
		}
		if (edge.prereq !== undefined) {
			if (edge.prereq.objectId === '') {
				warnings.push({
					code: 'unconfigured-prereq',
					message: 'Un pré-requis caché n’a pas d’objet choisi.',
					edgeId: edge.id,
				})
			} else if (!objectIds.has(edge.prereq.objectId)) {
				warnings.push({
					code: 'dangling-prereq-object',
					message: 'Un pré-requis caché exige un objet introuvable (supprimé).',
					edgeId: edge.id,
					ref: edge.prereq.objectId,
				})
			}
		}
		if (edge.countdown !== undefined) {
			if (edge.countdown.fallback === '') {
				warnings.push({
					code: 'unconfigured-countdown',
					message: 'Un compte à rebours n’a pas de nœud de repli choisi.',
					edgeId: edge.id,
				})
			} else if (!nodeIds.has(edge.countdown.fallback)) {
				warnings.push({
					code: 'dangling-countdown-fallback',
					message: 'Un compte à rebours se replie sur une cible supprimée.',
					edgeId: edge.id,
					ref: edge.countdown.fallback,
				})
			}
		}
	}

	for (const node of book.nodes) {
		const here = `Le nœud « ${titleOf(node.id)} »`
		// Monster victoire/fuite targets (set-but-unresolved is dangling; unset is legit).
		for (const target of [node.monster?.victoryTarget, node.monster?.fleeTarget]) {
			if (isDanglingRef(target, nodeIds)) {
				warnings.push({
					code: 'dangling-monster-target',
					message: `${here} (monstre) mène à une cible supprimée.`,
					nodeId: node.id,
					ref: target,
				})
			}
		}
		// PNJ « mène à » target + a reused-PNJ reference (must point at a real node).
		const pnjTarget = node.pnj?.target
		if (isDanglingRef(pnjTarget, nodeIds)) {
			warnings.push({
				code: 'dangling-pnj-target',
				message: `${here} (PNJ) mène à une cible supprimée.`,
				nodeId: node.id,
				ref: pnjTarget as string,
			})
		}
		const pnjRef = node.pnj?.pnjRef
		if (isDanglingRef(pnjRef, nodeIds)) {
			warnings.push({
				code: 'dangling-pnj-target',
				message: `${here} réutilise un PNJ supprimé.`,
				nodeId: node.id,
				ref: pnjRef as string,
			})
		}
		// Décor « prendre dans la liste » references to a catalog object by id.
		// Unlike prereq/countdown, objectRef has no '' "not yet chosen" sentinel (the
		// reuse picker only ever emits a real id), so any non-resolving value is dangling.
		for (const takeable of node.decor?.objects ?? []) {
			if (takeable.objectRef !== undefined && !objectIds.has(takeable.objectRef)) {
				warnings.push({
					code: 'dangling-object-ref',
					message: `${here} réutilise un objet introuvable (supprimé).`,
					nodeId: node.id,
					ref: takeable.objectRef,
				})
			}
		}
	}

	return warnings
}

/**
 * Build the play-ready export document for a book (book-export). A PURE transform
 * over the book (KR-020) — no mutation, no I/O — so it is trivially testable and
 * reused by any export surface. The caller serialises + downloads it.
 */
export function exportBookForPlay(book: Book): PlayExport {
	const objects = collectObjects(book)
	const objectIds = new Set(objects.map((o) => o.id))
	return {
		format: PLAY_EXPORT_FORMAT,
		version: PLAY_EXPORT_VERSION,
		exportedAt: new Date().toISOString(),
		book: { id: book.id, title: book.title },
		nodes: book.nodes.map(toPlayNode),
		// Authored edges + the config-derived automatic edges (fatal→Mort, KR-067),
		// folded into one list so the runtime never recomputes them.
		edges: [...book.edges, ...deriveAutomaticEdges(book)],
		objects,
		warnings: collectWarnings(book, objectIds),
	}
}
