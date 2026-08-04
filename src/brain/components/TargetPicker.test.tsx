import { render, screen, fireEvent } from '@testing-library/react'
import { TargetPicker } from './TargetPicker'
import type { BookNode } from '../tree'

const nodes: BookNode[] = [
	{ id: 'n1', kind: 'choix', text: 'Ecran A' },
	{ id: 'n2', kind: 'choix', text: 'Ecran B' },
]

function openPicker(label: string): void {
	fireEvent.focus(screen.getByRole('combobox', { name: label }))
}

describe('TargetPicker', () => {
	it('calls onChange via onMouseDown on a candidate (regression: onClick alone was suppressed by ul.onMouseDown.preventDefault)', () => {
		const onChange = jest.fn()
		render(<TargetPicker label="Fuite vers" nodes={nodes} nodeId="n0" target={undefined} onChange={onChange} />)

		openPicker('Fuite vers')

		const btn = screen.getByRole('button', { name: 'Ecran A' })
		fireEvent.mouseDown(btn)

		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith('n1')
	})

	it('calls onChange with undefined via onMouseDown on the clear option', () => {
		const onChange = jest.fn()
		render(
			<TargetPicker
				label="Victoire vers"
				nodes={nodes}
				nodeId="n0"
				target="n1"
				onChange={onChange}
				emptyLabel="Aucune suite"
			/>,
		)

		openPicker('Victoire vers')

		const clearBtn = screen.getByRole('button', { name: '— Aucune suite —' })
		fireEvent.mouseDown(clearBtn)

		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith(undefined)
	})

	it('closes the picker after mouseDown selection', () => {
		const onChange = jest.fn()
		render(<TargetPicker label="Cible" nodes={nodes} nodeId="n0" target={undefined} onChange={onChange} />)

		openPicker('Cible')
		expect(screen.getByRole('listbox')).toBeInTheDocument()

		fireEvent.mouseDown(screen.getByRole('button', { name: 'Ecran B' }))

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
	})

	it('filters candidates by search text', () => {
		render(<TargetPicker label="Cible" nodes={nodes} nodeId="n0" target={undefined} onChange={jest.fn()} />)

		const input = screen.getByRole('combobox', { name: 'Cible' })
		fireEvent.focus(input)
		fireEvent.change(input, { target: { value: 'Ecran A' } })

		expect(screen.getByRole('button', { name: 'Ecran A' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Ecran B' })).not.toBeInTheDocument()
	})
})
