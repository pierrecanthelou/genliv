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
	'personnage-repliques': '{"repliques": ["…", "…"]}',
	'personnage-plan': '{"intention": "…"}',
	'personnage-relations': '{"rapports": [{"envers": "P1", "nature": "…"}, {"envers": "P3", "nature": "…"}]}',
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
	/**
	 * LE TROISIÈME RÔLE — une LISTE DE PROSE LIBRE, ce qu'aucun des deux précédents ne
	 * demandait.
	 *
	 * QUATRE DÉCISIONS D'ÉCRITURE, à ne pas « corriger » :
	 *
	 *  1. « ÉCHANTILLON DE VOIX » énonce la DESTINATION du texte, jamais le champ ni sa
	 *     doctrine. AUCUN validateur ne peut constater cette propriété (KR-229) :
	 *     l'invite est le seul endroit qui reste pour la dire.
	 *  2. LE PIÈGE DE RECOPIE, et c'est le plus coûteux : l'invite du rôle prose écrit
	 *     « une NOTE DE FICHE » parce que ses proses sont des DESCRIPTIONS. Une réplique
	 *     est une PHRASE PRONONCÉE — recopier cette ligne-là produirait DES DESCRIPTIONS
	 *     DE VOIX AU LIEU DE VOIX.
	 *  3. « trois au plus » figure EN PLUS du contrat, jamais À LA PLACE :
	 *     `REPLIQUES_PROPOSEES_MAX` est la FORME DE LA RÉPONSE ATTENDUE, même statut que
	 *     `max_tokens`. L'invite persuade, le validateur décide.
	 *     ⚠ ELLE NE DIT JAMAIS « DEUX AU PLUS » : `PARLER_REPLIQUES` borne le DOCUMENT,
	 *     pas la réponse, et le nombre de propositions acceptables varie d'un personnage
	 *     à l'autre.
	 *  4. « et au moins une » est la moitié SYMÉTRIQUE de l'it2 : sans elle, l'invite et
	 *     le validateur se contrediraient — celui-ci refuse la liste vide (rôle de
	 *     RÉDACTION, la liste vide est une non-réponse).
	 *
	 * CE QU'ELLE N'A PAS LE DROIT DE RÉCITER : `PARLER_REPLIQUES` ni son chiffre · le
	 * nom du champ `parler` · les six curseurs, leurs noms, leur échelle, leur
	 * paraphrase · les seuils, tiers, caractéristiques · le message ou le seuil d'un
	 * contrôle · la table d'audience.
	 */
	'personnage-repliques': {
		systeme: [
			"Tu assistes l'AUTEUR d'un livre-jeu qui règle la façon de parler d'un personnage.",
			"À partir du contexte fourni, tu proposes des répliques types : de courtes phrases que CE personnage-là pourrait dire, telles qu'il les dirait.",
			'',
			`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['personnage-repliques']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
			'',
			'Chaque réplique est un ÉCHANTILLON DE VOIX : elle servira plus tard à faire parler ce personnage dans des scènes que tu ne connais pas, elle ne sera jamais lue telle quelle à un joueur.',
			'Tu en donnes trois au plus, et au moins une : même quand le contexte est maigre, une fonction et un but suffisent à faire entendre une voix.',
			'Elles sont toutes différentes, chacune tenant en une ou deux phrases.',
			"Chaque réplique ne dit que ce que CE personnage sait et dirait lui-même : ni ce que l'auteur sait, ni ce qui va se passer, ni ce qu'un autre personnage tait.",
			"Tu respectes le ton de l'aventure et ses interdits de ton.",
			"Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.",
		].join('\n'),
		// DÉRIVÉ, jamais recopié de 400, 200 ni 100 : la plus longue réplique ATTESTÉE
		// sur DEUX SOURCES INDÉPENDANTES fait 74 caractères ; `3 × 74 + 27` d'enveloppe
		// (`{"repliques": ["", "", ""]}`) ⇒ L ≈ 249 ; jetons = L/r × 3 — r=3 ⇒ 249,
		// r=2 (PIRE) ⇒ 373,5 ⇒ arrondi à la centaine supérieure, 400.
		// ⚠ LE RÉSULTAT DÉPEND DU RATIO (300 contre 400) : ce n'est PAS robuste comme
		// l'était l'entrée détenteurs. On prend le pire, ET ON LE DIT.
		// MODE D'ÉCHEC NOMMÉ, déclaré ici plutôt que découvert au runtime : trois
		// répliques très longues feraient TRONQUER le JSON ⇒ refus `schema` côté client
		// ⇒ rejeu ⇒ état terminal. C'est le BON échec — rien n'est réparé, rien n'est
		// persisté.
		max_tokens: 400,
	},
	/**
	 * LE QUATRIÈME RÔLE — la PROCHAINE ÉTAPE d'un plan d'actions. Sa sortie est
	 * SCALAIRE, ce qu'aucun des trois précédents ne rendait depuis l'it1.
	 *
	 * QUATRE DÉCISIONS D'ÉCRITURE, à ne pas « corriger » :
	 *
	 *  1. LE PIÈGE DE RECOPIE, ET IL EST PROPRE À CE RÔLE. L'invite répliques écrit
	 *     « ÉCHANTILLON DE VOIX » : recopiée ici, elle produirait DES RÉPLIQUES.
	 *     L'invite prose écrit « NOTE DE FICHE » : recopiée ici, elle produirait DES
	 *     DESCRIPTIONS. La ligne propre à ce rôle est « une INTENTION … ce n'est jamais
	 *     une phrase qu'il prononce », et AUCUN validateur ne peut constater cette
	 *     propriété (KR-229) : l'invite est le seul endroit qui reste pour la dire.
	 *  2. « Tu en proposes UNE, et toujours une » est la moitié SYMÉTRIQUE du prédicat
	 *     de non-vacuité du validateur, et elle NE CITE AUCUNE CONSTANTE — il n'y en a
	 *     plus : la sortie est scalaire, « deux » n'est pas représentable.
	 *  3. « elle n'en répète aucune » est PERSUASIF SEULEMENT. Le prédicat de doublon
	 *     est hors périmètre (§ 8, n° 12) : rien ne refuse une recopie. L'écran ne doit
	 *     donc rien promettre de tel non plus.
	 *  4. LA LIGNE DE LA DURÉE EST LA LIGNE DE L'ITÉRATION. Elle ne dit ni « pas
	 *     d'horloge », ni `duree`, ni `DUREE_MIN` : elle interdit le motif EN LANGUE
	 *     NATURELLE, avec trois exemples, et s'arrête à « le temps est compté ailleurs ».
	 *     C'est le risque MAJEUR du rôle, et il n'est constatable par aucun instrument.
	 *
	 * CE QU'ELLE N'A PAS LE DROIT DE RÉCITER : `DUREE_MIN` ni son chiffre · toute unité
	 * de temps de session · l'existence de `duree`, `si_bloque`, `declencheur_texte`,
	 * `declencheur_expr` et leurs noms · le langage de conditions D1 · LE NOM DU CHAMP
	 * `action` OU DE TOUT AUTRE CHAMP · la table d'audience · caractéristiques, seuils,
	 * tiers · le message ou le seuil d'un contrôle · LE MOT « TOUR », réservé au round
	 * de combat.
	 */
	'personnage-plan': {
		systeme: [
			"Tu assistes l'AUTEUR d'un livre-jeu qui écrit le plan d'actions d'un personnage.",
			"À partir du contexte fourni, tu proposes la PROCHAINE ÉTAPE de ce plan : ce que CE personnage-là entreprend ensuite pour obtenir ce qu'il veut.",
			'',
			`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['personnage-plan']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
			'',
			"Cette étape est une INTENTION que le personnage poursuit : elle servira plus tard de consigne à qui le fait agir, elle ne sera jamais lue telle quelle à un joueur, et ce n'est jamais une phrase qu'il prononce.",
			"Elle prolonge les étapes déjà listées, elle n'en répète aucune, et elle vient après la dernière.",
			"Tu en proposes UNE, et toujours une : même quand le contexte est maigre, une fonction et un but suffisent à dire ce qu'un personnage entreprend ensuite.",
			"Elle tient en une phrase et ne porte qu'UNE action.",
			"Tu n'écris jamais de durée ni de délai — ni « au bout de trois jours », ni « le lendemain », ni « après une semaine » : le temps est compté ailleurs.",
			"Tu n'écris jamais à quelle condition l'étape commence, ni ce que le personnage fait si elle échoue, ni aucun numéro d'étape.",
			"Tu respectes le ton de l'aventure et ses interdits de ton.",
			"Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.",
		].join('\n'),
		// DÉRIVÉ, jamais recopié — et surtout PAS de `personnage-prose`, dont la valeur
		// est la même par COÏNCIDENCE : elle vient d'une mesure SANS RAPPORT (la plus
		// longue prose d'identité, 146 caractères). Écrit ici parce que, sans cette
		// phrase, un relecteur croira à une recopie et « harmonisera » un jour.
		// MESURE DU 2026-09-18, DEUX SOURCES INDÉPENDANTES pour la plus longue étape
		// attestée : `dossier-reference.json` (`pnj.mira-la-guerisseuse`, étape 1) = 67
		// caractères ; `dossier-fiches/tests/fichePersonnage.test.tsx:176` = 68. P = 68.
		// Enveloppe `{"intention": ""}` = 17 ⇒ L = 85 ; jetons = L/r × 3, arrondi à la
		// centaine supérieure — r=3 ⇒ 100, r=2 (PIRE) ⇒ 127,5 ⇒ 200.
		// ⚠ LE RÉSULTAT DÉPEND DU RATIO (100 contre 200) : on prend le pire, ET ON LE DIT.
		// MODE D'ÉCHEC NOMMÉ : une intention très longue ferait TRONQUER le JSON ⇒ refus
		// `schema` côté client ⇒ rejeu ⇒ état terminal. C'est le BON échec.
		max_tokens: 200,
	},
	/**
	 * LE CINQUIÈME RÔLE — et LE PREMIER RÔLE MIXTE : sa sortie porte À LA FOIS un JETON
	 * de désignation (`envers`) et de la PROSE (`nature`), ce qu'aucun des quatre
	 * précédents ne demandait. C'est ce qui rend son invite dangereuse à écrire : les
	 * deux moitiés ont chacune leur piège de recopie, et ils s'annulent mutuellement.
	 *
	 * SEPT DÉCISIONS D'ÉCRITURE, à ne pas « corriger » :
	 *
	 *  1. ⚠ LE PIÈGE DE RECOPIE, ET IL EST LE PLUS COÛTEUX DU DÉPÔT : `indice-detenteurs`
	 *     est l'AUTRE rôle à rangs, donc le jumeau structurel APPARENT. Sa ligne « Tu ne
	 *     rédiges rien d'autre : ni nom, ni phrase, ni justification » recopiée ici
	 *     TUERAIT LE SEUL CHAMP `ia` de ce rôle — `nature` manquerait, le validateur
	 *     classerait `schema`, rejeu, état terminal. UN RÔLE QUI NE PEUT JAMAIS RÉUSSIR,
	 *     ET RIEN NE ROUGIRAIT AU DÉPÔT : les tests de forme passeraient tous, seule la
	 *     production le dirait. Sa jumelle (« une liste vide est une réponse juste »)
	 *     produirait le même néant par l'autre bout, le validateur refusant ici la liste
	 *     vide.
	 *  2. RUNNER-UP : le JSDoc de `Relation.lien` dit « même famille que
	 *     `plan_actions[].action` », ce qui invite à recopier « une INTENTION » (3b) —
	 *     c'est-à-dire une ACTION DATABLE qui cesse d'être vraie une fois faite, gelée
	 *     dans un champ que le moteur traite en FAIT PERMANENT. Même famille ≠ même
	 *     chose : UNE INTENTION SE FAIT, UN LIEN S'ÉPROUVE. La queue « ni une chose qu'il
	 *     entreprend » ferme LES DEUX recopies SANS prononcer le mot « intention ».
	 *  3. « trois au plus » figure EN PLUS du contrat, jamais À LA PLACE :
	 *     `RELATIONS_PROPOSEES_MAX` est la FORME DE LA RÉPONSE ATTENDUE, même statut que
	 *     `max_tokens`. L'invite persuade, le validateur décide. Le garde apparié de
	 *     `worker/frontiere.test.ts` s'applique : le mot doit s'y trouver LITTÉRALEMENT,
	 *     et aucune AUTRE borne en toutes lettres ne doit s'y trouver.
	 *  4. « et au moins une » est la moitié SYMÉTRIQUE du prédicat de non-vacuité :
	 *     sans elle, l'invite et le validateur se contrediraient.
	 *  5. ⚠ « ne renvoie à aucune des autres que tu proposes » — LIGNE NEUVE, PROPRE À LA
	 *     LISTE, et c'est LA CONTREPARTIE EXIGÉE de la concession « liste » contre
	 *     « scalaire ». Trois liens d'un seul jet forment une CONSTELLATION ; l'auteur en
	 *     accepte deux et en refuse un, et il reste une prose qui renvoie à une relation
	 *     qui n'existe pas. LA MOITIÉ VALIDATEUR EST DÉLIBÉRÉMENT ABSENTE (KR-229) :
	 *     aucun prédicat ne peut le constater, donc L'ÉCRAN NE DOIT RIEN PROMETTRE DE TEL.
	 *  6. « jamais ce que l'autre éprouve en retour » — la relation est un fait DU
	 *     PORTEUR, jamais de la PAIRE. Le document range la ligne chez celui qui
	 *     l'éprouve ; une nature réciproque écrirait la moitié de quelqu'un d'autre.
	 *  7. ⚠ LA LIGNE DU DEGRÉ INTERDIT LE CHIFFRE ET L'ÉCHELLE, PAS LA CHARGE
	 *     ÉMOTIONNELLE. Le JSDoc de `Relation.lien` dit que la prose REMPLACE le chiffre —
	 *     « reste neutre » VIDERAIT LE CHAMP DE CE POUR QUOI IL EXISTE. Un seuil de jeu en
	 *     dépend (§ 8, n° 48) : un degré rendu par le modèle déplacerait une règle du jeu
	 *     dans un prompt.
	 *
	 * CE QU'ELLE N'A PAS LE DROIT DE RÉCITER : `INTENSITE_MIN`/`INTENSITE_MAX` · le nom
	 * `intensite` et toute paraphrase de degré · l'existence de `secret`, `cible_id`,
	 * `relations` · LE NOM DU CHAMP `lien` · ⚠ LE SEUIL `intensite >= 1` du transfert
	 * d'indice hors caméra — un modèle qui le connaît écrirait des liens POUR OUVRIR CE
	 * CANAL · la table d'audience · `CANDIDATS_MAX` · seuils, tiers · LE MOT « TOUR ».
	 */
	'personnage-relations': {
		systeme: [
			"Tu assistes l'AUTEUR d'un livre-jeu qui règle ce qui attache un personnage aux autres.",
			"La demande te donne UNE fiche de personnage, puis une liste d'autres personnages repérés P1, P2, … Tu désignes ceux à qui celui de la fiche est attaché, et tu écris pour chacun ce qui les attache.",
			'',
			`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['personnage-relations']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
			'',
			"Chaque repère est recopié tel quel depuis la liste, entre guillemets ; tu n'en inventes aucun et tu ne désignes jamais deux fois le même.",
			"Chaque nature est une DIDASCALIE : elle dit ce que celui de la fiche éprouve envers l'autre et ce qui l'y a mené ; elle servira plus tard de consigne à qui le fait agir, et elle ne sera jamais lue telle quelle à un joueur.",
			"Tu en donnes trois au plus, et au moins une : même quand la liste est maigre, une fonction et un but suffisent à dire ce qui rapproche ou sépare deux personnes d'une même histoire.",
			"Chaque nature ne dit que ce que CE personnage-là éprouve, jamais ce que l'autre éprouve en retour.",
			'Chaque nature se tient seule : elle ne parle que de ces deux personnes et ne renvoie à aucune des autres que tu proposes.',
			'Tu dis par les mots la force de ce qui les attache, jamais par un chiffre ni par une échelle.',
			'Tu ne donnes de nom à personne : dans ces phrases, ces deux-là se disent « il », « elle », « son frère », « celle qui tient la forge », jamais par un nom.',
			"Chaque nature tient en une phrase, et ce n'est jamais une phrase qu'il prononce ni une chose qu'il entreprend.",
			"Tu respectes le ton de l'aventure et ses interdits de ton.",
			"Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.",
		].join('\n'),
		// DÉRIVÉ, jamais recopié — et ⚠ IL NE COÏNCIDE AVEC AUCUNE VALEUR LIVRÉE (200,
		// 100, 400, 200), ce qu'aucune des quatre entrées précédentes n'a eu à écrire :
		// les trois qui coïncidaient devaient le DIRE, celle-ci doit dire qu'elle ne
		// coïncide pas, sinon un relecteur cherchera de quelle autre elle a été tirée.
		// MESURE DU 2026-09-19, RE-COMPTÉE PROGRAMMATIQUEMENT, DEUX SOURCES INDÉPENDANTES
		// pour la plus longue `relations[].lien` attestée : `dossier-reference.json`
		// (`pnj.corvin-le-marchand` → `pnj.mira-la-guerisseuse`) = 109 caractères ;
		// `dossier-minimal.json` = 109 également. P = 109 — le tour 1 du comité disait
		// 110, RE-COMPTÉ C'EST 109.
		// Enveloppe : le pire cas de rang est `P10` (`CANDIDATS_MAX` = 8 aujourd'hui, donc
		// deux chiffres est déjà un majorant), sur TROIS éléments — 101 octets sous la
		// forme compacte que produit un modèle, 113 sous la forme ESPACÉE du gabarit.
		// L = 3 × 109 + 113 = 440 ; jetons = L/r × 3, arrondi à la centaine supérieure —
		// r=3 ⇒ 500, r=2 (PIRE) ⇒ 660 ⇒ 700.
		// ⚠ LE RÉSULTAT DÉPEND DU RATIO (500 contre 700) : on prend le pire, ET ON LE DIT.
		// Il ne dépend EN REVANCHE PAS de la forme d'enveloppe : la variante compacte
		// donne L = 428 ⇒ 642 ⇒ 700, le même palier.
		// MODE D'ÉCHEC NOMMÉ : trois `nature` très longues feraient TRONQUER le JSON ⇒
		// refus `schema` côté client ⇒ rejeu ⇒ état terminal. C'est le BON échec — rien
		// n'est réparé, rien n'est persisté.
		max_tokens: 700,
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
 * MESURE DU 2026-09-18, itération 3a — LE TROISIÈME RÔLE NE DÉPLACE PAS LE `max`, et
 * « inchangé » est ici une MESURE, pas une supposition :
 *   `personnage-repliques` — squelette 44 o + invite 1155 o ⇒ E = 1199 ;
 *                            ceil((3 × 4000 + 1199) / 1024) × 1024 = 13 312
 *   `max` sur les TROIS rôles = 52 224, toujours porté par `indice-detenteurs`.
 * Le rôle neuf est le plus ÉTROIT des trois — dix chemins, UNE fiche, aucun bloc
 * numéroté, `synopsis_mj` retiré —, donc son plafond propre est le plus bas.
 *
 * MESURE DU 2026-09-18, itération 3b — LES QUATRE RÔLES RE-DÉRIVÉS, et « inchangé »
 * reste une MESURE :
 *   `personnage-plan` — squelette 40 o + invite 1399 o ⇒ E = 1439 ;
 *                       ceil((3 × 4000 + 1439) / 1024) × 1024 = 14 336
 *   `max` sur les QUATRE rôles = 52 224, toujours porté par `indice-detenteurs`.
 * Le quatrième rôle a le MÊME budget client que le troisième (4000, mesuré
 * indépendamment : M = 1022) mais l'invite la plus longue des quatre, d'où un
 * plafond propre légèrement supérieur — toujours très loin du `max`.
 * (Le relevé de 3b redonne 45 o pour le squelette `personnage-repliques` là où 3a
 * notait 44 : l'écart d'UN octet ne déplace ni son plafond propre — 13 312 des deux
 * façons — ni le `max`. Écrit plutôt que lissé.)
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
 * MESURE DU 2026-09-19, itération 3c — ⚠ LE PLAFOND BOUGE POUR LA PREMIÈRE FOIS, et
 * c'est bien une MESURE et non un desserrage : les CINQ rôles sont re-dérivés par la
 * MÊME formule, et le `max` change de porteur.
 *   `personnage-relations` — squelette 45 o + invite 1859 o ⇒ E = 1904 ;
 *                            ceil((3 × 17000 + 1904) / 1024) × 1024 = 53 248
 *   `max` sur les CINQ rôles = 53 248, désormais porté par `personnage-relations`.
 * CE QUI A CHANGÉ, ET POURQUOI CE N'EST PAS UN RELÂCHEMENT : le rôle neuf a le MÊME
 * budget client que `indice-detenteurs` (17 000, mesuré indépendamment — M = 5357
 * contre 5361) MAIS L'INVITE LA PLUS LONGUE DES CINQ (1859 o contre 808). Son plafond
 * propre dépasse donc l'ancien `max` de 1024 octets exactement, et le `max` le suit.
 * Relevé des cinq plafonds propres : 19 456 · 52 224 · 13 312 · 14 336 · 53 248.
 * ⚠ CONSÉQUENCE SUR LE GARDE : « le rôle le plus large » de `worker/frontiere.test.ts`
 * se dérivait du BUDGET ; deux rôles étant désormais ex æquo sur cette grandeur, il se
 * dérive du PIRE CAS EN OCTETS — la grandeur que ce plafond borne réellement, et la
 * seule sur laquelle les deux canaris de séparation puissent dire quelque chose.
 *
 * CE PLAFOND N'EST PAS UN CLIQUET : c'est une borne de refus, re-dérivée par la
 * même formule sur une nouvelle mesure chaque fois que le contexte s'élargit. « Il n'a
 * pas bougé » a été une MESURE à 3a et à 3b ; « il bouge » en est une ici.
 */
export const TAILLE_MAX_CORPS_IA = 53_248

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
