import type { ChangeEvent, CSSProperties, FocusEvent } from 'react'
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
	type DossierIssue,
} from '../../../brain'
import { Accordion, type AccordionSection } from './Accordion'
import type { BrouillonPersonnage, ChampTexte } from './PanneauPersonnages'

/** Libellés français du camp — côté FEATURE (précédent `ObjectifsCanon.tsx`,
 *  `LIBELLES_CAMPS`) : un seul registre, réutilisé ici par le `SegmentedControl`
 *  du bloc 1 ET par le badge de `ListRow` dans `PanneauPersonnages.tsx`, pour
 *  qu'un seul texte porte « Protagoniste »/« Antagoniste ». */
export const LIBELLES_CAMP: Record<CampPersonnage, string> = {
	protagoniste: 'Protagoniste',
	antagoniste: 'Antagoniste',
}
const OPTIONS_CAMP = CAMPS_PERSONNAGE.map((camp) => ({ value: camp, label: LIBELLES_CAMP[camp] }))

/** Même règle pour la portée — un seul registre pour le `SegmentedControl` du
 *  bloc 1 et le badge de plan, toujours présent, de `PanneauPersonnages.tsx`. */
export const LIBELLES_PORTEE: Record<Portee, string> = {
	premier: 'Premier plan',
	second: 'Second plan',
}
const OPTIONS_PORTEE = PORTEES.map((portee) => ({ value: portee, label: LIBELLES_PORTEE[portee] }))

const BLOC_1_ID = 'camp-plan-rattachement'
const BLOC_2_ID = 'identite'

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

/** Les 6 blocs encore vides à l'itération 2 — titre exact + itération cible du
 *  placeholder, table DÉCLARATIVE (§3 du plan) plutôt que 6 littéraux JSX
 *  recopiés. `identite` a quitté cette table à l'itération 2 : il porte
 *  désormais du contenu réel (bloc 2, ci-dessous). */
const BLOCS_VIDES: readonly { id: string; titre: string; iteration: number }[] = [
	{ id: 'caracteristiques', titre: 'Caractéristiques', iteration: 3 },
	{ id: 'objectif-plan-actions', titre: "Objectif & plan d'actions", iteration: 4 },
	{ id: 'savoirs', titre: 'Savoirs', iteration: 5 },
	{ id: 'relations', titre: 'Relations', iteration: 5 },
	{ id: 'presence', titre: 'Présence', iteration: 5 },
	{ id: 'caractere-exploitable', titre: 'Caractère exploitable', iteration: 6 },
]

function placeholderDe(iteration: number): string {
	return `Pas encore renseigné — ce bloc arrive à l'itération ${iteration} de dossier-fiches.`
}

export interface FichePersonnageProps {
	personnage: Personnage
	brouillon: BrouillonPersonnage
	objectifsCanon: Objectif[]
	/** Le refus en cours, DÉJÀ filtré par le parent (seul propriétaire de la
	 *  sélection et de `dossierId`) — cette fiche ne reçoit jamais l'identifiant
	 *  du personnage en cause, seulement ce qu'il reste à afficher. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	onChangeChamp: (champ: ChampTexte, valeur: string) => void
	onBlurChamp: (champ: ChampTexte, valeur: string) => void
	onChangeCamp: (camp: CampPersonnage) => void
	onChangePortee: (portee: Portee) => void
	/** `''` = « Aucun objectif rattaché » — au parent de retirer la clé plutôt
	 *  que de committer une chaîne vide (§ compte rendu du lot contrat, note 1). */
	onChangeObjectif: (objectifId: string) => void
}

/**
 * La fiche du personnage sélectionné — liste `ListRow` à gauche
 * (`PanneauPersonnages.tsx`), fiche à droite. Composant PUREMENT DE RENDU :
 * aucun état, aucun appel à `DossierService` — brouillon et commit restent la
 * responsabilité du parent, seul propriétaire de `dossierId`.
 *
 * Champ NOM en EN-TÊTE de fiche, HORS accordéon (précédent `FicheLieu`,
 * « NOM DU LIEU » comme premier `Field`, au-dessus de toute structure
 * interne) : brouillon local + commit au blur, porté par le parent, au même
 * titre que les trois champs du bloc 2 (`onChangeChamp`/`onBlurChamp` unifiés,
 * délta d'it1 — §5 du plan d'itération 2).
 *
 * BLOC 2 « IDENTITÉ » (it2, §3 du plan) : trois `Field` multiline —
 * `FONCTION`, `APPARENCE`, `DESCRIPTION JOUEUR` — ordre fixé, mêmes
 * placeholders/hints que le contrat de design. Ce bloc NE S'OUVRE PAS
 * automatiquement : `defaultOpenId` reste le bloc 1.
 *
 * `BlocIdentite.tsx` n'est PAS extrait (§5 du plan, désaccord 11) : ce fichier
 * reste sous le seuil de scission KR-112 (~265 lignes projetées).
 *
 * L'accordéon revient au bloc 1 à chaque changement de personnage par
 * `key={personnage.id}` posé ICI, sur `<Accordion>` — remontage React, jamais
 * un `useEffect` (KR-013/113).
 *
 * BANDEAU DE REFUS (it2, §3 du plan) : dernier enfant de `champsStyle`,
 * position exacte de `FicheLieu.tsx`. Branché sur `refus.statut`, JAMAIS sur
 * `refus.issues` : `{statut:'absent'}` ne porte AUCUN `issues`
 * (`DossierService.ts`), un `<IssueList issues={[]} />` rendrait un bandeau
 * vide sous un eyebrow rouge.
 */
export function FichePersonnage({
	personnage,
	brouillon,
	objectifsCanon,
	refus,
	onChangeChamp,
	onBlurChamp,
	onChangeCamp,
	onChangePortee,
	onChangeObjectif,
}: FichePersonnageProps): JSX.Element {
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
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onChangeChamp('fonction', e.target.value)
						}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('fonction', e.target.value)}
					/>
					<Field
						label="APPARENCE"
						hint={HINT_APPARENCE}
						multiline
						rows={3}
						placeholder={PLACEHOLDER_APPARENCE}
						value={brouillon.apparence}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onChangeChamp('apparence', e.target.value)
						}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('apparence', e.target.value)}
					/>
					<Field
						label="DESCRIPTION JOUEUR"
						hint={HINT_DESCRIPTION_JOUEUR}
						multiline
						rows={3}
						placeholder={PLACEHOLDER_DESCRIPTION_JOUEUR}
						value={brouillon.description_joueur}
						onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onChangeChamp('description_joueur', e.target.value)
						}
						onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
							onBlurChamp('description_joueur', e.target.value)
						}
					/>
				</>
			),
		},
		...BLOCS_VIDES.map(
			(bloc): AccordionSection => ({
				id: bloc.id,
				title: bloc.titre,
				content: <p style={placeholderStyle}>{placeholderDe(bloc.iteration)}</p>,
			}),
		),
	]

	return (
		<Card>
			<div style={champsStyle}>
				<Field
					label="NOM DU PERSONNAGE"
					hint="interne"
					placeholder={PLACEHOLDER_NOM}
					value={brouillon.nom}
					onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeChamp('nom', e.target.value)}
					onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlurChamp('nom', e.target.value)}
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
			</div>
		</Card>
	)
}

const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const legendeStyle: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
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
