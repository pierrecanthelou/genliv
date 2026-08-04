/**
 * Le GEL EN PROFONDEUR d'un dossier validé.
 *
 * Ce fichier est le SEUL du dépôt où `Object.freeze` apparaît pour le dossier, et
 * `deepFreeze` n'a qu'un seul site d'appel : la sortie de `validateDossier`,
 * quand elle réussit (KR-166). Ce n'est pas une coquetterie de style — un second
 * site de gel, ou un gel posé ailleurs qu'à la frontière de validation, rendrait
 * indécidable la question « ce document a-t-il été validé ? », et une écriture du
 * Temps 2 sur le dossier passerait inaperçue : la reproductibilité par graine
 * tomberait sans bruit.
 *
 * Toute écriture ultérieure CLONE avant de muter. Le dossier est en lecture seule
 * dès l'import.
 */

/**
 * Gèle `value` et tout ce qu'elle contient, en place, puis la renvoie. Les
 * tableaux sont gelés comme les objets. Un cycle éventuel est traversé une seule
 * fois (le document vient d'un `JSON.parse`, donc acyclique — la garde est là
 * pour que la fonction reste totale si on l'appelle un jour sur autre chose).
 */
export function deepFreeze<T>(value: T): Readonly<T> {
	geler(value, new WeakSet<object>())
	return value as Readonly<T>
}

function geler(value: unknown, vus: WeakSet<object>): void {
	if (value === null || typeof value !== 'object') return
	if (vus.has(value)) return
	vus.add(value)
	for (const enfant of Object.values(value)) geler(enfant, vus)
	Object.freeze(value)
}
