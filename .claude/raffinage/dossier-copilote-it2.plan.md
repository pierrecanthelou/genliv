# Plan d'itération — `dossier-copilote` · itération `2`

> Statut : `validé` — le 2026-09-17, par l'humain, à la porte 2.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-17
> Composition : **5 rôles** — motif : l'itération touche le dossier d'aventure, l'invite du worker et un contrat de sortie IA.
> Exécution : **séquentielle** (2 lots) — aucun essaim, aucun worktree, aucune fusion.
> Tours : 2. Aucun veto ne tient. Les deux vetos posés (TL-7, TL-8) ne sont contestés par personne ; le veto conditionnel de `narratif-ia` a perdu sa condition.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut confier un indice mal servi à un personnage que le copilote lui désigne. » |
| **Tranche** | `Select` d'indices signalés (carte 2 du panneau Copilote) → `CopiloteService.demander('indice-detenteurs', …)` → assemblage de contexte sous garde d'audience + table des rangs → route worker `POST /ia/indice-detenteurs` → validation de forme côté client → liste de détenteurs acceptés ou refusés **un par un** → `DossierService.update` → `dossier:updated` |
| **Lots** | 2 lots séquentiels · dont `contrat` : **oui** (lot 1, seul et en premier) |
| **Hors périmètre** | `revele_comment`, les portes `revele_si`, `mene_a`, créer un indice, créer un personnage, éditer la certitude, toute mémoire des refus, toute UI pour `revelation-sans-porte`, `dossier-reference.json`, tout fichier de `dossier-canon` / `dossier-fiches` / `dossier-registres` |
| **Reporté** | `LIBELLES_CERTITUDE` vers `brain/` (condition d'ouverture écrite) · exclure les candidats refusés d'une relance · éditer la certitude avant acceptation · injecter `relations[].lien` |

---

## 1 — But raffiné

**À la fin de cette itération, l'auteur peut confier un indice mal servi à un personnage que le copilote lui désigne.**

Le copilote **part du constat du linter** (`indice-sans-source`, déjà livré par `dossier-controles` n° 7) et ne rebalaye jamais le dossier. Il **désigne par RANG** — un jeton de chaîne `P1…PN` que le code vient d'émettre et re-résout — parce que `monde.personnages[].nom` et `monde.indices[].nom` sont d'audience `auteur` et ne franchissent jamais le réseau. **Aucun entier, aucune prose, aucune certitude ne sort du modèle** : la sortie est un tableau de jetons, et c'est ce qui rend la phrase du `goal` littéralement vraie.

## 2 — Hors périmètre

*(Écrit par le PM, confirmé par les quatre autres rôles. Ce qui n'est pas ici sera codé par quelqu'un.)*

- `savoirs[].revele_comment` — ni injecté, ni affiché, ni écrit.
- Les quatre portes `revele_si` (`jet`, `confiance_min`, `contrepartie`, `apres_indice_id`) — **le copilote n'en écrit aucune.**
- `monde.indices[].mene_a[]` — ni lu, ni proposé.
- **Créer** un indice ou un personnage. Le copilote **désigne parmi l'existant**, il ne frappe aucun identifiant (c'est l'itération 4).
- **Éditer la `certitude`** d'un détenteur avant ou après acceptation depuis la carte 2 → `open_question` neuve.
- **Toute mémoire** d'un refus entre deux lancers → `REPORTÉ`.
- **Toute UI ou tout traitement actif** de l'avertissement `revelation-sans-porte` que l'acceptation allume : il reste visible via `dossier-controles`, déjà livré — **zéro code neuf pour lui**.
- Modifier `src/brain/dossier/__fixtures__/dossier-reference.json`.
- **Tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`.** L'exception du critère 14 de la spec était bornée à l'it1 et **non renouvelable**.
- `LigneProposition.tsx`, `App.tsx`, `tests/cablage.test.ts`, `index.ts` — intacts. Une retouche y est le signal qu'un lot a franchi une frontière.

## 3 — Contrat de design

> Écrit par l'UX, arbitré. **Tout texte visible est ici** ; un ouvrier ne doit inventer ni un mot ni une valeur. Les **noms** de constantes suivent le motif du contrat (arbitrage : c'est ce qui couple le texte au refus qu'il rend) ; les **libellés** sont ceux de l'UX.

### 3.1 Jetons — tous vérifiés existants dans `src/styles/tokens/{colors,spacing,typography}.css`

`--text-muted` · `--text-body` · `--text-label` · `--text-strong` · `--text-disabled` · `--text-on-accent` · `--surface-card` · `--surface-inset` · `--surface-sunken` · `--border-field` · `--border-card` · `--border-rule` · `--accent` · `--font-mono` · `--font-ui` · `--fs-eyebrow` · `--fs-body` · `--fs-title` · `--lh-body` · `--fw-semibold` · `--fw-regular` · `--track-eyebrow` · `--r-md` · `--hit-target` · `--space-1/3/4/8/10/12`.

**Aucun jeton neuf.** `Badge tone` reste le vocabulaire fermé `neutral | muted | accent | good | bad` ; `good`/`bad` sont hors de portée ici.

### 3.2 Carte 2 « Tisser les indices » — anatomie, dans l'ordre visuel et l'ordre de tabulation

`CarteAssistant` (coquille : `<Card>` + `<section aria-label={titre}>` + eyebrow `EYEBROW_ASSISTANT` + titre) — **plus de `Badge` « Bientôt »**, la carte quitte l'état futur.

1. `<p>{CARD2_CORPS_ACTIF}</p>` — `corpsStyle`, `--text-body`.
2. `<p>{MENTION_SAVOIR_CREE}</p>` — même style, `--text-muted`. Permanent, **avant** le geste.
3. `Select` **INDICE** — `label={LABEL_INDICE}`. Options construites depuis `controlerDossier(dossier).controles.filter(c => c.id === 'indice-sans-source')` → `{ value: c.entityId, label: c.location }`. **Jamais depuis `dossier.monde.indices`.** Liste vide → option unique désactivée `OPTION_AUCUN_INDICE_SIGNALE`. Valeur par défaut = premier constat.
4. Ligne de contexte, sous le `Select` : `<Badge tone={pastilleNiveau(constat.niveau).tone}>{pastilleNiveau(constat.niveau).texte}</Badge>` + `<p>{constat.message}</p>` (`--text-muted`, `refusSyncStyle`). **Le message du linter, verbatim — jamais reformulé par cette feature.**
5. `BarreLancer` (partagée avec la carte 1). Désactivation, **dans cet ordre de priorité** : (a) `!estDisponible()` → `TITRE_COPILOTE_NON_CONFIGURE` ; (b) aucun personnage → `TITRE_AUCUN_PERSONNAGE` *(réutilisée)* ; (c) aucun constat → `TITRE_AUCUN_INDICE_SIGNALE` ; (d) appel en vol. En vol : région `role="status"`, `TEXTE_CHARGEMENT`, bouton `LABEL_ANNULER`, `Échap` = Annuler, focus impératif sur Annuler à l'entrée et sur Lancer à la sortie *(§ 3.5 de l'it1, inchangé, désormais écrit une seule fois)*.
6. `<p>{MENTION_RELANCE_SANS_MEMOIRE}</p>` — permanent, `--text-muted`, sous la barre.
7. **Refus synchrone** (avant tout appel) : préfixe `⊘` + `refusSyncStyle`, `--text-muted`. Dispatch par motif : `'a-ecrire'` → `texteRefusAEcrire(libelle)` *(réutilisée, vaut toujours « TON »)* · `'cible-a-ecrire'` → `TEXTE_REFUS_CIBLE_A_ECRIRE` · `'aucun-candidat'` → `TEXTE_REFUS_AUCUN_CANDIDAT` · `'trop-long'` → `TEXTE_REFUS_TROP_LONG_DETENTEURS`. Échecs d'appel : `indisponible` → `TEXTE_INDISPONIBLE` *(réutilisée)* · `illisible` → `TEXTE_ILLISIBLE` *(réutilisée)*.
8. **Résultat** : liste vide → `<p>{TEXTE_AUCUN_DETENTEUR_TROUVE}</p>`, `--text-muted`, **sans `⊘`** (l'appel a réussi ; le `⊘` est réservé aux refus synchrones). Liste non vide → N `LigneDetenteur` dans l'ordre rendu, séparées par un filet `1px solid var(--border-rule)`.

### 3.3 Textes exacts — `src/features/dossier-copilote/textes.ts`

```ts
export const CARD2_CORPS_ACTIF =
	"Propose qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources."
export const LABEL_INDICE = 'INDICE'
export const OPTION_AUCUN_INDICE_SIGNALE = 'Aucun indice signalé'
export const TITRE_AUCUN_INDICE_SIGNALE =
	'Ce dossier ne signale aucun indice manquant de détenteur ou de source.'
export const TITRE_COPILOTE_NON_CONFIGURE =
	'Configurez la synchronisation Cloudflare (pastille en bas à droite) pour utiliser cet assistant.'
export const MENTION_SAVOIR_CREE =
	"Un détenteur accepté est enregistré comme sachant l'indice, sans condition de révélation posée — à ajuster ensuite dans sa fiche (Personnages → Savoirs)."
export const MENTION_RELANCE_SANS_MEMOIRE =
	'Chaque lancer repart de zéro — un détenteur refusé peut revenir, un détenteur accepté jamais.'
export const TEXTE_REFUS_CIBLE_A_ECRIRE =
	"Cet indice n'a pas encore de vérité écrite — complétez d'abord sa fiche, dans Indices."
export const TEXTE_REFUS_AUCUN_CANDIDAT =
	"Tous les personnages de ce dossier connaissent déjà cet indice — personne d'autre à désigner."
export const TEXTE_REFUS_TROP_LONG_DETENTEURS =
	"Le contexte est trop long pour désigner des détenteurs — ce dossier a trop de personnages, ou leurs fiches sont trop longues. Raccourcissez-les, dans Personnages."
export const TEXTE_AUCUN_DETENTEUR_TROUVE =
	"Le copilote n'a trouvé personne d'autre pour cet indice."
```

`CARD2_BADGE` est **supprimée**. `CARD3_BADGE` reste (« Bientôt — itération 4 »).

**Trois contraintes normatives sur ces textes :**
- `TEXTE_REFUS_CIBLE_A_ECRIRE` **nomme le champ en prose française minuscule** (« vérité »), jamais par l'atome `label="VÉRITÉ"`. Ce n'est pas un second domicile d'un libellé d'écran, et le balayage de `libelles.test.ts:137` porte sur la **forme `label="…"`**, pas sur le mot. **Le registre reste à quatre entrées.**
- `TEXTE_REFUS_TROP_LONG` de l'it1 est **spécifique au rôle prose** (« la fiche de ce personnage »). La carte 2 ne le réutilise **pas** : elle afficherait une consigne fausse. La discrimination se fait **au composant**, sans toucher `brain/`.
- `MENTION_SAVOIR_CREE` est une **fusion arbitrée** de deux mentions proposées séparément (le voyant `revelation-sans-porte` et le fait que la certitude vaut toujours « sait »). Elles décrivent le même objet — ce que devient un détenteur accepté — et trois phrases grises sur une carte en valent une. À respecter littéralement.

### 3.4 `LigneDetenteur` — sœur de `LigneProposition`, jamais une variante

```ts
export interface LigneDetenteurProps {
	/** `localiserEntite('pnj', personnage, index)` — calculée par la CARTE, jamais
	 *  recomposée ici (encapsulation : la désignation appartient à celui qui la
	 *  définit). */
	designation: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}
```

- **Aucune prop `certitude`, aucun badge de certitude.** Elle vaut toujours `CERTITUDE_INITIALE` : un badge constant afficherait une donnée que personne n'a choisie.
- Non décidée : `<span>{designation}</span>` (`--font-ui`, `--fs-body`, `--text-body`) + paire `IconButton` `+`/`×` (`tone="accent"` / `"danger"`, libellés **réutilisés** `LABEL_ACCEPTER` / `LABEL_REJETER`).
- Décidée : `Badge tone={acceptee ? 'accent' : 'muted'}` (`BADGE_ACCEPTE` / `BADGE_REJETE`, **réutilisés**) + sur acceptée seulement `LIEN_OUVRIR_FICHE` **réutilisé** → `onOuvrirFiche` → `onSelectSection('personnages')`.
- Ses styles vivent dans `components/styles.ts` (fichier du lot 2) et **emploient les mêmes jetons** que `LigneProposition` : `--text-body` pour le lien, `--hit-target` pour les boutons. `LigneProposition.tsx` **n'est pas rouvert** (§ 8, TL-18).

### 3.5 Clavier — ergonomie de rédaction

- Tab suit l'ordre visuel du § 3.2 ; dans la liste, chaque ligne expose `+` puis `×` avant le lien de la ligne suivante.
- Entrée sur un bouton actif = clic (natif, aucune gestion propre).
- `Échap` pendant `en-cours` = Annuler, porté par `BarreLancer`.
- **Règle neuve, propre à la liste** : après Accepter ou Rejeter, la ligne démonte son `IconButton` et le focus tomberait sur `document.body`. Le focus (`useRef`, geste **impératif**, jamais un effet miroir — KR-013/113) se pose sur le `+` de la **prochaine ligne non décidée** ; s'il n'en reste aucune, il revient à « Lancer ».

### 3.6 Le gel — généralisation de `valeurAvantGelee`

Le constat sélectionné (`entityId`, `location`, `message`, `niveau`) **et** la liste rendue sont **gelés au clic « Lancer »**, jamais re-dérivés au rendu. Motif : accepter le premier détenteur écrit dans le dossier → `useOpenDossier` se réveille → `controlerDossier` recalcule → **l'indice peut quitter la liste des signalés au milieu de l'acceptation**. Sans cette ligne, un ouvrier livre une carte qui s'efface pendant qu'on l'utilise.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService.demander` | service | fournit | **surchargée sur le littéral de rôle** (§ 4.4) |
| `CibleIndice` | type | fournit | `{ indiceId: string }` |
| `ReponseDetenteurs`, `EchecCopilote` | type | fournit | § 4.4 |
| `PropositionDetenteurs` | type | fournit | `{ indiceId: string; personnageIds: readonly string[] }` |
| `RoleCopilote` | type | fournit | `'personnage-prose' \| 'indice-detenteurs'` |
| `controlerDossier`, `Controle`, `pastilleNiveau`, `localiserEntite` | service / registre | consomme | inchangés, **non modifiés** |
| `DossierService.update(id, recette)` | service | consomme | inchangée — seul chemin d'écriture |
| `CERTITUDE_INITIALE` | registre | consomme | inchangé — **une seule autorité, la même que l'éditeur manuel** |
| `dossier:updated` | événement | émet | `{ dossierId }` |

### 4.1 `src/brain/copilote/types.ts` (R)

```ts
/** DEUX rôles. Le nom se lit ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ — « la prose d'un
 *  personnage », « les détenteurs d'un indice ». C'est AUSSI le segment de route
 *  (`/ia/indice-detenteurs`) et la clé des tables d'invites et de gabarits. */
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs'

// ── INCHANGÉS : ChampProseCle, CHAMPS_PROPOSABLES, ChampProseChemin,
//    PropositionRendue, PropositionResolue. Aucune de ces lignes ne bouge.

/** ALIAS DE LISIBILITÉ, et RIEN DE PLUS : `string` ne garantit rien. La SEULE
 *  garantie d'un rang est son APPARTENANCE à `ContexteDetenteurs.rangs`, constatée
 *  par `validerDetenteurs`. Forme du jeton : `P1`, `P2`, … `PN` — et le préfixe `P`
 *  n'est pas décoratif : un `"1"` inviterait le modèle à émettre le NOMBRE `1`,
 *  autre type JSON, donc un refus `'schema'` évitable.
 *  AUCUNE conversion numérique nulle part — ni `Number`, ni `parseInt`, ni
 *  indexation arithmétique : c'est ce qui supprime la classe entière des décalages
 *  base-0 / base-1. La re-résolution est un `Map.get`. */
export type RangInjecte = string

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, un tableau de JETONS.
 *  Aucun identifiant, aucune prose, aucune certitude (KR-231).
 *  NON ré-exporté par `brain/index.ts`. */
export interface DetenteursRendus {
	detenteurs: readonly RangInjecte[]
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `DetenteursRendus` : on ne peut pas passer l'une pour l'autre par mégarde.
 *  La CERTITUDE n'est pas ici — le code écrit `CERTITUDE_INITIALE`, exactement
 *  comme l'éditeur quand l'auteur crée un savoir à la main. */
export interface PropositionDetenteurs {
	indiceId: string
	personnageIds: readonly string[]
}
```

### 4.2 `src/brain/copilote/contexte.ts` (R)

```ts
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': [ /* les 12 chemins de l'it1, INCHANGÉS */ ],
	'indice-detenteurs': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'monde.indices[].verite',
		'monde.indices[].formulation_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].plan_actions[].action',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
	],
}

/** La soupape. VIDE, et un test l'asserte vide. Injecter `verite` n'est PAS une
 *  dérogation d'audience — le champ est DÉJÀ `ia` — c'est la levée d'une CONDITION
 *  TEMPORELLE, ré-écrite à ses deux sites par ce lot. Ne pas confondre les deux :
 *  le confondre ferait croire que la soupape assertée vide de l'it1 a bougé. */
export const DEROGATIONS_AUDIENCE: readonly string[] = []

export const PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]> = {
	'personnage-prose': ['canon.ton'],
	'indice-detenteurs': ['canon.ton'],
}

/** LA VARIABLE LIBRE de la borne de contexte. Si la mesure de `M` déplaît,
 *  ON BAISSE K — on ne monte JAMAIS le budget. */
export const CANDIDATS_MAX = 8

/** PAR RÔLE, et c'est le point dur de l'itération : un scalaire partagé ferait
 *  desserrer la garde du rôle étroit par la mesure du rôle large, sans un seul test
 *  rouge (KR-235). Chaque entrée est RE-DÉRIVÉE par `ceil(M_rôle × 3 / 1000) × 1000`
 *  sur une mesure de CE rôle-là. Ce n'est PAS un cliquet. */
export const BUDGET_CARACTERES_CONTEXTE: Record<RoleCopilote, number> = {
	'personnage-prose': 6000, // MESURÉ 2026-09-17 (M = 1783), INCHANGÉ, NON re-mesuré
	'indice-detenteurs': 0,   // ⚠ À MESURER AU LOT 1, K SATURÉ. Ne JAMAIS livrer un 0.
}

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	/** JAMAIS de charge : « trop long » pointe la fiche, pas un champ. */
	| { motif: 'trop-long' }
	/** NEUF — l'entité CIBLE n'a pas le contenu sans lequel la demande n'a pas de
	 *  sens (la `verite` de l'indice). AUCUNE charge, et c'est délibéré : le champ
	 *  n'a pas d'entrée dans `LIBELLE_DES_CHAMPS` et n'en aura pas (§ 8, TL-8) — le
	 *  texte d'écran le nomme EN PROSE, côté feature. */
	| { motif: 'cible-a-ecrire' }
	/** NEUF — aucun candidat numérotable : tous les personnages détiennent déjà cet
	 *  indice, ou il n'y en a aucun. Refus AVANT tout `fetch` : il n'y a rien à
	 *  demander. Aucune charge, comme `trop-long`. */
	| { motif: 'aucun-candidat' }

export type ContexteProse =
	| { ok: true; texte: string; entitesInjectees: readonly string[] }
	| ({ ok: false } & MotifRefusContexte)

export type ContexteDetenteurs =
	| {
			ok: true
			texte: string
			/** TOUTES les entités injectées — l'audit de confinement. Contient l'indice
			 *  CIBLE, qui n'a PAS de rang. UNE traversée, DEUX projections : chaque
			 *  candidat retenu pousse son identifiant ici ET son rang dans `rangs` dans
			 *  la MÊME itération de boucle — ce ne sont pas deux listes à tenir en
			 *  phase, c'est un sous-produit (KR-117).
			 *  INVARIANT ASSERTÉ PAR ÉGALITÉ, jamais par inclusion :
			 *  `entitesInjectees === [cible.indiceId, ...rangs.values()]`, ordre compris.
			 *  Un `⊆` resterait vert sur une entité injectée qu'on aurait oublié
			 *  d'auditer — c'est précisément le trou que cet audit existe pour fermer. */
			entitesInjectees: readonly string[]
			/** LES SEULES entités DÉSIGNABLES, jeton → identifiant. Le numéro écrit dans
			 *  `texte` et la clé de cette table sortent de la MÊME variable.
			 *  NE SORT JAMAIS de `brain/copilote/` — KR-231 tenu par la PORTÉE, pas par
			 *  une convention. */
			rangs: ReadonlyMap<RangInjecte, string>
	  }
	| ({ ok: false } & MotifRefusContexte)

/** INCHANGÉ dans son comportement : les SIX règles de l'it1 restent prouvées sur
 *  cette fonction-ci, et sur elle seule. */
export function assemblerProse(dossier: Dossier, cible: CibleCopilote): ContexteProse

/**
 * L'ASSEMBLEUR DU SECOND RÔLE. AUCUNE branche `if (role === …)` ici ni dans
 * `assemblerProse` : les deux fonctions partagent les PRIMITIVES (`textesDuChemin`,
 * `estRedige`, la composition d'un bloc, la garde de budget), jamais un corps commun
 * paramétré — elles diffèrent sur CINQ points (racine des chemins, blocs numérotés,
 * troncature à K, champ cible exclu côté prose, champ cible requis côté détenteurs),
 * et une table de portées n'en couvrirait que deux (§ 8, TL-4).
 *
 * SÉLECTION DES CANDIDATS — déterministe, sans modèle :
 *  1. exclure tout personnage dont un `savoirs[].indice_id` vaut `cible.indiceId` ;
 *  2. ordre : `portee === 'premier'` d'abord, puis l'ordre du document. `portee` est
 *     d'audience `moteur` : elle SÉLECTIONNE, elle n'est JAMAIS injectée ;
 *  3. tronquer à `CANDIDATS_MAX` ;
 *  4. un candidat dont les QUATRE chemins de personnage sont vides ou marqués n'est
 *     PAS injecté et ne consomme PAS de rang — un bloc de rang sans une seule ligne
 *     enseignerait « ce personnage n'a rien », ce qui est une AFFIRMATION ; le repli
 *     est le SILENCE (même doctrine que le filtre `MARQUEUR_A_ECRIRE` de l'it1) ;
 *  5. numéroter les survivants `P1`, `P2`, … dans cet ordre.
 *
 * TRONCATURE DE LISTE, JAMAIS DE CHAÎNE : `plan_actions[].action` est réduit à son
 * PREMIER élément ; aucune chaîne n'est jamais coupée. Dépassement de budget ⇒
 * REFUS, jamais coupure (KR-230 : en rédaction, le dégradé EST le refus).
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — la `verite` de l'indice cible manque, est vide ou marquée
 *   3. `aucun-candidat` — table des rangs vide
 *   4. `trop-long`      — `texte.length > BUDGET_CARACTERES_CONTEXTE[rôle]`
 */
export function assemblerDetenteurs(dossier: Dossier, cible: CibleIndice): ContexteDetenteurs
```

**Forme littérale du texte assemblé** *(prolongement de l'it1 — le chemin de feuille comme en-tête ; le RANG est la première ligne du bloc d'un candidat ; blocs joints par `'\n\n'` ; déterministe : ni date, ni identifiant, ni aléa, ni nom)* :

```
canon.ton
⟨…⟩

canon.interdits_ton[]
⟨…⟩
⟨…⟩

monde.indices[].verite
⟨…⟩

monde.indices[].formulation_joueur
⟨…⟩

P1
monde.personnages[].fonction
⟨…⟩
monde.personnages[].plan_actions[].action
⟨première étape⟩

P2
monde.personnages[].plan_actions[].action
⟨première étape⟩
monde.personnages[].but.libelle
⟨…⟩
```

### 4.3 `src/brain/copilote/schemaSortie.ts` (R)

```ts
export const CLES_SORTIE = ['valeur'] as const                  // INCHANGÉ
export const CLES_SORTIE_DETENTEURS = ['detenteurs'] as const
export const PROPOSITIONS_MAX = 3

/** LE GABARIT, APPARIÉ AU RÔLE — et c'est la moitié de la garde KR-236. Avec deux
 *  constantes séparées, l'appariement rôle → gabarit n'existerait QUE dans le test,
 *  qui en deviendrait un TROISIÈME porteur ; un `Record<RoleCopilote, string>` le
 *  rend TOTAL À LA COMPILATION — un rôle ajouté sans gabarit ne compile pas.
 *  DUPLIQUÉ dans `worker/index.ts` — aucun import `worker/` → `src/brain/`, qui
 *  traînerait du code client dans le paquet wrangler : la liaison est un BALAYAGE
 *  DE SOURCE (`worker/frontiere.test.ts`).
 *  ⚠ FORME D'ÉCRITURE IMPOSÉE, identique des DEUX côtés : une entrée par ligne, une
 *  tabulation d'indentation, guillemets simples, virgule finale — c'est ce que
 *  l'expression ancrée du test extrait. */
export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

export type MotifIllisible = 'schema' | 'vide' | 'marqueur' | 'identifiant' | 'rang-inconnu'

/** INCHANGÉ — six prédicats, `dossier` pour le scanner d'appartenance. */
export function validerSortie(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & PropositionRendue) | { ok: false; motif: MotifIllisible }

/**
 * LES PRÉDICATS DE FORME de la sortie `indice-detenteurs`. `rangsConnus` vient de
 * `ContexteDetenteurs.rangs` : le validateur ne CALCULE aucun rang, il constate une
 * APPARTENANCE.
 *
 * Le type de retour dit littéralement ce qui est atteignable. `'vide'`, `'marqueur'`
 * et `'identifiant'` sont SANS OBJET ici et ne sont PAS « rejoués par symétrie » :
 * aucune prose n'est rendue par ce rôle, et un jeton qui passe l'appartenance est
 * l'une de NOS PROPRES chaînes — `porteUnIdentifiant` n'a aucune cible et n'entre
 * pas dans cette fonction. Les écrire serait du code mort présenté comme de la
 * couverture (famille BUG-084, KR-235). Le scanner reste INTACT sur `validerSortie`.
 *
 * Les prédicats, dans l'ordre, chacun prouvé seul :
 *   (1) objet simple (ni tableau, ni null) ..................... 'schema'
 *   (2) clés = EXACTEMENT `CLES_SORTIE_DETENTEURS` ............. 'schema'
 *   (3) `Array.isArray(brut.detenteurs)` ....................... 'schema'
 *   (4) chaque élément est une CHAÎNE .......................... 'schema'
 *   (5) longueur ≤ `PROPOSITIONS_MAX` — une liste de 6 est un
 *       REFUS, jamais une troncature ........................... 'schema'
 *   (6) éléments DISTINCTS (deux savoirs identiques sinon) ..... 'schema'
 *   (7) chaque élément ∈ `rangsConnus` .................. 'rang-inconnu'
 *
 * LA LISTE VIDE EST UN SUCCÈS. Le prédicat de non-vacuité de l'it1 NE SE TRANSPORTE
 * PAS : il portait sur une prose SCALAIRE, où le vide est une non-réponse ; sur une
 * LISTE, le vide EST une réponse. Punir la réponse honnête est une machine à
 * complaisance — un modèle qui ne peut pas dire « personne » nommera quelqu'un.
 *
 * Hors bornes, malformé, doublon, `2.5`, `-1`, `"toto"` : le LOT ENTIER est refusé,
 * donc rejeu une fois puis état terminal. Accepter les rangs valides et jeter les
 * autres serait une réparation silencieuse — l'auteur ratifierait une liste tronquée
 * sans savoir qu'elle l'est (§ 8, TL-6).
 */
export function validerDetenteurs(
	brut: unknown,
	rangsConnus: ReadonlySet<RangInjecte>,
): ({ ok: true } & DetenteursRendus) | { ok: false; motif: 'schema' | 'rang-inconnu' }
```

### 4.4 `src/brain/CopiloteService.ts` (R)

```ts
/** INCHANGÉ, et délibérément NON RENOMMÉ : c'est la cible du rôle PROSE. Le
 *  renommage en `CibleProse` est une dette NOMMÉE, à payer par la première itération
 *  qui touche à la fois le hook et ce fichier. */
export interface CibleCopilote { entiteId: string; champ: ChampProseChemin }

/** Pas de `champ` ici, et ce n'est pas un oubli : on ne demande pas un champ, on
 *  demande QUI. Un `champ?` optionnel sur une cible commune rendrait représentable
 *  « une demande de prose sans champ » (§ 8, TL-1). */
export interface CibleIndice { indiceId: string }

/** LES TROIS BRANCHES D'ÉCHEC, extraites : rigoureusement les mêmes pour tous les
 *  rôles, et elles doivent le rester. Ré-exportée — l'état d'écran des deux cartes
 *  la porte. */
export type EchecCopilote =
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	| { statut: 'illisible'; motif: MotifIllisible }

/** DEUX unions nommées, jamais un générique à défaut : `ReponseCopilote` garde son
 *  nom ET son sens (rôle prose), et aucun appelant existant ne bouge (§ 8, TL-16). */
export type ReponseCopilote = { statut: 'propose'; proposition: PropositionResolue } | EchecCopilote
export type ReponseDetenteurs = { statut: 'propose'; proposition: PropositionDetenteurs } | EchecCopilote

/**
 * SURCHARGE SUR LE LITTÉRAL DE RÔLE — le point de contrat le plus chargé de
 * l'itération. Trois raisons, dans l'ordre :
 *
 *  1. `demander('indice-detenteurs', d, { entiteId, champ })` est une ERREUR DE
 *     COMPILATION : le couple (rôle, cible) cesse d'être un état représentable.
 *  2. Le type de retour reste EXACT par branche : la carte 1 ne rétrécit jamais au
 *     runtime une proposition dont elle connaît la forme à la compilation.
 *  3. Elle N'AJOUTE AUCUN MEMBRE à l'interface. MESURÉ : les trois suites de la
 *     feature bouchonnent par `brain.copilote = { estDisponible, demander }`
 *     (`panneauCopilote.test.tsx:55`, `acceptation.test.tsx:54`,
 *     `useDemandeCopilote.test.tsx:37`) avec `demander` annoté `jest.Mock` NU
 *     (= `Mock<any, any>`). Un MEMBRE de plus rend ces trois littéraux incomplets et
 *     le lot contrat ne passe plus `tsc` SEUL ; une SURCHARGE passe.
 *
 * ⚠ Un appelant qui détient `role: RoleCopilote` (union, non littéral) ne satisfait
 * AUCUNE surcharge. C'est voulu : chaque carte connaît son rôle statiquement.
 *
 * IMPLÉMENTATION SANS `as` : dans le corps de `createCopiloteService`, déclarer
 * `demander` en FONCTION à surcharges (les deux signatures publiques + une
 * implémentation élargie), puis `return { estDisponible, demander }`.
 */
export interface CopiloteService {
	estDisponible(): boolean
	demander(role: 'personnage-prose', dossier: Dossier, cible: CibleCopilote, signal?: AbortSignal): Promise<ReponseCopilote>
	demander(role: 'indice-detenteurs', dossier: Dossier, cible: CibleIndice, signal?: AbortSignal): Promise<ReponseDetenteurs>
}

/** PRIVÉ. CE QUI PART SUR LE FIL — ni date, ni identifiant, ni nonce. Union et non
 *  `champ?` : le rôle détenteurs n'a pas de champ. */
type CorpsDemande =
	| { role: 'personnage-prose'; champ: ChampProseChemin; contexte: string }
	| { role: 'indice-detenteurs'; contexte: string }
```

`unAller` est **inchangé**. La boucle « rejeu exactement une fois puis état terminal » est extraite en **une** fonction privée paramétrée par `(corps, valider)` — deux appelants, même fichier, invisible au contrat. **Ordre des effets inchangé** : refus de contexte → configuration → `fetch` → validation → rejeu unique → terminal.

### 4.5 `worker/index.ts` (R)

```ts
/** ⚠ MÊME FORME D'ÉCRITURE que `src/brain/copilote/schemaSortie.ts` — une entrée par
 *  ligne, une tabulation — c'est ce que l'expression ancrée de `frontiere.test.ts`
 *  extrait des DEUX côtés. */
const GABARIT_SORTIE: Record<string, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

export const INVITES: Record<string, { systeme: string; max_tokens: number }> = {
	'personnage-prose': { /* INCHANGÉ, sauf `${GABARIT_SORTIE['personnage-prose']}` */ },
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

/** RE-DÉRIVÉ AU LOT 1 : `max` sur les rôles de `ceil((3 × budget[rôle] + E[rôle]) / 1024) × 1024`.
 *  UN SEUL plafond, calé sur le pire rôle : la garde worker protège le BUDGET MODÈLE,
 *  c'est le budget CLIENT — lui, par rôle — qui refuse en amont. Doctrine non rouverte. */
export const TAILLE_MAX_CORPS_IA = /* ⚠ À MESURER AU LOT 1 */ 0
```

La route `^\/ia\/([a-z-]+)$` accepte `indice-detenteurs` **sans modification** ; `max_tokens` est déjà lu de `invite.max_tokens` (l. 280). **`open_questions` n° 4 est CLOSE** : *Anthropic Messages, version épinglée `2023-06-01`, ratifié comme décision de comité.* Les deux passages de `worker/index.ts` qui écrivent « C'EST LE CHOIX DE L'OUVRIER, PAS UNE DÉCISION DU COMITÉ » sont **ré-écrits dans ce lot**. Le second rôle **n'étend pas le couplage** : `premierTexte` et le bloc de requête de `handleIa` restent les deux seuls sites ; `INVITES['indice-detenteurs']` n'apporte que `{systeme, max_tokens}` ; ni `tool_use`, ni `response_format`.

### 4.6 `worker/frontiere.test.ts` (R) — ce qu'il doit devenir

> **Il ne peut pas rester en l'état** : MESURÉ, il importe `BUDGET_CARACTERES_CONTEXTE` en **scalaire** (l. 31) et l'emploie l. 269/275/281 — le passage au `Record` fait échouer `tsc` sur ce fichier.

1. **Extraction ancrée sur l'ENTRÉE**, plus sur la déclaration — **une seule** expression, employée des deux côtés, rendant un `Map<role, gabarit>` :
   `const ENTREE_GABARIT = /^\t'([a-z-]+)': '(.+)',$/gm`
   Le test ne contient **aucun** des littéraux : il les extrait. Cardinalité **dans** le prédicat — deux tables vides sont trivialement égales.
2. **Totalité** : clés extraites côté brain = clés extraites côté worker = `Object.keys(INVITES)`. Un rôle sans gabarit, ou un gabarit sans invite, rougit.
3. **Appariement** : pour chaque rôle, `INVITES[rôle].systeme` contient le gabarit **de ce rôle**.
4. **Canari CROISÉ, obligatoire** : intervertir les deux gabarits **en mémoire** et rejouer le prédicat nominal doit rendre `false`. Un canari qui retire un gabarit ne distingue pas « absent » de « mal apparié » — et le mal-apparié est le seul défaut **neuf** qu'une table à deux entrées rende possible. **À écrire et à faire rougir, pas à supposer.**
5. **Témoin exécutable rejoué pour le second rôle** : sortie conforme construite depuis le gabarit extrait, `demander('indice-detenteurs', …)`, résultat `propose` avec des `personnageIds` re-résolus.
6. **Les deux plafonds** : `const ROLE = …` disparaît au profit de `describe.each(Object.keys(INVITES))`, enveloppe **paramétrée par le rôle**. Les deux canaris séparateurs (−1 Ko sur le plafond, +400 sur le budget) portent sur le rôle **le plus large**, `Math.max` sur `BUDGET_CARACTERES_CONTEXTE` — **dérivé, jamais écrit**. Sur le rôle étroit ils resteraient verts en ne discriminant rien.

### 4.7 `src/brain/dossier/types.ts` + `destinations.ts` + `couverture.test.ts` (R)

Paragraphe à écrire **à l'identique** au JSDoc de `Indice.verite` (`types.ts`, après « …la charge de l'assembleur n° 10. ») **et** dans le commentaire de `'monde.indices[].verite'` (`destinations.ts`, après « …écrite ici et au JSDoc du champ. ») — la seule différence autorisée est le préfixe de commentaire (` * ` contre `// `), que `sansPrefixe` efface :

