# Tour 1 — Tech Lead — `dossier-copilote` it1

```
RISQUE      — Quatre constantes que rien ne relie et qu'aucune porte n'exécute ensemble :
              l'invite (worker), les clés du schéma de sortie (brain), le plafond d'octets
              (worker), le budget de caractères (client). Leur dérive ne rougit ni au lint,
              ni à `tsc`, ni à un test de composant — échec permanent et silencieux (KR-236).

OBJECTION 1 — (encapsulation, veto si non tranchée) Le contrat de design exige libellés et
              hints « importés et jamais reformulés ». Ils vivent en constantes PRIVÉES de
              `BlocIdentite.tsx` (dossier-fiches) et en littéraux inline de
              `PanneauCanon.tsx:204/220/235` (dossier-canon) — que le critère d'acceptation
              n° 14 interdit à tout lot de nommer. Les deux lignes ne peuvent pas être vraies
              ensemble : en l'état un ouvrier recopiera huit chaînes, sans aucune garde.

OBJECTION 2 — (testabilité) Le critère n° 3 veut QUATRE textes discriminés dès l'it1 ; le
              quatrième (« vide-mais-réussi ») n'a aucun producteur avant l'it2. Le prouver
              demanderait une branche morte pilotée par une valeur fabriquée — instrument
              inerte (KR-235).

PROPOSITION — (a) DEUX lots à propriété disjointe : `contrat` (worker + brain + prop sœur),
              puis feature (+ `App.tsx`). (b) Extraire les huit chaînes dans
              `src/brain/dossier/libelles.ts` — extraction PURE, aucune chaîne modifiée, les
              tests de dossier-fiches et dossier-canon restent verts SANS retouche : c'est ce
              vert qui prouve la non-régression ; amender le n° 14 pour nommer cette seule
              exception. (c) Le 4ᵉ texte de l'it1 est le refus de BUDGET (« trop long »), qui a
              un producteur réel et tranche l'`open_question`. (d) Les deux plafonds sont
              MESURÉS dans le lot contrat, formule et test de liaison en § (d).

VERDICT     — recevable sous réserve (les trois réserves : objections 1 et 2, et le test de
              liaison des deux plafonds livré dans le même lot que les deux constantes).
```

---

# ANNEXE (hors quota)

## (a) Le découpage en lots — 2 lots, propriété de fichier disjointe

**Vague 1 — LOT 1 `contrat` (seul, en premier). Vague 2 — LOT 2 `feature`.** Exécution séquentielle : pas de worktree, pas de fusion. Le découpage ne crée pas le parallélisme, il le révèle — ici il n'y en a pas, et c'est le cas normal d'une tranche verticale.

### LOT 1 — `contrat` : le tuyau (worker + brain + prop sœur)

| Fichier | N/R | Contenu |
|---|---|---|
| `worker/index.ts` | R | route `POST /ia/:role`, `POST` dans `BASE_CORS`, garde de taille, table `INVITES`, exports `TAILLE_MAX_CORPS_IA` + `INVITES` |
| `worker/index.test.ts` | N | `/** @jest-environment node */` — le test propre de la route (KR-233) |
| `worker/frontiere.test.ts` | N | les DEUX tests de liaison : invite ⊇ clés du schéma (KR-236) ; plafond worker ≥ budget client converti en octets |
| `jest.config.cjs` | R | `testMatch` + `'<rootDir>/worker/**/*.test.ts'` |
| `tsconfig.json` | R | `include: ["src", "worker"]` — **conditionnel à la mesure**, voir note 3 |
| `src/brain/copilote/types.ts` | N | les DEUX types + `CLES_PROPOSITION` |
| `src/brain/copilote/contexte.ts` | N | `CHAMPS_INJECTES`, `DEROGATIONS_AUDIENCE`, `assemblerContexte`, `BUDGET_CARACTERES_CONTEXTE` |
| `src/brain/copilote/contexte.test.ts` | N | confinement, allow-list, filtre `MARQUEUR_A_ECRIRE`, mesure du budget |
| `src/brain/CopiloteService.ts` | N | `estDisponible` + `demander`, union à 4 branches, rejeu unique |
| `src/brain/CopiloteService.test.ts` | N | 4 branches, rejeu 1 fois puis terminal (2 tests), absence de mémoire, scanner anti-identifiant + ses 2 canaris |
| `src/brain/dossier/libelles.ts` | N | `LIBELLE_DES_CHAMPS` (8 entrées) |
| `src/brain/dossier/libelles.test.ts` | N | balayage de source : chaque chaîne écrite ICI et nulle part ailleurs (précédent `amorce.test.ts`) |
| `src/brain/index.ts` | R | exporte `CopiloteService` + ses types + `LIBELLE_DES_CHAMPS`. **Pas** `CHAMPS_INJECTES`, **pas** `assemblerContexte`, **pas** `DESTINATION_DES_CHAMPS` |
| `src/brain/BrainContext.tsx` | R | `copilote: CopiloteService` dans `Brain` + `createBrain` (additif : aucun test ne construit un `Brain` littéral — vérifié) |
| `src/features/dossier-fiches/components/BlocIdentite.tsx` | R | 6 constantes → import depuis `brain`. **Aucune chaîne modifiée** |
| `src/features/dossier-canon/components/PanneauCanon.tsx` | R | 2 littéraux inline (`SYNOPSIS MJ` l. 204, `TON` l. 235) → lecture du registre. **Aucune chaîne modifiée** |
| `src/features/bascule-editeur/components/DossierEditorScreen.tsx` | R | prop `panneauCopilote` + `ListRow` « Copilote » |
| `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` | R | nav Copilote via render-prop **bouchonnée**, `SectionId` seul traverse |
| `src/brain/dossier/feuilles.ts` | N **conditionnel** | promotion de `feuillesDeLaFixture` — voir note 4 |
| `src/brain/dossier/couverture.test.ts` | R **conditionnel** | ré-importe la fonction promue |

