# Mesure de l'orchestrateur — vérité de terrain pour l'arbitrage

Relevé le 2026-09-15, par parcours récursif des deux fixtures (`python`) + lecture des suites.
**Cette version CORRIGE une première rédaction fausse** (voir § 4).

## 1 — L'index des producteurs, sur les SIX chemins

Chemins retenus : `savoirs[].indice_id` · les 4 sites de `CHEMINS_DE_DELTAS` filtrés sur
`delta === 'reveler_indice'` (quêtes/récompense, événements/résolutions, climat/effets_regles,
jalons/effet) · `monde.indices[].mene_a[]` **lu à plat**.

### `dossier-minimal.json` — c'est `clone()`, la fixture de TOUTES les preuves d'it1 (l. 28)

| Indice | Producteurs | Verdict |
|---|---:|---|
| `indice.cendres-tiedes` | **1** (`delta:evenement`) | **ALERTE — goulot** |
| `indice.sceau-brise` | 3 (`savoir:aldur` + `delta:jalon` + `mene_a:cendres-tiedes`) | calme |

### `dossier-reference.json`

| Indice | Producteurs | Verdict |
|---|---:|---|
| `pas-dans-la-cendre` | 2 (`savoir:harek` + `delta:jalon`) | calme |
| `sceau-brise-a-nouveau` | 2 (`savoir:mira` + `mene_a`) | calme |
| `lettre-de-la-vigie` | 2 (`savoir:selene` + `mene_a`) | calme |
| `trace-du-guet` | 2 (`savoir:tobin` + `delta:evenement`) | calme |

**Les quatre indices du dossier de référence sont à EXACTEMENT deux producteurs.** La régularité
est trop nette pour être fortuite : la fixture est construite pour survivre à une règle de goulot.

## 2 — Le fait décisif : la ligne de base de `controles.test.ts` bascule, sous TOUTE définition

`clone()` lit `dossier-minimal.json` (l. 28, 46-48). Sur ce clone INTACT :

- définition **étroite** (`savoirs[]` seul) → `cendres-tiedes` a **0** producteur → **BLOQUANT** ;
- définition **large** (6 chemins) → `cendres-tiedes` a **1** producteur → **ALERTE**.

→ **Dans les deux cas, le clone intact cesse d'être calme.** Les quatre assertions de ligne de base
sont donc atteintes mécaniquement, indépendamment de l'arbitrage sur la définition :

| Ligne | Assertion lue | Devient |
|---|---|---|
| 115 | `expect(controlerDossier(dossier).controles).toEqual([])` | fausse (1 contrôle) |
| 143 | `expect(rouge.controles).toHaveLength(1)` | fausse (2 contrôles) |
| 257 | `expect(controlerDossier(dossier).controles).toHaveLength(1)` | fausse (2 contrôles) |
| 265 | `expect(rapport.controles).toEqual([])` | fausse (1 contrôle) |

**Statut de cette affirmation** : elle n'est PAS une couleur de test mesurée par un run — elle se
déduit de la FORME des assertions (comptes globaux sur le rapport entier) et de la donnée ci-dessus.
Le run de confirmation est dû **à l'essaim**, pas au plan : il n'existe pas encore de code à exécuter.
La conclusion (réécrire la ligne de base) tient sous les deux définitions, donc elle ne dépend
d'aucun arbitrage en cours.

## 3 — Les trois autres règles

| Règle | `dossier-minimal` | `dossier-reference` |
|---|---|---|
| **lieu de départ désert** | calme (aldur est à `lieu.val-cendre`) | **1 BLOQUANT** — aucune présence à `lieu.foyer-du-guet` ; les deux seules présences sont `tour-effondree` et `marche-des-cendres` |
| **personnage sans présence** | calme | **4 alertes** (mira, tobin, harek, aubry) |
| **personnage sans voix propre** | calme | **5 infos** sur 6 personnages |

**Sur la borne `portee === 'premier'` proposée par le narratif** — vérifiée, ses chiffres sont exacts :
5/6 sans borne, **3/4 avec**. Mais la borne fait passer le taux de **83 % à 75 %** : elle n'éteint pas
le bruit, elle le déplace d'un cran, au prix d'une condition de règle et d'un KR de plus.
Contre-mesure à verser au tour 2.

## 4 — Correction de ma première rédaction

