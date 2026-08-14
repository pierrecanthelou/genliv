import { type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	Card,
	Field,
	Select,
	SegmentedControl,
	IssueList,
	localiserEntite,
	CAMPS_PERSONNAGE,
	PORTEES,
	type CampPersonnage,
	type Portee,
	type Personnage,
	type Objectif,
	type Lieu,
	type DossierIssue,
	type Characteristic,
} from '../../../brain'
import { Accordion, type AccordionSection } from './Accordion'
import { BlocCaracteristiques } from './BlocCaracteristiques'
import { BlocPlanActions } from './BlocPlanActions'
import { BlocRelations } from './BlocRelations'
import { BlocPresence } from './BlocPresence'
import { eyebrowStyle, legendeStyle } from './styles'
import type { BrouillonPersonnage, ChampTexte } from '../hooks/useEcritureIdentite'
import type {
	BrouillonBut,
	ChampBut,
	BrouillonEtape,
	ChampEtapeTexte,
	BrouillonContreMesure,
	ChampContreMesureTexte,
} from '../hooks/useEcriturePlan'
import type { UseEcritureRelationsPresenceResult } from '../hooks/useEcritureRelationsPresence'

/** Libellés français du camp — côté FEATURE, réutilisés par le `SegmentedControl`
 *  du bloc 1 et le badge de `ListRow` de `PanneauPersonnages.tsx`. */
export const LIBELLES_CAMP: Record<CampPersonnage, string> = {
	protagoniste: 'Protagoniste',
	antagoniste: 'Antagoniste',
}
const OPTIONS_CAMP = CAMPS_PERSONNAGE.map((camp) => ({ value: camp, label: LIBELLES_CAMP[camp] }))

/** Même règle pour la portée. */
export const LIBELLES_PORTEE: Record<Portee, string> = {
	premier: 'Premier plan',
	second: 'Second plan',
}
const OPTIONS_PORTEE = PORTEES.map((portee) => ({ value: portee, label: LIBELLES_PORTEE[portee] }))

const BLOC_1_ID = 'camp-plan-rattachement'
const BLOC_2_ID = 'identite'
const BLOC_3_ID = 'caracteristiques'
const BLOC_4_ID = 'objectif-plan-actions'
const BLOC_5_ID = 'relations'
const BLOC_6_ID = 'presence'

const PLACEHOLDER_NOM = 'Aldûr le Sage'

const HINT_FONCTION = 'interne — jamais lu par le joueur'
const HINT_APPARENCE =
	'interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques'
const HINT_DESCRIPTION_JOUEUR = 'lue par le joueur'

const PLACEHOLDER_FONCTION = 'Ermite retiré du monde, gardien de la mémoire de Val-Cendre.'
const PLACEHOLDER_APPARENCE =
	"Un vieil homme voûté à la barbe blanche tressée de perles d'os, les mains tachées d'encre et de cendre."
const PLACEHOLDER_DESCRIPTION_JOUEUR =
	"Une silhouette voûtée émerge de la pénombre du sanctuaire, capuche rabattue sur un visage qu'on devine plus vieux que la voix ne le laisse entendre."

const TEXTE_AUCUN_OBJECTIF_CANON =
	"Aucun objectif défini dans le canon — ce personnage restera sans objectif tant qu'aucun n'existe."

const OPTION_AUCUN_OBJECTIF = { value: '', label: 'Aucun objectif rattaché' }

const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
const EYEBROW_AVERTISSEMENT = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

/** Les 2 blocs encore vides après it5, renumérotés au raffinage d'it5 (savoirs
 *  → it6, caractère exploitable → it8). PLUS ADJACENTS dans l'ordre de rendu
 *  (Relations/Présence s'intercalent) : deux constantes nommées, pas un tableau. */
const BLOC_SAVOIRS = { id: 'savoirs', titre: 'Savoirs', iteration: 6 }
const BLOC_CARACTERE_EXPLOITABLE = { id: 'caractere-exploitable', titre: 'Caractère exploitable', iteration: 8 }

function placeholderDe(iteration: number): string {
	return `Pas encore renseigné — ce bloc arrive à l'itération ${iteration} de dossier-fiches.`
}

function sectionPlaceholder(bloc: { id: string; titre: string; iteration: number }): AccordionSection {
	return { id: bloc.id, title: bloc.titre, content: <p style={placeholderStyle}>{placeholderDe(bloc.iteration)}</p> }
}