**Porte qualité seul** : oui. Aucun fichier de `dossier-copilote` n'existe encore ; le test de `DossierEditorScreen` injecte une render-prop bouchon, les tests du service moquent `global.fetch`, le test de route tourne en `node`.

### LOT 2 — `feature` : l'écran (démarre contrat figé)

| Fichier | N/R |
|---|---|
| `src/features/dossier-copilote/index.ts` | N |
| `src/features/dossier-copilote/components/PanneauCopilote.tsx` | N |
| `src/features/dossier-copilote/components/LigneProposition.tsx` | N |
| `src/features/dossier-copilote/hooks/useDemandeCopilote.ts` | N |
| `src/features/dossier-copilote/tests/panneauCopilote.test.tsx` | N |
| `src/features/dossier-copilote/tests/acceptation.test.tsx` | N |
| `src/App.tsx` | R |

**Notes de découpage — lire avant de contester :**

1. **UN seul lot contrat, pas deux**, bien que l'itération porte deux contrats de nature différente. Le contrat de surface (`panneauCopilote`) est techniquement indépendant : sa signature ne mentionne que `SectionId`. Il serait *parallélisable*. On ne le fait pas : (i) vingt lignes ne justifient pas un worktree et une fusion ; (ii) le chemin critique de la vague 1 reste le noyau, gain de parallélisme **nul** ; (iii) les deux moitiés sont consommées par le **même unique** consommateur (le lot 2), qui doit les trouver figées **ensemble**. Ordre interne écrit : worker → brain → registre de libellés → prop sœur.
2. **`App.tsx` est dans le lot 2, PAS dans le lot contrat.** Décisif : `App.tsx` doit écrire `<PanneauCopilote …/>`, qui n'existe qu'au lot 2. Dans le lot 1, ce fichier ne compilerait pas — le lot échouerait à sa **propre** porte. Le lot contrat pose la *prop*, le lot feature pose l'*injection*.
3. **Le test de la route worker vit dans `worker/index.test.ts`, propriété du LOT 1.** Mesuré : `testMatch` ancré sur `<rootDir>/src/**` **ne voit pas** `worker/` (l. 8 de `jest.config.cjs`) ; la pragma `@jest-environment node` expose `Request`/`Response`/`fetch` nativement, et un `testMatch` étendu découvre le fichier (3/3 verts). Donc `jest.config.cjs` est **propriété exclusive du lot 1**. Deux vérifications **avant** d'écrire le reste du lot : (i) `jest.setup.cjs` tourne aussi en environnement `node` (`require('@testing-library/jest-dom')` puis `globalThis.crypto.randomUUID`) — s'il casse, le correctif est un garde `typeof globalThis.crypto !== 'undefined'` **dans le setup**, jamais une désactivation ni un `projects:` ; (ii) `tsconfig.json` n'inclut que `src`, donc **`tsc --noEmit` ne couvre pas les tests du worker** — ajouter `"worker"` à `include` **après avoir mesuré** que `tsc` reste vert sur `worker/index.ts` ; s'il rougit pour un motif étranger, laisser `tsconfig.json` tel quel et **écrire dans la revue** que les tests du worker ne sont pas typés par la porte.
4. **`feuillesDeLaFixture` est exporté depuis `couverture.test.ts` (l. 154).** Le test de confinement doit l'importer. **À mesurer, pas à supposer** : lancer `npx jest src/brain/copilote` et compter les tests exécutés — importer un fichier de test exécute ses `describe` au chargement. Si la suite de `couverture.test.ts` apparaît dans le run du confinement, promouvoir la fonction dans `src/brain/dossier/feuilles.ts` et faire ré-importer `couverture.test.ts`. Sinon, ne rien créer.
5. **Découpage REJETÉ n° 1 : un lot `worker` séparé du lot `brain`.** Les deux gardes qui comptent importent **des deux côtés**, et l'`open_question` exige que les deux plafonds soient « mesurés dans le MÊME lot ».
6. **Découpage REJETÉ n° 2 : lot 2 scindé en « UI » + « acceptation ».** Les deux moitiés écrivent `PanneauCopilote.tsx` et `useDemandeCopilote.ts` : propriété non disjointe. Et la moitié « UI » seule ne se démontre pas.
7. **Découpage REJETÉ n° 3 : un lot « docs ».** `specification.json`, `CHANGELOG.md`, `code-knowledge.json`, `features_history.json`, `bug_history.json`, `docs/ROADMAP-BASCULE-IA.md` n'appartiennent à **aucun lot** — étape 4 du cycle, écrite par l'orchestrateur après l'essaim.
8. **Plafond de taille (KR-112)** : `PanneauCopilote.tsx` porte 3 Card + `Select` + état de chargement + diff. Le hook et `LigneProposition` sont là **dès le départ** pour cette raison, pas en refactoring d'après-coup.

