import type { ChangeEvent, FocusEvent, KeyboardEvent, Ref } from 'react'
import {
	Card,
	Field,
	Select,
	IconButton,
	IssueList,
	HIT_TARGET_MIN,
	avecOrpheline,
	localiserEntite,
	type Indice,
	type DossierIssue,
	type SelectOption,
} from '../../../brain'
import {
	champsStyle,
	bandeauRefusStyle,
	eyebrowRefusStyle,
	texteAbsentStyle,
	eyebrowStyle,
	legendeStyle,
	listeLignesStyle,
	enTeteLigneStyle,
} from './styles'

/**
 * Le brouillon local des TROIS champs de prose d'un indice — même partage que
 * `BrouillonObjet`/`FicheObjet.tsx` : le type vit ici (composant qui le rend),
 * `PanneauIndices.tsx` (composant qui le possède et le committe) l'importe.
 */
export interface BrouillonIndice {
	nom: string
	verite: string
	formulation_joueur: string
}

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."

const PLACEHOLDER_NOM = 'Le sceau brisé'
const PLACEHOLDER_VERITE = 'Le sceau a été brisé par le gardien lui-même, vingt ans plus tôt.'
const PLACEHOLDER_FORMULATION_JOUEUR = 'Une odeur de cendre froide, là où elle ne devrait pas être.'

const LEGENDE_MENE_A = 'Les indices que celui-ci débloque une fois obtenu — le moteur les lira dans cet ordre.'
const TEXTE_AJOUTER_LIEN = '+ Ajouter un indice vers lequel celui-ci mène…'
const TEXTE_AUCUN_AUTRE_INDICE = 'Aucun autre indice à relier — créez-en un second dans ce registre.'

export interface FicheIndiceProps {
	indice: Indice
	/**
	 * TOUS les indices du registre, dans l'ordre du document — SELF COMPRIS
	 * (auto-référence légale, KR-213). Les options des lignes DÉJÀ ÉCRITES se
	 * calculent sur cette liste COMPLÈTE ; seule la ligne D'AJOUT exclut
	 * `indice.id` (self-exclusion, précédent `BlocSavoirs.tsx:435-450`).
	 */
	indices: Indice[]
	brouillon: BrouillonIndice
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit
	 *  jamais l'identifiant de l'indice en cause, seulement ce qu'il reste à
	 *  afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonIndice, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonIndice, valeur: string) => void
	/** Ajoute un lien `mene_a` vers `cibleId` — la ligne d'ajout retombe
	 *  toujours à `''`, jamais sélectionnée (précédent `BlocSavoirs`). */
	onAjouterLien: (cibleId: string) => void
	/** Change la cible d'un lien déjà écrit, au rang `rang` de `mene_a`. */
	onChangerLien: (rang: number, cibleId: string) => void
	onRetirerLien: (rang: number) => void
}

/**
 * La fiche de l'indice sélectionné — précédent direct `FicheObjet.tsx`
 * (dossier-objets) pour l'anatomie (champs + bandeau de refus) et
 * `BlocSavoirs.tsx`/`BlocRelations.tsx` (dossier-fiches) pour la section
 * « MÈNE À » (Select + `avecOrpheline` + `IconButton` de retrait, ligne
 * d'ajout par `Select` dédié). Composant PUREMENT DE RENDU : aucun état de
 * document, aucun appel à `DossierService` — brouillon et commit restent la
 * responsabilité du parent, seul propriétaire de `dossierId`.
 *
 * AUCUN BOUTON DE RETRAIT DE FICHE cette itération (retrait hors périmètre,
 * précédent `dossier-objets` it1 qui n'en avait pas non plus).
 *
 * CLAVIER — Tab suit l'ordre visuel des champs ; `Entrée` dans le champ
 * mono-ligne (« NOM DE L'INDICE ») blur-committe, sans effet sur les deux
 * champs multiligne (`VÉRITÉ`, `FORMULATION JOUEUR`), où elle insère un saut
 * de ligne comme n'importe quel `<textarea>`.
 */
export function FicheIndice({
	indice,
	indices,
	brouillon,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
	onAjouterLien,
	onChangerLien,
	onRetirerLien,
}: FicheIndiceProps): JSX.Element {
	// Libellés calculés sur la liste COMPLÈTE (self compris) — le repli
	// « Indice n°N (sans nom) » doit désigner le même indice, self ou non.
	const optionsTousIndices: SelectOption<string>[] = indices.map((i, i2) => ({
		value: i.id,
		label: localiserEntite('indice', i, i2),
	}))
	const meneA = indice.mene_a ?? []

	function handleKeyDownNom(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		// Entrée dans le champ MONO-LIGNE blur-committe (§3 du plan d'itération 1) —
		// aucun effet sur les Field multiline, qui ne passent pas par ce gestionnaire.
		if (e.key === 'Enter') e.currentTarget.blur()
	}

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DE L'INDICE"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onKeyDown={handleKeyDownNom}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				<Field
					label="VÉRITÉ"
					hint="MJ — jamais vue du joueur"
					multiline
					rows={3}
					placeholder={PLACEHOLDER_VERITE}
					value={brouillon.verite}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('verite', e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('verite', e.target.value)}
				/>

				<Field
					label="FORMULATION JOUEUR"
					hint="lue par le joueur"
					multiline
					rows={3}
					placeholder={PLACEHOLDER_FORMULATION_JOUEUR}
					value={brouillon.formulation_joueur}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('formulation_joueur', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onBlurChamp('formulation_joueur', e.target.value)
					}
				/>

				<div>
					<span style={eyebrowStyle}>MÈNE À</span>
					<p style={legendeStyle}>{LEGENDE_MENE_A}</p>

					{indices.length < 2 && meneA.length === 0 ? (
						<p style={legendeStyle}>{TEXTE_AUCUN_AUTRE_INDICE}</p>
					) : (
						<>
							<div style={listeLignesStyle}>
								{meneA.map((cibleId, rang) => {
									// Liste COMPLÈTE (self comprise) : une auto-référence déjà
									// persistée résout, elle n'est jamais marquée orpheline
									// (KR-213) — c'est `avecOrpheline` seule qui décide.
									const options = avecOrpheline(optionsTousIndices, cibleId, 'indice')
									const designation = options.find((o) => o.value === cibleId)?.label ?? cibleId
									return (
										<div key={rang} style={enTeteLigneStyle}>
											<Select
												label="INDICE CIBLE"
												options={options}
												value={cibleId}
												onChange={(valeur) => onChangerLien(rang, valeur)}
											/>
											<IconButton
												label={`Retirer le lien vers ${designation}`}
												tone="danger"
												size={HIT_TARGET_MIN}
												onClick={() => onRetirerLien(rang)}
											>
												✕
											</IconButton>
										</div>
									)
								})}
							</div>
							<Select
								ariaLabel="Ajouter un lien vers un autre indice"
								options={[
									{ value: '', label: TEXTE_AJOUTER_LIEN },
									// SELF-EXCLUSION (KR-213) : seule la ligne D'AJOUT retire
									// l'indice édité de ses propres options — les lignes déjà
									// écrites, elles, gardent la liste complète ci-dessus.
									...optionsTousIndices.filter((o) => o.value !== indice.id),
								]}
								value=""
								onChange={onAjouterLien}
							/>
						</>
					)}
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
}