> CONDITION D'ÉTAT — **en JEU** : le champ n'entre dans le contexte qu'après constat du moteur (carnet d'indices, n° 12). **En RÉDACTION** il n'existe aucune session : la condition n'a pas de sujet, elle ne devient pas « fausse ». Le champ entre alors **si et seulement si** (a) un rôle le nomme **explicitement** dans `CHAMPS_INJECTES`, et (b) le schéma de sortie de ce rôle **ne peut porter aucune prose** — sans quoi la vérité ressortirait paraphrasée dans le dossier, par le seul canal que l'itération 1 a nommé non couvert. Ce n'est **jamais** une dérogation d'audience : `verite` est `ia` aux deux temps.

**Instrument obligatoire, MÊME LOT** — quatrième instance du patron existant de `couverture.test.ts` (MESURÉ : il y est **trois** fois, `cede_si` l. 1309, `secret` l. 1350, `manifestation` l. 1388, et **aucune** pour `verite`). Le paragraphe est **LU** du JSDoc, aplati, puis **cherché** dans `destinations.ts` ; **jamais écrit en littéral dans le test** — ce serait un troisième porteur. Clauses discriminantes assertées pour que la comparaison ne vaille pas sur une phrase tronquée : `'**En JEU**'`, `'**En RÉDACTION**'`, `'aucune prose'`, `"dérogation d'audience"`.

