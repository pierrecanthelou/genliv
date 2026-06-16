import React from 'react'

/**
 * NodeBadge — the node-type mark + mono label used on tree cards,
 * outline rows, and the editor panel header. One mark per leaf kind.
 */
const MARKS = {
	sommaire: { borderRadius: 2, background: 'var(--ink-0)' },
	choix: { borderRadius: 2, border: '1.5px solid var(--ink-0)' },
	pnj: { borderRadius: '50%', border: '1.5px solid var(--ink-0)' },
	decor: { borderRadius: 2, border: '1.5px dashed var(--ink-0)' },
	monstre: { background: 'repeating-linear-gradient(45deg,var(--ink-0) 0 2px,transparent 2px 4px)' },
	fin: { border: '2px double var(--ink-0)' },
	mort: { background: 'repeating-linear-gradient(45deg,var(--ink-4) 0 1.5px,transparent 1.5px 3px)' },
}

const LABELS = {
	sommaire: 'SOMMAIRE',
	choix: 'CHOIX',
	pnj: 'PNJ',
	decor: 'DÉCOR',
	piege: 'PIÈGE',
	monstre: 'MONSTRE',
	fin: 'FIN',
	mort: 'MORT',
}

export function NodeBadge({ kind, label, selected = false }) {
	const accent = selected
	const text = label ?? LABELS[kind] ?? ''
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				fontFamily: 'var(--font-mono)',
				fontSize: 'var(--fs-eyebrow)',
				letterSpacing: '0.04em',
				color: accent ? 'var(--accent)' : 'var(--ink-2)',
				border: `1px solid ${accent ? 'var(--accent)' : 'var(--line-1)'}`,
				borderRadius: 'var(--r-lg)',
				padding: '3px 8px',
				background: 'var(--paper-0)',
			}}
		>
			<Mark kind={kind} selected={selected} />
			{text}
		</span>
	)
}

function Mark({ kind, selected }) {
	if (kind === 'piege') {
		return (
			<span
				style={{
					width: 0,
					height: 0,
					borderLeft: '5px solid transparent',
					borderRight: '5px solid transparent',
					borderBottom: '9px solid var(--ink-0)',
				}}
			/>
		)
	}
	const base = { width: 10, height: 10, flex: 'none' }
	const skin = selected ? { borderRadius: 2, background: 'var(--accent)' } : MARKS[kind] ?? {}
	return <span style={{ ...base, ...skin }} />
}
