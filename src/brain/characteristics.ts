/**
 * CHARACTERISTICS — the closed set of hero caractéristiques a skill roll can test
 * (§ 05). A single source (KR-117), placed in brain like ROLL_OUTCOMES because
 * more than one skill-roll editor reuses it (action-trap now; action-decor's
 * « jet requis » later). Editors derive the option list + labels from here, never
 * a hardcoded list or a `trait === 'habilete'` branch. The classic gamebook trio
 * for the low-fi pass; an author-defined caractéristique set is a later feature.
 */
export type Characteristic = 'habilete' | 'endurance' | 'chance'

export const CHARACTERISTICS: Record<Characteristic, { label: string }> = {
	habilete: { label: 'Habileté' },
	endurance: { label: 'Endurance' },
	chance: { label: 'Chance' },
}

/** Option order, derived from the registry (KR-117). */
export const CHARACTERISTIC_VALUES = Object.keys(CHARACTERISTICS) as Characteristic[]

/** The caractéristique a fresh skill roll defaults to. */
export const DEFAULT_CHARACTERISTIC: Characteristic = 'habilete'
