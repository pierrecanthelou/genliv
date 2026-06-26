import { useId, useRef, useState } from 'react'
import { nodeTitle } from '../utils/nodeView'
import { canBeTarget } from '../kinds'
import type { BookNode } from '../types'

/**
 * TargetPicker — pick a node another node points at for a NON-choice screen
 * change (PNJ « mène à », monster victoire/fuite targets). Lives in brain because
 * more than one feature uses it (action-pnj + action-monster, KR-109). Structural
 * screens are never authored targets so the Sommaire/Mort are excluded (KR-067,
 * the canBeTarget flag), and a target whose node was deleted is surfaced (⚠),
 * never silently broken (KR-021/063). Controlled: the chosen id lives on the
 * owner's config (pending promotion to a rendered edge via the dedicated path).
 *
 * Renders as a combobox: the trigger input shows the current selection when
 * closed and becomes a live-filter field when focused — type to narrow the
 * candidate list. Each candidate button calls e.preventDefault() in onMouseDown
 * to prevent focus from leaving the input; onClick retains keyboard activation.
 */
export interface TargetPickerProps {
	/** Mono caption above the picker (e.g. « Ensuite, le PNJ mène à »). */
	label: string
	/** All nodes of the book (to list candidates + resolve the current target). */
	nodes: BookNode[]
	/** The node being edited (excluded from its own candidates). */
	nodeId: string
	/** The currently chosen target node id, if any. */
	target: string | undefined
	onChange: (target: string | undefined) => void
	/** Copy for the no-target state + the clear option. */
	emptyLabel?: string
	/** Node ids to surface at the top of the picker as contextually relevant (e.g. predecessors + siblings). */
	suggestedIds?: ReadonlySet<string>
}

export function TargetPicker({
	label,
	nodes,
	nodeId,
	target,
	onChange,
	emptyLabel = 'Aucune cible',
	suggestedIds,
}: TargetPickerProps): JSX.Element {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const containerRef = useRef<HTMLDivElement>(null)
	const listId = useId()

	const candidates = nodes.filter((n) => n.id !== nodeId && canBeTarget(n.kind))
	const current = target !== undefined ? (nodes.find((n) => n.id === target) ?? null) : null
	const dangling = target !== undefined && current === null

	const filtered =
		search.length > 0 ? candidates.filter((n) => nodeTitle(n).toLowerCase().includes(search.toLowerCase())) : candidates

	const suggested = suggestedIds !== undefined ? filtered.filter((n) => suggestedIds.has(n.id)) : []
	const rest = suggestedIds !== undefined ? filtered.filter((n) => !suggestedIds.has(n.id)) : filtered

	const displayValue = current !== null ? nodeTitle(current) : dangling ? '⚠ cible supprimée' : ''
	const inputValue = open ? search : displayValue
	const placeholder = open ? 'Rechercher…' : emptyLabel

	function choose(next: string | undefined): void {
		onChange(next)
		setOpen(false)
		setSearch('')
	}

	function handleContainerBlur(e: React.FocusEvent): void {
		if (containerRef.current !== null && containerRef.current.contains(e.relatedTarget as Node)) return
		setOpen(false)
		setSearch('')
	}

	return (
		<div ref={containerRef} onBlur={handleContainerBlur}>
			<span style={labelStyle}>{label}</span>
			<input
				type="text"
				role="combobox"
				aria-label={label}
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-controls={open ? listId : undefined}
				aria-autocomplete="list"
				value={inputValue}
				placeholder={placeholder}
				onChange={(e) => {
					setSearch(e.target.value)
					if (!open) setOpen(true)
				}}
				onFocus={() => {
					setSearch('')
					setOpen(true)
				}}
				onClick={() => setOpen(true)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						setOpen(false)
						setSearch('')
					}
				}}
				style={{
					...inputStyle,
					...(dangling && !open ? { color: 'var(--bad)' } : {}),
				}}
			/>
			{open && (
				<ul id={listId} role="listbox" style={picker} aria-label={`Choisir : ${label}`}>
					<li>
						<button
							type="button"
							style={candidate}
							onMouseDown={(e) => {
								e.preventDefault()
								choose(undefined)
							}}
							onClick={() => choose(undefined)}
						>
							— {emptyLabel} —
						</button>
					</li>
					{suggested.length > 0 && (
						<>
							<li style={groupLabel} role="presentation">
								Nœuds proches
							</li>
							{suggested.map((n) => (
								<li key={n.id}>
									<button
										type="button"
										style={candidate}
										onMouseDown={(e) => {
											e.preventDefault()
											choose(n.id)
										}}
										onClick={() => choose(n.id)}
									>
										{nodeTitle(n)}
									</button>
								</li>
							))}
							<li role="separator" style={groupSeparator} />
						</>
					)}
					{rest.length === 0 && suggested.length === 0 ? (
						<li>
							<span style={emptyItem}>{search.length > 0 ? 'Aucun résultat' : 'Aucun autre nœud'}</span>
						</li>
					) : (
						rest.map((n) => (
							<li key={n.id}>
								<button
									type="button"
									style={candidate}
									onMouseDown={(e) => {
										e.preventDefault()
										choose(n.id)
									}}
									onClick={() => choose(n.id)}
								>
									{nodeTitle(n)}
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	)
}

/** Target picker dropdown max height before it scrolls. */
const PICKER_MAX_HEIGHT = 240

const labelStyle: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
	width: '100%',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	background: 'var(--surface-sunken)',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '7px 10px',
	minHeight: 'var(--hit-target)',
	boxSizing: 'border-box',
}

const picker: React.CSSProperties = {
	listStyle: 'none',
	margin: 'var(--space-2) 0 0',
	padding: 'var(--space-1)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	boxShadow: 'var(--shadow-menu)',
	maxHeight: PICKER_MAX_HEIGHT,
	overflowY: 'auto',
}

const candidate: React.CSSProperties = {
	width: '100%',
	textAlign: 'left',
	background: 'transparent',
	border: 'none',
	borderRadius: 'var(--r-sm)',
	padding: '8px 10px',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}

const emptyItem: React.CSSProperties = {
	display: 'block',
	padding: '8px 10px',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-faint)',
}

const groupLabel: React.CSSProperties = {
	padding: '4px 10px 2px',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-faint)',
	letterSpacing: 'var(--track-eyebrow)',
	userSelect: 'none',
}

const groupSeparator: React.CSSProperties = {
	height: 1,
	background: 'var(--border-divider)',
	margin: 'var(--space-1) var(--space-2)',
	listStyle: 'none',
}
