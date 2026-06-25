import type { CloudTransport } from './CloudSyncService'

const TIMEOUT_MS = 45_000

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
	const ctrl = new AbortController()
	const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
	try {
		return await run(ctrl.signal)
	} finally {
		clearTimeout(timer)
	}
}

/**
 * Cloudflare KV transport — wraps the genliv worker KV proxy.
 * Auth: `X-Sync-Key` header (the key also serves as the per-user namespace
 * prefix inside the worker).  Both push and pull are implemented, so
 * CloudSyncService will reconcile books on open (last-write-wins).
 */
export function createCloudflareKVTransport(workerUrl: string, syncKey: string): CloudTransport {
	const base = workerUrl.replace(/\/$/, '')
	const headers = { 'X-Sync-Key': syncKey }

	return {
		async push(key, value) {
			return withTimeout(async (signal) => {
				const res = await fetch(`${base}/kv/${encodeURIComponent(key)}`, {
					method: 'PUT',
					headers: { ...headers, 'Content-Type': 'application/json' },
					body: JSON.stringify(value),
					signal,
				})
				if (!res.ok) {
					const text = await res.text().catch(() => '')
					throw new Error(`KV push failed: ${res.status}${text ? ` — ${text}` : ''}`)
				}
			})
		},

		async pull(key) {
			return withTimeout(async (signal) => {
				const res = await fetch(`${base}/kv/${encodeURIComponent(key)}`, { headers, signal })
				if (res.status === 404) return null
				if (!res.ok) {
					const text = await res.text().catch(() => '')
					throw new Error(`KV pull failed: ${res.status}${text ? ` — ${text}` : ''}`)
				}
				return res.json()
			})
		},
	}
}