---

## (b) Les signatures exactes — littérales, à recopier

```ts
// --- src/brain/copilote/types.ts ---

/** Le rôle appelé. Table FERMÉE, une entrée par assistant. It1 : une seule. */
export type RoleCopilote = 'fiche-prose'

/** Les trois champs adressables — CHEMINS DE FEUILLE, jamais une famille (KR-232/215). */
export type ChampProse = 'fonction' | 'apparence' | 'description_joueur'

/**
 * Les clés du schéma de sortie, en VALEUR et pas seulement en type : le garde
 * KR-236 a besoin de les énumérer à l'exécution, or un `interface` n'existe plus
 * à l'exécution. Le validateur est PILOTÉ par cette liste — une seule source.
 */
export const CLES_PROPOSITION = ['champ', 'texte'] as const

/**
 * CE QUE LE MODÈLE REND — franchit le réseau. AUCUNE désignation d'entité : à
 * l'it1 la cible est désignée par l'AUTEUR et son identifiant ne sort jamais du
 * client (KR-231). Schéma FERMÉ : toute clé surnuméraire fait refuser le lot entier.
 */
export interface PropositionRendue {
	champ: ChampProse
	texte: string
}

/**
 * CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. `entiteId` vient de
 * l'état d'écran (le `Select` de ciblage), jamais de la sortie du modèle.
 */
export interface PropositionResolue {
	entiteId: string
	champ: ChampProse
	texte: string
}
```

**Deux types dès maintenant, ou abstraction à un seul appelant (KR-109) ?** → **Les deux existent dès maintenant.** (i) Ce ne sont pas deux couches d'un mécanisme, ce sont **deux formes de données à deux périmètres de confiance** — leur fusion rendrait le code d'it1 capable de lire un `entiteId` **produit par le modèle**, défaut que KR-231 nomme ; (ii) le second appelant est **nommé** dans le plan (it2 introduit le rang) ; (iii) coût réel : deux `interface` de deux et trois clés, zéro générique.

**REJETÉ dans le même mouvement** — un `Proposition<TRef>` générique, une fonction `resoudre<T>()`, ou un `TableDesRangs` à l'it1. Ce qui est REPORTÉ à it2 est la clé `rang: number` sur `PropositionRendue` et sa table de résolution — **pas** le dédoublement des types.

