import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
	useBrain,
	useOpenDossier,
	frapperIdentifiant,
	localiserEntite,
	ListRow,
	IconButton,
	HIT_TARGET_MIN,
	type Objet,
	type EcritureDossier,
} from '../../../brain'
import { FicheObjet, type BrouillonObjet } from './FicheObjet'

export interface PanneauObjetsProps {
	dossierId: string
}

function brouillonDe(objet: Objet): BrouillonObjet {
	return {
		nom: objet.nom ?? '',
		description_joueur: objet.description_joueur ?? '',
	}
}

const EYEBROW_SECTION = 'OBJETS'
const TEXTE_VIDE = 'Aucun objet — cliquez « + Ajouter un objet… » pour commencer.'

/** Le libellé du bouton Monter — le titre entre guillemets, ou le repli numéroté. */
function libelleMonter(objet: Objet, index: number): string {
	const nom = objet.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Monter l'objet « ${nom.trim()} »`
	return `Monter l'objet n°${index + 1} (sans nom)`
}

/** Le libellé du bouton Descendre — symétrique de `libelleMonter`. */
function libelleDescendre(objet: Objet, index: number): string {
	const nom = objet.nom
	if (typeof nom === 'string' && nom.trim() !== '') return `Descendre l'objet « ${nom.trim()} »`
	return `Descendre l'objet n°${index + 1} (sans nom)`
}

