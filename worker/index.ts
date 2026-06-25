/**
 * Genliv KV proxy — a thin Cloudflare Worker that stores book data in a KV
 * namespace.  Authentication is the `X-Sync-Key` header: the client chooses a
 * secret key which is base64-encoded and used as a per-user namespace prefix
 * inside the shared KV, so each key is isolated without any server-side user
 * management.
 *
 * Routes:
 *   PUT  /kv/{key}   — write one value (JSON body)
 *   GET  /kv/{key}   — read one value (JSON)
 *   DELETE /kv/{key} — delete one value
 */

interface KVNamespace {
	get(key: string): Promise<string | null>
	put(key: string, value: string): Promise<void>
	delete(key: string): Promise<void>
}

interface Env {
	GENLIV_KV: KVNamespace
	/** Comma-separated allowed origins (CORS). Falls back to "*" when unset. */
	ALLOWED_ORIGINS?: string
}

const BASE_CORS = {
	'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
	const allowed = (env.ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean)
	if (allowed.length === 0) {
		return { ...BASE_CORS, 'Access-Control-Allow-Origin': '*' }
	}
	const origin = request.headers.get('Origin')
	if (origin && allowed.includes(origin)) {
		return { ...BASE_CORS, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
	}
	return { ...BASE_CORS, Vary: 'Origin' }
}

function respond(body: string | null, status: number, extra?: Record<string, string>): Response {
	return new Response(body, { status, headers: { ...BASE_CORS, ...(extra ?? {}) } })
}

function encodeKey(raw: string): string {
	return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function handle(request: Request, env: Env): Promise<Response> {
	const syncKey = request.headers.get('X-Sync-Key')
	if (!syncKey) return respond('Missing X-Sync-Key header', 400)

	if (!/^[\x20-\xFF]+$/.test(syncKey)) {
		return respond(JSON.stringify({ error: 'Sync key must contain only latin-1 characters' }), 400, {
			'Content-Type': 'application/json',
		})
	}

	const encodedKey = encodeKey(syncKey)
	const { method } = request
	const url = new URL(request.url)

	const match = url.pathname.match(/^\/kv\/(.+)$/)
	if (!match) return respond('Not found', 404)

	const dataKey = decodeURIComponent(match[1])
	const fullKey = `${encodedKey}:${dataKey}`

	try {
		if (method === 'GET') {
			const value = await env.GENLIV_KV.get(fullKey)
			if (value === null) return respond(null, 404)
			return respond(value, 200, { 'Content-Type': 'application/json' })
		}

		if (method === 'PUT') {
			const body = await request.text()
			if (!body) return respond('Empty body', 400)
			if (body.length > 2_000_000) return respond('Payload too large', 413)
			await env.GENLIV_KV.put(fullKey, body)
			return respond(null, 204)
		}

		if (method === 'DELETE') {
			await env.GENLIV_KV.delete(fullKey)
			return respond(null, 204)
		}

		return respond('Method not allowed', 405)
	} catch (err) {
		console.error(`Worker error [${method} ${url.pathname}]: ${err instanceof Error ? err.message : String(err)}`)
		return respond('Internal server error', 500)
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const cors = corsHeaders(request, env)
		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

		const res = await handle(request, env)
		const headers = new Headers(res.headers)
		for (const [key, value] of Object.entries(cors)) headers.set(key, value)
		return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
	},
}
