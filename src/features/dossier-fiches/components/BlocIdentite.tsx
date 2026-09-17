import { type ChangeEvent, type FocusEvent } from 'react'
import { Field, LIBELLE_DES_CHAMPS } from '../../../brain'
import type { BrouillonPersonnage, ChampTexte } from '../hooks/useEcritureIdentite'

/**
 * Les trois libellés viennent du REGISTRE `brain/dossier/libelles.ts` depuis
 * l'itération 1 de la n° 8 : le panneau Copilote NOMME ces trois champs sans être
 * leur fiche d'origine, donc deux features les lisent (KR-109). L'extraction est
 * PURE — aucune chaîne n'a bougé, et la preuve en est que la suite de
 * `dossier-fiches` est restée verte sans une seule retouche.
 *
 * TROIS ACCÈS EXPLICITES, jamais un indexage par `ChampTexte` : celui-ci vaut
 * `keyof BrouillonPersonnage` et inclut `'nom'`, qui n'a pas d'entrée au registre
 * — ça ne compilerait pas, et ce serait la bonne erreur pour une mauvaise raison.
 *
 * Les `PLACEHOLDER_*` ci-dessous NE MIGRENT PAS : ils n'ont qu'un lecteur, cette
 * fiche. Une promotion spéculative est une dette (KR-235).
 */
const FONCTION = LIBELLE_DES_CHAMPS['monde.personnages[].fonction']
const APPARENCE = LIBELLE_DES_CHAMPS['monde.personnages[].apparence']
const DESCRIPTION_JOUEUR = LIBELLE_DES_CHAMPS['monde.personnages[].description_joueur']

const PLACEHOLDER_FONCTION = 'Ermite retiré du monde, gardien de la mémoire de Val-Cendre.'
const PLACEHOLDER_APPARENCE =
	"Un vieil homme voûté à la barbe blanche tressée de perles d'os, les mains tachées d'encre et de cendre."
const PLACEHOLDER_DESCRIPTION_JOUEUR =
	"Une silhouette voûtée émerge de la pénombre du sanctuaire, capuche rabattue sur un visage qu'on devine plus vieux que la voix ne le laisse entendre."

export interface BlocIdentiteProps {
	brouillon: BrouillonPersonnage
	onChangeChamp: (champ: ChampTexte, valeur: string) => void
	onBlurChamp: (champ: ChampTexte, valeur: string) => void
}

/**
 * Le bloc 2 de l'accordéon (« Identité »), it2 — EXTRAIT de
 * `FichePersonnage.tsx` à l'itération 6, même motif que `BlocSituation` (KR-112,
 * décharge AVANT le câblage du bloc Savoirs). Comportement inchangé : trois
 * `Field` en brouillon-par-champ, commit au blur par le parent ; un champ vidé
 * retire sa clé plutôt que d'y écrire `''`.
 *
 * Le champ NOM reste en EN-TÊTE de fiche, HORS accordéon (précédent
 * `FicheLieu`) : il n'entre donc pas dans ce bloc, bien qu'il partage le même
 * couple de gestionnaires.
 */
export function BlocIdentite({ brouillon, onChangeChamp, onBlurChamp }: BlocIdentiteProps): JSX.Element {
	const champHandlers = (champ: ChampTexte) => ({
		onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp(champ, e.target.value),
		onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp(champ, e.target.value),
	})

	return (
		<>
			<Field
				label={FONCTION.libelle}
				hint={FONCTION.hint}
				multiline
				rows={2}
				placeholder={PLACEHOLDER_FONCTION}
				value={brouillon.fonction}
				{...champHandlers('fonction')}
			/>
			<Field
				label={APPARENCE.libelle}
				hint={APPARENCE.hint}
				multiline
				rows={3}
				placeholder={PLACEHOLDER_APPARENCE}
				value={brouillon.apparence}
				{...champHandlers('apparence')}
			/>
			<Field
				label={DESCRIPTION_JOUEUR.libelle}
				hint={DESCRIPTION_JOUEUR.hint}
				multiline
				rows={3}
				placeholder={PLACEHOLDER_DESCRIPTION_JOUEUR}
				value={brouillon.description_joueur}
				{...champHandlers('description_joueur')}
			/>
		</>
	)
}
