/**
 * French pluralisation of a noun by count: 0 and 1 take the singular, 2+ the
 * plural (the opposite of English, hence a shared helper rather than ad-hoc
 * `n > 1 ? …` ternaries). The plural defaults to `singular + 's'`; pass an
 * explicit form for irregulars. Returns the word only — the caller composes
 * the count, e.g. `${n} ${plural(n, 'écran')}`.
 */
export function plural(count: number, singular: string, pluralForm: string = `${singular}s`): string {
	return Math.abs(count) > 1 ? pluralForm : singular
}