**Pouvoir séparateur à MESURER avant signature** : modifier **un mot** d'un seul des deux exemplaires doit faire rougir.

**Non-régression, MESURÉE** : `DESTINATION_DES_CHAMPS['monde.indices[].verite']` reste `'ia'` — la ré-écriture ne touche que du commentaire, donc zéro effet `tsc`, zéro effet runtime, et l'épinglage d'audience de `couverture.test.ts` reste vert.

### 4.8 `src/features/dossier-copilote/hooks/useDemandeCopilote.ts` (R) — lot 2

```ts
/** QUATRE phases. La machine d'APPEL, et rien d'autre : la phase `'decide'` SORT
 *  (§ 8, TL-13) — avec une décision PAR LIGNE elle est inexprimable, et elle
 *  doublait `decisionAffichee`, déjà porté par la carte. `accepter()`/`refuser()`
 *  disparaissent avec elle. MESURÉ : aucun test de la feature n'assert `'decide'`
 *  (grep sur `tests/`, zéro occurrence) — la sortir ne casse aucun témoin.
 *  La branche d'échec porte `EchecCopilote` et non la réponse entière : `'propose'`
 *  cesse d'être un statut représentable sur un échec. */
export type EtatDemande<P> =
	| { phase: 'repos' }
	| { phase: 'en-cours' }
	| { phase: 'proposition'; proposition: P }
	| { phase: 'echec'; echec: EchecCopilote }

export interface UseDemandeCopiloteResult<C, P> {
	etat: EtatDemande<P>
	/** Ne fait RIEN si un appel est déjà en vol — le garde est `enVolRef`, PAS le
	 *  `disabled` du bouton : deux clics synchrones passent avant le re-rendu. */
	lancer: (cible: C) => void
	annuler: () => void
}

/**
 * `demander` est LU AU MOMENT DE L'APPEL, jamais stocké dans un ref ni capturé par
 * un effet (KR-004). `dossier` n'est plus un paramètre du hook — le panneau garde
 * l'unique abonnement et ne rend ses cartes que sur un dossier non nul.
 *
 * INCHANGÉS, et à NE PAS réécrire : l'abandon au démontage, la garde
 * `controleur.signal.aborted` sur la résolution tardive, la branche `.catch` (une
 * promesse rompue est une indisponibilité), et surtout le `.finally` qui ne rouvre
 * le garde QUE si `controleurRef.current === controleur` — séquence
 * Lancer(A) → Annuler → Lancer(B), elle a son test dédié.
 */
export function useDemandeCopilote<C, P>(
	demander: (cible: C, signal: AbortSignal) => Promise<{ statut: 'propose'; proposition: P } | EchecCopilote>,
): UseDemandeCopiloteResult<C, P>
```

