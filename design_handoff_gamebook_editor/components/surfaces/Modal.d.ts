import React from 'react'

export interface ModalDestructiveAction {
	label: string
	onClick: () => void
}

export interface ModalProps {
	title: React.ReactNode
	children: React.ReactNode
	onClose?: () => void
	/** Left-aligned destructive action (e.g. "Supprimer l'objet"). */
	destructive?: ModalDestructiveAction
	cancelLabel?: string
	confirmLabel?: string
	onCancel?: () => void
	onConfirm?: () => void
}

export function Modal(props: ModalProps): JSX.Element
