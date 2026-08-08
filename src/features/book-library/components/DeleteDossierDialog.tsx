import { Modal, type DossierResume } from '../../../brain'

export interface DeleteDossierDialogProps {
	dossier: DossierResume
	onCancel: () => void
	onConfirm: () => void
}

/**
 * Confirmation for the dangerous « delete dossier » action — names the
 * dossier by its title when readable, by its bare id otherwise (the branch
 * the union type allows), states the deletion is permanent, and offers a
 * labelled cancel path. confirmTone="error" per the dangerous-action rule.
 */
export function DeleteDossierDialog({ dossier, onCancel, onConfirm }: DeleteDossierDialogProps): JSX.Element {
	return (
		<Modal
			title="Supprimer le dossier"
			cancelLabel="Annuler"
			confirmLabel="Supprimer"
			confirmTone="error"
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
				{dossier.lisible ? (
					<>
						Le dossier « <strong>{dossier.titre}</strong> » sera supprimé définitivement. Cette action est irréversible.
					</>
				) : (
					<>
						Le dossier <strong>{dossier.id}</strong> sera supprimé définitivement. Cette action est irréversible.
					</>
				)}
			</p>
		</Modal>
	)
}