La première version de ce fichier écrivait : « définition large → les DEUX indices de `minimal` sont
CALMES ». **Faux.** J'avais vérifié « a-t-il au moins une source ? » (la règle d'orphelin) sans
vérifier « en a-t-il exactement une ? » (la règle de goulot). `cendres-tiedes` en a exactement une.
L'erreur allait dans le sens qui **sous-estime** l'impact sur les suites existantes — la direction
dangereuse. Le tech-lead et le narratif l'ont tous deux relevée indépendamment, par la donnée.

## 5 — Réconciliation avec le script de la QA (tour 1)

La QA a exécuté son propre script et rend, sur le goulot, **les chiffres inverses des miens** :
elle compte **0 goulot sur `minimal` et 2 sur `reference`** ; je comptais **1 sur `minimal` et 0 sur
`reference`**. Cause identifiée et reproduite : **son script EXCLUT `monde.indices[].mene_a[]`** de
l'ensemble des producteurs. En retirant `mene_a` de mon propre calcul, je retrouve ses deux chiffres
exactement (`sceau-brise-a-nouveau` et `lettre-de-la-vigie`, tous deux `sav=1 delta=0`).

| Indice | sav | delta | `mene_a` | total | **compteur unifié** | QA (sans `mene_a`) |
|---|---:|---:|---:|---:|---|---|
| `minimal` · `cendres-tiedes` | 0 | 1 | 0 | **1** | **ALERTE** | calme |
| `minimal` · `sceau-brise` | 1 | 1 | 1 | 3 | calme | calme |
| `reference` · `pas-dans-la-cendre` | 1 | 1 | 0 | 2 | calme | calme |
| `reference` · `sceau-brise-a-nouveau` | 1 | 0 | 1 | 2 | calme | **goulot** |
| `reference` · `lettre-de-la-vigie` | 1 | 0 | 1 | 2 | calme | **goulot** |
| `reference` · `trace-du-guet` | 1 | 1 | 0 | 2 | calme | calme |

**Le désaccord n'est donc pas une erreur de calcul, c'est un désaccord de DÉFINITION** — et c'est
exactement la question que le narratif a posée (chemin n° 6 de son inventaire).

**Défaut de forme dans la formulation de la QA, indépendant du chiffre.** Elle définit deux branches
disjointes — orphelin = « aucun savoir ET aucun delta », goulot = « exactement un personnage ». Un
indice à **zéro savoir et un seul delta** (`cendres-tiedes`) **tombe entre les deux** : il n'est ni
orphelin (un delta le révèle) ni goulot (zéro personnage le détient), donc **le linter se tait sur un
indice à source unique** — précisément le cas que la règle existe pour attraper, et un silence
indistinguable de la classe KR-222. Le **compteur unifié** (`0 → bloquant`, `1 → alerte`, `≥2 → silence`)
n'a pas ce trou, et c'est un argument de conception qui vaut indépendamment de `mene_a`.

**Ce qui est confirmé à l'identique par les deux mesures indépendantes** : `dossier-reference.json`
porte **1 bloquant « départ désert » + 4 alertes « sans présence » + 5 infos « sans voix »**, et
`construireAmorce()` déclenche « départ désert » **par vacuité** si la règle n'est pas gardée.

## 6 — `mene_a` à plat ou saturé : indiscriminable sur les fixtures actuelles

Le narratif propose la lecture **à plat** (tout indice cité dans un `mene_a[]` a un producteur), le
tech-lead la **saturation par point fixe** (une arête ne compte que si son amont est lui-même produit).
Mesuré : sur les deux fixtures, **les deux lectures donnent le même résultat** — tout porteur de
`mene_a` y est lui-même produit par ailleurs. La différence n'apparaît que sur un **cycle sans autre
source** (`A.mene_a=[B]`, `B.mene_a=[A]`), qu'aucune fixture ne porte. Conséquence pour le plan :
le choix ne se prouve **que** par un clone muté fabriqué pour ça, et il doit être écrit — sans quoi
les deux implémentations passeront les mêmes tests.

## 7 — Deux vérifications sur la note de tour 2 du narratif

**(a) Le motif de retrait de la borne `portee` — CONFIRMÉ**, et il est plus fort que le chiffre.
`types.ts` l. 271-278 : « La portée **POSÉE À LA CRÉATION** d'un personnage par l'éditeur — le
**PLANCHER DU SCHÉMA, jamais une intention d'auteur** […] Il faut donc écrire une valeur, et
`'premier'` est celle qu'on écrit. » `portee` est structurellement requise. Sur le dossier d'un auteur
qui n'a jamais touché ce champ, **tous** les personnages sont `'premier'` : la borne est **inerte**.
Les 8 points qu'elle gagnait (83 % → 75 %) sont un artefact de `dossier-reference.json`, seule fixture
où des `'second'` ont été rédigés. **B-5 est clos par le retrait de son auteur, sur un motif mesuré.**

