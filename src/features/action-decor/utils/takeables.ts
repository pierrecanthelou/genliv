import { createId, type BadgeTone, type DecorConfig, type TakeableKind, type TakeableObject } from '../../../brain'

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

/** A fresh, empty takeable with a stable object id minted once (KR-003). */
export function blankTakeable(): TakeableObject {
	return { object: { id: createId('object'), name: '', description: '' }, kind: 'utile' }
}
