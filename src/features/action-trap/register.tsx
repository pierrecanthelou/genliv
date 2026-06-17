import { type ActionRegistry } from '../../brain'
import { TrapEditor } from './components/TrapEditor'

/**
 * Self-registration entry point (KR-051): the composition root calls this once
 * with the brain ActionRegistry so the « Piège » editor appears in node-editor's
 * « Action requise » control and mounts its body — without node-editor ever
 * importing this feature. Returns an unregister fn.
 */
export function registerActionTrap(actions: ActionRegistry): () => void {
	return actions.register({
		type: 'piege',
		label: 'Piège',
		render: (ctx) => <TrapEditor {...ctx} />,
	})
}
