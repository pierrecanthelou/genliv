import { NODE_KINDS, EDGE_KINDS } from './kinds'
import type { NodeKind, EdgeKind } from './types'

describe('NODE_KINDS registry', () => {
	it('marks exactly the Sommaire root and Mort leaf as structural (KR-055)', () => {
		const structural = (Object.keys(NODE_KINDS) as NodeKind[]).filter((k) => NODE_KINDS[k].structural)
		expect(structural.sort()).toEqual(['mort', 'sommaire'])
	})

	it('forbids outgoing choices only on Mort (KR-055/060)', () => {
		const noOutgoing = (Object.keys(NODE_KINDS) as NodeKind[]).filter((k) => !NODE_KINDS[k].canHaveOutgoing)
		expect(noOutgoing).toEqual(['mort'])
	})

	it('forbids being an authored choice target on the Sommaire root and Mort leaf (KR-067)', () => {
		const notTargetable = (Object.keys(NODE_KINDS) as NodeKind[]).filter((k) => !NODE_KINDS[k].canBeTarget)
		expect(notTargetable.sort()).toEqual(['mort', 'sommaire'])
	})

	it('gives every kind a label, a default title and a badge mark (no silent gap)', () => {
		for (const k of Object.keys(NODE_KINDS) as NodeKind[]) {
			const d = NODE_KINDS[k]
			expect(d.label.length).toBeGreaterThan(0)
			expect(d.defaultTitle.length).toBeGreaterThan(0)
			expect(d.mark.shape === 'triangle' || d.mark.shape === 'box').toBe(true)
		}
	})
})

describe('EDGE_KINDS registry', () => {
	it('gives every edge kind a row label, tone and canvas label', () => {
		for (const k of Object.keys(EDGE_KINDS) as EdgeKind[]) {
			const d = EDGE_KINDS[k]
			expect(d.rowLabel.length).toBeGreaterThan(0)
			expect(d.canvasLabel.length).toBeGreaterThan(0)
			expect(d.rowTone === 'neutral' || d.rowTone === 'muted').toBe(true)
		}
	})
})