### 4.9 Composants du lot 2

```ts
/** Coquille : `useOpenDossier`, garde de nullité, `estDisponible` calculé EN LIGNE
 *  au rendu (jamais un `useState`/`useEffect`, KR-013/113), les trois cartes dans
 *  l'ordre, passage d'`onSelectSection`. AUCUNE logique d'assistant. ≤ 120 lignes. */
export interface PanneauCopiloteProps { dossierId: string; onSelectSection: (s: SectionId) => void }

/** `<Card>` + `<section aria-label={titre}>` + eyebrow + titre + `Badge` optionnel +
 *  `children`. Absorbe `Entete` ET `CardBientot`.
 *  Le `aria-label` est un POINT D'ANCRAGE EXPOSÉ DÉLIBÉRÉMENT — c'est lui que les
 *  tests cadrent maintenant qu'il y a DEUX boutons « Lancer » à l'écran. Jamais une
 *  recherche DOM à distance (§ Encapsulation). */
export interface CarteAssistantProps { titre: string; corps: string; badge?: string; children?: ReactNode }

/** Bouton Lancer + `title` de désactivation + région `role="status"` + Annuler +
 *  Échap + LA CHORÉGRAPHIE DE FOCUS (les deux `ref` et leur `useEffect`, qui
 *  descendent ici depuis `PanneauCopilote`). DEUX appelants dès cette itération.
 *  N'expose QUE des intentions : jamais un `ref`, jamais un `getBouton()`. */
export interface BarreLancerProps {
	enCours: boolean; desactive: boolean; titreDesactive?: string
	onLancer: () => void; onAnnuler: () => void
}

export interface CarteCompleterFicheProps { dossierId: string; dossier: Dossier; indisponible: boolean; onSelectSection: (s: SectionId) => void }
export interface CarteTisserIndicesProps  { dossierId: string; dossier: Dossier; indisponible: boolean; onSelectSection: (s: SectionId) => void }
```

