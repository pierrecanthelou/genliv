import type { ChangeEvent, CSSProperties, FocusEvent, Ref } from 'react'
import { Card, Field } from '../../../brain'

/**
 * Le brouillon local des DEUX champs de prose d'un objet — le type vit ici
 * (composant qui le rend) et `PanneauObjets.tsx` (composant qui le possède et
 * le committe) l'importe, plutôt que l'inverse : une fiche n'a pas besoin de
 * connaître `dossierId` ni `DossierService` pour être testée isolément — même
 * patron que `FicheLieu.tsx`/`BrouillonLieu` (dossier-canon).
 */
export interface BrouillonObjet {
	nom: string
	description_joueur: string
}

export interface FicheObjetProps {
	brouillon: BrouillonObjet
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonObjet, valeur: string) => void
}

const PLACEHOLDER_NOM = "Le grimoire scellé d'Aldûr"
const PLACEHOLDER_DESCRIPTION =
	'Une couverture de cuir craquelé, fermée par une lanière de plomb ; les pages, entrevues sous la reliure, semblent respirer.'

/**
 * La fiche de l'objet sélectionné — précédent direct `FicheLieu.tsx`
 * (dossier-canon it4). Composant PUREMENT DE RENDU : aucun état, aucun appel à
 * `DossierService` — tout brouillon et commit restent la responsabilité du
 * parent, seul propriétaire de `dossierId`. Pas de bouton retirer en it1
 * (§3 du plan d'itération 1) : le retrait arrive à it2, avec son propre
 * bandeau de refus indexé par objet (KR-197/KR-202).
 */
export function FicheObjet({ brouillon, nomInputRef, onChangeChamp, onBlurChamp }: FicheObjetProps): JSX.Element {
	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DE L'OBJET"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				<Field
					label="DESCRIPTION"
					hint="lue par le joueur"
					multiline
					rows={3}
					placeholder={PLACEHOLDER_DESCRIPTION}
					value={brouillon.description_joueur}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('description_joueur', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onBlurChamp('description_joueur', e.target.value)
					}
				/>
			</div>
		</Card>
	)
}

const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}
