import type { CloudTransport } from './CloudSyncService'

/**
 * Cloudflare KV transport — wraps the genliv worker KV proxy.
 * Auth: `X-Sync-Key` header (the key also serves as the per-user namespace
 * prefix inside the worker).  Both push and pull are implemented, so
 * CloudSyncService will reconcile books on open (last-write-wins).
 */
export function createCloudflareKVTransport(workerUrl: string, syncKey: string): CloudTransport {
	const base = workerUrl.replace(/\/$/, '')
	const authHeader = { 'X-Sync-Key': syncKey }
	const writeHeaders = { 'X-Sync-Key': syncKey, 'Content-Type': 'application/json' }

	return {
		async push(key, value) {
			const res = await fetch(`${base}/kv/${encodeURIComponent(key)}`, {
				method: 'PUT',
				headers: writeHeaders,
				body: JSON.stringify(value),
			})
			if (!res.ok) throw new Error(`KV push failed: ${res.status}`)
		},

		async pull(key) {
			const res = await fetch(`${base}/kv/${encodeURIComponent(key)}`, { headers: authHeader })
			if (res.status === 404) return null
			if (!res.ok) throw new Error(`KV pull failed: ${res.status}`)
			return res.json() as Promise<unknown>
		},
	}
}
