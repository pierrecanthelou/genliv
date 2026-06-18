import { createId, type GameObject } from '../../../brain'

/**
 * A fresh, empty loot object with a stable id minted once (KR-003). Seeded when
 * the author toggles « le monstre lâche un butin » on; its name + player-facing
 * description are then authored through the shared brain ObjectEditor (KR-052).
 */
export function blankLoot(): GameObject {
	return { id: createId('obj'), name: '', description: '' }
}
