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
 *   POST /ia/{role}  — relais d'un appel modèle pour le copilote de rédaction
 *
 * LA ROUTE `/ia/` — pourquoi l'invite vit ICI et non dans le client (KR-236) :
 * le discriminant n'est pas la lisibilité mais la MODIFIABILITÉ. Une invite posée
 * côté client est rejouable par quiconque ouvre les devtools, or c'est ce worker
 * qui détient la clé d'API et qui paie. Règle : le CLIENT décide QUELLES DONNÉES
 * SORTENT, le WORKER décide CE QU'ON DEMANDE.
 *
 * CONFIGURATION — trois secrets d'environnement, AUCUN dans `wrangler.toml`,
 * aucun côté client, aucun renvoyé dans une réponse :
 *   wrangler secret put IA_API_KEY
 *   wrangler secret put IA_BASE_URL
 *   wrangler secret put IA_MODEL
 * Tant que l'un des trois manque, la route rend `503 {"erreur":"non-configure"}`
 * et le client bascule sur sa branche `indisponible`. `wrangler.toml` N'EST PAS
 * touché par l'itération qui pose cette route.
 *
 * EXPOSITION, nommée sans euphémisme : `X-Sync-Key` est une clé d'ESPACE DE NOMS,
 * pas une autorisation (KR-148), et `ALLOWED_ORIGINS` est commenté dans
 * `wrangler.toml`, donc le repli CORS est `'*'` en production. Quiconque connaît
 * une clé de synchronisation valide peut donc brûler du budget modèle. Aucun
 * limiteur de débit n'est livré ici : point d'extension nommé, non livré.
 *
 * TEMPS MURAL DE L'ALLER-RETOUR AMONT — troisième point d'extension nommé, non
 * livré lui non plus. Le `fetch` vers le fournisseur (`handleIa`, branches 6/7)
 * part SANS `signal` et SANS délai : c'est le CLIENT qui est borné (45 s,
 * `CopiloteService.ts`), donc l'auteur n'est jamais bloqué — mais une invocation
 * de worker peut, elle, rester ouverte aussi longtemps que l'amont le veut, ce
 * qui se paie en temps CPU/mural facturé et en connexions retenues. Le geste, le
 * jour où on le fait : un `AbortController` local + `setTimeout` autour de ce
 * `fetch`, abandon rangé sur la branche 6 (`502 {"erreur":"amont"}`), le client
 * n'ayant alors rien de neuf à apprendre. Condition d'ouverture : premier relevé
 * de consommation anormale, ou première mise en ligne publique — la même que
 * pour le limiteur de débit ci-dessus.
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
	/** SECRET d'environnement (`wrangler secret put IA_API_KEY`). Jamais dans
	 *  `wrangler.toml`, jamais côté client, jamais renvoyé dans une réponse. */
	IA_API_KEY?: string
	/**
	 * L'URL du fournisseur de modèle, et le modèle demandé — SECRETS
	 * d'environnement eux aussi, et c'est délibéré : le plan d'itération ne nomme
	 * aucun fournisseur, et écrire une URL ou un identifiant de modèle EN DUR ici
	 * serait inventer une valeur que personne n'a décidée. Les deux se règlent au
	 * déploiement, au même endroit et par le même geste que la clé.
	 */
	IA_BASE_URL?: string
	IA_MODEL?: string
}

