import type { Dossier } from './types'
import type { DossierIssue } from './issues'
import { validateDossier } from './validate'
import { estObjet } from './identifiers'

/**
 * La LECTURE d'un fichier de dossier — le `JSON.parse` vit ici, dans `brain/`, et
 * non dans le composant qui dépose le fichier. C'est ce qui rend « fichier vide »
 * et « JSON malformé » observables sous la porte de qualité au lieu de les
 * laisser hors instrument.
 *
 * `inspectDossierFile` est PURE : elle prend le texte, elle rend un verdict. Elle
 * ne touche ni au magasin, ni au DOM, ni au presse-papiers. La modale d'import en
 * dérive son état — le discriminant `statut` pilote directement trois de ses cinq
 * états ; les deux autres (`empty`, `reading`) sont des états d'interface qu'aucun
 * verdict ne peut porter.
 */

/**
 * Les trois façons dont un fichier échoue AVANT que la question du schéma se
 * pose. Aucune ne produit d'anomalie de dossier : un `JSON.parse` en échec ne
 * laisse aucune entité à résoudre, donc aucune anatomie OÙ / QUOI / QUOI FAIRE
 * n'a de sens — d'où un registre séparé plutôt qu'un neuvième `DossierIssueCode`.
 */
export type FileReadErrorCode = 'fichier-vide' | 'json-invalide' | 'racine-non-objet'

/**
 * Le verdict d'inspection d'un fichier, en UNION DISCRIMINÉE sur `statut`. Les
 * trois branches sont exhaustives et mutuellement exclusives : un consommateur
 * qui branche sur `statut` ne peut pas oublier un cas ni en inventer un.
 *
 * Un `warning` accompagne un dossier VALIDE : il ne dégrade pas le verdict, ne
 * bloque pas l'import et n'a rien à faire dans la branche `invalid`.
 */
export type DossierInspection =
	| { statut: 'file-error'; code: FileReadErrorCode }
	| { statut: 'invalid'; errors: DossierIssue[]; warnings: DossierIssue[] }
	| { statut: 'valid'; dossier: Dossier; warnings: DossierIssue[] }

export function inspectDossierFile(text: string): DossierInspection {
	if (text.trim() === '') return { statut: 'file-error', code: 'fichier-vide' }

	let parsed: unknown
	try {
		parsed = JSON.parse(text)
	} catch {
		return { statut: 'file-error', code: 'json-invalide' }
	}

	// Un tableau, un nombre ou `null` traversent `JSON.parse` sans lever : ce n'est
	// pas un JSON malformé, c'est un JSON qui n'est pas un dossier. Deux causes
	// distinctes, deux messages distincts.
	if (!estObjet(parsed)) return { statut: 'file-error', code: 'racine-non-objet' }

	const validation = validateDossier(parsed)
	if (!validation.ok || validation.dossier === null) {
		return { statut: 'invalid', errors: validation.errors, warnings: validation.warnings }
	}
	return { statut: 'valid', dossier: validation.dossier, warnings: validation.warnings }
}
