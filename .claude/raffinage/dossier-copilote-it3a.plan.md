# Plan d'itération — `dossier-copilote` · itération `3a`

> Statut : **`validé`** — porte 2 franchie le 2026-09-18.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-18
> Composition : **5 rôles** — motif : contrat de sortie IA, invite worker, audiences du dossier.
> Exécution : **séquentielle** (2 lots) — aucun essaim, aucun worktree, aucune fusion.
> Tours : 2. **Aucun veto ne tient contre un contradicteur.** Trois vetos posés (narratif curseurs, TL3a-3, TL3a-5) sont **non contestés** ; le veto conditionnel de la QA s'est dissous par retrait de l'UX.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut faire compléter la façon de parler d'un personnage. » |
| **Tranche** | Carte « faire parler » (4ᵉ carte du panneau Copilote) → `CopiloteService.demander('personnage-repliques', …)` → assemblage à 10 chemins sous garde d'audience → route worker `POST /ia/personnage-repliques` → validation de forme **par élément, refus par lot** → N répliques acceptées ou refusées **une par une, par AJOUT** → `DossierService.update` → `dossier:updated` |
| **Lots** | 2 lots séquentiels · dont `contrat` : **oui** (lot 1, seul et en premier) |
| **Hors périmètre** | `jamais`, `cede_si`, les six curseurs, `controlerDossier` (écran compris), la variante `GROUPE`, l'extraction d'une `BarreDecision`, `PROPOSITIONS_MAX` réutilisée, un prédicat de similarité, tout fichier de `dossier-canon`/`dossier-fiches`/`dossier-registres` |
| **Reporté** | `jamais` et `cede_si` vers `personnage-prose` (prix nommé) · le rétrofit du garde invite↔validateur sur `PROPOSITIONS_MAX` · `BUG-106` · le remontage du panneau |

> **⚠ L'ITÉRATION 3 A ÉTÉ DÉCOUPÉE AVANT RAFFINAGE**, sur mesure. Son `goal` couvrait **quatre familles** jointes par « ou », différentes sur l'axe de risque même de la feature. Découpage validé le 2026-09-18 : **3a** (listes de prose) → **3b** (`plan_actions[]`) → **3c** (`relations[]`). **La tranche 3d est SUPPRIMÉE** par le veto de `narratif-ia` — la feature passe de 4 à **6** itérations, pas 7.

---

## 1 — But raffiné

**À la fin de cette itération, l'auteur peut faire compléter la façon de parler d'un personnage.**

Le copilote propose jusqu'à trois **répliques types** pour `monde.personnages[].caractere.parler[]`, et l'auteur les **accepte ou refuse une par une**. Ce qui est neuf, et c'est tout : une **LISTE de prose libre** — plusieurs valeurs proposées pour un même champ, acceptées **par AJOUT** (une collection n'a pas de case à remplacer), sous le plafond `PARLER_REPLIQUES` que l'éditeur manuel applique déjà.

## 2 — Hors périmètre