**Conséquence à porter dans le plan** : l'it1 se conforme à « aucun rang » **et** à KR-231 parce que la forme réseau ne porte **aucune** référence d'entité. Testable en une ligne : le validateur refuse `{champ, texte, entiteId}` comme clé surnuméraire.

```ts
// --- src/brain/copilote/contexte.ts ---

/** Les chemins injectés PAR RÔLE. Chemins à indices effacés, MÊME vocabulaire
 *  que `DESTINATION_DES_CHAMPS`. Liste FIXE de l'it1. */
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'fiche-prose': [
		'canon.mj.synopsis_mj',
		'canon.partage.accroche_joueur',
		'canon.ton',
		'canon.interdits_ton[]',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
	],
}

/** La soupape. VIDE, et un test l'asserte vide (KR-232). */
export const DEROGATIONS_AUDIENCE: readonly string[] = []

/** Les champs SANS lesquels la demande n'a pas de sens — refus AVANT tout appel. */
export const CHAMPS_REQUIS_CONTEXTE: Record<RoleCopilote, readonly string[]> = {
	'fiche-prose': ['canon.mj.synopsis_mj', 'canon.ton'],
}

export type MotifRefusContexte = 'a-ecrire' | 'trop-long'

export type Contexte =
	| {
			ok: true
			/** Le texte injecté, DÉTERMINISTE : ni date, ni identifiant, ni aléa. */
			texte: string
			/** Les entités injectées, DANS L'ORDRE. It1 : exactement une. */
			entitesInjectees: readonly string[]
	  }
	| { ok: false; motif: MotifRefusContexte; chemin: CheminLibelle }

export function assemblerContexte(role: RoleCopilote, dossier: Dossier, cible: CibleCopilote): Contexte
```

Règles d'assemblage, non négociables pour l'ouvrier : (1) un champ dont la valeur **contient** `MARQUEUR_A_ECRIRE` (importé de `brain/dossier/amorce.ts`, **jamais recopié**, KR-223) est **retiré** ; (2) si le retrait vide un `CHAMPS_REQUIS_CONTEXTE`, on rend `{ok:false, motif:'a-ecrire', chemin}` ; (3) si `texte.length > BUDGET_CARACTERES_CONTEXTE`, on rend `{ok:false, motif:'trop-long', chemin}` en désignant le **champ injecté le plus long** ; (4) le champ **cible** n'est jamais injecté dans sa propre demande.

**Conséquence mesurée** : `monde.personnages[].nom` est de destination `'auteur'` (`destinations.ts` l. 146). Sous garde stricte et zéro dérogation, **le modèle ne connaît pas le nom du personnage**. Ce n'est pas un manque à corriger : les trois `PLACEHOLDER_*` de `BlocIdentite.tsx` (l. 10-14), prose de référence de ces trois champs, **n'emploient aucun nom**. Les deux portes sont déjà fermées : le test de confinement rougit si `nom` entre dans `CHAMPS_INJECTES`, et l'assertion « `DEROGATIONS_AUDIENCE` est vide » rougit s'il passe par la soupape.

```ts
// --- src/brain/CopiloteService.ts ---

export interface CibleCopilote {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	entiteId: string
	champ: ChampProse
}

export type RaisonIndisponible = 'non-configure' | 'injoignable' | 'annule'
export type MotifIllisible = 'schema' | 'identifiant' | 'vide'

/** UNION DISCRIMINÉE À QUATRE BRANCHES — même doctrine qu'`EcritureDossier`. */
export type ReponseCopilote =
	| { statut: 'propose'; proposition: PropositionResolue }
	/** AVANT tout appel réseau. `chemin` NOMME le champ ; l'écran le rend par son
	 *  libellé français via `LIBELLE_DES_CHAMPS`, jamais par sa clé technique. */
	| { statut: 'refuse'; motif: MotifRefusContexte; chemin: CheminLibelle }
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	/** APRÈS le rejeu unique. État TERMINAL : rien n'est persisté, rien n'est réparé. */
	| { statut: 'illisible'; motif: MotifIllisible }

export interface CopiloteService {
	/** VRAI si worker URL + clé de synchronisation sont réglées. AUCUN appel réseau. */
	estDisponible(): boolean
	demander(
		role: RoleCopilote,
		dossier: Dossier,
		cible: CibleCopilote,
		signal?: AbortSignal,
	): Promise<ReponseCopilote>
}

export function createCopiloteService(settings: CloudSettingsService): CopiloteService
```

