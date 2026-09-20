import {
	forwardRef,
	useImperativeHandle,
	useRef,
	type ChangeEvent,
	type CSSProperties,
	type FocusEvent,
	type Ref,
} from 'react'
import {
	Card,
	Field,
	Select,
	IconButton,
	IssueList,
	HIT_TARGET_MIN,
	avecOrpheline,
	localiserEntite,
	type Lieu,
	type DossierIssue,
	type SelectOption,
} from '../../../brain'
import { EYEBROW_REFUS, TEXTE_ABSENT } from '../utils/refusMessages'

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
 * Le refus en cours. Deux écritures peuvent désormais le produire : le
 * retrait du lieu de `charpente.depart.lieu_id` (`'refuse'`, les quatre
 * champs de prose ne pouvant structurellement jamais l'être — aucune entrée
 * de `BUDGETS_DE_MOTS` ni de famille de conditions ne porte sur
 * `monde.lieux[]`) et `{statut:'absent'}` (le dossier a disparu ailleurs
 * pendant l'édition, revue de PR dossier-fiches it2, élargissement) —
 * `statut` distingue les deux, même patron que `FichePersonnage.tsx`
 * (dossier-fiches) : `'absent'` ne porte AUCUN `issues` réel
 * (`DossierService.ts`), le rendu branche donc sur `statut`, jamais sur
 * `issues`.
 */
interface RefusLieu {
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

/**
 * Ce que `PanneauLieux.tsx` peut DEMANDER à cette fiche, jamais ce qu'il peut
 * aller CHERCHER lui-même dans son DOM (BUG-078 — la recherche
 * `panneauRef.current?.querySelector('button[aria-label^="Retirer le lieu"]')`
 * était la 3ᵉ occurrence de la classe, non corrigée jusqu'à cette itération ;
 * précédent du correctif : `FicheObjetHandle`, `dossier-objets` it2).
 * Même motif que `designationDe`/`libelleRetirer` : la fiche EXPOSE la
 * capacité, le parent l'APPELLE.
 */
export interface FicheLieuHandle {
	/** Focalise le bouton « Retirer le lieu » de LA FICHE ACTUELLEMENT RENDUE. */
	focusRetirer: () => void
}

export interface FicheLieuProps {
	lieu: Lieu
	/**
	 * TOUS les lieux, ordre du document, SELF COMPRIS — options des lignes déjà
	 * écrites. Seule la ligne D'AJOUT exclut `lieu.id` (précédent
	 * `FicheIndice.tsx:198`, dossier-registres).
	 */
	lieux: Lieu[]
	/** Rang dans `monde.lieux` — pour le repli du libellé « Retirer le lieu n°… ». */
	index: number
	brouillon: BrouillonLieu
	refus: RefusLieu | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	/** Ajoute un accès vers `cibleId` — la ligne d'ajout retombe toujours à
	 *  `''`, jamais sélectionnée (précédent `FicheIndice.tsx`). */
	onAjouterAcces: (cibleId: string) => void
	/** Change la cible d'un accès déjà écrit, au rang `rang` de `lieu.acces`. */
	onChangerAcces: (rang: number, cibleId: string) => void
	onRetirerAcces: (rang: number) => void
	onRetirer: () => void
}

const PLACEHOLDER_NOM = "La Caverne d'Aldûr"
const PLACEHOLDER_DESCRIPTION =
	"Une grotte basse aux parois calcaires, à une heure de marche au nord de Val-Cendre ; l'entrée est dissimulée par un rideau de lierre."
const PLACEHOLDER_AMBIANCE = 'Air humide, écho des gouttes, une odeur de cendre froide qui ne devrait pas être là.'
const PLACEHOLDER_DANGERS = "Un piège à lanière tendu près de l'autel ; les échos attirent parfois un loup des cendres."

const EYEBROW_ACCES = 'ACCÈS DEPUIS CE LIEU'
const LEGENDE_ACCES =
	"Les lieux que l'on peut rejoindre depuis celui-ci — un passage dans l'autre sens ne se déduit pas : ajoutez-le depuis l'autre lieu."
const TEXTE_AUCUN_AUTRE_LIEU = 'Aucun autre lieu à relier — ajoutez-en un second avec « + Ajouter un lieu… ».'
const TEXTE_AJOUTER_ACCES = '+ Ajouter un accès vers un autre lieu…'

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
 *
 * Section « ACCÈS DEPUIS CE LIEU » (itération 5) — précédent direct
 * `FicheIndice.tsx` (dossier-registres) pour son anatomie (légende, lignes
 * `Select` + `IconButton` de retrait, ligne d'ajout dédiée qui retombe
 * toujours à `''`) : `Select` + `avecOrpheline` + `localiserEntite` sur la
 * liste COMPLÈTE des lieux (self compris) pour les lignes déjà écrites,
 * seule la ligne D'AJOUT exclut `lieu.id`. AUCUN inverse stocké ni dérivé
 * (KR-013) — cette fiche ne lit, ni n'écrit, jamais `B.acces` en réponse à un
 * geste sur `A.acces`.
 *
 * `forwardRef<FicheLieuHandle>` (BUG-078) : remplace la recherche DOM
 * distante que `PanneauLieux.tsx` faisait depuis l'extérieur pour retrouver
 * le bouton de retrait après un retrait réussi.
 */
export const FicheLieu = forwardRef<FicheLieuHandle, FicheLieuProps>(function FicheLieu(
	{
		lieu,
		lieux,
		index,
		brouillon,
		refus,
		nomInputRef,
		onChangeChamp,
		onBlurChamp,
		onAjouterAcces,
		onChangerAcces,
		onRetirerAcces,
		onRetirer,
	}: FicheLieuProps,
	ref,
) {
	const retirerRef = useRef<HTMLButtonElement>(null)
	useImperativeHandle(ref, () => ({ focusRetirer: () => retirerRef.current?.focus() }), [])

	// Labels calculés sur la liste COMPLÈTE (self compris) — le repli « Lieu
	// introuvable — … » (`avecOrpheline`) ne s'applique qu'aux cibles absentes
	// de `lieux`, jamais à une auto-référence légale (KR-194).
	const optionsTousLieux: SelectOption<string>[] = lieux.map((l, i) => ({
		value: l.id,
		label: localiserEntite('lieu', l, i),
	}))
	const acces = lieu.acces ?? []

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

				<div>
					<span style={eyebrowAccesStyle}>{EYEBROW_ACCES}</span>
					<p style={legendeAccesStyle}>{LEGENDE_ACCES}</p>

					{lieux.length < 2 && acces.length === 0 ? (
						<p style={legendeAccesStyle}>{TEXTE_AUCUN_AUTRE_LIEU}</p>
					) : (
						<>
							<div style={listeLignesAccesStyle}>
								{acces.map((cibleId, rang) => {
									// Auto-référence déjà persistée : résout, jamais orpheline
									// (KR-194) — c'est `avecOrpheline` seule qui décide, sur la
									// liste COMPLÈTE.
									const options = avecOrpheline(optionsTousLieux, cibleId, 'lieu')
									const designation = options.find((o) => o.value === cibleId)?.label ?? cibleId
									return (
										<div key={rang} style={ligneAccesStyle}>
											<Select
												label="LIEU CIBLE"
												options={options}
												value={cibleId}
												onChange={(valeur) => onChangerAcces(rang, valeur)}
											/>
											<IconButton
												label={`Retirer l'accès vers ${designation}`}
												tone="danger"
												size={HIT_TARGET_MIN}
												onClick={() => onRetirerAcces(rang)}
											>
												✕
											</IconButton>
										</div>
									)
								})}
							</div>
							<Select
								ariaLabel="Ajouter un accès vers un autre lieu"
								options={[
									{ value: '', label: TEXTE_AJOUTER_ACCES },
									// SELF-EXCLUSION (KR-194) : seule la ligne D'AJOUT retire le
									// lieu édité de ses propres options — les lignes déjà écrites,
									// elles, gardent la liste complète ci-dessus.
									...optionsTousLieux.filter((o) => o.value !== lieu.id),
								]}
								value=""
								onChange={onAjouterAcces}
							/>
						</>
					)}
				</div>

				<div style={piedFicheStyle}>
					<IconButton
						ref={retirerRef}
						label={libelleRetirer(lieu, index)}
						tone="danger"
						size={HIT_TARGET_MIN}
						onClick={onRetirer}
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

// ── Section « ACCÈS DEPUIS CE LIEU » — huit tokens, aucun neuf (§3 du plan) ─
const eyebrowAccesStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 'var(--space-2)',
}

const legendeAccesStyle: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const listeLignesAccesStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	marginTop: 'var(--space-3)',
}

const ligneAccesStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
}
