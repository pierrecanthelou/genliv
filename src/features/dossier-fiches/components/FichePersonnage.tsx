import { useEffect, useRef, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	Card,
	Field,
	Select,
	SegmentedControl,
	Stepper,
	IssueList,
	localiserEntite,
	CAMPS_PERSONNAGE,
	PORTEES,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	CHARACTERISTIC_MAX,
	CARACTERISTIQUE_MIN,
	maxPV,
	type CampPersonnage,
	type Portee,
	type Personnage,
	type Objectif,
	type DossierIssue,
	type Characteristic,
} from '../../../brain'
import { Accordion, type AccordionSection } from './Accordion'
import { boutonPointilleStyle } from './styles'
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
const BLOC_3_ID = 'caracteristiques'

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

const TEXTE_REGLER_CARACTERISTIQUES = '+ Régler les caractéristiques…'
const LEGENDE_CARACTERISTIQUES = 'Caractéristiques — jamais lues par le narrateur.'
const LEGENDE_PV = 'Dérivé de Force + Agilité + Endurance — jamais stocké.'

/** Les 5 blocs encore vides à l'itération 3 — titre exact + itération cible du
 *  placeholder, table DÉCLARATIVE (§3 du plan) plutôt que 5 littéraux JSX
 *  recopiés. `identite` a quitté cette table à l'itération 2, `caracteristiques`
 *  à l'itération 3 : ils portent désormais du contenu réel (blocs 2 et 3,
 *  ci-dessous). */
const BLOCS_VIDES: readonly { id: string; titre: string; iteration: number }[] = [
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
	/** Geste EXPLICITE (désaccord n° 2 du plan d'itération 3) qui sème les 8
	 *  clés à `CARACTERISTIQUE_MIN` en un seul commit — jamais un effet de bord
	 *  du premier Stepper touché. */
	onReglerCaracteristiques: () => void
	onChangeCaracteristique: (carac: Characteristic, valeur: number) => void
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
 * `BlocIdentite.tsx` n'est PAS extrait (§5 du plan d'it2, désaccord 11) : à
 * l'époque ce fichier restait sous le seuil de scission KR-112. IL NE L'EST
 * PLUS — 317 l. avant it3, 437 après : le SIGNAL de 400 est franchi (le
 * bloqueur reste à 800). Extraction datée it4, qui doit soulager LES DEUX
 * fichiers : `hooks/useEcriturePersonnages.ts` pour le panneau, un bloc
 * d'accordéon pour cette fiche — extraire le seul hook laisserait ce
 * fichier-ci grossir encore (revue de PR it3).
 *
 * L'accordéon revient au bloc 1 à chaque changement de personnage par
 * `key={personnage.id}` posé ICI, sur `<Accordion>` — remontage React, jamais
 * un `useEffect` (KR-013/113).
 *
 * BLOC 3 « CARACTÉRISTIQUES » (it3, §3 du plan) : DEUX états exclusifs, jamais
 * de troisième. `stats` absent → une seule CTA, ni grille ni ligne PV dans le
 * DOM. `stats` présent (TOUJOURS les 8 clés) → légende de bloc + grille 2×4
 * (ordre `CHARACTERISTIC_VALUES`) + ligne PV dérivée EN LIGNE (`pv`,
 * ci-dessous, KR-013/113 — une seule condition, aucun `?? 0`).
 *
 * FOCUS après le clic sur la CTA (§3 « Clavier ») : déplacement DOM impératif
 * vers le premier contrôle du bloc qui vient d'apparaître (« Diminuer FORCE
 * (FO) »), pas un miroir d'état — usage légitime de `useEffect` (KR-013/113),
 * même famille que `PanneauLieux.tsx`/`ImportDossierDialog.tsx`. `Stepper`
 * n'est PAS étendu pour exposer un ref (désaccord n° 3, REJETÉ) : le premier
 * `<button>` du DOM sous la grille EST « Diminuer FORCE (FO) » (FO est le
 * premier de `CHARACTERISTIC_VALUES`, et un `Stepper` rend son bouton
 * « Diminuer » avant son bouton « Augmenter ») — interrogé par `querySelector`
 * plutôt que par un ref porté par `Stepper`.
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
	onReglerCaracteristiques,
	onChangeCaracteristique,
}: FichePersonnageProps): JSX.Element {
	// `stats` capté en LOCAL (plutôt que relire `personnage.stats` dans les
	// fermetures ci-dessous) : TypeScript ne conserve pas le rétrécissement
	// `!== undefined` d'un accès de propriété à travers une fermeture
	// (`.map(...)`) — seule celle d'une variable locale survit.
	const stats = personnage.stats
	// PV — EN LIGNE (KR-013/113), une seule condition, aucun `?? 0` possible :
	// un `stats` absent se LIT comme absent (§9 du registre des désaccords),
	// jamais un repli vers `STATS_INITIALES`, réservé à l'ÉCRITURE.
	const pv = stats === undefined ? null : maxPV(stats)

	const grilleCaracteristiquesRef = useRef<HTMLDivElement>(null)
	// L'intention de focus porte l'IDENTITÉ du personnage réglé, jamais un
	// booléen : un clic « Régler… » suivi d'un échec (dossier supprimé pendant
	// l'édition, KR-183) laisse une intention pendante, qu'un booléen ferait
	// consommer par le PROCHAIN personnage déjà configuré. Ce composant n'est
	// pas remonté au changement de sélection (aucun `key` côté panneau), donc
	// le ref survit à la sélection et c'est bien l'identité qui l'invalide.
	// Un seul effet : la version à deux effets tenait par leur ORDRE DE
	// DÉCLARATION, que ni le linter ni un test ne voient (revue de PR it3).
	const focusApresReglageRef = useRef<string | null>(null)

	useEffect(() => {
		if (focusApresReglageRef.current === personnage.id) {
			focusApresReglageRef.current = null
			grilleCaracteristiquesRef.current?.querySelector('button')?.focus()
		}
	}, [stats, personnage.id])

	function handleClicRegler(): void {
		focusApresReglageRef.current = personnage.id
		onReglerCaracteristiques()
	}

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
		{
			id: BLOC_3_ID,
			title: 'Caractéristiques',
			content:
				stats === undefined ? (
					<button type="button" onClick={handleClicRegler} style={boutonPointilleStyle}>
						{TEXTE_REGLER_CARACTERISTIQUES}
					</button>
				) : (
					<>
						<p style={legendeStyle}>{LEGENDE_CARACTERISTIQUES}</p>
						<div style={grilleCaracteristiquesStyle} ref={grilleCaracteristiquesRef}>
							{CHARACTERISTIC_VALUES.map((carac) => (
								<Stepper
									key={carac}
									label={`${CHARACTERISTICS[carac].label.toUpperCase()} (${carac})`}
									value={stats[carac]}
									min={CARACTERISTIQUE_MIN}
									max={CHARACTERISTIC_MAX}
									onChange={(valeur) => onChangeCaracteristique(carac, valeur)}
								/>
							))}
						</div>
						<div style={lignePvStyle}>
							<span style={eyebrowStyle}>PV</span>
							<span style={valeurPvStyle}>{pv}</span>
							<p style={legendeStyle}>{LEGENDE_PV}</p>
						</div>
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

const grilleCaracteristiquesStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: 'var(--space-8)',
}

const lignePvStyle: CSSProperties = {
	marginTop: 'var(--space-2)',
	paddingTop: 'var(--space-5)',
	borderTop: '1px solid var(--border-divider)',
}

const valeurPvStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}
