# Tour 1 — `tech-lead` · `dossier-copilote` it2

```
RISQUE      — Les deux plafonds cessent d'être des gardes sans qu'aucun test ne rougisse.
              `BUDGET_CARACTERES_CONTEXTE` est un SCALAIRE (6000) ; `indice-detenteurs`
              injecte 6 personnages là où `personnage-prose` en injectait UN (M = 1783
              mesuré). Re-dérivé sur le rôle le plus gros, le même scalaire desserre d'un
              facteur ~5 la garde du rôle prose : un invariant relâché par la mesure d'un
              rôle voisin, sans un seul rouge. Et `worker/frontiere.test.ts` fige
              `const ROLE = 'personnage-prose'` (l. 37, employé l. 154 et 258) : le test de
              LIAISON resterait vert en ne prouvant plus rien du second rôle.

OBJECTION   — « aucun entier ne sort d'un modèle dans cette tranche » est FAUX tel qu'écrit
              si le RANG est un `number`. Soit la phrase du goal est fausse, soit le rang
              est une énumération fermée de jetons — et personne ne l'a tranché. Laissée en
              l'état, un ouvrier écrira `rang: number` et inventera seul un contrôle de
              bornes (flottant, négatif, NaN, hors bornes, doublon) : cinq branches d'échec
              que ni le comité ni le contrat n'auront revues. À trancher AU LOT CONTRAT.

PROPOSITION — (1) `BUDGET_CARACTERES_CONTEXTE: Record<RoleCopilote, number>`, une mesure par
              rôle par la formule de l'it1 ; `TAILLE_MAX_CORPS_IA` = max sur les rôles ;
              liaison en `describe.each(Object.keys(INVITES))` avec enveloppe construite par
              rôle et canaris ±1 Ko / ±400 portés par le rôle le plus large — un rôle ajouté
              sans mesure rougit. (2) DEUX méthodes (`demanderProse`, `demanderDetenteurs`),
              enveloppe d'échec extraite (`EchecCopilote`), succès paramétré : aucun couple
              (rôle, cible) illégal n'est représentable. (3) La table des rangs ne sort
              JAMAIS de `brain/copilote/` — le service re-résout, la feature ne reçoit que
              des identifiants (KR-231 tenu par la portée, pas par une convention).

VERDICT     — recevable sous réserve : les trois propositions au lot contrat, et la forme
              du RANG tranchée avant l'essaim.
```

---

# ANNEXE

Fichiers réellement lus en entier : `src/brain/copilote/{types,contexte,schemaSortie}.ts`, `src/brain/CopiloteService.ts`, `worker/index.ts`, `worker/frontiere.test.ts`, `src/brain/dossier/libelles.test.ts`, `src/features/dossier-copilote/components/{PanneauCopilote,LigneProposition}.tsx`, `hooks/useDemandeCopilote.ts`, `textes.ts`, `.claude/raffinage/dossier-copilote-it1.plan.md` (§ 4 → § 8), `specification.json` (intégral), extraits de `src/brain/dossier/{controles,destinations,types}.ts`, `src/brain/index.ts`.

## A — Signatures littérales, à recopier dans le plan

### A.1 `src/brain/copilote/types.ts` (R)

```ts
/** DEUX rôles. Le nom encode le TYPE D'ENTITÉ ciblée, doctrine de l'it1 inchangée. */
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs'

// ── inchangé : ChampProseCle, CHAMPS_PROPOSABLES, ChampProseChemin, PropositionRendue,
//    PropositionResolue. Aucune de ces quatre lignes ne bouge.

/** CE QUE LE MODÈLE REND pour `indice-detenteurs` — franchit le réseau. AUCUN
 *  identifiant : l'entité est désignée par un RANG que l'assembleur a posé, et que
 *  le code re-résout (KR-231). `certitude` est une chaîne d'une énumération FERMÉE
 *  du schéma (`CERTITUDES`), jamais un entier, jamais un libellé libre. */
export interface DetenteurRendu {
	rang: RangInjecte
	certitude: Certitude
}
export interface DetenteursRendus {
	detenteurs: DetenteurRendu[]
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. `indiceId` vient de
 *  l'état d'écran, `personnageId` de la table des rangs. */
export interface DetenteurResolu {
	personnageId: string
	certitude: Certitude
}
export interface PropositionDetenteurs {
	indiceId: string
	detenteurs: readonly DetenteurResolu[]
}
```

