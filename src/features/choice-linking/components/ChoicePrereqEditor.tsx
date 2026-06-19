import { Toggle, type GameObject, type ChoicePrereq } from '../../../brain'

export interface ChoicePrereqEditorProps {
	/** The choice's current rule, or undefined when no prerequisite is set. */
	prereq: ChoicePrereq | undefined
	/** The book's acquirable-object catalog (collectObjects), referenced by id. */
	catalog: GameObject[]
	/** Persist a new rule, or null to clear it (toggle off). */
	onChange: (next: ChoicePrereq | null) => void
}

const UNNAMED = 'Objet sans nom'

/**
 * « Pré-requis caché » (§ 05) — a per-choice hidden-prerequisite rule: the choice
 * is hidden from the player unless they own the chosen object. References the
 * object by STABLE id from the derived catalog (KR-062), never by name. A
 * reference that no longer resolves (the object was deleted, or none is chosen
 * yet) is surfaced as « ⚠ objet introuvable », never silently treated as met.
 * Controlled — the owner persists every change via BookService.updateEdge.
 */
export function ChoicePrereqEditor({ prereq, catalog, onChange }: ChoicePrereqEditorProps): JSX.Element {
	const enabled = prereq !== undefined
	const selectedId = prereq?.objectId ?? ''
	const resolved = catalog.some((o) => o.id === selectedId)

	function toggle(on: boolean): void {
		// Toggling on starts unconfigured ('' id) so the author makes an explicit
		// choice; toggling off clears the rule entirely.
		onChange(on ? { objectId: '' } : null)
	}

	return (
		<div style={wrap}>
			<Toggle label="Pré-requis caché" checked={enabled} onChange={toggle} />
			{enabled &&
				(catalog.length === 0 ? (
					<p style={hint}>Aucun objet à exiger — ajoutez d’abord un objet à prendre, un don ou un butin.</p>
				) : (
					<>
						<select
							aria-label="Objet requis pour ce choix"
							value={selectedId}
							onChange={(e) => onChange({ objectId: e.target.value })}
							style={select}
						>
							<option value="">— Choisir l’objet requis…</option>
							{catalog.map((obj) => (
								<option key={obj.id} value={obj.id}>
									{obj.name.trim() === '' ? UNNAMED : obj.name}
								</option>
							))}
						</select>
						{!resolved && (
							<p style={warning} role="status">
								⚠ {selectedId === '' ? 'Aucun objet choisi' : 'Objet introuvable (supprimé)'}
							</p>
						)}
					</>
				))}
		</div>
	)
}

const wrap: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}

const select: React.CSSProperties = {
	width: '100%',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '7px 10px',
	background: 'var(--surface-sunken)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	minHeight: 'var(--hit-target)',
}

const hint: React.CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const warning: React.CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-meta)',
	color: 'var(--bad)',
}
