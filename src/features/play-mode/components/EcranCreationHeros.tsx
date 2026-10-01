import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { creerRng, CHARACTERISTICS, CHARACTERISTIC_VALUES } from '../../../brain'
import {
	rollCreationPool,
	emptyAssignment,
	isAssignmentComplete,
	baseValue,
	totalValue,
	buildHeroFromCreation,
	CREATION_CAP,
	type CreationPool,
} from '../../../player/engine/charCreation'
import { Field } from '../../../brain/components'
import type { HeroState } from '../../../player/types'
import type { Characteristic } from '../../../brain/characteristics'

/**
 * ÉCRAN DE CRÉATION DE HÉROS — Pool de 8 dés (2D4 par caractéristique) + 1 bonus (1D4).
 * Geste à deux temps : cliquer un dé pour le sélectionner, puis une caractéristique pour l'assigner.
 *
 * `graine` — alimente `creerRng(graine, 'heros', indice)` où indice ∈ {0, 1}.
 * `onValider` — appelé avec le `HeroState` construit et prêt à écrire en session.
 *
 * Zéro `Math.random` : seul le RNG keyé par graine/domaine/indice est appelé.
 */

const TITRE = 'Créez votre héros'
const INSTRUCTION = "Choisissez un lancer, puis cliquez une caractéristique pour l'assigner."
const LABEL_NOM = 'Nom'
const PLACEHOLDER_NOM = 'Aldric le Téméraire'
const LABEL_BONUS = 'Bonus 1D4'
const TEXTE_BONUS_RESTE = 'point(s) restant(s)'
const TEXTE_BONUS_COMPLET = '✓ tout distribué'
const BOUTON_RELANCER_INITIAL = '⟳ Relancer'
const BOUTON_RELANCER_UTILISEE = '⟳ Relancer (utilisée)'
const BOUTON_VALIDER = 'Valider →'

export interface EcranCreationHerosProps {
	readonly graine: number
	readonly onValider: (heros: HeroState) => void
}