**Note d'invariant à écrire dans le fichier** : à l'it1, la protection était « ZÉRO clé commune entre forme réseau et forme résolue ». Ici `certitude` est commune aux deux. **Ce n'est pas une régression et il ne faut pas la « réparer » par un renommage** : l'invariant réel est « aucune assignabilité structurelle dans les deux sens », et il tient parce que `rang` et `personnageId` sont tous deux REQUIS — `tsc` refuse l'un pour l'autre. Ce qui ne doit jamais devenir optionnel, c'est l'un de ces deux champs.

### A.2 Le RANG — la forme, et pourquoi elle décide de tout le reste

```ts
/** LE MARQUEUR DE RANG — un JETON, pas un entier. C'est ce qui rend vraie, à la
 *  lettre, la phrase du goal « aucun entier ne sort d'un modèle dans cette
 *  tranche », et c'est ce qui réduit la validation d'un rang à UNE appartenance
 *  au lieu de cinq prédicats numériques (entier ? fini ? ≥ 1 ? ≤ N ? unique ?).
 *  Produit par l'assembleur, incrusté dans le texte, rendu tel quel par le
 *  modèle, re-résolu par le code. */
export type RangInjecte = string
```

Deux variantes possibles pour le littéral, à trancher par `narratif-ia` (coût de recopie par le modèle) : `'1'…'N'` (chiffres en chaîne) ou `'P1'…'PN'`. **Ce qui est architectural et ne se négocie pas** : le validateur teste `rangsConnus.has(rang)` et rien d'autre. Si le comité impose `rang: number`, alors le contrat doit écrire les CINQ prédicats nommément, et la phrase du goal doit être corrigée — pas laissée telle quelle.

### A.3 `src/brain/copilote/contexte.ts` (R) — la forme qui évite `if (role === …)`

Aujourd'hui, `PREFIXE_PERSONNAGE` et la restriction à `cible.entiteId` sont écrits en dur dans le corps de l'assembleur (l. 71, 174, 181-184). Ce qui change d'un rôle à l'autre n'est **ni le corps ni la liste des chemins** — c'est **d'où partent les chemins** :

```ts
/** UNE PORTÉE : le préfixe des chemins qui lui appartiennent, et SES RACINES,
 *  DANS L'ORDRE, pour un dossier et une cible. `''` = la racine du dossier (les
 *  chemins `canon.*`). Une portée qui ne résout pas rend `[]` — aucune levée, le
 *  dossier vient du disque (KR-116). */
export interface Portee {
	readonly prefixe: string
	readonly racines: (dossier: Dossier, cible: CibleCopilote) => readonly RacineInjectee[]
}
export interface RacineInjectee {
	/** L'identifiant de l'entité — il ne franchit JAMAIS le réseau ; il ne sert
	 *  qu'à la table des rangs et au test de confinement. */
	readonly id: string
	readonly valeur: unknown
}

/** LE PROFIL D'UN RÔLE. `candidats` est un CHAMP, pas un drapeau répété sur
 *  chaque portée : « au plus une portée numérotée par rôle » est alors vrai À LA
 *  COMPILATION, et non tenu par une convention que deux entrées pourraient
 *  contredire. `undefined` ⇒ ce rôle n'a pas de rang (cas de `personnage-prose`,
 *  dont l'entité est désignée par l'AUTEUR). */
export interface ProfilRole {
	readonly portees: readonly Portee[]
	readonly candidats?: Portee
}
export const PROFILS: Record<RoleCopilote, ProfilRole>
```

`CHAMPS_INJECTES` **reste ce qu'il est** : une liste plate de chemins par rôle, écrite à la main, gardée par le test de confinement d'audience. Liaison testable entre la donnée et la stratégie : *tout chemin de `CHAMPS_INJECTES[role]` commence par le préfixe d'exactement UNE portée de `PROFILS[role]`* — un chemin orphelin ou un préfixe sans chemin rougit.

