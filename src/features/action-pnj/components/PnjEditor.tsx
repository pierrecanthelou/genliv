import {
	useBrain,
	useOpenBook,
	Badge,
	Field,
	Stepper,
	TargetPicker,
	ImageUpload,
	getNode,
	nodeTitle,
	type ActionEditorContext,
	type PnjConfig,
	type PnjGift,
} from '../../../brain'
import { giftOf } from '../utils/gift'
import { collectPnjs, resolvePnj, isRefPnj } from '../utils/pnjCatalog'
import { GiftSection } from './GiftSection'
import { PnjPicker } from './PnjPicker'

/** The config a node falls back to before any PNJ is authored. */
const DEFAULT_PNJ: PnjConfig = { name: '', dialogue: '' }

/**
 * action-pnj — the « PNJ » required-action editor, mounted by node-editor via
 * the brain ActionRegistry (self-registered, KR-050/051; node-editor never
 * imports this feature). A VIEW over BookService (KR-020): it reads node.pnj live
 * via useOpenBook and writes through BookService.updateNode.
 *
 * Iteration 1 (§ 4A): the gift gains an effect (+PV / +Attaque / +Défense / objet
 * de scénario) with a value stepper — reusing the shared brain ObjectEditor for
 * its identity (KR-052) — plus a « ensuite le PNJ mène à » target. Every write
 * canonicalises through giftOf so the skeleton's bare-object gift migrates (KR-116).
 *
 * Iteration 2 (§ 4A identity): a RÔLE field for a richer identity, and a portrait
 * dropzone. The actual image UPLOAD is deferred project-wide (no image scope yet,
 * like node-editor's illustration), so the portrait ships as a disabled affordance.
 */
export function PnjEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = getNode(book, nodeId)
	// Normalise once (default + gift migration) so every read and write share one shape.
	const pnj = node?.pnj ?? DEFAULT_PNJ
	const gift = giftOf(pnj)
	const nodes = book?.nodes ?? []
	// Reusable PNJs in the book, excluding this node (a PNJ can't reference itself).
	const pnjCandidates = collectPnjs(book).filter((p) => p.nodeId !== nodeId)

	function patchPnj(patch: Partial<PnjConfig>): void {
		// Write the canonical shape (migrated gift) so a legacy bare-object gift is
		// rewritten on the first edit; an undefined gift/target/role/xp/portrait is dropped by JSON.
		const base: PnjConfig = {
			name: pnj.name,
			role: pnj.role,
			dialogue: pnj.dialogue,
			gift,
			target: pnj.target,
			xp: pnj.xp,
			portrait: pnj.portrait,
		}
		books.updateNode(bookId, nodeId, { pnj: { ...base, ...patch } })
	}

	function handleGiftChange(next: PnjGift | undefined): void {
		patchPnj({ gift: next })
	}

	// « Choisir dans le livre » (iter 3): reuse an existing PNJ by its owner node id
	// (the stable PNJ id), excluding this node so a PNJ can't reference itself.
	function reusePnj(ownerNodeId: string): void {
		books.updateNode(bookId, nodeId, { pnj: { pnjRef: ownerNodeId, name: '', dialogue: '' } })
	}

	function detachPnj(): void {
		books.updateNode(bookId, nodeId, { pnj: { name: '', dialogue: '' } })
	}

	// A reference REUSES another node's PNJ — resolve its identity live (KR-020) and
	// render it read-only here; the PNJ is edited on its origin node (single source).
	if (isRefPnj(pnj)) {
		const resolved = resolvePnj(book, node)
		const owner = pnj.pnjRef !== undefined ? getNode(book, pnj.pnjRef) : null
		const resolvedGift = resolved !== null ? giftOf(resolved) : undefined
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
				<div style={reuseHeader}>
					<Badge tone={resolved !== null ? 'muted' : 'bad'}>réutilisé</Badge>
					{owner !== null && <span style={ownerNote}>défini sur « {nodeTitle(owner)} »</span>}
				</div>
				{resolved !== null ? (
					<div style={resolvedCard}>
						<span style={resolvedName}>{resolved.name.trim() === '' ? 'PNJ sans nom' : resolved.name}</span>
						{resolved.role !== undefined && resolved.role.trim() !== '' && (
							<span style={resolvedMeta}>{resolved.role}</span>
						)}
						{resolved.dialogue.trim() !== '' && <p style={resolvedDialogue}>« {resolved.dialogue} »</p>}
						{resolvedGift !== undefined && (
							<span style={resolvedMeta}>Donne : {resolvedGift.object.name || 'objet'}</span>
						)}
					</div>
				) : (
					<p style={{ margin: 0, color: 'var(--bad)', fontSize: 'var(--fs-meta)' }}>
						⚠ PNJ introuvable — le PNJ d’origine n’existe plus.
					</p>
				)}
				<button type="button" onClick={detachPnj} style={detachButton}>
					Ne plus réutiliser — créer un PNJ propre
				</button>
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			{pnjCandidates.length > 0 && <PnjPicker candidates={pnjCandidates} onPick={reusePnj} />}
			<Field
				label="NOM DU PNJ"
				value={pnj.name}
				placeholder="Le vieil ermite"
				onChange={(e) => patchPnj({ name: e.target.value })}
			/>
			<Field
				label="RÔLE"
				hint="optionnel"
				value={pnj.role ?? ''}
				placeholder="Marchand, gardien du seuil…"
				onChange={(e) => patchPnj({ role: e.target.value })}
			/>
			<section>
				<ImageUpload label="Portrait du PNJ" value={pnj.portrait} onChange={(url) => patchPnj({ portrait: url })} />
			</section>
			<Field
				label="DIALOGUE"
				hint="lu par le joueur"
				multiline
				rows={3}
				value={pnj.dialogue}
				placeholder="« Approche, voyageur. J’ai gardé ceci pour toi… »"
				onChange={(e) => patchPnj({ dialogue: e.target.value })}
			/>
			<GiftSection gift={gift} onChange={handleGiftChange} />
			<Stepper label="XP attribué" value={pnj.xp ?? 0} min={0} max={5} onChange={(xp) => patchPnj({ xp })} />
			<TargetPicker
				label="Ensuite, le PNJ mène à"
				emptyLabel="Aucune suite — fin de l’échange"
				nodes={nodes}
				nodeId={nodeId}
				target={pnj.target}
				onChange={(target) => patchPnj({ target })}
			/>
		</div>
	)
}

const reuseHeader: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
}

const ownerNote: React.CSSProperties = {
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
}

const resolvedCard: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
	border: '1px solid var(--border-subtle)',
	borderRadius: 'var(--r-lg)',
	background: 'var(--surface-sunken)',
	padding: 'var(--space-5)',
}

const resolvedName: React.CSSProperties = {
	fontSize: 'var(--fs-row)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}

const resolvedMeta: React.CSSProperties = {
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}

const resolvedDialogue: React.CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	fontStyle: 'italic',
}

const detachButton: React.CSSProperties = {
	alignSelf: 'flex-start',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--accent)',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
}