- **`caractere.jamais` et `caractere.cede_si`** — des **SCALAIRES** ; un gabarit apparié au rôle ne porte pas deux formes de sortie, et accepter deux fois un scalaire **écrase** la première valeur. **REPORTÉS** avec leur prix nommé.
- **Les six curseurs de caractère** — **non proposables** (veto), donc **3d supprimée**. La variante `GROUPE` de `LigneProposition` perd son unique instance : **non construite** (KR-109), à inscrire, sinon un ouvrier la livrera parce qu'elle est écrite.
- **`controlerDossier` — sort entièrement de la tranche, écran compris.** Le `Select` liste **tous** les personnages.
- L'extraction d'une `BarreDecision` partagée · un 3ᵉ lot `worker/` · un prédicat de similarité · la réutilisation de `PROPOSITIONS_MAX` · l'injection des répliques déjà écrites dans le contexte.
- **`BUG-106`**, le **remontage du panneau à la navigation**, la **recette Worker Route Parity** — dettes ouvertes, ni fermées ni aggravées.
- **Tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`.**

## 3 — Contrat de design

### 3.1 Jetons — tous vérifiés existants, **aucun neuf**
`--border-field` · `--r-md` · `--surface-inset` · `--text-body` · `--text-muted` · `--font-ui` · `--font-mono` · `--fs-body` · `--fs-eyebrow` · `--track-eyebrow` · `--border-rule` · `--accent` · `--space-3/4/8` · `--hit-target`.

### 3.2 Carte 4 — `CarteFaireParler`, **quatrième carte**, jamais une option de la carte 1

Placée **après** `CarteTisserIndices`, **avant** le placeholder « Bientôt ». Ordre de rendu :

1. `Select` **PERSONNAGE** — `label={LABEL_PERSONNAGE}` *(réutilisé)*, **liste complète**, même algorithme que la carte 1 (`localiserEntite('pnj', p, index)`). Vide → `OPTION_AUCUN_PERSONNAGE` *(réutilisée)*.
2. **Bloc « DÉJÀ ÉCRIT »** — `EYEBROW_DEJA_ECRIT` + un bloc de lecture par réplique existante (0 à 2), **non focalisable**. **Gelé au clic « Lancer ».** Il **remplace** une mention de comptage : la liste dit le compte **et** le contenu.
3. `BarreLancer` *(3ᵉ consommateur, non rouvert)*. Désactivation, **ordre de priorité** : (a) `!estDisponible()` → `TITRE_COPILOTE_NON_CONFIGURE` · (b) aucun personnage → `TITRE_AUCUN_PERSONNAGE` · (c) `parler.length >= PARLER_REPLIQUES` → `TITRE_REPLIQUES_AU_PLAFOND` · (d) appel en vol.
4. `MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES` — permanente, `--text-muted`.
5. **Refus / échec** : `⊘ ` + le texte du motif (§ 3.4).
6. **Résultat** : `N × LigneReplique`, séparées par `separateurLigneStyle` *(existant)*.
7. `IssueList` si l'écriture est refusée — proposition et décisions **conservées**.

**Changer de personnage abandonne la proposition et le gel** — même geste que `handleChangerConstat` de la carte 2.

### 3.3 `LigneReplique` — sœur de `LigneDetenteur`, jamais une variante

```ts
export interface LigneRepliqueProps {
	/** Le texte candidat, rendu TEL QUEL — aucun `Field`, aucun `chemin`, aucune
	 *  dépendance à `LIBELLE_DES_CHAMPS` (mur des 4 entrées, veto, 3ᵉ occurrence). */
	texte: string
	decision?: 'acceptee' | 'rejetee'
	/** Plafond atteint compte tenu des répliques GELÉES + des acceptations DE CETTE
	 *  SESSION — jamais lu du dossier vivant (§ 3.5). La ligne reste REJETABLE. */
	accepterDesactive?: boolean
	titreAccepterDesactive?: string
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
export interface LigneRepliqueHandle { focusAccepter: () => void }
```

Bloc de lecture : `1px solid var(--border-field)`, `var(--r-md)`, `var(--surface-inset)`, `var(--text-body)`, `var(--font-ui)`, `var(--fs-body)`, `white-space: pre-wrap` — un `<div>`, **pas un `Field`**. Eyebrow `eyebrowRepliqueProposee(n)`. Actions identiques à `LigneDetenteur` : `IconButton` `+`/`×` (`tone="accent"`/`"danger"`) avant décision ; `Badge` + `LIEN_OUVRIR_FICHE` sur acceptée seule.

### 3.4 Textes exacts — `textes.ts`

```ts
export const CARD4_TITRE = 'Écrire des répliques'
export const CARD4_CORPS =
	"Propose des répliques types, dans la voix de ce personnage — jusqu'à deux par personnage."
export const EYEBROW_DEJA_ECRIT = 'DÉJÀ ÉCRIT'
export const MENTION_ZERO_REPLIQUE =
	"Ce personnage n'a encore aucune réplique type — une proposition acceptée s'ajoute, jusqu'à deux au total."
export const TITRE_REPLIQUES_AU_PLAFOND =
	'Ce personnage a déjà ses deux répliques type — retirez-en une dans Personnages pour en proposer une autre.'
export const TITRE_REPLIQUE_PLAFOND_LIGNE = 'Plafond de deux répliques atteint.'
export function eyebrowRepliqueProposee(n: number): string { return `RÉPLIQUE PROPOSÉE ${n}` }
export const TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES =
	"Ce personnage n'a encore aucune identité écrite — complétez d'abord sa fiche, dans Personnages."
export const TEXTE_REFUS_TROP_LONG_REPLIQUES =
	"Le contexte est trop long pour proposer des répliques — raccourcissez d'abord la fiche de ce personnage."
export const MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES =
	'Chaque lancer repart de zéro : le copilote ne voit pas les répliques déjà écrites de ce personnage, et peut en proposer une très proche.'
```

**RETIRÉS du tour 1 de l'UX** : `LABEL_CHAMP_PARLER` (plus de `SegmentedControl`) · `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` (**zéro producteur** — le vide est un refus) · `MENTION_UNE_REPLIQUE` (le bloc DÉJÀ ÉCRIT porte l'information).
**Réutilisés tels quels** : `LABEL_PERSONNAGE`, `OPTION_AUCUN_PERSONNAGE`, `TITRE_AUCUN_PERSONNAGE`, `TITRE_COPILOTE_NON_CONFIGURE`, `TEXTE_ILLISIBLE`, `TEXTE_INDISPONIBLE`, `texteRefusAEcrire`, `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `LABEL_LANCER`, `LABEL_ANNULER`, `TEXTE_CHARGEMENT`.
**NE PAS réutiliser** : `MENTION_SAVOIR_CREE` · `TEXTE_REFUS_TROP_LONG`/`_DETENTEURS` · `TEXTE_REFUS_CIBLE_A_ECRIRE` · `MENTION_RELANCE_SANS_MEMOIRE` — chaque rôle porte le sien.

**`LIBELLE_DES_CHAMPS` reste à QUATRE entrées.** Le champ se nomme **en prose française minuscule**. **Corollaire de même rang, que le témoin ne voit pas** : le composant neuf ne porte **pas** `label="RÉPLIQUE"` — ce serait un second domicile d'un libellé que `BlocCaractere.tsx` possède, invisible à `libelles.test.ts` puisque le mot n'est pas dans le registre. **Seul ce plan garde ce cas-là.**

### 3.5 Le gel, et la dérivation qui ferme `BUG-106`

```ts
// figé au clic Lancer, jamais relu du dossier vivant :
const dejaEcritesGelees = personnageParId(personnageId)?.caractere?.parler ?? []
// dérivé EN LIGNE à chaque rendu (KR-013/113), jamais un state dupliqué :
const compteurAccepte = dejaEcritesGelees.length + Object.values(decisions).filter((d) => d === 'acceptee').length
const accepterDesactive = compteurAccepte >= PARLER_REPLIQUES  // IMPORTÉE, jamais retapée
```
`dossier` est un abonnement réveillé par `dossier:updated`, **donc par l'acceptation elle-même** : sans le gel, le compteur retombe dans la course de `BUG-097`/`BUG-101`. Focus post-décision : la prochaine ligne non décidée **et** sous le plafond, calculée sur `decisionsApres` **passé en paramètre** — jamais relu d'un state pas encore commité. Une ligne au plafond est **sautée**, jamais ciblée.

### 3.6 Clavier
`Select` → (bloc DÉJÀ ÉCRIT, non focalisable) → `BarreLancer` (Entrée = clic natif, Échap en vol = Annuler) → pour chaque ligne : `+` puis `×`.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService.demander` | service | fournit | **3ᵉ surcharge** — aucun membre ajouté |
| `CibleRepliques` | type | fournit | `{ personnageId: string }` |
| `ReponseRepliques`, `PropositionRepliques` | type | fournit | § 4.1 |
| `RoleCopilote` | type | fournit | **trois** membres |
| `PARLER_REPLIQUES` | registre | consomme | **déjà exporté** — zéro ligne |
| `DossierService.update` | service | consomme | inchangée |
| `dossier:updated` | événement | émet | `{ dossierId }` |

### 4.1 `src/brain/copilote/types.ts` (R)

```ts
/** TROIS rôles. Le nom se lit ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ — « les répliques
 *  d'un personnage ». `'personnage-voix'` est ÉCARTÉ : ce qu'on demande n'est pas
 *  *une voix* (abstraction qui invite une DESCRIPTION de la voix) mais DES RÉPLIQUES.
 *  Un seul mot traverse le rôle, la clé de fil, le validateur et la borne — aucune
 *  surface d'« harmonisation » pour un ouvrier.
 *  ⚠ SANS ACCENT : `'personnage-répliques'` sortirait de la classe `[a-z-]+` de
 *  l'expression d'extraction, le gabarit ne serait pas extrait, et la totalité
 *  rougirait PAR LE MAUVAIS MESSAGE. */
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques'

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, un tableau de PROSE LIBRE.
 *  Aucun écho du champ : le RÔLE est le champ. NON ré-exportée par `brain/index.ts`. */
export interface RepliquesRendues { repliques: readonly string[] }

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `RepliquesRendues` (KR-231).
 *  `ajouts` et NON `textes` : à une lettre de `PropositionResolue.texte`.
 *  `ajouts` et NON `parler` : un champ homonyme du document inviterait
 *  `{...caractere, parler: proposition.parler}` — un ÉCRASEMENT. Le nom porte la
 *  sémantique d'écriture. */
export interface PropositionRepliques { personnageId: string; ajouts: readonly string[] }

// ── INCHANGÉS : ChampProseCle, CHAMPS_PROPOSABLES (aucune entrée), ChampProseChemin,
//    PropositionRendue, PropositionResolue, RangInjecte, DetenteursRendus,
//    PropositionDetenteurs.
```

### 4.2 `src/brain/copilote/schemaSortie.ts` (R)

```ts
export const CLES_SORTIE_REPLIQUES = ['repliques'] as const

/** LA FORME DE LA RÉPONSE ATTENDUE — même statut que `max_tokens`, jamais une règle
 *  du dossier. Elle dérive `max_tokens`.
 *  ⚠ CE N'EST PAS `PARLER_REPLIQUES` (= 2) et elle ne s'y aligne JAMAIS. Le nombre de
 *  propositions ACCEPTABLES vaut `PARLER_REPLIQUES − parler.length` et VARIE d'un
 *  personnage à l'autre : `PARLER_REPLIQUES` n'est même pas une constante du point de
 *  vue de l'invite. Borner le validateur à 2 refuserait `schema` une réponse CONFORME
 *  à une invite qui en demande trois — rejeu, terminal, et RIEN NE ROUGIT.
 *  CE FICHIER N'IMPORTE JAMAIS `PARLER_REPLIQUES`.
 *  ⚠ CE N'EST PAS `PROPOSITIONS_MAX` : celle-ci borne le rôle détenteurs et dérive SON
 *  `max_tokens`. Même valeur aujourd'hui, aucune raison commune d'évoluer. */
export const REPLIQUES_PROPOSEES_MAX = 3

/** ⚠ FORME D'ÉCRITURE IMPOSÉE, identique des DEUX côtés : une entrée par ligne, UNE
 *  tabulation, guillemets simples, virgule finale, clé en minuscules-tirets. Et
 *  AUCUNE autre ligne `'clé-minuscule': 'valeur',` à une tabulation dans ce fichier
 *  ni dans `worker/index.ts` — elle serait absorbée comme un gabarit. */
export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
	'personnage-repliques': '{"repliques": ["…", "…"]}',
}

/** `MotifIllisible` est INCHANGÉE — aucun membre neuf. Le retour ne nomme que les
 *  motifs ATTEIGNABLES : `'rang-inconnu'` est SANS OBJET ici (aucun jeton, aucune
 *  appartenance), l'écrire serait du code mort présenté comme de la couverture. */
