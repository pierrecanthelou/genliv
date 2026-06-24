/**
 * Cross-feature presentational primitives (KR-109). Any component consumed
 * by more than one feature lives here and is re-exported from this barrel —
 * never imported from a sibling feature.
 */
export { NodeBadge, type NodeBadgeProps } from './NodeBadge'
export { Badge, type BadgeProps, type BadgeTone } from './Badge'
export { IconButton, type IconButtonProps, type IconButtonTone } from './IconButton'
export { Card, type CardProps } from './Card'
export { Field, type FieldProps } from './Field'
export { Modal, type ModalProps, type ModalDestructiveAction } from './Modal'
export { Toggle, type ToggleProps } from './Toggle'
export { SegmentedControl, type SegmentedControlProps, type SegmentedOption } from './SegmentedControl'
export { EditorTopBar, type EditorTopBarProps, type EditorViewMode } from './EditorTopBar'
export { ObjectEditor, type ObjectEditorProps, type ObjectDraft } from './ObjectEditor'
export { OutcomesEditor, type OutcomesEditorProps } from './OutcomesEditor'
export { Stepper, type StepperProps } from './Stepper'
export { TargetPicker, type TargetPickerProps } from './TargetPicker'
export { Select, type SelectProps, type SelectOption } from './Select'
export { ImageUpload, type ImageUploadProps } from './ImageUpload'
