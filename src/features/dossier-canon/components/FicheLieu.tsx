import type { ChangeEvent, CSSProperties, FocusEvent, Ref } from 'react'
import { Card, Field, IconButton, IssueList, HIT_TARGET_MIN, type Lieu, type DossierIssue } from '../../../brain'

/**
 * Le brouillon local des QUATRE champs de prose d'un lieu — le type vit ici
 * (composant qui le rend) et `PanneauLieux.tsx` (composant qui le possède et
 * le committe) l'importe, plutôt que l'inverse : une fiche n'a pas besoin de
 * connaître `dossierId` ni `DossierService` pour être testée isolément.
 */
export interface BrouillonLieu {
	nom: string
	description: string
	ambiance: string
	dangers: string
}

/**
 * Le refus en cours — SIMPLE, à la différence de `Refus.champs` dans
 * `PanneauCanon.tsx`/`PanneauDepart.tsx` : cette fiche n'a qu'UNE seule
 * écriture refusable (le retrait du lieu de `charpente.depart.lieu_id`), les
 * quatre champs de prose ne pouvant structurellement jamais l'être (aucune
 * entrée de `BUDGETS_DE_MOTS` ni de famille de conditions ne porte sur
 * `monde.lieux[]`).
 */
export interface RefusLieu {
	issues: DossierIssue[]
}

export interface FicheLieuProps {
	lieu: Lieu
	/** Rang dans `monde.lieux` — pour le repli du libellé « Retirer le lieu n°… ». */
	index: number
	brouillon: BrouillonLieu
	refus: RefusLieu | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onRetirer: () => void
}

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"

const PLACEHOLDER_NOM = "La Caverne d'Aldûr"
const PLACEHOLDER_DESCRIPTION =
	"Une grotte basse aux parois calcaires, à une heure de marche au nord de Val-Cendre ; l'entrée est dissimulée par un rideau de lierre."
const PLACEHOLDER_AMBIANCE = 'Air humide, écho des gouttes, une odeur de cendre froide qui ne devrait pas être là.'
const PLACEHOLDER_DANGERS = "Un piège à lanière tendu près de l'autel ; les échos attirent parfois un loup des cendres."

/** Le libellé du bouton retirer — le titre entre guillemets, ou le repli numéroté. */
function libelleRetirer(lieu: Lieu, index: number): string {
	const nom = lieu.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Retirer le lieu « ${nom.trim()} »`
	return `Retirer le lieu n°${index + 1}`
}

/**
 * La fiche du lieu sélectionné — extraite de `PanneauLieux.tsx` (§5 du plan
 * d'itération 4, KR-112 : le panneau dépassait ~350 lignes). Composant
 * PUREMENT DE RENDU : aucun état, aucun appel à `DossierService` — tout brouillon,
 * commit et retrait restent la responsabilité du parent, seul propriétaire de
 * `dossierId`.
 */
export function FicheLieu({
	lieu,
	index,
	brouillon,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
	onRetirer,
}: FicheLieuProps): JSX.Element {
	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU LIEU"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				<Field
					label="DESCRIPTION"
					hint="interne — jamais lu par le joueur"
					multiline
					rows={3}
					placeholder={PLACEHOLDER_DESCRIPTION}
					value={brouillon.description}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('description', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('description', e.target.value)}
				/>

				<Field
					label="AMBIANCE"
					hint="interne — jamais lu par le joueur"
					multiline
					rows={2}
					placeholder={PLACEHOLDER_AMBIANCE}
					value={brouillon.ambiance}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('ambiance', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('ambiance', e.target.value)}
				/>

				<Field
					label="DANGERS"
					hint="interne — jamais lu par le joueur"
					multiline
					rows={2}
					placeholder={PLACEHOLDER_DANGERS}
					value={brouillon.dangers}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('dangers', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('dangers', e.target.value)}
				/>

				<div style={piedFicheStyle}>
					<IconButton label={libelleRetirer(lieu, index)} tone="danger" size={HIT_TARGET_MIN} onClick={onRetirer}>
						✕
					</IconButton>
				</div>

				{refus !== null && (
					<div role="status" style={bandeauRefusStyle}>
						<p style={eyebrowRefusStyle}>{EYEBROW_REFUS}</p>
						<IssueList issues={refus.issues} />
					</div>
				)}
			</div>
		</Card>
	)
}

const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const piedFicheStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'flex-end',
}

const bandeauRefusStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const eyebrowRefusStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--bad)',
	letterSpacing: 'var(--track-eyebrow)',
}
