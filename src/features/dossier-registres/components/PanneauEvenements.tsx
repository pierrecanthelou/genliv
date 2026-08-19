import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	IconButton,
	SegmentedControl,
	HIT_TARGET_MIN,
	type Evenement,
	type Entite,
	type EspaceDeNoms,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheEvenement, type BrouillonEvenement } from './FicheEvenement'
import { useEcritureResolutions } from '../hooks/useEcritureResolutions'
import {
	panneauRacineStyle,
	enTetePanneauStyle,
	pageStyle,
	colonneListeStyle,
	colonneFicheStyle,
	eyebrowStyle,
	legendeStyle,
	listeStyle,
	ligneListeStyle,
	ligneListRowStyle,
	boutonAjouterStyle,
	emptyStateStyle,
	emptyGlyphStyle,
	emptyTextStyle,
} from './styles'

export interface PanneauEvenementsProps {
	dossierId: string
}

/** Le FILTRE d'affichage — une seule collection, `monde.evenements`, jamais
 *  deux (§3 du plan d'itération 4, contrairement au `SegmentedControl` de
 *  `PanneauJalonsFins.tsx`, qui BASCULE entre deux collections). */
type FiltreEvenements = 'lies' | 'libres'

function brouillonDe(evenement: Evenement): BrouillonEvenement {
	return {
		nom: evenement.nom ?? '',
		declencheur_texte: evenement.declencheur_texte ?? '',
	}
}

/**
 * Le refus en cours, indexé par l'événement dont l'écriture l'a produit — même
 * garde que `RefusEnCours` de `PanneauQuetes.tsx` (KR-197) : changer de
 * sélection après un refus laisse le bandeau affiché sous la fiche d'un AUTRE
 * événement, qui n'a rien vu refuser.
 */
