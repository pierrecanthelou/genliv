import { type CSSProperties, type ReactNode } from 'react'

/**
 * ListRow — une ligne de liste SÉLECTIONNABLE : un `leading` optionnel, un titre
 * et son sous-titre technique, un `trailing` optionnel poussé à droite. La
 * variante sélectionnée teinte à l'accent.
 *
 * Racine `<button type="button">` et non un `<div>` cliquable : la sélection au
 * clavier (Tab pour parcourir, Entrée/Espace pour activer) vient alors du
 * navigateur, sans `tabIndex` ni `onKeyDown` maison. `aria-current` — et non
 * `aria-selected`/`aria-pressed` — parce que c'est une NAVIGATION : la ligne
 * courante d'une liste, pas une bascule ni une option de `listbox`.
 *
 * SANS POIGNÉE DE GLISSER : la source de design en porte une (`⠿`, résidu d'un
 * usage objet/butin réordonnable), retirée ici avec toute prop associée.
 *
 * ⚠ CORRECTION (itération 1 de la n° 5 `dossier-objets`, 2026-08-16) — la version
 * précédente de ce paragraphe annonçait que cette feature « ajouterait la poignée
 * AVEC son câblage réel (`onReorder`) ». Elle ne l'a pas fait, et c'est une
 * décision des quatre rôles du raffinage, pas un report : le réordonnancement est
 * COMPOSÉ ENTIÈREMENT PAR LA FEATURE — deux boutons Monter/Descendre rendus en
 * FRÈRES de `ListRow` par son `PanneauObjets.tsx`, dans le `<li>` qui les entoure.
 * `ListRow.tsx` ne change donc pas d'une ligne : ni `ListRowProps`, ni le DOM
 * rendu, ni les styles.
 *
 * DEUX raisons, et la première suffit : une prop `brain/` à UN SEUL appelant réel
 * est exactement la dette que ce paragraphe reprochait à `onReorder` posée par
 * avance (KR-109) — la déplacer d'un cran dans le temps ne la change pas de
 * nature. La seconde est d'instrument : le glisser natif n'a d'équivalent clavier
 * écrit nulle part dans ce dépôt et n'est pas prouvable fidèlement en jsdom, alors
 * que deux `<button>` le sont nativement (Tab, Entrée/Espace), par la même
 * mécanique du navigateur qui rend cette ligne-ci opérable au clavier.
 *
 * La promotion de la paire en primitive `brain/components/ReorderControls` est
 * REPORTÉE faute d'un second appelant réel et NOMMÉ ; son déclencheur écrit et la
 * signature retenue vivent dans `src/features/dossier-objets/specification.json`
 * (`open_questions`). Raisonnement complet :
 * `.claude/raffinage/dossier-objets-it1.plan.md` § 3 et § 8, désaccord 3.
 */
export interface ListRowProps {
	title: string
	subtitle?: ReactNode
	leading?: ReactNode
	trailing?: ReactNode
	/** Teinte accent + `aria-current` — la ligne courante de la liste. */
	selected?: boolean
	/** REQUIS : aucune variante non interactive n'a d'appelant. */
	onSelect: () => void
}

export function ListRow({ title, subtitle, leading, trailing, selected = false, onSelect }: ListRowProps): JSX.Element {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-current={selected ? 'true' : undefined}
			style={selected ? { ...row, ...rowSelected } : row}
		>
			{leading}
			<span style={texts}>
				<span style={titleLine}>{title}</span>
				{subtitle !== undefined && <span style={subtitleLine}>{subtitle}</span>}
			</span>
			{trailing}
		</button>
	)
}

/**
 * L'espacement du titre à son sous-titre : 2px, la valeur de la source de
 * design. Nommé plutôt qu'écrit en ligne parce qu'aucun token ne descend à cette
 * échelle (`--space-1` vaut 4px) — un nombre nu ici passerait pour un oubli.
 */
const SUBTITLE_GAP = 2

const row: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-5)',
	width: '100%',
	textAlign: 'left',
	// ≥44px de cible tactile, par le token miroir de HIT_TARGET_MIN (KR-115).
	minHeight: 'var(--hit-target)',
	boxSizing: 'border-box',
	border: '1px solid var(--border-subtle)',
	background: 'var(--surface-card)',
	borderRadius: 'var(--r-xl)',
	padding: 'var(--space-4) var(--space-5)',
	fontFamily: 'var(--font-ui)',
	cursor: 'pointer',
}

// Pas de règle `:hover` : la source n'en a pas, et un survol inventé ici
// divergerait du reste des surfaces de listes.
const rowSelected: CSSProperties = {
	border: '1.5px solid var(--accent)',
	background: 'var(--accent-bg-2)',
}

/**
 * ÉCART MESURÉ par rapport à la source de design, qui pose `flex: none` sur ce
 * bloc et pousse le `trailing` avec une cale `flex: 1`. Cette combinaison ne
 * rétrécit jamais : dans une colonne de 280 px, la ligne « Jalons & fins »
 * demande ~208 px de sous-titre (`charpente.jalons · charpente.fins`, mono
 * 10,5 px) plus ~110 px de badge — elle déborderait de sa colonne, et l'écran
 * qui la rend ne pourrait pas le corriger sans rouvrir ce composant. Le bloc de
 * texte prend donc la place restante et la CÈDE au besoin (`flex: 1` +
 * `minWidth: 0`), ce qui pousse le `trailing` à droite sans cale ; un sous-titre
 * trop long passe à la ligne plutôt que d'être tronqué — une clé technique
 * coupée par des points de suspension ne s'identifie plus.
 */
const texts: CSSProperties = {
	flex: 1,
	minWidth: 0,
}

const titleLine: CSSProperties = {
	display: 'block',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}

// Mono et faible : le sous-titre porte une clé technique (« monde.personnages »),
// pas de la prose — même traitement typographique que les libellés et les méta.
const subtitleLine: CSSProperties = {
	display: 'block',
	marginTop: SUBTITLE_GAP,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	lineHeight: 'var(--lh-snug)',
	color: 'var(--text-faint)',
	// Une clé technique est un seul mot sans espace (`monde.personnages`) : sans
	// cette ligne, elle déborde au lieu de se couper, quelle que soit la largeur
	// que l'appelant donne à sa colonne.
	overflowWrap: 'anywhere',
}
