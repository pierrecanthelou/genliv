import type { ChangeEvent, FocusEvent, KeyboardEvent, Ref } from 'react'
import {
	Card,
	Field,
	Select,
	IconButton,
	IssueList,
	HIT_TARGET_MIN,
	BESTIARY,
	BESTIARY_BY_TEMPLATE,
	PREFIXE_BESTIAIRE,
	type Evenement,
	type Delta,
	type Entite,
	type EspaceDeNoms,
	type DossierIssue,
	type SelectOption,
} from '../../../brain'
import { EditeurEffets } from './EditeurEffets'
import type { ResolutionAffichee } from '../hooks/useEcritureResolutions'
import {
	champsStyle,
	bandeauRefusStyle,
	eyebrowRefusStyle,
	texteAbsentStyle,
	eyebrowStyle,
	legendeStyle,
	listeLignesStyle,
	ligneStyle,
	enTeteLigneStyle,
	ligneListRowStyle,
	boutonAjouterStyle,
} from './styles'

/** Le brouillon local des DEUX champs de prose à plat de l'événement — même
 *  partage que `BrouillonQuete`/`FicheQuete.tsx` : le type vit ici (composant
 *  qui le rend), `PanneauEvenements.tsx` (composant qui le possède et le
 *  committe) l'importe. */
export interface BrouillonEvenement {
	nom: string
	declencheur_texte: string
}

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."

const PLACEHOLDER_NOM = "L'embuscade du pont de pierre"
const TEXTE_ADOSSER_MONSTRE = '+ Adosser un monstre du bestiaire…'
const PLACEHOLDER_DECLENCHEUR = 'Le joueur revient à Val-Cendre après la tempête.'

const LEGENDE_RESOLUTIONS = 'Les issues possibles de cet événement, et ce que chacune change.'
const PLACEHOLDER_RESULTAT = 'Le loup blessé bat en retraite ; le passage reste libre.'
const TEXTE_VIDE_RESOLUTIONS = 'Aucune résolution — cliquez « + Ajouter une résolution… » pour commencer.'

const TITRE_CONSEQUENCES = 'CONSÉQUENCES'
const LEGENDE_CONSEQUENCES = 'Ce que cette résolution change dans le monde.'
const TEXTE_VIDE_CONSEQUENCES = 'Aucune conséquence — cliquez « + Ajouter un effet… » pour commencer.'

/** Les options du `Select` MONSTRE, DANS L'ORDRE DU REGISTRE `BESTIARY` —
 *  valeur = la référence COMPOSÉE (`bestiaire.<templateId>`), le format exact
 *  de `monstre_ref` (lot contrat, `PREFIXE_BESTIAIRE`). SANS `avecOrpheline`
 *  (§8-5 du plan d'itération 4) : `BESTIARY` est un registre constant du code,
 *  aucune de ses entrées ne peut devenir orpheline. */
const OPTIONS_MONSTRES: SelectOption<string>[] = BESTIARY.map((monstre) => ({
	value: `${PREFIXE_BESTIAIRE}${monstre.templateId}`,
	label: monstre.name,
}))

