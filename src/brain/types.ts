/**
 * Domain model — the single thing that persists for a book is its
 * tree of nodes + edges. Everything else (canvas, outline, preview)
 * is a view over this. References are by stable id, never by name.
 */

/**
 * Node + edge kinds are PLAIN string literal unions (not classes): the book is
 * serialised to/from JSON by the PersistenceService, so a class hierarchy would
 * fight (de)serialisation. Both unions are derived from the keys of the
 * data-driven kind registry (`kinds.ts`, KR-068) — the single source for the
 * kind set AND its per-kind behaviour, the idiomatic alternative to "replace
 * conditional with polymorphism" for a serialised domain. Re-exported here so
 * the domain model reads as one piece.
 */
import type { NodeKind, EdgeKind } from './kinds'
export type { NodeKind, EdgeKind }

/** Required-action slot on a node; concrete editors come from the ActionRegistry. */
export type NodeActionType = 'aucune' | 'pnj' | 'decor' | 'piege' | 'monstre'

/** Cloud-sync state of the local-first store (cloud-sync). `offline` = local-only (no transport). */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

/**
 * A game object. The `name` is internal (author-facing); the `description` is
 * read by the player (domain rule, KR-052). Referenced by stable `id`, never by
 * name (KR-003). Shared shape edited through the brain ObjectEditor.
 */
export interface GameObject {
	id: string
	name: string
	description: string
}

/** Décor interaction: take an object, listen, or search (domain rule; KR-090). */
export type DecorInteraction = 'prendre' | 'ecouter' | 'fouiller'

/**
 * Whether a takeable object is genuinely useful or a decoy (leurre). A closed
 * set surfaced through the action-decor TAKEABLE_KINDS registry (KR-117) — never
 * branched on with `kind === 'utile' ? …`.
 */
export type TakeableKind = 'utile' | 'leurre'

/**
 * An optional skill roll gating an action (décor « prendre »): which
 * caractéristique is tested, the difficulty, and the player-facing text shown on
 * a failed roll. réussite/échec stay the only semantic outcomes (KR-091); here
 * only the échec branch carries authored text (a réussite simply takes the object).
 */
export interface SkillRoll {
	/** The tested caractéristique (a Characteristic key; see CHARACTERISTICS). */
	trait: string
	/** Target difficulty of the roll. */
	difficulty: number
	/**
	 * Player-facing text shown when the roll fails. Optional: the décor « jet
	 * requis » carries it, but a trap's réussite/échec reveal lives in its
	 * `outcomes` (OutcomesEditor), so a trap roll leaves it unset.
	 */
	failureText?: string
	/**
	 * « Variante piège » (action-trap iter 3): a failed roll is LETHAL — taking
	 * the object triggers a trap whose échec leads to Mort. The actual échec→Mort
	 * edge is DERIVED (deriveAutomaticEdges), never authored (KR-067), reusing the
	 * trap's fatal→Mort path. Unset = a plain failure (only `failureText` is shown).
	 */
	fatal?: boolean
}

/**
 * One takeable object in a décor « prendre » list: whether it is useful or a
 * leurre, and an optional « jet requis » to take it, plus EITHER an authored
 * object (`object`, an « own » takeable) OR a REFERENCE to an existing catalog
 * object by stable id (`objectRef`, « prendre dans la liste », action-decor
 * iter 3). Exactly one of `object` / `objectRef` is set — a reference is
 * resolved LIVE against the book's object catalog (collectObjects), never
 * copied, so the object stays single-sourced on its authoring node (KR-020/062);
 * a ref whose target was deleted dangles and is surfaced (KR-021).
 */
export interface TakeableObject {
	object?: GameObject
	/** Stable id of an existing catalog object reused here (mutually exclusive with `object`). */
	objectRef?: string
	kind: TakeableKind
	roll?: SkillRoll
}

/**
 * The reveal of a décor « écouter » / « fouiller » interaction: what the player
 * hears/finds, optionally gated by a skill roll. When `roll` is set the player
 * tests it and `outcomes` carries the réussite/échec reveal text (the only
 * semantic outcomes, KR-091); ungated, only `text` is shown.
 */
export interface DecorReveal {
	/** Base reveal text — what the player hears (écouter) / finds (fouiller). */
	text: string
	/** Optional gating roll (trait + difficulty); `failureText` is unused here. */
	roll?: SkillRoll
	/** réussite/échec reveal text, authored only when a `roll` gates the reveal. */
	outcomes?: Record<RollOutcome, string>
}

