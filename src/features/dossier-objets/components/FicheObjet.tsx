import {
	forwardRef,
	useImperativeHandle,
	useRef,
	type ChangeEvent,
	type CSSProperties,
	type FocusEvent,
	type Ref,
} from 'react'
import { Card, Field, IconButton, IssueList, HIT_TARGET_MIN, type Objet, type DossierIssue } from '../../../brain'

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

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."

/**
 * La DÉSIGNATION d'un objet — la seule partie variable des DEUX textes d'it2
 * (le libellé du bouton de retrait et le corps de la modale). MÊMES DEUX
 * BRANCHES que `localiserEntite('objet', objet, index)`, dont elle est la
 * moitié droite : le nom entre guillemets, ou le repli numéroté « n°3 (sans
 * nom) ». Exportée pour `PanneauObjets.tsx`, qui possède l'état de la modale
 * et doit lui passer la même désignation (précédent `designationDe`,
 * `FichePersonnage.tsx`, dossier-fiches).
 */
export function designationDe(objet: Objet, index: number): string {
	const nom = objet.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `« ${nom.trim()} »`
	return `n°${index + 1} (sans nom)`
}

/** Le libellé du bouton de retrait — TOUJOURS actif, jamais conditionné à ce
 *  qui référence cet objet ailleurs dans le dossier (même règle que
 *  dossier-fiches it7) : le SSOT décide après coup. */
function libelleRetirer(objet: Objet, index: number): string {
	return `Retirer l'objet ${designationDe(objet, index)}`
}

export interface FicheObjetProps {
	objet: Objet
	/** Rang dans `monde.objets` — pour le repli du libellé de retrait
	 *  « Retirer l'objet n°3 (sans nom) ». */
	index: number
	brouillon: BrouillonObjet
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit jamais
	 *  l'identifiant de l'objet en cause, seulement ce qu'il reste à afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	/** N'ÉCRIT RIEN : DEMANDE le retrait, ouvre la modale possédée par le parent.
	 *  Cette fiche n'appelle jamais un retrait direct. */
	onDemanderRetrait: () => void
}

/**
 * Ce que `PanneauObjets.tsx` peut DEMANDER à une fiche, jamais ce qu'il peut
 * aller CHERCHER lui-même dans son DOM (§ Encapsulation — anti-BUG-078, dette
 * non corrigée dans `PanneauLieux.tsx`, à ne pas reproduire une 3ᵉ fois). Même
 * motif que `designationDe` : la fiche EXPOSE la capacité, le parent l'APPELLE.
 */
export interface FicheObjetHandle {
	/** Focalise le bouton de retrait de LA FICHE ACTUELLEMENT RENDUE. */
	focusRetirer: () => void
}

const PLACEHOLDER_NOM = "Le grimoire scellé d'Aldûr"
const PLACEHOLDER_DESCRIPTION =
	'Une couverture de cuir craquelé, fermée par une lanière de plomb ; les pages, entrevues sous la reliure, semblent respirer.'

/**
 * La fiche de l'objet sélectionné — précédent direct `FicheLieu.tsx`
 * (dossier-canon) / `FichePersonnage.tsx` (dossier-fiches) pour le geste de
 * retrait. Composant PUREMENT DE RENDU : aucun état de document, aucun appel à
 * `DossierService` — brouillon, commit et retrait restent la responsabilité du
 * parent, seul propriétaire de `dossierId`.
 *
 * Bouton de retrait TOUJOURS actif (jamais `disabled`) : le SSOT décide après
 * la tentative, jamais un pré-vol côté feature. Bandeau de refus sous le pied
 * de fiche, précédent exact `FicheLieu.tsx`/`FichePersonnage.tsx` — `role`
 * `"status"`, branché sur `refus.statut`, jamais sur `refus.issues`.
 *
 * `forwardRef<FicheObjetHandle>` : remplace toute recherche DOM que le parent
 * aurait pu faire depuis l'extérieur pour retrouver le bouton de retrait après
 * un retrait réussi.
 */
export const FicheObjet = forwardRef<FicheObjetHandle, FicheObjetProps>(function FicheObjet(
	{ objet, index, brouillon, refus, nomInputRef, onChangeChamp, onBlurChamp, onDemanderRetrait }: FicheObjetProps,
	ref,
) {
	const retirerRef = useRef<HTMLButtonElement>(null)
	useImperativeHandle(ref, () => ({ focusRetirer: () => retirerRef.current?.focus() }), [])

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

				<div style={piedFicheStyle}>
					<IconButton
						ref={retirerRef}
						label={libelleRetirer(objet, index)}
						tone="danger"
						size={HIT_TARGET_MIN}
						onClick={onDemanderRetrait}
					>
						✕
					</IconButton>
				</div>

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
})

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

const texteAbsentStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}
