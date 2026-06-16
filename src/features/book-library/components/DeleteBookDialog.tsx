import { Modal, type Book } from '../../../brain'

export interface DeleteBookDialogProps {
	book: Book
	onCancel: () => void
	onConfirm: () => void
}

/**
 * Confirmation for the dangerous « delete book » action: names the book,
 * states the deletion is permanent, and offers a labelled cancel path. The
 * confirm button is error-toned (confirmTone="error"), per the dangerous-
 * action rule.
 */
export function DeleteBookDialog({ book, onCancel, onConfirm }: DeleteBookDialogProps): JSX.Element {
	return (
		<Modal
			title="Supprimer le livre"
			cancelLabel="Annuler"
			confirmLabel="Supprimer"
			confirmTone="error"
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
				Le livre « <strong>{book.title}</strong> » et tout son arbre seront supprimés définitivement. Cette action est
				irréversible.
			</p>
		</Modal>
	)
}
