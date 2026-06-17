import {
	useBrain,
	useOpenBook,
	Field,
	TargetPicker,
	getNode,
	type ActionEditorContext,
	type PnjConfig,
	type PnjGift,
} from '../../../brain'
import { giftOf } from '../utils/gift'
import { GiftSection } from './GiftSection'

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
 */
export function PnjEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = getNode(book, nodeId)
	// Normalise once (default + gift migration) so every read and write share one shape.
	const pnj = node?.pnj ?? DEFAULT_PNJ
	const gift = giftOf(pnj)
	const nodes = book?.nodes ?? []

	function patchPnj(patch: Partial<PnjConfig>): void {
		// Write the canonical shape (migrated gift) so a legacy bare-object gift is
		// rewritten on the first edit; an undefined gift/target is dropped by JSON.
		const base: PnjConfig = { name: pnj.name, dialogue: pnj.dialogue, gift, target: pnj.target }
		books.updateNode(bookId, nodeId, { pnj: { ...base, ...patch } })
	}

	function handleGiftChange(next: PnjGift | undefined): void {
		patchPnj({ gift: next })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DU PNJ"
				value={pnj.name}
				placeholder="Le vieil ermite"
				onChange={(e) => patchPnj({ name: e.target.value })}
			/>
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
