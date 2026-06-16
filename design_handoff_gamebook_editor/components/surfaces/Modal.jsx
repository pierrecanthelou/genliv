import React from 'react'

/**
 * Modal — a centered dialog with header, body, and a footer that
 * separates a destructive action (left) from cancel/confirm (right).
 * Used for the object editor and dangerous-action confirmations.
 */
export function Modal({ title, children, onClose, destructive, cancelLabel = 'Annuler', confirmLabel = 'Enregistrer', onCancel, onConfirm }) {
	return (
		<div
			style={{
				background: 'var(--surface-card)',
				border: '1px solid var(--border-card)',
				borderRadius: 'var(--r-3xl)',
				boxShadow: 'var(--shadow-modal)',
				overflow: 'hidden',
				width: '100%',
			}}
			role="dialog"
			aria-label={typeof title === 'string' ? title : undefined}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--line-4)' }}>
				<div style={{ fontSize: 'var(--fs-row)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{title}</div>
				<button type="button" onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'none', color: 'var(--ink-5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
			</div>
			<div style={{ padding: 16 }}>{children}</div>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--line-4)', background: 'var(--paper-1)' }}>
				<div>
					{destructive && (
						<button type="button" onClick={destructive.onClick} style={{ fontSize: 'var(--fs-sm)', color: 'var(--bad)', border: '1px solid var(--bad-line)', borderRadius: 'var(--r-lg)', padding: '8px 14px', background: 'none', cursor: 'pointer' }}>
							✕ {destructive.label}
						</button>
					)}
				</div>
				<div style={{ display: 'flex', gap: 8 }}>
					<button type="button" onClick={onCancel} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', border: '1px solid var(--border-field)', borderRadius: 'var(--r-lg)', padding: '8px 16px', background: 'none', cursor: 'pointer' }}>{cancelLabel}</button>
					<button type="button" onClick={onConfirm} style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-fg)', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-lg)', padding: '8px 18px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer' }}>{confirmLabel}</button>
				</div>
			</div>
		</div>
	)
}