export function validerRepliques(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & RepliquesRendues) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
```

**Dix prédicats, dans l'ordre, chacun prouvable seul :**

| # | Prédicat | Motif |
|---|---|---|
| 1 | objet simple (ni tableau, ni `null`) | `schema` |
| 2 | clés = **exactement** `CLES_SORTIE_REPLIQUES` — une clé en trop est un **refus** | `schema` |
| 3 | `Array.isArray(brut.repliques)` | `schema` |
| 4 | chaque élément est une **chaîne** — un `{texte:"…"}` emballé meurt ici ; **jamais** `String(élément)` | `schema` |
| 5 | longueur ≤ `REPLIQUES_PROPOSEES_MAX` — **refus, jamais troncature** (KR-230) | `schema` |
| 6 | longueur **≥ 1** | `vide` |
| 7 | chaque élément non vide après `trim()` | `vide` |
| 8 | éléments **distincts** après `trim()` | `schema` |
| 9 | aucun `MARQUEUR_A_ECRIRE` (constante **importée**, KR-223) | `marqueur` |
| 10 | aucun identifiant du dossier — **`porteUnIdentifiant` réutilisée telle quelle** (KR-117) | `identifiant` |

**Motif du (8), exigé par la QA plutôt que recopié de l'it2** : deux répliques identiques sont un **remplissage** — un menu de 2 présenté comme un menu de 3, produit par un modèle qui « complète » pour atteindre la borne. Et `PARLER_REPLIQUES = 2` est un plafond serré : **un doublon accepté consomme l'un des deux seuls emplacements pour rien**, ce qui est bien une conséquence d'écriture.

**Scanner PAR ÉLÉMENT (`.some`), refus PAR LOT. JAMAIS de `join` avant scan** : deux fragments logés dans deux cases distinctes ne forment pas un identifiant — aucun lecteur ne les lira collés — et joindre **détruit la localisation** de l'élément fautif tout en fabriquant un faux positif à la frontière.

### 4.3 `src/brain/copilote/contexte.ts` (R)

```ts
CHAMPS_INJECTES['personnage-repliques'] = [
	'canon.ton',                                   // REQUIS
	'canon.interdits_ton[]',
	'canon.partage.accroche_joueur',
	'monde.personnages[].fonction',
	'monde.personnages[].apparence',
	'monde.personnages[].description_joueur',
	'monde.personnages[].but.libelle',
	'monde.personnages[].but.pourquoi',
	'monde.personnages[].caractere.jamais',        // LA LIMITE : elle borne ce qu'il peut dire
	'monde.personnages[].plan_actions[].action',   // NON tronqué
]
PARTIES_REQUISES['personnage-repliques'] = ['canon.ton']
BUDGET_CARACTERES_CONTEXTE['personnage-repliques'] = 0  // ⚠ À MESURER AU LOT 1. Ne JAMAIS livrer un 0.
export function assemblerRepliques(dossier: Dossier, cible: CibleRepliques): ContexteProse
```

**Les dix ont déjà la destination `'ia'` — aucune ligne neuve dans `destinations.ts`, `DEROGATIONS_AUDIENCE` reste vide et assertée vide.**

**RETIRÉS, et c'est la décision de contexte de cette tranche :**
- **`canon.mj.synopsis_mj`** — présent chez `personnage-prose`, **absent ici**. Ce qu'il apporte à l'écriture d'une voix : presque rien. Ce qu'il risque : une réplique qui le **paraphrase** met du savoir MJ dans une phrase que le Temps 2 donnera au rôle **acteur** et fera **prononcer** — alors qu'une note de fiche est **lue** par un narrateur. **Asymétrie du regret.** Le rôle est **strictement plus étroit** que `personnage-prose`.
- **`cede_si`** — prédicat conditionné par RÔLE ; un rôle de rédaction n'est ni narrateur, ni acteur du porteur, ni arbitre : le prédicat **n'a pas de sujet**, il est **inapplicable**, et l'inapplicable ne s'injecte pas. **PROPOSER n'est pas INJECTER.**
- **`caractere.curseurs.*`** — jamais (veto).
- **LA CIBLE `caractere.parler[]`, exclue PAR ABSENCE de la liste blanche, jamais par un saut à l'exécution.** Un chemin listé puis systématiquement sauté serait une **ligne morte** (KR-235), et un bogue de cible pourrait le ré-ouvrir ; une absence ne se ré-ouvre pas.

`ContexteProse` **réutilisé sans alias** — un `type ContexteRepliques = ContexteProse` serait une abstraction à un seul appelant ; le renommer rouvrirait la signature de l'it1 (dette nommée, rang de `CibleCopilote`).

**`assemblerRepliques` — troisième fonction nommée, zéro branche de rôle**, primitives partagées. **Refus, ordre figé, tous AVANT le moindre `fetch`** :
1. `a-ecrire` (charge `'canon.ton'`) ;
2. **`cible-a-ecrire`** (motif **réutilisé**, sans charge) — **aucun** des sept chemins de préfixe `monde.personnages[].` ne résout non vide. **C'est ici que la garde « identité du personnage » des `open_questions` trouve sa condition d'ouverture** : le prédicat de vacuité qu'elle exigeait **existe déjà** — `estRedige` (`contexte.ts:239`, `trim() !== '' && !includes(MARQUEUR_A_ECRIRE)`), **module-local et non exportée**, donc appelable telle quelle depuis `assemblerRepliques` qui vit dans le même fichier : **rien à exporter, rien à déplacer.** ⚠ **Ce qui EST neuf, et le plan ne le maquille pas** : l'it2 teste **UN chemin nommé** (`chemin === CHEMIN_VERITE_CIBLE && textes.length === 0`, l. 383) ; ici c'est une **disjonction sur sept chemins**. Le prédicat est réutilisé, **le quantificateur ne l'est pas** — c'est la seule pièce de mécanisme à écrire, et elle n'introduit **aucun seuil numérique**. **Discriminant à écrire** : *on peut inventer une FONCTION à partir de rien — c'est la page blanche que le goal nomme ; on ne peut pas inventer une VOIX à partir de rien. Le garde vaut pour ce rôle, et pour lui seul* ;
3. `trop-long` — refus, **jamais** de coupe.

⚠ **`'aucun-candidat'` est SANS OBJET** — une seule entité, aucun rang. Ne pas l'écrire.

### 4.4 `src/brain/CopiloteService.ts` (R)

```ts
/** Pas d'`entiteId`, et ce n'est PAS une préférence de nommage : le dispatch est un
 *  rétrécissement STRUCTUREL, donc les TROIS cibles doivent être DISJOINTES DEUX À
 *  DEUX. Avec `entiteId`, une VARIABLE de type `CibleCopilote` s'assignerait ici sans
 *  erreur — le contrôle d'excédent ne vaut que sur un littéral — et repartirait dans
 *  la branche PROSE : rôle annoncé A, validateur exécuté B, `tsc` vert. */
export interface CibleRepliques { personnageId: string }

export type ReponseRepliques = { statut: 'propose'; proposition: PropositionRepliques } | EchecCopilote

demander(role: 'personnage-repliques', dossier: Dossier, cible: CibleRepliques, signal?: AbortSignal): Promise<ReponseRepliques>

type CorpsDemande =
	| { role: 'personnage-prose'; champ: ChampProseChemin; contexte: string }
	| { role: 'indice-detenteurs'; contexte: string }
	| { role: 'personnage-repliques'; contexte: string }   // SANS `champ` : le rôle EST le champ

// LE DISPATCH — l'ancien dernier `return` était un REPLI vers `demanderDetenteurs` :
// une 3ᵉ cible y tombait PAR DÉFAUT. Il devient une BRANCHE.
if ('champ' in cible) return demanderProse(dossier, cible, signal)
if ('indiceId' in cible) return demanderDetenteurs(dossier, cible, signal)
return demanderRepliques(dossier, cible, signal)