export interface FichePersonnageProps {
	personnage: Personnage
	brouillon: BrouillonPersonnage
	objectifsCanon: Objectif[]
	/** Le refus en cours, DÉJÀ filtré par le parent — cette fiche ne reçoit jamais
	 *  l'identifiant du personnage en cause, seulement ce qu'il reste à afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	/** Avertissement D1 (KR-189), DÉJÀ filtré au personnage affiché par le parent. */
	avertissementsD1: DossierIssue[]
	onChangeChamp: (champ: ChampTexte, valeur: string) => void
	onBlurChamp: (champ: ChampTexte, valeur: string) => void
	onChangeCamp: (camp: CampPersonnage) => void
	onChangePortee: (portee: Portee) => void
	/** `''` = « Aucun objectif rattaché » — le parent retire la clé plutôt que de
	 *  committer une chaîne vide. */
	onChangeObjectif: (objectifId: string) => void
	/** Geste EXPLICITE qui sème les 8 clés à `CARACTERISTIQUE_MIN` en un commit. */
	onReglerCaracteristiques: () => void
	onChangeCaracteristique: (carac: Characteristic, valeur: number) => void
	butBrouillon: BrouillonBut
	onChangeBut: (champ: ChampBut, valeur: string) => void
	onBlurBut: (champ: ChampBut, valeur: string) => void
	etapes: BrouillonEtape[]
	onChangeEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	onBlurEtape: (index: number, champ: ChampEtapeTexte, valeur: string) => void
	onChangeDureeEtape: (index: number, valeur: number) => void
	onAjouterEtape: () => void
	onRetirerEtape: (index: number) => void
	contreMesures: BrouillonContreMesure[]
	onChangeContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	onBlurContreMesure: (index: number, champ: ChampContreMesureTexte, valeur: string) => void
	onAjouterContreMesure: () => void
	onRetirerContreMesure: (index: number) => void
	/** Le dossier ENTIER, jamais filtré : l'auto-référence est légale (KR-194). */
	personnages: Personnage[]
	lieux: Lieu[]
	/** La tranche relations/présence de l'assembleur `useEcriturePersonnages`
	 *  (structurellement compatible avec `UseEcritureRelationsPresenceResult`,
	 *  §5 lot 2 du plan) : ses champs sont câblés un par un vers
	 *  `BlocRelations`/`BlocPresence` (noms `on*`, jamais `handle*`, dans le JSX
	 *  ci-dessous) — regroupés ici pour ne pas recopier ces props individuelles
	 *  sur cette interface (KR-112). */
	relationsPresence: UseEcritureRelationsPresenceResult
}

/**
 * La fiche du personnage sélectionné — liste `ListRow` à gauche
 * (`PanneauPersonnages.tsx`), fiche à droite. Composant PUREMENT DE RENDU :
 * aucun état de DOCUMENT, aucun appel à `DossierService` — brouillon et commit
 * restent la responsabilité du hook `useEcriturePersonnages`. Champ NOM en
 * EN-TÊTE de fiche, HORS accordéon (précédent `FicheLieu`).
 *
 * Blocs 3 à 6 (caractéristiques, objectif & plan d'actions, relations,
 * présence) EXTRAITS dans leur propre composant (dette KR-112) : ce fichier ne
 * fait plus que les CÂBLER dans `sections`, DANS L'ORDRE D'AFFICHAGE — « Savoirs »
 * (encore un placeholder) s'intercale entre le bloc 4 et le bloc 5, d'où
 * `BLOC_SAVOIRS`/`BLOC_CARACTERE_EXPLOITABLE` posés HORS séquence.
 *
 * L'accordéon revient au bloc 1 à chaque changement de personnage par
 * `key={personnage.id}` posé ICI (remontage React, jamais un `useEffect`,
 * KR-013/113) — les refs de focus internes des blocs extraits n'ont donc pas
 * besoin de porter l'identité du personnage.
 *
 * Bandeau de refus (`refus.statut`, jamais `refus.issues`) puis bandeau
 * d'avertissement D1 (rendu seulement si `avertissementsD1` est non vide) :
 * derniers enfants de `champsStyle`, position exacte de `FicheLieu.tsx`.
 */
