import { Toggle, type GameObject, type ChoicePrereq } from '../../../brain'

export interface ChoicePrereqEditorProps {
	/** The choice's current rule, or undefined when no prerequisite is set. */
	prereq: ChoicePrereq | undefined
	/**
	 * The objects OFFERED in the picker — only those collectable in this node's
	 * lineage (collectLineageObjects, KR-118): the player can only own an object
	 * they could have found on the path that reached this screen.
	 */
	options: GameObject[]
	/**
	 * The whole-book catalog (collectObjects), used to RESOLVE an already-set
	 * reference: an object that exists but lies outside the lineage must still be
	 * named/selectable (not shown as deleted), while a truly missing id is dangling.
	 */
	catalog: GameObject[]
	/** Persist a new rule, or null to clear it (toggle off). */
	onChange: (next: ChoicePrereq | null) => void
}

const UNNAMED = 'Objet sans nom'

/**
 * « Pré-requis caché » (§ 05) — a per-choice hidden-prerequisite rule: the choice
 * is hidden from the player unless they own the chosen object. The picker offers
 * only objects collectable in the node's LINEAGE (KR-118) — a player can require
 * an object only if they could have found it on the path that reached this
 * screen. References the object by STABLE id (KR-062), never by name. A reference
 * that no longer resolves anywhere in the book (the object was deleted, or none
 * is chosen yet) is surfaced as « ⚠ introuvable », never silently treated as met;
 * a reference that resolves but lies OUTSIDE the lineage is kept selectable and
 * flagged « ⓘ hors lignée » so narrowing never silently drops an authored rule.
 * Controlled — the owner persists every change via BookService.updateEdge.
 */
export function ChoicePrereqEditor({ prereq, options, catalog, onChange }: ChoicePrereqEditorProps): JSX.Element {
	const enabled = prereq !== undefined
	const selectedId = prereq?.objectId ?? ''
	// Resolution is against the WHOLE book so an out-of-lineage reference is not
	// mistaken for a deleted one; lineage membership drives the « hors lignée » note.
	const selected = selectedId === '' ? undefined : catalog.find((o) => o.id === selectedId)
	const resolved = selected !== undefined
	const inLineage = options.some((o) => o.id === selectedId)
	// The dropdown lists the lineage objects, plus the current selection when it
	// resolves but is out of lineage — so an already-authored rule stays visible
	// and selectable instead of vanishing when the picker narrows.
	const list = resolved && !inLineage && selected !== undefined ? [...options, selected] : options

	function toggle(on: boolean): void {
		// Toggling on starts unconfigured ('' id) so the author makes an explicit
		// choice; toggling off clears the rule entirely.
		onChange(on ? { objectId: '' } : null)
	}

	return (
		<div style={wrap}>
			<Toggle label="Pré-requis caché" checked={enabled} onChange={toggle} />
			{enabled &&
				// Show the empty-state hint only when there is nothing to act on — no
				// lineage objects AND no reference already set; a dangling/out-of-lineage
				// reference still renders the picker + its message so it is never hidden.
				(list.length === 0 && selectedId === '' ? (
					<p style={hint}>
						{catalog.length === 0
							? 'Aucun objet à exiger — ajoutez d’abord un objet à prendre, un don ou un butin.'
							: 'Aucun objet trouvable dans la lignée menant à cet écran — le joueur ne peut rien posséder ici.'}
					</p>
				) : (
					<>
						<select
							aria-label="Objet requis pour ce choix"
							value={selectedId}
							onChange={(e) => onChange({ objectId: e.target.value })}
							style={select}
						>
							<option value="">— Choisir l’objet requis…</option>
							{list.map((obj) => (
								<option key={obj.id} value={obj.id}>
									{obj.name.trim() === '' ? UNNAMED : obj.name}
								</option>
							))}
						</select>
						{!resolved ? (
							<p style={warning} role="status">
								⚠ {selectedId === '' ? 'Aucun objet choisi' : 'Objet introuvable (supprimé)'}
							</p>
						) : (
							!inLineage && (
								<p style={note} role="status">
									ⓘ Cet objet n’apparaît pas dans la lignée de cet écran — le joueur risque de ne jamais l’avoir.
								</p>
							)
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

const note: React.CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}