`components/styles.ts` (N) — module de constantes, pas un composant : `pageStyle`, `carteStyle`, `enTeteStyle`, `eyebrowStyle`, `titreStyle`, `corpsStyle`, `ligneLancerStyle`, `boutonBase`, `lancerActifStyle`, `lancerDesactiveStyle`, `chargementStyle`, `annulerStyle`, `refusSyncStyle`, plus les styles propres à `LigneDetenteur`. Déplacés **sans modification de valeur** depuis `PanneauCopilote.tsx` (l. 316-421).

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Rôle** | `'indice-detenteurs'` · route `POST /ia/indice-detenteurs` · cible `CibleIndice { indiceId }` |
| **Contexte injecté** | 9 chemins, **tous d'audience `ia`**, `DEROGATIONS_AUDIENCE` vide et assertée vide. Canon (3) + indice cible (2) + par candidat (4), ≤ `CANDIDATS_MAX` candidats. Le modèle ne voit **aucun nom** (KR-195) — il voit des jetons `P1…PN` |
| **Schéma de sortie** | `{"detenteurs": ["P1", "P4"]}` — une clé, tableau de chaînes, `0 ≤ longueur ≤ 3`, éléments distincts, chacun ∈ table des rangs. **La liste vide est un SUCCÈS.** |
| **Échec de validation** | Rejeu **exactement une fois**, puis état **terminal** `illisible`, rien de persisté, rien de réparé (KR-230). **Le lot ENTIER est refusé** sur un seul élément fautif — jamais de repêchage partiel |
| **Ce que l'IA ne fait PAS** | les dés, les stats, l'inventaire, l'XP — **y compris au site d'ÉCRITURE** : le copilote écrit un `Savoir` à **exactement deux clés**, `{indice_id, certitude}` ; jamais `revele_si`, jamais `revele_comment`. Elle ne choisit **pas** la certitude : le code pose `CERTITUDE_INITIALE` |
| **Mémoire** | **aucune**, et c'est une propriété : deux lancers sur un dossier inchangé ⇒ **deux corps identiques par égalité stricte**. Ce qui est « retenu » est le **dossier persisté** — un détenteur accepté devient détenteur actuel, donc inénonçable ; un détenteur **refusé peut réapparaître**, et l'écran le dit |

**Ce que l'invite n'a PAS le droit de réciter** (résolue n° 20) : le **seuil de `indice-sans-source`** (ni chiffre, ni paraphrase — un modèle qui le connaît optimise **l'extinction de l'alerte** au lieu de répondre à la question) ; le **message du contrôle** ; la **table d'audience** ; le sens des trois **certitudes** ; les **quatre portes** de `Revelation` ; les caractéristiques, les seuils, les tiers. **Corollaire de même rang : `brain/copilote/` n'importe PAS `controlerDossier`.** Le constat gouverne **quel indice l'auteur peut confier** — côté client, dans le `Select` ; il n'entre ni dans le contexte, ni dans la légalité d'une demande.

« Jamais plus de trois » figure dans l'invite **en plus** du contrat, jamais **à la place** — et ce n'est pas une règle dupliquée : `PROPOSITIONS_MAX` n'est ni une règle du jeu ni une règle du dossier, c'est la **forme de la réponse attendue**, même statut que `max_tokens`. L'invite persuade, le validateur décide.

**Anti-complaisance — ce que le CONTRAT arrête** : (a) *proposer tout le monde* → `longueur ≤ 3` **au validateur** (une liste de 6 est un refus, jamais une troncature) + `CANDIDATS_MAX` en amont ; (b) *proposer celui qui détient déjà* → **par construction**, il n'a ni bloc ni rang, donc il est **inénonçable** — ce n'est pas découragé, c'est impossible, et c'est pourquoi on ne re-filtre **pas** à l'acceptation (§ 8, TL-7) ; (b′) *doublon de rang* → `'schema'` ; (c) *paraphrase du CONTEXTE*, le seul canal que l'it1 a inscrit **non couvert**, est ici **fermé par la forme** — la sortie ne porte aucune prose. **À retenir pour l'it3, qui le rouvrira.**

**Bornes, et leur composition** :
```
K  = CANDIDATS_MAX = 8                       ← variable LIBRE (contexte.ts)
M  = longueur du contexte assemblé, K SATURÉ, sur un dossier COMPOSÉ PAR LE TEST
BUDGET_CARACTERES_CONTEXTE['indice-detenteurs'] = ceil(M × 3 / 1000) × 1000
TAILLE_MAX_CORPS_IA = max sur les rôles de ceil((3 × budget[rôle] + E[rôle]) / 1024) × 1024
PROPOSITIONS_MAX = 3   (schemaSortie.ts)  ─┐ deux moitiés d'une même borne,
max_tokens       = 100 (worker/index.ts)  ─┘ dérivées dans le même lot
```
`CANDIDATS_MAX` borne l'**entrée** et se dérive du budget ; `PROPOSITIONS_MAX` borne la **sortie** et dérive `max_tokens` — dimensionner `max_tokens` sur le nombre de candidats financerait une liste que le contrat refuse. **Si la mesure de `M` déplaît, on baisse K — on ne monte JAMAIS le budget.**

## 5 — Lots

> **La frontière des lots EST la frontière de feature.** Lot 1 ne nomme **aucun** fichier sous `src/features/` ; lot 2 ne nomme **que** des fichiers sous `src/features/dossier-copilote/`. La disjonction se vérifie d'un préfixe de chemin.
> **Le lot 1 passe `tsc --noEmit` + `jest` SEUL** — c'est la contrainte qui a dicté la surcharge (§ 4.4).

### Lot 1 — `second-role` · `contrat`
- **Ouvrier** : `dev-contrat` (effort **élevé**, seul, en premier)
- **But** : faire exister le rôle `indice-detenteurs` de bout en bout **sans aucun écran**.
- **Ordre interne imposé** : `dossier/types.ts` + `dossier/destinations.ts` + `couverture.test.ts` (**la permission d'injecter `verite`, d'abord** — tout le reste en dépend) → `copilote/types.ts` → `copilote/schemaSortie.ts` (+ test) → `copilote/contexte.ts` (+ test, **la mesure de `M`**) → `worker/index.ts` (+ `index.test.ts`) → `worker/frontiere.test.ts` → `CopiloteService.ts` (+ test) → `brain/index.ts` **en dernier**.
- **Fichiers** : `src/brain/dossier/types.ts` (R) · `src/brain/dossier/destinations.ts` (R) · `src/brain/dossier/couverture.test.ts` (R) · `src/brain/copilote/types.ts` (R) · `src/brain/copilote/schemaSortie.ts` (R) · `src/brain/copilote/schemaSortie.test.ts` (R) · `src/brain/copilote/contexte.ts` (R) · `src/brain/copilote/contexte.test.ts` (R) · `src/brain/CopiloteService.ts` (R) · `src/brain/CopiloteService.test.ts` (R) · `src/brain/index.ts` (R) · `worker/index.ts` (R) · `worker/index.test.ts` (R) · `worker/frontiere.test.ts` (R)
- **EXPOSE** (`brain/index.ts`) : `CibleIndice`, `ReponseDetenteurs`, `EchecCopilote`, `PropositionDetenteurs`, `RoleCopilote` (2 membres), `MotifIllisible` (+`'rang-inconnu'`), `MotifRefusContexte` (+`'cible-a-ecrire'`, +`'aucun-candidat'`), `CopiloteService` à `demander` **surchargée**. Inchangés et non renommés : `CibleCopilote`, `ReponseCopilote`, `PropositionResolue`, `CHAMPS_PROPOSABLES`.
- **N'EXPOSE PAS** : `RangInjecte`, `DetenteursRendus`, `validerDetenteurs`, `GABARIT_SORTIE`, `PROPOSITIONS_MAX`, `CANDIDATS_MAX`, `BUDGET_CARACTERES_CONTEXTE`, `CHAMPS_INJECTES`, `PARTIES_REQUISES`, `assemblerProse`, `assemblerDetenteurs`, `ContexteProse`, `ContexteDetenteurs`. **La table des rangs ne sort jamais de `brain/copilote/`.**
- **Critères couverts** : #1, #2, #3, #4, #5, #6

### Lot 2 — `deux-cartes` · feature
- **Ouvrier** : `dev-lot` (effort standard), démarre **contrat figé**
- **But** : la carte 2 active, l'extraction KR-112, l'acceptation détenteur par détenteur, la consommation d'`estDisponible`.
- **Fichiers** : `components/PanneauCopilote.tsx` (R) · `components/CarteAssistant.tsx` (N) · `components/CarteCompleterFiche.tsx` (N) · `components/CarteTisserIndices.tsx` (N) · `components/LigneDetenteur.tsx` (N) · `components/BarreLancer.tsx` (N) · `components/styles.ts` (N) · `hooks/useDemandeCopilote.ts` (R) · `textes.ts` (R) · `tests/useDemandeCopilote.test.tsx` (R) · `tests/panneauCopilote.test.tsx` (R) · `tests/acceptation.test.tsx` (R) · `tests/detenteurs.test.tsx` (N) — tous sous `src/features/dossier-copilote/`
- **Consomme** : tout le lot 1 via `brain/`, plus `controlerDossier` / `Controle`, `pastilleNiveau`, `localiserEntite`, `CERTITUDE_INITIALE`, `Savoir`, `Indice`, `DossierService.update`, `useOpenDossier`. **Aucun import vers une autre feature** (KR-184).
- ⚠ **Coût prévisible** : une seconde carte active fait apparaître un **second bouton « Lancer »**. `panneauCopilote.test.tsx` et `acceptation.test.tsx` doivent **cadrer leurs requêtes** (`within(screen.getByRole('region', { name: CARD1_TITRE }))`) sinon `getMultipleElementsFoundError`. C'est pourquoi `CarteAssistant` rend un `<section aria-label={titre}>`.
- **Critères couverts** : #3, #7, #8

