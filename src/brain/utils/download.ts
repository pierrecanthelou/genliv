/**
 * Trigger a client-side file download of `data` serialised as pretty-printed
 * JSON (book-export). A browser side-effect util kept in brain/ because it is
 * feature-agnostic (any feature may export a file). It builds a Blob, points a
 * transient object URL at it, clicks a synthetic anchor, then REVOKES the URL so
 * it is not leaked (a created object URL lives until revoked or the document
 * unloads). No-op outside a DOM (SSR/tests without jsdom) — guards on `document`.
 */
export function downloadJson(filename: string, data: unknown): void {
	if (typeof document === 'undefined') return
	const json = JSON.stringify(data, null, 2)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	try {
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = filename
		anchor.rel = 'noopener'
		// Some browsers require the anchor to be in the document for the click to work.
		document.body.appendChild(anchor)
		anchor.click()
		document.body.removeChild(anchor)
	} finally {
		// Always release the object URL, even if the click throws.
		URL.revokeObjectURL(url)
	}
}

/**
 * Trigger a client-side file download of `content` as a plain-text file.
 * Same pattern as downloadJson but accepts a pre-formatted string (e.g. Markdown).
 */
export function downloadText(filename: string, content: string): void {
	if (typeof document === 'undefined') return
	const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
	const url = URL.createObjectURL(blob)
	try {
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = filename
		anchor.rel = 'noopener'
		document.body.appendChild(anchor)
		anchor.click()
		document.body.removeChild(anchor)
	} finally {
		URL.revokeObjectURL(url)
	}
}

/**
 * Slugify a title into a safe file base name — lowercase ASCII words joined by
 * hyphens, accents stripped, punctuation dropped. Falls back to `dossier` when
 * the title has no usable characters, so the download always has a name.
 *
 * Le repli disait `livre` tant que le seul téléchargement du produit était celui
 * d'un `Book` ; il devient `dossier` avec son PREMIER APPELANT RÉEL, le bouton
 * « Télécharger le fichier » de la bibliothèque de dossiers (n° 2, itération 1).
 * Un fichier nommé `livre.json` sortant d'un dossier d'aventure mentirait sur ce
 * qu'il contient, et c'est le seul nom que l'auteur verra si son titre ne porte
 * aucun caractère utilisable.
 */
export function slugifyFilename(title: string): string {
	const slug = title
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // strip combining diacritics
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
	return slug === '' ? 'dossier' : slug
}