export interface FicheEvenementProps {
	evenement: Evenement
	brouillon: BrouillonEvenement
	/** Les résolutions RENDUES (persistées + brouillon d'ajout en dernière
	 *  position) — déjà résolues par `useEcritureResolutions`, cette fiche ne
	 *  connaît que ce qu'il reste à afficher. */
	resolutions: ResolutionAffichee[]
	/** Force le démontage/remontage des `EditeurEffets` après un retrait de
	 *  résolution — inclus dans la clé React de chaque ligne, jamais lu
	 *  ailleurs (§5 lot 2 du plan d'itération 4). */
	jetonDeRemontage: number
	/** Les entités disponibles comme cible d'un effet de conséquence, par
	 *  espace de noms — voir `EditeurEffets`. */
	entitesParEspace: Partial<Record<EspaceDeNoms, Entite[]>>
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit
	 *  jamais l'identifiant de l'événement en cause, seulement ce qu'il reste à
	 *  afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonEvenement, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonEvenement, valeur: string) => void
	/** `''` = retrait — le parent remet `monstre_ref` à `undefined`, jamais
	 *  `null` (précédent `donneur_id`, `FicheQuete.tsx`). */
	onChangeMonstre: (monstreRef: string) => void
	onChangeResolution: (rang: number, valeur: string) => void
	onBlurResolution: (rang: number, valeur: string) => void
	onAjouterResolution: () => void
	onRetirerResolution: (rang: number) => void
	onAjouterEffetResolution: (rang: number, effet: Delta) => void
	onChangerCibleEffetResolution: (rang: number, index: number, rangCible: number, valeur: string) => void
	onRetirerEffetResolution: (rang: number, index: number) => void
}

/**
 * La fiche de l'événement sélectionné — précédent direct `FicheQuete.tsx` pour
 * l'anatomie générale (champs + bandeau de refus). Composant PUREMENT DE
 * RENDU : aucun état de document, aucun appel à `DossierService` — brouillon
 * et commit restent la responsabilité du parent, seul propriétaire de
 * `dossierId`.
 *
 * MONSTRE — idiome « porte » (précédent DONNEUR, `FicheQuete.tsx`), mais SANS
 * `avecOrpheline` : `BESTIARY` est un registre constant, aucune entrée n'est
 * jamais orpheline (§8-5 du plan). Le libellé dérivé « Monstre : {nom} », à
 * côté du champ NOM (qui tient lieu de titre de fiche), se recalcule à CHAQUE
 * RENDU depuis `monstre_ref` — jamais une clé `nature` persistée (§8-1, REJET
 * unanime du raffinage).
 *
 * DÉCLENCHEUR — aucune région D1 (`role="status"`) sous ce champ :
 * `alerteSansExpr:false` sur `evenements[].declencheur_texte` (`tables.ts`),
 * le silence est la preuve du contrat, jamais une omission de ce composant
 * (§8-4 du plan).
 *
 * RÉSOLUTIONS — brouillon différé porté par `useEcritureResolutions` (parent) :
 * `resolutions` est la liste RENDUE, brouillon d'ajout compris en dernière
 * position. Une résolution encore locale (`consequence === null`) n'affiche
 * PAS d'`EditeurEffets` — on ne peut pas éditer les conséquences d'une entité
 * qui n'existe pas encore dans le document. La clé React de chaque ligne
 * inclut `jetonDeRemontage` (voir sa docstring dans le hook).
 *
 * AUCUN BOUTON DE RETRAIT DE FICHE cette itération (retrait d'un événement hors
 * périmètre, précédent `dossier-objets`/`dossier-registres` it1-3).
 *
 * CLAVIER — Tab suit l'ordre visuel ; `Entrée` dans le champ mono-ligne (NOM)
 * blur-committe, sans effet sur les champs multiligne (DÉCLENCHEUR, RÉSULTAT),
 * où elle insère un saut de ligne.
 */