```ts
/** PAR RÔLE, et c'est le point dur de cette itération. Ce n'est PAS un cliquet :
 *  chaque entrée est re-dérivée par `ceil(M_role × 3 / 1000) × 1000` sur une
 *  mesure de CE rôle-là. Un scalaire partagé ferait desserrer la garde du rôle
 *  étroit par la mesure du rôle large — relâchement qu'aucun test ne voit. */
export const BUDGET_CARACTERES_CONTEXTE: Record<RoleCopilote, number> = {
	'personnage-prose': 6000,        // MESURÉ 2026-09-17, inchangé
	'indice-detenteurs': /* MESURÉ au lot contrat */ 0,
}

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	| { motif: 'trop-long' }
	/** NOUVEAU : aucun candidat numérotable — tous les personnages du dossier
	 *  détiennent déjà cet indice, ou il n'y en a aucun. Refus AVANT tout appel :
	 *  il n'y a littéralement rien à demander. Ne porte AUCUNE charge, comme
	 *  `trop-long`. */
	| { motif: 'aucun-candidat' }

export type Contexte =
	| {
			ok: true
			texte: string
			/** TOUTES les entités injectées — l'audit de confinement. */
			entitesInjectees: readonly string[]
			/** LES SEULES entités DÉSIGNABLES, marqueur → identifiant. Vide pour un
			 *  rôle sans `candidats`. Produite par LE MÊME parcours que le texte :
			 *  le numéro écrit dans `texte` et la clé de cette table sortent de la
			 *  même variable, jamais de deux boucles. Invariant asserté au test :
			 *  `[...rangs.values()]` ⊆ `entitesInjectees`. */
			rangs: ReadonlyMap<RangInjecte, string>
	  }
	| ({ ok: false } & MotifRefusContexte)
```

**Où vit la table rang→identifiant, et qui garantit qu'elle n'est jamais re-dérivée** : elle vit dans la branche `ok` de `Contexte`, et **elle ne sort jamais de `brain/copilote/`**. `CopiloteService` la consomme pour re-résoudre et rend `PropositionDetenteurs` qui ne porte que des identifiants. `contexte.ts` n'est pas ré-exporté par `brain/index.ts`. La feature ne peut donc **pas** re-dériver la table : elle n'a ni l'ordre, ni le prédicat de candidature, ni le texte. C'est une garantie de **portée**, pas une consigne.

### A.4 `src/brain/copilote/schemaSortie.ts` (R) — valider une LISTE sans dupliquer ni généraliser

`CLES_SORTIE` **reste littéralement `['valeur'] as const`** et continue de piloter `validerSortie` : aucune généricité, aucun renommage.

Extrait parce qu'il a **deux** appelants dans cette itération — donc prédicat privé au module, pas une primitive `brain/` (KR-109) :

```ts
/** PRIVÉ au module. L'ensemble des clés vaut EXACTEMENT `cles` — une clé en trop
 *  est un REFUS, jamais un champ ignoré : c'est le signal KR-236 lui-même. */
function aExactementLesCles(brut: Record<string, unknown>, cles: readonly string[]): boolean

/** Le registre du SECOND schéma. Deux registres littéraux, jamais un registre
 *  générique : `CLES_SORTIE` décrit une prose scalaire, celui-ci une collection. */
export const CLES_SORTIE_DETENTEURS = ['detenteurs'] as const
export const CLES_DETENTEUR = ['rang', 'certitude'] as const

export const GABARIT_SORTIE_DETENTEURS = '{"detenteurs": [{"rang": "…", "certitude": "…"}]}'

export type MotifIllisible = 'schema' | 'vide' | 'marqueur' | 'identifiant' | 'rang'

/**
 * LES PRÉDICATS DE FORME de la sortie `indice-detenteurs`. Aucune prose n'est
 * rendue par ce rôle : les prédicats (4) vide, (5) marqueur et (6) identifiant de
 * `validerSortie` n'ont AUCUN objet ici — ne pas les « rejouer par symétrie », ils
 * seraient inertes et donneraient l'illusion d'une couverture (KR-235).
 *
 * `rangsConnus` vient de `Contexte.rangs` — le validateur ne CALCULE aucun rang,
 * il constate une appartenance.
 */
export function validerDetenteurs(
	brut: unknown,
	rangsConnus: ReadonlySet<RangInjecte>,
): { ok: true } & DetenteursRendus | { ok: false; motif: MotifIllisible }
```

Les prédicats, dans l'ordre, tous prouvés un par un : (1) objet simple ; (2) `aExactementLesCles(brut, CLES_SORTIE_DETENTEURS)` ; (3) `Array.isArray(brut.detenteurs)` ; (4) liste **non vide** → sinon `'vide'` ; (5) chaque élément : objet simple + `aExactementLesCles(element, CLES_DETENTEUR)` ; (6) `certitude ∈ CERTITUDES` — **le registre importé de `dossier/types`, jamais re-listé (KR-117)** ; (7) `rangsConnus.has(rang)` → sinon `'rang'` ; (8) **aucun doublon de rang** → sinon `'rang'`.

**Hors bornes, malformé, doublon, `2.5`, `-1`, `"toto"` : une seule et même branche** — `{ok:false, motif:'rang'}`, donc **rejeu une fois puis état terminal**, le LOT ENTIER refusé. Accepter les rangs valides et jeter les autres serait une réparation silencieuse — l'auteur ratifierait une liste tronquée sans savoir qu'elle l'est. C'est exactement la panne nommée par l'`open_question` des six curseurs, et c'est la doctrine déjà livrée à l'it1 (critère 5).