/**
 * Le panneau Objets — la liste du registre d'objets du monde (`monde.objets[]`),
 * écrite par le même `DossierService.update()` que Canon/Départ/Personnages/Lieux,
 * avec un patch ÉTROIT : `canon`/`charpente` traversent intacts. Précédent direct
 * `PanneauLieux.tsx` (dossier-canon it4) : layout à deux colonnes, sélection par
 * défaut (le premier objet) calculée EN LIGNE (`objets.find(...) ?? objets[0]`),
 * jamais un `useEffect` de resynchronisation (KR-013/113).
 *
 * RÉORDONNANCEMENT — composé ENTIÈREMENT par cette feature (§3 du plan
 * d'itération 1, désaccord 3) : deux `IconButton` Monter/Descendre en FRÈRES de
 * `ListRow` dans le `<li>` qui les entoure, jamais une prop ajoutée à
 * `ListRow.tsx` (inchangé, seul son docstring est corrigé). `deplacer(id, sens)`
 * permute `monde.objets` PAR IDENTIFIANT, jamais par position, et appelle le
 * même `commit()` que les autres champs — la sélection reste indexée par id,
 * donc la fiche affichée reste celle du MÊME objet après une permutation. Aux
 * bornes de la liste, le bouton correspondant est OMIS, jamais rendu `disabled`
 * (§8, désaccord 9 : aucune prop `disabled` ajoutée à `IconButton.tsx`).
 *
 * PAS de retrait en it1 (it2, réservée à la discrimination de référence) : ni
 * `Modal`, ni bandeau de refus, ni `IssueList` — `FicheObjet.tsx` ne porte que
 * les deux champs de prose.
 *
 * Le FOCUS qui suit un ajout (champ Nom) est un déplacement DOM impératif, pas
 * un miroir d'état — usage légitime de `useEffect` (KR-013), même patron que
 * `PanneauLieux.tsx`.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function PanneauObjets({ dossierId }: PanneauObjetsProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonObjet>>(() =>
		dossier === null ? {} : Object.fromEntries(dossier.monde.objets.map((objet) => [objet.id, brouillonDe(objet)])),
	)
	const [selection, setSelection] = useState<string | null>(null)
	const [intentionFocus, setIntentionFocus] = useState<'nom' | null>(null)
	const nomInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (intentionFocus === 'nom') {
			nomInputRef.current?.focus()
		}
		if (intentionFocus !== null) setIntentionFocus(null)
	}, [intentionFocus])

	if (dossier === null) return null
	// Même idiome que `PanneauLieux.tsx` : capter une valeur non nulle une fois
	// évite un `as`/`!` répété dans chaque gestionnaire.
	const dossierActuel: typeof dossier = dossier
	const objets = dossierActuel.monde.objets

	// Calculé EN LIGNE, jamais resynchronisé par effet (KR-013/113) : résout la
	// sélection courante, retombe sur le premier objet tant qu'aucune sélection
	// explicite n'a été posée — `undefined` seulement quand la liste est vide.
	const objetAffiche = objets.find((objet) => objet.id === selection) ?? objets[0]

	/**
	 * L'idiome d'écriture : TROIS racines nommées, jamais un spread de
	 * `dossier` — seul `monde.objets` change, `canon`/`charpente` traversent
	 * intacts (même patron que `PanneauLieux.tsx`).
	 */
	function commit(objetsSuivants: Objet[]): EcritureDossier {
		return dossiers.update(dossierId, (d) => ({
			canon: d.canon,
			monde: { ...d.monde, objets: objetsSuivants },
			charpente: d.charpente,
		}))
	}

	function handleAjouter(): void {
		const id = frapperIdentifiant('objet')
		const nouveau: Objet = { id }
		const resultat = commit([...objets, nouveau])
		// Structurellement inatteignable en it1 (aucune borne, aucun refus
		// possible sur un ajout d'objet nu) : garde défensive, même patron que
		// `PanneauLieux.tsx`.
		if (resultat.statut !== 'ecrit') return
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
		setSelection(id)
		setIntentionFocus('nom')
	}

	// Garde d'absence en LECTURE et en MUTATION (patron `PanneauLieux.tsx`) : un
	// brouillon peut manquer pour un objet arrivé hors de `handleAjouter` (ex.
	// réconciliation cloud pendant que le panneau est monté).
	function handleChangeChamp(id: string, champ: keyof BrouillonObjet, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const objet = objets.find((o) => o.id === id)
			if (objet === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(objet), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonObjet, valeur: string): void {
		commit(objets.map((objet) => (objet.id === id ? { ...objet, [champ]: valeur } : objet)))
	}

	/**
	 * Permute deux objets ADJACENTS par IDENTIFIANT, jamais par position — la
	 * sélection (indexée par id) n'a donc rien à recalculer après l'écriture :
	 * la fiche affichée reste celle du même objet (critère #4 du plan).
	 */
	function deplacer(id: string, sens: -1 | 1): void {
		const index = objets.findIndex((objet) => objet.id === id)
		const cible = index + sens
		if (index === -1 || cible < 0 || cible >= objets.length) return
		const permutes = [...objets]
		;[permutes[index], permutes[cible]] = [permutes[cible], permutes[index]]
		commit(permutes)
	}

	// Équivalent exact de `dossier.monde.objets.length === 0` (voir le calcul de
	// `objetAffiche` plus haut), mais brancher sur LA MÊME valeur donne à
	// TypeScript le rétrécissement `Objet` (non `| undefined`) pour la suite,
	// sans assertion `!`. Contrairement à `monde.lieux` (toujours semé avec
	// `lieu.amorce`), `monde.objets` DÉMARRE VIDE à la création d'un dossier
	// (`construireAmorce`) : cette branche est donc l'état RÉEL d'un dossier
	// neuf, pas un cas défensif — le bouton « + Ajouter un objet… » doit y
	// rester accessible (précédent `PanneauPersonnages.tsx`, même situation
	// avec `monde.personnages: []`).
	if (objetAffiche === undefined) {
		return (
			<div style={pageStyle}>
				<div style={colonneListeStyle}>
					<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un objet…
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

	const brouillon = brouillons[objetAffiche.id] ?? brouillonDe(objetAffiche)

	return (
		<div style={pageStyle}>
			<div style={colonneListeStyle}>
				<span style={eyebrowStyle}>{EYEBROW_SECTION}</span>
				<ul style={listeStyle}>
					{objets.map((objet, index) => (
						<li key={objet.id} style={ligneStyle}>
							<div style={ligneListRowStyle}>
								<ListRow
									title={localiserEntite('objet', objet, index)}
									subtitle={objet.id}
									selected={objet.id === objetAffiche.id}
									onSelect={() => setSelection(objet.id)}
								/>
							</div>
							{index > 0 && (
								<IconButton
									label={libelleMonter(objet, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(objet.id, -1)}
								>
									▲
								</IconButton>
							)}
							{index < objets.length - 1 && (
								<IconButton
									label={libelleDescendre(objet, index)}
									size={HIT_TARGET_MIN}
									onClick={() => deplacer(objet.id, 1)}
								>
									▼
								</IconButton>
							)}
						</li>
					))}
				</ul>
				<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
					+ Ajouter un objet…
				</button>
			</div>

			<div style={colonneFicheStyle}>
				<FicheObjet
					brouillon={brouillon}
					nomInputRef={nomInputRef}
					onChangeChamp={(champ, valeur) => handleChangeChamp(objetAffiche.id, champ, valeur)}
					onBlurChamp={(champ, valeur) => handleBlurChamp(objetAffiche.id, champ, valeur)}
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
	margin: 0,
	padding: 0,
	listStyle: 'none',
}

// Chaque `<li>` : la `ListRow` (flex:1, minWidth:0 — voir `ligneListRowStyle`)
// suivie des boutons Monter/Descendre, FRÈRES et hors du `<button>` de
// `ListRow` (§3 du plan, désaccord 3).
const ligneStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}

// `ListRow` n'accepte ni `style` ni `className` (contrat `brain/` figé) : cette
// enveloppe lui donne `flex:1, minWidth:0` sans toucher `ListRow.tsx`.
const ligneListRowStyle: CSSProperties = {
	flex: 1,
	minWidth: 0,
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
