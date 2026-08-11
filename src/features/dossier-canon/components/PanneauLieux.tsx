import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	type Lieu,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheLieu, type BrouillonLieu } from './FicheLieu'

/**
 * Le refus en cours, indexé par le lieu dont l'écriture l'a produit — sans cet
 * index, changer de sélection après un refus laisse le bandeau affiché sous
 * la fiche d'un AUTRE lieu, qui n'a rien vu refuser (revue de PR, tour 1,
 * même famille que BUG-056, dossier-canon it1). `FicheLieu` ne connaît que
 * `{ issues }` : le filtrage par id reste ici, seul endroit qui connaît la
 * sélection courante.
 */
interface RefusEnCours {
	lieuId: string
	issues: DossierIssue[]
}

export interface PanneauLieuxProps {
	dossierId: string
}

function brouillonDe(lieu: Lieu): BrouillonLieu {
	return {
		nom: lieu.nom ?? '',
		description: lieu.description ?? '',
		ambiance: lieu.ambiance ?? '',
		dangers: lieu.dangers ?? '',
	}
}

const EYEBROW_SECTION = 'LIEUX'
const TEXTE_VIDE = 'Aucun lieu — cliquez « + Ajouter un lieu… » pour commencer.'

/**
 * Le panneau Lieux — la liste des décors du monde (`monde.lieux[]`), écrite
 * par le même `DossierService.update()` que Canon/Départ/Objectifs, avec un
 * patch ÉTROIT : `canon`/`charpente` traversent intacts (§6, critère #7 du
 * plan d'itération 4). La fiche du lieu sélectionné est rendue par
 * `FicheLieu.tsx` (§5 du plan, extraction KR-112 : ce fichier dépassait
 * ~350 lignes) — ce composant-ci reste seul propriétaire de `dossierId`, du
 * brouillon, de la sélection et de l'écriture.
 *
 * Layout à deux colonnes, PREMIER de la feature : une liste `ListRow`
 * sélectionnable à gauche, la fiche du lieu courant à droite. La sélection est
 * un `useState<string | null>` local, jamais resynchronisé par effet — le lieu
 * AFFICHÉ est calculé en ligne (`lieux.find(...) ?? lieux[0]`), ce qui réalise
 * à la fois « aucun useEffect de resynchronisation » (KR-013/113) ET
 * « sélection par défaut au montage : le premier lieu » sans jamais écrire
 * l'id du premier lieu dans l'état au montage.
 *
 * Retrait IMMÉDIAT, sans `Modal` (désaccord #1 du plan) : le seul cas
 * dangereux — retirer le lieu de `charpente.depart.lieu_id` — est déjà bloqué
 * par le SSOT (`reference-pendante`), jamais par un prédicat feature qui
 * comparerait `lieu.id` à `dossier.charpente.depart.lieu_id` en pré-vol.
 *
 * Le FOCUS qui suit un ajout (champ Nom) ou un retrait réussi (bouton
 * retirer de la fiche nouvellement affichée) est un déplacement DOM impératif,
 * pas un miroir d'état — usage légitime de `useEffect` (KR-013 : subscriptions,
 * API DOM impérative), même famille que `ImportDossierDialog.tsx`
 * (`dossier-format`).
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauLieux({ dossierId }: PanneauLieuxProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonLieu>>(() =>
		dossier === null ? {} : Object.fromEntries(dossier.monde.lieux.map((lieu) => [lieu.id, brouillonDe(lieu)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | 'retirer' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)
	const panneauRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (intentionFocus === 'nom') {
			nomInputRef.current?.focus()
		} else if (intentionFocus === 'retirer') {
			panneauRef.current?.querySelector<HTMLButtonElement>('button[aria-label^="Retirer le lieu"]')?.focus()
		}
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null
	// Même idiome que `PanneauCanon.tsx`/`ObjectifsCanon.tsx` : capter une valeur
	// non nulle une fois évite un `as`/`!` répété dans chaque gestionnaire.
	const dossierActuel: typeof dossier = dossier

	/**
	 * L'idiome d'écriture prescrit (§5 du plan) : TROIS racines nommées, jamais
	 * un spread de `dossier` — seul `monde.lieux` change, `canon`/`charpente`
	 * traversent intacts.
	 */
	function commit(lieux: Lieu[], lieuId: string): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, lieux },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { lieuId, issues: resultat.errors }
			// Un commit réussi n'efface le bandeau que s'il touche le MÊME lieu que
			// celui déjà en cause (BUG-056, dossier-canon it1) : un succès sur un
			// AUTRE lieu ne doit jamais faire disparaître un refus non résolu.
			return refusPrecedent !== null && refusPrecedent.lieuId !== lieuId ? refusPrecedent : null
		})
		return resultat
	}

	function handleAjouter(): void {
		const id = frapperIdentifiant('lieu')
		const nouveau: Lieu = { id }
		const resultat = commit([...dossierActuel.monde.lieux, nouveau], id)
		// Structurellement inatteignable : un identifiant frappé est bien formé et
		// jamais dupliqué (entropie de `randomToken()`).
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	function handleRetirer(id: string): void {
		const index = dossierActuel.monde.lieux.findIndex((lieu) => lieu.id === id)
		if (index === -1) return
		const resultat = commit(
			dossierActuel.monde.lieux.filter((lieu) => lieu.id !== id),
			id,
		)
		// Refusé (lieu de `charpente.depart`) : rien n'est persisté, la liste et la
		// sélection restent celles d'avant — aucun retrait optimiste (critère #4).
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
		const restants = resultat.dossier.monde.lieux
		// Le lieu d'`index - 1`, ou le premier restant si l'élément retiré était en
		// tête — `restants[Math.max(index - 1, 0)]` réalise les DEUX cas d'un coup :
		// retirer en tête (`index === 0`) décale tout le monde d'un cran, donc
		// `restants[0]` EST déjà « le premier restant » ; retirer ailleurs laisse la
		// position `index - 1` inchangée, donc `restants[index - 1]` EST déjà « le
		// lieu précédent ».
		setSelection(restants.length === 0 ? null : restants[Math.max(index - 1, 0)].id)
		setIntentionFocus('retirer')
	}

	// Garde d'absence en LECTURE et en MUTATION (BUG-058, patron `ObjectifsCanon.tsx`) :
	// un brouillon peut manquer pour un lieu arrivé hors de `handleAjouter` (ex.
	// réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonLieu, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const lieu = dossierActuel.monde.lieux.find((l) => l.id === id)
			if (lieu === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(lieu), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonLieu, valeur: string): void {
		commit(
			dossierActuel.monde.lieux.map((lieu) => (lieu.id === id ? { ...lieu, [champ]: valeur } : lieu)),
			id,
		)
	}

	if (dossier.monde.lieux.length === 0) {
		// Cas défensif, non normalement atteignable : `charpente.depart.lieu_id`
		// doit toujours résoudre un lieu existant pour qu'un dossier soit lisible
		// (`DossierService.get()` re-valide et rend `null` sinon) — gabarit dashed
		// identique à `PanneauSection` (`bascule-editeur`).
		return (
			<div style={pageStyle}>
				<div style={emptyStateStyle}>
					<span style={emptyGlyphStyle} aria-hidden="true">
						❏
					</span>
					<p style={emptyTextStyle}>{TEXTE_VIDE}</p>
				</div>
			</div>
		)
	}

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, et retombe sur le premier lieu tant qu'aucune sélection
	// explicite n'a été posée (montage, ou sélection devenue caduque).
	const lieuAffiche = dossier.monde.lieux.find((lieu) => lieu.id === selection) ?? dossier.monde.lieux[0]
	const brouillon = brouillons[lieuAffiche.id] ?? brouillonDe(lieuAffiche)
	const indexAffiche = dossier.monde.lieux.findIndex((lieu) => lieu.id === lieuAffiche.id)
	// Le refus ne se rend QUE sous la fiche du lieu qui l'a produit — changer de
	// sélection ne doit jamais laisser le bandeau attaché au mauvais lieu.
	const refusAffiche = refus !== null && refus.lieuId === lieuAffiche.id ? { issues: refus.issues } : null

	return (
		<div style={pageStyle} ref={panneauRef}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<div style={listeStyle}>
					{dossier.monde.lieux.map((lieu, index) => (
						<ListRow
							key={lieu.id}
							title={localiserEntite('lieu', lieu, index)}
							subtitle={lieu.id}
							selected={lieu.id === lieuAffiche.id}
							onSelect={() => setSelection(lieu.id)}
						/>
					))}
				</div>
				<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter un lieu…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FicheLieu
					lieu={lieuAffiche}
					index={indexAffiche}
					brouillon={brouillon}
					refus={refusAffiche}
					nomInputRef={nomInputRef}
					onChangeChamp={(champ, valeur) => handleChangeChamp(lieuAffiche.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(lieuAffiche.id, champ, valeur)}
					onRetirer={() => handleRetirer(lieuAffiche.id)}
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
