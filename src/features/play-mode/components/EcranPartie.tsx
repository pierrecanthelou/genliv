import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useBrain, controlerDossier, ouvrirSession, type Dossier, type EtatSession, type Route } from '../../../brain'
import { MARQUEUR_A_ECRIRE } from '../../../brain/dossier/amorce'
import { useSessionPersistee } from '../hooks/useSessionPersistee'
import { OutcomeBlock } from './OutcomeBlock'

/**
 * LE SHELL DE PARTIE — la route `partie`, montée par la racine de composition.
 *
 * ANATOMIE REPRISE DE `PlayerModal.tsx` (même répertoire), JAMAIS IMPORTÉE, et la
 * différence est le point : `PlayerModal` est une MODALE (`role="dialog"`,
 * `aria-modal`, superposée à l'éditeur) ; ceci est une ROUTE, donc une PAGE —
 * `<main>`, ni `role="dialog"`, ni `aria-modal`, ni ombre (les ombres sont
 * réservées aux menus et aux modales). La règle « le focus revient au déclencheur
 * à la fermeture » ne s'applique pas : ce n'est pas une fermeture, c'est une
 * navigation, et la route démonte le déclencheur. Aucun focus impératif au
 * montage, aucun piège à focus : ce n'est pas une omission.
 *
 * ORDRE DES GARDES, NORMATIF (§ 5 du plan d'itération 1) :
 *  1. le dossier est GELÉ à l'ouverture ;
 *  2. absent → refus `dossier_introuvable` ;
 *  3. non jouable → refus `dossier_non_jouable` (KR-239) ;
 *  4. graine tirée puis session ouverte, une fois ;
 *  5. ouverture refusée → refus `ouverture_a_ecrire` ;
 *  6. sinon : header, bannière d'ouverture, zone journal.
 *
 * Les gardes 4 et 5 vivent dans des composants internes parce que les règles des
 * hooks interdisent d'appeler `useState` après un `return` conditionnel — même
 * découpage que `PlayerModal` / `PlayerModalInner`.
 */

const TITRE_APERCU = 'Aperçu du jeu'
const LIBELLE_SORTIE = 'Quitter le test'
const TITRE_REFUS = "La partie ne peut pas s'ouvrir"
const ENTETE_OUVERTURE = 'OUVERTURE — lue au joueur, mot pour mot'
const LIBELLE_JOURNAL = 'Journal'

/**
 * Au FUTUR, et c'est voulu : vrai en it1 où l'auteur ne peut encore rien faire,
 * vrai en it2 où la console lui donnera un verbe. Un texte transitoire pour it1
 * serait réécrit dans un mois. Forme maison `Aucun X — <invitation>.`
 */
const TEXTE_JOURNAL_VIDE = "Aucun évènement pour l'instant — vos actions y apparaîtront."

/**
 * LA SEULE ENTROPIE DE LA FEATURE, et elle est NOMMÉE : un `Math.random()`
 * anonyme en ligne serait intirable par un test (§ 8, D-16 — précédent du `rng`
 * non semé de `combat.ts:107`). `ouvrirSession` n'en tire aucune : sa graine est
 * REQUISE et INJECTÉE, faute de quoi la promesse de rejeu de la n° 11 ne
 * tiendrait pour aucune session née ici.
 */
const GRAINE_MAX = 2 ** 32
export function tirerGraine(): number {
	return Math.floor(Math.random() * GRAINE_MAX)
}

/**
 * Les trois refus de l'écran. Registre piloté par la donnée (KR-117) plutôt que
 * trois branches : chaque code y porte son texte, son action et sa destination,
 * et un quatrième code ne compilerait pas sans sa ligne.
 *
 * `dossier_non_jouable` et `ouverture_a_ecrire` partagent la même sortie : ce
 * sont deux façons de dire « retournez le corriger dans l'éditeur ».
 */
type CodeRefus = 'dossier_introuvable' | 'dossier_non_jouable' | 'ouverture_a_ecrire'

interface DescripteurRefus {
	readonly texte: string
	readonly libelleAction: string
	readonly destination: (dossierId: string) => Route
}

