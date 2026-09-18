/**
 * @jest-environment node
 */
/**
 * LES SEPT BRANCHES de `POST /ia/:role`.
 *
 * `worker/index.ts` n'avait AUCUN test au 2026-09-17, et `jest.config.cjs` ne
 * pouvait pas en voir un : son `testMatch` était ancré sur `src/**`. Les deux
 * corrections arrivent dans le MÊME lot que la route (KR-233) — une route de
 * production hors de la porte de commit est un 404 silencieux qui attend.
 *
 * La pragma `node` ci-dessus n'est pas cosmétique : `Request`, `Response`,
 * `fetch` et `TextEncoder` sont natifs en environnement node, là où le `jsdom`
 * par défaut du projet ne les donne pas tous.
 */
import worker, { INVITES, TAILLE_MAX_CORPS_IA } from './index'

type EnvDuWorker = Parameters<typeof worker.fetch>[1]

const ROLE = 'personnage-prose'
const URL_IA = `https://genliv.example.workers.dev/ia/${ROLE}`
const CLE = 'une-cle-de-synchronisation'

/** Le KV n'est jamais touché par la route IA — le stub est là pour que `Env` soit
 *  complet, et son absence d'appel est elle-même une assertion (voir plus bas). */
const kvVide = {
	get: jest.fn(async () => null),
	put: jest.fn(async () => undefined),
	delete: jest.fn(async () => undefined),
}

function env(extra: Record<string, unknown> = {}): EnvDuWorker {
	return {
		GENLIV_KV: kvVide,
		IA_API_KEY: 'secret-de-test',
		IA_BASE_URL: 'https://amont.invalid/messages',
		IA_MODEL: 'un-modele',
		...extra,
	} as unknown as EnvDuWorker
}

function demande(corps: string, options: { methode?: string; url?: string; cle?: string | null } = {}): Request {
	const entetes: Record<string, string> = { 'Content-Type': 'application/json' }
	const cle = options.cle === undefined ? CLE : options.cle
	if (cle !== null) entetes['X-Sync-Key'] = cle
	const methode = options.methode ?? 'POST'
	return new Request(options.url ?? URL_IA, {
		method: methode,
		headers: entetes,
		body: methode === 'GET' ? undefined : corps,
	})
}

/** Un corps de demande VALIDE, de taille libre — le remplissage est en ASCII pour
 *  que « un caractère » et « un octet » soient la même chose au canari. */
function corpsDeTaille(octets: number): string {
	const squelette = JSON.stringify({ role: ROLE, champ: 'monde.personnages[].fonction', contexte: '' })
	const aRemplir = octets - squelette.length
	if (aRemplir < 0) throw new Error('taille demandée plus petite que le squelette du corps')
	return JSON.stringify({ role: ROLE, champ: 'monde.personnages[].fonction', contexte: 'x'.repeat(aRemplir) })
}

/** La réponse amont d'un fournisseur qui a répondu — forme minimale, seul
 *  `content[].text` est lu par le worker. */
function amontRendant(texte: string, ok = true): Response {
	return {
		ok,
		status: ok ? 200 : 500,
		json: async () => ({ content: [{ type: 'text', text: texte }] }),
	} as unknown as Response
}

let fetchAmont: jest.Mock
let fetchAvant: typeof globalThis.fetch

beforeEach(() => {
	fetchAmont = jest.fn()
	fetchAvant = globalThis.fetch
	globalThis.fetch = fetchAmont as unknown as typeof fetch
	kvVide.get.mockClear()
	kvVide.put.mockClear()
	kvVide.delete.mockClear()
})

afterEach(() => {
	globalThis.fetch = fetchAvant
})

