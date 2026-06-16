import { type ActionRegistry } from '../../brain'
import { PnjEditor } from './components/PnjEditor'

/**
 * Self-registration entry point (KR-051): the composition root calls this once
 * with the brain ActionRegistry so the « PNJ » editor appears in node-editor's
 * « Action requise » control and mounts its body — without node-editor ever
 * importing this feature. Returns an unregister fn.
 */
export function registerActionPnj(actions: ActionRegistry): () => void {
	return actions.register({
		type: 'pnj',
		label: 'PNJ',
		render: (ctx) => <PnjEditor {...ctx} />,
	})
}