/** Per-node décor action config (owned by action-decor). */
export interface DecorConfig {
	interaction: DecorInteraction
	/** « Prendre » takeable objects (iteration 1+). */
	objects?: TakeableObject[]
	/**
	 * « Écouter » / « Fouiller » reveal + optional skill roll, kept PER INTERACTION
	 * so each one carries its OWN heard/found text (switching the interaction tab
	 * shows that interaction's reveal, not the previous one). `prendre` has no
	 * reveal (it uses `objects`).
	 */
	reveals?: Partial<Record<DecorInteraction, DecorReveal>>
	/**
	 * @deprecated single shared reveal — migrated to `reveals[interaction]` on read
	 * (revealsOf) and on the next write; kept so old persisted books still load.
	 */
	reveal?: DecorReveal
	/**
	 * @deprecated walking-skeleton single object — migrated to `objects` on read
	 * (takeablesOf) and on the next write; kept so old persisted books still load.
	 */
	object?: GameObject
}

/**
 * The outcome of a skill roll / combat — the ONLY semantic outcomes in the
 * domain, and the only ones that carry a semantic colour (réussite = good,
 * échec = bad). See the ROLL_OUTCOMES registry for their labels + tones.
 */
export type RollOutcome = 'reussite' | 'echec'

/** Per-node monster action config (owned by action-monster). */
export interface MonsterConfig {
	/** The monster's name (author/display). */
	name: string
	/** Combat stats (§ 4D). Skeleton monsters without these default in via the editor. */
	pv: number
	attack: number
	defense: number
	/** Player-facing reveal text shown per combat outcome (réussite / échec). */
	outcomes: Record<RollOutcome, string>
	/**
	 * Victoire (réussite) → the node the player continues to (« poursuit »), and
	 * fuite → the node the player relinks to (« reliaison »). Node id references —
	 * structural screens are never targets (KR-067) and a deleted target is
	 * surfaced (KR-021/063). Défaite (échec) → Mort is automatic (KR-067), so it
	 * carries no field. Promotion to rendered edges via the dedicated combat path
	 * (not the manual edge API) is later.
	 */
	victoryTarget?: string
	fleeTarget?: string
	/**
	 * « Butin lâché » — the object the monster drops on victory (iteration 2),
	 * authored via the shared brain ObjectEditor with a stable id (KR-052/003).
	 * Absent when the monster drops nothing.
	 */
	loot?: GameObject
}

/** Per-node trap action config (owned by action-trap). */
export interface TrapConfig {
	/** What the player encounters (author/encounter description). */
	description: string
	/** The skill roll gating the outcome (caractéristique + difficulté, § 05). */
	roll?: SkillRoll
	/** Player-facing reveal text per roll outcome (réussite / échec). */
	outcomes: Record<RollOutcome, string>
	/** The « échec sanctionné » variant: a failed roll is lethal (leads to Mort). */
	fatal: boolean
}

/**
 * What a PNJ's gift does for the player: a stat bonus or a plot object. A closed
 * set surfaced through the action-pnj GIFT_EFFECTS registry (KR-117) — never
 * branched on with `effect === 'pv' ? …`. The editor only needs its data
 * (label/value); when PLAY MODE adds « apply this effect », that behaviour
 * becomes a descriptor field on GIFT_EFFECTS, not an if/switch (KR-117).
 */
export type PnjGiftEffect = 'pv' | 'attaque' | 'defense' | 'scenario'

/**
 * The object a PNJ gives, with its effect. `value` is the bonus magnitude for
 * pv/attaque/defense and is ignored for a plot object ('scenario').
 */
export interface PnjGift {
	object: GameObject
	effect: PnjGiftEffect
	value: number
}

/** Per-node PNJ action config (owned by action-pnj). */
export interface PnjConfig {
	/**
	 * When set, this node REUSES the PNJ authored on another node (« choisir dans
	 * le livre », action-pnj iter 3): the value is that owner NODE's id (the PNJ's
	 * stable id, KR-003), and the identity is resolved LIVE from the owner — the
	 * other fields are unused on a reference. A dangling ref (owner deleted or no
	 * longer a PNJ) is surfaced, never silently broken (KR-021). Mutually exclusive
	 * with authoring the fields below.
	 */
	pnjRef?: string
	/** The PNJ's name (author/display). */
	name: string
	/** The PNJ's role / function (« Marchand », « Gardien du seuil »…), optional. */
	role?: string
	/** What the PNJ says — read by the player. */
	dialogue: string
	/** The object the PNJ gives, if any (effect + value + shared ObjectEditor). */
	gift?: PnjGift
	/**
	 * « ensuite le PNJ mène à » — a node the PNJ leads to (a non-choice screen
	 * change, domain brief). A stable node id reference; may dangle if the target
	 * is deleted (surfaced, KR-021/063). Promotion to a real edge via the dedicated
	 * action→target path (like the deferred trap échec→Mort edge, KR-067) is later.
	 */
	target?: string
}

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

export interface Edge {
	id: string
	from: string
	to: string
	kind: EdgeKind
	/** Player-facing choice label (for `choice` edges). */
	label?: string
	/** Hidden-prerequisite rule: the choice is hidden unless the object is owned (KR-062). */
	prereq?: ChoicePrereq
}

export interface Book {
	id: string
	title: string
	createdAt: string
	updatedAt: string
	nodes: BookNode[]
	edges: Edge[]
}
