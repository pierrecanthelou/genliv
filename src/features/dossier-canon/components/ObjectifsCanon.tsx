import { useMemo, useState, type ChangeEvent, type CSSProperties, type FocusEvent } from 'react'
import {
	useBrain,
	useOpenDossier,
	validateDossier,
	frapperIdentifiant,
	Field,
	IconButton,
	IssueList,
	Select,
	CAMPS,
	HIT_TARGET_MIN,
	type Camp,
	type Objectif,
} from '../../../brain'

export interface ObjectifsCanonProps {
	dossierId: string
}

/**
 * La valeur posée à la CRÉATION d'un objectif — constante nommée, jamais
 * `CAMPS[0]` par position (§3/§5 du plan d'itération 3) : un registre qui
 * changerait d'ordre demain ne doit pas changer silencieusement quel camp est
 * initial.
 */
const CAMP_INITIAL: Camp = 'protagonistes'

/**
 * Libellés français des camps — côté FEATURE, un seul consommateur réel cette
 * itération (§8, désaccord 7 du plan). Un `Record<Camp, string>` dérive les
 * labels, jamais un `if`/`switch` en cascade.
 */
const LIBELLES_CAMPS: Record<Camp, string> = {
	protagonistes: 'Protagonistes',
	antagonistes: 'Antagonistes',
	joueur: 'Joueur',
}

const OPTIONS_CAMPS = CAMPS.map((camp) => ({ value: camp, label: LIBELLES_CAMPS[camp] }))

const EYEBROW_SECTION = 'OBJECTIFS DES CAMPS — interne, jamais injecté au modèle'
const EYEBROW_AVERTISSEMENT_OBJECTIFS = 'ENREGISTRÉ, AVEC AVERTISSEMENT'

const PLACEHOLDER_NOM = 'Percer le secret du Gouffre scellé'
const PLACEHOLDER_REUSSITE = 'Le héros a atteint le fond du Gouffre scellé.'
const PLACEHOLDER_ECHEC = 'Le héros meurt, ou quitte Val-Cendre sans avoir percé le sceau.'

/**
 * Le brouillon local des TROIS champs de prose d'un objectif (`nom`,
 * `reussi_si_texte`, `echoue_si_texte`) — `camp` n'y entre JAMAIS : un
 * `<select>` n'a pas de blur, il committe immédiatement (même régime que
 * `lieu_id` dans `PanneauDepart.tsx`).
 */
interface BrouillonObjectif {
	nom: string
	reussi_si_texte: string
	echoue_si_texte: string
}

function brouillonDe(objectif: Objectif): BrouillonObjectif {
	return {
		nom: objectif.nom ?? '',
		reussi_si_texte: objectif.reussi_si_texte ?? '',
		echoue_si_texte: objectif.echoue_si_texte ?? '',
	}
}

/**
 * La liste des objectifs de victoire du canon — un par camp (protagonistes,
 * antagonistes, joueur), condition de réussite, condition d'échec, en prose
 * factuelle. Composant SÉPARÉ de `PanneauCanon` (§5 du plan d'itération 3,
 * désaccord 9) : `PanneauCanon.tsx` fait 381 lignes, signal de découpe KR-112.
 *
 * Écrit par le MÊME chemin que le reste du canon, `DossierService.update()`,
 * avec un patch ÉTROIT : `monde`/`charpente` traversent intacts (§6, critère
 * #7 du plan).
 *
 * DEUX RÉGIMES D'ÉDITION, comme `PanneauDepart.tsx` :
 *  · `nom` / `reussi_si_texte` / `echoue_si_texte` — brouillon local, indexé par
 *    `objectif.id`, SEEDÉ UNE FOIS (`useState(() => …)`, KR-013/113), jamais
 *    resynchronisé, committé au blur.
 *  · `camp` — AUCUN brouillon. Lu EN LIGNE depuis le dossier ouvert, le
 *    `change` du `Select` committe immédiatement.
 *
 * AUCUN bandeau de refus ici (§5 du plan) : `statut: 'refuse'` est
 * structurellement inatteignable depuis cette carte — id frappé bien formé,
 * `camp` fermé par le `Select`, `nom`/`…_texte` libres. Construire un état
 * `Refus` qui ne peut jamais s'allumer serait du code non testable.
 *
 * L'AVERTISSEMENT D1 (`condition-sans-expr`), lui, est ATTEIGNABLE dès la
 * première saisie d'un `…_texte` sans son `…_expr` jumeau (hors périmètre de
 * cette itération) — rendu via une lecture DÉRIVÉE, `useMemo` sur `dossier`,
 * jamais un état local semé une seule fois : il doit s'allumer au montage
 * (dossier réouvert, aucune édition de session) autant qu'après un commit.
 *
 * Rend `null` si le dossier est absent : l'écran parent affiche déjà
 * « Dossier introuvable. ».
 */