**(b) Le test de cycle qu'il propose — NE PROUVE PAS ce qu'il annonce.**
Mutation proposée : refermer le cycle `mene_a` entre les deux indices de `dossier-minimal.json`.
Calculé :

| Indice | sav | delta | `mene_a` reçu | total | verdict |
|---|---:|---:|---:|---:|---|
| `cendres-tiedes` | 0 | 1 | 1 | **2** | calme |
| `sceau-brise` | 1 | 1 | 1 | **3** | calme |

Les deux gardent leurs sources propres : **aucun n'est à 0 ni à 1 producteur**, donc le cas « cycle
SANS autre source » n'est **pas atteint** par une mutation d'un seul champ. L'atteindre demanderait de
retirer aussi le savoir et le delta — hors du patron acté. *Classe d'erreur exacte que le dossier du
tour 2 signalait en tête (une couleur de test déduite, non mesurée), reparue dans une note de tour 2.*

**Conséquence pour le plan** : le choix **à plat contre saturé** (B-7) n'a **aucune preuve admissible**
à cette itération. Le plan livre la lecture à plat et l'**écrit comme non prouvée**, il ne prétend pas
la démontrer.

**(c) La mutation d'un seul champ qui, elle, DISCRIMINE** — et elle porte sur la question qui compte
pour B-1 (« `mene_a` compte-t-il comme producteur ? ») :

> `charpente.jalons[0].effet = []` sur le clone de `dossier-minimal.json`.
> `sceau-brise` tombe alors à `savoir(1) + mene_a(1)` = **2 producteurs → calme**.
> Si `mene_a` n'était PAS compté, il serait à **1 → ALERTE**.

Un seul champ, deux comportements séparés, rouge et calme discriminables dans le même test. C'est le
test que le plan porte à la place de celui du cycle.

## 8 — Les deux régressions trouvées par le tech-lead au tour 2 — CONFIRMÉES, et mon § D était incomplet

**Baseline mesurée (run réel, `npx jest`)** : `controles.test.ts` + `panneauControles.test.tsx` +
`dossierEditorScreen.test.tsx` → **3 suites, 44 tests, tous VERTS** au 2026-09-15. C'est la référence
contre laquelle les deux régressions ci-dessous se lisent.

### (a) Le balayage de DISCRIMINANCE — la trouvaille la plus chère du raffinage

`controles.test.ts` l. 172-186, lu :

```ts
for (const id of Object.keys(CONTROLES) as ControleId[]) {
    const descripteur = CONTROLES[id]
    const constats = descripteur.controler(seme())
    // Discriminance : une règle muette rendrait la boucle ci-dessous vraie sans rien prouver.
    expect(`${id} → ${constats.length > 0}`).toBe(`${id} → true`)
```

Ce n'est **pas** un compte de ligne de base : c'est une exigence **structurelle** que CHAQUE entrée du
registre produise au moins un constat **sur un dossier fraîchement semé**. Or `construireAmorce` sème
`personnages: []` et `indices: []` : les quatre règles neuves y sont muettes **par conception**, et
« départ désert » l'est **par la garde que les cinq rôles réclament**. **Le test échoue quatre fois**,
et il échouerait même sans la garde.

Personne ne l'avait vu au tour 1 — ni les rôles, ni moi. Le remède proposé par le tech-lead est un
**gain**, pas une réparation : un `Record<ControleId, Dossier>` **TOTAL par compilation** (témoin par
règle, même geste que `PROSES_AMORCE`), qui rend toute règle future **non compilable** tant que son
auteur n'a pas exhibé un dossier qui la déclenche. Il sert aussi le critère 6 de la QA sans fixture neuve.

### (b) `dossierEditorScreen.test.tsx` — l'itération touche bien une autre feature

l. 337, lu : `personnages: [{ id: 'pnj.aldur-le-sage', portee: 'premier', plan_actions: [], savoirs: [] }]`
— **ni `presence`, ni `caractere`**. `personnage-sans-presence` tire donc une ALERTE sur la section
`personnages`. Et `badgeSection` (`pastilles.ts` l. 101-108, lu) rend
`{ texte: '1 fiche · ALERTE' }` — **un seul nœud** (fusion KR-218). L'assertion l. 349
`within(ligneApres).getByText('1 fiche')` matche le **contenu entier** du nœud → ne trouve plus rien → **tombe**.

