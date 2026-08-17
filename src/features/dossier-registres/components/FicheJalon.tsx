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
 * Le brouillon local des TROIS champs d'un jalon — même partage que
 * `BrouillonIndice`/`FicheIndice.tsx` (it1) : le type vit ici (composant qui
 * le rend), `PanneauJalonsFins.tsx` (composant qui le possède et le committe)
 * l'importe. `nom` reste optionnel au document (omis si vide) ; `declencheur_texte`
 * et `enonce_texte` sont les DEUX champs `CHAMPS_REQUIS` (KR-214) qui arment le
 * brouillon différé du parent — cette fiche ne connaît pas cette règle, elle
 * se contente d'exposer les trois champs et de committer au blur.
 */
export interface BrouillonJalon {
	nom: string
	declencheur_texte: string
	enonce_texte: string
}
export type ChampJalonTexte = keyof BrouillonJalon

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

const PLACEHOLDER_NOM = "Le pacte avec l'Archiviste"
const PLACEHOLDER_DECLENCHEUR = "Le joueur montre le sceau brisé à l'Archiviste."
const PLACEHOLDER_ENONCE = "L'Archiviste sait désormais que le sceau a été brisé."

export interface FicheJalonProps {
	brouillon: BrouillonJalon
	/**
	 * MÊME PROP que `FicheFin` (piège 3, §5 lot 2 du plan d'itération 2) —
	 * TOUJOURS vide côté Jalon : `FAMILLES_DE_CONDITIONS` porte
	 * `alerteSansExpr: false` pour `charpente.jalons[].declencheur_texte`
	 * (`tables.ts:656`), donc `validateDossier` ne produit jamais d'anomalie
	 * `condition-sans-expr` sur un jalon. Le silence est celui du VALIDATEUR,
	 * jamais une omission de ce composant — la région ci-dessous existe et se
	 * rendrait si `avertissements` cessait un jour d'être vide.
	 */
	avertissements: DossierIssue[]
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit
	 *  jamais l'identifiant du jalon en cause, seulement ce qu'il reste à
	 *  afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: ChampJalonTexte, valeur: string) => void
	onBlurChamp: (champ: ChampJalonTexte, valeur: string) => void
}

/**
 * La fiche du jalon sélectionné — précédent direct `FicheIndice.tsx` (it1)
 * pour l'anatomie (champs + bandeau de refus). Composant PUREMENT DE RENDU :
 * aucun état de document, aucun appel à `DossierService` — brouillon
 * différé, commit et refus restent la responsabilité du parent, seul
 * propriétaire de `dossierId`.
 *
 * CLAVIER — `Entrée` dans le champ mono-ligne (« NOM DU JALON ») blur-committe ;
 * `DÉCLENCHEUR`/`ÉNONCÉ` sont multiligne, `Entrée` y insère un saut de ligne.
 */
export function FicheJalon({
	brouillon,
	avertissements,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
}: FicheJalonProps): JSX.Element {
	function handleKeyDownNom(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		// Entrée dans le champ MONO-LIGNE blur-committe (précédent FicheIndice.tsx) —
		// aucun effet sur les Field multiline, qui ne passent pas par ce gestionnaire.
		if (e.key === 'Enter') e.currentTarget.blur()
	}

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU JALON"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onKeyDown={handleKeyDownNom}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				<Field
					label="DÉCLENCHEUR"
					hint="auteur — jamais injecté au modèle"
					multiline
					rows={2}
					placeholder={PLACEHOLDER_DECLENCHEUR}
					value={brouillon.declencheur_texte}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('declencheur_texte', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onBlurChamp('declencheur_texte', e.target.value)
					}
				/>

				<Field
					label="ÉNONCÉ"
					hint="IA — injecté au modèle une fois ce jalon atteint"
					multiline
					rows={2}
					placeholder={PLACEHOLDER_ENONCE}
					value={brouillon.enonce_texte}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('enonce_texte', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onBlurChamp('enonce_texte', e.target.value)
					}
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