const BASE_CORS = {
	// `POST` est arrivé avec la route `/ia/` : SANS lui, le préflight d'un appel IA
	// est refusé par le navigateur — une panne SILENCIEUSE, invisible en test
	// unitaire de route, qui ne se voit qu'en production (KR-233).
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

/**
 * LES GABARITS DE SORTIE, APPARIÉS AU RÔLE — le littéral que chaque invite
 * incruste, et la SEULE chose sur laquelle le garde KR-236 a le droit de porter.
 *
 * DUPLIQUÉ depuis `src/brain/copilote/schemaSortie.ts`, et la duplication est
 * DÉLIBÉRÉE : aucun import `worker/` → `src/brain/`, qui traînerait du code client
 * dans le paquet wrangler. La liaison entre les deux exemplaires est un BALAYAGE
 * DE SOURCE (`worker/frontiere.test.ts`), jamais un import de production. Le
 * balayage s'ancre sur l'ENTRÉE et non sur la déclaration, ce qui est aussi ce qui
 * rend son CANARI CROISÉ écrivable : intervertir les deux gabarits doit rougir.
 *
 * ⚠ MÊME FORME D'ÉCRITURE que `src/brain/copilote/schemaSortie.ts` — une entrée par
 * ligne, une tabulation d'indentation, guillemets simples, virgule finale : c'est
 * ce que l'expression ancrée du test extrait des DEUX côtés.
 *
 * `Record<string, string>` et non `Record<RoleCopilote, string>` : le type de rôle
 * vit dans le client, et ce fichier n'importe rien de `src/`. La totalité des deux
 * tables est portée par le test, pas par le compilateur — c'est le prix du paquet
 * wrangler propre, et il est nommé.
 *
 * NE JAMAIS garder sur la clé nue : `valeur` est un mot français courant, et une
 * invite disant « la valeur du personnage » satisferait `includes('valeur')` sans
 * rien demander au modèle.
 */
const GABARIT_SORTIE: Record<string, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

/**
 * L'INVITE vit ICI et nulle part ailleurs. Exportée pour le SEUL garde KR-236.
 *
 * `max_tokens` est un paramètre de REQUÊTE du fournisseur — pas une règle du
 * dossier, et c'est son unique domicile légitime. Sa valeur est DÉRIVÉE d'une
 * mesure : la plus longue des trois proses d'identité du dossier de référence
 * fait 146 caractères (`pnj.corvin-le-marchand.apparence`), soit ~49 jetons à
 * ~3 caractères par jeton en français ; facteur 3, arrondi à la centaine
 * supérieure, donne 200. Ce n'est PAS une borne du schéma : les trois proses sont
 * délibérément non bornées (KR-203), et rien ici ne doit le laisser croire.
 *
 * LA VOIX, écrite noir sur blanc parce que c'est ici qu'elle se décide : AUCUNE
 * consigne « deuxième personne, présent, immersive ». `description_joueur` est du
 * CONTEXTE injecté à un narrateur, jamais émis verbatim — les seules proses du
 * dossier lues mot pour mot sont `charpente.depart.texte_ouverture_joueur` et
 * `charpente.fins[].texte`, et c'est ce qui les rend `moteur`. Une prose écrite en
 * voix de scène deviendrait FAUSSE le jour où le moteur l'injecterait comme fiche.
 */
export const INVITES: Record<string, { systeme: string; max_tokens: number }> = {
	'personnage-prose': {
		systeme: [
			"Tu assistes l'AUTEUR d'un livre-jeu qui rédige la fiche d'un personnage.",
			'À partir du contexte fourni, tu rédiges le texte du champ nommé par la demande, et de ce champ seul.',
			'',
			`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['personnage-prose']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
			'',
			"Tu écris une NOTE DE FICHE, à l'adresse de l'auteur : ce texte sera plus tard donné comme contexte à un narrateur, il ne sera jamais lu mot pour mot à un joueur.",
			"Tu respectes le ton de l'aventure et ses interdits de ton.",
			"Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.",
		].join('\n'),
		max_tokens: 200,
	},
	/**
	 * LE SECOND RÔLE. Ce que cette invite N'A PAS LE DROIT DE RÉCITER, et c'est une
	 * décision, pas un oubli : le SEUIL de `indice-sans-source` (ni chiffre ni
	 * paraphrase — un modèle qui le connaît optimise l'EXTINCTION DE L'ALERTE au lieu
	 * de répondre à la question), le message du contrôle, la table d'audience, le
	 * sens des trois certitudes, les quatre portes de révélation, les
	 * caractéristiques, les seuils, les tiers.
	 *
	 * « Jamais plus de trois » y figure EN PLUS du contrat, jamais À LA PLACE :
	 * `PROPOSITIONS_MAX` n'est ni une règle du jeu ni une règle du dossier, c'est la
	 * FORME DE LA RÉPONSE ATTENDUE, même statut que `max_tokens`. L'invite persuade,
	 * le validateur décide.
	 */
	'indice-detenteurs': {
		systeme: [
			"Tu assistes l'AUTEUR d'un livre-jeu qui répartit ce que ses personnages savent.",
			"La demande te donne UN fait, puis une liste de personnages repérés P1, P2, … Tu désignes ceux qui pourraient plausiblement connaître ce fait, au vu de ce que la liste dit d'eux, et de rien d'autre.",
			'',
			`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['indice-detenteurs']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
			'',
			"Chaque élément est un repère de la liste, recopié tel quel, entre guillemets. Tu n'en inventes aucun, tu ne répètes aucun repère, et tu n'en donnes jamais plus de trois.",
			"Tu en donnes moins, ou aucun, quand la liste ne t'en dit pas assez pour choisir : une liste vide est une réponse juste.",
			"Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification.",
		].join('\n'),
		// DÉRIVÉ, jamais recopié de 200 : pire cas 3 rangs à deux chiffres
		// `{"detenteurs": ["P10", "P11", "P12"]}` ≈ 37 car., marge de format ~40 ;
		// jetons = L/r × 3, arrondi à la centaine — r=3 ⇒ 40, r=2 (pire) ⇒ 60 ⇒ 100.
		// Robuste au choix du ratio, donc risque de mesure nul.
		max_tokens: 100,
	},
}

/**
 * Plafond HTTP du corps d'un appel IA, en OCTETS — enveloppe et invite comprises.
 *
 * UN SEUL plafond, calé sur le PIRE RÔLE : la garde worker protège le BUDGET
 * MODÈLE, c'est le budget CLIENT — lui, PAR RÔLE — qui refuse en amont. Doctrine
 * non rouverte à l'itération 2.
 *
 * `max` sur les rôles de `ceil((3 × budget[rôle] + E[rôle]) / 1024) × 1024`, où `E`
 * est l'enveloppe en octets : le squelette du corps à contexte vide, plus l'invite
 * composée. 3 octets par unité de code est la BORNE HAUTE réelle en UTF-8, et elle
 * est MESURÉE : `'€'` (BMP) coûte 3 octets pour UNE unité de code, alors qu'un
 * émoji coûte 4 octets pour DEUX unités, soit 2 par unité. Écrire 4 serait une
 * marge inventée présentée comme une borne. Ce facteur 3 couvre AUSSI l'échappement
 * JSON du contexte : seuls des caractères ASCII sont échappés, et un échappement
 * coûte 2 octets pour une unité de code.
 *
 * MESURE DU 2026-09-17, itération 2 :
 *   `personnage-prose`  — squelette 90 o + invite 693 o ⇒ E = 783 ;
 *                         ceil((3 × 6000 + 783) / 1024) × 1024 = 19 456
 *   `indice-detenteurs` — squelette 42 o + invite 808 o ⇒ E = 850 ;
 *                         ceil((3 × 17000 + 850) / 1024) × 1024 = 52 224
 *   `max` = 52 224.
 *
 * (L'itération 1 relevait `E = 815` pour le rôle prose par la variante « corps réel
 * moins texte du contexte » ; les deux méthodes donnent le MÊME plafond de 19 456
 * pour ce rôle, l'écart n'étant que l'échappement des sauts de ligne.)
 *
 * `worker/frontiere.test.ts` prouve que ce plafond couvre le budget client de
 * CHAQUE rôle converti au pire cas d'octets, et ses deux canaris — portés par le
 * rôle le plus large, DÉRIVÉ par `Math.max`, jamais écrit — prouvent que le lien
 * est séparateur : retirer 1 Ko au plafond, ou ajouter 400 au budget, le fait
 * rougir.
 *
 * CE PLAFOND N'EST PAS UN CLIQUET : c'est une borne de refus, re-dérivée par la
 * même formule sur une nouvelle mesure chaque fois que le contexte s'élargit.
 */
export const TAILLE_MAX_CORPS_IA = 52_224

/** Toute réponse de la route `/ia/` est du JSON, y compris ses échecs (KR-233) :
 *  le client lit un motif, jamais une phrase à analyser. */
function respondIa(corps: unknown, status: number): Response {
	return respond(JSON.stringify(corps), status, { 'Content-Type': 'application/json' })
}

/**
 * Le premier bloc de texte d'une réponse de modèle, ou `null` si la charge n'a
 * pas la forme attendue — aucune supposition, aucune levée (KR-116).
 *
 * PROTOCOLE AMONT : **Anthropic Messages**, version épinglée `2023-06-01`. La
 * forme lue ici — `content[]`, chaque bloc portant un `text` — EST cet engagement.
 * C'EST UNE DÉCISION DE COMITÉ, RATIFIÉE le 2026-09-17 à l'itération 2 : la
 * question ouverte « quel protocole amont » avait pour condition d'ouverture
 * l'arrivée d'un SECOND rôle, elle est remplie, et le comité l'a close. Ce n'est
 * donc plus le choix de l'ouvrier. Écrit ICI parce qu'un arbitrage qui ne vit que
 * dans une note de revue est un arbitrage que le prochain lecteur du code ne
 * trouvera pas (BUG-082).
 *
 * CE QUE LA RATIFICATION EXIGE EN RETOUR : le second rôle N'ÉTEND PAS LE COUPLAGE.
 * Cette fonction et le bloc de requête de `handleIa` (en-têtes + enveloppe) restent
 * les DEUX SEULS endroits à réécrire si le fournisseur change ; une entrée de
 * `INVITES` n'apporte que `{systeme, max_tokens}` — ni `tool_use`, ni
 * `response_format`. Le contrat de la route ne bouge pas — sept branches, réponses
 * JSON, CORS, garde d'octets, sortie rendue telle quelle, garde KR-236 sur
 * `GABARIT_SORTIE`.
 */
function premierTexte(charge: unknown): string | null {
	if (typeof charge !== 'object' || charge === null) return null
	const contenu = (charge as { content?: unknown }).content
	if (!Array.isArray(contenu)) return null
	for (const bloc of contenu) {
		if (typeof bloc !== 'object' || bloc === null) continue
		const texte = (bloc as { text?: unknown }).text
		if (typeof texte === 'string') return texte
	}
	return null
}

/**
 * LES SEPT BRANCHES de `POST /ia/:role`, dans l'ordre.
 *
 * LE CORPS EST LU AVANT D'ÊTRE REFUSÉ, et c'est assumé : la garde de taille
 * protège le BUDGET MODÈLE, pas la bande passante. C'est précisément pourquoi le
 * budget CLIENT existe en face, qui lui refuse AVANT l'aller-retour.
 *
 * La mesure est faite au `TextEncoder`, JAMAIS par `body.length` : `String.length`
 * compte des unités de code UTF-16, pas des octets. Le garde du `PUT` ci-dessous
 * fait cette faute ; il n'est PAS corrigé ici — hors périmètre — et il n'est pas
 * recopié non plus.
 */
async function handleIa(request: Request, env: Env, role: string): Promise<Response> {
	// 1 — la route ne répond qu'au POST.
	if (request.method !== 'POST') return respondIa({ erreur: 'methode' }, 405)

	// 2 — rôle inconnu. `hasOwnProperty.call` et non `in` : tout objet littéral
	// hérite d'`Object.prototype`, donc `'toString' in INVITES` vaut true et
	// `INVITES['toString']` rendrait une FONCTION (KR-175).
	if (!Object.prototype.hasOwnProperty.call(INVITES, role)) return respondIa({ erreur: 'role-inconnu' }, 404)
	const invite = INVITES[role]

	// 3 — configuration amont incomplète. La clé d'API est nommée par le plan ;
	// l'URL et le modèle le sont par ce fichier, faute de fournisseur nommé
	// ailleurs. Les trois manquent de la même façon et se règlent du même geste.
	const { IA_API_KEY, IA_BASE_URL, IA_MODEL } = env
	if (!IA_API_KEY || !IA_BASE_URL || !IA_MODEL) return respondIa({ erreur: 'non-configure' }, 503)

	const brut = await request.text()

	// 4 — trop grand, EN OCTETS.
	if (new TextEncoder().encode(brut).length > TAILLE_MAX_CORPS_IA) {
		return respondIa({ erreur: 'trop-grand', limite: TAILLE_MAX_CORPS_IA }, 413)
	}

	// 5 — corps illisible.
	let demande: unknown
	try {
		demande = JSON.parse(brut)
	} catch {
		return respondIa({ erreur: 'corps-illisible' }, 400)
	}

	// 6 et 7 — l'aller-retour amont.
	//
	// PROTOCOLE AMONT : **Anthropic Messages**, version épinglée `2023-06-01` —
	// l'en-tête `x-api-key`, l'en-tête de version `anthropic-version`, et l'enveloppe
	// `{model, max_tokens, system, messages}` sont cet engagement, pas une forme
	// générique. C'EST UNE DÉCISION DE COMITÉ, RATIFIÉE le 2026-09-17 à l'itération 2
	// — ce n'est plus le choix de l'ouvrier, et rien n'est « à confirmer » ici.
	// SI LE FOURNISSEUR CHANGE : ce bloc et `premierTexte` ci-dessus, rien d'autre
	// — ni les sept branches, ni le JSON, ni le CORS, ni la garde d'octets, ni
	// KR-236. La version d'API est ÉPINGLÉE et non « la dernière » : un
	// fournisseur qui fait évoluer sa forme de réponse ne doit pas pouvoir casser
	// cette route sans qu'on ait touché ce fichier.
	// CE QUE LE SECOND RÔLE ÉPROUVE ET QUE LE PREMIER N'ÉPROUVAIT PAS : que
	// `max_tokens` VARIE d'un rôle à l'autre — il est bien lu de `invite.max_tokens`,
	// jamais d'une constante de ce bloc.
	//
	// AUCUN `signal`, AUCUN délai : voir la docstring d'en-tête, § temps mural.
	try {
		const amont = await fetch(IA_BASE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IA_API_KEY,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: IA_MODEL,
				max_tokens: invite.max_tokens,
				system: invite.systeme,
				messages: [{ role: 'user', content: JSON.stringify(demande) }],
			}),
		})
		if (!amont.ok) return respondIa({ erreur: 'amont' }, 502)
		const charge: unknown = await amont.json()
		const texte = premierTexte(charge)
		if (texte === null) return respondIa({ erreur: 'amont' }, 502)
		// 7 — la sortie du modèle TELLE QUELLE. Le worker ne répare rien et ne
		// valide rien : la validation vit LÀ OÙ LA DONNÉE ENTRE DANS LE DOSSIER,
		// c'est-à-dire dans le client (KR-116), pour qui ce worker est lui-même une
		// entrée non fiable.
		return respond(texte, 200, { 'Content-Type': 'application/json' })
	} catch {
		return respondIa({ erreur: 'amont' }, 502)
	}
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

	// La route IA se branche APRÈS la garde `X-Sync-Key` — elle s'authentifie par
	// le même en-tête — et AVANT le `match` de `/kv/`, qui rendrait 404.
	const matchIa = url.pathname.match(/^\/ia\/([a-z-]+)$/)
	if (matchIa) return handleIa(request, env, matchIa[1])

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
			if (body.length > 25_000_000) return respond('Payload too large', 413)
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