describe('POST /ia/:role — les sept branches, toutes en JSON', () => {
	it('1 — une methode autre que POST rend 405 methode', async () => {
		const res = await worker.fetch(demande('', { methode: 'GET' }), env())

		expect(res.status).toBe(405)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.json()).resolves.toEqual({ erreur: 'methode' })
		expect(fetchAmont).not.toHaveBeenCalled()
	})

	it('2 — un role absent de INVITES rend 404 role-inconnu', async () => {
		const res = await worker.fetch(demande('{}', { url: 'https://genliv.example.workers.dev/ia/lieu-prose' }), env())

		expect(res.status).toBe(404)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.json()).resolves.toEqual({ erreur: 'role-inconnu' })
		expect(fetchAmont).not.toHaveBeenCalled()
	})

	it('2 bis — une cle heritee d Object.prototype n est pas un role', async () => {
		// KR-175 : `'toString' in INVITES` vaut true et `INVITES['toString']` rend une
		// FONCTION. Le garde passe par `hasOwnProperty.call`, donc la route refuse.
		const res = await worker.fetch(demande('{}', { url: 'https://genliv.example.workers.dev/ia/tostring' }), env())

		expect(res.status).toBe(404)
		await expect(res.json()).resolves.toEqual({ erreur: 'role-inconnu' })
	})

	it('3 — une configuration amont incomplete rend 503 non-configure', async () => {
		for (const manquant of ['IA_API_KEY', 'IA_BASE_URL', 'IA_MODEL']) {
			const res = await worker.fetch(demande(corpsDeTaille(200)), env({ [manquant]: undefined }))

			expect(`${manquant} → ${res.status}`).toBe(`${manquant} → 503`)
			expect(res.headers.get('Content-Type')).toBe('application/json')
			await expect(res.json()).resolves.toEqual({ erreur: 'non-configure' })
		}
		expect(fetchAmont).not.toHaveBeenCalled()
	})

	it('4 — exactement TAILLE_MAX_CORPS_IA octets passe, un octet de plus rend 413', async () => {
		// LE CANARI À ±1 OCTET. Un plafond dont personne n'a éprouvé les deux bords
		// est une intention, pas une borne : il pourrait porter un `>=` pour un `>`,
		// ou compter des unités de code UTF-16, sans qu'un test rougisse.
		fetchAmont.mockResolvedValue(amontRendant('{"valeur": "une prose"}'))

		const juste = await worker.fetch(demande(corpsDeTaille(TAILLE_MAX_CORPS_IA)), env())
		expect(juste.status).toBe(200)

		const unDeTrop = await worker.fetch(demande(corpsDeTaille(TAILLE_MAX_CORPS_IA + 1)), env())
		expect(unDeTrop.status).toBe(413)
		expect(unDeTrop.headers.get('Content-Type')).toBe('application/json')
		await expect(unDeTrop.json()).resolves.toEqual({ erreur: 'trop-grand', limite: TAILLE_MAX_CORPS_IA })
	})

	it('4 bis — la mesure est en OCTETS, jamais en unites de code UTF-16', async () => {
		// Le discriminant de la grandeur : un corps dont `String.length` tient sous le
		// plafond mais dont l'encodage UTF-8 le dépasse. `'€'` coûte TROIS octets pour
		// UNE unité de code — `body.length` le laisserait passer.
		const rembourrage = '€'.repeat(Math.ceil(TAILLE_MAX_CORPS_IA / 2))
		const corps = JSON.stringify({ role: ROLE, champ: 'monde.personnages[].fonction', contexte: rembourrage })
		expect(corps.length).toBeLessThan(TAILLE_MAX_CORPS_IA)
		expect(new TextEncoder().encode(corps).length).toBeGreaterThan(TAILLE_MAX_CORPS_IA)

		const res = await worker.fetch(demande(corps), env())

		expect(res.status).toBe(413)
		expect(fetchAmont).not.toHaveBeenCalled()
	})

	it('5 — un corps qui ne parse pas rend 400 corps-illisible', async () => {
		const res = await worker.fetch(demande('{ ceci ne parse pas'), env())

		expect(res.status).toBe(400)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.json()).resolves.toEqual({ erreur: 'corps-illisible' })
		expect(fetchAmont).not.toHaveBeenCalled()
	})

	it('6 — un amont en echec, une exception, ou une charge sans texte rendent 502 amont', async () => {
		const enEchec = { ok: false, status: 500, json: async () => ({}) } as unknown as Response
		const sansTexte = { ok: true, status: 200, json: async () => ({ content: [] }) } as unknown as Response

		fetchAmont.mockResolvedValueOnce(enEchec)
		const surEchec = await worker.fetch(demande(corpsDeTaille(200)), env())

		fetchAmont.mockRejectedValueOnce(new Error('réseau'))
		const surException = await worker.fetch(demande(corpsDeTaille(200)), env())

		fetchAmont.mockResolvedValueOnce(sansTexte)
		const surChargeMuette = await worker.fetch(demande(corpsDeTaille(200)), env())

		for (const res of [surEchec, surException, surChargeMuette]) {
			expect(res.status).toBe(502)
			expect(res.headers.get('Content-Type')).toBe('application/json')
			await expect(res.json()).resolves.toEqual({ erreur: 'amont' })
		}
	})

	it('7 — le nominal rend 200 et la sortie du modele TELLE QUELLE', async () => {
		// Le worker ne répare rien et ne valide rien : il relaie. La validation vit
		// LÀ OÙ LA DONNÉE ENTRE DANS LE DOSSIER, c'est-à-dire dans le client (KR-116).
		// Ici la sortie est délibérément NON conforme au schéma — le worker la rend
		// quand même, à l'octet près.
		const sortieBrute = '{"valeur": "une prose", "champ": "un echo interdit"}'
		fetchAmont.mockResolvedValue(amontRendant(sortieBrute))

		const res = await worker.fetch(demande(corpsDeTaille(300)), env())

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.text()).resolves.toBe(sortieBrute)
	})

	it('la route IA ne touche jamais le KV, et le KV reste joignable a cote', async () => {
		fetchAmont.mockResolvedValue(amontRendant('{"valeur": "une prose"}'))

		await worker.fetch(demande(corpsDeTaille(300)), env())

		expect(kvVide.get).not.toHaveBeenCalled()
		expect(kvVide.put).not.toHaveBeenCalled()
		expect(kvVide.delete).not.toHaveBeenCalled()

		// Discriminant : la route `/kv/` n'a pas été mangée par le nouveau `match`.
		const surKv = await worker.fetch(
			new Request('https://genliv.example.workers.dev/kv/genliv:dossier:x', { headers: { 'X-Sync-Key': CLE } }),
			env(),
		)
		expect(surKv.status).toBe(404)
		expect(kvVide.get).toHaveBeenCalledTimes(1)
	})

	it('la route IA s authentifie par le meme en-tete que le KV', async () => {
		const res = await worker.fetch(demande(corpsDeTaille(200), { cle: null }), env())

		expect(res.status).toBe(400)
		expect(fetchAmont).not.toHaveBeenCalled()
	})

	it('POST figure dans les methodes CORS annoncees au preflight', async () => {
		// SANS cette ligne, le préflight d'un appel IA est refusé par le navigateur :
		// une panne SILENCIEUSE qu'aucun test de route ne voit (KR-233).
		const res = await worker.fetch(new Request(URL_IA, { method: 'OPTIONS' }), env())

		expect(res.status).toBe(204)
		expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
	})

	it('ni la cle d API ni l URL amont ne sortent dans une reponse', async () => {
		fetchAmont.mockResolvedValue(amontRendant('{"valeur": "une prose"}'))
		const configuration = env()
		const secrets = ['secret-de-test', 'https://amont.invalid/messages', 'un-modele']

		const reponses = [
			await worker.fetch(demande(corpsDeTaille(300)), configuration),
			await worker.fetch(demande('{ pas du json'), configuration),
			await worker.fetch(demande(corpsDeTaille(TAILLE_MAX_CORPS_IA + 1)), configuration),
		]

		for (const res of reponses) {
			const texte = await res.text()
			expect(secrets.filter((secret) => texte.includes(secret))).toEqual([])
		}
	})

	it('l invite part vers l amont, jamais vers le client', async () => {
		fetchAmont.mockResolvedValue(amontRendant('{"valeur": "une prose"}'))

		const res = await worker.fetch(demande(corpsDeTaille(300)), env())

		const [url, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('https://amont.invalid/messages')
		// Le corps part SÉRIALISÉ : on le relit, on ne cherche pas la chaîne brute
		// dans du JSON échappé — une sous-chaîne comparée à travers un échappement
		// est une assertion qui ne sait pas échouer pour la bonne raison.
		const envoye = JSON.parse(String(init.body)) as { system: string; max_tokens: number }
		expect(envoye.system).toBe(INVITES[ROLE].systeme)
		expect(envoye.max_tokens).toBe(INVITES[ROLE].max_tokens)
		await expect(res.text()).resolves.not.toContain(INVITES[ROLE].systeme)
	})
})

