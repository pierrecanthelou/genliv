import { SLOT_NODE_EDITOR_CHOICES, type SlotRegistry } from '../../brain'
import { OutgoingChoices } from './components/OutgoingChoices'

/**
 * Self-registration entry point: the composition root calls this once with the
 * brain SlotRegistry so choice-linking fills node-editor's choices slot,
 * without node-editor ever importing this feature. Returns an unregister fn.
 */
export function registerChoiceLinking(slots: SlotRegistry): () => void {
	return slots.register(SLOT_NODE_EDITOR_CHOICES, (ctx) => <OutgoingChoices {...ctx} />)
}
