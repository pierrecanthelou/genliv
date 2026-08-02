import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

	it('calls onChange with a compressed JPEG when a file is selected', async () => {
		const originalDataUrl = 'data:image/png;base64,ZmFrZQ=='
		const compressedDataUrl = 'data:image/jpeg;base64,Y29tcHJlc3NlZA=='

		// Stub FileReader — JSDOM does not implement readAsDataURL.
		const origFileReader = global.FileReader
		const mockReadAsDataURL = jest.fn()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(global as any).FileReader = jest.fn(() => ({ readAsDataURL: mockReadAsDataURL, onload: null }))
		mockReadAsDataURL.mockImplementation(function (this: { onload: ((e: ProgressEvent<FileReader>) => void) | null }) {
			this.onload?.({ target: { result: originalDataUrl } } as ProgressEvent<FileReader>)
		})

		// Stub Image to fire onload asynchronously (JSDOM never loads images).
		const origImage = globalThis.Image
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(global as any).Image = class {
			width = 1200
			height = 900
			onload: (() => void) | null = null
			onerror: (() => void) | null = null
			set src(_: string) {
				setTimeout(() => this.onload?.(), 0)
			}
		}

		// Stub Canvas to return a known compressed URL.
		const origGetContext = HTMLCanvasElement.prototype.getContext
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(HTMLCanvasElement.prototype as any).getContext = jest.fn(() => ({ drawImage: jest.fn() }))
		const origToDataURL = HTMLCanvasElement.prototype.toDataURL
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(HTMLCanvasElement.prototype as any).toDataURL = jest.fn(() => compressedDataUrl)

		try {
			const onChange = jest.fn()
			render(<ImageUpload label="Portrait" value={undefined} onChange={onChange} />)

			const file = new File(['content'], 'photo.png', { type: 'image/png' })
			const input = document.querySelector('input[type="file"]') as HTMLInputElement
			fireEvent.change(input, { target: { files: [file] } })

			// Compression is async — wait for the canvas pipeline to complete.
			await waitFor(() => expect(onChange).toHaveBeenCalledWith(compressedDataUrl))
			// Optimistic: image is shown immediately without waiting for the value prop to update.
			expect(screen.getByRole('img', { name: 'Portrait' })).toBeInTheDocument()
		} finally {
			global.FileReader = origFileReader
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(global as any).Image = origImage
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(HTMLCanvasElement.prototype as any).getContext = origGetContext
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(HTMLCanvasElement.prototype as any).toDataURL = origToDataURL
		}
	})
})