describe('POST /ia/indice-detenteurs — la route du second role', () => {
	const ROLE_2 = 'indice-detenteurs'
	const URL_IA_2 = `https://genliv.example.workers.dev/ia/${ROLE_2}`

	/** Le corps du SECOND rôle N'A PAS de `champ` : on ne demande pas un champ, on
	 *  demande QUI. Le squelette le dit, sans quoi le test éprouverait la forme du
	 *  premier rôle sur l'adresse du second. */
	function corps2(octets: number): string {
		const squelette = JSON.stringify({ role: ROLE_2, contexte: '' })
		const aRemplir = octets - squelette.length
		if (aRemplir < 0) throw new Error('taille demandée plus petite que le squelette du corps')
		return JSON.stringify({ role: ROLE_2, contexte: 'x'.repeat(aRemplir) })
	}

	function demande2(corps: string, options: { methode?: string } = {}): Request {
		const methode = options.methode ?? 'POST'
		return new Request(URL_IA_2, {
			method: methode,
			headers: { 'Content-Type': 'application/json', 'X-Sync-Key': CLE },
			body: methode === 'GET' ? undefined : corps,
		})
	}

	it('la route du second role repond aux memes branches, toutes en JSON', async () => {
		// 1 — POST SEUL.
		const surGet = await worker.fetch(demande2('', { methode: 'GET' }), env())
		expect(surGet.status).toBe(405)
		await expect(surGet.json()).resolves.toEqual({ erreur: 'methode' })

		// 2 — un rôle voisin mais absent d'`INVITES` reste inconnu : le second rôle
		// n'ouvre PAS la route à tout segment de chemin.
		const inconnu = await worker.fetch(
			new Request('https://genliv.example.workers.dev/ia/indice-detenteur', {
				method: 'POST',
				headers: { 'X-Sync-Key': CLE },
				body: '{}',
			}),
			env(),
		)
		expect(inconnu.status).toBe(404)
		await expect(inconnu.json()).resolves.toEqual({ erreur: 'role-inconnu' })

		// 3 — configuration amont incomplète.
		const nonConfigure = await worker.fetch(demande2(corps2(200)), env({ IA_API_KEY: undefined }))
		expect(nonConfigure.status).toBe(503)
		expect(nonConfigure.headers.get('Content-Type')).toBe('application/json')
		await expect(nonConfigure.json()).resolves.toEqual({ erreur: 'non-configure' })

		// 4 — le plafond, à ±1 OCTET, sur CE rôle-ci.
		fetchAmont.mockResolvedValue(amontRendant('{"detenteurs": ["P1"]}'))
		const juste = await worker.fetch(demande2(corps2(TAILLE_MAX_CORPS_IA)), env())
		expect(juste.status).toBe(200)
		const unDeTrop = await worker.fetch(demande2(corps2(TAILLE_MAX_CORPS_IA + 1)), env())
		expect(unDeTrop.status).toBe(413)
		expect(unDeTrop.headers.get('Content-Type')).toBe('application/json')
		await expect(unDeTrop.json()).resolves.toEqual({ erreur: 'trop-grand', limite: TAILLE_MAX_CORPS_IA })

		// 5 — corps illisible.
		const illisible = await worker.fetch(demande2('{ ceci ne parse pas'), env())
		expect(illisible.status).toBe(400)
		await expect(illisible.json()).resolves.toEqual({ erreur: 'corps-illisible' })
	})

	it('le nominal rend la sortie du second role TELLE QUELLE', async () => {
		// Délibérément NON conforme au schéma du client : le worker ne valide rien et
		// ne répare rien — la validation vit là où la donnée entre dans le dossier.
		const sortieBrute = '{"detenteurs": ["P1", "P1", "P99"], "motif": "un echo interdit"}'
		fetchAmont.mockResolvedValue(amontRendant(sortieBrute))

		const res = await worker.fetch(demande2(corps2(300)), env())

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.text()).resolves.toBe(sortieBrute)
	})

	it('max_tokens VARIE d un role a l autre, et il est lu de l invite', async () => {
		// CE QUE LE SECOND RÔLE ÉPROUVE ET QUE LE PREMIER N'ÉPROUVAIT PAS : avec un seul
		// rôle, un `max_tokens` écrit en dur dans `handleIa` aurait été indistinguable
		// d'une lecture d'`invite.max_tokens`.
		fetchAmont.mockResolvedValue(amontRendant('{"detenteurs": []}'))

		await worker.fetch(demande2(corps2(300)), env())

		const [url, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('https://amont.invalid/messages')
		const envoye = JSON.parse(String(init.body)) as { system: string; max_tokens: number }
		expect(envoye.system).toBe(INVITES[ROLE_2].systeme)
		expect(envoye.max_tokens).toBe(INVITES[ROLE_2].max_tokens)
		// Le discriminant : les deux rôles ne demandent PAS le même plafond de jetons.
		expect(INVITES[ROLE_2].max_tokens).not.toBe(INVITES[ROLE].max_tokens)
	})

	it('le protocole amont reste EPINGLE, et le second role ne l etend pas', async () => {
		// La ratification du comité (2026-09-17) s'accompagne d'une exigence : le second
		// rôle N'ÉTEND PAS LE COUPLAGE. Ni `tool_use`, ni `response_format`, et la
		// version d'API reste épinglée — pas « la dernière ».
		fetchAmont.mockResolvedValue(amontRendant('{"detenteurs": []}'))

		await worker.fetch(demande2(corps2(300)), env())

		const [, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect((init.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01')
		const envoye = JSON.parse(String(init.body)) as Record<string, unknown>
		expect(Object.keys(envoye).sort()).toEqual(['max_tokens', 'messages', 'model', 'system'])
	})
})
