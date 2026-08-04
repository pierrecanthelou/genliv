import { useCallback, useState } from 'react'
import { useBrain, inspectDossierFile, type DossierInspection } from '../../../brain'

/**
 * Les cinq états de rendu de la modale (§ 3.2). `'done'` est délibérément
 * absent de la valeur que ce hook DÉRIVE (voir `deriveStep`) : cet état ferme
 * la modale plutôt que d'y rendre quoi que ce soit (« la modale se ferme et
 * une confirmation nomme le dossier importé ») — il se traverse dans le
 * gestionnaire d'événement `confirm`, jamais comme une valeur affichée.
 */
export type ImportStep = 'empty' | 'reading' | 'file-error' | 'invalid' | 'valid' | 'done'

type RenderedStep = Exclude<ImportStep, 'done'>

/**
 * `step` DÉRIVÉ, au rendu, du couple (lecture en cours, dernier verdict) —
 * jamais un miroir `useEffect` (KR-013). Les trois derniers cas viennent tels
 * quels du discriminant `statut` de `DossierInspection` (le contrat du lot 1) ;
 * `empty`/`reading` sont les deux états d'interface qu'aucun verdict ne porte.
 */
function deriveStep(reading: boolean, inspection: DossierInspection | null): RenderedStep {
	if (reading) return 'reading'
	if (inspection === null) return 'empty'
	return inspection.statut
}

export interface UseImportDossierResult {
	step: RenderedStep
	fileName: string | null
	inspection: DossierInspection | null
	/** Lit le fichier choisi (FileReader) puis l'inspecte, SANS l'importer. */
	selectFile: (file: File) => void
	/** Importe le texte déjà inspecté ; persiste et notifie seulement si valide. */
	confirm: () => void
}

/**
 * Orchestre le dépôt d'un fichier de dossier. La lecture passe par
 * `FileReader` puis par `inspectDossierFile` (PURE, brain/) : aucune écriture
 * n'a lieu avant la confirmation explicite de l'auteur. `confirm` appelle
 * `dossiers.importDossier` (qui re-vérifie et persiste) ; si le résultat n'est
 * plus `valid` (ex. import concurrent du même identifiant), le verdict remplace
 * l'aperçu et la modale retombe sur l'état `invalid` au lieu de se fermer.
 */
export function useImportDossier(onImported: (titre: string) => void): UseImportDossierResult {
	const { dossiers } = useBrain()
	const [fileName, setFileName] = useState<string | null>(null)
	const [fileText, setFileText] = useState<string | null>(null)
	const [reading, setReading] = useState(false)
	const [inspection, setInspection] = useState<DossierInspection | null>(null)

	const step = deriveStep(reading, inspection)

	const selectFile = useCallback((file: File) => {
		setFileName(file.name)
		setInspection(null)
		setReading(true)
		const reader = new FileReader()
		reader.onload = () => {
			const texte = typeof reader.result === 'string' ? reader.result : ''
			setFileText(texte)
			setInspection(inspectDossierFile(texte))
			setReading(false)
		}
		reader.readAsText(file)
	}, [])

	const confirm = useCallback(() => {
		if (fileText === null) return
		const resultat = dossiers.importDossier(fileText)
		if (resultat.statut === 'valid') {
			onImported(resultat.dossier.titre)
			return
		}
		// Le verdict a changé entre l'aperçu et la confirmation (ex. un doublon
		// importé entre-temps) : on remplace l'aperçu, la modale reste ouverte.
		setInspection(resultat)
	}, [dossiers, fileText, onImported])

	return { step, fileName, inspection, selectFile, confirm }
}
