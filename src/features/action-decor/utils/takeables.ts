import {
	createId,
	findObject,
	type BadgeTone,
	type Book,
	type DecorConfig,
	type DecorInteraction,
	type DecorReveal,
	type GameObject,
	type TakeableKind,
	type TakeableObject,
} from '../../../brain'

/**
 * Single source for the « utile / leurre » closed set (KR-117): each kind's
 * label + Badge tone is written once here, never duplicated across the option
 * list and the row badge, and never branched on with `kind === 'utile' ? …`.
 * Tones stay neutral/muted — never good/bad, which are reserved for the only
 * semantic outcomes réussite/échec (KR-091).
 */
export const TAKEABLE_KINDS: Record<TakeableKind, { label: string; tone: BadgeTone }> = {
	utile: { label: 'utile', tone: 'neutral' },
	leurre: { label: 'leurre', tone: 'muted' },
}

/** Option list for the utile/leurre control, derived from the registry (KR-117). */
export const TAKEABLE_KIND_VALUES = Object.keys(TAKEABLE_KINDS) as TakeableKind[]

/**
 * The takeable objects of a décor config, migrating the walking-skeleton single
 * `object` to the iteration-1 `objects` list on read (KR-090). A persisted book
 * may still carry the old shape; surface it as one « utile » takeable so nothing
 * is lost, and let the next write canonicalise to `objects`.
 */
export function takeablesOf(decor: DecorConfig): TakeableObject[] {
	if (decor.objects !== undefined) return decor.objects
	if (decor.object !== undefined) return [{ object: decor.object, kind: 'utile' }]
	return []
}

/** A fresh, empty « own » takeable with a stable object id minted once (KR-003). */
export function blankTakeable(): TakeableObject {
	return { object: { id: createId('object'), name: '', description: '' }, kind: 'utile' }
}

/** A « prendre dans la liste » takeable that REFERENCES an existing object by id (iter 3). */
export function refTakeable(objectId: string): TakeableObject {
	return { objectRef: objectId, kind: 'utile' }
}

/** Whether a takeable reuses an existing catalog object (vs authoring its own). */
export function isRefTakeable(takeable: TakeableObject): boolean {
	return takeable.objectRef !== undefined
}

/** The takeable's stable id — its own object's id, or the referenced object id. */
export function takeableId(takeable: TakeableObject): string {
	return takeable.object?.id ?? takeable.objectRef ?? ''
}

/**
 * Resolve a takeable to its GameObject: the authored object for an « own »
 * takeable, or the live catalog lookup for a reference (KR-062). Returns null
 * when a reference dangles (its target object was deleted) — surfaced, not
 * silently dropped (KR-021).
 */
export function resolveTakeableObject(book: Book | null, takeable: TakeableObject): GameObject | null {
	if (takeable.object !== undefined) return takeable.object
	if (takeable.objectRef !== undefined) return findObject(book, takeable.objectRef)
	return null
}

/**
 * The PER-INTERACTION reveals of a décor config, migrating the iteration-2 single
 * shared `reveal` on read (KR-090): a persisted book may still carry one `reveal`
 * that both écouter and fouiller used — attribute it to the node's CURRENT
 * interaction so its text is not lost, and let the next write canonicalise to
 * `reveals`. `prendre` never carries a reveal.
 */
export function revealsOf(decor: DecorConfig): Partial<Record<DecorInteraction, DecorReveal>> {
	if (decor.reveals !== undefined) return decor.reveals
	if (decor.reveal !== undefined && decor.interaction !== 'prendre') return { [decor.interaction]: decor.reveal }
	return {}
}
