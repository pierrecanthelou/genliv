import {
	Toggle,
	ObjectEditor,
	SegmentedControl,
	IconButton,
	HIT_TARGET_MIN,
	type ObjectDraft,
	type PnjGift,
	type PnjGiftEffect,
	type SegmentedOption,
} from '../../../brain'
import { GIFT_EFFECTS, GIFT_EFFECT_VALUES, clampGiftValue, blankGift } from '../utils/gift'

const EFFECT_OPTIONS: SegmentedOption<PnjGiftEffect>[] = GIFT_EFFECT_VALUES.map((value) => ({
	value,
	label: GIFT_EFFECTS[value].short,
}))

export interface GiftSectionProps {
	gift: PnjGift | undefined
	onChange: (gift: PnjGift | undefined) => void
}

/**
 * « Le PNJ donne un objet » (§ 4A): the gift toggle revealing the shared brain
 * ObjectEditor (KR-052), the gift's effect (a closed set from GIFT_EFFECTS,
 * KR-117) and — for a stat bonus — a value stepper. Controlled: the owner
 * persists `onChange` through BookService (KR-020); turning the toggle off drops
 * the gift, on seeds a fresh one with a stable id (KR-003).
 */
export function GiftSection({ gift, onChange }: GiftSectionProps): JSX.Element {
	function toggle(on: boolean): void {
		onChange(on ? blankGift() : undefined)
	}
	function setObject(draft: ObjectDraft): void {
		if (gift === undefined) return
		onChange({ ...gift, object: { ...gift.object, ...draft } })
	}
	function setEffect(effect: PnjGiftEffect): void {
		if (gift === undefined) return
		// Re-clamp the value when switching to a stat effect so a migrated gift
		// (legacy 'scenario' carries value 0) never renders an out-of-range « +0 ».
		const value = GIFT_EFFECTS[effect].hasValue ? clampGiftValue(gift.value) : gift.value
		onChange({ ...gift, effect, value })
	}
	function setValue(value: number): void {
		if (gift === undefined) return
		onChange({ ...gift, value: clampGiftValue(value) })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Toggle label="Le PNJ donne un objet" checked={gift !== undefined} onChange={toggle} />
			{gift !== undefined && (
				<>
					<ObjectEditor value={gift.object} onChange={setObject} />
					<div>
						<span style={label}>Effet du don</span>
						<SegmentedControl
							ariaLabel="Effet du don"
							options={EFFECT_OPTIONS}
							value={gift.effect}
							onChange={setEffect}
						/>
					</div>
					{GIFT_EFFECTS[gift.effect].hasValue && <ValueStepper value={gift.value} onChange={setValue} />}
				</>
			)}
		</div>
	)
}

interface ValueStepperProps {
	value: number
	onChange: (value: number) => void
}

/** A − N + stepper for the gift's stat bonus, clamped to the gift bounds. */
function ValueStepper({ value, onChange }: ValueStepperProps): JSX.Element {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
			<span style={label}>Valeur du bonus</span>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
				<IconButton label="Diminuer la valeur" size={HIT_TARGET_MIN} onClick={() => onChange(value - 1)}>
					−
				</IconButton>
				<span style={valueDisplay} aria-live="polite">
					+{value}
				</span>
				<IconButton label="Augmenter la valeur" size={HIT_TARGET_MIN} onClick={() => onChange(value + 1)}>
					+
				</IconButton>
			</div>
		</div>
	)
}

const label: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const valueDisplay: React.CSSProperties = {
	minWidth: 36,
	textAlign: 'center',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}