**Un rang désignant un personnage qui détient DÉJÀ l'indice : il n'existe pas.** Le prédicat de candidature vit dans l'assembleur (`PROFILS['indice-detenteurs'].candidats.racines`), qui **numérote uniquement** les personnages dont aucun `savoirs[].indice_id` ne vaut l'indice cible. Ceux qui le détiennent déjà peuvent rester dans le CONTEXTE (décision `narratif-ia`) mais **ne reçoivent pas de rang**. **Une autorité, un chemin de code, zéro réparation.** Le cas « plus aucun candidat » est intercepté **avant tout `fetch`** par `{ok:false, motif:'aucun-candidat'}`.

### A.5 `src/brain/CopiloteService.ts` (R) — la signature qui porte les deux rôles

```ts
export interface CibleProse {
	personnageId: string
	champ: ChampProseChemin
}

/** Le `champ` de `CibleProse` n'a PAS d'équivalent ici : on ne demande pas un
 *  champ, on demande QUI. Le rendre optionnel sur une cible commune créerait
 *  l'état illégal « prose sans champ ». */
export interface CibleIndice {
	indiceId: string
}

/** LES TROIS BRANCHES D'ÉCHEC, extraites : elles sont RIGOUREUSEMENT les mêmes
 *  pour tous les rôles et doivent le rester. */
export type EchecCopilote =
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	| { statut: 'illisible'; motif: MotifIllisible }

/** L'ENVELOPPE, paramétrée par ce que le rôle propose. DEUX instances dès cette
 *  itération, et le plan de la feature en nomme deux autres (it3, it4). */
export type ReponseCopilote<P> = { statut: 'propose'; proposition: P } | EchecCopilote

export interface CopiloteService {
	estDisponible(): boolean
	demanderProse(dossier: Dossier, cible: CibleProse, signal?: AbortSignal): Promise<ReponseCopilote<PropositionResolue>>
	demanderDetenteurs(dossier: Dossier, cible: CibleIndice, signal?: AbortSignal): Promise<ReponseCopilote<PropositionDetenteurs>>
}
```

**Pourquoi deux méthodes et non `demander(role, …)`** : avec un paramètre `role` et une cible commune, `demander('indice-detenteurs', d, {personnageId, champ})` compile. Le couple (rôle, cible) devient un état illégal représentable — exactement le motif qui a fait rejeter `CLES_PROPOSITION = ['champ','texte']` à l'it1 (§ 8 n° 1). Avec deux méthodes, **chaque méthode fixe son rôle en interne** : `RoleCopilote` cesse d'être un paramètre public. Ségrégation d'interface en prime.

**Aucune duplication du tuyau** : `unTour` (privé) devient une fonction privée paramétrée par `(role, contexte, valider)` — deux appelants, même fichier, invisible au contrat. **Ordre des effets inchangé.**

## B — Les deux plafonds : qui mesure, où, et comment le test de LIAISON survit à deux rôles