Contraintes d'implémentation :
- **Pas de `fetchImpl` injectable** : les tests moquent `global.fetch` — précédent `CloudflareKVTransport.test.ts`. Un paramètre d'injection à un seul appelant est une dette (KR-109).
- **Pas d'option `copilote?` dans `CreateBrainOptions`** : même motif. `createBrain` construit le service à partir de `cloudSettings` ; les tests règlent `setWorkerUrl`/`setSyncKey` et moquent `fetch`.
- **Corps de requête déterministe** : `{ role, contexte: texte, champ }` — **ni date, ni identifiant, ni nonce**. Ne PAS prétendre que ce test double comme canari de confinement : `updatedAt` est stable entre deux lancers sans écriture, il ne rougirait pas.
- **Délai d'attente** : `CopiloteService` compose son propre `AbortController`, écouteur `'abort'` **retiré** et `clearTimeout` **dans le `finally`** (WORKFLOW § Timer Safety). Le jumeau `withTimeout` de `CloudflareKVTransport.ts` (l. 5-13) n'est **pas** touché. Commentaire obligatoire nommant le jumeau et la condition de promotion (3ᵉ appelant → `brain/utils/`).
- **Rejeu EXACTEMENT une fois** (KR-230) : `2` appels, jamais `3`, et les deux propriétés se prouvent dans **deux** tests distincts.

---

## (c) La route worker — forme exacte

**Où la route s'insère.** `handle()` (l. 54) fait : garde `X-Sync-Key` → validation latin-1 → `encodeKey` → `match(/^\/kv\/(.+)$/)` → `404`. La route IA se branche **après la garde `X-Sync-Key`, avant le `match` de `/kv/`**.

```ts
const BASE_CORS = {
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',   // POST ajouté
	'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
}

interface Env {
	GENLIV_KV: KVNamespace
	ALLOWED_ORIGINS?: string
	/** SECRET d'environnement (`wrangler secret put IA_API_KEY`). Jamais dans
	 *  wrangler.toml, jamais côté client, jamais renvoyé dans une réponse. */
	IA_API_KEY?: string
}

/** L'INVITE, une entrée par rôle — elle vit ICI et nulle part ailleurs (KR-236).
 *  Exportée pour le seul garde « l'invite nomme chaque clé du schéma ». */
export const INVITES: Record<string, { systeme: string }> = {
	'fiche-prose': { systeme: '…' },
}

/** Plafond HTTP du corps d'un appel IA — OCTETS, enveloppe et invite comprises. */
export const TAILLE_MAX_CORPS_IA = /* § (d) */

const matchIa = url.pathname.match(/^\/ia\/([a-z-]+)$/)
if (matchIa) { /* handleIa(request, env, matchIa[1]) */ }
```

`handleIa`, dans l'ordre, **toutes réponses en JSON avec `Content-Type: application/json`** (KR-233) :

| # | Condition | Statut | Corps | Branche client |
|---|---|---|---|---|
| 1 | méthode ≠ POST | `405` | `{"erreur":"methode"}` | `indisponible` |
| 2 | rôle absent de `INVITES` | `404` | `{"erreur":"role-inconnu"}` | `indisponible` |
| 3 | `env.IA_API_KEY` absent | `503` | `{"erreur":"non-configure"}` | `indisponible:'non-configure'` |
| 4 | `new TextEncoder().encode(brut).length > TAILLE_MAX_CORPS_IA` | `413` | `{"erreur":"trop-grand","limite":…}` | `indisponible` |
| 5 | `JSON.parse` échoue | `400` | `{"erreur":"corps-illisible"}` | `indisponible` |
| 6 | amont en échec ou exception | `502` | `{"erreur":"amont"}` | `indisponible:'injoignable'` |
| 7 | nominal | `200` | la sortie structurée du modèle, **telle quelle** | validée par le client |

