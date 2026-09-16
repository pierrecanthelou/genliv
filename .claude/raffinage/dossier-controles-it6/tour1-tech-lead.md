# Tour 1 — tech-lead — dossier-controles it6 (tranche 1/3)

**RISQUE** — « déplacement, jamais réécriture » n'a qu'UN instrument mécanique : le balayage `controles.test.ts:729-744`, qui bascule de `['controles.ts']` à `['atteignabilite.ts']`. Si l'ouvrier écrit le point fixe *pendant* le déplacement, plus personne ne peut relire le diff, et les deux assertions basculées deviennent la seule preuve d'un changement qui en emporte trois.

**OBJECTION 1 (mesurée)** — le cadrage écrit « Aucun fichier de feature ». **Faux** : `panneauControles.test.tsx:145` épingle `/aucun enchaînement/`, fragment de la phrase même que le « point dur » commande de réécrire. Un fichier non nommé qui rougit à la porte est exactement ce qu'un découpage existe pour empêcher.

**OBJECTION 2** — « saturer `mene_a[]` » ne dit pas si le COMPTEUR survit. Deux lectures : compter les arêtes saturées (le seuil `1 → alerte` d'it3 vit), ou rendre un booléen `atteignable` (le goulot meurt en silence). La seconde est une régression de règle déguisée en refactor.

**OBJECTION 3** — le test d'auto-boucle (l.657-685) perd sa discriminance sous saturation : ses deux moitiés rendent `bloquant`. Le basculer sans le réécrire livre un test qui ne mesure plus rien.

**PROPOSITION** — 1 lot, 5 fichiers, marqué `contrat` ; exécution en DEUX temps mesurés dans le lot : (a) déplacement à iso-comportement, **zéro assertion modifiée hors le balayage de porteur**, `jest` vert ; (b) saturation, 2 assertions basculées + 2 réécrites. Définition figée du point fixe et 4 témoins écrits en annexe.

**VERDICT** — **recevable sous réserve** (objections 1 et 2 tranchées au plan).

---

## ANNEXE (hors quota)

### 1. Découpage en lots — UN SEUL LOT

| id | titre | marque | ordre | fichiers |
|---|---|---|---|---|
| **L1** | Atteignabilité : extraction puis saturation | **`contrat`** | seul, premier, pas d'essaim | **N** `src/brain/dossier/atteignabilite.ts` · **N** `src/brain/dossier/atteignabilite.test.ts` · **R** `src/brain/dossier/controles.ts` · **R** `src/brain/dossier/controles.test.ts` · **R** `src/features/dossier-controles/tests/panneauControles.test.tsx` |

**Pourquoi un seul.** Les quatre fichiers de code sont dans `brain/` : tout lot les touchant est `contrat`, et deux lots `contrat` ne s'exécutent jamais en parallèle — un découpage n'achèterait aucun parallélisme. Pire, il serait **illégal** : toute coupe « extraction / saturation » nomme `controles.ts` **et** `controles.test.ts` des deux côtés. Un lot = un agent = une exécution séquentielle, sans worktree ni fusion. C'est le cas normal d'une tranche verticale de contrat (précédents it3 et it4, tous deux à lot unique).

**Le fichier de feature est POSSÉDÉ par le lot**, pas « peut-être touché » : `panneauControles.test.tsx:145` dépend du texte réécrit. Même feature, aucun franchissement d'isolation ; précédent explicite (it2, « le lot CONTRAT emporte un fichier de feature »).

**Deux temps DANS le lot, la porte passée aux deux** (c'est ce qui rend « déplacement » constatable) :

- **T1 — déplacement seul.** `atteignabilite.ts` naît avec la fonction **copiée à l'identique** (corps, docstring, noms), `controles.ts` l'importe, `import type { Delta } from './deltas'` **disparaît de `controles.ts`** (plus aucun usage → `no-unused-vars`). Seule modification de test admise : `controles.test.ts:744` → `['atteignabilite.ts']`. **`tsc` + `jest` verts, 0 autre assertion touchée.** Si une autre rougit, le déplacement n'en était pas un.
- **T2 — saturation.** Point fixe, prose, tests.

### 2. Signatures exactes

`atteignabilite.ts` EXPOSE (au module `brain/dossier/` ; **rien au baril `brain/index.ts`**) :

    export type FamilleDeSource = 'savoir' | 'delta' | 'mene_a'
    export interface SourceIndice { famille: FamilleDeSource }
    export function producteursParIndice(dossier: Dossier): Map<string, SourceIndice[]>

- Nom, signature et forme de retour **inchangés** (contrat d'extraction figé depuis it3, docstring `controles.ts:346-348`). `SourceIndice` reste un OBJET, pas un mot : la docstring d'it3 le motive nommément par it6.
- Les deux types sortent du module parce qu'ils sont **dans la signature** (ce n'est pas une abstraction, c'est le contrat lui-même) ; `controles.ts` n'en importe **aucun** — il ne lit que `.length`.

`controles.ts` CONSOMME : `import { producteursParIndice } from './atteignabilite'`. Rien d'autre ne change côté règle : `'indice-sans-source'` garde `niveaux: ['bloquant','alerte']`, `nombre >= 2 → continue`, `nombre === 0 ? 'bloquant' : 'alerte'`, `path: 'monde.indices[].id'`, `section: 'indices'`.

**Sémantique du point fixe — à écrire telle quelle au plan** (le compteur SURVIT) :

> `PRIMAIRE(y)` = nombre de sources de famille `savoir` ou `delta` visant `y`.
> `P` = plus petit point fixe : `P` contient `{ y | PRIMAIRE(y) >= 1 }`, et `x` dans `P` avec `y` dans `x.mene_a` implique `y` dans `P`.
> `compte(y) = PRIMAIRE(y) + nombre d'arêtes x → y dont x est dans P`.
> Seuils inchangés : `0 → bloquant`, `1 → alerte`, `>= 2 → silence`.

Conséquences mécaniques : cycle `A↔B` sans primaire → `P` vide → 0 chacun → **deux bloquants** ; `A.mene_a = ['A']` seul → 0 → **bloquant** ; `A.mene_a = ['A']` + un savoir sur A → `A` dans `P`, l'arête compte → 2 → **silence**. Aucun ordre d'itération ne change le résultat.

**Frontière de couture (non négociable)** : `atteignabilite.ts` ne connaît **ni `SectionId`, ni `NiveauControle`, ni une seule phrase française**, et n'importe **jamais** `validate.ts`. Il dit qui produit quoi ; `controles.ts` dit ce qu'on en conclut et comment on le raconte.

### 3. Prose — contrainte de rédaction, pas de goût

Le `bloquant` devient littéralement faux sur un cycle. **Réécriture contrainte à conserver le fragment « aucun enchaînement »** (la garde de la feature est un fragment délibérément choisi pour survivre à une reformulation, `panneauControles.test.tsx:139-144`). Forme proposée :

> « Aucun personnage, aucun effet et aucun enchaînement que le joueur puisse atteindre ne donne cet indice : il ne pourra jamais l'obtenir. »

Si l'ouvrier choisit une forme qui perd le fragment, il **doit** mettre à jour `panneauControles.test.tsx:145` dans le même lot — il le possède. Mettre à jour aussi la docstring `controles.ts:249-253` : ce commentaire dit « le texte se relit avec l'index, jamais seul » — c'est maintenant qu'il se relit.

### 4. Ce que les tests doivent devenir (mesurable, pas déductible)

| Site | État | Attendu |
|---|---|---|
| `controles.test.ts:744` | `['controles.ts']` | `['atteignabilite.ts']` — **T1** |
| `controles.test.ts:609-634` (cycle) | 2 alertes, `jouable: true` | 2 **bloquants**, `jouable: false` + seconde moitié dans le MÊME test : un savoir posé sur A → A silence, B alerte |
| `controles.test.ts:657-685` (auto-boucle) | alerte / bloquant | **bloquant** / discriminant réécrit : auto-boucle + un savoir sur A → **silence** (KR-197/202) |
| `controles.test.ts:590` (ligne de base minimal) | 1 alerte `cendres-tiedes` | **inchangé** — prédiction à MESURER |
| `controles.test.ts:636-655` (`mene_a` compte) | inchangé | **inchangé** — même raison |
| fixture de référence | 0 constat `indice-sans-source` | **inchangé** |
| `controles.test.ts:393` (anti-dérivation KR-226) | vert | **vert** — aucune section `canon` ici. Réécriture = tranche suivante, **hors périmètre** |

`atteignabilite.test.ts` (N) — **quatre témoins minimum** :

1. chaîne à 3 sauts `A(primaire) → B → C`, **avec `monde.indices` ordonné `[C, B, A]`** : une seule passe laisse C à zéro. Seul témoin qui prouve *point fixe* plutôt que *une passe* ;
2. cycle `A↔B` sans primaire → `compte = 0` des deux côtés ;
3. auto-boucle nue → 0 ; auto-boucle + primaire → 2 ;
4. **non-régression des six chemins** : les familles rendues (`savoir`/`delta`/`mene_a`) sont celles d'avant le déplacement.

Plus deux gardes de source bon marché sur le fichier neuf : `SOURCE_ATTEIGNABILITE` ne contient ni `'.errors'` ni `validateDossier`.

### 5. Variantes REJETÉES — à recopier au registre des désaccords du plan (§ 8)

- **REJETÉ — deux lots `contrat` (extraction, puis saturation).** Les deux nomment `controles.ts` et `controles.test.ts` : propriété non disjointe. Et deux lots `contrat` ne tournent jamais en parallèle. La séparation est tenue par les **deux temps** du lot.
- **REJETÉ — exporter `producteursParIndice` par `brain/index.ts`.** Zéro consommateur hors `brain/dossier/` — même règle que `PREDICATES` et `DELTAS`.
- **REJETÉ — pré-exposer `indicesProduits(dossier): ReadonlySet<string>` « pour la tranche objectif-sans-chemin ».** Abstraction à zéro appelant aujourd'hui.
- **REJETÉ — remplacer le compteur par un booléen `atteignable`.** Supprimerait le seuil `1 → alerte` livré en it3 : régression de règle sous couvert de refactor.
- **REJETÉ — déplacer la règle `indice-sans-source` ou `PROSES_INDICE_SANS_SOURCE` vers `atteignabilite.ts`.** Ferait du module neuf un second registre de règles, et les balayages de source de `controles.ts` cesseraient de couvrir la moitié qui produit les constats.
- **REJETÉ — profiter du déplacement pour relire les 4 sites de deltas par un marcheur de chemins générique.** Veto tech-lead déjà tenu en it3 (`sitesDe` privée à `validate.ts`).
- **REJETÉ — mémoïser l'index ou le partager entre les deux appels d'un rendu.** Mesure d'it5 contre le cache ; KR-013/113.
- **REJETÉ — exhiber un cycle en modifiant `dossier-reference.json` ou `dossier-minimal.json`.** Fixtures lues par huit suites : les témoins sont des clones mutés d'un seul champ.
- **REJETÉ — réécrire l'invariant KR-226 (`controles.test.ts:393`) dans cette tranche.** Aucune règle n'y déclare `section: 'canon'`. Charge de la tranche suivante.

### 6. Aucun veto de mon domaine

Pas d'import inter-features, pas de contournement de contrat `brain/`, pas de duplication de source de vérité (l'extraction la **réduit**), pas de persistance brute, pas de référence par nom, pas de fichier partagé entre lots. Seule réserve : documentaire (objection 1) et sémantique (objection 2).
