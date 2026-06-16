import { type ActionRegistry } from '../../brain'
import { DecorEditor } from './components/DecorEditor'

/**
 * Self-registration entry point (KR-051): the composition root calls this once
 * with the brain ActionRegistry so the « Décor » editor appears in node-editor's
 * « Action requise » control and mounts its body — without node-editor ever
 * importing this feature. Returns an unregister fn.
 */
export function registerActionDecor(actions: ActionRegistry): () => void {
	return actions.register({
		type: 'decor',
		label: 'Décor',
		render: (ctx) => <DecorEditor {...ctx} />,
	})
}
