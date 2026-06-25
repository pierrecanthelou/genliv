import { createCloudflareKVTransport } from './CloudflareKVTransport'

const BASE = 'https://genliv.example.workers.dev'
const KEY = 'my-sync-key'
const DATA_KEY = 'genliv:book:abc123'

function makeTransport() {
	return createCloudflareKVTransport(BASE, KEY)
}

// Minimal fetch response stub — CloudflareKVTransport only reads ok/status/json().
function stubResponse(status: number, body?: unknown): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body ?? null,
	} as unknown as Response
}

describe('CloudflareKVTransport', () => {
	let fetchMock: jest.Mock

	beforeEach(() => {
		fetchMock = jest.fn()
		globalThis.fetch = fetchMock
	})
	afterEach(() => {
		delete (globalThis as Record<string, unknown>).fetch
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
		expect(init.body).toBe(JSON.stringify({ id: 'abc123', title: 'Test' }))
	})

	it('push throws on non-ok response', async () => {
		fetchMock.mockResolvedValue(stubResponse(403))
		const transport = makeTransport()
		await expect(transport.push(DATA_KEY, {})).rejects.toThrow('KV push failed: 403')
	})

	it('pull sends a GET with X-Sync-Key and returns parsed JSON', async () => {
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

	it('pull throws on non-404 error', async () => {
		fetchMock.mockResolvedValue(stubResponse(500))
		const transport = makeTransport()
		await expect(transport.pull!(DATA_KEY)).rejects.toThrow('KV pull failed: 500')
	})

	it('strips trailing slash from workerUrl', async () => {
		fetchMock.mockResolvedValue(stubResponse(204))
		const transport = createCloudflareKVTransport(`${BASE}/`, KEY)
		await transport.push(DATA_KEY, {})
		const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${BASE}/kv/${encodeURIComponent(DATA_KEY)}`)
	})
})