| | `personnage-prose` | `indice-detenteurs` |
|---|---|---|
| `M` | 1783 (MESURÉ 2026-09-17, **ne pas re-mesurer**) | **à MESURER au lot contrat**, sur une entité composée par `contexte.test.ts` (6 personnages de `dossier-reference.json` + un indice à < 2 producteurs), après avoir asserté que **tous** les chemins de `CHAMPS_INJECTES['indice-detenteurs']` résolvent non vides |
| budget | 6000, inchangé | `ceil(M × 3 / 1000) × 1000` |
| `E` (octets d'enveloppe) | 815 | **à mesurer**, le corps de requête n'a pas la même forme (pas de `champ`) |
| plafond worker | `TAILLE_MAX_CORPS_IA = max sur les rôles de ceil((3 × budget_role + E_role) / 1024) × 1024` | **UN seul plafond, calé sur le pire rôle** |

Le plafond worker reste unique et non par rôle : la garde protège le **budget modèle**, et c'est le budget **client**, lui par rôle, qui refuse en amont — doctrine déjà écrite (`worker/index.ts` l. 216-218), non rouverte.

**Ce que `worker/frontiere.test.ts` doit devenir**, faute de quoi il devient décoratif :
- `const ROLE = 'personnage-prose'` (l. 37) → `describe.each(Object.keys(INVITES))` ; `enveloppe()` prend le rôle en paramètre et se construit depuis `INVITES[role].systeme` + le corps **de ce rôle-là** (l. 257 recopie aujourd'hui un `champ` de prose) ;
- les deux canaris séparateurs (−1 Ko sur le plafond, +400 sur le budget, l. 274-284) se portent sur le **rôle le plus large** : sur le rôle étroit ils resteraient verts en ne discriminant rien ;
- le balayage de gabarit (l. 56, `DECLARATION`) asserte **une** occurrence par fichier. Avec deux gabarits : (a) deux constantes nommées, regex `const GABARIT_SORTIE(?:_[A-Z]+)? = '(.+)'`, assertion « exactement 2, mêmes ensembles des deux côtés » ; (b) un `Record<RoleCopilote, string>`, qui casse l'ancrage ligne-à-ligne. **Je recommande (a)**.

**Non mesuré par moi, à mesurer au lot contrat** : `max_tokens` de `INVITES['indice-detenteurs']`. N est borné **implicitement** par le budget de contexte, donc la dérivation honnête est `N_max = floor(budget_role / coût mesuré d'un bloc candidat)`, puis `max_tokens = ceil(N_max × coût d'une entrée JSON / 3) × 3`, arrondi à la centaine — **même protocole que l'it1, pas un nombre choisi**. Une troncature produit un JSON invalide → `schema` → rejeu → terminal : correctement signalé, mais systématique et invisible en test si le nombre est inventé.

## C — KR-112 : l'extraction, et dans quel lot

`PanneauCopilote.tsx` fait **421 lignes** ; une seconde carte active y ajoute ~**+180 à +220 lignes**, soit ~620 : au-delà du signal (400), sous le bloqueur (800), et à une itération du bloqueur.

Extraction proposée, **dans le lot feature et nulle part ailleurs** (une extraction et l'ajout qui la motive nomment forcément les mêmes fichiers) :

| Fichier | Rôle | Lignes visées |
|---|---|---|
| `PanneauCopilote.tsx` (R) | coquille : `useOpenDossier`, la page, les trois `Card` dans l'ordre, le passage de `onSelectSection`. **Aucune logique d'assistant.** | ≤ 120 |
| `components/CarteProse.tsx` (N) | la carte 1 déplacée sans changement de comportement | ~200 |
| `components/CarteDetenteurs.tsx` (N) | la carte 2 | ~190 |
| `components/BarreLancer.tsx` (N) | bouton Lancer + `title` de désactivation + région `role="status"` + Annuler + Échap + **la chorégraphie de focus** (l. 116-124, deux `ref`). **Deux appelants dès cette itération** | ~90 |
| `components/CarteAssistant.tsx` (N) | coquille `<Card>` + eyebrow + titre + `Badge` optionnel + `children` ; absorbe `Entete` et `CardBientot` | ~55 |
| `components/styles.ts` (N) | les `CSSProperties` partagés (`corpsStyle`, `boutonBase`, `eyebrowStyle`…). Module de constantes, pas un composant | ~70 |

**Piège d'encapsulation à écrire dans le plan** : `CarteDetenteurs` ne cherche **jamais** dans le DOM de `CarteProse`, et les deux ne partagent aucun texte recopié — tout littéral d'écran vit dans `textes.ts`. `BarreLancer` expose une **intention** (`onLancer`, `onAnnuler`, `enCours`), jamais un `ref` ni un `getBouton()`.

**Un état illégal à ne pas recréer, et c'est moi qui l'ai rejeté une fois (BUG-082)** : aujourd'hui `useDemandeCopilote` porte une phase `'decide'` **et** `PanneauCopilote` porte `decisionAffichee` — deux états pour ce qui est affiché. Avec une décision **par ligne** pour les détenteurs, le porter dans le hook le rend faux. **Correctif retenu : la phase `'decide'` SORT du hook** (qui garde `repos | en-cours | proposition | echec`, la machine d'APPEL) et la décision vit dans la carte, une fois, typée par carte. C'est une suppression de doublon, pas un ajout.

**Le gel, à généraliser** : accepter le détenteur n° 1 écrit dans le dossier → `useOpenDossier` se réveille → `controlerDossier` recalcule → l'indice peut quitter la liste des signalés **au milieu de l'acceptation**. La proposition ouverte doit donc être **gelée au geste `Lancer`**, exactement comme `valeurAvantGelee` (l. 99-108), jamais re-dérivée au rendu. Sans cette ligne dans le plan, un ouvrier livrera une carte qui s'efface pendant qu'on l'utilise.

## D — Les deux `open_questions` à clore

**n° 5 — `estDisponible()` : ON LA CONSOMME.** Elle passe de zéro appelant à un appelant qui sert **deux** cartes : `PanneauCopilote` calcule `const indisponible = !copilote.estDisponible()` **en ligne au rendu** (jamais un `useState`/`useEffect`, KR-013/113) et le passe aux deux `BarreLancer` comme cause de désactivation, avec une raison nommée pointant l'écran de réglages. Coût : ~4 lignes, zéro contrat modifié, la dette KR-109 se ferme **sans rien retirer**. **Limite à écrire dans la revue, et je ne l'ai pas mesurée** : `estDisponible()` n'est pas réactif (il délègue à `CloudSettingsService.isConfigured()`, aucun abonnement) ; si le panneau n'est pas remonté à la navigation, un réglage posé après coup laisse « Lancer » désactivé jusqu'au remontage. **Le remontage à la navigation est à MESURER au lot feature**, pas à supposer.

**n° 4 — protocole amont : la condition d'ouverture est remplie.** Ce que le comité doit inscrire : **Anthropic Messages, version épinglée `2023-06-01`, est ratifié comme décision de comité** (il est en production, il fonctionne, il est épinglé), ou il est remplacé — mais il cesse d'être « le choix de l'ouvrier ». Exigence architecturale ajoutée : le second rôle **ne doit pas étendre le couplage**. `premierTexte` et le bloc de requête de `handleIa` restent les **deux seuls** sites ; l'entrée `INVITES['indice-detenteurs']` n'apporte que `{systeme, max_tokens}`. Si un rôle exigeait un `tool_use` ou un `response_format`, le couplage se répandrait — **il ne l'exige pas** : la sortie reste du JSON en texte, validée côté client.

## E — DÉCOUPAGE EN LOTS — **2 lots séquentiels, aucun essaim**

> Sur une tranche verticale il n'y a pas de parallélisme à révéler. Deux lots séquentiels, **pas de worktree, pas de fusion**. Précédent : l'it1 de cette même feature.
> **Vérifié ligne à ligne : aucun fichier n'apparaît dans les deux listes.**

### Lot 1 — `tuyau-2` · **`contrat`** · seul, en premier · `dev-contrat` (effort élevé)

But : faire exister le second rôle de bout en bout **sans aucun écran** — route, invite, gabarit, schéma de sortie, profils d'injection, table des rangs, re-résolution, les deux budgets re-dérivés.

Ordre interne : `types.ts` → `schemaSortie.ts` (+ test) → `contexte.ts` (`PROFILS`, rangs, **la mesure de M**) (+ test) → `worker/index.ts` (+ `index.test.ts`) → `frontiere.test.ts` (**paramétré par rôle**) → `CopiloteService.ts` (+ test) → `brain/index.ts` **en dernier**.

| Fichier | N/R |
|---|---|
| `src/brain/copilote/types.ts` | R |
| `src/brain/copilote/schemaSortie.ts` | R |
| `src/brain/copilote/schemaSortie.test.ts` | R |
| `src/brain/copilote/contexte.ts` | R |
| `src/brain/copilote/contexte.test.ts` | R |
| `src/brain/CopiloteService.ts` | R |
| `src/brain/CopiloteService.test.ts` | R |
| `src/brain/index.ts` | R |
| `worker/index.ts` | R |
| `worker/index.test.ts` | R |
| `worker/frontiere.test.ts` | R |

- **Expose** : `RoleCopilote` (2 membres), `CibleProse`, `CibleIndice`, `EchecCopilote`, `ReponseCopilote<P>`, `PropositionDetenteurs`, `DetenteurResolu`, `MotifIllisible` (+`'rang'`), `MotifRefusContexte` (+`'aucun-candidat'`), `CopiloteService` à trois méthodes. **Ne ré-exporte PAS** : `PROFILS`, `rangs`, `RangInjecte`, `DetenteursRendus`, `validerDetenteurs`, `BUDGET_CARACTERES_CONTEXTE`.
- **Consomme, sans les modifier** : `CERTITUDES`/`Certitude`, `collectIds`, `ESPACES_DE_NOMS`, `MARQUEUR_A_ECRIRE`, `DESTINATION_DES_CHAMPS` (import profond, **garde de test** jamais pilote), `CloudSettingsService`.
- ⚠ **Point dur, seul que je ne peux pas trancher seul** : renommer `demander` casse `useDemandeCopilote.ts`, donc le lot 1 **ne passerait pas `tsc` seul** — ce qui est interdit. **Ma recommandation : `useDemandeCopilote.ts` + `useDemandeCopilote.test.tsx` migrent au LOT 1**, où ils subissent la seule adaptation mécanique de signature, et la sortie de la phase `'decide'` (§ C) s'y fait aussi ; le lot 2 consomme alors un hook figé et **ne les touche plus du tout**. Cohérent avec « le contrat d'abord » : le hook EST le contrat d'appel des deux cartes.

### Lot 2 — `deux-cartes` · feature · démarre contrat figé · `dev-lot`

But : la carte 2, l'extraction KR-112, l'acceptation un par un, la consommation d'`estDisponible`.

| Fichier | N/R |
|---|---|
| `src/features/dossier-copilote/components/PanneauCopilote.tsx` | R |
| `src/features/dossier-copilote/components/CarteProse.tsx` | N |
| `src/features/dossier-copilote/components/CarteDetenteurs.tsx` | N |
| `src/features/dossier-copilote/components/LigneDetenteur.tsx` | N |
| `src/features/dossier-copilote/components/BarreLancer.tsx` | N |
| `src/features/dossier-copilote/components/CarteAssistant.tsx` | N |
| `src/features/dossier-copilote/components/styles.ts` | N |
| `src/features/dossier-copilote/components/LigneProposition.tsx` | R |
| `src/features/dossier-copilote/textes.ts` | R |
| `src/features/dossier-copilote/tests/panneauCopilote.test.tsx` | R |
| `src/features/dossier-copilote/tests/acceptation.test.tsx` | R |
| `src/features/dossier-copilote/tests/detenteurs.test.tsx` | N |

- **Consomme** : tout le lot 1 via `brain/`, plus `controlerDossier` / `Controle` / `ControleId` (déjà ré-exportés), `CERTITUDES`, `Savoir`, `Indice`, `localiserEntite`, `DossierService.update`. **Aucun import vers une autre feature** (KR-184).
- **`App.tsx` n'est PAS touché** : la prop sœur est posée depuis l'it1. `tests/cablage.test.ts` reste **vert sans retouche** — une retouche y serait le signal qu'un lot a franchi une frontière.

### Fichiers explicitement HORS de tout lot

`src/brain/dossier/libelles.ts` et `libelles.test.ts` · `src/brain/dossier/destinations.ts` · `src/brain/dossier/controles.ts` · `__fixtures__/dossier-reference.json` · `src/App.tsx` · `tests/cablage.test.ts` · `lintIsolation.test.ts` · **tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`** · `specification.json`.

## F — `REJETÉ`, formulés pour être recopiés tels quels au § 8 du plan

> Rappel BUG-082 : un refus motivé qui reste dans une annexe **n'existe pas pour l'essaim**.

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| TL-1 | Une cible commune `CibleCopilote {entiteId, champ?}` pour les deux rôles | **REJETÉ** | Rend représentable « une demande de prose sans champ » et « une demande de détenteurs avec un champ ». Même famille que l'écho du `champ` rejeté à l'it1 (§ 8 n° 1). Deux cibles, deux méthodes. |
| TL-2 | Une seule méthode `demander(role, dossier, cible, signal?)` | **REJETÉ** | Le couple (rôle, cible) devient un état illégal représentable, et le type de retour n'est plus lisible sans surcharges. Ségrégation d'interface : la carte 1 ne consomme que `demanderProse`. |
| TL-3 | Rendre `CLES_SORTIE` générique pour piloter les deux validateurs | **REJETÉ** | Un registre paramétré pour une prose scalaire ET une collection donne une déclaration unique à deux formes sans raison d'évoluer ensemble, et casse le balayage de source de `GABARIT_SORTIE` ancré ligne-à-ligne (KR-236). |
| TL-4 | Un `if (role === 'indice-detenteurs')` dans `assemblerContexte` | **REJETÉ** | Le corps est le même pour les deux rôles ; ce qui diffère est **d'où partent les chemins**. Un branchement par rôle se dédouble à chaque rôle ajouté (it3, it4), et les six règles d'assemblage cessent d'être prouvables une seule fois. |
| TL-5 | Un drapeau `numerotee: boolean` sur chaque portée | **REJETÉ** | « Au plus une portée numérotée par rôle » deviendrait une convention que deux entrées peuvent contredire, et le rang serait ambigu sans qu'aucun test ne le voie. |
| TL-6 | Accepter les rangs valides d'un lot et écarter ceux qui ne résolvent pas | **REJETÉ** | Réparation silencieuse : l'auteur ratifierait une liste tronquée sans le savoir — la panne exacte que l'`open_question` des six curseurs nomme. |
| TL-7 | Filtrer à l'acceptation les détenteurs qui détiennent déjà l'indice | **REJETÉ** | Le prédicat de candidature appartient à l'assembleur. Le dupliquer à l'acceptation crée deux autorités qui divergeront au premier changement. |
| TL-8 | Une cinquième entrée (`FORMULATION JOUEUR`) dans `LIBELLE_DES_CHAMPS` | **REJETÉ** | Le registre est épinglé à **quatre** entrées (`libelles.test.ts` l. 43-51, `toHaveLength(4)`), et le veto d'encapsulation interdit qu'un `label` du registre vive ailleurs dans `src/` — or `FORMULATION JOUEUR` est la prop `label` de `dossier-registres/components/FicheIndice.tsx:142`, fichier **interdit à cette feature depuis l'it2**. Le refus du rôle détenteurs ne nomme donc **aucun champ**. *(Lecture de source, pas rejeu : à confirmer d'un `jest` ciblé au lot contrat.)* |
| TL-9 | Un `BUDGET_CARACTERES_CONTEXTE` scalaire re-dérivé sur le rôle le plus large | **REJETÉ** | Desserrerait la garde du rôle prose d'un facteur ~5 par la mesure d'un rôle voisin, **sans un seul test rouge** — la définition du garde décoratif (KR-235). |
| TL-10 | Garder le test de LIAISON sur `ROLE = 'personnage-prose'` + un second `it` | **REJETÉ** | Le pouvoir séparateur des deux canaris ne vaut que pour le rôle qui sature le plafond ; épinglé sur le rôle étroit, il reste vert quoi qu'il arrive au rôle large. |
| TL-11 | Découper l'extraction KR-112 et la carte 2 en deux lots | **REJETÉ** | Les deux nomment `PanneauCopilote.tsx` : propriété exclusive violée. Les séparer exigerait un « emplacement » pré-câblé pour un unique consommateur — abstraction à un seul appelant (KR-109). |
| TL-12 | Un troisième lot `worker/` seul | **REJETÉ** | `worker/frontiere.test.ts` importe **des deux côtés** de la frontière : c'est sa raison d'être. Précédent it1. |
| TL-13 | Conserver la phase `'decide'` dans `useDemandeCopilote` en plus de la décision portée par la carte | **REJETÉ** | Deux états pour ce qui est affiché — la forme que j'ai rejetée nommément au raffinage de `dossier-controles` it1 et qui a été livrée quand même (BUG-082). Avec une décision **par ligne**, elle devient en outre inexprimable. |

## G — Ce que je n'ai PAS mesuré (à ne compter comme vérifié par personne)

1. **Aucun test n'a été rejoué.** Toutes mes affirmations sur la couleur d'un test sont des **lectures d'assertions littérales** (`libelles.test.ts` l. 43-51 et 131-140 ; `frontiere.test.ts` l. 37/154/257-258) — à rejouer au lot contrat avant signature.
2. **`M` du rôle `indice-detenteurs`** : non mesuré. Le « ~5× » est une extrapolation ; la liste de chemins du nouveau rôle sera plus étroite que les 12 du rôle prose, donc le facteur réel peut être tout autre. **Hypothèse à mesurer, pas un fait.**
3. **`max_tokens` du nouveau rôle** : non dérivé, formule seulement.
4. **Le remontage du panneau à la navigation** (condition de validité de la consommation d'`estDisponible`) : non mesuré.
5. **L'audience de `monde.indices[].verite`** est `ia` **sous condition d'état** — en **rédaction**, aucun moteur n'a rien constaté. Question de `narratif-ia`, pas la mienne ; je la signale parce qu'elle décide de `CHAMPS_INJECTES` et donc de `M`, donc du lot contrat.
6. **Effet de bord produit non évalué par moi** : accepter un détenteur crée un `Savoir` **sans `revele_si`**, ce qui allume l'avertissement `revelation-sans-porte` du linter. Éteindre un bloquant en allumant une alerte est un arbitrage PM/UX, pas un veto d'architecture — mais il doit être **écrit**, sinon l'itération se démontre en déplaçant un voyant.
7. **`TEXTE_REFUS_TROP_LONG`** (« raccourcissez d'abord la fiche de ce personnage », `textes.ts` l. 52) est **spécifique au rôle prose** : le même motif `'trop-long'` signifie, pour l'autre rôle, « ce dossier a trop de personnages ». La discrimination se fait au composant **sans toucher `brain/`** — mais elle doit être écrite au plan, sinon la carte 2 réutilisera la constante et affichera une consigne fausse.
