import { type ActionRegistry } from '../../brain'
import { MonsterEditor } from './components/MonsterEditor'

/**
 * Self-registration entry point (KR-051): the composition root calls this once
 * with the brain ActionRegistry so the « Monstre » editor appears in node-editor's
 * « Action requise » control and mounts its body — without node-editor ever
 * importing this feature. Returns an unregister fn.
 */
export function registerActionMonster(actions: ActionRegistry): () => void {
	return actions.register({
		type: 'monstre',
		label: 'Monstre',
		render: (ctx) => <MonsterEditor {...ctx} />,
	})
}
