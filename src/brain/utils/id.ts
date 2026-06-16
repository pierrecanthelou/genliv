/**
 * Collision-free, stable id generation (KR-003). Used for book ids,
 * node ids and edge ids — never derive ids from titles or names.
 * Cross-feature utility: lives in brain/utils, not a feature's utils (KR-110).
 */
export function createId(prefix = 'id'): string {
	const uuid =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
	return `${prefix}_${uuid}`
}