export function FicheEvenement({
	evenement,
	brouillon,
	resolutions,
	jetonDeRemontage,
	entitesParEspace,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
	onChangeMonstre,
	onChangeResolution,
	onBlurResolution,
	onAjouterResolution,
	onRetirerResolution,
	onAjouterEffetResolution,
	onChangerCibleEffetResolution,
	onRetirerEffetResolution,
}: FicheEvenementProps): JSX.Element {
	const monstreRef = evenement.monstre_ref
	// DÉRIVÉ à chaque rendu depuis `monstre_ref` — jamais une clé `nature`
	// persistée (§8-1 du plan d'itération 4).
	const templateId = monstreRef === undefined ? undefined : monstreRef.slice(PREFIXE_BESTIAIRE.length)
	const nomMonstre = templateId === undefined ? undefined : BESTIARY_BY_TEMPLATE[templateId]?.name

	function handleKeyDownMono(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		// Entrée dans le champ MONO-LIGNE blur-committe — sans effet sur les
		// `Field` multiline, qui ne passent pas par ce gestionnaire.
		if (e.key === 'Enter') e.currentTarget.blur()
	}

	return (
		<Card>
			<div style={champsStyle}>
				<div style={enTeteLigneStyle}>
					<div style={ligneListRowStyle}>
						<Field
							label="NOM DE L'ÉVÉNEMENT"
							hint="interne"
							placeholder={PLACEHOLDER_NOM}
							value={brouillon.nom}
							inputRef={nomInputRef}
							onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
								onChangeChamp('nom', e.target.value)
							}
							onKeyDown={handleKeyDownMono}
							onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
						/>
					</div>
					{nomMonstre !== undefined && <p style={legendeStyle}>{`Monstre : ${nomMonstre}`}</p>}
				</div>

				{monstreRef === undefined ? (
					<Select
						label="MONSTRE"
						options={[{ value: '', label: TEXTE_ADOSSER_MONSTRE }, ...OPTIONS_MONSTRES]}
						value=""
						onChange={onChangeMonstre}
					/>
				) : (
					<div style={enTeteLigneStyle}>
						<Select label="MONSTRE" options={OPTIONS_MONSTRES} value={monstreRef} onChange={onChangeMonstre} />
						<IconButton
							label="Retirer le monstre"
							tone="danger"
							size={HIT_TARGET_MIN}
							onClick={() => onChangeMonstre('')}
						>
							✕
						</IconButton>
					</div>
				)}

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
				{/* Aucune région D1 ici — voir la docstring de ce composant : le
				    silence est celui du contrat (`alerteSansExpr:false`), pas une
				    omission. */}

				<div>
					<span style={eyebrowStyle}>RÉSOLUTIONS</span>
					<p style={legendeStyle}>{LEGENDE_RESOLUTIONS}</p>
					{resolutions.length === 0 ? (
						<p style={legendeStyle}>{TEXTE_VIDE_RESOLUTIONS}</p>
					) : (
						<div style={listeLignesStyle}>
							{resolutions.map((resolution, rang) => (
								<div key={`${evenement.id}:${jetonDeRemontage}:${rang}`} style={ligneStyle}>
									<div style={enTeteLigneStyle}>
										<div style={ligneListRowStyle}>
											<Field
												label="RÉSULTAT"
												hint="IA — ce que le narrateur joue quand cette issue survient"
												multiline
												rows={2}
												placeholder={PLACEHOLDER_RESULTAT}
												value={resolution.resultat}
												onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
													onChangeResolution(rang, e.target.value)
												}
												onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
													onBlurResolution(rang, e.target.value)
												}
											/>
										</div>
										<IconButton
											label="Retirer cette résolution"
											tone="danger"
											size={HIT_TARGET_MIN}
											onClick={() => onRetirerResolution(rang)}
										>
											✕
										</IconButton>
									</div>
									{resolution.consequence !== null && (
										<EditeurEffets
											titre={TITRE_CONSEQUENCES}
											legende={LEGENDE_CONSEQUENCES}
											texteVide={TEXTE_VIDE_CONSEQUENCES}
											effets={resolution.consequence}
											entitesParEspace={entitesParEspace}
											onAjouterEffet={(effet) => onAjouterEffetResolution(rang, effet)}
											onChangerCible={(index, rangCible, valeur) =>
												onChangerCibleEffetResolution(rang, index, rangCible, valeur)
											}
											onRetirerEffet={(index) => onRetirerEffetResolution(rang, index)}
										/>
									)}
								</div>
							))}
						</div>
					)}
					<button type="button" onClick={onAjouterResolution} style={boutonAjouterStyle}>
						+ Ajouter une résolution…
					</button>
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