export function EcranCreationHeros({ graine, onValider }: EcranCreationHerosProps): JSX.Element {
	const [nom, setNom] = useState('')
	const [pool, setPool] = useState<CreationPool>(() => {
		const rng = creerRng(graine, 'heros', 0)
		return rollCreationPool(rng)
	})
	const [assignment, setAssignment] = useState(emptyAssignment)
	const [relanceeUtilisee, setRelanceeUtilisee] = useState(false)
	const [deSelectionnne, setDeSelectionne] = useState<number | null>(null)
	const nomRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		nomRef.current?.focus()
	}, [])

	const bonusRestant = pool.bonusPool - CHARACTERISTIC_VALUES.reduce((s, c) => s + assignment.bonus[c], 0)
	const complet = isAssignmentComplete(pool, assignment)

	// Indice du dé sélectionné, ou -1 si aucun
	const deIndexSelectionne = deSelectionnne ?? -1

	function handleClickDe(indexDe: number): void {
		// Sélectionne ou désélectionne le dé
		setDeSelectionne(deIndexSelectionne === indexDe ? null : indexDe)
	}

	function handleClickCarac(carac: Characteristic): void {
		// Assigne le dé sélectionné à cette caractéristique
		if (deIndexSelectionne !== -1 && assignment.rollIndices[carac] === -1) {
			setAssignment((prev) => ({
				...prev,
				rollIndices: {
					...prev.rollIndices,
					[carac]: deIndexSelectionne,
				},
			}))
			// Désélectionne le dé après assignation
			setDeSelectionne(null)
		}
	}

	function handleAjouterBonus(carac: Characteristic): void {
		if (bonusRestant > 0 && totalValue(pool, assignment, carac) < CREATION_CAP) {
			setAssignment((prev) => ({
				...prev,
				bonus: {
					...prev.bonus,
					[carac]: prev.bonus[carac] + 1,
				},
			}))
		}
	}

	function handleRetrerBonus(carac: Characteristic): void {
		if (assignment.bonus[carac] > 0) {
			setAssignment((prev) => ({
				...prev,
				bonus: {
					...prev.bonus,
					[carac]: prev.bonus[carac] - 1,
				},
			}))
		}
	}

	function handleRelancer(): void {
		if (!relanceeUtilisee) {
			const rng = creerRng(graine, 'heros', 1)
			setPool(rollCreationPool(rng))
			setAssignment(emptyAssignment())
			setDeSelectionne(null)
			setRelanceeUtilisee(true)
		}
	}

	function handleValider(): void {
		if (complet) {
			const heros = buildHeroFromCreation(nom, pool, assignment)
			onValider(heros)
		}
	}

	function handleKeyDown(e: React.KeyboardEvent): void {
		if (e.key === 'Enter' && complet) {
			handleValider()
		}
	}

	return (
		<div style={racine}>
			<div style={contenu}>
				<h1 style={titre}>{TITRE}</h1>
				<p style={instruction}>{INSTRUCTION}</p>

				<div style={grille}>
					{/* Champ Nom */}
					<Field
						id="hero-name"
						label={LABEL_NOM}
						value={nom}
						placeholder={PLACEHOLDER_NOM}
						mono
						autoFocus
						inputRef={nomRef}
						onChange={(e) => setNom(e.target.value)}
						onKeyDown={handleKeyDown}
					/>

					{/* Affichage du pool de dés */}
					<div style={sectionDes}>
						<label style={labelSection}>Lancers disponibles</label>
						<div style={grilleDesN}>
							{pool.rolls.map((valeur, idx) => {
								const estAssigne = CHARACTERISTIC_VALUES.some((c) => assignment.rollIndices[c] === idx)
								const estSelectionne = deIndexSelectionne === idx
								return (
									<button
										key={idx}
										type="button"
										onClick={() => handleClickDe(idx)}
										disabled={estAssigne}
										style={{
											...styleDe,
											...(estAssigne
												? {
														background: 'var(--surface-sunken)',
														color: 'var(--text-disabled)',
														cursor: 'not-allowed',
													}
												: estSelectionne
													? {
															background: 'var(--accent)',
															color: 'var(--text-on-accent)',
															cursor: 'pointer',
														}
													: {
															background: 'var(--accent-bg)',
															color: 'var(--accent)',
															cursor: 'pointer',
														}),
										}}
										aria-pressed={estSelectionne}
										aria-label={`Lancer ${valeur + 2}`}
									>
										{valeur}
									</button>
								)
							})}
						</div>
					</div>

					{/* Compteur bonus */}
					<div style={sectionBonus}>
						<label style={labelSection}>
							{LABEL_BONUS} : {bonusRestant > 0 ? `${bonusRestant} ${TEXTE_BONUS_RESTE}` : TEXTE_BONUS_COMPLET}
						</label>
					</div>

					{/* Tableau des caractéristiques */}
					<div style={sectionCaracs}>
						<label style={labelSection}>Caractéristiques</label>
						<table style={tableCaracs}>
							<thead style={theadCaracs}>
								<tr>
									<th style={thCaracs}>Carac</th>
									<th style={thCaracs}>Base</th>
									<th style={thCaracs}>Bonus</th>
									<th style={thCaracs}>Total</th>
									<th style={thCaracs}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{CHARACTERISTIC_VALUES.map((carac: Characteristic) => {
									const base = baseValue(pool, assignment.rollIndices[carac])
									const bonus = assignment.bonus[carac]
									const total = totalValue(pool, assignment, carac)
									const nonAssigne = assignment.rollIndices[carac] === -1
									const peutAssigner = deIndexSelectionne !== -1 && nonAssigne
									return (
										<tr key={carac} style={trCaracs}>
											<td style={tdCaracs}>
												<button
													type="button"
													onClick={() => handleClickCarac(carac)}
													disabled={!peutAssigner}
													style={{
														...boutonCarac,
														opacity: peutAssigner ? 1 : 0.6,
														cursor: peutAssigner ? 'pointer' : 'not-allowed',
													}}
													aria-label={`Assigner à ${CHARACTERISTICS[carac].label}`}
												>
													<strong>{CHARACTERISTICS[carac].label}</strong>
												</button>
											</td>
											<td style={tdCaracs}>{nonAssigne ? '—' : base}</td>
											<td style={tdCaracs}>{bonus}</td>
											<td style={tdCaracs}>{nonAssigne ? '—' : total}</td>
											<td style={tdCaracs}>
												<div style={divBoutons}>
													<button
														type="button"
														onClick={() => handleAjouterBonus(carac)}
														disabled={bonusRestant === 0 || total >= CREATION_CAP}
														style={boutonBonusSmall}
													>
														+
													</button>
													<button
														type="button"
														onClick={() => handleRetrerBonus(carac)}
														disabled={bonus === 0}
														style={boutonBonusSmall}
													>
														−
													</button>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>

					{/* Boutons d'action */}
					<div style={sectionBoutons}>
						<button
							type="button"
							onClick={handleRelancer}
							disabled={relanceeUtilisee}
							style={{
								...boutonAction,
								opacity: relanceeUtilisee ? 0.5 : 1,
								cursor: relanceeUtilisee ? 'not-allowed' : 'pointer',
							}}
						>
							{relanceeUtilisee ? BOUTON_RELANCER_UTILISEE : BOUTON_RELANCER_INITIAL}
						</button>
						<button
							type="button"
							onClick={handleValider}
							disabled={!complet}
							style={{
								...boutonAction,
								...(complet ? { background: 'var(--accent)', color: 'var(--text-on-accent)' } : {}),
								opacity: complet ? 1 : 0.5,
								cursor: complet ? 'pointer' : 'not-allowed',
							}}
						>
							{BOUTON_VALIDER}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

const racine: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 'var(--space-8)',
	minHeight: '100%',
}

const contenu: CSSProperties = {
	width: '100%',
	maxWidth: 640,
}

const titre: CSSProperties = {
	margin: '0 0 var(--space-6) 0',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-h2)',
	color: 'var(--text-strong)',
}

const instruction: CSSProperties = {
	margin: '0 0 var(--space-10) 0',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}

const grille: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-8)',
}

const sectionDes: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const sectionBonus: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const sectionCaracs: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

const sectionBoutons: CSSProperties = {
	display: 'flex',
	gap: 'var(--space-4)',
	justifyContent: 'flex-end',
}

const labelSection: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-label)',
	color: 'var(--text-label)',
	display: 'block',
}

