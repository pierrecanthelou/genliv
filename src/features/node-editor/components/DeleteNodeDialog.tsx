import { Modal } from '../../../brain'

export interface DeleteNodeDialogProps {
	onCancel: () => void
	onConfirm: () => void
}

/**
 * Confirmation for the dangerous « delete node » action. Per the dangerous-
 * action rule: names the action, explains what happens (edges also removed),
 * offers a cancel path, confirm button is error-toned.
 */
export function DeleteNodeDialog({ onCancel, onConfirm }: DeleteNodeDialogProps): JSX.Element {
	return (
		<Modal
			title="Supprimer le nœud"
			cancelLabel="Annuler"
			confirmLabel="Supprimer"
			confirmTone="error"
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
				Ce nœud et tous ses liens entrants et sortants seront supprimés définitivement. Cette action est irréversible.
			</p>
		</Modal>
	)
}
