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
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FichePersonnage, LIBELLES_CAMP, LIBELLES_PORTEE } from './FichePersonnage'

export interface PanneauPersonnagesProps {
	dossierId: string
}

const EYEBROW_SECTION = 'PERSONNAGES'
const TEXTE_VIDE = 'Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.'

/**
 * Le brouillon local des QUATRE champs de prose d'un personnage — `nom`
 * (it1) plus les trois proses d'identité de l'itération 2. Le type vit ICI
 * (composant qui le POSSÈDE et le committe), `FichePersonnage.tsx` (composant
 * qui le REND) l'importe — sens INVERSE de `BrouillonLieu`/`FicheLieu.tsx`
 * (§5 du plan d'itération 2) : ce panneau reste seul propriétaire du
 * brouillon, de la sélection et de l'écriture.
 */
export interface BrouillonPersonnage {
	nom: string
	fonction: string
	apparence: string
	description_joueur: string
}
export type ChampTexte = keyof BrouillonPersonnage

/**
 * Le refus en cours, indexé par le personnage EN CAUSE — LES DEUX
 * indexations de KR-197 (4e occurrence : BUG-056/061/063), écrites
 * séparément : l'AFFICHAGE (le refus ne se rend que sous la fiche du
 * personnage qui l'a produit) et l'INVALIDATION (un commit réussi ne
 * l'efface que s'il touche ce même personnage). `statut` est repris TEL QUEL
 * de l'union du service, jamais d'une taxonomie maison — `issues` reste VIDE
 * pour `'absent'`, le service n'en fournit aucun (`DossierService.ts`).
 * `FichePersonnage` ne reçoit JAMAIS cet identifiant : le filtrage par id
 * reste ici, seul endroit qui connaît la sélection courante — même patron
 * que `PanneauLieux.tsx`/`ObjectifsCanon.tsx`.
 */
