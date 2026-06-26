import { buildColumnNodes, findChoicePath } from '../utils/buildColumnNodes'
import type { Book, BookNode, Edge } from '../../../brain'

// ---------------------------------------------------------------------------
// Helpers to build minimal Book fixtures
// ---------------------------------------------------------------------------

function node(id: string, kind: BookNode['kind'] = 'choix'): BookNode {
	return { id, kind, text: '' }
}

function monsterNode(id: string, victoryTarget?: string, fleeTarget?: string): BookNode {
	return {
		id,
		kind: 'monstre',
		text: '',
		actionType: 'monstre',
		monster: {
			name: 'Gobelin',
			pv: 5,
			outcomes: { reussite: 'ok', echec: 'ko' },
			...(victoryTarget !== undefined ? { victoryTarget } : {}),
			...(fleeTarget !== undefined ? { fleeTarget } : {}),
		},
	}
}

function choice(id: string, from: string, to: string, label?: string): Edge {
	return { id, from, to, kind: 'choice', label }
}

function book(nodes: BookNode[], edges: Edge[]): Book {
	return { id: 'b1', title: 'Test', createdAt: '', updatedAt: '', nodes, edges }
}

// ---------------------------------------------------------------------------
// buildColumnNodes
// ---------------------------------------------------------------------------

describe('buildColumnNodes', () => {
	it('returns one column with sommaire children when path = [sommaire]', () => {
		const s = node('s', 'sommaire')
		const c1 = node('c1')
		const c2 = node('c2')
		const b = book([s, c1, c2], [choice('e1', 's', 'c1'), choice('e2', 's', 'c2')])
		const cols = buildColumnNodes(b, ['s'])
		expect(cols).toHaveLength(1)
		expect(cols[0]!.parentId).toBe('s')
		expect(cols[0]!.entries).toHaveLength(2)
		expect(cols[0]!.entries[0]!.targetId).toBe('c1')
		expect(cols[0]!.entries[0]!.entryKind).toBe('node')
		expect(cols[0]!.entries[1]!.targetId).toBe('c2')
	})

	it('returns two columns for a two-step path', () => {
		const s = node('s', 'sommaire')
		const c1 = node('c1')
		const gc1 = node('gc1')
		const b = book([s, c1, gc1], [choice('e1', 's', 'c1'), choice('e2', 'c1', 'gc1')])
		const cols = buildColumnNodes(b, ['s', 'c1'])
		expect(cols).toHaveLength(2)
		expect(cols[0]!.entries[0]!.entryKind).toBe('node')
		expect(cols[1]!.parentId).toBe('c1')
		expect(cols[1]!.entries[0]!.targetId).toBe('gc1')
		expect(cols[1]!.entries[0]!.entryKind).toBe('node')
	})

	it('marks a child that is in path[0..i] as backlink (cycle back-edge)', () => {
		const s = node('s', 'sommaire')
		const c1 = node('c1')
		// cycle: c1 → s (back to root)
		const b = book([s, c1], [choice('e1', 's', 'c1'), choice('e2', 'c1', 's')])
		const cols = buildColumnNodes(b, ['s', 'c1'])
		const backlink = cols[1]!.entries.find((e) => e.targetId === 's')
		expect(backlink).toBeDefined()
		expect(backlink!.entryKind).toBe('backlink')
	})

	it('marks path[i+1] (the selected child) as node, not backlink', () => {
		const s = node('s', 'sommaire')
		const c1 = node('c1')
		const b = book([s, c1], [choice('e1', 's', 'c1')])
		// path = ['s', 'c1']: c1 is path[1], shown in column 0 as a normal node (highlighted)
		const cols = buildColumnNodes(b, ['s', 'c1'])
		const entry = cols[0]!.entries.find((e) => e.targetId === 'c1')
		expect(entry!.entryKind).toBe('node')
	})

	it('marks a convergence node (reachable from two branches) as reference on second occurrence', () => {
		const s = node('s', 'sommaire')
		const a = node('a')
		const b2 = node('b')
		const shared = node('shared')
		// Both a and b lead to shared
		const bk = book(
			[s, a, b2, shared],
			[choice('e1', 's', 'a'), choice('e2', 's', 'b'), choice('e3', 'a', 'shared'), choice('e4', 'b', 'shared')],
		)
		// Navigate via a: path = ['s', 'a']
		const cols = buildColumnNodes(bk, ['s', 'a'])
		// column 0: a=node, b=node
		expect(cols[0]!.entries.find((e) => e.targetId === 'a')!.entryKind).toBe('node')
		// column 1: shared should be node (first time seen)
		expect(cols[1]!.entries.find((e) => e.targetId === 'shared')!.entryKind).toBe('node')

		// Now navigate via b: but because we navigate a first, shared was seen at col 1 already.
		// Reset: new invocation with path ['s', 'b'] (fresh seenAt)
		const cols2 = buildColumnNodes(bk, ['s', 'b'])
		// column 1 (via b): shared is node (first time in this invocation)
		expect(cols2[1]!.entries.find((e) => e.targetId === 'shared')!.entryKind).toBe('node')

		// Navigate path ['s', 'a', 'shared'] — b also leads to shared but it was seen at col 1.
		// In column 0, b is a node. In column 0, a is a node. No reference clash at column 0.
		// Convergence appears when traversing both columns: col 0 sees a and b (both node),
		// col 1 (children of a) sees shared (node, seenAt[shared]=1).
		// If path were ['s', 'a'] and we also saw 'b → shared' in column 0 — but we DON'T,
		// we only see 's → b' in column 0. 's → a → shared' is seen as node in col 1.
		// The reference would appear if path is ['s', 'a'] and a also has 'b' as a child
		// going to 'shared'. The convergence only triggers when TWO different parents
		// in the PATH both have the same child. Let's build a cleaner test:

		// Deeper convergence: s→a→shared AND a→b→shared (both in same path traversal)
		const s2 = node('s2', 'sommaire')
		const a2 = node('a2')
		const b3 = node('b3')
		const shared2 = node('shared2')
		const bk2 = book(
			[s2, a2, b3, shared2],
			[
				choice('e1', 's2', 'a2'),
				choice('e2', 'a2', 'b3'),
				choice('e3', 'a2', 'shared2'), // column 1: first shows shared2
				choice('e4', 'b3', 'shared2'), // column 2: shared2 now reference
			],
		)
		const cols3 = buildColumnNodes(bk2, ['s2', 'a2', 'b3'])
		// col 0: children of s2 → [a2] node
		// col 1: children of a2 → [b3] node, [shared2] node (first seen at col 1)
		// col 2: children of b3 → [shared2] reference (already seen at col 1)
		const col2entry = cols3[2]!.entries.find((e) => e.targetId === 'shared2')
		expect(col2entry!.entryKind).toBe('reference')
		expect(col2entry!.firstSeenColumn).toBe(1)
	})

	it('handles a dangling edge target: node is null, entryKind is node (KR-021)', () => {
		const s = node('s', 'sommaire')
		const b = book([s], [choice('e1', 's', 'ghost')])
		const cols = buildColumnNodes(b, ['s'])
		expect(cols[0]!.entries[0]!.node).toBeNull()
		expect(cols[0]!.entries[0]!.targetId).toBe('ghost')
		expect(cols[0]!.entries[0]!.entryKind).toBe('node')
	})

	it('sets outcomes for a monster node (victoryTarget + fleeTarget)', () => {
		const s = node('s', 'sommaire')
		const m = monsterNode('m', 'victory', 'flee')
		const v = node('victory')
		const f = node('flee')
		const b = book([s, m, v, f], [choice('e1', 's', 'm')])
		const cols = buildColumnNodes(b, ['s'])
		const entry = cols[0]!.entries[0]!
		expect(entry.outcomes).toHaveLength(2)
		expect(entry.outcomes[0]!.kind).toBe('victoire')
		expect(entry.outcomes[0]!.targetId).toBe('victory')
		expect(entry.outcomes[0]!.target?.id).toBe('victory')
		expect(entry.outcomes[1]!.kind).toBe('fuite')
	})

	it('does not include relink/flee edges in column entries', () => {
		const s = node('s', 'sommaire')
		const c1 = node('c1')
		const c2 = node('c2')
		const b = book([s, c1, c2], [choice('e1', 's', 'c1'), { id: 'e2', from: 's', to: 'c2', kind: 'relink' }])
		const cols = buildColumnNodes(b, ['s'])
		// Only the choice edge appears
		expect(cols[0]!.entries).toHaveLength(1)
		expect(cols[0]!.entries[0]!.targetId).toBe('c1')
	})

	it('returns empty entries for a terminal node (no outgoing choice edges)', () => {
		const s = node('s', 'sommaire')
		const mort = node('mort', 'mort')
		const b = book([s, mort], [choice('e1', 's', 'mort')])
		// Navigate into mort: column 1 has no children
		const cols = buildColumnNodes(b, ['s', 'mort'])
		expect(cols[1]!.entries).toHaveLength(0)
	})

	it('carries the edge label on the entry', () => {
		const s = node('s', 'sommaire')
		const c = node('c')
		const b = book([s, c], [choice('e1', 's', 'c', 'Aller au nord')])
		const cols = buildColumnNodes(b, ['s'])
		expect(cols[0]!.entries[0]!.edgeLabel).toBe('Aller au nord')
	})
})

