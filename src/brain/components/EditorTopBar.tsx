import { Badge } from './Badge'
import { plural } from '../utils/plural'

/**
 * Editor top bar (wireframe § 02/03): « ← Mes livres », book title + node-count
 * badge, « Aperçu du jeu ▷ » and the accent « + Nœud » primary action. Shared
 * chrome above the editor body (KR-109), so the title and the actions live in
 * one place rather than being duplicated per view.
 *
 * ÉLARGIE par la n° 2 `bascule-editeur` (itération 2) pour porter AUSSI l'écran
 * d'édition d'un dossier d'aventure, qui n'a ni nœud ni « + Nœud ». Quatre props
 * OPTIONNELLES portent l'écart, et ZÉRO prop requise change : l'écran Book
 * (`src/EditorScreen.tsx`, chemin mort jusqu'à la démolition n° 9) garde tous ses
 * défauts actuels à l'identique, sans une ligne à modifier.
 */
export interface EditorTopBarProps {
	title: string
	onBack: () => void
	/**
	 * Le compteur de nœuds et son action d'ajout — un COUPLE, jamais l'un sans
	 * l'autre. Les deux fournis : le badge et « + Nœud » se rendent. Aucun des deux :
	 * ni badge, ni bouton — pas un fantôme désactivé. Un dossier n'a pas de nœuds ;
	 * ce ne sont pas des listes vides à garnir d'un placeholder, ce sont des
	 * affordances sans objet dans ce contexte.
	 */
	nodeCount?: number
	onAddNode?: () => void
	/**
	 * Le libellé du retour, après la flèche. Défaut `'Mes livres'` = comportement
	 * actuel de l'écran Book ; l'écran dossier passe `'Mes dossiers'`.
	 */
	backLabel?: string
	/**
	 * Composition-root injected feature actions (today tree-canvas's spacing and
	 * auto-layout toggles), rendered in the right cluster before « Aperçu du jeu ».
	 * A generic ReactNode slot keeps this shared chrome feature-agnostic
	 * (Open/Closed) — the bar never imports a feature; the shell wires the node in.
	 */
	actions?: React.ReactNode
	/** Wired by EditorScreen once the play runtime exists (play-mode iter 0). */
	onPreview?: () => void
	/**
	 * Le `title` natif du bouton « Aperçu du jeu » quand `onPreview` est absent —
	 * autrement dit la RAISON de la désactivation, qui n'est pas la même d'un écran
	 * à l'autre : hors éditeur pour le livre, feature non livrée pour le dossier.
	 * Le défaut préserve mot pour mot le texte de l'écran Book.
	 */
	previewDisabledReason?: string
}

const monoControl: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	borderRadius: 'var(--r-md)',
	padding: '8px 12px',
	minHeight: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
	cursor: 'pointer',
}

export function EditorTopBar({
	title,
	onBack,
	nodeCount,
	onAddNode,
	backLabel = 'Mes livres',
	actions,
	onPreview,
	previewDisabledReason = 'Aperçu du jeu — mode lecture (hors éditeur)',
}: EditorTopBarProps): JSX.Element {
	// Le compteur et son action sont un couple : le badge sans le bouton laisserait
	// un décompte qu'on ne peut pas faire varier, le bouton sans le badge une action
	// dont on ne voit pas l'effet.
	const noeudsEditables = nodeCount !== undefined && onAddNode !== undefined

	return (
		<header
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '10px 16px',
				borderBottom: '1px solid var(--border-subtle)',
				background: 'var(--surface-card)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
				<button
					type="button"
					onClick={onBack}
					style={{
						...monoControl,
						color: 'var(--text-label)',
						border: '1px solid transparent',
						background: 'transparent',
					}}
				>
					<span aria-hidden="true">←</span> {backLabel}
				</button>
				<span style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
				<h1
					style={{
						fontSize: 'var(--fs-title)',
						fontWeight: 'var(--fw-bold)',
						letterSpacing: 'var(--track-tight)',
						color: 'var(--text-strong)',
						margin: 0,
					}}
				>
					{title}
				</h1>
				{noeudsEditables && (
					<Badge tone="muted">
						{nodeCount} {plural(nodeCount, 'nœud')}
					</Badge>
				)}
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
				{actions}
				<button
					type="button"
					onClick={onPreview}
					disabled={!onPreview}
					title={onPreview ? 'Aperçu du jeu' : previewDisabledReason}
					style={{
						...monoControl,
						color: onPreview ? 'var(--text-body)' : 'var(--text-muted)',
						border: '1px solid var(--border-card)',
						background: 'var(--surface-card)',
						cursor: onPreview ? 'pointer' : 'not-allowed',
					}}
				>
					Aperçu du jeu <span aria-hidden="true">▷</span>
				</button>
				{noeudsEditables && (
					<button
						type="button"
						onClick={onAddNode}
						aria-label="Ajouter un nœud"
						style={{
							...monoControl,
							color: 'var(--text-on-accent)',
							border: '1px solid var(--accent)',
							background: 'var(--accent)',
							fontWeight: 'var(--fw-semibold)',
						}}
					>
						<span aria-hidden="true">+</span> Nœud
					</button>
				)}
			</div>
		</header>
	)
}