### Fichiers explicitement HORS de tout lot
`src/brain/dossier/libelles.ts` et `libelles.test.ts` · `controles.ts` et `controles.test.ts` · `atteignabilite.ts` · `pastilles.ts` · `__fixtures__/dossier-reference.json` · `src/App.tsx` · `src/features/dossier-copilote/tests/cablage.test.ts` · `index.ts` · `components/LigneProposition.tsx` · `lintIsolation.test.ts` · **tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`** · `specification.json`.

### 5.1 — Ce que le lot 1 doit MESURER avant de se signer *(jamais déduire)*
1. `M` du rôle `indice-detenteurs`, K **saturé**, **après** avoir asserté que tous les chemins résolvent non vides ⇒ `BUDGET_CARACTERES_CONTEXTE['indice-detenteurs']`. **Ne jamais livrer le `0` marqueur.**
2. `E` (octets d'enveloppe) du corps `indice-detenteurs` ⇒ `TAILLE_MAX_CORPS_IA` re-dérivé.
3. Le **pouvoir séparateur** du canari croisé de KR-236, et des deux canaris de plafond sur le rôle le plus large.
4. Le **pouvoir séparateur** du 4ᵉ `it` « deux sites » : un mot changé d'un seul côté rougit.
5. Que le clone enrichi de `indice.trace-du-guet` **ne change pas** le constat `indice-sans-source` *(déjà mesuré par la QA au raffinage — à re-confirmer dans le lot)*.
6. Rejouer `libelles.test.ts`, `couverture.test.ts`, `controles.test.ts` : **verts sans retouche**.

## 6 — Critères d'acceptation

1. **Étant donné** le contexte assemblé pour `'indice-detenteurs'` sur un dossier de référence, **quand** le test de confinement tourne, **alors** tout chemin de `CHAMPS_INJECTES['indice-detenteurs']` a la destination `'ia'`, `DEROGATIONS_AUDIENCE` est vide et le test l'asserte, et `entitesInjectees` **égale** `[cible.indiceId, ...rangs.values()]` par `toEqual` — *contrat* — *lot 1*
2. **Étant donné** un dossier dont l'indice cible n'a pas de `verite` écrite, **quand** l'auteur déclenche l'assistant, **alors** la demande est refusée avec le motif `'cible-a-ecrire'` **sans qu'aucun appel réseau ne parte** (`fetch` moqué, appelé **0** fois), et les quatre motifs de refus (`a-ecrire`, `cible-a-ecrire`, `aucun-candidat`, `trop-long`) sont **discriminés dans le même test** — *contrat* — *lot 1*
3. **Étant donné** une réponse `{"detenteurs": []}` conforme, **quand** le service la reçoit, **alors** elle est un **SUCCÈS** (`statut: 'propose'`, zéro `personnageId`), et l'écran rend `TEXTE_AUCUN_DETENTEUR_TROUVE`, distinct des six autres textes d'état de la carte — *contrat + composant* — *lots 1 et 2*
4. **Étant donné** une sortie `["P1","P9"]` avec `rangsConnus = {P1,P2,P3}`, **quand** elle est validée, **alors** le **lot entier** est refusé (`motif: 'rang-inconnu'`, jamais `['P1']`), le service rejoue **exactement une fois** — 2 appels, jamais 3 — puis rend un état terminal sans rien persister ; et `["P1","P2","P1"]` est refusé `'schema'` — *contrat* — *lot 1*
5. **Étant donné** les deux rôles, **quand** le garde KR-236 tourne, **alors** l'ensemble des clés de `GABARIT_SORTIE` côté brain, côté worker et d'`INVITES` est le **même**, chaque invite contient le gabarit **de son rôle**, et **intervertir les deux gabarits fait rougir** (canari croisé écrit et mesuré) — *contrat* — *lot 1*
6. **Étant donné** `BUDGET_CARACTERES_CONTEXTE` devenu `Record`, **quand** le test de liaison tourne, **alors** il itère `Object.keys(INVITES)`, le pire cas d'octets de **chaque** rôle tient sous `TAILLE_MAX_CORPS_IA`, et les deux canaris (−1 Ko, +400) portent sur le rôle le plus large **dérivé par `Math.max`**, jamais écrit — *contrat* — *lot 1*
7. **Étant donné** un détenteur proposé que l'auteur accepte, **quand** il est commité, **alors** l'écriture passe **par `DossierService.update(id, recette)`** — jamais une écriture directe — l'ordre persistance-puis-événement est épinglé (KR-004), et le `Savoir` écrit porte **exactement deux clés** : `expect(Object.keys(savoirEcrit).sort()).toEqual(['certitude','indice_id'])`, sa `certitude` valant `CERTITUDE_INITIALE` importée — *composant + contrat* — *lot 2*
8. **Étant donné** un indice signalé par `indice-sans-source` **dont l'auteur a déjà écrit la vérité**, **quand** il lance le copilote et accepte un détenteur proposé, **alors** un `Savoir` est ajouté au personnage désigné et le dossier reste accepté par `validateDossier` ; **et** étant donné l'indice supprimé entre la proposition et l'acceptation, **alors** `validateDossier` refuse (`reference-pendante`), **rien** n'est persisté et les anomalies sont rendues à l'écran (KR-234) — *bout-en-bout* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `contexte.test.ts › confinement d audience du second role` | 9 chemins à destination `'ia'` ; `DEROGATIONS_AUDIENCE` vide | jest | KR-232 | 1 |
| `contexte.test.ts › entitesInjectees egale cible plus rangs` | `toEqual([indiceId, ...rangs.values()])` | jest | KR-117, KR-231 | 1 |
| `contexte.test.ts › un detenteur actuel ne recoit aucun rang` | personnage détenteur absent de `rangs` **et** d'`entitesInjectees` | jest | anti-complaisance (b) | 1 |
| `contexte.test.ts › un candidat sans aucun champ ne consomme pas de rang` | rangs contigus, aucun bloc vide dans `texte` | jest | — | 1 |
| `contexte.test.ts › les quatre refus, discrimines` | 4 motifs distincts, **0 `fetch`** | jest | KR-171, KR-197/199 | 1 |
| `contexte.test.ts › troncature de LISTE jamais de CHAINE` | `plan_actions` réduit au 1ᵉʳ élément ; aucune chaîne coupée | jest | KR-230 | 1 |
| `contexte.test.ts › BUDGET par role` | `['indice-detenteurs']` = `ceil(M×3/1000)×1000` mesuré ; `['personnage-prose']` = 6000 inchangé | jest | KR-235, TL-9 | 1 |
| `contexte.test.ts › le clone enrichi ne change pas le constat` | `controlerDossier(clone)` filtré = `['indice.trace-du-guet → alerte']` | jest | testabilité (C11) | 1 |
| `schemaSortie.test.ts › liste vide = succes` | `{ok:true, detenteurs:[]}` | jest | C2 | 1 |
| `schemaSortie.test.ts › item[1] seul casse rejette le lot entier` | `["P1","P9"]` → `'rang-inconnu'`, jamais `['P1']` — **pouvoir séparateur** | jest | KR-235, BUG-087 | 1 |
| `schemaSortie.test.ts › doublon non adjacent` | `["P1","P2","P1"]` → `'schema'` | jest | **doublon** | 1 |
| `schemaSortie.test.ts › rang de forme legale hors table reelle` | `rangsConnus={P1,P2,P3}`, `["P5"]` → `'rang-inconnu'` | jest | **hors bornes** | 1 |
| `schemaSortie.test.ts › longueur 4 refusee, jamais tronquee` | `['P1','P2','P3','P4']` → `'schema'` | jest | anti-complaisance (a) | 1 |
| `schemaSortie.test.ts › aucune conversion numerique` | `"P1"` (NaN) passe par `Set.has` ; mutant `Number()` rouge | jest | KR-231 | 1 |
| `schemaSortie.test.ts › le schema de sortie ne porte aucune cle de prose` | clause (b) de la condition d'état | jest | § 4.7 | 1 |
| `couverture.test.ts › le predicat de verite est present aux DEUX sites` | 4ᵉ instance du patron ; **un mot changé d'un côté rougit** | jest | R1 | 1 |
| `CopiloteService.test.ts › cible incompatible ne compile pas` | `@ts-expect-error` sur `demander('indice-detenteurs', d, {entiteId,champ})` | contrat (type) | TL-1, TL-2 | 1 |
| `CopiloteService.test.ts › rejeu exactement une fois puis terminal` | 2 appels jamais 3 ; état terminal sans persistance — **deux tests séparés** | jest | KR-230 | 1 |
| `CopiloteService.test.ts › deux lancers, deux corps identiques` | égalité stricte des corps de requête | jest | mémoire (résolue n° 8) | 1 |
| `worker/index.test.ts › route du second role` | POST, 404 rôle inconnu, 503 non-configuré, 413 corps trop grand, tout en JSON | jest (node) | KR-233 | 1 |
| `worker/frontiere.test.ts › totalite des gabarits par role` | 3 ensembles de clés égaux | jest | KR-236 | 1 |
| `worker/frontiere.test.ts › canari croise` | gabarits intervertis ⇒ **rouge** | jest | KR-236 | 1 |
| `worker/frontiere.test.ts › les deux plafonds, describe.each` | chaque rôle tient ; canaris −1 Ko / +400 sur le rôle le plus large | jest | KR-233 | 1 |
| `worker/frontiere.test.ts › temoin executable du second role` | invite composée + validateur dans le MÊME processus | jest | KR-236 | 1 |
| `detenteurs.test.tsx › le Select liste les constats, jamais les indices` | options = `entityId` des constats filtrés | RTL | § 3.2 | 2 |
| `detenteurs.test.tsx › vide-mais-reussi, texte discrimine` | 7 textes d'état distincts deux à deux | RTL | KR-197/199 | 2 |
| `detenteurs.test.tsx › acceptation pose CERTITUDE_INITIALE` | `Object.keys(savoir).sort() === ['certitude','indice_id']` | RTL + contrat | R3, invariant n° 5 | 2 |
| `detenteurs.test.tsx › acceptation passe par update et emet apres` | ordre persistance → événement | RTL | KR-004 | 2 |
| `detenteurs.test.tsx › reference orpheline par course` | indice supprimé entre proposition et acceptation → `validateDossier` refuse, rien persisté | RTL | KR-234, **référence orpheline** | 2 |
| `detenteurs.test.tsx › gel de la proposition` | la carte ne change pas de cible si l'indice quitte les constats en cours de flux | RTL | § 3.6 | 2 |
| `detenteurs.test.tsx › focus apres decision` | focus sur le `+` de la prochaine ligne non décidée, sinon « Lancer » | RTL | § 3.5 | 2 |
| `detenteurs.test.tsx › Annuler pendant l appel` | ferme sans écrire de décision | RTL | **annulation** | 2 |
| `detenteurs.test.tsx › double clic Lancer` | `demander` appelé **1** fois | RTL | **double soumission** | 2 |
| `detenteurs.test.tsx › texte trop-long specifique au role` | distinct de `TEXTE_REFUS_TROP_LONG` | RTL | TL G.7 | 2 |
| `panneauCopilote.test.tsx › Lancer desactive quand non configure` | `TITRE_COPILOTE_NON_CONFIGURE` sur les DEUX cartes | RTL | `open_q` n° 5 | 2 |
| `contexte.test.ts › aucun nom n est injecte` | aucun chemin de `CHAMPS_INJECTES['indice-detenteurs']` ne résout vers `indices[].nom` ni `personnages[].nom` ; le `texte` assemblé ne contient **aucun** `nom` du dossier | jest | **KR-195** | 1 |
| `lintIsolation.test.ts` + `npm run lint` | zéro import `dossier-copilote` → autre feature, dans les trois sens ; zéro couleur en dur | lint (câblé) | **KR-184** | revue |
| `controles.test.ts`, `libelles.test.ts`, `couverture.test.ts` (audience), `cablage.test.ts` | **verts SANS RETOUCHE** ; `git diff --stat` ne les liste pas | non-régression | KR-187 | revue |

**Non vérifiable en l'état** *(à recopier tel quel dans la revue — la revue ne comptera jamais ces points comme vérifiés parce que jest est vert)* :
- La **qualité** de la désignation et tout **taux de complaisance** — aucun instrument du dépôt ne constate une cohérence narrative (KR-229). Tout est porté par des **refus déterministes**.
- Le **texte** de la condition d'état réécrite est vérifié dans sa *présence aux deux sites*, jamais dans sa *justesse* — revue humaine seule.
- Le **remontage du panneau à la navigation**, condition de validité de la consommation d'`estDisponible()` (non réactif : il délègue à `CloudSettingsService.isConfigured()`, sans abonnement). **À MESURER au lot 2, pas à supposer** ; la limite figure dans la revue même si la mesure rassure.
- `CANDIDATS_MAX = 8` est une valeur d'**entrée**, pas une mesure : elle se révise **à la baisse** si `M` déplaît.
- Le comportement réel du **fournisseur amont** : le témoin moque l'amont. Le protocole est ratifié, pas éprouvé en production.

## 8 — Registre des désaccords

> Tout `REJETÉ` d'annexe est recopié ici : une condensation qui perd un refus motivé a déjà coûté un défaut majeur (BUG-082).

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | narratif-ia | Le modèle choisit la `certitude` du savoir proposé | **REJETÉ** | Un `croit` est une information FAUSSE (`types.ts` l. 291-297) : la faire choisir au modèle lui fait inventer un fait que l'auteur n'a pas écrit, ratifié par un clic — forme exacte de `porte_suggeree` (résolue n° 9). MESURÉ : `certitude` ne décide de rien dans `atteignabilite.ts` (test l. 328), donc un détenteur menteur ÉTEINT l'alerte exactement comme un sincère — le copilote ferait disparaître son propre déclencheur sans rendre l'indice plus obtenable. Le code écrit `CERTITUDE_INITIALE`. **Concédé par le tech-lead et l'UX au tour 2 ; PM et QA s'y sont ralliés.** |
| 2 | narratif-ia | Si la certitude restait au modèle, l'invite définirait `sait`/`croit`/`soupconne` | **VETO, sans objet** | Le veto était conditionnel ; sa condition est tombée avec n° 1. Inscrit parce qu'il redevient actif si une itération future rend la certitude au modèle. |
| 3 | tech-lead | `validerDetenteurs` refuse la liste vide (`'vide'`) | **REJETÉ** | Le prédicat de non-vacuité de l'it1 portait sur une prose SCALAIRE ; sur une LISTE le vide EST une réponse. Punir la réponse honnête est une machine à complaisance. **Le tech-lead a retiré son prédicat au tour 2.** |
| 4 | narratif-ia | Rôle nommé `'personnage-detenteurs'` | **REJETÉ** | Le nom se lit ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ ; `'personnage-detenteurs'` se lirait « les détenteurs d'un personnage ». **Retiré par son auteur.** |
| 5 | narratif-ia | Une union discriminée par le rôle sur UNE méthode non surchargée | **REJETÉ, fond RETENU** | Elle ferme le même état illégal, mais force l'appelant à rétrécir au runtime une branche qu'il connaît à la compilation, **et** fait entrer les trois bouchons de test dans le lot contrat. La **surcharge sur le littéral de rôle** obtient le fond (le rôle cesse d'être un paramètre libre) sans le coût. |
| 6 | tech-lead (TL-1) | Cible commune `CibleCopilote {entiteId, champ?}` | **REJETÉ** | Rend représentable « une demande de prose sans champ » et « une demande de détenteurs avec un champ ». |
| 7 | tech-lead (TL-3) | `CLES_SORTIE` générique pour piloter les deux validateurs | **REJETÉ** | Un registre paramétré pour une prose scalaire ET une collection donne une déclaration unique à deux formes sans raison d'évoluer ensemble. Deux registres littéraux. |
| 8 | tech-lead (TL-4) | Une table de portées `PROFILS` pour éviter un `if (role === …)` | **RETIRÉ PAR SON AUTEUR** | « Le corps est le même, seule l'origine des chemins diffère » était **faux** : les deux rôles diffèrent sur **cinq** points, une table n'en couvre que deux. Retenu à la place : **deux fonctions nommées** partageant les primitives, zéro branche de rôle. |
| 9 | tech-lead (TL-5) | Drapeau `numerotee` sur chaque portée | **SANS OBJET** | Disparaît avec n° 8. |
| 10 | tech-lead (TL-6) | Accepter les rangs valides d'un lot et écarter les autres | **REJETÉ** | Réparation silencieuse : l'auteur ratifierait une liste tronquée sans le savoir — la panne exacte que l'`open_question` des six curseurs nomme. |
| 11 | tech-lead (TL-7) | Re-filtrer à l'acceptation les détenteurs déjà détenteurs | **VETO — maintenu** | **Source de vérité dupliquée**, terrain du veto tech-lead. Le prédicat vit dans l'assembleur, qui ne numérote pas un détenteur actuel : ceux-là sont *inénonçables*, pas *filtrés*. Non contesté. |
| 12 | tech-lead (TL-8) | Cinquième entrée (`monde.indices[].verite`) dans `LIBELLE_DES_CHAMPS` | **VETO — maintenu** | **MESURÉ par l'orchestrateur** : `libelles.test.ts:43` `toHaveLength(4)` et `:137` le balayage `label="${…}"` ; `FicheIndice.tsx:131` porte `label="VÉRITÉ"` et `:142` `label="FORMULATION JOUEUR"` — fichier de `dossier-registres`, **interdit**. La seule façon de reverdir serait d'éditer un fichier interdit ou de modifier le témoin. Le refus nomme le champ **en prose**, via `'cible-a-ecrire'`. **Concédé par `narratif-ia` au tour 2**, qui retire « `LIBELLE_DES_CHAMPS` gagne son entrée ». |
| 13 | narratif-ia | Élargir `PARTIES_REQUISES` à `readonly string[]` | **REJETÉ** | Détruirait la garantie de compilation « tout champ requis a un libellé d'écran », qui rend `texteRefusAEcrire` sans branche de repli. Le rôle reçoit `[]` et un motif **sans charge**. |
| 14 | tech-lead (TL-9) | `BUDGET_CARACTERES_CONTEXTE` scalaire re-dérivé sur le rôle le plus large | **REJETÉ** | Desserrerait la garde du rôle étroit d'un facteur ~5 par la mesure d'un rôle voisin, **sans un seul test rouge** (KR-235). |
| 15 | tech-lead (TL-10) | Garder la liaison sur `ROLE = 'personnage-prose'` + un second `it` | **REJETÉ** | Le pouvoir séparateur des canaris ne vaut que pour le rôle qui sature le plafond. **MESURÉ** : `frontiere.test.ts:31` importe le budget en scalaire — le laisser en l'état n'est même plus une option, `tsc` échoue. |
| 16 | tech-lead (TL-11) | Découper l'extraction KR-112 et la carte 2 en deux lots | **REJETÉ** | Les deux nomment `PanneauCopilote.tsx` : propriété exclusive violée. |
| 17 | tech-lead (TL-12) | Un troisième lot `worker/` seul | **REJETÉ** | `frontiere.test.ts` importe des **deux** côtés de la frontière : c'est sa raison d'être. |
| 18 | tech-lead (TL-13) | Conserver la phase `'decide'` dans le hook | **REJETÉ** | Deux états pour ce qui est affiché — la forme rejetée au raffinage de `dossier-controles` it1 et livrée quand même (BUG-082). **MESURÉ par l'orchestrateur** : zéro occurrence de `'decide'` dans `tests/` — la sortir ne casse aucun témoin. |
| 19 | tech-lead (TL-15) | Un lot contrat qui **ajoute un membre** à `CopiloteService` | **REJETÉ** | **MESURÉ** : trois bouchons `brain.copilote = { estDisponible, demander }` (`panneauCopilote:55`, `acceptation:54`, `useDemandeCopilote:37`), `demander` annoté `jest.Mock` nu. Un membre de plus ⇒ le lot contrat ne passe plus `tsc` seul ⇒ il happe des fichiers de feature. |
| 20 | tech-lead (TL-16) | `ReponseCopilote<P = PropositionResolue>` avec paramètre par défaut | **REJETÉ** | Shim permanent écrit pour satisfaire une frontière de lot, qui fait en outre signifier « réponse du rôle prose » à un nom générique. Deux unions nommées. |
| 21 | tech-lead (TL-17) | Registre-valeur `ROLES_COPILOTE = [...] as const` | **REJETÉ** | `Record<RoleCopilote, …>` donne déjà la totalité **à la compilation**. Le seul consommateur d'une liste à l'exécution est un test, qui dérive ses clés du `Record`. |
| 22 | tech-lead (TL-18) / ux-designer | Partager `actionsStyle`/`lienStyle` entre `LigneProposition` et `LigneDetenteur` | **REJETÉ** | Rouvrirait un fichier livré et intact pour deux objets de style, entre deux composants dont la divergence est **attendue**. Compensation retenue : le § 3.4 **nomme les jetons exacts** que `LigneDetenteur` emploie, pour qu'un ouvrier n'en invente aucun. Deux dispositions flex identiques ne sont pas un mot français à deux orthographes — la différence avec n° 23 est là. |
| 23 | ux-designer (TL-14) | Promouvoir `LIBELLES_CERTITUDE` de `dossier-fiches` vers `brain/` | **REPORTÉ** | L'objection est **fondée** (un registre de langue à deux domiciles dérive), mais les deux issues sont fermées : promouvoir exige d'éditer `dossier-fiches` (critère 14, exception **non renouvelable**) ; retaper localement crée le second domicile dénoncé. n° 1 étant acquis, la certitude vaut toujours `'sait'` : **la carte 2 n'affiche aucun libellé de certitude** et porte une mention unique. **Retirée par son auteur au tour 2.** Condition d'ouverture : la première itération autorisée à toucher `dossier-fiches` **et** ayant un second consommateur réel. |
| 24 | ux-designer | Faire de `LigneDetenteur` une 3ᵉ variante de `LigneProposition` | **REJETÉ** | `chemin`, `valeurAvant`, `valeurApres` — et désormais `certitude` — n'ont aucun sens sur un détenteur ; les rendre optionnels casse la garantie de forme que `LigneProposition` porte pour la carte 1, pour un gain nul. |
| 25 | ux-designer | Extraction à 2 fichiers (`CarteCompleterFiche`, `CarteTisserIndices`) | **RETIRÉE PAR SON AUTEUR** | Sans `BarreLancer` partagé, la chorégraphie clavier (focus / Échap / Annuler) se réécrit deux fois et peut diverger sans qu'aucun test ne le voie. Découpage à **6 fichiers** retenu. |
| 26 | pm-produit | UN candidat par appel, ré-actionnable par « Lancer » | **RETIRÉE PAR SON AUTEUR** | Le `goal` dit « CHAQUE détenteur proposé » ; trois rôles ont convergé indépendamment sur la liste. Motifs décisifs de `narratif-ia` : le silence devient exprimable en un geste, et trois appels sans mémoire peuvent rendre trois fois le même nom — l'auteur y lirait une insistance là où il n'y a qu'un déterminisme. |
| 27 | qa | Veto : « lot » non défini pour un tableau, aucun critère ne nomme le RANG | **VETO LEVÉE** | Les trois conditions sont acquises : rang = jeton-chaîne validé par appartenance ; lot entier refusé, jamais de filtrage ligne à ligne ; sort du scanner anti-identifiant tranché. Converti en exigences de plan nommées (§ 4.3, § 7). |
| 28 | narratif-ia | Le modèle rend un motif ou une justification par détenteur | **REJETÉ** | C'est de la prose, donc invalidable (KR-229), et elle rouvre le seul canal que l'it1 a inscrit NON COUVERT : la paraphrase du CONTEXTE. La justification s'affiche DEPUIS LE DOSSIER, côté client : vraie par construction, zéro jeton. |
| 29 | narratif-ia | Injecter `relations[].lien` pour juger qui apprend quoi | **REPORTÉ** | Prédicat d'injection conditionné par RÔLE ; un rôle de RÉDACTION n'est ni narrateur ni arbitre. MESURÉ : les 2 relations sur 2 de la fixture portent `secret: true`, gain nul même en levant la garde. Condition d'ouverture : une extension **nommée** du prédicat écrite aux deux sites et épinglée par le test « présent aux DEUX sites » — jamais par un ouvrier. |
| 30 | narratif-ia | Injecter le message du contrôle `indice-sans-source` dans le contexte | **REJETÉ** | C'est la RÈGLE, et elle vit dans `controles.ts` : l'injecter la met dans le code ET dans le prompt (résolue n° 20) et apprend au modèle à faire disparaître l'alerte plutôt qu'à répondre. **Corollaire de même statut : `brain/copilote/` n'importe pas `controlerDossier`.** |
| 31 | narratif-ia | Injecter `apparence` dans le profil du candidat | **REJETÉ** | ≈150 caractères par candidat (mesuré sur `pnj.corvin-le-marchand`) pour zéro pouvoir discriminant sur « qui pourrait savoir cela ». À K = 8, ~1200 caractères de budget pour rien. |
| 32 | narratif-ia | Prefill de la réponse du modèle par `{` | **REJETÉ** | Le worker devrait recoller l'accolade, c'est-à-dire **réparer** une sortie — ce que l'it1 lui interdit nommément. Le gain n'est pas mesurable dans ce dépôt ; la perte de doctrine l'est. |
| 33 | narratif-ia | Exclure d'une relance les candidats que l'auteur vient de refuser | **REPORTÉ** | Casse la propriété LIVRÉE « deux lancers ⇒ deux corps identiques ». Forme si repris, et jamais une autre : un ensemble d'identifiants **exclus**, borné, passé dans la cible et appliqué **à l'assemblage** — jamais un historique de conversation dans l'invite. |
| 34 | ux-designer | Éditer la `certitude` d'un détenteur avant acceptation | **REPORTÉ** | Enum fermée, risque bas — mais le `goal` dit « accepte ou refuse », pas « accepte, refuse ou corrige ». `open_question` **distincte** de la n° 3 existante (qui porte sur une prose libre) : ne pas les fusionner, ce serait perdre la distinction de famille de risque. |
| 35 | orchestrateur | `GABARIT_SORTIE` : deux constantes nommées **ou** `Record<RoleCopilote, string>` | **ARBITRÉ : `Record`** | Les deux rôles à effort élevé ont **échangé leurs positions** entre les tours ; je tranche sur l'argument, pas sur le mouvement. Avec deux constantes, l'appariement rôle → gabarit n'existe **que dans le test**, qui en devient un troisième porteur ; le `Record` le rend **total à la compilation**. L'objection qui avait tué le `Record` (l'ancrage ligne-à-ligne du balayage) **se dissout** dès que l'extraction s'ancre sur l'**entrée** et non sur la déclaration — et ce balayage devait de toute façon être réécrit, `frontiere.test.ts` ne compilant plus une fois le budget devenu `Record` (mesuré). Contrepartie **obligatoire** : la forme d'écriture littérale est imposée des deux côtés, et le canari **croisé** est écrit et mesuré rouge (§ 5.1 n° 3). |
| 36 | orchestrateur | Granularité du motif d'échec : `'rang'` unique **ou** `'schema'` + `'rang-inconnu'` | **ARBITRÉ : deux motifs** | La QA l'a tranché sur son terrain : les cinq cas fautifs se répartissent **sans reste** sur cette partition, et deux fixtures disjointes et triviales les visent séparément. Un motif unique perdrait la capacité de localiser un mutant qui casserait spécifiquement l'appartenance. **Le tech-lead l'a adopté au tour 2.** |
| 37 | orchestrateur | `entitesInjectees` : inclusion (`⊆`) **ou** égalité (`toEqual`) | **ARBITRÉ : égalité** | L'égalité devient possible **parce que** les détenteurs actuels ne sont injectés ni en bloc ni en rang — décision de `narratif-ia` que le tech-lead a adoptée dans sa propre sélection de candidats. Un `⊆` resterait vert sur une entité injectée qu'on aurait oublié d'auditer, ce qui est exactement le trou que cet audit existe pour fermer. Le mécanisme reste celui du tech-lead : **une traversée, deux projections**. |
| 38 | orchestrateur | Noms des constantes de texte | **ARBITRÉ** | Le **nom** suit le motif du contrat (`TEXTE_REFUS_CIBLE_A_ECRIRE` ↔ `motif: 'cible-a-ecrire'`) — c'est ce qui couple le texte au refus qu'il rend ; le **libellé** est celui de l'UX, mot pour mot. Les deux mentions permanentes proposées séparément (voyant `revelation-sans-porte`, certitude toujours « sait ») sont **fusionnées en une** : elles décrivent le même objet. |
| 39 | tech-lead / pm-produit | L'acceptation allume `revelation-sans-porte` en éteignant `indice-sans-source` | **RETENU, et écrit** | Le PM tranche : **valeur réelle, pas un voyant déplacé** — les deux alertes portent des faits différents (absence de détenteur / absence de porte), et le `goal` ne promet jamais « rendre l'indice jouable ». Condition : **rien** dans les textes ne prétend « résolu », et l'auteur le voit venir **avant** le geste (`MENTION_SAVOIR_CREE`, § 3.3). Zéro code neuf pour l'alerte. |
| 40 | tech-lead | `useDemandeCopilote.ts` au lot 1 | **RETIRÉ PAR SON AUTEUR** | Avec la surcharge, `const ROLE = 'personnage-prose' as const` reste un littéral, l'appel résout la première surcharge et compile inchangé. Le hook part au **lot 2**, et la frontière des lots devient un préfixe de chemin. |
| 41 | qa / narratif-ia | Le scanner anti-identifiant dans `validerDetenteurs` | **REJETÉ** | La sortie ne porte aucune prose ; un jeton qui passe l'appartenance **est l'une de nos propres chaînes**. L'importer serait un instrument vert par construction (famille BUG-084). Le scanner reste **intact** sur `validerSortie`, avec ses canaris de l'it1. |
| 42 | orchestrateur | `open_questions` n° 4 — protocole du fournisseur amont | **CLOSE** | Condition d'ouverture remplie (un second rôle arrive). **Anthropic Messages, version épinglée `2023-06-01`, ratifié comme décision de comité** — il cesse d'être « le choix de l'ouvrier ». Les deux passages de `worker/index.ts` qui le disent sont réécrits au lot 1. Exigence : le second rôle **n'étend pas le couplage**. |
| 43 | orchestrateur | `open_questions` n° 5 — l'appelant d'`estDisponible()` | **CLOSE — on la consomme** | `PanneauCopilote` calcule `!copilote.estDisponible()` **en ligne au rendu** et le passe aux deux `BarreLancer` avec une raison nommée. La dette KR-109 se ferme sans rien retirer. **Limite à porter en revue** : la méthode n'est pas réactive — le remontage à la navigation est **à mesurer au lot 2**, pas à supposer. |

## 9 — Innovation

*Aucune.* Le budget d'une proposition hors-cadre par itération n'est pas consommé : les quatre décisions structurantes (rang-jeton, liste vide légale, surcharge, condition d'état ré-écrite) s'appuient toutes sur un précédent déjà livré dans le dépôt.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **SANS OBJET** : aucun des quatre fichiers mutés (`challenge`, `combat`, `xp`, `characteristics`) n'est dans un lot. À confirmer par le diff, pas par mémoire. Table dorée sans objet de même.
- [ ] Les six mesures du § 5.1 **exécutées et rapportées**, aucune déduite
- [ ] Tests du § 7 écrits et passants ; les canaris et mutants **vus rouges** avant d'être crus
- [ ] Critères du § 6 cochés un par un
- [ ] `controles.test.ts`, `libelles.test.ts`, `cablage.test.ts` verts **sans une seule retouche** — un diff dans ces fichiers est le signal qu'une frontière a été franchie
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] **Heuristiques de revue, sans instrument par décision de projet** — à passer à la main, pas à cocher parce que jest est vert : **KR-013/113** (état dérivé — `rg` du § Build Steps étape 5 sur les fichiers du lot 2 ; `estDisponible` et `indisponible` se calculent **en ligne**, jamais par `useEffect`) et **KR-112** (`PanneauCopilote.tsx` ≤ 120 lignes après extraction ; aucun fichier du lot 2 au-dessus de 400)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-copilote-it2.revue.md`, portant la liste **nommée** de ce que personne n'a vérifié

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | précondition « vérité écrite d'abord » portée par le critère 8 ✔ |
| Tech Lead | recevable sous réserve | TL-7 et TL-8 tenus en veto, non contestés ✔ · découpage à 2 lots, frontière = préfixe de chemin ✔ |
| UX | recevable sous réserve | focus post-décision § 3.5 ✔ · tous les textes au § 3.3 ✔ |
| QA | recevable sous réserve | fixture de recette § 5.1 n° 5 ✔ · deux motifs § 4.3 ✔ · veto levée ✔ |
| Narratif & IA | recevable sous réserve | R1 → § 4.7 ✔ · R2 → § 4.1 ✔ · R3 → désaccord n° 1 ✔ · R4 → critère 2 ✔ · R5 → § 4 bis ✔ |