Points qui se perdent en condensation :
- **`TextEncoder`, jamais `.length`.** Le garde existant du PUT (l. 84) compte des **unités de code UTF-16** ; on ne le corrige pas ici (hors périmètre) mais on **ne le recopie pas**.
- **Le corps est lu AVANT d'être refusé.** Assumé : la garde protège le **budget modèle**, pas la bande passante. C'est pourquoi le budget **client** existe en face.
- **Le client re-valide la sortie** même sur `200` (KR-116 : du point de vue du client, le worker **est** une entrée non fiable).
- **Authentification** : `X-Sync-Key`, l'en-tête existant. Sans euphémisme : **clé d'espace de noms, pas autorisation** (KR-148). Quiconque connaît une valeur valide peut brûler du budget modèle. Limiteur de débit = **point d'extension nommé et non livré**.
- **`wrangler.toml` n'est PAS touché** (vérifié : `name`, `main`, `compatibility_date`, binding KV, `ALLOWED_ORIGINS` **en commentaire**). La clé d'API est un secret, pas une `[vars]`. Le geste (`wrangler secret put IA_API_KEY`) se documente dans la docstring du worker et dans `README.md` à l'étape 4 — **jamais** dans le code.
- **`ALLOWED_ORIGINS` commenté ⇒ repli `'*'` en production.** Cette route **n'aggrave pas** l'exposition existante de `/kv/`, mais lui ajoute un coût monétaire. **REPORTÉ**, condition d'ouverture écrite : au premier relevé de consommation anormale, ou à la première mise en ligne publique — correctif = une valeur dans `wrangler.toml`, pas une ligne de code.

---

## (d) LES DEUX PLAFONDS — la question ouverte, tranchée

**Ils sont mesurés dans le LOT 1, tous les deux, et un test les LIE.** Sans ce test, ce sont deux nombres dans deux fichiers que rien n'oblige à rester compatibles — et l'incompatibilité produit un échec **permanent et silencieux** : le client laisse partir un corps que le worker refuse toujours.

**Protocole de mesure — la taille BRUTE d'une fixture n'en est PAS une.**

1. `M = JSON.stringify(assemblerContexte('fiche-prose', dossierReference, cible)).length`, mesuré **dans** `contexte.test.ts`, sur `src/brain/dossier/__fixtures__/dossier-reference.json` (418 lignes), **après filtrage d'audience, après filtre `MARQUEUR_A_ECRIRE`**. Ce qu'on mesure est l'objet **assemblé**, pas le dossier.
2. `BUDGET_CARACTERES_CONTEXTE = ceil(M × 3 / 1000) × 1000`. Le facteur **3** est une **DÉCISION** du comité, écrite et datée, pas un arrondi : le dossier de référence est une fixture d'épreuve du validateur, pas le dossier d'un auteur. L'arrondi au millier est la marge, et il n'y en a pas d'autre.
3. `E` = octets de l'enveloppe (rôle + champ + clés JSON + invite du rôle), **mesurés** sur un corps réel : `octets(corps) − octets(texte du contexte)`.
4. `TAILLE_MAX_CORPS_IA = ceil((3 × BUDGET_CARACTERES_CONTEXTE + E) / 1024) × 1024`. **3 octets par unité de code UTF-16 est la borne HAUTE réelle** — un caractère hors BMP coûte 4 octets pour **deux** unités de code, soit 2/unité. Écrire `4` serait une marge inventée présentée comme une borne.
5. **Doctrine d'évolution** : ce plafond **n'est pas un cliquet**. C'est une borne de refus, re-dérivée **par la même formule sur une nouvelle mesure** à chaque itération qui élargit `CHAMPS_INJECTES`. On ne desserre jamais « parce que ça a coincé une fois ».

**Le test de liaison** (`worker/frontiere.test.ts`, lot 1), deux assertions et un canari négatif :
- `encode('€'.repeat(BUDGET_CARACTERES_CONTEXTE) + enveloppe).length <= TAILLE_MAX_CORPS_IA` — `€` est un caractère à **3 octets**, donc le pire cas de densité. Pouvoir séparateur : baisser le plafond du worker ou monter le budget client fait rougir.
- `INVITES['fiche-prose'].systeme` contient **chacune** des `CLES_PROPOSITION` (KR-236).
- Canari négatif, mesuré et non déduit : un corps d'un octet **au-dessus** de `TAILLE_MAX_CORPS_IA` rend `413` avec un corps JSON ; un contexte d'un caractère **au-dessus** du budget rend `{statut:'refuse', motif:'trop-long'}` avec **zéro** appel à `fetch`.

**Conséquence sur les textes d'écran** : ce refus de budget est un **cinquième** état dans le contrat de design, qui n'en prévoit que quatre. Ma proposition (c) le résout sans en ajouter : à l'it1, les quatre textes sont **indisponible / illisible-après-rejeu / contexte-à-écrire / contexte-trop-long**, l'état « vide-mais-réussi » n'ayant **aucun producteur** avant l'it2. Les deux derniers partagent un gabarit et nomment tous deux **le** champ, avec deux verbes opposés (« complétez », « raccourcissez ») — discriminance réelle, prouvable dans le même test. **Arbitrage à confirmer par l'UX et le QA au tour 2.**

