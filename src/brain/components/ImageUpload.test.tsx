import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload } from './ImageUpload'

describe('ImageUpload', () => {
	it('shows the dropzone when no value is set', () => {
		render(<ImageUpload label="Portrait du PNJ" value={undefined} onChange={jest.fn()} />)
		expect(screen.getByRole('button', { name: /choisir une image/i })).toBeInTheDocument()
		expect(screen.queryByRole('img')).toBeNull()
	})

	it('shows the image preview and remove button when a value is set', () => {
		render(<ImageUpload label="Illustration" value="data:image/png;base64,abc" onChange={jest.fn()} />)
		expect(screen.getByRole('img', { name: 'Illustration' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /choisir une image/i })).toBeNull()
	})

	it('opens the lightbox when the thumbnail is clicked', async () => {
		const user = userEvent.setup()
		render(<ImageUpload label="Illustration" value="data:image/png;base64,abc" onChange={jest.fn()} />)
		await user.click(screen.getByRole('button', { name: /agrandir/i }))
		expect(screen.getByRole('dialog')).toBeInTheDocument()
	})

	it('closes the lightbox when clicking the backdrop', async () => {
		const user = userEvent.setup()
		render(<ImageUpload label="Illustration" value="data:image/png;base64,abc" onChange={jest.fn()} />)
		await user.click(screen.getByRole('button', { name: /agrandir/i }))
		const dialog = screen.getByRole('dialog')
		await user.click(dialog)
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('closes the lightbox on Escape key', async () => {
		const user = userEvent.setup()
		render(<ImageUpload label="Illustration" value="data:image/png;base64,abc" onChange={jest.fn()} />)
		await user.click(screen.getByRole('button', { name: /agrandir/i }))
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		await user.keyboard('{Escape}')
		expect(screen.queryByRole('dialog')).toBeNull()
	})

	it('calls onChange with undefined and hides the image when the remove button is clicked', async () => {
		const onChange = jest.fn()
		render(<ImageUpload label="Portrait" value="data:image/png;base64,abc" onChange={onChange} />)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /supprimer/i }))
		expect(onChange).toHaveBeenCalledWith(undefined)
		// Optimistic: dropzone is shown immediately even if value prop has not yet changed.
		expect(screen.getByRole('button', { name: /choisir une image/i })).toBeInTheDocument()
	})

	it('calls onChange with the data URL when a file is selected', async () => {
		const fakeDataUrl = 'data:image/png;base64,ZmFrZQ=='
		// JSDOM does not implement FileReader.readAsDataURL — stub it.
		const originalFileReader = global.FileReader
		const mockReadAsDataURL = jest.fn()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(global as any).FileReader = jest.fn(() => ({
			readAsDataURL: mockReadAsDataURL,
			onload: null,
			result: fakeDataUrl,
		}))
		mockReadAsDataURL.mockImplementation(function (this: FileReader) {
			// Simulate the async load event by calling onload synchronously.
			if (typeof this.onload === 'function') {
				this.onload({ target: { result: fakeDataUrl } } as ProgressEvent<FileReader>)
			}
		})

		const onChange = jest.fn()
		render(<ImageUpload label="Portrait" value={undefined} onChange={onChange} />)

		const file = new File(['content'], 'photo.png', { type: 'image/png' })
		const input = document.querySelector('input[type="file"]') as HTMLInputElement
		fireEvent.change(input, { target: { files: [file] } })

		expect(onChange).toHaveBeenCalledWith(fakeDataUrl)
		// Optimistic: image is shown immediately without waiting for the value prop to update.
		expect(screen.getByRole('img', { name: 'Portrait' })).toBeInTheDocument()

		// Restore the original FileReader.
		global.FileReader = originalFileReader
	})
})