export function FichePersonnage({
	personnage,
	brouillon,
	objectifsCanon,
	refus,
	avertissementsD1,
	onChangeChamp,
	onBlurChamp,
	onChangeCamp,
	onChangePortee,
	onChangeObjectif,
	onReglerCaracteristiques,
	onChangeCaracteristique,
	butBrouillon,
	onChangeBut,
	onBlurBut,
	etapes,
	onChangeEtape,
	onBlurEtape,
	onChangeDureeEtape,
	onAjouterEtape,
	onRetirerEtape,
	contreMesures,
	onChangeContreMesure,
	onBlurContreMesure,
	onAjouterContreMesure,
	onRetirerContreMesure,
	personnages,
	lieux,
	relationsPresence,
}: FichePersonnageProps): JSX.Element {
	// Factorise la paire onChange/onBlur typée, répétée sur les 4 champs texte
	// de brouillon-par-champ (nom + les 3 proses du bloc 2).
	const champHandlers = (champ: ChampTexte) => ({
		onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp(champ, e.target.value),
		onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp(champ, e.target.value),
	})

	const sections: AccordionSection[] = [
		{
			id: BLOC_1_ID,
			title: 'Camp, plan & rattachement',
			content: (
				<>
					<div>
						<span style={eyebrowStyle}>CAMP</span>
						<SegmentedControl<CampPersonnage>
							options={OPTIONS_CAMP}
							value={personnage.camp}
							onChange={onChangeCamp}
							ariaLabel="Camp du personnage"
						/>
					</div>
					<div>
						<span style={eyebrowStyle}>PLAN</span>
						<SegmentedControl<Portee>
							options={OPTIONS_PORTEE}
							value={personnage.portee}
							onChange={onChangePortee}
							ariaLabel="Plan du personnage"
						/>
					</div>
					{objectifsCanon.length === 0 ? (
						<div>
							<span style={eyebrowStyle}>OBJECTIF RATTACHÉ</span>
							<p style={legendeStyle}>{TEXTE_AUCUN_OBJECTIF_CANON}</p>
						</div>
					) : (
						<Select
							label="OBJECTIF RATTACHÉ"
							options={[
								OPTION_AUCUN_OBJECTIF,
								...objectifsCanon.map((objectif, index) => ({
									value: objectif.id,
									label: localiserEntite('objectif', objectif, index),
								})),
							]}
							value={personnage.objectif_id ?? ''}
							onChange={onChangeObjectif}
						/>
					)}
				</>
			),
		},
		{
			id: BLOC_2_ID,
			title: 'Identité',
			content: (
				<>
					<Field
						label="FONCTION"
						hint={HINT_FONCTION}
						multiline
						rows={2}
						placeholder={PLACEHOLDER_FONCTION}
						value={brouillon.fonction}
						{...champHandlers('fonction')}
					/>
					<Field
						label="APPARENCE"
						hint={HINT_APPARENCE}
						multiline
						rows={3}
						placeholder={PLACEHOLDER_APPARENCE}
						value={brouillon.apparence}
						{...champHandlers('apparence')}
					/>
					<Field
						label="DESCRIPTION JOUEUR"
						hint={HINT_DESCRIPTION_JOUEUR}
						multiline
						rows={3}
						placeholder={PLACEHOLDER_DESCRIPTION_JOUEUR}
						value={brouillon.description_joueur}
						{...champHandlers('description_joueur')}
					/>
				</>
			),
		},
		{
			id: BLOC_3_ID,
			title: 'Caractéristiques',
			content: (
				<BlocCaracteristiques
					personnage={personnage}
					onReglerCaracteristiques={onReglerCaracteristiques}
					onChangeCaracteristique={onChangeCaracteristique}
				/>
			),
		},
		{
			id: BLOC_4_ID,
			title: "Objectif & plan d'actions",
			content: (
				<BlocPlanActions
					personnage={personnage}
					butBrouillon={butBrouillon}
					onChangeBut={onChangeBut}
					onBlurBut={onBlurBut}
					etapes={etapes}
					onChangeEtape={onChangeEtape}
					onBlurEtape={onBlurEtape}
					onChangeDureeEtape={onChangeDureeEtape}
					onAjouterEtape={onAjouterEtape}
					onRetirerEtape={onRetirerEtape}
					contreMesures={contreMesures}
					onChangeContreMesure={onChangeContreMesure}
					onBlurContreMesure={onBlurContreMesure}
					onAjouterContreMesure={onAjouterContreMesure}
					onRetirerContreMesure={onRetirerContreMesure}
				/>
			),
		},
		sectionPlaceholder(BLOC_SAVOIRS),
		{
			id: BLOC_5_ID,
			title: 'Relations',
			content: (
				<BlocRelations
					personnages={personnages}
					relations={relationsPresence.relations}
					onAjouterRelation={relationsPresence.handleAjouterRelation}
					onChangeCibleRelation={relationsPresence.handleChangeCibleRelation}
					onChangeLienRelation={relationsPresence.handleChangeLienRelation}
					onBlurLienRelation={relationsPresence.handleBlurLienRelation}
					onChangeIntensiteRelation={relationsPresence.handleChangeIntensiteRelation}
					onChangeSecretRelation={relationsPresence.handleChangeSecretRelation}
					onRetirerRelation={relationsPresence.handleRetirerRelation}
				/>
			),
		},
		{
			id: BLOC_6_ID,
			title: 'Présence',
			content: (
				<BlocPresence
					lieux={lieux}
					presence={relationsPresence.presence}
					onAjouterPresence={relationsPresence.handleAjouterPresence}
					onChangeLieuPresence={relationsPresence.handleChangeLieuPresence}
					onChangeQuandPresence={relationsPresence.handleChangeQuandPresence}
					onBlurQuandPresence={relationsPresence.handleBlurQuandPresence}
					onRetirerPresence={relationsPresence.handleRetirerPresence}
				/>
			),
		},
		sectionPlaceholder(BLOC_CARACTERE_EXPLOITABLE),
	]

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU PERSONNAGE"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					{...champHandlers('nom')}
				/>
				<Accordion key={personnage.id} sections={sections} defaultOpenId={BLOC_1_ID} />

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

				{avertissementsD1.length > 0 && (
					<div role="status" style={bandeauRefusStyle}>
						<p style={eyebrowRefusStyle}>{EYEBROW_AVERTISSEMENT}</p>
						<IssueList issues={avertissementsD1} />
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

const placeholderStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}

const bandeauRefusStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	marginTop: 'var(--space-6)',
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
