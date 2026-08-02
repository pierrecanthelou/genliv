import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Modal — a centered dialog over a flat ink scrim (no blur). Header,
 * body, and a footer separating a destructive action (left) from
 * cancel/confirm (right). Handles scrim/Esc dismiss, focus capture +
 * restore, and a focus trap; the visual anatomy matches the wireframe.
 */
export interface ModalDestructiveAction {
	label: string
	onClick: () => void
}

export interface ModalProps {
	title: ReactNode
	children: ReactNode
	onClose?: () => void
	/** Left-aligned destructive action (e.g. "Supprimer l'objet"). color=error. */
	destructive?: ModalDestructiveAction
	cancelLabel?: string
	confirmLabel?: string
	confirmDisabled?: boolean
	/** 'error' paints the confirm button destructive-red for dangerous actions. */
	confirmTone?: 'accent' | 'error'
	onCancel?: () => void
	onConfirm?: () => void
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/** Dialog max width, and the square close (✕) button size. */
const MODAL_MAX_WIDTH = 420
const CLOSE_BUTTON_SIZE = 28

export function Modal({
	title,
	children,
	onClose,
	destructive,
	cancelLabel = 'Annuler',
	confirmLabel = 'Enregistrer',
	confirmDisabled = false,
	confirmTone = 'accent',
	onCancel,
	onConfirm,
}: ModalProps): JSX.Element {
	const dialogRef = useRef<HTMLDivElement>(null)
	const dismiss = onClose ?? onCancel

	// Capture the element that opened the modal and restore focus on unmount.
	useEffect(() => {
		const previouslyFocused = document.activeElement as HTMLElement | null
		return () => {
			previouslyFocused?.focus?.()
		}
	}, [])

	// Esc to dismiss + a simple Tab focus trap kept inside the dialog.
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.stopPropagation()
				dismiss?.()
				return
			}
			if (e.key !== 'Tab' || dialogRef.current === null) return
			const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
			if (focusable.length === 0) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault()
				last.focus()
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault()
				first.focus()
			}
		}
		document.addEventListener('keydown', handleKeyDown, true)
		return () => document.removeEventListener('keydown', handleKeyDown, true)
	}, [dismiss])

	return (
		<div
			onClick={dismiss}
			style={{
				position: 'fixed',
				inset: 0,
				background: 'var(--overlay-soft)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 'var(--space-9)',
				zIndex: 100,
			}}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label={typeof title === 'string' ? title : undefined}
				onClick={(e) => e.stopPropagation()}
				style={{
					background: 'var(--surface-card)',
					border: '1px solid var(--border-card)',
					borderRadius: 'var(--r-3xl)',
					boxShadow: 'var(--shadow-modal)',
					overflow: 'hidden',
					width: '100%',
					maxWidth: MODAL_MAX_WIDTH,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '13px 16px',
						borderBottom: '1px solid var(--line-4)',
					}}
				>
					<div style={{ fontSize: 'var(--fs-row)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
						{title}
					</div>
					<button
						type="button"
						onClick={dismiss}
						aria-label="Fermer"
						style={{
							border: 'none',
							background: 'none',
							color: 'var(--ink-5)',
							fontSize: 16,
							cursor: 'pointer',
							width: CLOSE_BUTTON_SIZE,
							height: CLOSE_BUTTON_SIZE,
						}}
					>
						✕
					</button>
				</div>
				<div style={{ padding: 16 }}>{children}</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '12px 16px',
						borderTop: '1px solid var(--line-4)',
						background: 'var(--paper-1)',
					}}
				>
					<div>
						{destructive && (
							<button
								type="button"
								onClick={destructive.onClick}
								style={{
									fontSize: 'var(--fs-sm)',
									color: 'var(--bad)',
									border: '1px solid var(--bad-line)',
									borderRadius: 'var(--r-lg)',
									padding: '11px 14px',
									background: 'none',
									cursor: 'pointer',
								}}
							>
								✕ {destructive.label}
							</button>
						)}
					</div>
					<div style={{ display: 'flex', gap: 8 }}>
						<button
							type="button"
							onClick={onCancel}
							style={{
								fontSize: 'var(--fs-sm)',
								color: 'var(--text-muted)',
								border: '1px solid var(--border-field)',
								borderRadius: 'var(--r-lg)',
								padding: '11px 16px',
								minHeight: 'var(--hit-target)',
								background: 'none',
								cursor: 'pointer',
							}}
						>
							{cancelLabel}
						</button>
						<button
							type="button"
							onClick={onConfirm}
							disabled={confirmDisabled}
							style={{
								fontSize: 'var(--fs-sm)',
								color: 'var(--text-on-accent)',
								background: confirmDisabled ? 'var(--ink-5)' : confirmTone === 'error' ? 'var(--bad)' : 'var(--accent)',
								border: 'none',
								borderRadius: 'var(--r-lg)',
								padding: '11px 18px',
								minHeight: 'var(--hit-target)',
								fontWeight: 'var(--fw-semibold)',
								cursor: confirmDisabled ? 'not-allowed' : 'pointer',
							}}
						>
							{confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