La borne `portee === 'premier'` (B-5) **n'y changerait rien** : ce personnage EST `portee: 'premier'`.

**Correctif retenu** : compléter le **littéral injecté** (deux champs), jamais l'assertion. Réécrire
l'assertion en `'1 fiche · ALERTE'` accrocherait un test de `bascule-editeur` au **jeu de règles de
`dossier-controles`** — un couplage inter-features par assertion, qui rougirait à chaque règle future.

### (c) Correction de mon § D : SIX assertions de ligne de base, pas quatre

J'avais listé l. 115, 143, 257, 265. Il en manque **deux**, toutes deux dans le test l. 109-131 et
toutes deux des comptes globaux sur le clone — **vérifiées à la lecture** :

| Ligne | Assertion | Devient (`cendres-tiedes` = 1 producteur → ALERTE) |
|---|---|---|
| 115 | `expect(controlerDossier(dossier).controles).toEqual([])` | 1 → tombe |
| **121** | `expect(rouge.controles).toHaveLength(1)` | 2 → tombe *(manquait à mon § D)* |
| **129** | `expect(controlerDossier(dossier).controles).toEqual([])` | 1 → tombe *(manquait à mon § D)* |
| 143 | `expect(rapport.controles).toHaveLength(1)` | 2 → tombe |
| 257 | `expect(controlerDossier(dossier).controles).toHaveLength(1)` | 2 → tombe |
| 265 | `expect(rapport.controles).toEqual([])` | 1 → tombe |

Plus le balayage (a), qui est un **septième site** et d'une autre nature.

**Restent vertes** : l. 116 / 130 (`jouable === true`) — une ALERTE ne bloque pas. *Sous la définition
ÉTROITE elles tomberaient* (0 producteur → BLOQUANT) : argument technique de plus pour les six chemins.

**Piège d'ordre** : l. 122-124 et l. 144 lisent `controles[0]`. Elles ne restent vertes que si les
quatre entrées neuves sont déclarées **APRÈS** `amorce-non-redigee` (« ORDRE DES CLÉS = ORDRE DE RENDU »).
Un ouvrier qui les insère par ordre alphabétique fait tomber deux assertions de plus, pour une raison
que personne ne soupçonnerait.

## 9 — CORRECTION de mon § 7(b) : B-7 EST prouvable, la QA a trouvé la mutation

Mon § 7(b) concluait que le choix « `mene_a` à plat contre saturé » n'avait **aucune preuve admissible**
à cette itération. **C'est faux, et le tech-lead et moi avons commis la même erreur** : nous avons tous
deux supposé qu'il fallait **AJOUTER une arête** aux deux indices existants de `dossier-minimal.json`
— ce qui exige de retirer aussi le savoir et les deux deltas, soit quatre champs.

La QA **remplace la collection entière**, ce qui est **un seul champ** :

```ts
dossier.monde.indices = [
  { id: 'indice.A', mene_a: ['indice.B'] },
  { id: 'indice.B', mene_a: ['indice.A'] },
]
```

Les savoirs et deltas du clone continuent de pointer `indice.cendres-tiedes` / `indice.sceau-brise`,
qui ne sont plus dans la collection : ils ne contribuent donc **à aucun** des deux indices présents.
`controlerDossier` ne valide pas — ces références pendantes lui sont indifférentes.

**Vérifié par simulation :**

| Indice | producteurs (à plat) | à plat | saturé (point fixe) |
|---|---|---|---|
| `indice.A` | `['mene_a:indice.B']` | **ALERTE** | **BLOQUANT** |
| `indice.B` | `['mene_a:indice.A']` | **ALERTE** | **BLOQUANT** |

→ **2 alertes contre 2 bloquants : discriminant, en une seule mutation de champ.**

**Conséquences pour le plan** — le choix d'implémentation ne change pas (lecture **à plat**, convergence
du narratif et du tech-lead, sens d'erreur permissif sur une règle bloquante), mais ce qu'on peut en
DIRE change : il est **prouvable**, donc il porte un **test nommé** attendant **2 alertes**, plus un
`known_risk` disant que la saturation d'it5 fera délibérément basculer ce test en 2 bloquants.

*C'est le rendement propre du second tour : trois rôles s'étaient accordés sur « non prouvable », et
un quatrième a trouvé la mutation. Un accord unanime sur une impossibilité n'est pas une mesure.*
