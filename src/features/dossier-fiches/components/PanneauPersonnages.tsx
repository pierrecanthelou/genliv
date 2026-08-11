import { useState, type CSSProperties } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	Badge,
	PORTEE_INITIALE,
	type Personnage,
	type CampPersonnage,
	type Portee,
} from '../../../brain'
import { FichePersonnage, LIBELLES_CAMP, LIBELLES_PORTEE } from './FichePersonnage'

export interface PanneauPersonnagesProps {
	dossierId: string
}

const EYEBROW_SECTION = 'PERSONNAGES'
const TEXTE_VIDE = 'Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.'

function brouillonNomDe(personnage: Personnage): string {
	return personnage.nom ?? ''
}

/**
 * Le panneau Personnages — la liste des acteurs du monde (`monde.personnages[]`),
 * écrite par le même `DossierService.update()` que Canon/Départ/Objectifs/Lieux,
 * avec un patch ÉTROIT : `canon`/`charpente` traversent intacts (§6, critère #7
 * du plan d'itération 1 de `dossier-fiches`). Motif `PanneauLieux` (§3 du plan) :
 * colonne liste `ListRow` à gauche, fiche à droite (`FichePersonnage.tsx`).
 *
 * DEUX RÉGIMES D'ÉCRITURE : `nom` — brouillon local indexé par
 * `personnage.id`, committé au blur (idiome `PanneauLieux`/`PanneauCanon`) ;
 * `camp`/`portee`/`objectif_id` — AUCUN brouillon, ce sont des widgets fermés
 * (`SegmentedControl`/`Select`) qui committent immédiatement.
 *
 * Sélection par défaut calculée EN LIGNE (`personnages.find(...) ?? personnages[0]`),
 * jamais resynchronisée par effet (KR-013/113) — même idiome que `PanneauLieux`.
 *
 * Retrait d'un personnage : HORS PÉRIMÈTRE d'it1 (§2 du plan) — aucun bouton,
 * aucun test. Refus/bandeau : AUCUN `IssueList` ici (§3 du plan) — `camp`/`portee`
 * sont des choix fermés, `objectif_id` ne référence que des `canon.objectifs[].id`
 * réels ou rien : `statut: 'refuse'` est structurellement inatteignable depuis ce
 * bloc, même raisonnement qu'`ObjectifsCanon.tsx` v1 — construire un bandeau qui
 * ne peut jamais s'allumer serait du code non testable.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauPersonnages({ dossierId }: PanneauPersonnagesProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillonsNom, setBrouillonsNom] = useState<Record<string, string>>(() =>
		dossier === null ? {} : Object.fromEntries(dossier.monde.personnages.map((p) => [p.id, brouillonNomDe(p)])),
	)
	const [selection, setSelection] = useState<string | null>(null)

	if (dossier === null) return null
	// Idiome `PanneauLieux`/`ObjectifsCanon` : capter une valeur non nulle une
	// fois évite un `as`/`!` répété dans chaque gestionnaire.
	const dossierActuel: typeof dossier = dossier

	/**
	 * L'idiome d'écriture prescrit (§3/§5 du plan) : TROIS racines nommées,
	 * jamais un spread de `dossier` — seul `monde.personnages` change,
	 * `canon`/`charpente` traversent intacts.
	 */
	function commit(personnages: Personnage[]): void {
		dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, personnages },
			charpente: d.charpente,
		}))
	}

	function handleAjouter(): void {
		const id = frapperIdentifiant('pnj')
		// camp ET nom absents (jamais `''`/`undefined` explicite) — critère #1 du
		// plan : « camp et nom absents », `portee` au plancher du schéma
		// (`PORTEE_INITIALE`, jamais un choix d'auteur, KR-191/§8 désaccord 7).
		const nouveau: Personnage = { id, portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }
		commit([...dossierActuel.monde.personnages, nouveau])
		setBrouillonsNom((prev) => ({ ...prev, [id]: '' }))
		setSelection(id)
	}

	function handleChangeNom(id: string, valeur: string): void {
		setBrouillonsNom((prev) => ({ ...prev, [id]: valeur }))
	}

	function handleBlurNom(id: string, valeur: string): void {
		commit(dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, nom: valeur } : p)))
	}

	function handleChangeCamp(id: string, camp: CampPersonnage): void {
		commit(dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, camp } : p)))
	}

	function handleChangePortee(id: string, portee: Portee): void {
		commit(dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, portee } : p)))
	}

	/**
	 * `objectifId === ''` (« Aucun objectif rattaché ») retire la clé plutôt que
	 * de committer une chaîne vide (compte rendu du lot contrat, note 1) : le
	 * validateur ignore silencieusement une référence vide, et `objectif_id: ''`
	 * passerait le validateur tout en laissant une chaîne vide dans le document
	 * persisté.
	 */
	function handleChangeObjectif(id: string, objectifId: string): void {
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				if (objectifId === '') {
					// Retire la clé plutôt que de committer `objectif_id: ''` — un spread
					// destructurant laisserait une variable inutilisée (`no-unused-vars`,
					// aucune option `ignoreRestSiblings` déclarée pour ce lot).
					const sansObjectif: Personnage = { ...p }
					delete sansObjectif.objectif_id
					return sansObjectif
				}
				return { ...p, objectif_id: objectifId }
			}),
		)
	}

	// `prev[id]` peut manquer pour un personnage arrivé hors de `handleAjouter`
	// (ex. réconciliation cloud pendant que le panneau est monté) — repli sur la
	// même garde de lecture/mutation que `PanneauLieux` (BUG-058).
	function brouillonNomActuel(personnage: Personnage): string {
		const brouillon = brouillonsNom[personnage.id]
		return brouillon !== undefined ? brouillon : brouillonNomDe(personnage)
	}

	if (dossier.monde.personnages.length === 0) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un personnage…
					</button>
				</div>
				<div style={colonneFicheStyle}>
					<div style={emptyStateStyle}>
						<span style={emptyGlyphStyle} aria-hidden="true">
							❏
						</span>
						<p style={emptyTextStyle}>{TEXTE_VIDE}</p>
					</div>
				</div>
			</div>
		)
	}

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur le premier personnage tant qu'aucune
	// sélection explicite n'a été posée (montage, ou sélection devenue caduque).
	const personnageAffiche = dossier.monde.personnages.find((p) => p.id === selection) ?? dossier.monde.personnages[0]

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<div style={listeStyle}>
					{dossier.monde.personnages.map((personnage, index) => (
						<ListRow
							key={personnage.id}
							title={localiserEntite('pnj', personnage, index)}
							subtitle={personnage.id}
							selected={personnage.id === personnageAffiche.id}
							onSelect={() => setSelection(personnage.id)}
							trailing={
								<span style={badgesStyle}>
									<Badge tone="neutral">{LIBELLES_PORTEE[personnage.portee]}</Badge>
									{personnage.camp !== undefined && <Badge tone="neutral">{LIBELLES_CAMP[personnage.camp]}</Badge>}
								</span>
							}
						/>
					))}
				</div>
				<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter un personnage…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FichePersonnage
					personnage={personnageAffiche}
					brouillonNom={brouillonNomActuel(personnageAffiche)}
					objectifsCanon={dossier.canon.objectifs}
					onChangeNom={(valeur) => handleChangeNom(personnageAffiche.id, valeur)}
					onBlurNom={(valeur) => handleBlurNom(personnageAffiche.id, valeur)}
					onChangeCamp={(camp) => handleChangeCamp(personnageAffiche.id, camp)}
					onChangePortee={(portee) => handleChangePortee(personnageAffiche.id, portee)}
					onChangeObjectif={(objectifId) => handleChangeObjectif(personnageAffiche.id, objectifId)}
				/>
			</div>
		</div>
	)
}

const pageStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	display: 'flex',
	gap: 'var(--space-8)',
	padding: 'var(--space-8)',
	overflowY: 'auto',
}

const colonneListeStyle: CSSProperties = {
	width: 320,
	flexShrink: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const colonneFicheStyle: CSSProperties = {
	flex: 1,
	minWidth: 0,
}

const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 'var(--space-2)',
}

const listeStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const badgesStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}

const boutonAjouterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	boxSizing: 'border-box',
	minHeight: 'var(--hit-target)',
	padding: '7px 10px',
	border: '1.5px dashed var(--accent)',
	borderRadius: 'var(--r-md)',
	background: 'var(--accent-bg)',
	color: 'var(--accent)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}

const emptyStateStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--surface-inset)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
	margin: 'auto',
}

const emptyGlyphStyle: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const emptyTextStyle: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
