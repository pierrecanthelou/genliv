import { buildOutline, computeVisibleRows } from '../utils/buildOutline'
import type { Book, BookNode, Edge } from '../../../brain'

const n = (id: string, kind: BookNode['kind'] = 'choix'): BookNode => ({ id, kind, text: '' })
const e = (id: string, from: string, to: string, kind: Edge['kind'] = 'choice'): Edge => ({ id, from, to, kind })
const book = (nodes: BookNode[], edges: Edge[]): Book => ({
	id: 'b',
	title: 'T',
	createdAt: '',
	updatedAt: '',
	nodes,
	edges,
})

describe('buildOutline', () => {
	it('nests choice children under the root with increasing depth', () => {
		const b = book([n('s', 'sommaire'), n('a'), n('c')], [e('e1', 's', 'a'), e('e2', 'a', 'c')])
		const rows = buildOutline(b)
		expect(rows.map((r) => [r.targetId, r.depth, r.reference])).toEqual([
			['s', 0, false],
			['a', 1, false],
			['c', 2, false],
		])
	})

	it('renders a relink edge as a reference row without recursing', () => {
		const b = book([n('s', 'sommaire'), n('a')], [e('e1', 's', 'a'), e('e2', 'a', 's', 'relink')])
		const rows = buildOutline(b)
		// s(0), a(1), then ↪ relink back to s (reference, depth 2) — s shown once as a real row.
		expect(rows.filter((r) => r.targetId === 's' && !r.reference)).toHaveLength(1)
		const ref = rows.find((r) => r.reference)
		expect(ref).toMatchObject({ targetId: 's', via: 'relink', depth: 2 })
	})

	it('guards a choice cycle (back-edge becomes a reference, no infinite loop)', () => {
		const b = book([n('s', 'sommaire'), n('a')], [e('e1', 's', 'a'), e('e2', 'a', 's')])
		const rows = buildOutline(b)
		expect(rows.filter((r) => !r.reference)).toHaveLength(2) // s + a once each
		expect(rows.some((r) => r.reference && r.targetId === 's')).toBe(true)
	})

	it('lists nodes unreachable from the root flat at depth 0 (the isolated mort)', () => {
		const b = book([n('s', 'sommaire'), n('m', 'mort')], [])
		const rows = buildOutline(b)
		expect(rows.map((r) => [r.targetId, r.depth, r.reference])).toEqual([
			['s', 0, false],
			['m', 0, false],
		])
	})

	it('flags a dangling edge target as a reference row with a null node (KR-021)', () => {
		const b = book([n('s', 'sommaire')], [e('e1', 's', 'ghost', 'relink')])
		const rows = buildOutline(b)
		const ref = rows.find((r) => r.reference)
		expect(ref).toMatchObject({ targetId: 'ghost', node: null })
	})

	it('shows a convergent node once as a real row and once as a reference', () => {
		const b = book(
			[n('s', 'sommaire'), n('a'), n('x'), n('c')],
			[e('e1', 's', 'a'), e('e2', 's', 'x'), e('e3', 'a', 'c'), e('e4', 'x', 'c')],
		)
		const rows = buildOutline(b)
		expect(rows.filter((r) => r.targetId === 'c' && !r.reference)).toHaveLength(1)
		expect(rows.filter((r) => r.targetId === 'c' && r.reference)).toHaveLength(1)
	})
})

describe('computeVisibleRows (expand/collapse)', () => {
	const tree = book(
		[n('s', 'sommaire'), n('a'), n('c'), n('b')],
		[e('e1', 's', 'a'), e('e2', 'a', 'c'), e('e3', 's', 'b')],
	)
	// Outline order: s(0) → a(1) → c(2), then b(1).

	it('marks a row with a nested child as hasChildren, leaves as not', () => {
		const visible = computeVisibleRows(buildOutline(tree), new Set())
		const byId = new Map(visible.map((v) => [v.row.targetId, v]))
		expect(byId.get('s')?.hasChildren).toBe(true)
		expect(byId.get('a')?.hasChildren).toBe(true)
		expect(byId.get('c')?.hasChildren).toBe(false)
		expect(byId.get('b')?.hasChildren).toBe(false)
	})

	it('collapsing a node hides its whole subtree but keeps later siblings', () => {
		const visible = computeVisibleRows(buildOutline(tree), new Set(['a']))
		const ids = visible.map((v) => v.row.targetId)
		// a is shown (collapsed), its child c is hidden, sibling b still shows.
		expect(ids).toEqual(['s', 'a', 'b'])
		expect(visible.find((v) => v.row.targetId === 'a')?.collapsed).toBe(true)
	})

	it('collapsing the root hides every descendant', () => {
		const visible = computeVisibleRows(buildOutline(tree), new Set(['s']))
		expect(visible.map((v) => v.row.targetId)).toEqual(['s'])
	})

	it('a reference row is never collapsible (it is a leaf)', () => {
		const b = book([n('s', 'sommaire'), n('a')], [e('e1', 's', 'a'), e('e2', 'a', 's', 'relink')])
		const visible = computeVisibleRows(buildOutline(b), new Set())
		const ref = visible.find((v) => v.row.reference)
		expect(ref?.hasChildren).toBe(false)
	})
})