// re-résolution, ligne exacte :
return { statut: 'propose', proposition: { personnageId: cible.personnageId, ajouts: issue.sortie } }
```
**La 3ᵉ surcharge n'ajoute AUCUN MEMBRE** : les **quatre** bouchons `{ estDisponible, demander }` restent complets. `EchecCopilote`, `MotifRefusContexte`, `MotifIllisible`, `jusquAuRejeuUnique`, `unAller` : **INCHANGÉS**. Route `/ia/personnage-repliques`.

`brain/index.ts` ré-exporte `CibleRepliques`, `ReponseRepliques`, `PropositionRepliques`. **`RepliquesRendues` jamais** (forme réseau). **`REPLIQUES_PROPOSEES_MAX` non ré-exportée** — le lot 2 n'en a pas besoin. **`PARLER_REPLIQUES` déjà exportée** — zéro ligne.

### 4.5 `worker/frontiere.test.ts` (R) — **deux instruments à réparer avant toute mesure**

**(a) La mine de la ligne 384.** MESURÉ par la QA sur sonde jetable : l'assertion actuelle `expect(new Set(ROLES.map(r => BUDGETS[r])).size).toBe(ROLES.length)` **échoue** (`Received: 2, Expected: 3`) dès que deux budgets s'égalisent. Elle asserte **une propriété que personne n'a voulue**. Remplacement, **mesuré séparateur** (cas négatif exécuté, rouge) :
```ts
expect(ROLES.filter((r) => BUDGETS[r] === BUDGETS[ROLE_LE_PLUS_LARGE])).toEqual([ROLE_LE_PLUS_LARGE])
```
**Motif à inscrire, et il a changé entre les deux tours** : la correction **n'est pas** requise parce que la ligne va rougir — avec `synopsis_mj` retiré elle restera probablement **verte**. Elle est requise **parce qu'elle sera verte par accident de longueur de fixture** : personne ne la corrigera, et c'est **3b** qui paiera le quatrième rôle sans marge.

**(b) Le canari croisé.** MESURÉ par deux postes indépendamment : `croiser` est une **rotation de 1**, dérangement pour tout n ≥ 2 — donc **vert à trois rôles sans plus rien prouver**. À deux rôles, « tout est décalé » et « deux sont intervertis » sont le **même** événement ; à trois ils divergent, et le défaut réaliste (deux lignes interverties en éditant) **cesse d'être l'objet du canari**. Remplacement retenu (celui de la QA, **plus direct et générique à N** que les transpositions) :
```ts
// PRÉCONDITION, à écrire D'ABORD : aucun gabarit n'est sous-chaîne d'un autre,
// sinon le filtre rougit sans défaut.
for (const r of ROLES) expect(ROLES.filter((a) => a !== r && INVITES[r].systeme.includes(gabarit(a)))).toEqual([])
```
La **rotation est conservée** comme canari de dérangement total.

**(c) Garde invite ↔ validateur** — la duplication « trois » (worker) / `REPLIQUES_PROPOSEES_MAX` (client) est **inévitable** (aucun import `worker/` → `src/`) et **aujourd'hui non gardée**. Une duplication qu'on ne peut pas supprimer se **garde** :
```ts
expect(REPLIQUES_PROPOSEES_MAX).toBe(3)
expect(INVITES['personnage-repliques'].systeme).toContain('trois au plus')
```
**Limite déclarée** : ce garde épingle **le mot**, pas la sémantique.

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Rôle** | `'personnage-repliques'` · route `POST /ia/personnage-repliques` · cible `{ personnageId }` |
| **Contexte** | **10 chemins**, tous `'ia'`, `DEROGATIONS_AUDIENCE` vide et assertée vide. **`synopsis_mj` retiré**, **la cible absente par absence** |
| **Sortie** | `{"repliques": ["…", "…"]}` — une clé, tableau de prose, `1 ≤ longueur ≤ 3`, éléments distincts et non vides |
| **Échec** | Rejeu **exactement une fois**, puis **terminal** `illisible`. **Refus du LOT ENTIER** sur un seul élément fautif. **La sortie fautive n'est JAMAIS affichée** |
| **Ce que l'IA ne fait PAS** | aucun entier, aucun identifiant, aucun nom · **elle n'écrit jamais `caractere.curseurs`** — l'acceptation écrit `caractere: { parler: [...déjà, texte] }` **et rien d'autre** |
| **Mémoire** | **aucune** — deux lancers ⇒ deux corps identiques. **Asymétrie avec l'it2, à écrire** : un détenteur accepté devenait *inénonçable* ; **une réplique acceptée n'est pas injectée**, donc elle **peut** être re-proposée |

**Le discriminant du vide — recopiable tel quel, et il ne se transporte pas de l'it2** :
> **DÉSIGNATION vs RÉDACTION.** Un rôle de **DÉSIGNATION** demande de choisir dans un **ensemble fermé que le contexte a fourni** ; la question porte sur un **fait du monde** et « personne » en est une réponse **vraie** — liste vide = **SUCCÈS**, la punir fabrique une machine à complaisance. Un rôle de **RÉDACTION** demande d'**écrire un texte que rien ne fournit** ; « comment parle-t-il ? » a toujours une réponse dès qu'il existe quelqu'un pour parler — « je n'écris rien » est une **non-réponse**, liste vide = **REFUS**, motif `vide`. Le cas « il n'y a personne pour parler » est traité **avant l'appel**, par `cible-a-ecrire`.
> **Test de rattachement, décidable sans rouvrir le débat** : *le rôle rend-il des **jetons que le contexte a fournis** (désignation) ou de la **prose que rien ne fournit** (rédaction) ?*

**L'invite — MOT POUR MOT**, `INVITES['personnage-repliques']` :
```
Tu assistes l'AUTEUR d'un livre-jeu qui règle la façon de parler d'un personnage.
À partir du contexte fourni, tu proposes des répliques types : de courtes phrases que CE personnage-là pourrait dire, telles qu'il les dirait.

