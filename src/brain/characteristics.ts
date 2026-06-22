/**
 * CHARACTERISTICS — the 8 caractéristiques of the genliv game system (§ 1),
 * capped at 12. REPLACES the low-fi placeholder trio (habileté/endurance/chance)
 * that characteristics.ts itself flagged as "an author-defined caractéristique
 * set is a later feature" — this is that feature.
 *
 * Same KR-117 registry shape: a single Record; every editor (skill-roll trait
 * picker, monster stat block, progression shop) derives options/labels from here,
 * never a hardcoded list, never a `trait === 'force'` branch. When PLAY MODE
 * lands, per-caractéristique BEHAVIOUR (generation/test) becomes descriptor
 * fields here, NOT an if/switch at call sites (KR-117).
 *
 * MIGRATION: SkillRoll.trait stays a free `string` (forward-compat, as before);
 * a persisted legacy trait id ('habilete'…) simply highlights no segment and is
 * surfaced, never coerced (KR-021).
 */
export type Characteristic = 'FO' | 'AG' | 'DX' | 'EN' | 'IN' | 'IG' | 'CA' | 'SE'

export interface CharacteristicDescriptor {
	/** Full label. */
	label: string
	/** Two-letter code for dense stat blocks / badges (JetBrains Mono). */
	abbr: string
	/** One-line meaning, for tooltips / the progression shop. */
	describe: string
}

export const CHARACTERISTICS: Record<Characteristic, CharacteristicDescriptor> = {
	FO: { label: 'Force', abbr: 'FO', describe: 'Puissance physique.' },
	AG: { label: 'Agilité', abbr: 'AG', describe: 'Souplesse et vitesse.' },
	DX: { label: 'Dextérité', abbr: 'DX', describe: 'Précision manuelle.' },
	EN: { label: 'Endurance', abbr: 'EN', describe: 'Résistance physique et souffle.' },
	IN: { label: 'Intelligence', abbr: 'IN', describe: 'Connaissances et mémoire.' },
	IG: { label: 'Ingéniosité', abbr: 'IG', describe: 'Débrouillardise et perception.' },
	CA: { label: 'Caractère', abbr: 'CA', describe: 'Volonté et résilience mentale.' },
	SE: { label: 'Sens', abbr: 'SE', describe: 'Perception sensorielle et intuition.' },
}

/** All 8 hero characteristics, derived from the registry (KR-117). */
export const CHARACTERISTIC_VALUES = Object.keys(CHARACTERISTICS) as Characteristic[]

/** The caractéristique a fresh skill roll defaults to. */
export const DEFAULT_CHARACTERISTIC: Characteristic = 'FO'

/** Hard cap on any caractéristique (§ 1, § 5). */
export const CHARACTERISTIC_MAX = 12

/** The 5 caracs a MONSTER carries (§ 4) — the hero's 7 minus IN and CA. */
export type MonsterCharacteristic = Extract<Characteristic, 'FO' | 'AG' | 'DX' | 'EN' | 'IG'>
export const MONSTER_CHARACTERISTICS: MonsterCharacteristic[] = ['FO', 'AG', 'DX', 'EN', 'IG']

// ─────────────────────────────────────────────────────────────────────────────
// PLAY MODE (deferred) — pure helpers, no state. Here so the authoring schema is
// dimensioned right; wired when the play runtime lands.
// ─────────────────────────────────────────────────────────────────────────────

/** A full hero sheet (play mode). Values are 1..CHARACTERISTIC_MAX. */
export type HeroStats = Record<Characteristic, number>

/** PV max = FO + AG + EN (§ 1). */
export function maxPV(s: Pick<HeroStats, 'FO' | 'AG' | 'EN'>): number {
	return s.FO + s.AG + s.EN
}

/** Unconscious at PV ≤ 0; dead at PV ≤ -CA (§ 1). */
export function healthState(pv: number, CA: number): 'ok' | 'inconscient' | 'mort' {
	if (pv <= -CA) return 'mort'
	if (pv <= 0) return 'inconscient'
	return 'ok'
}

/**
 * Endurance malus on the CURRENT gauge (§ 1, corrected ordering — most severe
 * first). Applies to BOTH Attaque and Dégâts.
 */
export function enduranceMalus(pe: number, EN: number): 0 | -1 | -2 | -3 {
	if (pe <= 0) return -3
	if (pe < EN / 5) return -2
	if (pe < EN / 3) return -1
	return 0
}