---

## (e) Encapsulation — autocontrôle de mon propre veto

**Recherche DOM inter-composants** : aucune. La navigation passe par `onSelectSection`, où **seul `SectionId` traverse** — `DestinationNav` reste strictement local à `DossierEditorScreen.tsx` (l. 22). **Vérifié.**

**Accès à un champ interne d'un état géré ailleurs** : aucun. La proposition en attente est de l'**état d'écran** ; elle s'applique sur le document **gelé** que la recette reçoit. `DESTINATION_DES_CHAMPS` reste **non ré-exporté** : `contexte.ts` l'importe depuis `./dossier/destinations` (interne à `brain/`, légal) et **aucune feature ne le lit**.

**Texte recopié entre deux fichiers : OUI, et c'est le point dur.** Constat mesuré :

| Chaîne | Où elle vit aujourd'hui | Statut |
|---|---|---|
| `'FONCTION'`, `'APPARENCE'`, `'DESCRIPTION JOUEUR'` | `dossier-fiches/components/BlocIdentite.tsx` l. 42/51/60 — attributs `label` | inline |
| `HINT_FONCTION`, `HINT_APPARENCE`, `HINT_DESCRIPTION_JOUEUR` | même fichier, l. 5-8 — constantes **privées au module** | non exportées |
| `'SYNOPSIS MJ'`, `'TON'` | `dossier-canon/components/PanneauCanon.tsx` l. 204 / 235 | littéraux inline |

Le contrat de design exige « importés et jamais reformulés ». Le critère n° 14 exige qu'**aucun** fichier de `dossier-fiches` ou `dossier-canon` n'apparaisse dans un lot. L'ESLint interdit l'import inter-features dans les deux sens. **Les trois ne peuvent pas tenir ensemble.** En l'état, l'ouvrier recopiera huit chaînes, rien ne rougira, et le premier changement de libellé fera diverger le panneau en silence — mode de panne de la section Encapsulation.

**OPTION RETENUE (A) : promouvoir, dans le LOT CONTRAT.**
`src/brain/dossier/libelles.ts` (N) porte **huit** entrées, clés dans le **même vocabulaire de chemins** que `DESTINATION_DES_CHAMPS` :

```ts
export interface LibelleDeChamp { libelle: string; hint?: string }
export const LIBELLE_DES_CHAMPS = { /* 8 entrées */ } as const satisfies Record<string, LibelleDeChamp>
export type CheminLibelle = keyof typeof LIBELLE_DES_CHAMPS
```

`CheminLibelle` rend une clé fautive **impossible à la compilation**. Docstring obligatoire : **« PARTIELLE PAR CONSTRUCTION — n'entre ici qu'un champ nommé par un écran qui n'est PAS sa fiche d'origine. Aucune garde d'exhaustivité (ce n'est pas `destinations.ts`) ; une ligne sans second consommateur est une dette, KR-109. »**

Pourquoi c'est recevable : c'est **exactement** KR-109/KR-110, et le dépôt l'a déjà fait deux fois — `avecOrpheline`, **sortie de** `dossier-fiches/components/BlocSavoirs.tsx` vers `brain/utils/references.ts` le jour où un second appelant est apparu, et `pastilleNiveau`/`badgeSection`, **descendus** dans `brain/dossier/pastilles.ts`. Le commentaire de `brain/index.ts` qui disait « les LIBELLÉS français restent côté feature — **un seul consommateur réel** » énonce la règle **par sa condition** : la condition vient de tomber.

Non-régression sans écrire un test : **extraction PURE, aucune chaîne modifiée** ⇒ `fichePersonnage.test.tsx`, `panneauPersonnages.test.tsx` et `panneauCanon.test.tsx` restent verts **sans une seule retouche**. Un diff de test dans ces trois fichiers est le signal qu'une chaîne a bougé — contrôle à faire à la revue.

