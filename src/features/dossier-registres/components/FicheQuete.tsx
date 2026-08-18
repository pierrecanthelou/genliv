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
	type Quete,
	type Delta,
	type Personnage,
	type Entite,
	type EspaceDeNoms,
	type DossierIssue,
	type SelectOption,
} from '../../../brain'
import { EditeurEffets } from './EditeurEffets'
import type { BrouillonEtape } from '../hooks/useEcritureEtapes'
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
	boutonAjouterStyle,
} from './styles'

/** Le brouillon local des TROIS champs de prose à plat de la quête — même
 *  partage que `BrouillonIndice`/`FicheIndice.tsx` : le type vit ici
 *  (composant qui le rend), `PanneauQuetes.tsx` (composant qui le possède et
 *  le committe) l'importe. */
export interface BrouillonQuete {
	nom: string
	consigne: string
	echeance: string
}

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."

const PLACEHOLDER_NOM = 'La dette du forgeron'
const TEXTE_CHOISIR_DONNEUR = '+ Choisir un donneur…'
const PLACEHOLDER_CONSIGNE = "Retrouver l'enclume volée avant la foire de printemps."
const HINT_CONSIGNE = 'IA — ce que le donneur demande, injecté au modèle'
const PLACEHOLDER_ECHEANCE = "Avant que la caravane ne reparte, à l'aube."
const HINT_ECHEANCE = "interne — note d'auteur, jamais lue par le modèle"

const LEGENDE_ETAPES = "Le déroulé de la quête, dans l'ordre où le joueur les franchit."
const PLACEHOLDER_ETAPE = 'Convaincre le passeur de traverser la rivière de nuit.'
const HINT_ETAPE = 'IA — ce que le joueur accomplit à cette étape'

const TITRE_RECOMPENSE = 'RÉCOMPENSE'
const LEGENDE_RECOMPENSE = 'Ce que la quête donne au joueur une fois résolue.'
const TEXTE_VIDE_RECOMPENSE = 'Aucune récompense — cliquez « + Ajouter un effet… » pour commencer.'

export interface FicheQueteProps {
	quete: Quete
	/** TOUS les personnages du dossier — options du DONNEUR (espace `pnj`). */
	personnages: Personnage[]
	brouillon: BrouillonQuete
	/** Les étapes RENDUES (persistées + brouillon d'ajout en dernière
	 *  position) — déjà résolues par `useEcritureEtapes`, cette fiche ne
	 *  connaît que ce qu'il reste à afficher. */
	etapes: BrouillonEtape[]
	/** Les entités disponibles comme cible d'un effet de récompense, par
	 *  espace de noms — voir `EditeurEffets`. */
	entitesParEspace: Partial<Record<EspaceDeNoms, Entite[]>>
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit
	 *  jamais l'identifiant de la quête en cause, seulement ce qu'il reste à
	 *  afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonQuete, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonQuete, valeur: string) => void
	/** `''` = retrait — le parent remet `donneur_id` à `undefined`, jamais
	 *  `null` (précédent `objectif_id`, `FichePersonnage.tsx`). */
	onChangeDonneur: (donneurId: string) => void
	onChangeEtape: (index: number, valeur: string) => void
	onBlurEtape: (index: number, valeur: string) => void
	onAjouterEtape: () => void
	onRetirerEtape: (index: number) => void
	onAjouterEffet: (effet: Delta) => void
	onChangerCibleEffet: (index: number, rang: number, valeur: string) => void
	onRetirerEffet: (index: number) => void
}

/**
 * La fiche de la quête sélectionnée — précédent direct `FicheIndice.tsx` pour
 * l'anatomie générale (champs + bandeau de refus). Composant PUREMENT DE
 * RENDU : aucun état de document, aucun appel à `DossierService` — brouillon
 * et commit restent la responsabilité du parent, seul propriétaire de
 * `dossierId`.
 *
 * DONNEUR — idiome « porte » (précédent `apres_indice_id`,
 * `BlocSavoirs.tsx:430-467`) : tant que `quete.donneur_id` est absent, un
 * `Select` unique dont la première option est « + Choisir un donneur… ». Une
 * fois choisi, le `Select` résolu (label « DONNEUR ») est accompagné d'un
 * `IconButton` de retrait — l'espace de noms technique est `pnj`, le libellé
 * affiché à l'auteur reste « Personnage » (`ESPACES_DE_NOMS`).
 *
 * ÉTAPES — brouillon différé porté par `useEcritureEtapes` (parent) :
 * `etapes` est la liste RENDUE, brouillon d'ajout compris en dernière
 * position, structurellement IDENTIQUE à une ligne écrite (le placeholder
 * vide est le seul signal « pas encore committée »). L'eyebrow « ÉTAPE N »
 * est DÉRIVÉ de la position dans ce tableau, jamais un champ.
 *
 * AUCUN BOUTON DE RETRAIT DE FICHE cette itération (retrait d'une quête hors
 * périmètre, précédent `dossier-objets`/`dossier-registres` it1/it2).
 *
 * CLAVIER — Tab suit l'ordre visuel ; `Entrée` dans un champ mono-ligne (NOM,
 * ÉCHÉANCE) blur-committe, sans effet sur les champs multiligne (CONSIGNE,
 * LIBELLÉ d'étape), où elle insère un saut de ligne.
 */
