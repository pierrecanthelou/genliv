import { useState } from 'react'
import { useCreateDossier } from '../hooks/useCreateDossier'
import { NewDossierButton } from './NewDossierButton'
import { NewDossierDialog } from './NewDossierDialog'

/**
 * The « + Nouveau dossier » affordance + creation dialog, decoupled from any
 * page chrome so the composition root can drop it into the library grid
 * (book-library) without the two features importing each other. On create,
 * useCreateDossier seeds the dossier, opens it, and navigates to its editor.
 */
export function CreateDossierEntry(): JSX.Element {
	const [dialogOpen, setDialogOpen] = useState(false)
	const createDossier = useCreateDossier()

	function handleCreate(title: string) {
		setDialogOpen(false)
		createDossier(title)
	}

	return (
		<>
			<NewDossierButton onClick={() => setDialogOpen(true)} />
			{dialogOpen && <NewDossierDialog onCancel={() => setDialogOpen(false)} onCreate={handleCreate} />}
		</>
	)
}
