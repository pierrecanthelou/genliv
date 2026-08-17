import { useEffect, useRef, useState } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	IconButton,
	HIT_TARGET_MIN,
	type Indice,
	type EcritureDossier,
	type DossierIssue,
} from '../../../brain'
import { FicheIndice, type BrouillonIndice } from './FicheIndice'
import {
	pageStyle,
	colonneListeStyle,
	colonneFicheStyle,
	eyebrowStyle,
	listeStyle,
	ligneListeStyle,
	ligneListRowStyle,
	boutonAjouterStyle,
	emptyStateStyle,
	emptyGlyphStyle,
	emptyTextStyle,
} from './styles'

export interface PanneauIndicesProps {
	dossierId: string
}

function brouillonDe(indice: Indice): BrouillonIndice {
	return {
		nom: indice.nom ?? '',
		verite: indice.verite ?? '',
		formulation_joueur: indice.formulation_joueur ?? '',
	}
}

/**
 * Le refus en cours, indexé par l'indice dont l'écriture l'a produit — même
 * garde que `PanneauObjets.tsx` (KR-197) : changer de sélection après un
 * refus laisse le bandeau affiché sous la fiche d'un AUTRE indice, qui n'a
 * rien vu refuser. `FicheIndice` ne connaît que `{ statut, issues }` : le
 * filtrage par id reste ici, seul endroit qui connaît la sélection courante.
 */
interface RefusEnCours {
	indiceId: string
	statut: 'absent' | 'refuse'
	issues: DossierIssue[]
}

const EYEBROW_SECTION = 'INDICES'
const TEXTE_VIDE = 'Aucun indice — cliquez « + Ajouter un indice… » pour commencer.'

/** Le libellé du bouton Monter — le titre entre guillemets, ou le repli numéroté. */
function libelleMonter(indice: Indice, index: number): string {
	const nom = indice.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter l'indice « ${nom.trim()} »`
	return `Monter l'indice n°${index + 1} (sans nom)`
}

/** Le libellé du bouton Descendre — symétrique de `libelleMonter`. */
function libelleDescendre(indice: Indice, index: number): string {
	const nom = indice.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre l'indice « ${nom.trim()} »`
	return `Descendre l'indice n°${index + 1} (sans nom)`
}

