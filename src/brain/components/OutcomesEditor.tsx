import { Badge } from './Badge'
import { Field } from './Field'
import { ROLL_OUTCOMES } from '../outcomes'
import type { RollOutcome } from '../types'

const OUTCOMES = Object.keys(ROLL_OUTCOMES) as RollOutcome[]

/**
 * OutcomesEditor — the réussite/échec reveal-text rows shared by every
 * skill-roll/combat editor (monster, trap, later décor jets). Each row is a
 * semantic Badge (good/bad — the only semantic colours) + a player-facing
 * reveal Field, derived from the brain ROLL_OUTCOMES registry (KR-117/091),
 * never hardcoded per feature. Lives in brain because >1 feature renders it
 * (KR-109) — same reasoning as ObjectEditor. Controlled: the owner persists
 * `onChange` through BookService.
 */
export interface OutcomesEditorProps {
	value: Record<RollOutcome, string>
	onChange: (outcome: RollOutcome, text: string) => void
}

export function OutcomesEditor({ value, onChange }: OutcomesEditorProps): JSX.Element {
	return (
		<>
			{OUTCOMES.map((outcome) => (
				<div key={outcome} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
					<Badge tone={ROLL_OUTCOMES[outcome].tone}>{ROLL_OUTCOMES[outcome].label}</Badge>
					<Field
						ariaLabel={`Texte affiché au joueur si ${ROLL_OUTCOMES[outcome].label}`}
						multiline
						rows={2}
						value={value[outcome]}
						placeholder="Texte affiché au joueur…"
						onChange={(e) => onChange(outcome, e.target.value)}
					/>
				</div>
			))}
		</>
	)
}
