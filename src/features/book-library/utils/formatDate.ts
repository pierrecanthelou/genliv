/** French month names, indexed 0–11 (matches the ISO month minus one). */
const MONTHS_FR = [
	'janvier',
	'février',
	'mars',
	'avril',
	'mai',
	'juin',
	'juillet',
	'août',
	'septembre',
	'octobre',
	'novembre',
	'décembre',
]

/**
 * Format an ISO timestamp as a French calendar date, e.g. « 17 juin 2026 ».
 * Reads the date portion of the ISO string directly (UTC, no Date parsing) so
 * the result is timezone-stable — the library only needs the day, not the time.
 * Returns an empty string for an unparseable value rather than throwing.
 */
export function formatDate(iso: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
	if (match === null) return ''
	const [, year, month, day] = match
	const monthName = MONTHS_FR[Number(month) - 1]
	if (monthName === undefined) return ''
	return `${Number(day)} ${monthName} ${year}`
}