interface RefusEnCours {
	personnageId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

function brouillonDe(personnage: Personnage): BrouillonPersonnage {
	return {
		nom: personnage.nom ?? '',
		fonction: personnage.fonction ?? '',
		apparence: personnage.apparence ?? '',
		description_joueur: personnage.description_joueur ?? '',
	}
}

/**
 * Le panneau Personnages — la liste des acteurs du monde (`monde.personnages[]`),
 * écrite par le même `DossierService.update()` que Canon/Départ/Objectifs/Lieux,
 * avec un patch ÉTROIT : `canon`/`charpente` traversent intacts (§6, critère #7
 * du plan d'itération 1 de `dossier-fiches`). Motif `PanneauLieux` (§3 du plan) :
 * colonne liste `ListRow` à gauche, fiche à droite (`FichePersonnage.tsx`).
 *
 * DEUX RÉGIMES D'ÉCRITURE : `nom`/`fonction`/`apparence`/`description_joueur`
 * — brouillon local indexé par `personnage.id`, committé au blur (idiome
 * `PanneauLieux`/`PanneauCanon`, étendu à l'itération 2 aux trois proses
 * d'identité) ; `camp`/`portee`/`objectif_id` — AUCUN brouillon, ce sont des
 * widgets fermés (`SegmentedControl`/`Select`) qui committent immédiatement.
 *
 * Sélection par défaut calculée EN LIGNE (`personnages.find(...) ?? personnages[0]`),
 * jamais resynchronisée par effet (KR-013/113) — même idiome que `PanneauLieux`.
 *
 * Retrait d'un personnage : HORS PÉRIMÈTRE (it5, §2 du plan d'itération 2).
 *
 * DURCISSEMENT D'ÉCRITURE (it2, §1/§5 du plan) : `commit()` rend désormais
 * l'`EcritureDossier` au lieu de le jeter — condition pour que le bloc
 * « Identité » ne mente pas. `'absent'` (dossier supprimé ailleurs pendant
 * l'édition) et `'refuse'` (branche construite mais structurellement
 * inatteignable cette itération, §2/§8 désaccord 6 du plan) posent un refus
 * indexé par le personnage en cause, rendu par `FichePersonnage`.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauPersonnages({ dossierId }: PanneauPersonnagesProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonPersonnage>>(() =>
		dossier === null ? {} : Object.fromEntries(dossier.monde.personnages.map((p) => [p.id, brouillonDe(p)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)

	if (dossier === null) return null
	// Idiome `PanneauLieux`/`ObjectifsCanon` : capter une valeur non nulle une
	// fois évite un `as`/`!` répété dans chaque gestionnaire.
	const dossierActuel: typeof dossier = dossier

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur le premier personnage tant qu'aucune
	// sélection explicite n'a été posée — `undefined` seulement quand la liste
	// est vide. HISSÉ ici, AU-DESSUS du retour anticipé « liste vide » (sinon
	// `handleAjouter` capterait un `const` jamais initialisé sur ce chemin,
	// TDZ au clic) : c'est ce qui permet à `handleAjouter` d'indexer un refus
	// d'ajout raté sur la fiche RÉELLEMENT affichée plutôt que sur
	// l'identifiant tout juste frappé (revue de PR — voir `handleAjouter`).
	const personnageAffiche =
		dossierActuel.monde.personnages.find((p) => p.id === selection) ?? dossierActuel.monde.personnages[0]

	/**
	 * L'idiome d'écriture prescrit (§3/§5 du plan) : TROIS racines nommées,
	 * jamais un spread de `dossier` — seul `monde.personnages` change,
	 * `canon`/`charpente` traversent intacts. `personnageId` est le personnage
	 * EN CAUSE dans cette écriture (celui qu'on modifie, ou le nouveau
	 * personnage à l'ajout) — chaque appelant le nomme explicitement.
	 *
	 * `resout` (revue de PR — régression du correctif `handleAjouter`,
	 * symptôme de BUG-063) : `personnageId` porte DEUX RÔLES distincts —
	 * l'AFFICHAGE (sous quelle fiche le refus se montre, TOUJOURS actif) et
	 * l'INVALIDATION (quel succès l'efface, actif SEULEMENT si `resout`).
	 * `handleAjouter` indexe son refus d'ajout raté sur le personnage AFFICHÉ
	 * pour l'affichage (`personnageAffiche?.id ?? id`), mais un AJOUT NE
	 * RÉSOUT JAMAIS un refus — y compris quand il réussit et que l'entité
	 * affichée coïncide avec l'entité déjà en cause : ajouter un personnage
	 * ne corrige rien sur un AUTRE personnage. Sans cette séparation, un ajout
	 * RÉUSSI effaçait silencieusement un refus non résolu dès que l'entité
	 * affichée coïncidait avec l'entité en cause. Les chemins d'ÉDITION (blur,
	 * changement de camp/plan/objectif) gardent `resout: true` (défaut) : eux
	 * RÉSOLVENT légitimement — un succès sur l'entité déjà en cause efface
	 * bien son propre refus.
	 */
	function commit(
		personnages: Personnage[],
		personnageId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, personnages },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { personnageId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { personnageId, statut: 'absent', issues: [] }
			// Écriture réussie. Un AJOUT (`resout: false`) ne résout JAMAIS un
			// refus, quelle que soit l'entité qu'il touche pour l'affichage.
			if (!resout) return refusPrecedent
			// Un commit réussi n'efface le refus que s'il touche le MÊME personnage
			// que celui déjà en cause (BUG-056/061/063) : un succès sur un AUTRE
			// personnage ne doit jamais faire disparaître un refus non résolu.
			return refusPrecedent !== null && refusPrecedent.personnageId !== personnageId ? refusPrecedent : null
		})
		return resultat
	}

	function handleAjouter(): void {
		const id = frapperIdentifiant('pnj')
		// camp ET nom absents (jamais `''`/`undefined` explicite) — critère #1 du
		// plan d'itération 1 : « camp et nom absents », `portee` au plancher du
		// schéma (`PORTEE_INITIALE`, jamais un choix d'auteur, KR-191/§8 désaccord 7).
		const nouveau: Personnage = { id, portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }
		/**
		 * Le refus d'un ajout raté s'indexe sur le personnage AFFICHÉ
		 * (`personnageAffiche?.id`), JAMAIS sur `id` — l'identifiant tout juste
		 * frappé n'entre dans le document QUE si l'écriture réussit, donc
		 * l'indexer avant succès produirait un refus qu'AUCUNE ligne ne peut
		 * jamais afficher (`refusAffiche` filtre sur un id déjà présent dans la
		 * liste) tout en ÉVINÇANT en silence un refus déjà affiché sur un autre
		 * personnage. `resout: false` : un ajout, réussi ou non, ne résout
		 * JAMAIS un refus (voir `commit`) — un ajout ne corrige rien sur un
		 * AUTRE personnage, même quand `personnageAffiche` coïncide avec lui.
		 */
		const resultat = commit([...dossierActuel.monde.personnages, nouveau], personnageAffiche?.id ?? id, {
			resout: false,
		})
		// Structurellement inatteignable : un identifiant frappé est bien formé et
		// jamais dupliqué (entropie de `randomToken()`) — garde défensive, même
		// patron que `PanneauLieux.handleAjouter`.
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
	}

	// Garde d'absence en MUTATION (BUG-058, patron `PanneauLieux`/`ObjectifsCanon`) :
	// un brouillon peut manquer pour un personnage arrivé hors de `handleAjouter`
	// (ex. réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: ChampTexte, valeur: string): void {
		setBrouillons((prev) => {
			const actuel = prev[id]
			if (actuel !== undefined) return { ...prev, [id]: { ...actuel, [champ]: valeur } }
			const personnage = dossierActuel.monde.personnages.find((p) => p.id === id)
			if (personnage === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(personnage), [champ]: valeur } }
		})
	}

	/**
	 * Un champ laissé VIDE n'écrit AUCUNE clé (même idiome que `objectif_id`,
	 * compte rendu du lot contrat, note 1) : `delete` plutôt que de committer
	 * une chaîne vide — un `{...p}` destructurant laisserait une variable
	 * inutilisée (`no-unused-vars`, aucune option `ignoreRestSiblings` déclarée
	 * pour ce lot).
	 */
	function handleBlurChamp(id: string, champ: ChampTexte, valeur: string): void {
		commit(
			dossierActuel.monde.personnages.map((p): Personnage => {
				if (p.id !== id) return p
				if (valeur === '') {
					const sansChamp: Personnage = { ...p }
					delete sansChamp[champ]
					return sansChamp
				}
				return { ...p, [champ]: valeur }
			}),
			id,
		)
	}

	function handleChangeCamp(id: string, camp: CampPersonnage): void {
		commit(
			dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, camp } : p)),
			id,
		)
	}

	function handleChangePortee(id: string, portee: Portee): void {
		commit(
			dossierActuel.monde.personnages.map((p) => (p.id === id ? { ...p, portee } : p)),
			id,
		)
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
					const sansObjectif: Personnage = { ...p }
					delete sansObjectif.objectif_id
					return sansObjectif
				}
				return { ...p, objectif_id: objectifId }
			}),
			id,
		)
	}

	// Repli PAR CHAMP, jamais par objet (§5 du plan, BUG-058 côté lecture) : un
	// objet brouillon présent mais incomplet (clé arrivée après le montage,
	// réconciliation cloud) doit encore retomber sur le document, champ par champ
	// — un repli par objet entier afficherait vide alors que le document porte
	// une valeur, et le blur suivant réécrirait ce vide.
	function brouillonActuel(personnage: Personnage): BrouillonPersonnage {
		const brouillon = brouillons[personnage.id]
		return {
			nom: brouillon?.nom ?? personnage.nom ?? '',
			fonction: brouillon?.fonction ?? personnage.fonction ?? '',
			apparence: brouillon?.apparence ?? personnage.apparence ?? '',
			description_joueur: brouillon?.description_joueur ?? personnage.description_joueur ?? '',
		}
	}

	// Équivalent exact de `dossier.monde.personnages.length === 0` (voir le
	// calcul de `personnageAffiche` plus haut) — mais brancher sur LA MÊME
	// valeur que le reste de la fonction utilise donne à TypeScript le
	// rétrécissement `Personnage` (non `| undefined`) pour tout ce qui suit,
	// sans assertion `!`.
	if (personnageAffiche === undefined) {
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

	// Le refus ne se rend QUE sous la fiche du personnage qui l'a produit —
	// changer de sélection ne doit jamais laisser le bandeau attaché au mauvais
	// personnage (KR-197, affichage).
	const refusAffiche =
		refus !== null && refus.personnageId === personnageAffiche.id
			? { statut: refus.statut, issues: refus.issues }
			: null

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
					brouillon={brouillonActuel(personnageAffiche)}
					objectifsCanon={dossier.canon.objectifs}
					refus={refusAffiche}
					onChangeChamp={(champ, valeur) => handleChangeChamp(personnageAffiche.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(personnageAffiche.id, champ, valeur)}
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
