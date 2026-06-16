import { useBrain, SegmentedControl, type NodeActionType, type SegmentedOption } from '../../../brain'
import { SectionLabel } from './SectionLabel'

/**
 * « Action requise pour poursuivre » — the Open/Closed seam (KR-051). The
 * SegmentedControl options and the mounted editor body come from the
 * ActionRegistry; node-editor contains no action-specific logic. Until the
 * action-* features register, only « Aucune » is available and the body is a
 * coming-soon placeholder.
 */
export interface ActionSectionProps {
	bookId: string
	nodeId: string
	value: NodeActionType
	onChange: (type: NodeActionType) => void
}

export function ActionSection({ bookId, nodeId, value, onChange }: ActionSectionProps): JSX.Element {
	const { actions } = useBrain()
	const registered = actions.list()

	const options: SegmentedOption<NodeActionType>[] = [
		{ value: 'aucune', label: 'Aucune' },
		...registered.map((editor) => ({ value: editor.type, label: editor.label })),
	]

	const editor = actions.get(value)
	const body =
		value === 'aucune'
			? null
			: editor !== null
				? editor.render({ bookId, nodeId })
				: 'Éditeur d’action à venir (action-' + value + ').'

	return (
		<section>
			<SectionLabel>Action requise pour poursuivre</SectionLabel>
			<SegmentedControl options={options} value={value} onChange={onChange} ariaLabel="Action requise" />
			{body !== null && (
				<div
					style={{
						marginTop: 'var(--space-5)',
						border: '1px solid var(--border-subtle)',
						borderRadius: 'var(--r-xl)',
						background: 'var(--surface-sunken)',
						padding: 'var(--space-5)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-faint)',
					}}
				>
					{body}
				</div>
			)}
		</section>
	)
}