export function FicheQuete({
	quete,
	personnages,
	brouillon,
	etapes,
	entitesParEspace,
	refus,
	nomInputRef,
	onChangeChamp,
	onBlurChamp,
	onChangeDonneur,
	onChangeEtape,
	onBlurEtape,
	onAjouterEtape,
	onRetirerEtape,
	onAjouterEffet,
	onChangerCibleEffet,
	onRetirerEffet,
}: FicheQueteProps): JSX.Element {
	const optionsPersonnages: SelectOption<string>[] = personnages.map((personnage, index) => ({
		value: personnage.id,
		label: localiserEntite('pnj', personnage, index),
	}))
	const donneurId = quete.donneur_id

	function handleKeyDownMono(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		// Entrée dans un champ MONO-LIGNE blur-committe (précédent it1) — sans
		// effet sur les `Field` multiline, qui ne passent pas par ce gestionnaire.
		if (e.key === 'Enter') e.currentTarget.blur()
	}

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DE LA QUÊTE"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					inputRef={nomInputRef}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onKeyDown={handleKeyDownMono}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
				/>

				{donneurId === undefined ? (
					<Select
						label="DONNEUR"
						options={[{ value: '', label: TEXTE_CHOISIR_DONNEUR }, ...optionsPersonnages]}
						value=""
						onChange={onChangeDonneur}
					/>
				) : (
					<div style={enTeteLigneStyle}>
						<Select
							label="DONNEUR"
							options={avecOrpheline(optionsPersonnages, donneurId, 'pnj')}
							value={donneurId}
							onChange={onChangeDonneur}
						/>
						<IconButton
							label="Retirer le donneur"
							tone="danger"
							size={HIT_TARGET_MIN}
							onClick={() => onChangeDonneur('')}
						>
							✕
						</IconButton>
					</div>
				)}

				<Field
					label="CONSIGNE DE LA QUÊTE"
					hint={HINT_CONSIGNE}
					multiline
					rows={2}
					placeholder={PLACEHOLDER_CONSIGNE}
					value={brouillon.consigne}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('consigne', e.target.value)
					}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('consigne', e.target.value)}
				/>

				<Field
					label="ÉCHÉANCE"
					hint={HINT_ECHEANCE}
					placeholder={PLACEHOLDER_ECHEANCE}
					value={brouillon.echeance}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
						onChangeChamp('echeance', e.target.value)
					}
					onKeyDown={handleKeyDownMono}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('echeance', e.target.value)}
				/>

				<div>
					<span style={eyebrowStyle}>ÉTAPES</span>
					<p style={legendeStyle}>{LEGENDE_ETAPES}</p>
					<div style={listeLignesStyle}>
						{etapes.map((etape, index) => (
							<div key={index} style={ligneStyle}>
								<div style={enTeteLigneStyle}>
									<span style={eyebrowStyle}>{`ÉTAPE ${index + 1}`}</span>
									<IconButton
										label={`Retirer l'étape n°${index + 1}`}
										tone="danger"
										size={HIT_TARGET_MIN}
										onClick={() => onRetirerEtape(index)}
									>
										✕
									</IconButton>
								</div>
								<Field
									label="LIBELLÉ"
									hint={HINT_ETAPE}
									multiline
									rows={2}
									placeholder={PLACEHOLDER_ETAPE}
									value={etape.libelle}
									onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										onChangeEtape(index, e.target.value)
									}
									onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurEtape(index, e.target.value)}
								/>
							</div>
						))}
					</div>
					<button type="button" onClick={onAjouterEtape} style={boutonAjouterStyle}>
						+ Ajouter une étape…
					</button>
				</div>

				<EditeurEffets
					titre={TITRE_RECOMPENSE}
					legende={LEGENDE_RECOMPENSE}
					texteVide={TEXTE_VIDE_RECOMPENSE}
					effets={quete.recompense}
					entitesParEspace={entitesParEspace}
					onAjouterEffet={onAjouterEffet}
					onChangerCible={onChangerCibleEffet}
					onRetirerEffet={onRetirerEffet}
				/>

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
