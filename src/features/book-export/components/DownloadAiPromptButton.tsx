import type { JSX } from 'react'

/**
 * « Prompt IA ⬇ » — force-download of PROMPT_SCENE_IA.md, a ready-to-use
 * prompt for asking an AI to write a Genliv scenario (rules + bestiary + JSON
 * format). The file lives at /PROMPT_SCENE_IA.md (public/ in the Vite build).
 *
 * NOTE: if game rules, the bestiary, or the scenario JSON format change,
 * update public/PROMPT_SCENE_IA.md (and its copy at the repo root) accordingly.
 */
export function DownloadAiPromptButton(): JSX.Element {
	function handleDownload(): void {
		if (typeof document === 'undefined') return
		const anchor = document.createElement('a')
		anchor.href = '/PROMPT_SCENE_IA.md'
		anchor.download = 'PROMPT_SCENE_IA.md'
		anchor.rel = 'noopener'
		document.body.appendChild(anchor)
		anchor.click()
		document.body.removeChild(anchor)
	}

	return (
		<button
			type="button"
			onClick={handleDownload}
			style={button}
			title="Télécharger le prompt pour générer un scénario avec une IA"
		>
			<span aria-hidden="true">🤖</span> Prompt IA
		</button>
	)
}

const button: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	borderRadius: 'var(--r-md)',
	padding: '8px 12px',
	minHeight: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
	cursor: 'pointer',
	color: 'var(--text-label)',
	border: '1px solid var(--border-card)',
	background: 'var(--surface-card)',
}