export function ObjectifsCanon({ dossierId }: ObjectifsCanonProps): JSX.Element | null {
	const { dossiers } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [brouillons, setBrouillons] = useState<Record<string, BrouillonObjectif>>(() =>
		dossier === null
			? {}
			: Object.fromEntries(dossier.canon.objectifs.map((objectif) => [objectif.id, brouillonDe(objectif)])),
	)
	// Recalculé à CHAQUE rendu où `dossier` a une nouvelle identité — donc dès
	// l'ouverture d'un dossier importé déjà non conforme, PAS seulement après un
	// commit de cette session (§5 du plan, critère #5).
	const avertissementsObjectifs = useMemo(
		() =>
			dossier === null
				? []
				: validateDossier(dossier).warnings.filter((issue) => issue.path.startsWith('canon.objectifs')),
		[dossier],
	)

	if (dossier === null) return null
	// Une CONST typée `Dossier` (jamais `Dossier | null`), même idiome que
	// `brouillonActuel` dans `PanneauCanon.tsx` : TypeScript ne propage pas le
	// rétrécissement de `if (dossier === null) return null` à l'intérieur des
	// fonctions imbriquées ci-dessous (portée distincte) — capter la valeur non
	// nulle une fois ici évite un `as`/`!` ou un second garde répété.
	const dossierActuel: typeof dossier = dossier

	/**
	 * L'idiome d'écriture prescrit (§5 du plan) : TROIS racines nommées, jamais
	 * un spread de `dossier` — seul `canon.objectifs` change, `monde`/`charpente`
	 * traversent intacts.
	 */
	function commit(objectifs: Objectif[]): void {
		dossiers.update(dossierId, (d) => ({
			canon: { ...d.canon, objectifs },
			monde: d.monde,
			charpente: d.charpente,
		}))
	}

	// Ajout/retrait : committent IMMÉDIATEMENT, sans attendre un blur — la carte
	// apparaît ou disparaît déjà persistée.
	function handleAjouter(): void {
		const id = frapperIdentifiant('objectif')
		const nouveau: Objectif = { id, camp: CAMP_INITIAL, nom: '', reussi_si_texte: '', echoue_si_texte: '' }
		commit([...dossierActuel.canon.objectifs, nouveau])
		setBrouillons((prev) => ({ ...prev, [id]: brouillonDe(nouveau) }))
	}

	function handleRetirer(id: string): void {
		commit(dossierActuel.canon.objectifs.filter((objectif) => objectif.id !== id))
		setBrouillons((prev) => {
			const suivant = { ...prev }
			delete suivant[id]
			return suivant
		})
	}

	function handleChangeCamp(id: string, camp: Camp): void {
		commit(dossierActuel.canon.objectifs.map((objectif) => (objectif.id === id ? { ...objectif, camp } : objectif)))
	}

	// `prev[id]` peut être absent d'un brouillon né hors de `handleAjouter` (ex.
	// un objectif arrivé par une réconciliation cloud pendant que le panneau est
	// monté) : spreader `undefined` laisserait les deux autres champs devenir
	// `undefined` (Field bascule contrôlé -> non contrôlé), effaçant leur valeur
	// affichée sans qu'aucun blur ne l'ait demandé. Repli sur `brouillonDe(objectif)`
	// pour reconstituer un brouillon complet avant de le muter.
	function handleChangeChamp(id: string, champ: keyof BrouillonObjectif, valeur: string): void {
		setBrouillons((prev) => {
			if (prev[id] !== undefined) return { ...prev, [id]: { ...prev[id], [champ]: valeur } }
			const objectif = dossierActuel.canon.objectifs.find((o) => o.id === id)
			if (objectif === undefined) return prev
			return { ...prev, [id]: { ...brouillonDe(objectif), [champ]: valeur } }
		})
	}

	function handleBlurChamp(id: string, champ: keyof BrouillonObjectif, valeur: string): void {
		commit(
			dossierActuel.canon.objectifs.map((objectif) =>
				objectif.id === id ? { ...objectif, [champ]: valeur } : objectif,
			),
		)
	}

	return (
		<div style={racineStyle}>
			<div>
				<span style={titreSectionStyle}>{EYEBROW_SECTION}</span>
				<div style={listeStyle}>
					{dossier.canon.objectifs.map((objectif, index) => {
						const brouillon = brouillons[objectif.id] ?? brouillonDe(objectif)
						return (
							<div key={objectif.id} style={carteStyle}>
								<Field
									label="NOM DE L'OBJECTIF"
									hint="interne"
									placeholder={PLACEHOLDER_NOM}
									value={brouillon.nom}
									onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										handleChangeChamp(objectif.id, 'nom', e.target.value)
									}
									onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										handleBlurChamp(objectif.id, 'nom', e.target.value)
									}
								/>

								<Select
									label="CAMP"
									options={OPTIONS_CAMPS}
									value={objectif.camp}
									onChange={(camp) => handleChangeCamp(objectif.id, camp)}
								/>

								<Field
									label="CONDITION DE RÉUSSITE"
									hint="phrase factuelle pour le moteur, jamais de fiction"
									multiline
									rows={2}
									placeholder={PLACEHOLDER_REUSSITE}
									value={brouillon.reussi_si_texte}
									onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										handleChangeChamp(objectif.id, 'reussi_si_texte', e.target.value)
									}
									onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										handleBlurChamp(objectif.id, 'reussi_si_texte', e.target.value)
									}
								/>

								<Field
									label="CONDITION D'ÉCHEC"
									hint="phrase factuelle pour le moteur, jamais de fiction"
									multiline
									rows={2}
									placeholder={PLACEHOLDER_ECHEC}
									value={brouillon.echoue_si_texte}
									onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										handleChangeChamp(objectif.id, 'echoue_si_texte', e.target.value)
									}
									onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
										handleBlurChamp(objectif.id, 'echoue_si_texte', e.target.value)
									}
								/>

								<div style={piedCarteStyle}>
									<IconButton
										label={`Retirer l'objectif n°${index + 1}`}
										tone="danger"
										size={HIT_TARGET_MIN}
										onClick={() => handleRetirer(objectif.id)}
									>
										✕
									</IconButton>
								</div>
							</div>
						)
					})}
					<button type="button" onClick={handleAjouter} style={boutonAjouterStyle}>
						+ Ajouter un objectif…
					</button>
				</div>
			</div>

			{avertissementsObjectifs.length > 0 && (
				<div role="status" style={bandeauAvertissementStyle}>
					<p style={eyebrowAvertissementStyle}>{EYEBROW_AVERTISSEMENT_OBJECTIFS}</p>
					<IssueList issues={avertissementsObjectifs} />
				</div>
			)}
		</div>
	)
}

const racineStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const titreSectionStyle: CSSProperties = {
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

const carteStyle: CSSProperties = {
	border: '1px solid var(--border-subtle)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--surface-inset)',
	padding: 'var(--space-6)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const piedCarteStyle: CSSProperties = {
	display: 'flex',
	justifyContent: 'flex-end',
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

const bandeauAvertissementStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const eyebrowAvertissementStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--bad)',
	letterSpacing: 'var(--track-eyebrow)',
}
