import { useState, type KeyboardEvent } from 'react'
import { Field, Modal } from '../../../brain'

export interface NewBookDialogProps {
	onCancel: () => void
	onCreate: (title: string) => void
}

const PLACEHOLDER = "La Caverne d'Aldûr"

/**
 * Creation dialog: a single « Titre » field plus « Annuler » / « Créer ».
 * « Créer » is disabled while the trimmed title is empty (computed inline,
 * no useEffect derived state — KR-013). Enter submits; trims on submit.
 */
export function NewBookDialog({ onCancel, onCreate }: NewBookDialogProps): JSX.Element {
	const [title, setTitle] = useState('')
	const canCreate = title.trim().length > 0

	function handleCreate() {
		if (!canCreate) return
		onCreate(title.trim())
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleCreate()
		}
	}

	return (
		<Modal
			title="Nouveau livre"
			cancelLabel="Annuler"
			confirmLabel="Créer"
			confirmDisabled={!canCreate}
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={handleCreate}
		>
			<Field
				id="new-book-title"
				label="TITRE"
				value={title}
				placeholder={PLACEHOLDER}
				autoFocus
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
		</Modal>
	)
}
