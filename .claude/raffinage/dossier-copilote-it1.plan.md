# Plan d'itération — `dossier-copilote` · itération `1`

> Statut : **`validé`** — porte 2 franchie le 2026-09-17
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-17
> Composition : **5 rôles** — motif : l'itération pose la **première route d'appel modèle du dépôt** (`POST /ia/:role`), le contrat de sortie et le rejeu-une-fois dont le Temps 2 héritera, plus l'assembleur de contexte sous garde d'audience stricte. Sans le cinquième rôle, la frontière code/IA n'a pas de gardien sur la tranche qui la fonde.
> Exécution : **séquentielle** (2 lots, vague 1 puis vague 2 — aucun worktree, aucune fusion)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut faire proposer par le copilote un texte pour un champ de prose d'une fiche personnage qu'il désigne, puis l'accepter ou le refuser. » |
| **Tranche** | panneau « Copilote » (nav) → `CopiloteService.demander` → `assemblerContexte` sous garde d'audience → `POST /ia/personnage-prose` (worker, invite + clé d'API) → validation de forme + rejeu unique → panneau de diff → `DossierService.update` → `dossier:updated` |
| **Lots** | **2 lots** · dont `contrat` : **oui** (lot 1, seul et en premier) |
| **Hors périmètre** | tout rang, tout nombre, toute sous-entité, toute création d'entité ; l'édition du texte proposé avant acceptation ; les assistants « Tisser les indices » et « Éclater le synopsis » ; l'ordre de coupe du budget ; le limiteur de débit ; `ALLOWED_ORIGINS` |
| **Reporté** | it2 : le rang et sa re-résolution, l'ordre de coupe + `SECTEUR_DES_CHAMPS`, le texte « vide-mais-réussi », l'allow-list de sortie à exclusions nommées · it3 : `cede_si`, `relations[].lien`, le lieu, les contre-mesures · `open_questions` : la garde « identité du personnage », l'édition avant acceptation |

**Précision à lire avant la recette** (signalée par le Tech Lead, hors de son veto) : avec `canon.ton` requis, **le premier geste d'un auteur sur un dossier neuf est un refus** — l'amorce écrit le marqueur dans `canon.ton`. C'est ce qui rend le critère 7 démontrable sur le cas nominal, et c'est aussi la première chose que l'auteur verra. La démo suppose donc un dossier où **le ton est écrit** et où le personnage porte **au moins une prose ou un but**.

---

## 1 — But raffiné

À la fin de cette itération, l'auteur ouvre le panneau « Copilote », désigne un personnage et un champ de prose (fonction, apparence ou description lue par le joueur), lance le copilote, et accepte ou refuse la proposition qui revient — **aucun texte n'entrant dans son dossier sans son geste**.

## 2 — Hors périmètre

- **Aucun rang, aucun nombre, aucune sous-entité, aucune création d'entité.** La cible est désignée par l'AUTEUR ; son identifiant ne franchit jamais le réseau.
- **L'édition du texte proposé avant acceptation** — `open_question` non tranchée. Le `Field` « APRÈS » est en lecture seule, `onChange={() => {}}` explicite et commenté.
- **Les deux autres assistants** — Cards « Bientôt », sans sélecteur ni bouton.
- **L'ordre de coupe du budget** et le registre `SECTEUR_DES_CHAMPS` : à l'it1 on ne coupe rien, **on refuse** (décision DÉGRADATION).
- **Le texte « vide-mais-réussi »** — aucun producteur avant l'it2 : ni codé, ni gardé en constante inerte.
- **L'allow-list de sortie à exclusions nommées** (29 feuilles) — sans objet sous le schéma `{valeur}` : le modèle ne nomme plus aucun champ.
- **Le limiteur de débit, `ALLOWED_ORIGINS`, la correction du garde du PUT** (`worker/index.ts:84`).
- **La variante GROUPE** de `LigneProposition` (six curseurs) — matière de l'it3.
- **`rename`/`duplicate`, le mode jeu, le streaming, un événement `copilote:*`, la persistance d'une proposition en attente.**

## 3 — Contrat de design