const grilleDesN: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(4, 1fr)',
	gap: 'var(--space-3)',
}

const styleDe: CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-3)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-subtle)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	fontWeight: 'bold',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
}

const tableCaracs: CSSProperties = {
	width: '100%',
	borderCollapse: 'collapse',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
}

const theadCaracs: CSSProperties = {
	background: 'var(--surface-sunken)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
}

const thCaracs: CSSProperties = {
	padding: 'var(--space-3)',
	textAlign: 'left',
	color: 'var(--text-label)',
	fontWeight: 'normal',
}

const trCaracs: CSSProperties = {
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
}

const tdCaracs: CSSProperties = {
	padding: 'var(--space-3)',
	color: 'var(--text-body)',
}

const boutonCarac: CSSProperties = {
	background: 'transparent',
	border: 'none',
	color: 'inherit',
	padding: 0,
	fontFamily: 'inherit',
	fontSize: 'inherit',
	cursor: 'pointer',
	textAlign: 'left',
}

const divBoutons: CSSProperties = {
	display: 'flex',
	gap: 'var(--space-2)',
}

const boutonBonusSmall: CSSProperties = {
	padding: 'var(--space-1) var(--space-3)',
	minHeight: 'auto',
	minWidth: 'auto',
	borderRadius: 'var(--r-sm)',
	border: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-label)',
	cursor: 'pointer',
}

const boutonAction: CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	cursor: 'pointer',
}