Tu réponds par un objet JSON et rien d'autre, de la forme {"repliques": ["…", "…"]} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Chaque réplique est un ÉCHANTILLON DE VOIX : elle servira plus tard à faire parler ce personnage dans des scènes que tu ne connais pas, elle ne sera jamais lue telle quelle à un joueur.
Tu en donnes trois au plus, et au moins une : même quand le contexte est maigre, une fonction et un but suffisent à faire entendre une voix.
Elles sont toutes différentes, chacune tenant en une ou deux phrases.
Chaque réplique ne dit que ce que CE personnage sait et dirait lui-même : ni ce que l'auteur sait, ni ce qui va se passer, ni ce qu'un autre personnage tait.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```
Le gabarit est **incrusté** par `${GABARIT_SORTIE['personnage-repliques']}`, jamais retapé.

**Les quatre décisions de cette invite, à ne pas « corriger »** : (1) « ÉCHANTILLON DE VOIX » énonce la **DESTINATION**, jamais le champ ni sa doctrine — **aucun validateur ne peut constater cette propriété** (KR-229), l'invite est le seul endroit qui reste ; (2) **le piège de recopie sur la voix** — l'it1 écrit « une NOTE DE FICHE » parce que ses proses sont des **descriptions** ; une réplique est une **phrase prononcée**, et recopier la ligne de l'it1 produirait **des descriptions de voix au lieu de voix** ; (3) « trois au plus » est **en plus** du contrat, jamais à la place — ⚠ **l'invite ne dit JAMAIS « deux au plus »** ; (4) **« et au moins une »** est la moitié symétrique de l'it2 : sans elle, invite et validateur se contrediraient.

**Ce que l'invite n'a PAS le droit de réciter** : `PARLER_REPLIQUES` ni son chiffre · le nom du champ `parler` · les six curseurs, leurs noms, leur échelle, leur paraphrase · les seuils, tiers, caractéristiques · le message ou le seuil d'un contrôle · la table d'audience.

**`max_tokens: 400` — dérivé** : plus longue réplique **attestée sur deux sources indépendantes** = 74 caractères ; `3 × 74 + 27` d'enveloppe ⇒ `L ≈ 249` ; `r = 2` (pire ratio) ⇒ 373,5 ⇒ **400**. ⚠ **Le résultat dépend du ratio** (300 vs 400) — ce n'est **pas** robuste comme l'était l'entrée détenteurs ; on prend le pire **et on le dit**. **Mode d'échec nommé** : trois répliques très longues feraient **tronquer le JSON** ⇒ `schema` ⇒ rejeu ⇒ terminal — c'est le **bon** échec, déclaré ici plutôt que découvert au runtime.

**Budget** : `ceil(M × 3 / 1000) × 1000`, **après avoir asserté que les dix chemins résolvent non vides** — sinon le nombre est un **plancher**. Attendu (estimation, non mesurée) : `M ≈ 1200-1350` ⇒ **4000 ou 5000**. **Si la mesure déplaît, on retire un chemin — on ne monte jamais le budget, et on ne le baisse pas non plus pour faire verdir un test.**

## 5 — Lots

> **La frontière des lots EST la frontière de feature**, vérifiable d'un préfixe de chemin. Lot 1 ∌ `src/features/**` ; lot 2 ⊂ `src/features/dossier-copilote/**`.
> **Le lot 1 passe `tsc --noEmit` + `jest` SEUL** — c'est ce qui interdit d'ajouter un membre à `CopiloteService`.

### Lot 1 — `troisieme-role` · `contrat` · `dev-contrat` (effort élevé, seul et en premier)
**Fichiers (11)** : `src/brain/copilote/types.ts` (R) · `schemaSortie.ts` (R) · `schemaSortie.test.ts` (R) · `contexte.ts` (R) · `contexte.test.ts` (R) · `src/brain/CopiloteService.ts` (R) · `CopiloteService.test.ts` (R) · `src/brain/index.ts` (R) · `worker/index.ts` (R) · `worker/index.test.ts` (R) · `worker/frontiere.test.ts` (R)
**Ordre interne imposé** : `types` → `schemaSortie` (+ test) → `contexte` (+ test, **la mesure de M**) → `CopiloteService` (+ test) → `worker/index` (+ test) → `frontiere.test.ts` (**la mine l. 384 d'abord, le canari ensuite**) → `brain/index.ts` **en dernier**.
**Critères couverts** : #1 à #6

### Lot 2 — `carte-repliques` · feature · `dev-lot` (démarre contrat figé)
**Fichiers (7)** : `components/CarteFaireParler.tsx` (N) · `components/LigneReplique.tsx` (N) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R) · `textes.ts` (R) · `tests/repliques.test.tsx` (N) · `tests/panneauCopilote.test.tsx` (R — **l. 100**, `toHaveLength(2)` → `3`, **pour cette raison seule**)
**Signature CONSOMMÉE, figée par le lot 1** — le lot 2 n'en écrit aucune :
`demander('personnage-repliques', dossier, { personnageId }, signal): Promise<ReponseRepliques>` · `PropositionRepliques { personnageId, ajouts }` · `PARLER_REPLIQUES` (importée de `brain/dossier/curseurs.ts`, jamais retapée) · `DossierService.update`.
**Signature EXPOSÉE** : `LigneRepliqueProps` / `LigneRepliqueHandle` (§ 3.3) — internes à la feature, non ré-exportées par `index.ts`.
**Critères couverts** : #7, #8

### Fichiers HORS de tout lot
`hooks/useDemandeCopilote.ts` *(générique `<C,P>` — un diff y est le signal d'une frontière franchie)* · `LigneProposition.tsx` · `LigneDetenteur.tsx` · `CarteCompleterFiche.tsx` · `CarteTisserIndices.tsx` · `CarteAssistant.tsx` · `BarreLancer.tsx` · `tests/{acceptation,detenteurs,useDemandeCopilote,cablage}` · `index.ts` · `App.tsx` · `brain/dossier/{libelles,libelles.test,curseurs,controles,validate,tables,destinations}.ts` · `brain/components/Select.tsx` · `__fixtures__/dossier-reference.json` · `lintIsolation.test.ts` · **tout `dossier-canon`/`dossier-fiches`/`dossier-registres`** · `specification.json`.

### 5.1 — Ce que le lot 1 doit MESURER *(jamais déduire)*
1. `M` **après assertion que les dix chemins résolvent non vides** ⇒ budget. **Jamais livrer le `0`.**
2. `TAILLE_MAX_CORPS_IA` **constaté** sur trois rôles — « inchangé » est une mesure.
3. `max_tokens` **dérivé**, jamais recopié de 400, 200 ni 100.
4. Le canari croisé **et sa précondition** — pouvoir séparateur **vu rouge**, et **si la même fabrication fait rougir la précondition ET le filtre, le pouvoir séparateur de l'un n'est pas établi** : deux jeux distincts.
5. `frontiere.test.ts:384` remplacé, **cas négatif vu rouge**.
6. La 3ᵉ surcharge ne casse **aucun des quatre bouchons** : `tsc` sur le lot 1 **seul**.
7. `@ts-expect-error` **rouge sur chaque couple (rôle, cible) illégal** — six couples.
8. Mutants **vus rouges** : « ne scanner que `[0]` », « `.join()` avant de scanner », « repêchage partiel ». Les deux canaris de l'it1 rejoués sur un élément **non-0**.
9. Le garde invite↔validateur : **cas négatif fabriqué** — un `toContain` est inerte sans lui.
10. Le témoin de confinement : **les deux côtés** — l'assertion négative est inerte seule.
11. `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `destinations` : **verts sans une retouche**.

## 6 — Critères d'acceptation

1. **Étant donné** le contexte assemblé pour `'personnage-repliques'`, **quand** le test de confinement tourne, **alors** les dix chemins ont la destination `'ia'`, `DEROGATIONS_AUDIENCE` est vide et assertée vide, **`cede_si` est absent de chaque entrée** de `CHAMPS_INJECTES`, **`caractere.parler[]` est absent de l'entrée du rôle neuf** (par absence, jamais par un saut à l'exécution), et `synopsis_mj` est absent **du texte de ce rôle** tout en restant **présent dans celui de `personnage-prose`** — *contrat* — *lot 1*

   > ⚠ **RÉDACTION CORRIGÉE APRÈS LIVRAISON, le 2026-09-18, sur validation de l'auteur.** La version signée écrivait « `caractere.parler[]` **et** `cede_si` sont absents de **chaque entrée** », collapsant **deux portées différentes** que le § 4.3 et le § 7 distinguaient correctement (« `cede_si` absent de **CHAQUE** entree » contre « la cible est absente de **la** liste blanche », singulier). `'monde.personnages[].caractere.parler[]'` est dans l'entrée `personnage-prose` **depuis l'it1** ; l'en retirer aurait changé le contexte d'un rôle **livré** et invalidé son budget mesuré de 6000, ce que le § 2 et le désaccord n° 35 interdisent tous deux. **Le code livré est conforme à l'intention ; c'est le critère qui était mal écrit.** Leçon portée au `RETOUR-COMITÉ` de la revue : un critère qui porte un quantificateur universel doit nommer son ensemble.
2. **Étant donné** un personnage dont aucun champ d'identité n'est rédigé, **quand** l'auteur lance l'assistant, **alors** la demande est refusée `cible-a-ecrire` **sans qu'aucun appel réseau ne parte**, et les trois motifs de refus sont **discriminés dans le même test** — *contrat* — *lot 1*
3. **Étant donné** `{"repliques": []}` puis `{"repliques": ["une phrase juste", "   "]}`, **quand** elles sont validées, **alors** les **deux** sont refusées motif `vide` par **deux prédicats distincts**, chacun rougissant seul si l'autre est neutralisé — *contrat* — *lot 1*
4. **Étant donné** une liste dont **le dernier** élément porte un identifiant du dossier, **quand** elle est validée, **alors** le **lot entier** est refusé (jamais les éléments sains repêchés), le scanner ayant été appliqué **par élément et sans `join`** ; le service rejoue **exactement une fois** puis rend un état terminal — *contrat* — *lot 1*
5. **Étant donné** les trois rôles, **quand** le garde KR-236 tourne, **alors** aucun gabarit n'est sous-chaîne d'un autre, aucune invite ne contient le gabarit d'un **autre** rôle, et **chacune des trois transpositions fait rougir** — *contrat* — *lot 1*
6. **Étant donné** `BUDGET_CARACTERES_CONTEXTE` à trois entrées, **quand** le test de liaison tourne, **alors** le budget du rôle neuf est celui **mesuré** (jamais `0`, jamais recopié), le maximum est atteint par **exactement un** rôle — **avec son cas négatif rouge** — et la borne écrite dans l'invite est celle du validateur — *contrat* — *lot 1*
7. **Étant donné** un personnage portant déjà une réplique, **quand** l'auteur accepte une proposition, **alors** elle est **AJOUTÉE** (l'existante est conservée), `caractere` est créé **sans aucun curseur** si absent, l'écriture passe par `DossierService.update` dans l'ordre persistance-puis-événement, et **la ligne suivante devient non acceptable** (`PARLER_REPLIQUES` importée), sans que le focus ne la cible — *composant* — *lot 2*
8. **Étant donné** un personnage sans réplique, **quand** l'auteur lance puis accepte deux propositions, **alors** son `parler[]` en porte deux et le dossier reste accepté par `validateDossier` ; **et** étant donné une écriture refusée, **alors** rien n'est persisté et la proposition reste affichée — *bout-en-bout* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| `types › zero cle commune reseau / resolu` | `RepliquesRendues` × `PropositionRepliques` : intersection de clés **vide**, épinglée par un `@ts-expect-error` sur une affectation croisée | compile-time | KR-231 | 1 |
| `contexte › confinement du 3e role` | 10 chemins `'ia'` ; `DEROGATIONS_AUDIENCE` vide | jest | KR-232 | 1 |
| `contexte › synopsis_mj absent ici, PRÉSENT chez prose` | les **deux** côtés | jest | asymétrie du regret | 1 |
| `contexte › cede_si absent de CHAQUE entree` | garde TL3a-14 | jest | KR-232 | 1 |
| `contexte › aucun chemin caractere.curseurs.* nulle part` | garde du veto | jest | veto curseurs | 1 |
| `contexte › la cible est absente de la liste blanche` | pas de saut à l'exécution | jest | KR-235 | 1 |
| `contexte › les trois refus, discrimines, 0 fetch` | 3 motifs distincts | jest | KR-171 | 1 |
| `contexte › BUDGET du 3e role, mesuré` | `ceil(M×3/1000)×1000`, jamais `0` | jest | KR-235 | 1 |
| `schemaSortie › liste vide refusee, motif vide` | prédicat (6) seul | jest | **vide** | 1 |
| `schemaSortie › element blanc APRÈS un valide` | prédicat (7) seul, index ≥ 1 | jest | **vide** | 1 |
| `schemaSortie › identifiant en DERNIÈRE position, lot entier` | + mutants « `[0]` seul » et « `join` » **vus rouges** | jest | KR-235, BUG-087 | 1 |
| `schemaSortie › repechage partiel` | mutant écrit, **vu rouge** | jest | BUG-087 | 1 |
| `schemaSortie › doublon apres trim refuse` | motivation `PARLER_REPLIQUES=2` **en commentaire** | jest | **doublon** | 1 |
| `schemaSortie › marqueur a ecrire refuse, constante IMPORTÉE` | le test **importe** `MARQUEUR_A_ECRIRE`, ne le retape pas | jest | KR-223 | 1 |
| `schemaSortie › 4 refusees, 3 acceptees` | `REPLIQUES_PROPOSEES_MAX` par **comportement** | jest | borne de sortie | 1 |
| `CopiloteService › @ts-expect-error sur les six couples illegaux` | non-assignabilité structurelle | compile-time | TL3a-5 | 1 |
| `CopiloteService › rejeu une fois puis terminal` | 2 appels jamais 3 — **deux tests séparés** | jest | KR-230 | 1 |
| `CopiloteService › deux lancers, deux corps identiques` | égalité stricte | jest | mémoire | 1 |
| `frontiere › precondition — aucun gabarit sous-chaine d un autre` | **avant** le canari | jest | KR-236 | 1 |
| `frontiere › aucune invite ne contient le gabarit d un autre role` | balayage exhaustif ; 3 transpositions **rouges** | jest | KR-236 | 1 |
| `frontiere › le maximum est atteint par exactement un role` | + **cas négatif rouge** | jest | KR-235 | 1 |
| `frontiere › la borne de l invite est celle du validateur` | + cas négatif | jest | duplication gardée | 1 |
| `worker/index › route du 3e role` | POST, 404, 503, 413, tout en JSON | jest (node) | KR-233 | 1 |
| `repliques.test.tsx › accepter AJOUTE, ne remplace rien` | le tableau croît, l'existante conservée | RTL | AJOUT | 2 |
| `… › caractere cree SANS aucun curseur` | `Object.keys(caractere)` = `['parler']` | RTL | **veto**, KR-221 | 2 |
| `… › la ligne suivante devient non acceptable au plafond` | `PARLER_REPLIQUES` importée | RTL | TL3a-15 | 2 |
| `… › focus ne cible JAMAIS une ligne desactivee` | prophylaxie BUG-106 | RTL | BUG-106 | 2 |
| `… › repliques deja ecrites GELEES au lancement` | régression **BUG-097** | RTL | BUG-097 | 2 |
| `… › ecriture par update, ordre persistance puis evenement` | `invocationCallOrder` | RTL | KR-004 | 2 |
| `… › changer de personnage abandonne proposition et gel` | contrepartie du gel | RTL | BUG-108 | 2 |
| `… › double clic Lancer` | 1 appel | RTL | double soumission | 2 |
| `… › Annuler pendant l appel` | ferme sans décision | RTL | annulation | 2 |
| `… › textes d etat deux a deux distincts` | discriminance | RTL | KR-197/199 | 2 |
| `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `cablage` | **verts sans retouche** | non-régression | KR-187 | revue |

**Non vérifiable en l'état** *(à recopier dans la revue)* :
- **Le pastiche du contexte** et **la redite d'une réplique déjà écrite** — aucun instrument ne constate une paraphrase (KR-229). Seule parade : l'auteur voit l'existant gelé. **Le canal de paraphrase, fermé par la forme à l'it2, est ROUVERT par cette tranche.**
- **La généricité d'une réplique** — le refus `cible-a-ecrire` se teste, la généricité non.
- **La distribution réelle de sortie du modèle** — prémisse de l'arbitrage sur la borne, non mesurable ici.
- **Le remontage du panneau à la navigation** — dette ouverte depuis l'it2, toujours jamais mesurée.
- **`BUG-106`, cas « acceptation au plafond »** — correction bloquée sur `brain/components/Select.tsx`, primitive partagée : **hors périmètre, nommé, non corrigé**.

## 8 — Registre des désaccords

> Tout `REJETÉ` d'annexe est recopié ici (BUG-082).

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | narratif-ia | **Les six curseurs PROPOSABLES** | **VETO — RETENU** | Proposer un chiffre oblige à faire franchir le réseau le registre `CURSEURS` — donnée de **code**, sans clé de schéma donc **sans ligne d'audience** : par l'invite c'est une règle dupliquée code/prompt, par le corps de requête c'est le client qui décide *ce qu'on demande*. **La gravité n'est pas dans la sortie du modèle, elle est dans l'entrée qu'il a fallu ouvrir pour l'obtenir.** Corroboré sur un motif **indépendant** par le tech-lead : `CHAMPS_PROPOSABLES` est à son **plafond naturel à trois entrées**, et **il n'existe pas de version « petite »** de cette décision. **3d SUPPRIMÉE.** |
| 2 | narratif-ia | **Semer `CURSEURS_INITIAUX` en créant le bloc `caractere`** | **RETENU** *(veto requalifié en objection — les curseurs ne sont ni dés, ni stats, ni inventaire, ni XP ; la décision est la même)* | Six valeurs ratifiées **par un geste qui en ratifiait une seule**, alors que le goal dit « rien n'entre sans un geste de l'auteur ». Second dégât : un bloc tout au plancher est **indistinguable d'un réglage délibéré** (KR-221) — le voyant s'éteint sans que personne ait réglé quoi que ce soit. **Écriture imposée : `caractere: { parler: [...déjà, texte] }`, rien d'autre.** |
| 3 | tech-lead (TL3a-3) | **Une 5ᵉ entrée dans `LIBELLE_DES_CHAMPS`** | **VETO — RETENU** | `libelles.test.ts` balaie tout `label="…"` de `src/` et `BlocCaractere.tsx:169` porte `label="RÉPLIQUE"` — fichier **interdit**, 3ᵉ occurrence. **Corollaire, cœur du veto, que le témoin ne voit pas** : le composant neuf ne porte pas non plus ce label — second domicile invisible à l'instrument. **Seul ce plan garde ce cas-là.** |
| 4 | tech-lead (TL3a-5) | **`CibleRepliques { entiteId }`** | **VETO — RETENU** | `entiteId` est commun à `CibleCopilote` : une **variable** s'y assigne sans erreur (contrôle d'excédent limité aux littéraux), le rétrécissement du dispatch redevient faux, rôle A / validateur B, `tsc` vert. **Fait aggravant LU** : le dernier `return` du dispatch est un **repli**, pas une branche. Intégré sans réserve par `narratif-ia`. |
| 5 | tech-lead (TL3a-1) | Une seule tranche pour `parler[]`, `jamais`, `cede_si` | **REJETÉ** | LISTE (accepter k écrit k, par AJOUT) contre SCALAIRES (la 2ᵉ acceptation **écrase** la 1ʳᵉ) : deux sémantiques d'écriture dans une même proposition. Quatre rôles convergent. |
| 6 | tech-lead (TL3a-2) | Loger `jamais`/curseurs dans `CHAMPS_PROPOSABLES` | **REJETÉ** | Valeurs = clés de propriété de **premier niveau**, site d'écriture `{...p, [cle]: texte}`. **Plafond naturel à trois entrées.** |
| 7 | tech-lead (TL3a-4) | Réutiliser `CibleCopilote` élargie | **REJETÉ** | Le dispatch est un rétrécissement structurel sur `'champ' in cible`. |
| 8 | tech-lead (TL3a-6) | Un registre générique de schémas/bornes par rôle | **REJETÉ, 3ᵉ fois** | Critère décidable : un `Record<RoleCopilote, …>` n'est légitime que si **chaque** rôle a une entrée **qui veut dire quelque chose**. Faux pour les clés de sortie et toute borne de liste — le rôle prose n'a pas de liste, son entrée serait un mensonge. |
| 9 | tech-lead (TL3a-7) | Borner la sortie par `PARLER_REPLIQUES` importée | **RETIRÉ PAR SON AUTEUR** | Son motif exigeait la **même grandeur** ; faux — 2 borne le **document**, 3 borne la **réponse**. Et le fait décisif est de `narratif-ia` : **le nombre de propositions acceptables vaut `PARLER_REPLIQUES − parler.length`, il VARIE par personnage** — `PARLER_REPLIQUES` n'est même pas une constante du point de vue de l'invite. Borner le validateur à 2 refuserait `schema` une réponse **conforme**, **sans qu'aucun test ne rougisse**. `REPLIQUES_PROPOSEES_MAX = 3` **RETENU**. |
| 10 | tech-lead (TL3a-8) | Réutiliser un validateur existant | **REJETÉ** | L'un rend un scalaire (3 prédicats sur UNE chaîne), l'autre n'en porte aucun (jetons — vert par construction, BUG-084). Le rôle 3 applique 3 prédicats à **chacun** des N, plus 4 de liste. Partagé → **primitive**, jamais corps paramétré. |
| 11 | tech-lead (TL3a-9) / narratif / QA | « La liste vide est un SUCCÈS » transporté de l'it2 | **REJETÉ** | Discriminant **DÉSIGNATION vs RÉDACTION** (§ 4 bis), recopiable. **L'UX avait écrit l'inverse et l'a RETIRÉ** : `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` n'a **plus aucun producteur** et serait une constante à zéro appelant (KR-109). |
| 12 | tech-lead (TL3a-10) / QA | Écarter les éléments fautifs, garder les autres | **REJETÉ** | Réparation silencieuse : l'auteur ratifierait une liste amputée sans le savoir. Trouvé indépendamment par deux postes. |
| 13 | tech-lead (TL3a-11) | Un 3ᵉ lot `worker/` seul | **REJETÉ** | `frontiere.test.ts` importe des **deux** côtés : c'est sa raison d'être. |
| 14 | tech-lead (TL3a-12) | Extraire dès 3a une `BarreDecision` partagée | **REPORTÉ** | Rouvrirait deux fichiers livrés et intacts. **Condition d'ouverture** : la première itération qui rouvre déjà l'un d'eux, ou une 4ᵉ occurrence. **Compensation obligatoire, faite** : le § 3.3 nomme les jetons exacts. |
| 15 | tech-lead (TL3a-13) | Un segment au `SegmentedControl` de la carte 1 | **REJETÉ** | La moitié **mécanique** du motif est tombée (rien n'oblige une 4ᵉ option à dériver du registre) et l'auteur l'a dit. Ce qui reste et qui tranche : `useDemandeCopilote` est instancié **une fois par appel**, donc deux rôles dans une carte = **deux machines à états** et une correspondance `champChoisi ↔ machine affichée` tenue à la main — le couple (`champ = 'fonction'`, proposition de répliques affichée) devient représentable. En face, la 4ᵉ carte coûte **une ligne** (mesurée). **L'UX a concédé.** |
| 16 | tech-lead (TL3a-14) | `cede_si` dans `CHAMPS_INJECTES` | **REJETÉ** | Prédicat conditionné par RÔLE ; un rôle de rédaction n'est aucun des trois. **PROPOSER n'est pas INJECTER.** Garde à écrire. |
| 17 | tech-lead (TL3a-15) | Plafonner l'acceptation **par ligne** | **RETIRÉ PAR SON AUTEUR — le garde par ligne est RETENU** | Son refus visait un plafond **inventé** ; deux postes ont produit le **producteur réel**. L'arithmétique de `narratif-ia` tranche : à `parler.length = 1`, trois propositions acceptées écrivent **trois** répliques — le garde sert dans **les deux** états où la carte est lançable. **Ce qui reste du refus, et qui est retenu** : le SSOT ne gagne **aucune** règle de cardinalité (mesuré) ; le plafond vit **au site d'écriture de la feature**, jamais dans `brain/dossier/` ni dans le validateur. |
| 18 | tech-lead (TL3a-16) | Curseurs dans `CHAMPS_PROPOSABLES` | **RETIRÉ (sans objet)** | Le veto n° 1 clôt le fond. **La forme se recopie comme condition d'ouverture** : 3ᵉ forme de proposition, 4ᵉ validateur avec prédicat de **TOTALITÉ**, acceptation **EN BLOC** — une itération entière. Emporte : la variante `GROUPE` **non construite** (KR-109). |
| 19 | tech-lead (TL3a-17) / QA | Laisser `frontiere.test.ts:384` en l'état | **REJETÉ** | **MESURÉ par la QA** : l'assertion échoue (`Received: 2, Expected: 3`) dès que deux budgets s'égalisent, et le remplacement est **séparateur** (cas négatif exécuté rouge). **Motif corrigé entre les deux tours par son auteur** : elle ne rougira probablement **pas** après le retrait de `synopsis_mj` — **ce qui l'aggrave**. Verte **par accident de longueur de fixture**, personne ne la corrigera, et c'est **3b** qui paiera le 4ᵉ rôle sans marge. |
| 20 | QA / tech-lead | Le canari croisé de l'it2 suffit à trois rôles | **REJETÉ** | **Trouvé indépendamment par deux postes** : `croiser` est une **rotation de 1**, dérangement pour tout n ≥ 2 — donc **vert à trois rôles sans plus rien prouver**. Instrument retenu : le **balayage exhaustif** de la QA (le tech-lead a **abandonné ses transpositions**, plus indirectes), **précondition sous-chaîne** d'abord, rotation conservée comme canari de dérangement total. |
| 21 | QA | Un motif **distinct** pour l'élément vide | **REJETÉ** | Sa prémisse était **conditionnée** à « liste vide = succès » ; une fois le vide refusé, les deux cas sont deux refus. **La séparabilité qu'elle demande s'obtient par deux ENTRÉES distinctes, pas deux motifs** — chacune tue un prédicat distinct. *(L'amendement du tech-lead — élément vide → `schema` — est écarté pour la même raison : il ne change rien à la séparabilité, l'écran rend le même texte, et le motif suit la doctrine écrite « une non-réponse de rédaction ».)* |
| 22 | narratif-ia | **`join` avant le scan anti-identifiant** | **REJETÉ** | Deux fragments dans deux cases distinctes ne forment **pas** un identifiant — aucun lecteur ne les lira collés, ils deviennent deux entrées séparées de `parler[]`. Joindre **détruit la localisation** de l'élément fautif **et fabrique un faux positif à la frontière**. |
| 23 | PM | **Pas de variante AJOUT** — traiter la liste comme une unité | **RETIRÉ PAR SON AUTEUR** | Forcer REMPLACEMENT contredirait le modèle mental de l'édition manuelle (« + Ajouter ») et créerait **un second modèle d'écriture pour le même champ**. Et cela **supprimerait la possibilité de n'accepter qu'une des N propositions**. |
| 24 | PM | Aligner `PROPOSITIONS_MAX` et la borne d'écran | **RETIRÉ PAR SON AUTEUR — « ma prémisse était fausse »** | Il n'y a pas un écart à corriger mais **deux bornes de nature différente**, toutes deux sourcées. **Sa demande initiale aurait produit le vrai bug** : aligner l'invite sur la borne document. |
| 25 | narratif-ia | **Le ciblage depuis le linter `personnage-sans-voix`** | **RETIRÉ PAR SON AUTEUR — sur sa propre mesure** | Le prédicat du constat est `length > 0`, **pas** `length >= PARLER_REPLIQUES` : il ne partitionne donc pas « il y a quelque chose à demander ». Un personnage à **1** réplique (place libre) est **muet au linter** et deviendrait **inatteignable**. Le bon prédicat est **local** : `parler.length < PARLER_REPLIQUES`, en ligne au rendu — le même qui désactive « Lancer ». **Conséquence : `controlerDossier` sort entièrement de la tranche, écran compris.** PM et UX l'avaient refusé indépendamment. |
| 26 | UX | Étendre `LigneProposition` avec un `chemin` optionnel | **REJETÉ** | `chemin` pilote `LIBELLE_DES_CHAMPS[chemin]` ; casserait la garantie de forme portée pour la carte 1, pour un gain nul. |
| 27 | UX | Détourner `LigneDetenteur.designation` | **REJETÉ** | Libellé **localisé** calculé par la carte, pas une prose acceptée par valeur. |
| 28 | UX | Nommer le composant `LigneValeurProposee` | **REJETÉ** | Le dépôt suit **deux** conventions : `LigneProposition` nomme le **mécanisme**, `LigneDetenteur` l'**entité**. L'anatomie copie la seconde. **`LigneReplique`**. |
| 29 | UX | Calculer le plafond/le focus depuis le dossier **LIVE** | **REJETÉ** | Course avec l'abonnement réveillé par sa propre écriture — 4ᵉ occurrence de la famille BUG-097/106. **L'UX a corrigé son propre tour 1** : sa parade était sous-spécifiée et retombait dans la course qu'elle prétendait fermer. |
| 30 | UX | Étendre le panneau (accordéon/onglets) pour absorber une 4ᵉ carte | **REJETÉ** | Refonte visuelle **hors cadre** d'une itération qui n'est pas visuelle ; `pageStyle` est déjà une pile scrollable sans plafond de cartes. |
| 31 | narratif-ia | `jamais` et `cede_si` dans 3a | **REPORTÉS vers `personnage-prose`** | **Prix nommé, non gratuit** : passage de `CHAMPS_PROPOSABLES` à des clés **imbriquées** — c'est l'arbitrage réel. Pour `cede_si`, **prédicat amendé à écrire AUX DEUX SITES** avec la 5ᵉ instance de l'instrument « présent aux deux sites », sans quoi un ouvrier « réparera » l'asymétrie en l'injectant. |
| 32 | narratif-ia | Injecter les répliques déjà écrites | **REJETÉ** | Canal de paraphrase que la règle 5 ferme. **Contrepartie obligatoire, retenue** : ce que le modèle ne voit pas, **l'auteur le voit** — bloc DÉJÀ ÉCRIT, gelé au lancement. |
| 33 | narratif-ia | Un prédicat de similarité proposition ↔ document | **REJETÉ** | La frontière testable est la **forme** (KR-229) ; un prédicat d'égalité exacte n'a **aucun producteur mesuré** (KR-235). |
| 34 | narratif-ia | Réutiliser `PROPOSITIONS_MAX` | **REJETÉ** | Elle borne le rôle **détenteurs** et dérive **son** `max_tokens`. Partager coupleraient deux formes de réponse sans raison commune d'évoluer. |
| 35 | narratif-ia | Recopier `BUDGET…['personnage-prose'] = 6000` | **REJETÉ** | Desserrer la garde d'un rôle par la mesure d'un autre (KR-235). **Ajout de tour 2** : et **ne pas choisir** un budget pour faire verdir un test — la ligne se corrige, **la mesure ne se négocie pas**. |
| 36 | narratif-ia | Étendre le garde de vacuité à `personnage-prose` | **REJETÉ** | Inventer une **fonction** à partir de rien **est** la page blanche que le goal nomme ; inventer une **voix** ne l'est pas. |
| 37 | narratif-ia | Le rétrofit du garde invite↔validateur sur `PROPOSITIONS_MAX` | **REPORTÉ** | Condition d'ouverture : la première itération qui rouvre l'entrée `indice-detenteurs`. |
| 38 | orchestrateur | `PropositionRepliques { entiteId, textes }` (narratif, tour 1) | **REJETÉ** | **Retiré par son auteur** après la mesure du tech-lead : sa paire tour-1 aurait **violé « zéro clé commune »** (KR-231). Retenu : `{ personnageId, ajouts }` — `textes` est **à une lettre de `PropositionResolue.texte`**, et `parler` aurait invité `{...caractere, parler: proposition.parler}`, **un écrasement**. |
| 39 | orchestrateur | Nom du rôle `'personnage-voix'` (tech-lead) | **REJETÉ** | Ce qu'on demande n'est pas *une voix* — abstraction qui invite une **description** de la voix — mais **des répliques**. Un seul mot traverse le rôle, la clé, le validateur et la borne : **aucune surface d'harmonisation**. |
| 40 | orchestrateur | Nom de la carte | **ARBITRÉ : `CarteFaireParler`** | Motif des deux précédents livrés : `CarteCompleterFiche` et `CarteTisserIndices` nomment le **geste de l'auteur**, jamais l'entité. |

## 9 — Innovation

*Aucune.* Le budget d'une proposition hors-cadre n'est pas consommé — les quatre décisions structurantes (troisième cible disjointe, troisième validateur nommé, non-vacuité à deux niveaux, AJOUT par ligne) s'appuient toutes sur un précédent déjà livré.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **à trancher sur le diff**, pas de mémoire (aucun des quatre fichiers mutés n'est attendu dans un lot)
- [ ] Les onze mesures du § 5.1 **exécutées et rapportées**, aucune déduite
- [ ] Tests du § 7 écrits et passants ; **tous les canaris et mutants vus rouges** avant d'être crus
- [ ] Critères du § 6 cochés un par un
- [ ] Non-régression : `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `cablage` **verts sans une retouche**
- [ ] Aucun fichier touché hors de la liste de son lot *(`specification.json` excepté — écrit par l'orchestrateur à l'étape 4, hors lot par construction)*
- [ ] **Heuristiques de revue, sans instrument** : KR-013/113 (état dérivé — `rg` du § Build Steps sur les fichiers du lot 2) et KR-112 (aucun fichier au-dessus de 400 lignes)
- [ ] **Relevé du budget de contexte ÉCRIT**, pas seulement fait
- [ ] Dossier de revue : `.claude/raffinage/dossier-copilote-it3a.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | borne de sortie à 3 ✔ · `Select` non filtré ✔ · carte dédiée ✔ |
| Tech Lead | recevable sous réserve | TL3a-3 et TL3a-5 tenus, non contestés ✔ · `frontiere:384` avant toute mesure ✔ · canari exhaustif ✔ |
| UX | recevable sous réserve | vide retiré ✔ · carte neuve ✔ · focus post-décision dérivé d'un gel ✔ · textes au § 3.4 ✔ |
| QA | recevable sous réserve | veto tour 1 levé ✔ · veto neuf dissous par le retrait de l'UX ✔ · doublon motivé ✔ · index dernier ✔ |
| Narratif & IA | recevable sous réserve | veto curseurs tenu ✔ · `CURSEURS_INITIAUX` retenu ✔ · 10 chemins ✔ · invite au § 4 bis ✔ |
