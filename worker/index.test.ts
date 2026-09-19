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

describe('POST /ia/personnage-repliques — la route du troisieme role', () => {
	const ROLE_3 = 'personnage-repliques'
	const URL_IA_3 = `https://genliv.example.workers.dev/ia/${ROLE_3}`

	/** Le corps du TROISIÈME rôle N'A PAS de `champ` non plus : LE RÔLE EST LE CHAMP.
	 *  Le squelette le dit, sans quoi le test éprouverait la forme du premier rôle sur
	 *  l'adresse du troisième. */
	function corps3(octets: number): string {
		const squelette = JSON.stringify({ role: ROLE_3, contexte: '' })
		const aRemplir = octets - squelette.length
		if (aRemplir < 0) throw new Error('taille demandée plus petite que le squelette du corps')
		return JSON.stringify({ role: ROLE_3, contexte: 'x'.repeat(aRemplir) })
	}

	function demande3(corps: string, options: { methode?: string } = {}): Request {
		const methode = options.methode ?? 'POST'
		return new Request(URL_IA_3, {
			method: methode,
			headers: { 'Content-Type': 'application/json', 'X-Sync-Key': CLE },
			body: methode === 'GET' ? undefined : corps,
		})
	}

	it('la route du troisieme role repond aux memes branches, toutes en JSON', async () => {
		// LA LISTE DE CONTRÔLE KR-233, rejouée entière sur la route neuve : POST seul,
		// 404 sur rôle inconnu, 503 sur amont non configuré, plafond de corps EN OCTETS
		// avec 413, corps illisible — et TOUT en JSON.

		// 1 — POST SEUL.
		const surGet = await worker.fetch(demande3('', { methode: 'GET' }), env())
		expect(surGet.status).toBe(405)
		expect(surGet.headers.get('Content-Type')).toBe('application/json')
		await expect(surGet.json()).resolves.toEqual({ erreur: 'methode' })

		// 2 — un rôle VOISIN mais absent d'`INVITES` reste inconnu : le troisième rôle
		// n'ouvre PAS la route à tout segment de chemin.
		const inconnu = await worker.fetch(
			new Request('https://genliv.example.workers.dev/ia/personnage-replique', {
				method: 'POST',
				headers: { 'X-Sync-Key': CLE },
				body: '{}',
			}),
			env(),
		)
		expect(inconnu.status).toBe(404)
		await expect(inconnu.json()).resolves.toEqual({ erreur: 'role-inconnu' })

		// 3 — configuration amont incomplète, sur les TROIS secrets.
		for (const manquant of ['IA_API_KEY', 'IA_BASE_URL', 'IA_MODEL']) {
			const res = await worker.fetch(demande3(corps3(200)), env({ [manquant]: undefined }))
			expect(`${manquant} → ${res.status}`).toBe(`${manquant} → 503`)
			expect(res.headers.get('Content-Type')).toBe('application/json')
			await expect(res.json()).resolves.toEqual({ erreur: 'non-configure' })
		}

		// 4 — le plafond, à ±1 OCTET, sur CE rôle-ci.
		fetchAmont.mockResolvedValue(amontRendant('{"repliques": ["Une replique."]}'))
		const juste = await worker.fetch(demande3(corps3(TAILLE_MAX_CORPS_IA)), env())
		expect(juste.status).toBe(200)
		const unDeTrop = await worker.fetch(demande3(corps3(TAILLE_MAX_CORPS_IA + 1)), env())
		expect(unDeTrop.status).toBe(413)
		expect(unDeTrop.headers.get('Content-Type')).toBe('application/json')
		await expect(unDeTrop.json()).resolves.toEqual({ erreur: 'trop-grand', limite: TAILLE_MAX_CORPS_IA })

		// 4 bis — la mesure est en OCTETS, jamais en unités de code UTF-16.
		const rembourrage = '€'.repeat(Math.ceil(TAILLE_MAX_CORPS_IA / 2))
		const enUtf8 = JSON.stringify({ role: ROLE_3, contexte: rembourrage })
		expect(enUtf8.length).toBeLessThan(TAILLE_MAX_CORPS_IA)
		expect(new TextEncoder().encode(enUtf8).length).toBeGreaterThan(TAILLE_MAX_CORPS_IA)
		expect((await worker.fetch(demande3(enUtf8), env())).status).toBe(413)

		// 5 — corps illisible.
		const illisible = await worker.fetch(demande3('{ ceci ne parse pas'), env())
		expect(illisible.status).toBe(400)
		await expect(illisible.json()).resolves.toEqual({ erreur: 'corps-illisible' })

		// 6 — un amont en échec rend 502, en JSON.
		fetchAmont.mockReset()
		fetchAmont.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as unknown as Response)
		const surEchec = await worker.fetch(demande3(corps3(200)), env())
		expect(surEchec.status).toBe(502)
		await expect(surEchec.json()).resolves.toEqual({ erreur: 'amont' })
	})

	it('le nominal rend la sortie du troisieme role TELLE QUELLE', async () => {
		// Délibérément NON conforme au schéma du client — QUATRE répliques, dont une
		// vide, plus une clé en trop : le worker ne valide rien et ne répare rien, la
		// validation vit là où la donnée entre dans le dossier (KR-116).
		const sortieBrute = '{"repliques": ["Une.", "Deux.", "Trois.", ""], "champ": "un echo interdit"}'
		fetchAmont.mockResolvedValue(amontRendant(sortieBrute))

		const res = await worker.fetch(demande3(corps3(300)), env())

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.text()).resolves.toBe(sortieBrute)
	})

	it('max_tokens du troisieme role est LU de l invite, et differe des deux autres', async () => {
		fetchAmont.mockResolvedValue(amontRendant('{"repliques": ["Une replique."]}'))

		await worker.fetch(demande3(corps3(300)), env())

		const [url, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('https://amont.invalid/messages')
		const envoye = JSON.parse(String(init.body)) as { system: string; max_tokens: number }
		expect(envoye.system).toBe(INVITES[ROLE_3].systeme)
		expect(envoye.max_tokens).toBe(INVITES[ROLE_3].max_tokens)
		// Le discriminant : les plafonds NE SONT PAS TOUS ÉGAUX — un `max_tokens` écrit
		// en dur dans `handleIa` rougirait sur au moins un rôle.
		// ⚠ CETTE LIGNE DISAIT « deux à deux distincts » JUSQU'À L'IT3b, ET C'ÉTAIT UNE
		// PROPRIÉTÉ QUE PERSONNE N'AVAIT VOULUE : elle tenait PAR ACCIDENT DE MESURE. Le
		// quatrième rôle dérive 200, la même valeur que `personnage-prose`, par
		// COÏNCIDENCE de deux dérivations sans aucun rapport (146 caractères de prose
		// d'identité là-bas, 68 caractères d'étape ici). Exiger la distinction deux à
		// deux aurait forcé à INVENTER un chiffre pour faire verdir un test — précédent
		// exact : `frontiere.test.ts:384`, réparée à 3a pour ce motif.
		const plafonds = Object.keys(INVITES).map((role) => INVITES[role].max_tokens)
		expect(new Set(plafonds).size).toBeGreaterThan(1)
		// … et le pouvoir séparateur LOCAL est conservé : CE rôle-ci diffère bien du
		// premier, donc le plafond envoyé ne peut pas venir d'une constante de bloc.
		expect(INVITES[ROLE_3].max_tokens).not.toBe(INVITES[ROLE].max_tokens)
	})

	it('le protocole amont reste EPINGLE, et le troisieme role ne l etend pas', async () => {
		// L'exigence de la ratification vaut pour CHAQUE rôle ajouté : ni `tool_use`, ni
		// `response_format`, et la version d'API reste ÉPINGLÉE — pas « la dernière ».
		// Une entrée d'`INVITES` n'apporte que `{systeme, max_tokens}`.
		fetchAmont.mockResolvedValue(amontRendant('{"repliques": ["Une replique."]}'))

		await worker.fetch(demande3(corps3(300)), env())

		const [, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect((init.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01')
		const envoye = JSON.parse(String(init.body)) as Record<string, unknown>
		expect(Object.keys(envoye).sort()).toEqual(['max_tokens', 'messages', 'model', 'system'])
	})
})

describe('POST /ia/personnage-plan — la route du quatrieme role', () => {
	const ROLE_4 = 'personnage-plan'
	const URL_IA_4 = `https://genliv.example.workers.dev/ia/${ROLE_4}`

	/** Le corps du QUATRIÈME rôle n'a PAS de `champ` non plus : LE RÔLE EST LE CHAMP.
	 *  Et il ne porte AUCUN entier — le modèle ne voit jamais un numéro d'étape. */
	function corps4(octets: number): string {
		const squelette = JSON.stringify({ role: ROLE_4, contexte: '' })
		const aRemplir = octets - squelette.length
		if (aRemplir < 0) throw new Error('taille demandée plus petite que le squelette du corps')
		return JSON.stringify({ role: ROLE_4, contexte: 'x'.repeat(aRemplir) })
	}

	function demande4(corps: string, options: { methode?: string } = {}): Request {
		const methode = options.methode ?? 'POST'
		return new Request(URL_IA_4, {
			method: methode,
			headers: { 'Content-Type': 'application/json', 'X-Sync-Key': CLE },
			body: methode === 'GET' ? undefined : corps,
		})
	}

	it('la route du quatrieme role repond aux memes branches, toutes en JSON', async () => {
		// LA LISTE DE CONTRÔLE KR-233, rejouée entière sur la route neuve : POST seul,
		// 404 sur rôle inconnu, 503 sur amont non configuré, plafond de corps EN OCTETS
		// avec 413, corps illisible — et TOUT en JSON.

		// 1 — POST SEUL.
		const surGet = await worker.fetch(demande4('', { methode: 'GET' }), env())
		expect(surGet.status).toBe(405)
		expect(surGet.headers.get('Content-Type')).toBe('application/json')
		await expect(surGet.json()).resolves.toEqual({ erreur: 'methode' })

		// 2 — un rôle VOISIN mais absent d'`INVITES` reste inconnu : le quatrième rôle
		// n'ouvre PAS la route à tout segment de chemin.
		const inconnu = await worker.fetch(
			new Request('https://genliv.example.workers.dev/ia/personnage-plans', {
				method: 'POST',
				headers: { 'X-Sync-Key': CLE },
				body: '{}',
			}),
			env(),
		)
		expect(inconnu.status).toBe(404)
		await expect(inconnu.json()).resolves.toEqual({ erreur: 'role-inconnu' })

		// 3 — configuration amont incomplète, sur les TROIS secrets.
		for (const manquant of ['IA_API_KEY', 'IA_BASE_URL', 'IA_MODEL']) {
			const res = await worker.fetch(demande4(corps4(200)), env({ [manquant]: undefined }))
			expect(`${manquant} → ${res.status}`).toBe(`${manquant} → 503`)
			expect(res.headers.get('Content-Type')).toBe('application/json')
			await expect(res.json()).resolves.toEqual({ erreur: 'non-configure' })
		}

		// 4 — le plafond, à ±1 OCTET, sur CE rôle-ci.
		fetchAmont.mockResolvedValue(amontRendant('{"intention": "Remonter au beffroi."}'))
		const juste = await worker.fetch(demande4(corps4(TAILLE_MAX_CORPS_IA)), env())
		expect(juste.status).toBe(200)
		const unDeTrop = await worker.fetch(demande4(corps4(TAILLE_MAX_CORPS_IA + 1)), env())
		expect(unDeTrop.status).toBe(413)
		expect(unDeTrop.headers.get('Content-Type')).toBe('application/json')
		await expect(unDeTrop.json()).resolves.toEqual({ erreur: 'trop-grand', limite: TAILLE_MAX_CORPS_IA })

		// 4 bis — la mesure est en OCTETS, jamais en unités de code UTF-16.
		const rembourrage = '€'.repeat(Math.ceil(TAILLE_MAX_CORPS_IA / 2))
		const enUtf8 = JSON.stringify({ role: ROLE_4, contexte: rembourrage })
		expect(enUtf8.length).toBeLessThan(TAILLE_MAX_CORPS_IA)
		expect(new TextEncoder().encode(enUtf8).length).toBeGreaterThan(TAILLE_MAX_CORPS_IA)
		expect((await worker.fetch(demande4(enUtf8), env())).status).toBe(413)

		// 5 — corps illisible.
		const illisible = await worker.fetch(demande4('{ ceci ne parse pas'), env())
		expect(illisible.status).toBe(400)
		await expect(illisible.json()).resolves.toEqual({ erreur: 'corps-illisible' })

		// 6 — un amont en échec rend 502, en JSON.
		fetchAmont.mockReset()
		fetchAmont.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as unknown as Response)
		const surEchec = await worker.fetch(demande4(corps4(200)), env())
		expect(surEchec.status).toBe(502)
		await expect(surEchec.json()).resolves.toEqual({ erreur: 'amont' })
	})

	it('le nominal rend la sortie du quatrieme role TELLE QUELLE', async () => {
		// Délibérément NON conforme au schéma du client — un TABLEAU là où le client
		// attend une CHAÎNE, plus une clé en trop : le worker ne valide rien et ne
		// répare rien, la validation vit là où la donnée entre dans le dossier (KR-116).
		// C'est aussi le contre-exemple qui montre que le repêchage `[0]` ne peut PAS
		// venir du worker : il ne touche pas à ce corps.
		const sortieBrute = '{"intention": ["Une.", "Deux."], "etape": 4}'
		fetchAmont.mockResolvedValue(amontRendant(sortieBrute))

		const res = await worker.fetch(demande4(corps4(300)), env())

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.text()).resolves.toBe(sortieBrute)
	})

	it('max_tokens du quatrieme role est LU de l invite, et sa COINCIDENCE est epinglee', async () => {
		fetchAmont.mockResolvedValue(amontRendant('{"intention": "Remonter au beffroi."}'))

		await worker.fetch(demande4(corps4(300)), env())

		const [url, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('https://amont.invalid/messages')
		const envoye = JSON.parse(String(init.body)) as { system: string; max_tokens: number }
		expect(envoye.system).toBe(INVITES[ROLE_4].systeme)
		expect(envoye.max_tokens).toBe(INVITES[ROLE_4].max_tokens)
		// ⚠ LA COÏNCIDENCE, ÉPINGLÉE PLUTÔT QUE SUBIE : ce plafond VAUT celui du premier
		// rôle, et il n'en est PAS recopié — les deux dérivations n'ont aucun rapport.
		// Écrit ici pour qu'un relecteur ne « l'harmonise » pas, et pour que le jour où
		// l'une des deux change, personne ne croie devoir changer l'autre.
		expect(INVITES[ROLE_4].max_tokens).toBe(INVITES[ROLE].max_tokens)
		// Le pouvoir séparateur est donc porté ailleurs : ce rôle-ci diffère bien des
		// DEUX autres, donc le plafond envoyé ne peut pas venir d'une constante de bloc.
		expect(INVITES[ROLE_4].max_tokens).not.toBe(INVITES['indice-detenteurs'].max_tokens)
		expect(INVITES[ROLE_4].max_tokens).not.toBe(INVITES['personnage-repliques'].max_tokens)
	})

	it('le protocole amont reste EPINGLE, et le quatrieme role ne l etend pas', async () => {
		// L'exigence de la ratification vaut pour CHAQUE rôle ajouté : ni `tool_use`, ni
		// `response_format`, et la version d'API reste ÉPINGLÉE — pas « la dernière ».
		fetchAmont.mockResolvedValue(amontRendant('{"intention": "Remonter au beffroi."}'))

		await worker.fetch(demande4(corps4(300)), env())

		const [, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect((init.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01')
		const envoye = JSON.parse(String(init.body)) as Record<string, unknown>
		expect(Object.keys(envoye).sort()).toEqual(['max_tokens', 'messages', 'model', 'system'])
	})

	it('l invite du quatrieme role n ecrit AUCUN nom de champ du plan d actions', async () => {
		// LE VETO TL3b-1, gardé là où il peut l'être : la clé réseau NOMME LA FORME,
		// jamais le champ, et le § F de l'invite interdit de réciter le nom d'un champ.
		// Les quatre noms ci-dessous sont ceux des champs HORS PÉRIMÈTRE plus celui de
		// la DESTINATION — leur absence est ce qui rend l'écart visible si quelqu'un
		// « aide » le modèle en nommant le champ.
		const systeme = INVITES[ROLE_4].systeme.toLowerCase()
		const interdits = ['si_bloque', 'declencheur_texte', 'declencheur_expr', 'plan_actions', 'duree']

		expect(interdits.filter((mot) => systeme.includes(mot))).toEqual([])
		// Discriminants : la liste balayée n'est pas vide, et chaque mot SERAIT détecté
		// s'il y était (KR-199/235).
		expect(interdits.length).toBeGreaterThan(0)
		expect(interdits.filter((mot) => `${systeme} ${mot}`.includes(mot))).toEqual(interdits)
		// ⚠ GARDE DÉLIBÉRÉMENT ÉTROIT, et le dire vaut mieux que de l'élargir : balayer
		// « action » ou « étape » serait un FAUX POSITIF MESURÉ — l'invite écrit
		// légitimement « ne porte qu'UNE action » et « la PROCHAINE ÉTAPE ». Le reste de
		// la doctrine du § 4 bis n'est constatable par aucun instrument (KR-229) et vit
		// en commentaire dans `INVITES`.
		expect(systeme).toContain('action')
		expect(systeme).toContain('étape')
	})

	it('l invite du quatrieme role INTERDIT la duree en langue naturelle, sans nommer aucune constante', async () => {
		// LA LIGNE DE L'ITÉRATION, et c'est le risque MAJEUR du rôle : à qui l'on demande
		// des étapes, un modèle écrit « au bout de trois jours ». Cela entrerait dans
		// `action`, et la n° 12 l'injecterait au rôle acteur, qui jouerait un temps QUE
		// LE MOTEUR N'A JAMAIS COMPTÉ. Aucun validateur ne le constate (KR-229) :
		// L'INVITE EST LE SEUL ENDROIT QUI RESTE pour l'interdire.
		const systeme = INVITES[ROLE_4].systeme

		expect(systeme).toContain('au bout de trois jours')
		expect(systeme).toContain('le lendemain')
		expect(systeme).toContain('après une semaine')
		expect(systeme).toContain('le temps est compté ailleurs')
		// … et elle ne récite NI la constante du dépôt, NI son chiffre, NI le mot
		// « tour », réservé au round de combat.
		expect(systeme).not.toContain('DUREE_MIN')
		expect(systeme.toLowerCase()).not.toContain('tour')
	})
})

describe('POST /ia/personnage-relations — la route du cinquieme role', () => {
	const ROLE_5 = 'personnage-relations'
	const URL_IA_5 = `https://genliv.example.workers.dev/ia/${ROLE_5}`

	/** Le corps du CINQUIÈME rôle n'a PAS de `champ` non plus : LE RÔLE EST LE CHAMP.
	 *  Et il ne porte AUCUNE intensité — le modèle ne voit jamais le nombre, que le code
	 *  pose à l'acceptation (`INTENSITE_INITIALE`). */
	function corps5(octets: number): string {
		const squelette = JSON.stringify({ role: ROLE_5, contexte: '' })
		const aRemplir = octets - squelette.length
		if (aRemplir < 0) throw new Error('taille demandée plus petite que le squelette du corps')
		return JSON.stringify({ role: ROLE_5, contexte: 'x'.repeat(aRemplir) })
	}

	function demande5(corps: string, options: { methode?: string } = {}): Request {
		const methode = options.methode ?? 'POST'
		return new Request(URL_IA_5, {
			method: methode,
			headers: { 'Content-Type': 'application/json', 'X-Sync-Key': CLE },
			body: methode === 'GET' ? undefined : corps,
		})
	}

	it('la route du cinquieme role repond aux memes branches, toutes en JSON', async () => {
		// LA LISTE DE CONTRÔLE KR-233, rejouée entière sur la route neuve : POST seul,
		// 404 sur rôle inconnu, 503 sur amont non configuré, plafond de corps EN OCTETS
		// avec 413, corps illisible — et TOUT en JSON.

		// 1 — POST SEUL.
		const surGet = await worker.fetch(demande5('', { methode: 'GET' }), env())
		expect(surGet.status).toBe(405)
		expect(surGet.headers.get('Content-Type')).toBe('application/json')
		await expect(surGet.json()).resolves.toEqual({ erreur: 'methode' })

		// 2 — un rôle VOISIN mais absent d'`INVITES` reste inconnu : le cinquième rôle
		// n'ouvre PAS la route à tout segment de chemin.
		const inconnu = await worker.fetch(
			new Request('https://genliv.example.workers.dev/ia/personnage-relation', {
				method: 'POST',
				headers: { 'X-Sync-Key': CLE },
				body: '{}',
			}),
			env(),
		)
		expect(inconnu.status).toBe(404)
		await expect(inconnu.json()).resolves.toEqual({ erreur: 'role-inconnu' })

		// 3 — configuration amont incomplète, sur les TROIS secrets.
		for (const manquant of ['IA_API_KEY', 'IA_BASE_URL', 'IA_MODEL']) {
			const res = await worker.fetch(demande5(corps5(200)), env({ [manquant]: undefined }))
			expect(`${manquant} → ${res.status}`).toBe(`${manquant} → 503`)
			expect(res.headers.get('Content-Type')).toBe('application/json')
			await expect(res.json()).resolves.toEqual({ erreur: 'non-configure' })
		}

		// 4 — le plafond, à ±1 OCTET, sur CE rôle-ci. ⚠ C'est le rôle qui SATURE le
		// plafond depuis l'itération 3c : son pire cas est le plus grand des cinq.
		fetchAmont.mockResolvedValue(amontRendant('{"rapports": [{"envers": "P1", "nature": "Un lien."}]}'))
		const juste = await worker.fetch(demande5(corps5(TAILLE_MAX_CORPS_IA)), env())
		expect(juste.status).toBe(200)
		const unDeTrop = await worker.fetch(demande5(corps5(TAILLE_MAX_CORPS_IA + 1)), env())
		expect(unDeTrop.status).toBe(413)
		expect(unDeTrop.headers.get('Content-Type')).toBe('application/json')
		await expect(unDeTrop.json()).resolves.toEqual({ erreur: 'trop-grand', limite: TAILLE_MAX_CORPS_IA })

		// 4 bis — la mesure est en OCTETS, jamais en unités de code UTF-16.
		const rembourrage = '€'.repeat(Math.ceil(TAILLE_MAX_CORPS_IA / 2))
		const enUtf8 = JSON.stringify({ role: ROLE_5, contexte: rembourrage })
		expect(enUtf8.length).toBeLessThan(TAILLE_MAX_CORPS_IA)
		expect(new TextEncoder().encode(enUtf8).length).toBeGreaterThan(TAILLE_MAX_CORPS_IA)
		expect((await worker.fetch(demande5(enUtf8), env())).status).toBe(413)

		// 5 — corps illisible.
		const illisible = await worker.fetch(demande5('{ ceci ne parse pas'), env())
		expect(illisible.status).toBe(400)
		await expect(illisible.json()).resolves.toEqual({ erreur: 'corps-illisible' })

		// 6 — un amont en échec rend 502, en JSON.
		fetchAmont.mockReset()
		fetchAmont.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as unknown as Response)
		const surEchec = await worker.fetch(demande5(corps5(200)), env())
		expect(surEchec.status).toBe(502)
		await expect(surEchec.json()).resolves.toEqual({ erreur: 'amont' })
	})

	it('le nominal rend la sortie du cinquieme role TELLE QUELLE', async () => {
		// Délibérément NON conforme au schéma du client — QUATRE rapports, dont un au
		// rang inconnu, un doublon, une `nature` vide, plus une clé en trop DANS
		// l'élément : le worker ne valide rien et ne répare rien, la validation vit là où
		// la donnée entre dans le dossier (KR-116). C'est aussi le contre-exemple qui
		// montre que les DOUZE prédicats ne peuvent PAS venir du worker.
		const sortieBrute =
			'{"rapports": [{"envers": "P1", "nature": "Une."}, {"envers": "P1", "nature": ""}, {"envers": "P99", "nature": "Trois.", "intensite": 2}, {"envers": "P4", "nature": "Quatre."}]}'
		fetchAmont.mockResolvedValue(amontRendant(sortieBrute))

		const res = await worker.fetch(demande5(corps5(300)), env())

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('application/json')
		await expect(res.text()).resolves.toBe(sortieBrute)
	})

	it('max_tokens du cinquieme role est LU de l invite, et il ne COINCIDE avec AUCUN autre', async () => {
		// ⚠ BLOC ÉCRIT À LA MAIN, comme les quatre précédents — MESURÉ : ce fichier
		// n'a AUCUNE dérivation par rôle du `max_tokens`, chaque route livre le sien.
		// Le cinquième n'en hérite donc de rien.
		fetchAmont.mockResolvedValue(amontRendant('{"rapports": [{"envers": "P1", "nature": "Un lien."}]}'))

		await worker.fetch(demande5(corps5(300)), env())

		const [url, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('https://amont.invalid/messages')
		const envoye = JSON.parse(String(init.body)) as { system: string; max_tokens: number }
		expect(envoye.system).toBe(INVITES[ROLE_5].systeme)
		expect(envoye.max_tokens).toBe(INVITES[ROLE_5].max_tokens)
		// ⚠ AUCUNE COÏNCIDENCE — et c'est ce qu'aucune des QUATRE entrées précédentes
		// n'a eu à écrire : deux d'entre elles doivent DIRE qu'elles coïncident, celle-ci
		// doit dire qu'elle ne coïncide avec RIEN. Sans cette ligne, un relecteur
		// chercherait de quelle autre valeur elle a été tirée — et n'en trouverait pas.
		const autres = Object.keys(INVITES).filter((role) => role !== ROLE_5)
		expect(autres.filter((role) => INVITES[role].max_tokens === INVITES[ROLE_5].max_tokens)).toEqual([])
		// Discriminant : la comparaison porte bien sur les QUATRE autres — sans lui, une
		// liste vide rendrait l'assertion vraie pour rien (KR-199/235).
		expect(autres).toHaveLength(4)
	})

	it('le protocole amont reste EPINGLE, et le cinquieme role ne l etend pas', async () => {
		// L'exigence de la ratification vaut pour CHAQUE rôle ajouté : ni `tool_use`, ni
		// `response_format`, et la version d'API reste ÉPINGLÉE — pas « la dernière ».
		fetchAmont.mockResolvedValue(amontRendant('{"rapports": [{"envers": "P1", "nature": "Un lien."}]}'))

		await worker.fetch(demande5(corps5(300)), env())

		const [, init] = fetchAmont.mock.calls[0] as [string, RequestInit]
		expect((init.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01')
		const envoye = JSON.parse(String(init.body)) as Record<string, unknown>
		expect(Object.keys(envoye).sort()).toEqual(['max_tokens', 'messages', 'model', 'system'])
	})

	it('l invite du cinquieme role n ecrit AUCUN nom de champ de relations[]', async () => {
		// LE VETO DE DOMAINE, gardé là où il peut l'être : la clé réseau NOMME LA FORME
		// (`rapports`, `envers`, `nature`), jamais le champ. Les cinq mots ci-dessous
		// sont les QUATRE champs de `Relation` plus le nom de la collection — leur
		// absence est ce qui rend l'écart visible si quelqu'un « aide » le modèle en
		// nommant le champ, ou pire en lui apprenant l'existence de `secret`.
		const systeme = INVITES[ROLE_5].systeme.toLowerCase()
		const interdits = ['intensite', 'intensité', 'secret', 'cible_id', 'relations', 'lien']

		expect(interdits.filter((mot) => systeme.includes(mot))).toEqual([])
		// Discriminants : la liste balayée n'est pas vide, et chaque mot SERAIT détecté
		// s'il y était (KR-199/235).
		expect(interdits.length).toBeGreaterThan(0)
		expect(interdits.filter((mot) => `${systeme} ${mot}`.includes(mot))).toEqual(interdits)
		// ⚠ GARDE DÉLIBÉRÉMENT ÉTROIT, ET SA LIMITE EST DÉCLARÉE ICI PLUTÔT QU'ÉLARGIE :
		// balayer « tour » — que le § « interdit de réciter » nomme pourtant — serait un
		// FAUX POSITIF MESURÉ, l'invite écrivant légitimement « ce que l'autre éprouve en
		// reTOUR ». Un scanner non ancré a des faux positifs (KR-235), et une garde qui
		// apprend à modifier le témoin est pire que pas de garde.
		expect(systeme).toContain('retour')
		expect(systeme).toContain('tour')
	})

	it('l invite du cinquieme role INTERDIT le chiffre et l echelle, SANS interdire la charge', async () => {
		// LA DÉCISION 7 DU § 4 bis, et c'est le point où une « harmonisation » coûterait
		// le plus cher : `Relation.lien` REMPLACE le chiffre côté prose. Une consigne
		// « reste neutre » viderait le champ de ce pour quoi il existe, et un degré rendu
		// par le modèle déplacerait une règle du jeu dans un prompt — un seuil en dépend.
		const systeme = INVITES[ROLE_5].systeme

		expect(systeme).toContain('jamais par un chiffre ni par une échelle')
		// … et elle dit bien que la FORCE se dit, elle ne l'interdit pas.
		expect(systeme).toContain('Tu dis par les mots la force de ce qui les attache')
		// ⚠ LE PIÈGE DE RECOPIE n° 1, ÉPINGLÉ : la ligne du rôle détenteurs, recopiée
		// ici, TUERAIT LE SEUL CHAMP `ia` de ce rôle — et RIEN d'autre ne rougirait.
		expect(INVITES['indice-detenteurs'].systeme).toContain("Tu ne rédiges rien d'autre")
		expect(systeme).not.toContain("Tu ne rédiges rien d'autre")
		expect(systeme).not.toContain('une liste vide est une réponse juste')
		// ⚠ LE PIÈGE DE RECOPIE n° 2 : « une INTENTION » (rôle plan) produirait une
		// action datable gelée dans un champ que le moteur traite en fait permanent. La
		// queue livrée ferme les DEUX recopies sans prononcer le mot.
		expect(INVITES['personnage-plan'].systeme).toContain('une INTENTION')
		expect(systeme).not.toContain('une INTENTION')
		expect(systeme).toContain("ni une chose qu'il entreprend")
		// LE GARDE DE SOURCE CONTRE LE NOMMAGE — substitut du scanner de noms propres,
		// rejeté parce que L'INSTRUMENT EST INVERSÉ : `nom` n'étant injecté nulle part,
		// il rougirait sur une prose JUSTE et resterait vert sur le nom INVENTÉ.
		// ⚠ SA LIMITE EST DÉCLARÉE DANS LE TEST : il épingle LA PRÉSENCE DE LA CONSIGNE,
		// JAMAIS SON OBÉISSANCE. Aucun instrument du dépôt ne constate la seconde
		// (KR-229), et le dire vaut mieux que de laisser croire le contraire.
		expect(systeme).toContain('Tu ne donnes de nom à personne')
		// CAS NÉGATIF FABRIQUÉ, sans lequel le `toContain` ci-dessus est INERTE.
		const sansConsigne = systeme.split('\n').filter((ligne) => !ligne.startsWith('Tu ne donnes de nom'))
		expect(sansConsigne.join('\n')).not.toContain('Tu ne donnes de nom à personne')
		expect(sansConsigne.length).toBe(systeme.split('\n').length - 1)
	})

	it('l invite du cinquieme role porte la CONTREPARTIE de la liste, que nul predicat ne garde', async () => {
		// § 4 bis, décision 5 — LA LIGNE NEUVE, propre à la LISTE, et la contrepartie
		// exigée de la concession « liste » contre « scalaire » : trois liens d'un seul
		// jet forment une CONSTELLATION, l'auteur en accepte deux et en refuse un, et il
		// reste une prose qui renvoie à une relation qui n'existe pas.
		// ⚠ LA MOITIÉ VALIDATEUR EST DÉLIBÉRÉMENT ABSENTE (KR-229) : aucun prédicat ne
		// peut constater qu'une `nature` renvoie à une autre proposition du même lot.
		// L'ÉCRAN NE DOIT DONC RIEN PROMETTRE DE TEL — c'est écrit ici parce que c'est le
		// seul endroit du dépôt où la propriété existe.
		const systeme = INVITES[ROLE_5].systeme

		expect(systeme).toContain('ne renvoie à aucune des autres que tu proposes')
		// … et la moitié SYMÉTRIQUE du prédicat (7) : le validateur refuse la liste vide,
		// donc l'invite doit en demander au moins une, sinon les deux se contrediraient.
		expect(systeme).toContain('et au moins une')
		// … et la relation est un fait DU PORTEUR, jamais de la PAIRE.
		expect(systeme).toContain("jamais ce que l'autre éprouve en retour")
	})
})
