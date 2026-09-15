import type { ChangeEvent, FocusEvent, KeyboardEvent, Ref } from 'react'
import { Card, Field, Stepper, IssueList, DUREE_MIN, type Climat, type DossierIssue } from '../../../brain'
import {
	champsStyle,
	bandeauRefusStyle,
	eyebrowRefusStyle,
	texteAbsentStyle,
	bandeauAvertissementStyle,
	eyebrowAvertissementStyle,
	legendeStyle,
	boutonAjouterStyle,
} from './styles'

/** Le brouillon local des DEUX champs de prose à plat du climat — même partage
 *  que `BrouillonQuete`/`FicheQuete.tsx` : le type vit ici (composant qui le
 *  rend), `PanneauConditions.tsx` (composant qui le possède et le committe)
 *  l'importe. `DURÉE` n'entre pas dans ce brouillon : c'est un `Stepper`
 *  MOTEUR qui committe immédiatement, jamais un champ de texte différé. */
export interface BrouillonClimat {
	nom: string
	manifestation: string
}

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

const PLACEHOLDER_NOM = 'Tempête de cendres'
const TEXTE_POSER_DUREE = '+ Poser une durée…'
const LEGENDE_DUREE =
	"interne — nombre de pas d'horloge avant l'extinction du climat ; consommé par la feature n° 14 (moteur-horloge)"
const HINT_MANIFESTATION = 'IA — injecté au modèle tant que ce climat est actif'
const PLACEHOLDER_MANIFESTATION =
	"Des cendres tièdes tombent sans relâche, recouvrant toits et pavés d'un gris mat et silencieux."

export interface FicheClimatProps {
	climat: Climat
	brouillon: BrouillonClimat
	/** La garde de budget de `manifestation` (§4 lot 1, `BUDGETS_DE_MOTS`),
	 *  DÉJÀ filtrée par le parent au préfixe de ce climat — cette fiche ne
	 *  reçoit jamais l'index du climat, seulement ce qu'il reste à afficher.
	 *  Toujours vide sous le budget : la région ci-dessous existe et se
	 *  rendrait si `avertissements` cessait un jour d'être vide (précédent
	 *  `FicheJalon.tsx`). */
	avertissements: DossierIssue[]
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit
	 *  jamais l'identifiant du climat en cause, seulement ce qu'il reste à
	 *  afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonClimat, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonClimat, valeur: string) => void
	/** DURÉE (moteur) — committe IMMÉDIATEMENT, à la fois depuis l'affordance
	 *  « + Poser une durée… » (`DUREE_MIN`) et depuis le `Stepper` une fois
	 *  posée. Jamais un brouillon différé (précédent `plan_actions[].duree`,
	 *  `useEcriturePlan.ts`). */
	onChangeDuree: (valeur: number) => void
}

/**
 * La fiche du climat sélectionné — précédent direct `FicheQuete.tsx` pour
 * l'anatomie (champs + bandeau de refus) et `FicheJalon.tsx` pour la région
 * D1/budget (`avertissements`, `role="status"` distincte du bandeau de
 * refus). Composant PUREMENT DE RENDU : aucun état de document, aucun appel à
 * `DossierService` — brouillon, commit et refus restent la responsabilité du
 * parent, seul propriétaire de `dossierId`.
 *
 * DURÉE — bloc à deux états, motif de `BlocPlanActions.tsx:240-256`
 * RÉIMPLÉMENTÉ (jamais importé, `dossier-fiches` → `dossier-registres` serait
 * un import inter-features) : `climat.duree === undefined` rend l'affordance
 * pointillée qui committe `DUREE_MIN` au clic ; sinon un `Stepper` `min`
 * SEUL (`DUREE_MIN`), jamais de `max` (le défaut du composant, 99, est une
 * borne d'interface, jamais du SSOT). AUCUN REPLI DE LECTURE `?? DUREE_MIN` :
 * `climat.duree` est lu tel quel, `undefined` ne fabrique jamais de nombre
 * (KR-013).
 *
 * AUCUNE SECTION EFFETS DE RÈGLE — absence totale du DOM (§8-1/§8-1 bis du
 * plan d'itération 5) : ni `EditeurEffets`, ni carte vide, ni texte. Un vide
 * sans geste derrière lui est une promesse affichée sans bouton, pire qu'une
 * absence — `effets_regles` traverse intact, jamais lu ni écrit ici.
 *
 * AUCUN BOUTON DE RETRAIT DE FICHE cette itération (retrait d'un climat hors
 * périmètre, même statut qu'it1-it4).
 *
 * CLAVIER — `Entrée` dans le champ mono-ligne (« NOM DU CLIMAT ») blur-committe ;
 * `MANIFESTATION` est multiligne, `Entrée` y insère un saut de ligne.
 */
export function FicheClimat({
	climat,
	brouillon,
	avertissements,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
	onChangeDuree,
}: FicheClimatProps): JSX.Element {
	function handleKeyDownNom(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		// Entrée dans le champ MONO-LIGNE blur-committe (précédent FicheQuete.tsx) —
		// aucun effet sur les Field multiline, qui ne passent pas par ce gestionnaire.
		if (e.key === 'Enter') e.currentTarget.blur()
	}

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU CLIMAT"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onKeyDown={handleKeyDownNom}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				<div>
					{climat.duree === undefined ? (
						<button type="button" onClick={() => onChangeDuree(DUREE_MIN)} style={boutonAjouterStyle}>
							{TEXTE_POSER_DUREE}
						</button>
					) : (
						<Stepper label="DURÉE" value={climat.duree} min={DUREE_MIN} onChange={onChangeDuree} />
					)}
					<p style={legendeStyle}>{LEGENDE_DUREE}</p>
				</div>

				<Field
					label="MANIFESTATION"
					hint={HINT_MANIFESTATION}
					multiline
					rows={2}
					placeholder={PLACEHOLDER_MANIFESTATION}
					value={brouillon.manifestation}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('manifestation', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onBlurChamp('manifestation', e.target.value)
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
