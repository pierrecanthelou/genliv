import { createId, type GameObject, type PnjConfig, type PnjGift, type PnjGiftEffect } from '../../../brain'

/**
 * Single source for the gift-effect closed set (KR-117): each effect's labels +
 * whether it carries a numeric value, written once. Option list, the segment
 * labels and the value-stepper visibility all derive from here — never a
 * `effect === 'pv' ? …` branch.
 */
export const GIFT_EFFECTS: Record<PnjGiftEffect, { label: string; short: string; hasValue: boolean }> = {
	pv: { label: 'Points de vie', short: 'PV', hasValue: true },
	attaque: { label: 'Attaque', short: 'Attaque', hasValue: true },
	defense: { label: 'Défense', short: 'Défense', hasValue: true },
	scenario: { label: 'Objet de scénario', short: 'Scénario', hasValue: false },
}

/** Effect option order, derived from the registry (KR-117). */
export const GIFT_EFFECT_VALUES = Object.keys(GIFT_EFFECTS) as PnjGiftEffect[]

/** Value-stepper bounds for a stat bonus. */
export const GIFT_VALUE_MIN = 1
export const GIFT_VALUE_MAX = 99

/** Clamp a stat-bonus value into [GIFT_VALUE_MIN, GIFT_VALUE_MAX]. */
export function clampGiftValue(value: number): number {
	if (Number.isNaN(value)) return GIFT_VALUE_MIN
	return Math.min(GIFT_VALUE_MAX, Math.max(GIFT_VALUE_MIN, Math.round(value)))
}

/**
 * The PNJ's gift, migrating the walking-skeleton bare GameObject to a PnjGift on
 * read (KR-116): a persisted book may still carry the old shape, so surface it as
 * a plot object ('scenario'); the next write canonicalises it.
 */
export function giftOf(pnj: PnjConfig): PnjGift | undefined {
	const gift = pnj.gift as PnjGift | GameObject | undefined
	if (gift === undefined) return undefined
	if ('object' in gift) return gift
	return { object: gift, effect: 'scenario', value: 0 }
}

/** A fresh gift with a stable object id minted once (KR-003), defaulting to +1 PV. */
export function blankGift(): PnjGift {
	return { object: { id: createId('object'), name: '', description: '' }, effect: 'pv', value: GIFT_VALUE_MIN }
}
