import type { FileReadErrorCode } from '../../brain'

/**
 * Les textes que CETTE feature possède — libellés de l'affordance, de la
 * dropzone, des badges d'état et du registre fichier. Tout ce qui décrit une
 * `DossierIssue` (QUOI / QUOI FAIRE) vient de `dossierIssueRemediation` côté
 * `brain/dossier/issues.ts` : ce fichier ne recopie AUCUN de ces textes, pour
 * ne jamais devenir une seconde source de vérité.
 */

export const IMPORT_BUTTON_LABEL = 'Importer un dossier'

/** Le glyphe partagé par l'affordance et la dropzone (jamais ⇪, jamais +). */
export const IMPORT_GLYPH = '⬚'

export const DROPZONE_LABEL = `${IMPORT_GLYPH} Cliquer pour choisir un fichier .json`

export const READING_BADGE_LABEL = 'Validation…'
export const FILE_ERROR_BADGE_LABEL = 'Fichier illisible'
export const VALID_BADGE_LABEL = 'Dossier valide'

export const RETRY_LABEL = '↪ Choisir un autre fichier'

export const REASSURANCE_TEXT = "Prêt à être importé. La bibliothèque n'affiche pas encore les dossiers importés."

export const WARNINGS_EYEBROW = "AVERTISSEMENTS (N'EMPÊCHENT PAS L'IMPORT)"

/**
 * Le registre fichier (KR-117) — les trois façons dont un fichier échoue avant
 * la question du schéma. Fermé par construction : ajouter un `FileReadErrorCode`
 * sans son message ne compile pas.
 */
export const FILE_ERROR_MESSAGES: Record<FileReadErrorCode, string> = {
	'fichier-vide': 'Ce fichier est vide.',
	'json-invalide': "Ce fichier n'est pas un JSON valide — il a peut-être été tronqué ou modifié à la main.",
	'racine-non-objet': "Ce fichier ne contient pas un dossier d'aventure.",
}

/** La seule trace de l'import réussi jusqu'à la n° 2 (§ 3.2, état `done`). */
export function importConfirmationMessage(titre: string): string {
	return `Dossier « ${titre} » importé.`
}
