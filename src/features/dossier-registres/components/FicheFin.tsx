import type { ChangeEvent, FocusEvent, KeyboardEvent, Ref } from 'react'
import { Card, Field, IssueList, type DossierIssue } from '../../../brain'
import {
	champsStyle,
	bandeauRefusStyle,
	eyebrowRefusStyle,
	texteAbsentStyle,
	bandeauAvertissementStyle,
	eyebrowAvertissementStyle,
} from './styles'

/**
 * Le brouillon local des TROIS champs d'une fin — même partage que
 * `BrouillonJalon`/`FicheJalon.tsx` : le type vit ici, `PanneauJalonsFins.tsx`
 * l'importe. `condition_texte` est le SEUL champ `CHAMPS_REQUIS` (KR-214) ;
 * `texte` (la prose émise au joueur, `moteur`) n'est JAMAIS gatant — cette
 * fiche l'expose comme un `Field` optionnel classique.
 */
export interface BrouillonFin {
	nom: string
	condition_texte: string
	texte: string
}
export type ChampFinTexte = keyof BrouillonFin

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

const PLACEHOLDER_NOM = 'Le Gouffre refermé'
const PLACEHOLDER_CONDITION = "Le héros porte la Clé d'Aldûr et a vaincu le Gardien."
const PLACEHOLDER_TEXTE = "Le sceau se referme derrière toi ; Val-Cendre s'efface dans la brume, pour toujours."

export interface FicheFinProps {
	brouillon: BrouillonFin
	/**
	 * La région D1 (§3/§5 lot 2 du plan d'itération 2) : les anomalies
	 * `condition-sans-expr` de CETTE fin, DÉJÀ filtrées par le parent (l'index
	 * se dérive de l'id au rendu, jamais stocké — piège 2). Visible dès que
	 * `condition_texte` est renseigné sans `condition_expr`, donc jamais avant
	 * le premier commit, et quasi systématique tant qu'aucun éditeur
	 * d'expression n'existe (§2 du plan — comportement voulu, pas une
	 * régression).
	 */
	avertissements: DossierIssue[]
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit
	 *  jamais l'identifiant de la fin en cause, seulement ce qu'il reste à
	 *  afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: ChampFinTexte, valeur: string) => void
	onBlurChamp: (champ: ChampFinTexte, valeur: string) => void
}

/**
 * La fiche de la fin sélectionnée — précédent direct `FicheIndice.tsx` (it1)
 * pour l'anatomie, et `ObjectifsCanon.tsx` (dossier-canon it3) pour la
 * région D1 (`role="status"`, DISTINCTE du bandeau de refus, les deux
 * peuvent coexister à l'écran). Composant PUREMENT DE RENDU : aucun état de
 * document, aucun appel à `DossierService`.
 *
 * CLAVIER — `Entrée` dans le champ mono-ligne (« NOM DE LA FIN ») blur-committe ;
 * `CONDITION`/`TEXTE DE FIN` sont multiligne, `Entrée` y insère un saut de ligne.
 */
export function FicheFin({
	brouillon,
	avertissements,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
}: FicheFinProps): JSX.Element {
	function handleKeyDownNom(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		if (e.key === 'Enter') e.currentTarget.blur()
	}

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DE LA FIN"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onKeyDown={handleKeyDownNom}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				<Field
					label="CONDITION"
					hint="phrase factuelle pour le moteur, jamais de fiction"
					multiline
					rows={2}
					placeholder={PLACEHOLDER_CONDITION}
					value={brouillon.condition_texte}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('condition_texte', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onBlurChamp('condition_texte', e.target.value)
					}
				/>

				<Field
					label="TEXTE DE FIN"
					hint="lu par le joueur, à l'arrivée sur cette fin"
					multiline
					rows={3}
					placeholder={PLACEHOLDER_TEXTE}
					value={brouillon.texte}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('texte', e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('texte', e.target.value)}
				/>

				{avertissements.length > 0 && (
					<div role="status" style={bandeauAvertissementStyle}>
						<p style={eyebrowAvertissementStyle}>{EYEBROW_AVERTISSEMENT}</p>
						<IssueList issues={avertissements} />
					</div>
				)}

				{refus !== null && (
					<div role="status" style={bandeauRefusStyle}>
						<p style={eyebrowRefusStyle}>{EYEBROW_REFUS}</p>
						{refus.statut === 'absent' ? (
							<p style={texteAbsentStyle}>{TEXTE_ABSENT}</p>
						) : (
							<IssueList issues={refus.issues} />
						)}
					</div>
				)}
			</div>
		</Card>
	)
}
