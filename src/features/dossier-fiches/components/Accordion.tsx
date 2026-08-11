import { useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Accordion — un seul emplacement ouvert à la fois, parmi une liste de blocs
 * (§3 du plan d'itération 1 de `dossier-fiches`). Composant NEUF, LOCAL à
 * cette feature — un seul consommateur (`FichePersonnage.tsx`), jamais promu
 * à `brain/components/` avant un second appelant réel (KR-109).
 *
 * État interne `useState<string>(defaultOpenId)` — JAMAIS un `useEffect` de
 * resynchronisation (KR-013/113). Le retour au premier bloc quand la fiche
 * change de personnage est la responsabilité du PARENT : poser
 * `key={personnage.id}` sur `<Accordion>` force un remontage React, qui
 * réinitialise cet état à `defaultOpenId` sans effet.
 *
 * Cliquer un en-tête ouvre TOUJOURS ce bloc (jamais un bascule vers « aucun
 * bloc ouvert ») — « un seul bloc ouvert à la fois » se lit comme EXACTEMENT
 * un, pas zéro ou un.
 *
 * Le contenu des blocs FERMÉS reste monté dans le DOM (`display: 'none'`),
 * jamais démonté : un test qui compte les emplacements vides du bloc 1 à 8
 * doit pouvoir les lire en un seul rendu, sans dérouler chaque bloc un par un.
 */
export interface AccordionSection {
	id: string
	title: string
	content: ReactNode
}

export interface AccordionProps {
	sections: AccordionSection[]
	defaultOpenId: string
}

export function Accordion({ sections, defaultOpenId }: AccordionProps): JSX.Element {
	const [openId, setOpenId] = useState<string>(defaultOpenId)

	return (
		<div style={racineStyle}>
			{sections.map((section, index) => {
				const ouvert = section.id === openId
				return (
					<div key={section.id}>
						<button
							type="button"
							onClick={() => setOpenId(section.id)}
							aria-expanded={ouvert}
							style={index === 0 ? enTeteStyle : { ...enTeteStyle, borderTop: '1px solid var(--border-divider)' }}
						>
							<span style={titreStyle}>{section.title}</span>
							<span style={fantomeStyle}>
								<span aria-hidden="true" style={ouvert ? chevronOuvertStyle : chevronFermeStyle}>
									▾
								</span>
							</span>
						</button>
						<div style={ouvert ? contenuOuvertStyle : contenuFermeStyle}>{section.content}</div>
					</div>
				)
			})}
		</div>
	)
}

const racineStyle: CSSProperties = {
	overflow: 'hidden',
	borderRadius: 'var(--r-3xl)',
	border: '1px solid var(--border-subtle)',
}

const enTeteStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	width: '100%',
	boxSizing: 'border-box',
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-4) var(--space-5)',
	border: 'none',
	background: 'none',
	textAlign: 'left',
	cursor: 'pointer',
	fontFamily: 'var(--font-ui)',
}

const fantomeStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
}

const titreStyle: CSSProperties = {
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}

const chevronBaseStyle: CSSProperties = {
	color: 'var(--text-muted)',
	fontSize: 'var(--fs-meta)',
	lineHeight: 1,
}

const chevronFermeStyle: CSSProperties = { ...chevronBaseStyle, transform: 'rotate(-90deg)' }
const chevronOuvertStyle: CSSProperties = { ...chevronBaseStyle, transform: 'rotate(0deg)' }

const contenuOuvertStyle: CSSProperties = {
	padding: 'var(--space-5)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

const contenuFermeStyle: CSSProperties = {
	display: 'none',
}