// ---------------------------------------------------------------------------
// findChoicePath
// ---------------------------------------------------------------------------

describe('findChoicePath', () => {
	it('returns [id] when fromId === toId', () => {
		const s = node('s', 'sommaire')
		const b = book([s], [])
		expect(findChoicePath(b, 's', 's')).toEqual(['s'])
	})

	it('finds a direct path', () => {
		const s = node('s', 'sommaire')
		const c = node('c')
		const b = book([s, c], [choice('e1', 's', 'c')])
		expect(findChoicePath(b, 's', 'c')).toEqual(['s', 'c'])
	})

	it('finds a multi-hop path', () => {
		const s = node('s', 'sommaire')
		const a = node('a')
		const b2 = node('b')
		const b = book([s, a, b2], [choice('e1', 's', 'a'), choice('e2', 'a', 'b')])
		expect(findChoicePath(b, 's', 'b')).toEqual(['s', 'a', 'b'])
	})

	it('returns null for a node not reachable via choice edges', () => {
		const s = node('s', 'sommaire')
		const c = node('c')
		// relink edge, not choice
		const b = book([s, c], [{ id: 'e1', from: 's', to: 'c', kind: 'relink' }])
		expect(findChoicePath(b, 's', 'c')).toBeNull()
	})

	it('returns null for an unreachable node', () => {
		const s = node('s', 'sommaire')
		const orphan = node('orphan')
		const b = book([s, orphan], [])
		expect(findChoicePath(b, 's', 'orphan')).toBeNull()
	})

	it('does not loop on a cycle (cycle-safe, KR-080)', () => {
		const s = node('s', 'sommaire')
		const a = node('a')
		// s → a → s (cycle)
		const b = book([s, a], [choice('e1', 's', 'a'), choice('e2', 'a', 's')])
		// 'ghost' is unreachable but the BFS must still terminate
		expect(findChoicePath(b, 's', 'ghost')).toBeNull()
	})
})