interface RefusEnCours {
	evenementId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const EYEBROW_SECTION = 'ÉVÉNEMENTS'
const OPTIONS_FILTRE: { value: FiltreEvenements; label: string }[] = [
	{ value: 'lies', label: 'LIÉS À LA TRAME' },
	{ value: 'libres', label: 'LIBRES' },
]
const TEXTE_VIDE_LIES = 'Aucun événement lié à la trame — cliquez « + Ajouter un événement… » pour commencer.'
const TEXTE_VIDE_LIBRES = 'Aucun événement libre — cliquez « + Ajouter un événement… » pour commencer.'

/** `lie_a_histoire` absent SE LIT comme libre (compat des documents déjà
 *  persistés, précédent `relations[].secret`) — c'est le SEUL filtre du
 *  registre (§4 du contrat `Evenement`, lot 1). */
function estLieALaTrame(evenement: Evenement): boolean {
	return evenement.lie_a_histoire === true
}

/** Le texte du compteur — littéral `(s)`, précédent exact
 *  `PlayerModal.tsx` (`avertissement(s) détecté(s)`), jamais un calcul
 *  singulier/pluriel grammatical. */
function texteCompteur(filtre: FiltreEvenements, n: number): string {
	return filtre === 'lies' ? `${n} événement(s) lié(s) à la trame` : `${n} événement(s) libre(s)`
}

function libelleMonter(evenement: Evenement, index: number): string {
	const nom = evenement.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter l'événement « ${nom.trim()} »`
	return `Monter l'événement n°${index + 1} (sans nom)`
}
function libelleDescendre(evenement: Evenement, index: number): string {
	const nom = evenement.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre l'événement « ${nom.trim()} »`
	return `Descendre l'événement n°${index + 1} (sans nom)`
}

/**
 * Le panneau Événements — précédent direct `PanneauJalonsFins.tsx` pour la
 * coquille à `SegmentedControl` (eyebrow + `role="radiogroup"` en en-tête fixe,
 * corps scrollable) et `PanneauQuetes.tsx` pour l'anatomie liste/fiche et le
 * réordonnancement. Ce qui lui est PROPRE :
 *
 *  · UN FILTRE, PAS UNE BASCULE (§3 du plan) : `SegmentedControl` pilote
 *    `lie_a_histoire === true` vs `!== true` sur LA MÊME collection
 *    `monde.evenements` — une seule sélection, un seul jeu de brouillons, un
 *    seul compteur, tous DÉRIVÉS du sous-ensemble filtré affiché.
 *  · SÉLECTION PAR IDENTIFIANT (contrainte dure n°1) : au changement de
 *    filtre, si la fiche affichée sort du sous-ensemble, la sélection retombe
 *    SUR LE RENDU (`filtres.find(...) ?? filtres[0]`, aucun `useEffect` de
 *    resynchronisation, KR-013).
 *  · CRÉATION IMMÉDIATE (contrainte dure n°2) : `lie_a_histoire` est TOUJOURS
 *    posé explicitement à la valeur du filtre actif, jamais `undefined` — sans
 *    quoi l'événement créé n'apparaîtrait pas dans l'onglet où il vient de
 *    naître.
 *  · MONTER/DESCENDRE (contrainte dure n°3) : les voisins sont ceux du
 *    SOUS-ENSEMBLE FILTRÉ affiché ; la permutation, elle, s'applique aux index
 *    RÉELS de `evenements[]`, traduits ICI, jamais dans le hook.
 *  · RÉSOLUTIONS — délégué à `useEcritureResolutions` (hook local, réimplémenté
 *    du motif `useEcritureEtapes.ts`) : ce panneau lui fournit `commit` (le
 *    MÊME que pour les autres champs, un seul bandeau de refus) et lui lit les
 *    résolutions rendues, le jeton de remontage et les gestes en retour.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauEvenements({ dossierId }: PanneauEvenementsProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const evenements = dossier?.monde.evenements ?? []
	const objets = dossier?.monde.objets ?? []
	const indices = dossier?.monde.indices ?? []
	const jalons = dossier?.charpente.jalons ?? []

	const [filtre, setFiltre] = useState<FiltreEvenements>('lies')
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonEvenement>>(() =>
		Object.fromEntries(evenements.map((ev) => [ev.id, brouillonDe(ev)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)

	// FILTRE d'une seule collection (§3 du plan) — jamais une seconde collection.
	const filtres = evenements.filter((ev) => (filtre === 'lies' ? estLieALaTrame(ev) : !estLieALaTrame(ev)))

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante DANS LE SOUS-ENSEMBLE FILTRÉ, retombe sur sa première
	// ligne si la sélection en est sortie — `undefined` seulement quand ce
	// sous-ensemble est vide.
	const evenementAffiche = filtres.find((ev) => ev.id === selection) ?? filtres[0]

	/**
	 * L'idiome d'écriture : TROIS racines nommées, jamais un spread de
	 * `dossier` — seul `monde.evenements` change, `canon`/`charpente`
	 * traversent intacts (même patron que `PanneauQuetes.tsx`).
	 */
	function commit(
		evenementsSuivants: Evenement[],
		evenementId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, evenements: evenementsSuivants },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { evenementId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { evenementId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && refusPrecedent.evenementId !== evenementId ? refusPrecedent : null
		})
		return resultat
	}

	const ecritureResolutions = useEcritureResolutions(dossier === null ? null : { evenements, evenementAffiche, commit })

	useEffect(() => {
		if (intentionFocus === 'nom') nomInputRef.current?.focus()
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null

	function handleAjouter(): void {
		const id = frapperIdentifiant('evenement')
		// TOUJOURS explicite (contrainte dure n°2) — jamais `undefined`.
		const nouveau: Evenement = { id, resolutions: [], lie_a_histoire: filtre === 'lies' }
		// Indexé sur l'événement AFFICHÉ (`evenementAffiche?.id`), jamais sur `id`
		// — celui-ci n'entre dans le document QUE si l'écriture réussit.
		const resultat = commit([...evenements, nouveau], evenementAffiche?.id ?? id, { resout: false })
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	// Garde d'absence en LECTURE et en MUTATION (patron `PanneauQuetes.tsx`) :
	// un brouillon peut manquer pour un événement arrivé hors de `handleAjouter`
	// (ex. réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonEvenement, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const evenement = evenements.find((ev) => ev.id === id)
			if (evenement === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(evenement), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonEvenement, valeur: string): void {
		commit(
			evenements.map((ev) => (ev.id === id ? { ...ev, [champ]: valeur } : ev)),
			id,
		)
	}

	/** `''` = retrait — remet `monstre_ref` à `undefined`, jamais `null`
	 *  (précédent `donneur_id`, `FicheQuete.tsx`). */
	function handleChangeMonstre(id: string, monstreRef: string): void {
		commit(
			evenements.map((ev): Evenement => {
				if (ev.id !== id) return ev
				if (monstreRef === '') {
					const sansMonstre = { ...ev }
					delete sansMonstre.monstre_ref
					return sansMonstre
				}
				return { ...ev, monstre_ref: monstreRef }
			}),
			id,
		)
	}

	/**
	 * Permute deux événements VOISINS DU SOUS-ENSEMBLE FILTRÉ affiché
	 * (contrainte dure n°3), traduits vers leurs index RÉELS dans
	 * `evenements[]` — jamais par position brute dans le tableau complet.
	 */
	function deplacer(id: string, sens: -1 | 1): void {
		const indexFiltre = filtres.findIndex((ev) => ev.id === id)
		const indexVoisinFiltre = indexFiltre + sens
		if (indexFiltre === -1 || indexVoisinFiltre < 0 || indexVoisinFiltre >= filtres.length) return
		const voisinId = filtres[indexVoisinFiltre].id
		const indexReel = evenements.findIndex((ev) => ev.id === id)
		const indexVoisinReel = evenements.findIndex((ev) => ev.id === voisinId)
		if (indexReel === -1 || indexVoisinReel === -1) return
		const permutes = [...evenements]
		;[permutes[indexReel], permutes[indexVoisinReel]] = [permutes[indexVoisinReel], permutes[indexReel]]
		commit(permutes, id)
	}

	// Équivalent exact de « le sous-ensemble filtré est vide », mais brancher
	// sur LA MÊME valeur donne à TypeScript le rétrécissement `Evenement` (non
	// `| undefined`) pour la suite, sans assertion `!`.
	if (evenementAffiche === undefined) {
		return (
			<div style={panneauRacineStyle}>
				<div style={enTetePanneauStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<SegmentedControl<FiltreEvenements>
						options={OPTIONS_FILTRE}
						value={filtre}
						onChange={setFiltre}
						ariaLabel="Filtre des événements — liés à la trame ou libres"
					/>
				</div>
				<div style={pageStyle}>
					<div style={colonneListeStyle}>
						<p style={legendeStyle}>{texteCompteur(filtre, 0)}</p>
						<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
							+ Ajouter un événement…
						</button>
					</div>
					<div style={colonneFicheStyle}>
						<div style={emptyStateStyle}>
							<span style={emptyGlyphStyle} aria-hidden="true">
								❏
							</span>
							<p style={emptyTextStyle}>{filtre === 'lies' ? TEXTE_VIDE_LIES : TEXTE_VIDE_LIBRES}</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	const refusAffiche =
		refus !== null && refus.evenementId === evenementAffiche.id ? { statut: refus.statut, issues: refus.issues } : null

	// Les espaces de noms référencés par au moins un `DELTAS[...].refKinds`
	// aujourd'hui (`objet`, `indice`, `jalon`) — voir `EditeurEffets`.
	const entitesParEspace: Partial<Record<EspaceDeNoms, Entite[]>> = {
		objet: objets,
		indice: indices,
		jalon: jalons,
	}

	return (
		<div style={panneauRacineStyle}>
			<div style={enTetePanneauStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<SegmentedControl<FiltreEvenements>
					options={OPTIONS_FILTRE}
					value={filtre}
					onChange={setFiltre}
					ariaLabel="Filtre des événements — liés à la trame ou libres"
				/>
			</div>
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<p style={legendeStyle}>{texteCompteur(filtre, filtres.length)}</p>
					<ul style={listeStyle}>
						{filtres.map((evenement, index) => {
							const indexReel = evenements.findIndex((ev) => ev.id === evenement.id)
							return (
								<li key={evenement.id} style={ligneListeStyle}>
									<div style={ligneListRowStyle}>
										<ListRow
											title={localiserEntite('evenement', evenement, indexReel)}
											subtitle={evenement.id}
											selected={evenement.id === evenementAffiche.id}
											onSelect={() => setSelection(evenement.id)}
										/>
									</div>
									{index > 0 && (
										<IconButton
											label={libelleMonter(evenement, indexReel)}
											size={HIT_TARGET_MIN}
											onClick={() => deplacer(evenement.id, -1)}
										>
											▲
										</IconButton>
									)}
									{index < filtres.length - 1 && (
										<IconButton
											label={libelleDescendre(evenement, indexReel)}
											size={HIT_TARGET_MIN}
											onClick={() => deplacer(evenement.id, 1)}
										>
											▼
										</IconButton>
									)}
								</li>
							)
						})}
					</ul>
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un événement…
					</button>
				</div>

				<div style={colonneFicheStyle}>
					<FicheEvenement
						evenement={evenementAffiche}
						brouillon={brouillons[evenementAffiche.id] ?? brouillonDe(evenementAffiche)}
						resolutions={ecritureResolutions.resolutions}
						jetonDeRemontage={ecritureResolutions.jetonDeRemontage}
						entitesParEspace={entitesParEspace}
						refus={refusAffiche}
						nomInputRef={nomInputRef}
						onChangeChamp={(champ, valeur) => handleChangeChamp(evenementAffiche.id, champ, valeur)}
						onBlurChamp={(champ, valeur) => handleBlurChamp(evenementAffiche.id, champ, valeur)}
						onChangeMonstre={(monstreRef) => handleChangeMonstre(evenementAffiche.id, monstreRef)}
						onChangeResolution={ecritureResolutions.handleChangeResolution}
						onBlurResolution={ecritureResolutions.handleBlurResolution}
						onAjouterResolution={ecritureResolutions.handleAjouterResolution}
						onRetirerResolution={ecritureResolutions.handleRetirerResolution}
						onAjouterEffetResolution={ecritureResolutions.handleAjouterEffetResolution}
						onChangerCibleEffetResolution={ecritureResolutions.handleChangerCibleEffetResolution}
						onRetirerEffetResolution={ecritureResolutions.handleRetirerEffetResolution}
					/>
				</div>
			</div>
		</div>
	)
}