const REFUS: Record<CodeRefus, DescripteurRefus> = {
	/** Texte repris TEL QUEL de `DossierEditorScreen.tsx` : le même fait, deux écrans, un seul texte. */
	dossier_introuvable: {
		texte: 'Dossier introuvable.',
		libelleAction: '← Mes dossiers',
		destination: () => ({ name: 'home' }),
	},
	dossier_non_jouable: {
		texte: "Ce dossier porte encore un contrôle bloquant. Ouvrez « Contrôles » dans l'éditeur pour voir lequel.",
		libelleAction: "← Revenir à l'éditeur",
		destination: (dossierId) => ({ name: 'dossier', dossierId }),
	},
	/**
	 * INATTEIGNABLE PAR L'INTERFACE EN IT1, et c'est MESURÉ : `controles.ts` classe
	 * ce champ `bloquant`, donc la garde 3 a déjà refusé. La branche reste parce que
	 * `ResultatOuverture` est une union discriminée que ce shell doit rétrécir
	 * TOTALEMENT — un bras sans texte rendrait un écran blanc — et parce que des
	 * chemins futurs (reprise, lien direct) la rouvrent (KR-239, § 8 D-7).
	 *
	 * Le marqueur se COMPOSE, il ne se recopie jamais : le tapé en dur serait une
	 * seconde source de vérité (KR-223).
	 */
	ouverture_a_ecrire: {
		texte: `Le texte d'ouverture porte encore le marqueur ${MARQUEUR_A_ECRIRE} — le moteur le lirait au joueur mot pour mot. Rédigez-le dans DÉPART · TEXTE D'OUVERTURE.`,
		libelleAction: "← Revenir à l'éditeur",
		destination: (dossierId) => ({ name: 'dossier', dossierId }),
	},
}

export interface EcranPartieProps {
	dossierId: string
}

export function EcranPartie({ dossierId }: EcranPartieProps): JSX.Element {
	const { dossiers } = useBrain()
	// GARDE 1 — LE DOSSIER EST GELÉ À L'OUVERTURE (arbitrage n° 7). Surtout PAS
	// `useOpenDossier`, qui s'abonne à `dossier:updated` : le voisin
	// `DossierEditorScreen` fait l'inverse, et il a raison de le faire, mais une
	// partie qui adopterait une édition en cours de route rouvrirait la porte
	// KR-239 après l'avoir passée (§ 8, D-20).
	const [dossier] = useState(() => dossiers.get(dossierId))

	// GARDE 2 — `DossierService.get` rend `null` (jamais `undefined`) pour un
	// dossier absent ou devenu illisible.
	if (dossier === null) {
		return <EcranRefus code="dossier_introuvable" titre={null} dossierId={dossierId} />
	}

	// GARDE 3 — EN LIGNE, à chaque rendu, jamais un `useMemo` ni un miroir
	// (KR-013/113). LA PORTE EST ICI, pas seulement au CTA : la route `partie` est
	// un chemin d'accès DIRECT, et tout chemin qui ouvre une session sans repasser
	// par `jouable` rouvre le faux positif que l'évaluateur d'it3 hériterait
	// (KR-239). C'est la FEATURE qui lit `controlerDossier` — jamais `src/player/`,
	// jamais `brain/dossier/` : le linter de l'éditeur n'entre pas dans le bundle
	// extractible (§ 8, D-21).
	const { jouable } = controlerDossier(dossier)
	if (!jouable) {
		return <EcranRefus code="dossier_non_jouable" titre={dossier.titre} dossierId={dossierId} />
	}

	return <PartieDemarree dossier={dossier} dossierId={dossierId} />
}

/** Gardes 4 et 5 — la graine puis l'ouverture, tirées UNE FOIS pour le montage. */
function PartieDemarree({ dossier, dossierId }: { dossier: Dossier; dossierId: string }): JSX.Element {
	const [graine] = useState(() => tirerGraine())
	const [ouverture] = useState(() => ouvrirSession(dossier, { graine_alea: graine }))

	if (!ouverture.ok) {
		return <EcranRefus code={ouverture.refus} titre={dossier.titre} dossierId={dossierId} />
	}

	return <PartieEnCours dossier={dossier} dossierId={dossierId} session={ouverture.session} />
}

/** Garde 6 — la partie ouverte : la bannière d'ouverture et la zone journal. */
function PartieEnCours({
	dossier,
	dossierId,
	session,
}: {
	dossier: Dossier
	dossierId: string
	session: EtatSession
}): JSX.Element {
	useSessionPersistee(dossierId, session)

	return (
		<Cadre titre={dossier.titre} sortie={{ name: 'dossier', dossierId }}>
			<div style={colonneLecture}>
				{/* LE SEUL NŒUD DE REGISTRE JOUEUR DE TOUT L'ÉCRAN. `lieu_courant` est un
				    IDENTIFIANT : il n'apparaît nulle part ici, et le registre
				    développeur-débogueur arrive en it2 avec la console (§ 3.G). */}
				<OutcomeBlock entete={ENTETE_OUVERTURE}>{dossier.charpente.depart.texte_ouverture_joueur}</OutcomeBlock>
				<section aria-label={LIBELLE_JOURNAL}>
					<span style={libelleZone}>JOURNAL</span>
					{
						session.journal.length === 0 ? (
							<div style={etatVide}>
								<span style={glypheVide} aria-hidden="true">
									⬚
								</span>
								<p style={texteVide}>{TEXTE_JOURNAL_VIDE}</p>
							</div>
						) : null /* it2 : la liste de JournalRow */
					}
				</section>
			</div>
		</Cadre>
	)
}