*(Écrit par l'UX, arbitré. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

### 3.1 Jetons — tous vérifiés existants

`--surface-inset` · `--text-muted` · `--border-field` · `--r-md` · `--surface-sunken` · `--text-disabled` · `--text-on-accent` · `--accent` · `--surface-card` · `--border-card` · `--border-subtle` · `--border-rule` · `--font-mono` · `--fs-eyebrow` · `--track-eyebrow` · `--text-label` · `--text-body` · les `--space-*` déjà employés par `PanneauControles`.
Tons `Badge` : **`accent`** (Accepté) / **`muted`** (Rejeté, « Bientôt ») — **jamais** `good`/`bad`, réservés à réussite/échec de jet. Tons `IconButton` : **`accent`** (`+`), **`danger`** (`×`). **Aucun glyphe neuf** : pas de coche.
Primitives, toutes existantes et exportées par `brain/components/index.ts` : `Card`, `CardHead` (gabarit `PanneauControles`), `Field`, `Select`, `SegmentedControl`, `Badge`, `IconButton`, `ListRow`.
Un « Lancer » désactivé n'est **jamais** accent-teinté : `background: var(--surface-sunken)`, `color: var(--text-disabled)`, `border: 1px solid var(--border-field)`, `cursor: not-allowed`.

### 3.2 Entrée de navigation

`ListRow title="Copilote"` dans un `<nav aria-label="Copilote">`, **sœur** de « Contrôles » dans la colonne de nav de `DossierEditorScreen.tsx`, même gabarit (`borderTop: 1px solid var(--border-rule)`, `paddingTop: var(--space-3)`). Constante **locale à `bascule-editeur`** : `DESTINATION_COPILOTE = 'copilote' as const`, troisième branche de `DestinationNav` — **jamais remontée dans `brain/`** (BUG-082).

### 3.3 Card 1 — « Compléter une fiche » (active)

- `CardHead` : `eyebrow="ASSISTANT"`, `title="Compléter une fiche"`.
- Corps : « Propose un texte pour un champ vide ou resté à écrire — fonction, apparence, description lue par le joueur. »
- **`Select` PERSONNAGE** : `label="PERSONNAGE"`. Options rendues par **`localiserEntite('pnj', personnage, index)`** (exporté par `brain/index.ts`) — **jamais** une désignation refabriquée (encapsulation, précédent `designationDe`). `value` toujours défini : premier personnage par défaut dès qu'il en existe un.
  - **État vide (0 personnage)** : une seule `option` désactivée « Aucun personnage dans ce dossier » ; « Lancer » désactivé, `title="Créez un personnage dans Personnages pour utiliser cet assistant."`
- **`SegmentedControl` CHAMP** : légende « CHAMP » au-dessus (mono, `--fs-eyebrow`, `--track-eyebrow`, `--text-label`). **Aucune valeur par défaut.** Trois options, libellés tirés du registre : `FONCTION`, `APPARENCE`, `DESCRIPTION JOUEUR`.
- **Bouton « Lancer »** (sentence case). Désactivé tant qu'aucun CHAMP n'est choisi (`title="Choisissez un champ pour activer Lancer."`) ou qu'il n'y a aucun personnage. **Jamais** désactivé parce que le champ est déjà rédigé — c'est REMPLACEMENT qui traite ce cas.

### 3.4 Cards 2 et 3 — « Bientôt »

`CardHead eyebrow="ASSISTANT"`, titres « Tisser les indices » / « Éclater le synopsis ». `Badge tone="muted"` : « Bientôt — itération 2 » / « Bientôt — itération 4 ». Corps **au futur** : « Proposera qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources. » / « Proposera une distribution de personnages à partir du synopsis, de l'accroche et du ton. »
**Aucun sélecteur, aucun bouton « Lancer » grisé** : un faux bouton désactivé serait indiscernable d'un bug — c'est le risque nommé par l'UX au tour 1, et la distinction « pas encore construit » / « il vous manque un geste » se porte par le **texte**, jamais par le gris.

### 3.5 État de chargement — `role="status"`, clavier complet

- Au clic sur « Lancer » : « Lancer » passe **`disabled` au même instant** où apparaissent, dans une région `role="status"` : « Le copilote réfléchit… » (ellipse unique) + bouton « **Annuler** » — ton **neutre** : `color: var(--text-body)`, `border: 1px solid var(--border-card)`, `background: var(--surface-card)`. Le focus se déplace sur « Annuler ».
- **Échap** = même action qu'« Annuler » (abort via `signal`) **et** rend le focus à « Lancer », redevenu actif.
- À l'issue (succès, échec, abandon) : la région disparaît, « Lancer » redevient actif, le focus lui revient.

### 3.6 Les QUATRE textes — jamais confondus

| Cas | Texte exact | Où |
|---|---|---|
| `indisponible` | « Le copilote est indisponible… Réessayez dans un instant. » | remplace la région `role="status"` au retour |
| `illisible` (après le rejeu unique) | « Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer. » | idem |
| `refuse` / `a-ecrire` | « Il manque « {LIBELLE_DES_CHAMPS[chemin].libelle} » pour proposer ce texte — complétez d'abord ce champ. » → à l'it1 : « Il manque « **TON** » pour proposer ce texte — complétez d'abord ce champ. » | **SYNCHRONE**, sous « Lancer », préfixe `⊘ `, `--text-muted` — aucun appel réseau n'est parti |
| `refuse` / `trop-long` | « Le contexte est trop long pour proposer ce texte — raccourcissez d'abord la fiche de ce personnage. » | idem |

Les deux derniers partagent « pour proposer ce texte » mais s'ouvrent et se ferment sur des lexiques **opposés** — « il manque »/« complétez » contre « trop long »/« raccourcissez », un champ **nommé** contre **aucun** champ nommé. (a) et (b) ne mentionnent ni champ ni fiche.
**Aucun adjectif évaluatif** nulle part : ni « bonne suggestion », ni « proposition améliorée », ni « affiner ». Le bouton reste **« Lancer »** au premier essai comme aux suivants — « Relancer », « Affiner », « Une autre proposition » sont interdits : il n'y a **aucune mémoire**, et l'écran ne doit pas promettre le contraire.

### 3.7 `LigneProposition` — composant LOCAL à la feature

Props : `chemin: CheminLibelle`, `variante: 'remplissage' | 'remplacement'` (dérivée **par l'appelant** : `remplacement` ssi la valeur actuelle du champ cible est non vide **et** ne contient pas `MARQUEUR_A_ECRIRE`), `valeurAvant?: string`, `valeurApres: string`, `decision?: 'acceptee' | 'rejetee'`, `onAccepter`, `onRejeter`, `onOuvrirFiche`.

- **REMPLISSAGE** (cible vide ou marquée) : un seul `Field` — `label` et `hint` **lus dans le registre `LIBELLE_DES_CHAMPS`**, jamais recopiés ni reformulés ni suffixés ; `value={valeurApres}`, multiligne. **Lecture seule à l'it1** : `onChange={() => {}}` explicite, commenté `// it1 : lecture seule, édition différée (open_question)`. **Pas** de prop `Field.readOnly` (retirée, KR-109).
- **REMPLACEMENT** (cible déjà rédigée) : au-dessus, un **bloc statique local** — légende mono `--text-muted` « AVANT », contenu `valeurAvant` sur `--surface-inset` / `1px solid var(--border-field)` / `--r-md` — puis le **même** `Field` qu'en REMPLISSAGE.
- **Actions** : `IconButton` `+` (`tone="accent"`) accepter, `×` (`tone="danger"`) refuser.
- **Après décision** : ligne compacte + `Badge tone="accent"` « Accepté » **ou** `tone="muted"` « Rejeté », remplaçant la paire d'`IconButton`. Sur la ligne **acceptée seulement**, un lien texte « **→ Ouvrir la fiche** » (`--text-body`, jamais accent — navigation secondaire) qui appelle `onSelectSection('personnages')`. **Seul `SectionId` traverse la frontière.**

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService` | service | **fournit** | `estDisponible(): boolean` · `demander(role, dossier, cible, signal?): Promise<ReponseCopilote>` — union **discriminée à 4 `statut`** (§ 4 bis) |
| `brain/copilote/types.ts` | type | **fournit** | `RoleCopilote = 'personnage-prose'` · `ChampProseCle` · `CHAMPS_PROPOSABLES` (pont chemin↔clé) · `PropositionRendue` (réseau) · `PropositionResolue` (code) — **zéro clé commune** |
| `brain/copilote/schemaSortie.ts` | registre | **fournit** | `CLES_SORTIE = ['valeur'] as const` · `GABARIT_SORTIE = '{"valeur": "…"}'` · `validerSortie` |
| `brain/copilote/contexte.ts` | registre | **fournit** | `CHAMPS_INJECTES` (12) · `DEROGATIONS_AUDIENCE = []` · `PARTIES_REQUISES` · `BUDGET_CARACTERES_CONTEXTE` · `assemblerContexte`. **NON ré-exporté** par `brain/index.ts` |
| `brain/dossier/libelles.ts` | registre | **fournit** | `LIBELLE_DES_CHAMPS` (**4** entrées) · `CheminLibelle`. **Ré-exporté** par `brain/index.ts` — deux features le lisent (KR-109) |
| `brain/dossier/feuilles.ts` | utilitaire | **fournit** | `feuillesDeLaFixture`, **promue** hors de `couverture.test.ts` (mesuré nécessaire) |
| `DossierEditorScreen.panneauCopilote` | composant | **fournit** | `(onSelectSection: (section: SectionId) => void) => ReactNode` — **identique** à `panneauControles` |
| `DossierService.update` | service | consomme | `update(id, recette): EcritureDossier` — **signature et ordre inchangés** (KR-004) |
| `CloudSettingsService` | service | consomme | `getWorkerUrl()` / `getSyncKey()` |
| `localiserEntite`, `collectIds`, `MARQUEUR_A_ECRIRE`, `DESTINATION_DES_CHAMPS` | utilitaires | consomme | existants, **aucune modification** |
| `dossier:updated` | événement | émet | `{ dossierId: string }` — émis par `update`, **après** persistance |

**Aucun événement `copilote:*`** (rejeté au cadrage : aucun abonné). **Aucune entrée neuve** dans `persistenceKeys.ts` (KR-114 non rouvert).

### 4.1 — Signatures littérales, à recopier *(un ouvrier de l'essaim ne lit pas les notes de tour : elles sont ici, arbitrées, ou nulle part)*

```ts
// ─── src/brain/copilote/types.ts ───────────────────────────────────────────

/** Table FERMÉE, une entrée par assistant. C'est AUSSI le segment de route
 *  (`/ia/personnage-prose`) et la clé de la table d'invites du worker : le nom
 *  encode le TYPE D'ENTITÉ, parce qu'un lieu et un personnage ne partagent aucun
 *  chemin injecté. `fiche-prose` promettrait une généralité qu'il faudrait
 *  renommer — or renommer coûte une route, une invite et un test. */
export type RoleCopilote = 'personnage-prose'

/** La CLÉ DE PROPRIÉTÉ dans le document — ce que la recette de `update` écrit. */
export type ChampProseCle = 'fonction' | 'apparence' | 'description_joueur'

/**
 * Le pont entre les DEUX vocabulaires, et l'unique autorité sur leur
 * correspondance : la clé est le CHEMIN (ce qui franchit le réseau, ce que la
 * table d'invites indexe, ce que `DESTINATION_DES_CHAMPS` connaît), la valeur est
 * la CLÉ DE PROPRIÉTÉ. AUCUNE chirurgie de chaîne — jamais de `.split('.').pop()`.
 */
export const CHAMPS_PROPOSABLES = {
	'monde.personnages[].fonction': 'fonction',
	'monde.personnages[].apparence': 'apparence',
	'monde.personnages[].description_joueur': 'description_joueur',
} as const satisfies Record<string, ChampProseCle>

export type ChampProseChemin = keyof typeof CHAMPS_PROPOSABLES

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé. Aucune référence
 *  d'entité, AUCUN écho du champ : la cible est le couple {entiteId, champ},
 *  indivisible, et elle reste côté client (KR-231). Schéma FERMÉ. */
export interface PropositionRendue {
	valeur: string
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. `entiteId` et `champ`
 *  viennent de l'état d'écran. ZÉRO clé commune avec la forme réseau : on ne peut
 *  pas passer l'une pour l'autre par mégarde (KR-231). */
export interface PropositionResolue {
	entiteId: string
	champ: ChampProseChemin
	texte: string
}
```

```ts
// ─── src/brain/copilote/schemaSortie.ts ────────────────────────────────────

/** Les clés du schéma de sortie, EN VALEUR : le garde KR-236 les énumère à
 *  l'exécution (une `interface` n'existe plus au runtime), et le validateur est
 *  PILOTÉ par cette liste — une seule source, aucune dérive possible. */
export const CLES_SORTIE = ['valeur'] as const

/**
 * LE LITTÉRAL QUE L'INVITE INCRUSTE — et la SEULE chose sur laquelle le garde
 * KR-236 a le droit de porter. NE JAMAIS garder sur la clé nue : `valeur` est un
 * mot français courant, et une invite disant « la valeur du personnage »
 * satisferait `includes('valeur')` sans rien demander au modèle.
 * DUPLIQUÉ dans `worker/index.ts` — aucun import `worker/` → `src/brain/` : la
 * liaison entre les deux exemplaires est un BALAYAGE DE SOURCE (§ 4 quinquies),
 * jamais un import de production.
 */
export const GABARIT_SORTIE = '{"valeur": "…"}'

/** QUATRE motifs, un par prédicat qui peut échouer — l'écran ne rend qu'UN texte
 *  pour toute la famille, mais le motif existe pour que chaque prédicat se prouve
 *  seul. PAS de `'trop-long'` ici : la longueur de la prose n'est pas validée
 *  (§ 8, désaccord n° 7 — doctrine de famille, `types.ts` l. 1472-1475). */
export type MotifIllisible = 'schema' | 'vide' | 'marqueur' | 'identifiant'

/** Les SIX prédicats de forme du § 4 bis, dans l'ordre. Valide la FORME, jamais
 *  la PROSE (KR-229). `dossier` sert au scanner d'appartenance (§ 4 ter). */
export function validerSortie(
	brut: unknown,
	dossier: Dossier,
): { ok: true; valeur: string } | { ok: false; motif: MotifIllisible }
```

```ts
// ─── src/brain/copilote/contexte.ts ────────────────────────────────────────
// NON ré-exporté par `brain/index.ts`. `DESTINATION_DES_CHAMPS` est importé ici
// en chemin profond (`../dossier/destinations`) — interne à `brain/`, légal, et
// lu en GARDE DE TEST, jamais en pilote d'exécution.

/** Les 12 chemins de feuille injectés PAR RÔLE, tous d'audience `'ia'`, chemins à
 *  indices effacés — MÊME vocabulaire que `DESTINATION_DES_CHAMPS`. Les entrées
 *  de personnage sont RESTREINTES à l'entité désignée par l'auteur. Liste FIXE de
 *  l'it1 : un ouvrier n'en ajoute pas une. */
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.parler[]',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
}

/** La soupape. VIDE, et un test l'asserte vide (KR-232). Zéro dérogation. */
export const DEROGATIONS_AUDIENCE: readonly string[] = []

/**
 * Les champs SANS lesquels la demande n'a pas de sens — refus AVANT tout appel.
 * UNE entrée. Typé `CheminLibelle` et non `string` : c'est ce qui rend « tout
 * champ requis a un libellé d'écran » vrai À LA COMPILATION, donc le texte (c)
 * n'a aucune branche de repli.
 * PAS de disjonction « parmi » : retirée par son auteur (§ 8, n° 5) — une union
 * `{requis|parmi}` sans instance `parmi` est une abstraction à un seul appelant.
 */
export const PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]> = {
	'personnage-prose': ['canon.ton'],
}

/** Mesuré au lot 1 : `ceil(M × 3 / 1000) × 1000` (§ 4 quater). Le facteur 3 est
 *  une DÉCISION datée du comité ; l'arrondi au millier EST la marge. */
export const BUDGET_CARACTERES_CONTEXTE = /* mesuré */

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	/** JAMAIS de charge : « trop long » ne pointe pas un champ, il pointe la
	 *  fiche (§ 8, n° 11). */
	| { motif: 'trop-long' }

export type Contexte =
	/** `texte` est DÉTERMINISTE : ni date, ni identifiant, ni aléa — c'est ce qui
	 *  rend « deux lancers ⇒ deux corps identiques » vrai par égalité stricte.
	 *  `entitesInjectees` vaut exactement une entrée à l'it1 ; c'est ce que le
	 *  test de confinement compare, et ce que l'it2 lira comme table de rangs. */
	| { ok: true; texte: string; entitesInjectees: readonly string[] }
	| ({ ok: false } & MotifRefusContexte)

export function assemblerContexte(
	role: RoleCopilote,
	dossier: Dossier,
	cible: CibleCopilote,
): Contexte
```

**Règles d'assemblage, non négociables pour l'ouvrier :** (1) un champ dont la valeur **contient** `MARQUEUR_A_ECRIRE` — `includes`, **pas** `startsWith` : un auteur peut éditer autour, et les chevrons `⟨ ⟩` ne se tapent pas au clavier, donc `includes` n'a pas de faux positif — est **RETIRÉ** ; la constante est **importée** de `brain/dossier/amorce.ts`, jamais recopiée (KR-223) ; (2) le retrait est un **retrait**, jamais une substitution par `""` — un `canon.ton` injecté vide enseignerait au modèle « ce livre n'a pas de ton », ce qui est une **affirmation** ; le repli est le **silence** ; (3) si le retrait vide une `PARTIES_REQUISES`, on rend `{ok:false, motif:'a-ecrire', chemin}` **sans aucun `fetch`** ; (4) si `texte.length > BUDGET_CARACTERES_CONTEXTE`, on rend `{ok:false, motif:'trop-long'}`, **sans aucun `fetch`** ; (5) **le champ CIBLE n'est jamais injecté dans sa propre demande** — le montrer invite la paraphrase ; (6) `canon.interdits_ton[]` **vide** est un état calme et légitime, jamais un manque : on ne refuse pas sur une liste vide.

```ts
// ─── src/brain/CopiloteService.ts ──────────────────────────────────────────

export interface CibleCopilote {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	entiteId: string
	champ: ChampProseChemin
}

export type RaisonIndisponible = 'non-configure' | 'injoignable' | 'annule'

/** UNION DISCRIMINÉE — QUATRE `statut`, l'enveloppe du goal. Même doctrine
 *  qu'`EcritureDossier` : aucun appelant ne peut lire une proposition sur un
 *  échec, c'est le TYPAGE qui l'interdit, pas une convention de rendu. */
export type ReponseCopilote =
	| { statut: 'propose'; proposition: PropositionResolue }
	/** AVANT tout appel réseau. L'écran rend le champ par son LIBELLÉ FRANÇAIS
	 *  via `LIBELLE_DES_CHAMPS`, jamais par sa clé technique. */
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	/** APRÈS le rejeu unique. État TERMINAL : rien n'est persisté, rien n'est réparé. */
	| { statut: 'illisible'; motif: MotifIllisible }

export interface CopiloteService {
	/** VRAI si l'URL du worker ET la clé de synchronisation sont réglées.
	 *  AUCUN appel réseau : une disponibilité qui sonde le réseau ferait
	 *  clignoter un bouton au rendu. */
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

**Contraintes d'implémentation du service :** **pas** de `fetchImpl` injectable ni d'option `copilote?` dans `CreateBrainOptions` — les tests moquent `global.fetch` (précédent `CloudflareKVTransport.test.ts`), une injection à un seul appelant est une dette (KR-109) ; `createBrain` construit le service depuis `cloudSettings`, les tests règlent `setWorkerUrl`/`setSyncKey` ; le service compose **son propre** `AbortController` (abandon sur le `signal` de l'appelant **et** sur un délai), écouteur `'abort'` **retiré** et `clearTimeout` **dans le `finally`** (`docs/WORKFLOW.md` § Timer Safety) ; le jumeau `withTimeout` de `CloudflareKVTransport.ts` (l. 5-13) **n'est pas touché** — commentaire obligatoire le nommant et posant la condition de promotion (3ᵉ appelant → `brain/utils/`).

```ts
// ─── src/brain/dossier/libelles.ts ─────────────────────────────────────────

export interface LibelleDeChamp { libelle: string; hint: string }

/**
 * PARTIELLE PAR CONSTRUCTION — n'entre ici qu'un champ (a) nommé par un écran qui
 * n'est PAS sa fiche d'origine, ET (b) réellement atteignable par une branche de
 * code de l'itération qui le réclame. AUCUNE garde d'exhaustivité : ce n'est pas
 * `destinations.ts`. Une ligne sans second consommateur est une dette (KR-109),
 * et une ligne sans producteur est la même faute appliquée à un registre
 * (KR-235) : `canon.mj.synopsis_mj` n'y entre PAS malgré son voisinage avec
 * `canon.ton` — il n'est jamais requis, donc aucune branche ne peut le nommer.
 * Chaînes reprises VERBATIM de leur fiche d'origine, aucune modifiée.
 */
export const LIBELLE_DES_CHAMPS = {
	'monde.personnages[].fonction': {
		libelle: 'FONCTION',
		hint: 'interne — jamais lu par le joueur',
	},
	'monde.personnages[].apparence': {
		libelle: 'APPARENCE',
		hint: 'interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques',
	},
	'monde.personnages[].description_joueur': {
		libelle: 'DESCRIPTION JOUEUR',
		hint: 'lue par le joueur',
	},
	'canon.ton': {
		libelle: 'TON',
		hint: 'interne — consigne injectée au modèle',
	},
} as const satisfies Record<string, LibelleDeChamp>

export type CheminLibelle = keyof typeof LIBELLE_DES_CHAMPS
```

**Les quatre paires sont les chaînes EXACTES du dépôt, relevées à l'arbitrage** : `BlocIdentite.tsx` l. 5-8 (`HINT_*`) et l. 42/51/60 (`label`) ; `PanneauCanon.tsx` l. 234-235 (`label="TON"`, `hint="interne — consigne injectée au modèle"`). Les `PLACEHOLDER_*` de `BlocIdentite.tsx` **ne bougent pas** : ils restent privés à leur fiche. `SYNOPSIS MJ` et `ACCROCHE JOUEUR` de `PanneauCanon.tsx` **restent inline, intouchés**. Dans `BlocIdentite.tsx`, **trois accès explicites** (`LIBELLE_DES_CHAMPS['monde.personnages[].fonction'].libelle`), **jamais** un indexage par `ChampTexte` — qui vaut `keyof BrouillonPersonnage` et inclut `'nom'`, donc ne compilerait pas.

```ts
// ─── worker/index.ts ───────────────────────────────────────────────────────

const BASE_CORS = {
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',   // POST ajouté
	'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
}

interface Env {
	GENLIV_KV: KVNamespace
	ALLOWED_ORIGINS?: string
	/** SECRET d'environnement (`wrangler secret put IA_API_KEY`). Jamais dans
	 *  `wrangler.toml`, jamais côté client, jamais renvoyé dans une réponse.
	 *  `wrangler.toml` N'EST PAS touché par cette itération. */
	IA_API_KEY?: string
}

/** L'INVITE vit ICI et nulle part ailleurs (décision INVITE : le client décide
 *  QUELLES DONNÉES SORTENT, le worker CE QU'ON DEMANDE). Exportée pour le SEUL
 *  garde KR-236. `max_tokens` est un paramètre de REQUÊTE du fournisseur — pas
 *  une règle du dossier, et c'est son unique domicile légitime (§ 8, n° 7). */
export const INVITES: Record<string, { systeme: string; max_tokens: number }> = {
	'personnage-prose': { systeme: /* incruste GABARIT_SORTIE */ '…', max_tokens: /* choisi */ 0 },
}

/** Plafond HTTP du corps d'un appel IA — OCTETS, enveloppe et invite comprises.
 *  Mesuré au lot 1 (§ 4 quater). JAMAIS `body.length`. */
export const TAILLE_MAX_CORPS_IA = /* mesuré */

// La route se branche APRÈS la garde `X-Sync-Key`, AVANT le `match` de `/kv/` :
const matchIa = url.pathname.match(/^\/ia\/([a-z-]+)$/)
```

`handleIa`, dans l'ordre, **toutes réponses en JSON** avec `Content-Type: application/json` (KR-233) :

| # | Condition | Statut | Corps | Branche client |
|---|---|---|---|---|
| 1 | méthode ≠ POST | `405` | `{"erreur":"methode"}` | `indisponible` |
| 2 | rôle absent de `INVITES` | `404` | `{"erreur":"role-inconnu"}` | `indisponible` |
| 3 | `env.IA_API_KEY` absent | `503` | `{"erreur":"non-configure"}` | `indisponible:'non-configure'` |
| 4 | `new TextEncoder().encode(brut).length > TAILLE_MAX_CORPS_IA` | `413` | `{"erreur":"trop-grand","limite":…}` | `indisponible` |
| 5 | `JSON.parse` échoue | `400` | `{"erreur":"corps-illisible"}` | `indisponible` |
| 6 | amont en échec ou exception | `502` | `{"erreur":"amont"}` | `indisponible:'injoignable'` |
| 7 | nominal | `200` | la sortie structurée du modèle, **telle quelle** | **re-validée par le client** (KR-116 : du point de vue du client, le worker EST une entrée non fiable) |

**Le corps est lu AVANT d'être refusé** — assumé, et à écrire : la garde protège le **budget modèle**, pas la bande passante ; c'est précisément pourquoi le budget **client** existe en face. **Authentification** : `X-Sync-Key`, l'en-tête existant.

```ts
// ─── src/features/dossier-copilote/hooks/useDemandeCopilote.ts ─────────────

export type EtatDemande =
	| { phase: 'repos' }
	| { phase: 'en-cours' }
	| { phase: 'proposition'; proposition: PropositionResolue }
	| { phase: 'echec'; reponse: ReponseCopilote }
	| { phase: 'decide'; issue: 'accepte' | 'refuse' }

export interface UseDemandeCopiloteResult {
	etat: EtatDemande
	/** Ne fait RIEN si un appel est déjà en vol — le garde est un `enVolRef`, PAS
	 *  le `disabled` du bouton : deux clics synchrones passent avant le re-rendu
	 *  (critère 1, mutant obligatoire). */
	lancer: (cible: CibleCopilote) => void
	annuler: () => void
	accepter: () => void
	refuser: () => void
}
```

**La proposition en attente est de l'ÉTAT D'ÉCRAN** : elle n'est jamais persistée (ce serait un document fantôme que `validateDossier` n'a jamais vu), elle meurt à la navigation, et elle ne **capture** jamais le dossier — elle capture `role`, `entiteId`, `champ`, `valeur`, et s'applique sur le document **gelé** que la recette de `update` reçoit.

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Contexte injecté** | **12 chemins de feuille**, tous d'audience `'ia'` dans `destinations.ts`, **zéro dérogation** : `canon.ton`, `canon.interdits_ton[]`, `canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, puis — **restreints au personnage désigné** — `fonction`, `apparence`, `description_joueur`, `but.libelle`, `but.pourquoi`, `caractere.parler[]`, `caractere.jamais`, `plan_actions[].action`. **Le champ CIBLE n'est jamais injecté dans sa propre demande** (le montrer invite la paraphrase). Aucun identifiant, aucun nom, aucun chiffre. |
| **Corps de requête** | `{ "role": "personnage-prose", "champ": "<chemin de feuille>", "contexte": "<une seule chaîne>" }` — **ni date, ni identifiant, ni nonce** : c'est ce qui rend « deux lancers ⇒ deux corps identiques » démontrable par égalité stricte. |
| **Schéma de sortie** | `{ "valeur": "<prose>" }` — **UNE clé**. Aucun rang, aucun nombre, aucune sous-entité, aucun tableau, **aucun écho du champ**. |
| **Validation de FORME, jamais de prose** (KR-229) — **six** prédicats | (1) objet JSON (ni tableau, ni `null`) ; (2) ensemble des clés **exactement** `new Set(CLES_SORTIE)` — une clé en trop est un **refus**, c'est le signal KR-236 lui-même ; (3) `typeof valeur === 'string'` ; (4) `valeur.trim().length > 0` ; (5) `!valeur.includes(MARQUEUR_A_ECRIRE)` — constante **importée**, jamais recopiée (KR-223) ; (6) **scanner anti-identifiant** (§ 4 ter). |
| **Échec de validation** | Violation d'un des six ⇒ **rejeu exactement une fois**. Second échec ⇒ `{statut:'illisible', motif}` : **état terminal**, `DossierService.update` non appelé, `PersistenceService.set` non appelé, bus muet, `fetch` appelé **exactement 2** fois, **aucune rétention** des deux sorties fautives (les montrer serait afficher ce que le validateur vient de refuser). |
| **Ce qui ne déclenche AUCUN rejeu** | réseau, 5xx, timeout, **413**, abort — branche `indisponible{raison}`, **un seul appel**. Sans mémoire, le second corps serait identique, donc la garde rendrait identiquement 413 : rejouer un déterminisme est une perte sèche. |
| **Ce qui ne déclenche aucun appel du tout** | `PARTIES_REQUISES` vidée par le filtre `MARQUEUR_A_ECRIRE`, ou budget de contexte dépassé — branche `refuse`, **zéro `fetch`**. |
| **L'IA ne fait PAS** | les dés, les stats, les curseurs, l'inventaire, l'XP, les portes de révélation, les identifiants, la création d'entité — résolus par le code. **Elle ne voit pas** le nom du personnage (`auteur`), son camp et sa portée (`moteur`), ses 8 caractéristiques et ses 6 curseurs (`moteur`), les autres fiches, le lieu. Coût assumé et nommé : une `apparence` proposée peut contredire un chiffre que l'auteur a posé ; **la parade est le diff, pas l'élargissement de la table**. |
| **La VOIX — à écrire noir sur blanc dans le lot qui pose l'invite** | **Aucune consigne « deuxième personne, présent, immersive ».** `description_joueur` est du **contexte injecté au narrateur**, jamais émis verbatim (`destinations.ts` l. 168-174 : les proses lues mot pour mot sont `charpente.depart.texte_ouverture_joueur` et `charpente.fins[].texte`, et c'est ce qui les rend `moteur`). Une prose en voix de scène deviendra **fausse** le jour où la n° 10 l'injectera comme fiche. Un ouvrier qui connaît le § 2.8 recopiera la voix du Temps 2 par réflexe, et **personne ne le verra en revue — le texte produit sera joli**. |
| **Anti-complaisance** | Pas de garde automatique : un seuil de similarité serait le garde à seuil non mesuré déjà rejeté (KR-235). Ce qui le traite : **le bloc AVANT/APRÈS** de la variante REMPLACEMENT (auto-paraphrase de la cible), et **l'absence de tout adjectif évaluatif** à l'écran — seule forme testable. La paraphrase du *contexte* n'est **pas** couverte : à écrire dans la revue, pas à compter comme acquise. |
| **Budget par tour** | « Plafond d'appels par tour » : sans objet, il n'y a pas de tour. Ce qui le remplace : **un appel en vol à la fois** (critère 1) et **les deux plafonds** (§ 4 quater). Aucun compteur, aucun limiteur de débit — point d'extension nommé, non livré : **quiconque connaît une clé de synchronisation valide peut brûler du budget modèle** (KR-148), à écrire dans la revue sans euphémisme. |

### 4 ter — Le scanner anti-identifiant *(arbitrage de l'orchestrateur — deux mesures se sont croisées)*

**Prédicat retenu : FORME LÂCHE ∩ APPARTENANCE.**

```
fuite ⇔ (sous-chaîne de forme <espace>.<slug>, motif NON ancré dérivé de
         ESPACES_DE_NOMS — jamais re-listé, KR-117)
      ∧ (cette sous-chaîne ∈ { id | collectIds(dossier) })
```

`collectIds(dossier: unknown)` est déjà `export function` (`identifiers.ts` l. 253) et total ; `dossier` est déjà paramètre de `demander`. Coût : un `Set`.

**Pourquoi PAS le resserrage mesuré par la QA** (exiger un chiffre ou un tiret dans le suffixe) : vérifié à l'arbitrage — il crée un **faux négatif sur `lieu.amorce`**, l'identifiant du lieu semé dans **tout** dossier créé (`amorce.ts`, `LIEU_INITIAL = 'lieu.amorce'`), qui ne porte **ni chiffre ni tiret**. La prémisse de la QA (« les identifiants contiennent toujours un tiret ») est vraie de `randomToken()` mais **fausse des identifiants semés**. L'appartenance rend le resserrage inutile **et** nuisible.

**`FORME_IDENTIFIANT` n'est PAS réutilisée** : elle est ancrée `^…$` (`identifiers.ts` l. 76) — inerte sur une prose (KR-235, vérifié).

**Les canaris, épinglés littéralement, à REJOUER avant signature du lot :**
- **bénin** — `'Il dit: « Enfin.tout est pret. » Elle range son objet.favori.'` ⇒ **accepté**. Le test asserte **en plus** que `collectIds(dossier)` ne contient ni `fin.tout` ni `objet.favori` : le canari **dit pourquoi il est vert**.
- **fuite** — une prose contenant `lieu.amorce` **en milieu de phrase** ⇒ **refus du lot entier**. `lieu.amorce` est garanti par `construireAmorce` : il ne peut pas disparaître d'une fixture. `pnj.aldur-2` peut s'y ajouter.

**Trois mutants à ÉCRIRE, pas à déduire** — « la valeur attendue n'est pas le pouvoir séparateur » :
1. forme seule (∩ retirée) ⇒ le canari **bénin rougit** (mesuré par la QA : la forme lâche matche `objet.favori`) ;
2. appartenance seule avec `Set` vidé ⇒ la **fuite reste verte** ;
3. forme resserrée « chiffre ou tiret exigé » ⇒ **`lieu.amorce` s'échappe** *(mutant découvert à l'arbitrage — c'est lui qui justifie la forme lâche)*.

**Limite du témoin, à recopier dans la revue** : la casse. `'Objet.favori-2…'` en début de phrase ne matche pas (alternation en minuscules). **NON MESURÉ au-delà** ; risque jugé faible, le modèle recopiant des chemins en minuscules — mais c'est une limite, pas un trou comblé.

### 4 quater — Les DEUX plafonds du même appel *(l'`open_question` de l'itération, tranchée)*

Deux grandeurs distinctes, deux doctrines d'arrondi, **mesurées dans le même lot** — sinon aucune revue ne peut voir que l'un contredit l'autre.

| | Budget **client** | Garde **worker** |
|---|---|---|
| Grandeur | **caractères** (`String.length`, UTF-16) du contexte assemblé, avant sérialisation et avant l'invite | **octets** du corps HTTP, enveloppe et invite comprises |
| Moment | refuse **AVANT** l'aller-retour | refuse **APRÈS** l'avoir lu |
| Ce qu'il protège | le fait de pouvoir nommer ce qu'il faut raccourcir (on raccourcit des **champs**) | le **budget modèle** — pas la bande passante, et c'est assumé |
| Mesure | `TextEncoder`, **jamais `body.length`** (`worker/index.ts:84` compte des unités de code UTF-16 ; on ne le recopie pas, et on ne le corrige pas non plus — hors périmètre) | |

**Protocole, dans `contexte.test.ts` puis `frontiere.test.ts` :**
1. Asserter d'abord que **les 12 chemins résolvent non vides** sur l'entité de mesure (le personnage le plus rempli de `__fixtures__/dossier-reference.json`) — sinon c'est un plancher, pas une mesure. Deux des douze sont des **collections non bornées** (`caractere.parler[]`, `plan_actions[].action`), donc le refus `trop-long` est réellement atteignable.
2. `M = assemblerContexte('personnage-prose', dossierReference, cible).texte.length`, **après** filtrage d'audience et **après** filtre `MARQUEUR_A_ECRIRE`. La taille **brute** d'une fixture n'est pas cette mesure : son poids est, à l'écrasante majorité, exactement ce que la garde d'audience retire.
3. `BUDGET_CARACTERES_CONTEXTE = ceil(M × 3 / 1000) × 1000`. Le facteur **3** est une **décision datée du comité** — la fixture est une épreuve de validateur, pas le dossier d'un auteur. L'arrondi au millier **EST** la marge.
4. `E` = octets de l'enveloppe, **mesurés** sur un corps réel : `octets(corps) − octets(texte du contexte)`.
5. `TAILLE_MAX_CORPS_IA = ceil((3 × BUDGET_CARACTERES_CONTEXTE + E) / 1024) × 1024`. **3 octets/unité de code est la borne HAUTE réelle** — MESURÉ par la QA : `'€'` (BMP) = 3 octets pour 1 unité ; `'\u{1F600}'` = 4 octets pour **2** unités, soit 2/unité. Écrire `4` serait une marge inventée présentée comme une borne.
6. **Doctrine d'évolution** : ce plafond **n'est pas un cliquet**. C'est une borne de refus, re-dérivée **par la même formule sur une nouvelle mesure** à chaque itération qui élargit `CHAMPS_INJECTES`. On ne desserre jamais « parce que ça a coincé une fois ».

**Le test de liaison** (`worker/frontiere.test.ts`) — MESURÉ séparateur par la QA (baisser le plafond d'1 Ko ou monter le budget de 400 le fait rougir). **Réserve obligatoire** : l'enveloppe du test est construite depuis les constantes **réellement exportées** (`INVITES['personnage-prose'].systeme`, `BUDGET_CARACTERES_CONTEXTE`), **jamais retapée** — une enveloppe retapée casserait silencieusement le lien que le test garantit.

### 4 quinquies — La garde KR-236 *(la seule panne de cette itération qu'aucune porte ne voit)*

**La panne, écrite pour qu'on la reconnaisse** : quelqu'un modifie l'invite dans `worker/index.ts` pour demander `{"texte": …}`. Tout appel échoue la validation, est rejoué une fois, échoue encore ; l'auteur lit « Le copilote n'a pas produit de proposition exploitable. » — **le bon texte, pour la mauvaise raison, à chaque essai, pour toujours**. `tsc` vert, `jest` vert, la revue de PR ne lit pas deux fichiers à la fois, et le worker n'est pas dans la porte de commit.

**Trois pièces, toutes dans le lot 1 :**
1. **Une seule autorité de contenu** : `GABARIT_SORTIE` vit dans `brain/copilote/schemaSortie.ts` et est **dupliqué** dans `worker/index.ts`. **Aucun import `worker/` → `src/brain/`** — il traînerait du code client dans le paquet wrangler. La liaison est un **test**, jamais un import de production.
2. **Le balayage de source**, dans `worker/frontiere.test.ts` (`fs.readFileSync` ; `testMatch` ne gouverne que la découverte, pas ce qu'un test lit — précédent `amorce.test.ts`). Trois contraintes : (a) le test ne contient **aucun** des deux littéraux, il les **extrait** des deux fichiers par la même regex ancrée et les compare entre eux — sinon il devient lui-même un troisième porteur ; (b) il asserte **exactement une** occurrence par fichier, protection contre la vacuité ; (c) `path.join`, pour tenir sous Windows.
3. **Le témoin exécutable** : le test appelle le handler `POST /ia/personnage-prose` avec le `fetch` du fournisseur **moqué**, récupère **l'invite réellement composée**, et asserte qu'elle **contient `GABARIT_SORTIE`** — **jamais la clé nue** : `valeur` est un mot français courant, et une invite disant « la valeur du personnage » ferait passer un `includes('valeur')` sans rien demander au modèle. Puis, dans le même processus, la réponse conforme traverse le **validateur de `brain/`** et doit rendre `propose`.

**Cas négatifs obligatoires, à écrire** : une invite fabriquée demandant `{"texte": …}` doit **rougir** ; un littéral altéré d'un caractère doit **rougir**. Un instrument qui ne sait pas échouer ne mesure rien.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute **seul, en premier**. Vérifié ligne à ligne : **aucun fichier n'apparaît dans les deux listes.**

### Lot 1 — `tuyau` · `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, **seul, en premier**)
- **But** : faire exister la route worker, le contrat de sortie et sa validation, l'assembleur de contexte sous garde d'audience, `CopiloteService` avec son rejeu unique, le registre de libellés, et la prop sœur — **sans aucun écran**.
- **Ordre interne** (pour qu'un agent à court de budget s'arrête sur une frontière cohérente) : `jest.config.cjs` → route worker + son test → `schemaSortie` → `contexte` (+ la mesure `M`) → `frontiere.test.ts` → `CopiloteService` → `feuilles.ts` → registre de libellés + ses deux consommateurs → prop sœur → `tsconfig.json` (conditionnel, **en dernier**).

**Fichiers :**

| Fichier | N/R |
|---|---|
| `worker/index.ts` | R |
| `worker/index.test.ts` | N |
| `worker/frontiere.test.ts` | N |
| `jest.config.cjs` | R |
| `tsconfig.json` | R *(conditionnel — voir § 5.1)* |
| `src/brain/copilote/types.ts` | N |
| `src/brain/copilote/schemaSortie.ts` | N |
| `src/brain/copilote/schemaSortie.test.ts` | N |
| `src/brain/copilote/contexte.ts` | N |
| `src/brain/copilote/contexte.test.ts` | N |
| `src/brain/CopiloteService.ts` | N |
| `src/brain/CopiloteService.test.ts` | N |
| `src/brain/dossier/libelles.ts` | N |
| `src/brain/dossier/libelles.test.ts` | N |
| `src/brain/dossier/feuilles.ts` | N |
| `src/brain/dossier/couverture.test.ts` | R |
| `src/brain/index.ts` | R |
| `src/brain/BrainContext.tsx` | R |
| `src/features/dossier-fiches/components/BlocIdentite.tsx` | R |
| `src/features/dossier-canon/components/PanneauCanon.tsx` | R |
| `src/features/bascule-editeur/components/DossierEditorScreen.tsx` | R |
| `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` | R |

- **Expose** : `CopiloteService` (4 branches), `RoleCopilote`, `ChampProseCle`, `CHAMPS_PROPOSABLES`, `PropositionRendue`, `PropositionResolue`, `CibleCopilote`, `ReponseCopilote`, `LIBELLE_DES_CHAMPS`, `CheminLibelle`, `panneauCopilote`. **Ne ré-exporte PAS** par `brain/index.ts` : `CHAMPS_INJECTES`, `assemblerContexte`, `DEROGATIONS_AUDIENCE`, `DESTINATION_DES_CHAMPS`.
- **Consomme** : `DossierService.update`, `CloudSettingsService`, `MARQUEUR_A_ECRIRE`, `collectIds`, `ESPACES_DE_NOMS`, `DESTINATION_DES_CHAMPS` (import profond `./dossier/destinations`, **interne à `brain/`**, en garde de test jamais en pilote).
- **Critères couverts** : #1 (moitié brain), #2, #5, #6, #7, #8.
- **Porte qualité seul** : oui — aucun fichier de `dossier-copilote` n'existe encore, le test de `DossierEditorScreen` **bouchonne** la render-prop, les tests du service moquent `global.fetch`, les tests de route tournent en environnement `node`.

### Lot 2 — `panneau` · feature

- **Ouvrier** : `dev-lot` — démarre **contrat figé**
- **But** : l'écran, le diff, l'acceptation, et l'injection depuis la racine de composition.

**Fichiers :**

| Fichier | N/R |
|---|---|
| `src/features/dossier-copilote/index.ts` | N |
| `src/features/dossier-copilote/textes.ts` | N |
| `src/features/dossier-copilote/components/PanneauCopilote.tsx` | N |
| `src/features/dossier-copilote/components/LigneProposition.tsx` | N |
| `src/features/dossier-copilote/hooks/useDemandeCopilote.ts` | N |
| `src/features/dossier-copilote/tests/panneauCopilote.test.tsx` | N |
| `src/features/dossier-copilote/tests/acceptation.test.tsx` | N |
| `src/features/dossier-copilote/tests/cablage.test.ts` | N |
| `src/App.tsx` | R |

- **Consomme** : tout le lot 1 via `brain/`. **Aucun import** vers une autre feature (KR-184).
- **Critères couverts** : #1 (moitié composant), #3, #4.
- **`App.tsx` est ici, PAS au lot contrat** — il doit écrire `<PanneauCopilote/>`, qui n'existe qu'au lot 2 ; placé au lot 1 il ne compilerait pas et le lot échouerait à sa propre porte.
- **Le garde de placement est ici aussi** (`cablage.test.ts`) : il lit le **source** d'`App.tsx`, donc il ne peut pas vivre dans un lot qui ne modifie pas ce fichier. Il asserte l'**ordre seul** (`panneauCopilote=` présent et avant `panneaux={{`), pas la forme du paramètre.

### 5.1 — Ce que le lot 1 doit MESURER avant de se signer *(jamais déduire)*

1. `tsc --noEmit` reste vert avec `"worker"` dans `tsconfig.include`. **S'il rougit pour un motif étranger à cette itération : ne pas toucher `tsconfig.json`, et ÉCRIRE dans la revue que les tests du worker ne sont pas typés par la porte.**
2. Les 12 chemins résolvent **non vides** sur l'entité de mesure, **avant** de relever `M`.
3. Les canaris du scanner **rejoués** contre la forme choisie, et les **trois mutants** du § 4 ter écrits.
4. Le cas négatif du garde KR-236 : une invite demandant `{"texte": …}` **rougit**.
5. Les deux canaris de plafond à ±1 octet / ±1 caractère.
6. `jest.setup.cjs` en environnement node — **déjà mesuré par la QA** (`globalThis.crypto` existe) : contingence retirée, le garde `typeof globalThis.crypto === 'undefined'` n'est qu'un repli documenté si la machine change.

## 6 — Critères d'acceptation

1. **Étant donné** une cible dont le contexte est assemblable, **quand** l'auteur lance le copilote et que le worker rend une proposition conforme, **alors** `fetch` est appelé **exactement 1 fois** ; **et étant donné** deux clics rapprochés sur « Lancer » pendant qu'un appel est en vol, **alors** il en résulte toujours **exactement 1** appel. *(unitaire brain + composant — lots 1 et 2)*
   *Le garde est un `enVolRef` dans le hook ; `disabled` n'en est que la face visible — deux `fireEvent.click` synchrones passent avant le re-rendu. Mutant obligatoire : retirer le ref, garder `disabled` ⇒ le test rougit.*
2. **Étant donné** une première réponse qui viole un des six prédicats de forme, **quand** le service traite la demande, **alors** il rejoue **exactement une fois** ; **et étant donné** deux réponses non conformes consécutives, **alors** il rend `{statut:'illisible'}`, `fetch` a été appelé **exactement 2 fois** (jamais 3), `DossierService.update` n'a pas été appelé, `PersistenceService.set` n'a pas été appelé et le bus est muet — **deux propriétés, deux tests distincts** (KR-230). *(unitaire brain — lot 1)*
3. **Étant donné** les quatre états rendables (indisponible · illisible-après-rejeu · contexte-à-écrire · contexte-trop-long), **quand** chacun est rendu, **alors** les quatre chaînes sont deux à deux différentes (`new Set(...).size === 4`) **et** chaque motif rend **le texte exact qui lui correspond**, asserté motif par motif. *(composant — lot 2)*
   *L'unicité seule n'a aucun pouvoir séparateur sur un branchement motif→texte inversé : les deux assertions sont obligatoires (KR-197/199).*
4. **Étant donné** une proposition acceptée, **quand** l'acceptation s'exécute, **alors** l'écriture passe **uniquement** par `DossierService.update(id, recette)` dans l'ordre persistance-**puis**-événement (KR-004) ; **et étant donné** un candidat recomposé que `validateDossier` refuse, **alors** rien n'est persisté, aucun événement n'est émis, et les anomalies sont rendues à l'écran — **cas nominal**, pas une branche d'erreur (KR-234). *(unitaire + composant — lot 2)*
5. **Étant donné** une sortie de modèle contenant `lieu.amorce` en milieu de phrase, **quand** elle est validée, **alors** le lot **entier** est refusé ; **et étant donné** le canari de prose française bénigne épinglé au § 4 ter, **alors** elle n'est **pas** refusée, le test assertant **en plus** que `collectIds(dossier)` ne contient ni `fin.tout` ni `objet.favori`. Les deux canaris sont **rejoués** contre l'implémentation réelle, et les **trois mutants** du § 4 ter sont écrits (KR-235). *(unitaire brain — lot 1)*
6. **Étant donné** le contexte assemblé pour `personnage-prose`, **quand** le test de confinement tourne, **alors** `DEROGATIONS_AUDIENCE` est **vide et assertée vide**, les **12** chemins de `CHAMPS_INJECTES` ont tous la destination `'ia'` dans `DESTINATION_DES_CHAMPS` (cardinalité assertée), l'ensemble des chemins de l'objet assemblé est **inclus** dans cette liste (via `feuillesDeLaFixture`, **aucun seuil numérique**), et `CHAMPS_PROPOSABLES` compte **exactement 3** entrées dont `PropositionResolue.champ` est vérifié membre **avant** `update` (KR-232/215). *(unitaire brain — lot 1)*
7. **Étant donné** un dossier neuf dont `canon.ton` porte `MARQUEUR_A_ECRIRE`, **quand** l'auteur lance l'assistant, **alors** le champ est **retiré** du contexte, `PARTIES_REQUISES` se vide, la demande est **refusée en nommant « TON »** et **aucun appel réseau ne part** ; **et étant donné** deux lancers successifs sur la même cible d'un dossier inchangé, **alors** exactement 2 appels partent et **leurs corps de requête sont strictement identiques** (KR-223, absence de mémoire). *(unitaire brain — lot 1)*
8. **Étant donné** la route `POST /ia/:role`, **quand** la porte de commit tourne, **alors** elle porte son propre test sous jest en environnement **node**, `POST` figure dans `BASE_CORS`, la garde de taille refuse en **octets** (`TextEncoder`) avec une réponse **JSON**, le témoin KR-236 prouve que l'invite composée contient `GABARIT_SORTIE` **avec son cas négatif**, et le test de liaison prouve `TAILLE_MAX_CORPS_IA ≥ BUDGET_CARACTERES_CONTEXTE` converti au pire cas d'octets ; **et** les dix sections que cette feature ne possède pas rendent toujours leur état vide, l'entrée « Copilote » respecte son ordre relatif à « Contrôles », et `npm run lint` + `tsc --noEmit` sont à zéro erreur sans aucun import inter-features (KR-233/187/184). *(route node + composant + porte de commit — lots 1 et 2)*

**Amendement au critère de feature n° 14, unique et daté** : le lot contrat de l'itération 1 peut promouvoir dans `src/brain/dossier/libelles.ts` les **quatre** libellés que le panneau Copilote consomme réellement — `FONCTION`, `APPARENCE`, `DESCRIPTION JOUEUR` (`BlocIdentite.tsx`) et `TON` (`PanneauCanon.tsx`, **une seule paire label/hint**) — en **extraction PURE, sans modification d'aucune chaîne**. `SYNOPSIS MJ` et `ACCROCHE JOUEUR` restent inline, intouchés. Non-régression prouvée par les suites de `dossier-fiches` et `dossier-canon` restant **vertes sans une seule retouche** — un diff de test dans ces fichiers est le signal qu'une chaîne a bougé. **Non renouvelable** : dès l'it2, la règle redevient strictement « aucun fichier de `dossier-canon`/`dossier-fiches`/`dossier-registres` dans un lot de cette feature ».

## 7 — Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| `CopiloteService.test.ts` › un appel sur reponse conforme | `fetch` appelé 1 fois, `statut === 'propose'` | jest | KR-229 | 1 |
| `CopiloteService.test.ts` › rejeu exactement une fois | 1ʳᵉ non conforme + 2ᵉ conforme ⇒ 2 appels, `propose`. **Mutant : 0 rejeu** | jest | KR-230 | 1 |
| `CopiloteService.test.ts` › etat terminal apres le second echec | 2 non conformes ⇒ `illisible`, **jamais 3 appels**, `update`/`set`/bus muets (3 assertions séparées). **Mutant : rejeu illimité, 3ᵉ mock conforme atteint** | jest | KR-230 | 1 |
| `CopiloteService.test.ts` › aucun rejeu sur indisponibilite | 5xx, 413, abort ⇒ `indisponible`, **1 seul appel** | jest | KR-230 | 1 |
| `CopiloteService.test.ts` › aucune memoire | 2 `demander()` indépendants depuis un état propre ⇒ corps **strictement égaux**. *Fixtures disjointes de celles du rejeu — ne pas réutiliser le mock du rejeu* | jest | — | 1 |
| `schemaSortie.test.ts` › les six predicats | un test par prédicat — c'est ici que l'entrée non fiable est validée, **à la frontière où la donnée entre dans le dossier**, et non derrière le réseau | jest | KR-229, **KR-116** | 1 |
| `schemaSortie.test.ts` › la cle surnumeraire est un refus | `{valeur, champ}` ⇒ `{ok:false, motif:'schema'}` — **c'est la preuve que la forme réseau ne porte aucune référence** | jest | **KR-231**, KR-236 | 1 |
| `schemaSortie.test.ts` › le gabarit est le schema | `Object.keys(JSON.parse(GABARIT_SORTIE))` ≡ `CLES_SORTIE` | jest | KR-236 | 1 |
| `schemaSortie.test.ts` › scanner, les deux canaris | fuite `lieu.amorce` refusée · prose bénigne acceptée · `collectIds` ne contient ni `fin.tout` ni `objet.favori` · motif **dérivé** de `ESPACES_DE_NOMS`, jamais re-listé. **Trois mutants du § 4 ter écrits** | jest | KR-235, **KR-117** | 1 |
| `contexte.test.ts` › confinement d audience | 12 chemins, tous `'ia'` ; cardinalité 12 ; `DEROGATIONS_AUDIENCE` vide **assertée** ; inclusion de chemins via `feuillesDeLaFixture`, **aucun seuil numérique** | jest | KR-232, **KR-215** | 1 |
| `contexte.test.ts` › le marqueur vide une partie requise | `canon.ton` marqué ⇒ `{ok:false, motif:'a-ecrire', chemin:'canon.ton'}`, `fetch` **non appelé** | jest | KR-223 | 1 |
| `contexte.test.ts` › mesure du budget | les 12 chemins non vides **d'abord**, puis `M`, puis la formule | jest | — | 1 |
| `libelles.test.ts` › chaque chaine vit ici et nulle part ailleurs | balayage de source sur `src/`, tests exclus (précédent `amorce.test.ts`) | jest | KR-109/223 | 1 |
| `worker/index.test.ts` › les sept branches de la route | 405/404/503/413/400/502/200, toutes en JSON ; `POST` dans `BASE_CORS` | jest **node** | KR-233 | 1 |
| `worker/frontiere.test.ts` › l invite nomme le gabarit | invite **composée** ⊇ `GABARIT_SORTIE` · **cas négatif** : invite en `{"texte"}` ⇒ rouge | jest **node** | KR-236 | 1 |
| `worker/frontiere.test.ts` › un seul gabarit, deux porteurs | double extraction de source, allow-list de 2 fichiers, 1 occurrence chacun · **cas négatif** : littéral altéré ⇒ rouge | jest **node** | KR-236 | 1 |
| `worker/frontiere.test.ts` › les deux plafonds sont compatibles | `encode('€'.repeat(BUDGET) + enveloppe).length <= TAILLE_MAX` · canaris ±1 · enveloppe **construite depuis les constantes exportées** | jest **node** | — | 1 |
| `dossierEditorScreen.test.tsx` › nav Copilote | `ListRow` rendue ssi la prop est injectée ; `SectionId` seul traverse ; entrée ajoutée au `describe` paramétré des états vides | jest | KR-187 | 1 |
| `panneauCopilote.test.tsx` › trois Card, deux Bientot | Cards 2/3 : `Badge muted`, **aucun bouton Lancer** | jest | — | 2 |
| `panneauCopilote.test.tsx` › etats vides | 0 personnage ⇒ option désactivée + `title` nommé ; aucun champ choisi ⇒ Lancer désactivé + `title` | jest | états vides | 2 |
| `panneauCopilote.test.tsx` › chargement, Annuler, Echap | `role="status"`, focus sur Annuler, Échap rend le focus à Lancer | jest | — | 2 |
| `panneauCopilote.test.tsx` › un seul appel en vol | Promise retenue à la main, 2 clics ⇒ `fetch` 1 fois. **Mutant : hook sans `enVolRef`** | jest | — | 2 |
| `panneauCopilote.test.tsx` › quatre textes discrimines | `Set(...).size === 4` **et** assertion par motif. **Mutant : branchement motif→texte inversé** | jest | KR-197/199 | 2 |
| `acceptation.test.tsx` › ecriture par update seul | `update` appelé, ordre persistance→événement épinglé | jest | KR-004 | 2 |
| `acceptation.test.tsx` › refus de validateDossier, cas nominal | rien persisté, aucun événement, anomalies rendues | jest | KR-234 | 2 |
| `acceptation.test.tsx` › les deux variantes de LigneProposition | cible vide ⇒ REMPLISSAGE · cible rédigée ⇒ bloc AVANT + Field APRÈS | jest | — | 2 |
| `cablage.test.ts` › placement de la prop soeur | source d'`App.tsx` : `panneauCopilote=` présent et **avant** `panneaux={{` | jest | — | 2 |
| `src/features/dossier-format/tests/lintIsolation.test.ts` — **EXISTANT, dans AUCUN lot : personne ne le modifie** | `dossier-copilote` entre **automatiquement** dans `OVERRIDES_PAR_FEATURE` (`.eslintrc.cjs` l. 129, dérivé du disque) dès que son dossier existe — aucun import inter-features possible dans les deux sens. Il doit rester **vert sans retouche** : une retouche est le signal qu'un lot a franchi une frontière | jest + `npm run lint` | **KR-184** | — |

Cas limites couverts : **vide** (0 personnage, champ vide, `interdits_ton` vide — état calme, jamais un manque) · **très long** (les deux plafonds) · **hors ligne** (`indisponible`, aucune dégradation vers un modèle local) · **annulation** (Annuler/Échap, abort sans rejeu) · **double soumission** (critère 1).

**Non vérifiable en l'état — à recopier tel quel dans la revue d'itération, jamais compté comme couvert :**
- **La paraphrase du CONTEXTE** (`but.libelle` recyclé en `fonction`) n'est attrapée par rien. Le bloc AVANT/APRÈS n'attrape que l'auto-paraphrase d'une cible déjà rédigée — le Narratif a **retiré lui-même** son affirmation contraire du tour 1 (surestimation de couverture).
- **La casse du scanner** : `'Objet.favori-2…'` en début de phrase ne matche pas. Limite du témoin, non mesurée au-delà.
- **L'absence de mémoire** ne couvre que le **corps** : une fuite passée par un **en-tête HTTP** ne rougirait pas.
- **La branche « cible marquée » de REMPLISSAGE est INERTE** : aucun mécanisme du dépôt ne sème un champ de personnage avec `MARQUEUR_A_ECRIRE` (`useEcritureIdentite.ts` sème `''`), et `dossier-registres` a écarté ce semis au raffinage. Son test est un **test de contrat**, pas un test de comportement observable.
- **L'exposition de la route** : `ALLOWED_ORIGINS` est commenté ⇒ repli `'*'` en production, et `X-Sync-Key` est **une clé d'espace de noms, pas une autorisation** (KR-148). Quiconque en connaît une valide peut brûler du budget modèle. Aucun limiteur de débit n'est livré.
- **`tsc` ne couvre pas les tests du worker** si `tsconfig.include` n'a pas pu recevoir `"worker"` (§ 5.1, mesure à faire).

## 8 — Registre des désaccords

> Tout `REJETÉ` d'annexe est recopié ici : un refus motivé qui reste dans une note de tour **n'existe pas pour l'essaim** (précédent BUG-082 — un rejet perdu en condensation a été livré tel quel).

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | Narratif ↔ TL | Écho du `champ` dans la sortie du modèle (`CLES_PROPOSITION = ['champ','texte']`) | **REJETÉ** | Une sortie conforme au schéma peut nommer le **mauvais** champ, et rien n'arbitre : croire le modèle, c'est lui laisser choisir la cible. La cible est le couple indivisible `{entiteId, champ}`, côté client (KR-231). **Le Tech Lead a cédé** : `CLES_SORTIE = ['valeur']` sert le garde KR-236 à l'identique. |
| 2 | TL | Un garde KR-236 portant sur la **clé nue** | **REJETÉ** | `valeur` est un mot français courant : `includes('valeur')` serait vert sur une invite qui ne demande rien. Le garde porte sur `GABARIT_SORTIE`. |
| 3 | Narratif | Tolérer une clé en trop dans la sortie | **REJETÉ** | Une clé en trop **est** le signal KR-236 : l'avaler rend la panne muette. |
| 4 | TL ↔ Narratif | `canon.mj.synopsis_mj` **requis** au contexte | **REJETÉ** | Vérifié en source : `ton` **et** `synopsis_mj` portent tous deux le marqueur sur un dossier neuf, donc l'exiger n'élargit pas l'atteignabilité du refus — seulement le refus, sur l'auteur qui a posé son ton et pas encore son synopsis. **TL-14 retirée par son auteur.** |
| 5 | Narratif | Disjonction R2 « identité du personnage, 1 sur 5 » | **REJETÉ — retirée par son auteur** | N'entre pas dans la branche `refuse{chemin}` sans un cinquième texte d'écran, et livre un **jugement éditorial déguisé en garde de forme**. Conséquence tranchée par l'orchestrateur : l'union `ExigenceContexte` `{requis|parmi}` perd son unique instance `parmi` ⇒ **abstraction à un seul appelant (KR-109)**, remplacée par `PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]>`. Le typage en `CheminLibelle` rend « tout champ requis a un libellé d'écran » vrai **à la compilation**. |
| 6 | QA | Le risque produit derrière R2 : un personnage aux 5 champs vides ⇒ le modèle écrit sans rien savoir de lui | **REPORTÉ** → `open_questions` | Motif du Narratif : inventer à partir de rien est **refusable à coût nul** par l'auteur, et le goal nomme la page blanche comme le problème à résoudre. La QA a de plus mesuré qu'un tel garde exigerait un **prédicat de vacuité** que rien n'écrit (`useEcritureIdentite.ts` sème `''`, pas le marqueur). |
| 7 | Narratif | `PLAFOND_PROSE` comme prédicat de validation | **REJETÉ** | Bornerait trois champs que le schéma laisse **délibérément** non bornés (`types.ts` l. 1472-1475, doctrine de famille KR-203), depuis un **second site** que `BUDGETS_DE_MOTS`, pour un seul consommateur, sur un nombre non mesuré. **Compensation RETENUE** : `INVITES['personnage-prose']` porte un `max_tokens` — paramètre de requête du fournisseur, à côté de l'invite, jamais une règle du dossier. Six prédicats, pas sept. |
| 8 | QA ↔ Narratif | La forme du scanner anti-identifiant | **RETENU, arbitré** | La QA a **mesuré** que la forme lâche fait un faux positif sur `objet.favori` et propose d'exiger chiffre-ou-tiret. L'orchestrateur a **vérifié** que ce resserrage crée un **faux négatif sur `lieu.amorce`** — semé dans tout dossier, sans chiffre ni tiret. Retenu : **forme lâche ∩ `collectIds(dossier)`** (§ 4 ter), plus le **troisième mutant** que ce croisement a découvert. |
| 9 | TL ↔ UX/QA | 4ᵉ texte = « vide-mais-réussi » | **REPORTÉ** → it2 | Aucun producteur avant « Tisser les indices » : c'est un texte **sans branche**, et asserter l'unicité d'une constante morte est un instrument inerte (KR-235). Ni codé, ni gardé en constante. Le 4ᵉ texte de l'it1 est le refus de **budget**. **Objection 2 du Tech Lead retirée** — résolue par l'UX, pas par lui. |
| 10 | QA | `Set(...).size === 4` comme preuve de discriminance | **RETENU, durci** | L'unicité reste **vraie** si le code branche le mauvais texte sur le mauvais motif : elle n'a aucun pouvoir séparateur là-dessus. Assertion **par motif** obligatoire en plus. |
| 11 | UX ↔ TL | `chemin: CheminLibelle` sur le motif `trop-long` | **REJETÉ** | Désignerait « le champ injecté le plus long », qui peut être `but.libelle` ou `plan_actions[].action` — des libellés vivant dans `BlocSituation`/`BlocCaractere`/`BlocPlanActions`, rouvrant l'explosion du registre pour un texte qui ne nomme **jamais** un champ mais **la fiche**. `{ motif: 'trop-long' }` sans charge. |
| 12 | TL | `SECTEUR_DES_CHAMPS` + l'ordre de coupe en 5 étapes | **REPORTÉ** → it2 | Décision DÉGRADATION : en rédaction, **le dégradé EST le refus** — à l'it1 on ne coupe rien. Un registre dont rien ne rend la valeur est une dette. |
| 13 | UX ↔ TL ↔ PM | L'ampleur du registre de libellés (3, 4 ou 8 entrées) | **RETENU : 4** | 8 (TL tour 1) : `SYNOPSIS MJ` n'a **aucun** appelant, `synopsis_mj` n'étant jamais requis — promotion spéculative que la docstring du Tech Lead proscrit elle-même. 3 (TL tour 2) : son motif pour retirer `TON` était **conditionné à l'existence de R2** ; R2 retirée, il ne reste qu'un refus et il nomme un **chemin**, donc `TON` retrouve son appelant. Nom arbitré (les deux rôles avaient échangé leurs noms) : **`libelles.ts` / `LIBELLE_DES_CHAMPS`** — le registre porte `canon.ton`, « champs de prose » serait faux. |
| 14 | TL | Le registre **non** ré-exporté par `brain/index.ts` (précédent `amorce.ts`) | **REJETÉ** | `amorce.ts` n'est pas ré-exporté **parce qu'aucune feature ne le lit** ; ici **deux** features le lisent — c'est KR-109 à la lettre. Ré-exporté. Le commentaire de `brain/index.ts` (« les LIBELLÉS français restent côté feature — un seul consommateur réel ») est amendé sur place : **la condition est tombée**. |
| 15 | TL | Indexer `BlocIdentite.tsx` par `ChampTexte` | **REJETÉ** | `ChampTexte = keyof BrouillonPersonnage` inclut `'nom'` : ne compilerait pas contre la table. **Trois accès explicites.** |
| 16 | PM | Différer la variante REMPLACEMENT à une « itération 1-bis » | **REJETÉ — retiré par son auteur** | La coupe ne retirait pas « un cas sur deux » : **aucun mécanisme du dépôt ne marque un champ de personnage**, donc REMPLISSAGE seul se lit « le champ est vide », et l'auteur ne peut jamais faire retravailler ce qu'il a écrit. Pire, rien n'empêchait de **cibler** un champ rédigé : un état **non dessiné** où le texte de l'auteur disparaît sans trace. Coût réel mesuré par l'UX : un `div` statique sur des jetons déjà validés, le `Field` existant de toute façon, et la branche « ce champ est-il vide ? » **devant exister quoi qu'il arrive**. |
| 17 | Narratif | « Le bloc AVANT est le SEUL garde anti-complaisance de l'itération » | **REJETÉ — retiré par son auteur** | Faux : le diff attrape l'auto-paraphrase de la **cible**, pas la paraphrase du **contexte**, qui était la forme nommée. **Surestimation de couverture — la seule direction dangereuse.** Le trou réel part au § 7, « non vérifiable en l'état ». |
| 18 | Narratif | Garde anti-paraphrase à **seuil de similarité** | **REJETÉ** | Sémantique non choisie, seuil jamais mesuré, faux positif structurel — même faute que le garde de confinement à seuil déjà rejeté au cadrage (KR-235). |
| 19 | TL ↔ UX | `onSelectSection` non exercé : `() => <PanneauCopilote/>` | **REJETÉ** | Une prop sœur **imposée** qu'on n'exerce pas se lit comme morte en revue. Retenu (UX, domaine) : lien « **→ Ouvrir la fiche** » sur la ligne **acceptée**, une ligne de JSX, seul `SectionId` traversant. |
| 20 | UX | Sélecteur « CHAMP » absent de sa propre note de tour 1 | **RETENU** | Angle mort reconnu par son auteur : sans lui, **aucun mécanisme ne permet à l'auteur de choisir le champ**, alors que le goal l'exige. `SegmentedControl` — primitive vérifiée existante et exportée. |
| 21 | Narratif ↔ TL | Import `worker/` → `src/brain/` pour partager le gabarit | **REJETÉ** | Traînerait du code client dans le paquet wrangler. La liaison est un **balayage de source à double extraction**, jamais un import de production. **Le Narratif s'est rangé** ; son repli (B) devient la forme retenue, avec allow-list de deux porteurs, `path.join` et cas négatif. |
| 22 | TL | Le garde de placement d'`App.tsx` dans le lot **contrat** | **REJETÉ — défaut de son propre découpage, corrigé par lui** | Il exigerait `panneauCopilote=` dans un fichier que **seul le lot 2** modifie : le lot contrat échouerait à sa propre porte. Part dans `dossier-copilote/tests/cablage.test.ts`. |
| 23 | TL | `App.tsx` dans le lot contrat | **REJETÉ** | Même raison : il doit écrire `<PanneauCopilote/>`, qui n'existe qu'au lot 2. |
| 24 | TL | Un lot `worker` séparé du lot `brain` | **REJETÉ** | Les trois liaisons de `frontiere.test.ts` importent **des deux côtés**, et l'`open_question` exige que les deux plafonds soient mesurés **dans le même lot**. |
| 25 | TL | Un lot `contrat de surface` séparé (prop sœur seule) | **REJETÉ** | Vingt lignes ne valent pas un worktree ; le chemin critique reste le noyau, gain de parallélisme **nul**, coût de fusion réel. |
| 26 | TL | Lot 2 scindé en « UI » + « acceptation » | **REJETÉ** | Propriété de fichier non disjointe (`PanneauCopilote.tsx`, `useDemandeCopilote.ts`), et la moitié UI ne se démontre pas. |
| 27 | TL | Un lot « docs » | **REJETÉ** | `specification.json`, `CHANGELOG.md`, `code-knowledge.json`, `features_history.json`, `bug_history.json`, le roadmap n'appartiennent à **aucun** lot — étape 4 du cycle, écrite par l'orchestrateur après l'essaim. |
| 28 | TL | `Proposition<TRef>` générique / `resoudre<T>()` / `TableDesRangs` à l'it1 | **REJETÉ** | Abstraction à un seul appelant (KR-109) et « aucun rang » au goal. Les **deux types restent** — ils ne partagent plus aucune clé, ce qui sert KR-231 mieux encore. Ce qui part à l'it2 est la clé `rang` et sa table de résolution. |
| 29 | TL | `fetchImpl` injectable / option `copilote?` dans `CreateBrainOptions` | **REJETÉ** | Injection à un seul appelant ; les tests moquent `global.fetch` (précédent `CloudflareKVTransport.test.ts`). |
| 30 | TL | `body.length` comme mesure d'octets | **REJETÉ** | Compte des unités de code UTF-16. La garde IA mesure en `TextEncoder`. Le garde existant du PUT (`worker/index.ts:84`) **n'est pas corrigé ici** — hors périmètre, mais **pas recopié**. |
| 31 | TL | `seuil: number` sur une disjonction | **REJETÉ** | Un nombre admet 0 (vacuité) et 6 (insatisfiable). *(Sans objet depuis le retrait de R2 — conservé au registre pour l'it3, qui rouvrira la question.)* |
| 32 | TL | Un `champ` court sur le fil (`'fonction'`) | **REJETÉ** | Forcerait une seconde table chemin↔clé ; le fil porte le **chemin**, `CHAMPS_PROPOSABLES` est l'unique autorité sur la correspondance — **jamais de `.split('.').pop()`**. |
| 33 | TL | Factoriser `withTimeout` avec `CloudflareKVTransport.ts` | **REJETÉ** | On ne rouvre pas le chemin de synchronisation des données de l'auteur pour huit lignes de flot de contrôle. Commentaire obligatoire nommant le jumeau et la condition de promotion (3ᵉ appelant → `brain/utils/`). |
| 34 | TL | Corriger `ALLOWED_ORIGINS` / livrer un limiteur de débit | **REPORTÉ** | Hors périmètre. Condition d'ouverture écrite : **premier relevé de consommation anormale, ou première mise en ligne publique** — le correctif est une valeur dans `wrangler.toml`, pas une ligne de code. L'exposition est **nommée** au § 7. |
| 35 | Narratif | `caractere.cede_si`, `relations[].lien` au contexte | **REPORTÉ** → it3 | `ia` **sous condition de rôle** (« l'appel acteur du personnage qui le porte ») : assimiler le copilote de rédaction à ce rôle est une **décision d'audience**, elle se prend au lot contrat, jamais par défaut. `relations[].lien` arrive de plus **non ancré** (`cible_id` = `moteur`, `nom` = `auteur`). |
| 36 | Narratif | `plan_actions[].si_bloque`, `savoirs[].revele_comment` | **REJETÉ** | `ia` **sous condition d'état** constatée par le **moteur** : il n'y a pas de moteur en rédaction, le prédicat n'est **jamais** satisfiable. |
| 37 | Narratif | `savoirs[].indice_id` / `.certitude` | **REPORTÉ** → it2 | Ne sont `ia` que via la recomposition par **rang** ; l'it1 interdit les rangs. |
| 38 | Narratif | `contre_mesures[].action`, `monde.lieux[].*`, `objets[].description_joueur`, `quetes[].*`, `climat[].manifestation`, `indices[].verite`, `jalons[].enonce_texte` | **REPORTÉ** → it3 | Rejet de **périmètre** (hors de la fiche désignée) ou condition d'état ; rouvrables sans débat d'audience pour les premiers. |
| 39 | Narratif | Allow-list de sortie **hébergée dans le worker** | **REJETÉ** | Règle dupliquée entre code et prompt, qui dérive au premier champ ajouté — le worker n'est pas dans la porte de commit (KR-233) ; et KR-116 place la validation **là où la donnée entre dans le dossier**. |
| 40 | Narratif | Allow-list de sortie à **29 exclusions nommées** + 3 cardinalités | **REPORTÉ** → it2 | Conséquence directe de l'arbitrage n° 1 : sous le schéma `{valeur}`, **le modèle ne nomme plus aucun champ** — l'instrument n'a plus rien à discriminer. La moitié **positive** est conservée au critère 6 (`CHAMPS_PROPOSABLES` = 3, membre vérifié avant `update`). |
| 41 | Narratif | Une consigne « deuxième personne, présent » dans l'invite | **REJETÉ** | `description_joueur` est du **contexte injecté**, jamais émis verbatim : une prose en voix de scène deviendra fausse à la n° 10. **À écrire noir sur blanc dans le lot qui pose l'invite** (§ 4 bis). |
| 42 | UX | Glyphe coche pour « Accepté » · toast global de confirmation · `Badge accent` sur les Cards « Bientôt » · un `Lancer` désactivé identique sur les trois Cards | **REJETÉ** | Aucun glyphe neuf (`+` porte déjà le sens) ; un second canal de confirmation dupliquerait l'information et divergerait au premier refactor ; l'accent marque sélection/action primaire, jamais un statut de roadmap ; les Cards 2/3 n'ont **pas** de bouton du tout. |
| 43 | UX | Lien « Aller à Personnages » dans l'état vide du `Select` (0 personnage) | **REPORTÉ** | Ergonomiquement supérieur et la plomberie est maintenant prouvée bon marché, mais hors du texte minimal exigé par le cadrage. |
| 44 | UX | `Field.readOnly` | **REJETÉ** *(acquis au cadrage, rappelé ici)* | Prop `brain/` à un seul appelant (KR-109). Bloc statique local, jetons **délibérément différents** : ce n'est pas un doublon, c'est un autre objet visuel — « ceci n'est pas actif ». |
| 45 | QA | Adopter la regex du Narratif telle quelle | **REJETÉ — veto QA, levé par le § 4 ter** | **Mesuré** : elle matche `objet.favori` dans la prose bénigne. Le veto se lève parce que le plan écrit une forme qui passe les deux canaris, avec les canaris épinglés **littéralement** et **rejoués** avant signature. |
| 46 | QA | `feuillesDeLaFixture` importée depuis `couverture.test.ts` | **RETENU : promotion obligatoire** | **Mesuré** : importer le fichier de test exécute ses 39 `describe`/`it` dans la suite de l'importateur (40 tests au lieu de 1). `feuilles.ts` (N) + `couverture.test.ts` (R) **ne sont plus conditionnels**. |
| 47 | QA | Réutiliser le mock du rejeu pour le test de mémoire | **REJETÉ** | Deux fixtures **disjointes** obligatoires, sinon le second test rejoue le premier et ne mesure rien. |
| 48 | Narratif | « Deux clics ⇒ un seul appel » comme 9ᵉ critère | **RETENU, plié dans le critère 1** | La skill plafonne à 8 : un dépassement est un **signal de coupe**, pas une catégorie. La propriété descend d'un cran — une ligne contraignante du contrat de design + une assertion de plus, **et son mutant**. |
| 49 | PM | « 8 critères + 5 hors budget » | **REJETÉ — retiré par son auteur** | Treize critères déguisés en huit. Le regroupement de la QA est adopté. |
| 50 | TL | `tsconfig.json` modifié sans mesure préalable | **REJETÉ** | Conditionnel : s'il rougit pour un motif étranger, on n'y touche pas **et la revue écrit** que les tests du worker ne sont pas typés par la porte. |

## 9 — Innovation

*Aucune.* Le budget d'une proposition hors-cadre n'a pas été employé : les cinq rôles ont travaillé à l'intérieur du cadre, et les deux tours ont produit des retraits, pas des extensions.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] *(score de mutation : **sans objet** — aucun des quatre fichiers mutés `challenge`/`combat`/`xp`/`characteristics` n'est touché)*
- [ ] Les 7 mesures du § 5.1 **faites et rapportées**, jamais déduites
- [ ] Les **cinq mutants** nommés au § 7 écrits, et chacun vérifié **rouge**
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Suites de `dossier-fiches` et `dossier-canon` vertes **sans une seule retouche** (c'est la preuve que l'extraction des libellés est pure)
- [ ] Aucune régression sur les tests existants — **`lintIsolation.test.ts` vert sans retouche** (une retouche signale qu'un lot a franchi une frontière)
- [ ] **État dérivé (KR-013/113)** : `useDemandeCopilote.ts` et `PanneauCopilote.tsx` passés au balayage de l'auto-revue (`docs/WORKFLOW.md`, Build Steps, étape 5). La variante de `LigneProposition`, l'état désactivé de « Lancer » et le texte d'échec sont **calculés au rendu**, jamais miroités par un `useEffect`. `react-hooks/exhaustive-deps` reste à `'error'` ; `// eslint-disable-next-line` interdit
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-copilote-it1.revue.md`, **incluant mot pour mot** la liste « non vérifiable en l'état » du § 7

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | 8 critères exactement (§ 6) · REMPLACEMENT en it1 (§ 3.7) · amendement borné du critère n° 14 (§ 6) · R1 selon le Narratif (§ 4 bis) |
| Tech Lead | recevable sous réserve | registre de libellés dans le lot 1 (§ 5) · garde KR-236 sur `GABARIT_SORTIE` + cas négatif (§ 4 quinquies) · les deux plafonds mesurés dans le lot 1 après assertion de non-vacuité (§ 4 quater). **Veto d'encapsulation armé** : il se déclenche à la première recopie d'une des chaînes. |
| UX | recevable sous réserve | registre à 4 entrées (§ 3.7 / § 6) · les quatre textes sans `chemin` sur `trop-long` (§ 3.6) · REMPLACEMENT en it1 · « → Ouvrir la fiche » (§ 3.7) · « Lancer » `disabled` pendant l'appel (§ 3.5) · sélecteur CHAMP (§ 3.3) |
| QA | recevable sous réserve | scanner à canaris mesurés et rejoués (§ 4 ter) · `feuillesDeLaFixture` promue (§ 5) · discriminance durcie par motif (§ 6.3) · garde KR-236 écrite dans le lot, pas promise (§ 4 quinquies). **Veto sur la regex levé par le § 4 ter.** |
| Narratif & IA | recevable sous réserve | `CLES_SORTIE = ['valeur']`, une seule forme (§ 4 bis) · `PARTIES_REQUISES = ['canon.ton']`, une entrée (§ 4 bis) · une cible rédigée jamais écrasée sans montrer ce qu'elle remplace — **satisfait par REMPLACEMENT livré**, pas par la coupe. **Veto conditionnel du tour 1 désarmé** : le témoin KR-236 est au plan, dans la porte de commit. |