/**
 * Le panneau Indices — la liste du registre d'indices du monde
 * (`monde.indices[]`), écrite par le même `DossierService.update()` que
 * Canon/Départ/Personnages/Lieux/Objets, avec un patch ÉTROIT :
 * `canon`/`charpente` traversent intacts. Précédent direct `PanneauObjets.tsx`
 * (dossier-objets) : layout à deux colonnes, sélection par défaut (le premier
 * indice) calculée EN LIGNE (`indices.find(...) ?? indices[0]`), jamais un
 * `useEffect` de resynchronisation (KR-013/113).
 *
 * RÉORDONNANCEMENT — composé ENTIÈREMENT par cette feature (précédent
 * `dossier-objets`, désaccord 3 de son plan d'itération 1) : deux `IconButton`
 * Monter/Descendre en FRÈRES de `ListRow` dans le `<li>` qui les entoure,
 * jamais une prop ajoutée à `ListRow.tsx`. `deplacer(id, sens)` permute
 * `monde.indices` PAR IDENTIFIANT, jamais par position, et appelle le même
 * `commit()` que les autres champs — la sélection reste indexée par id, donc
 * la fiche affichée reste celle du MÊME indice après une permutation. Aux
 * bornes de la liste, le bouton correspondant est OMIS, jamais rendu
 * `disabled`.
 *
 * « MÈNE À » — les trois gestes (ajouter/changer/retirer un lien) commettent
 * TOUJOURS sur l'indice AFFICHÉ (`indiceAffiche.id`), jamais sur un id passé
 * en argument : `FicheIndice` est un composant purement de rendu, elle ne
 * connaît pas `dossierId`.
 *
 * AUCUN RETRAIT DE FICHE cette itération (hors périmètre, §2 du plan) : pas
 * de modale, pas de `RetirerXDialog`, contrairement au précédent
 * `PanneauObjets.tsx` (it2 de sa propre feature).
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauIndices({ dossierId }: PanneauIndicesProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const indices = dossier?.monde.indices ?? []
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonIndice>>(() =>
		Object.fromEntries(indices.map((indice) => [indice.id, brouillonDe(indice)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [refus, setRefus] = useState<RefusEnCours | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur le premier indice tant qu'aucune
	// sélection explicite n'a été posée — `undefined` seulement quand la liste
	// est vide.
	const indiceAffiche = indices.find((indice) => indice.id === selection) ?? indices[0]

	useEffect(() => {
		if (intentionFocus === 'nom') nomInputRef.current?.focus()
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null

	/**
	 * L'idiome d'écriture : TROIS racines nommées, jamais un spread de
	 * `dossier` — seul `monde.indices` change, `canon`/`charpente` traversent
	 * intacts (même patron que `PanneauObjets.tsx`).
	 *
	 * `resout` (même discipline que `PanneauObjets.tsx`) : `indiceId` porte
	 * DEUX RÔLES distincts — l'AFFICHAGE (sous quelle fiche le refus se
	 * montre, TOUJOURS actif) et l'INVALIDATION (quel succès l'efface, actif
	 * SEULEMENT si `resout`). Un AJOUT n'efface JAMAIS un refus, même quand il
	 * réussit et que l'entité affichée coïncide avec l'entité déjà en cause.
	 */
	function commit(
		indicesSuivants: Indice[],
		indiceId: string,
		{ resout }: { resout: boolean } = { resout: true },
	): EcritureDossier {
		const resultat = dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, indices: indicesSuivants },
			charpente: d.charpente,
		}))
		setRefus((refusPrecedent) => {
			if (resultat.statut === 'refuse') return { indiceId, statut: 'refuse', issues: resultat.errors }
			if (resultat.statut === 'absent') return { indiceId, statut: 'absent', issues: [] }
			if (!resout) return refusPrecedent
			return refusPrecedent !== null && refusPrecedent.indiceId !== indiceId ? refusPrecedent : null
		})
		return resultat
	}

	function handleAjouter(): void {
		const id = frapperIdentifiant('indice')
		const nouveau: Indice = { id }
		// Indexé sur l'indice AFFICHÉ (`indiceAffiche?.id`), jamais sur `id` —
		// celui-ci n'entre dans le document QUE si l'écriture réussit.
		// `resout: false` : un ajout, réussi ou non, ne résout JAMAIS un refus.
		const resultat = commit([...indices, nouveau], indiceAffiche?.id ?? id, { resout: false })
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	// Garde d'absence en LECTURE et en MUTATION (patron `PanneauObjets.tsx`) :
	// un brouillon peut manquer pour un indice arrivé hors de `handleAjouter`
	// (ex. réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonIndice, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const indice = indices.find((i) => i.id === id)
			if (indice === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(indice), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonIndice, valeur: string): void {
		commit(
			indices.map((indice) => (indice.id === id ? { ...indice, [champ]: valeur } : indice)),
			id,
		)
	}

	/**
	 * Permute deux indices ADJACENTS par IDENTIFIANT, jamais par position — la
	 * sélection (indexée par id) n'a donc rien à recalculer après l'écriture :
	 * la fiche affichée reste celle du même indice.
	 */
	function deplacer(id: string, sens: -1 | 1): void {
		const index = indices.findIndex((indice) => indice.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= indices.length) return
		const permutes = [...indices]
		;[permutes[index], permutes[cible]] = [permutes[cible], permutes[index]]
		commit(permutes, id)
	}

	/** Remplace `mene_a` de l'indice `id` — les trois gestes de la section
	 *  « MÈNE À » partagent cette seule écriture. */
	function commitMeneA(id: string, meneA: string[]): void {
		commit(
			indices.map((indice) => (indice.id === id ? { ...indice, mene_a: meneA } : indice)),
			id,
		)
	}

	function handleAjouterLien(id: string, cibleId: string): void {
		if (cibleId === '') return
		const indice = indices.find((i) => i.id === id)
		commitMeneA(id, [...(indice?.mene_a ?? []), cibleId])
	}

	function handleChangerLien(id: string, rang: number, cibleId: string): void {
		const indice = indices.find((i) => i.id === id)
		const meneA = (indice?.mene_a ?? []).map((valeur, i) => (i === rang ? cibleId : valeur))
		commitMeneA(id, meneA)
	}

	function handleRetirerLien(id: string, rang: number): void {
		const indice = indices.find((i) => i.id === id)
		const meneA = (indice?.mene_a ?? []).filter((_, i) => i !== rang)
		commitMeneA(id, meneA)
	}

	// Équivalent exact de `dossier.monde.indices.length === 0` (voir le calcul
	// de `indiceAffiche` plus haut), mais brancher sur LA MÊME valeur donne à
	// TypeScript le rétrécissement `Indice` (non `| undefined`) pour la suite,
	// sans assertion `!`. `monde.indices` DÉMARRE VIDE à la création d'un
	// dossier (`construireAmorce`, même contrat que `monde.objets`) : cette
	// branche est donc l'état RÉEL d'un dossier neuf, pas un cas défensif — le
	// bouton « + Ajouter un indice… » doit y rester accessible.
	if (indiceAffiche === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un indice…
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

	// Le refus ne se rend QUE sous la fiche de l'indice qui l'a produit —
	// changer de sélection ne doit jamais laisser le bandeau attaché au
	// mauvais indice.
	const refusAffiche =
		refus !== null && refus.indiceId === indiceAffiche.id ? { statut: refus.statut, issues: refus.issues } : null

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<ul style={listeStyle}>
					{indices.map((indice, index) => (
						<li key={indice.id} style={ligneListeStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('indice', indice, index)}
									subtitle={indice.id}
									selected={indice.id === indiceAffiche.id}
									onSelect={() => setSelection(indice.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonter(indice, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(indice.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < indices.length - 1 && (
								<IconButton
									label={libelleDescendre(indice, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(indice.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
				</ul>
				<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter un indice…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FicheIndice
					indice={indiceAffiche}
					indices={indices}
					brouillon={brouillons[indiceAffiche.id] ?? brouillonDe(indiceAffiche)}
					refus={refusAffiche}
					nomInputRef={nomInputRef}
					onChangeChamp={(champ, valeur) => handleChangeChamp(indiceAffiche.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(indiceAffiche.id, champ, valeur)}
					onAjouterLien={(cibleId) => handleAjouterLien(indiceAffiche.id, cibleId)}
					onChangerLien={(rang, cibleId) => handleChangerLien(indiceAffiche.id, rang, cibleId)}
					onRetirerLien={(rang) => handleRetirerLien(indiceAffiche.id, rang)}
				/>
			</div>
		</div>
	)
}
