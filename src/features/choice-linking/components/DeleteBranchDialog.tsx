import { Modal } from '../../../brain'

export interface DeleteBranchDialogProps {
	/** Title of the branch's destination node (or a « cible supprimée » marker). */
	destination: string
	/** True when this link is the only one reaching the destination — removing it
	    leaves the node unreachable from the tree (KR-064). */
	wouldOrphan: boolean
	onCancel: () => void
	onConfirm: () => void
}

/**
 * Confirmation for the dangerous « delete branch » action: removing an outgoing
 * edge is destructive and irreversible (no undo), so it is gated behind a
 * dialog per the dangerous-action rule. The target NODE is never deleted (only
 * the link); when this is the node's sole incoming link the dialog warns it
 * will become unreachable (KR-064). Confirm is error-toned.
 */
export function DeleteBranchDialog({
	destination,
	wouldOrphan,
	onCancel,
	onConfirm,
}: DeleteBranchDialogProps): JSX.Element {
	return (
		<Modal
			title="Supprimer la branche"
			cancelLabel="Annuler"
			confirmLabel="Supprimer"
			confirmTone="error"
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
				Le lien vers « <strong>{destination}</strong> » sera supprimé. Le nœud lui-même n’est pas supprimé, seulement le
				lien qui y mène.
			</p>
			{wouldOrphan && (
				<p style={{ margin: 'var(--space-3) 0 0', color: 'var(--bad)', lineHeight: 'var(--lh-body)' }}>
					⚠ C’est le seul lien qui mène à « {destination} » : le nœud deviendra inaccessible depuis l’arbre.
				</p>
			)}
		</Modal>
	)
}