/**
 * Les trois écrans de refus, rendus À LA PLACE de la colonne de lecture : le
 * header reste, l'auteur doit toujours pouvoir sortir.
 */
function EcranRefus({
	code,
	titre,
	dossierId,
}: {
	code: CodeRefus
	titre: string | null
	dossierId: string
}): JSX.Element {
	const { router } = useBrain()
	const { texte, libelleAction, destination } = REFUS[code]
	const sortie = destination(dossierId)

	return (
		<Cadre titre={titre} sortie={sortie}>
			<section style={blocRefus}>
				<span style={glypheRefus} aria-hidden="true">
					⊘
				</span>
				<h2 style={titreRefus}>{TITRE_REFUS}</h2>
				<p style={texteRefus}>{texte}</p>
				<button type="button" style={boutonRetour} onClick={() => router.navigate(sortie)}>
					{libelleAction}
				</button>
			</section>
		</Cadre>
	)
}

/**
 * L'enveloppe commune — header et corps défilant. `titre` vaut `null` quand il
 * n'y a pas de dossier à nommer (refus `dossier_introuvable`) : « Aperçu du jeu ·
 * undefined » serait pire qu'un header court.
 *
 * `Échap` fait EXACTEMENT ce que fait le bouton visible de l'écran affiché — d'où
 * la route `sortie` en prop, partagée par le bouton du header, la touche, et (sur
 * un refus) le bouton d'action. Écouteur sur `document`, rappel tenu par un
 * `useRef` et retiré au nettoyage (KR-004) : recopié de `PlayerModal.tsx:18-27`.
 */
function Cadre({ titre, sortie, children }: { titre: string | null; sortie: Route; children: ReactNode }): JSX.Element {
	const { router } = useBrain()
	const sortir = (): void => router.navigate(sortie)
	const sortirRef = useRef(sortir)
	sortirRef.current = sortir

	useEffect(() => {
		function handleKey(e: KeyboardEvent): void {
			if (e.key === 'Escape') sortirRef.current()
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [])

	return (
		<main aria-label={TITRE_APERCU} style={racine}>
			<header style={entete}>
				<span style={titreEntete}>
					{TITRE_APERCU}
					{titre !== null && (
						<>
							{' · '}
							<span style={titreDossier}>{titre}</span>
						</>
					)}
				</span>
				<button type="button" onClick={sortir} aria-label={LIBELLE_SORTIE} style={boutonSortie}>
					✕ {LIBELLE_SORTIE}
				</button>
			</header>
			<div style={corps}>{children}</div>
		</main>
	)
}

const racine: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	height: '100vh',
	background: 'var(--surface-app)',
}

// Calqué sur `PlayerModal.tsx:43-53`, jetons à la place des pixels bruts.
const entete: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: 'var(--space-3) var(--space-7)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)',
	flexShrink: 0,
}

const titreEntete: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-label)',
}

const titreDossier: CSSProperties = { color: 'var(--text-strong)' }

// Calqué sur `PlayerModal.tsx:74-85`. Le survol est en CSS seul côté design
// system — jamais un état `isHovered` en React.
const boutonSortie: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-2) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-card)',
	background: 'transparent',
	color: 'var(--text-label)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}

// `flex: 1` + `minHeight: 0` + `overflowY` : le trio sans lequel le défilement
// est un no-op dans une colonne flex (KR-147).
const corps: CSSProperties = {
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	padding: 'var(--space-12)',
	boxSizing: 'border-box',
}

// `640` et `480` sont les deux seuls nombres bruts de cet écran : des MESURES DE
// LIGNE (colonne de lecture, bloc centré), sans jeton au système — précédent
// `PanneauControles.tsx:77`.
const colonneLecture: CSSProperties = {
	maxWidth: 640,
	margin: '0 auto',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-9)',
}

const libelleZone: CSSProperties = {
	display: 'block',
	marginBottom: 'var(--space-4)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	color: 'var(--text-label)',
}

const etatVide: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
}

const glypheVide: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }

const texteVide: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }

const blocRefus: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
	margin: '0 auto',
}

const glypheRefus: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }

const titreRefus: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	letterSpacing: 'var(--track-tight)',
	color: 'var(--text-strong)',
}

const texteRefus: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }

// L'accent est légitime ici : UNIQUE action de l'écran.
const boutonRetour: CSSProperties = {
	marginTop: 'var(--space-3)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--accent)',
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
