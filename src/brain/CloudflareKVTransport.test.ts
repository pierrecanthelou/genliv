import { createCloudflareKVTransport } from './CloudflareKVTransport'

const BASE = 'https://genliv.example.workers.dev'
const KEY = 'my-sync-key'
const DATA_KEY = 'genliv:book:abc123'

function makeTransport() {
	return createCloudflareKVTransport(BASE, KEY)
}

// Minimal fetch response stub — CloudflareKVTransport only reads ok/status/json()/text().
function stubResponse(status: number, body?: unknown, text?: string): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body ?? null,
		text: async () => text ?? (body !== undefined ? JSON.stringify(body) : ''),
	} as unknown as Response
}

describe('CloudflareKVTransport', () => {
	let fetchMock: jest.Mock
	let abortMock: jest.Mock
	let origAbortController: typeof AbortController

	beforeEach(() => {
		fetchMock = jest.fn()
		abortMock = jest.fn()
		origAbortController = globalThis.AbortController
		globalThis.fetch = fetchMock
		// Stub AbortController so withTimeout does not rely on the real one
		globalThis.AbortController = class {
			signal = {} as AbortSignal
			abort = abortMock
		} as unknown as typeof AbortController
	})
	afterEach(() => {
		jest.useRealTimers()
		delete (globalThis as Record<string, unknown>).fetch
		globalThis.AbortController = origAbortController
	})

	it('push sends a PUT with X-Sync-Key header and JSON body', async () => {
		fetchMock.mockResolvedValue(stubResponse(204))
		const transport = makeTransport()
		await transport.push(DATA_KEY, { id: 'abc123', title: 'Test' })

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${BASE}/kv/${encodeURIComponent(DATA_KEY)}`)
		expect(init.method).toBe('PUT')
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(KEY)
		expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
		expect(init.body).toBe(JSON.stringify({ id: 'abc123', title: 'Test' }))
	})

	it('push throws with status and body on non-ok response', async () => {
		fetchMock.mockResolvedValue(stubResponse(400, undefined, 'Missing X-Sync-Key header'))
		const transport = makeTransport()
		await expect(transport.push(DATA_KEY, {})).rejects.toThrow('KV push failed: 400 — Missing X-Sync-Key header')
	})

	it('push throws with status only when body is empty', async () => {
		fetchMock.mockResolvedValue(stubResponse(403, undefined, ''))
		const transport = makeTransport()
		await expect(transport.push(DATA_KEY, {})).rejects.toThrow('KV push failed: 403')
	})

	it('pull sends a GET with X-Sync-Key and no Content-Type, returns parsed JSON', async () => {
		const value = { id: 'abc123', updatedAt: '2026-01-01T00:00:00Z' }
		fetchMock.mockResolvedValue(stubResponse(200, value))
		const transport = makeTransport()
		const result = await transport.pull!(DATA_KEY)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${BASE}/kv/${encodeURIComponent(DATA_KEY)}`)
		expect(init.method).toBeUndefined()
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(KEY)
		expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
		expect(result).toEqual(value)
	})

	it('pull returns null on 404', async () => {
		fetchMock.mockResolvedValue(stubResponse(404))
		const transport = makeTransport()
		const result = await transport.pull!(DATA_KEY)
		expect(result).toBeNull()
	})

	it('pull throws with body on non-404 error', async () => {
		fetchMock.mockResolvedValue(stubResponse(500, undefined, 'Internal server error'))
		const transport = makeTransport()
		await expect(transport.pull!(DATA_KEY)).rejects.toThrow('KV pull failed: 500 — Internal server error')
	})

	it('strips trailing slash from workerUrl', async () => {
		fetchMock.mockResolvedValue(stubResponse(204))
		const transport = createCloudflareKVTransport(`${BASE}/`, KEY)
		await transport.push(DATA_KEY, {})
		const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${BASE}/kv/${encodeURIComponent(DATA_KEY)}`)
	})

	it('calls AbortController.abort() after 45 s on a pending push', () => {
		jest.useFakeTimers()
		fetchMock.mockReturnValue(new Promise(() => {}))
		const transport = makeTransport()
		void transport.push(DATA_KEY, {})
		expect(abortMock).not.toHaveBeenCalled()
		jest.advanceTimersByTime(45_000)
		expect(abortMock).toHaveBeenCalledTimes(1)
	})
})