**Ce que ça coûte** : le critère n° 14 doit être amendé pour nommer cette exception unique — « aucun fichier de `dossier-canon`, `dossier-fiches` ou `dossier-registres` dans un lot de cette feature, **hors la promotion des huit libellés opérée par le lot contrat de l'itération 1, sans modification d'aucune chaîne** ». La conséquence acquise (« dès l'it2, aucun lot ne sort de `dossier-copilote/**` ni de `brain/copilote/**` ») reste entière : exception datée, bornée, non renouvelable.

**Repli (B), si le comité refuse de toucher une feature « done ».** Alors « importés et jamais reformulés » **doit être rayée** du contrat de design de l'it1 : les huit chaînes sont dupliquées dans `brain/dossier/libelles.ts`, et `libelles.test.ts` asserte que **chaque chaîne apparaît dans exactement DEUX fichiers, nommés**. Précédent exact : `MARQUEUR_A_ECRIRE`, propriété tenue par un balayage de source dans `amorce.test.ts`. **Sans ce balayage, mon veto d'encapsulation tient et le lot ne part pas.**

---

## Registre des désaccords — à recopier au § 8 du plan (BUG-082)

| # | Objet | Statut | Motif en une phrase |
|---|---|---|---|
| TL-1 | Libellés/hints recopiés dans `dossier-copilote` **sans garde** | **REJETÉ** | Texte appartenant à `BlocIdentite.tsx`/`PanneauCanon.tsx` lu à distance : rien ne rougit si le libellé change — veto d'encapsulation. Option A (promotion) ou repli B (duplication + balayage de source). |
| TL-2 | `App.tsx` dans le lot contrat | **REJETÉ** | Il devrait écrire `<PanneauCopilote/>`, qui n'existe qu'au lot 2 : le lot contrat échouerait à sa propre porte. |
| TL-3 | Un lot `worker` séparé du lot `brain` | **REJETÉ** | Les deux gardes qui comptent importent des deux côtés, et l'`open_question` exige « le même lot ». |
| TL-4 | Un lot `contrat de surface` séparé (prop sœur seule) | **REJETÉ** | Vingt lignes ne valent pas un worktree ; gain de parallélisme nul, coût de fusion réel. |
| TL-5 | Lot 2 scindé en « UI » + « acceptation » | **REJETÉ** | Propriété de fichier non disjointe, et la moitié UI ne se démontre pas. |
| TL-6 | `Proposition<TRef>` générique / `resoudre<T>()` / `TableDesRangs` à l'it1 | **REJETÉ** | Abstraction à un seul appelant (KR-109) et « aucun rang » au goal. Les DEUX types restent, le rang part à l'it2. |
| TL-7 | `fetchImpl` injectable / option `copilote?` dans `CreateBrainOptions` | **REJETÉ** | Injection à un seul appelant ; les tests moquent `global.fetch` (KR-229). |
| TL-8 | Un module de constantes partagé entre `worker/` et `src/` | **REJETÉ** | Traînerait du code client dans le paquet wrangler. La liaison entre les deux moitiés est un **test**, jamais un import de production. |
| TL-9 | `body.length` comme mesure d'octets pour la garde IA | **REJETÉ** | Compte des unités de code UTF-16 ; la garde IA mesure avec `TextEncoder`. Le garde existant du PUT n'est **pas** corrigé ici. |
| TL-10 | Factoriser `withTimeout` avec `CloudflareKVTransport.ts` | **REJETÉ** | On ne rouvre pas le chemin de synchronisation pour huit lignes ; commentaire nommant le jumeau + condition de promotion (3ᵉ appelant). |
| TL-11 | Corriger `ALLOWED_ORIGINS` / livrer un limiteur de débit | **REPORTÉ** | Hors périmètre ; exposition **nommée** dans la revue (KR-148), condition d'ouverture écrite au § (c). |
| TL-12 | 4ᵉ texte = « vide-mais-réussi » à l'it1 | **À TRANCHER (UX + QA)** | Aucun producteur avant l'it2 ; le prouver exigerait une branche morte pilotée par une valeur fabriquée (KR-235). Remplacé par le refus de **budget**. |
| TL-13 | `onSelectSection` non utilisé par `PanneauCopilote` | **À TRANCHER (UX)** | La prop sœur est figée par `resolved_decisions`. Soit le panneau offre « Ouvrir la fiche » après acceptation, soit `App.tsx` écrit `(_onSelectSection) => …`. **Aucun ouvrier n'invente cette UI.** |
| TL-14 | `CHAMPS_REQUIS_CONTEXTE` = `{synopsis_mj, ton}` | **À CONFIRMER (Narratif + PM)** | Décide de l'atteignabilité du refus « contexte à écrire », que le goal impose de porter dès cette tranche. |
