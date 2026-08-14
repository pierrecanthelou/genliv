import { type ChangeEvent, type FocusEvent } from 'react'
import { Field } from '../../../brain'
import type { BrouillonPersonnage, ChampTexte } from '../hooks/useEcritureIdentite'

const HINT_FONCTION = 'interne — jamais lu par le joueur'
const HINT_APPARENCE =
	'interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques'
const HINT_DESCRIPTION_JOUEUR = 'lue par le joueur'

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
				label="FONCTION"
				hint={HINT_FONCTION}
				multiline
				rows={2}
				placeholder={PLACEHOLDER_FONCTION}
				value={brouillon.fonction}
				{...champHandlers('fonction')}
			/>
			<Field
				label="APPARENCE"
				hint={HINT_APPARENCE}
				multiline
				rows={3}
				placeholder={PLACEHOLDER_APPARENCE}
				value={brouillon.apparence}
				{...champHandlers('apparence')}
			/>
			<Field
				label="DESCRIPTION JOUEUR"
				hint={HINT_DESCRIPTION_JOUEUR}
				multiline
				rows={3}
				placeholder={PLACEHOLDER_DESCRIPTION_JOUEUR}
				value={brouillon.description_joueur}
				{...champHandlers('description_joueur')}
			/>
		</>
	)
}
