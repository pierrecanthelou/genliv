/**
 * L'ENTROPIE SEULE, sans préfixe ni séparateur : minuscules, chiffres et tirets.
 *
 * Extraite de `createId` parce qu'elle a désormais DEUX appelants réels — `createId`
 * lui-même et `createDossierId` (privé, `DossierService.ts`) —, ce qui en fait une
 * déduplication et non une abstraction à un seul consommateur. Le second ne peut pas
 * passer par `createId` : son `_` séparateur est refusé par la forme de l'identifiant
 * de dossier (`FORME_ID_DOSSIER`, `dossier/validate.ts`), qui devient une CLÉ DE
 * STOCKAGE telle quelle.
 *
 * Les deux branches respectent la même forme `[a-z0-9-]+` : `crypto.randomUUID()`
 * rend de l'hexadécimal minuscule tireté, et le repli concatène deux base 36
 * minuscules. Le repli existe pour les environnements sans `crypto.randomUUID`,
 * et il est exercé par un test qui neutralise la fonction.
 */
export function randomToken(): string {
	return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Collision-free, stable id generation (KR-003). Used for book ids,
 * node ids and edge ids — never derive ids from titles or names.
 * Cross-feature utility: lives in brain/utils, not a feature's utils (KR-110).
 */
export function createId(prefix = 'id'): string {
	return `${prefix}_${randomToken()}`
}
