# Plan d'itération — `dossier-controles` · itération `6`

> **Statut : VALIDÉ par l'humain le 2026-09-16 (porte 2 franchie).**
> Comité à **5 rôles** (PM, Tech Lead, UX, QA, **Narratif & IA**), 2 tours, **aucun veto tenu**, **aucun bloc `ESCALADE`**.
> **Motif de la convocation du 5e rôle** : l'itération fige la définition de « ce qui produit un indice », c'est-à-dire de ce qu'un joueur peut apprendre dans une aventure — et le moteur de la n° 9 consommera cette définition.
> Notes de tour : `.claude/raffinage/dossier-controles-it6/tour{1,2}-<rôle>.md`.

---

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour l'ouvrier)*

**Phrase de démo** — à la fin de cette itération, **l'auteur voit qu'un indice pris dans une boucle de renvois n'est produit par rien.**

**⚠ L'itération 6 telle qu'elle était écrite en spec a été DÉCOUPÉE EN TROIS avant raffinage** (porte de taille, 2026-09-16, validé par l'humain). Elle portait quatre livrables et ~9 critères. Ce plan ne raffine que la **première tranche**. Les deux autres partent en `plan.iterations[]` à l'étape 7 :

| n° | Tranche | Démo |
|---|---|---|
| **6** *(ce plan)* | extraction de `producteursParIndice` + saturation `mene_a` par point fixe | l'auteur voit qu'un indice pris dans une boucle n'est produit par rien |
| 7 | `canon-sans-objectif` + `objectif-sans-chemin` (bloquant) + réécriture de l'invariant KR-226 | l'auteur voit qu'un objectif qu'il a posé n'a aucun chemin qui puisse l'accomplir |
| 8 | le producteur **amorçable** (savoir sans porte, jalon sans déclencheur) + la nuance `alerte` | l'auteur voit qu'un indice n'est servi que par une source que rien ne déclenchera |

**La tranche, de l'écran à la persistance** — elle ne traverse **aucune écriture** : `controlerDossier` est pure et se rappelle à chaque rendu. Elle traverse le **calcul** (`atteignabilite.ts`, neuf), la **règle** (`controles.ts`, `indice-sans-source`), et le **rendu déjà livré** (it1 la liste, it2 la pastille de section, it4 la navigation) — deux indices qui affichaient `ALERTE` affichent `BLOQUANT`, la pastille de la section Indices passe au pire niveau, et `jouable` bascule à faux. Aucun composant neuf, aucun token neuf, aucun niveau neuf.

**Les lots**

| id | titre | fichiers | `contrat` |
|---|---|---|---|
| **L1** | Atteignabilité : extraction, puis saturation | **5** (2 N, 3 R — dont 1 attendu **inchangé**) | **oui** — seul, premier, **pas d'essaim** |

**Hors périmètre** — § 2. Notamment : les portes de racine (`revele_si`, `apres_indice_id`, `declencheur_expr`) → n° 8 ; le retrait du climat des racines ; l'export par `brain/index.ts` ; un second `ControleId` ; la réécriture de l'invariant KR-226 → n° 7 ; la mémoïsation.

**Désaccords `REPORTÉ`** — deux, § 8 : la seconde arête `indice → indice` (`apres_indice_id`) vers n° 8, et le seuil `>= 2 → silence` sous la seconde lecture de `mene_a` vers n° 9.

**Proposition `INNOVATION`** — **aucune**. Tout ce qui est retenu tient dans le cadre existant.

**Ce que l'humain doit regarder en priorité** : l'arbitrage **C1** (§ 8), où j'ai tranché **avec le Narratif contre trois rôles** — sur une asymétrie mesurée dans le code, pas sur une préférence.

---

## 1 — But raffiné

**Déplacer** `producteursParIndice` de `brain/dossier/controles.ts` vers un `brain/dossier/atteignabilite.ts` neuf — déplacement, jamais réécriture, le nom est gelé depuis it3 — puis y **saturer `mene_a[]` par point fixe** : une arête `mene_a` ne compte un producteur que si son amont est lui-même produit.

**Deux assertions livrées basculent délibérément** de `alerte` à `bloquant` (cycle `A↔B`, auto-boucle). Ce n'est pas une régression : la lecture à plat était **sous-graduée** par choix d'it3, et l'itération paie cette dette.

**Le sens d'erreur ne change pas de camp, et c'est ce qui rend la tranche livrable seule** (Narratif, annexe A) : la saturation ne touche que les **arêtes**, jamais les **racines**. Toutes les racines restent comptées ouvertes — donc sur-comptées, donc sous-graduées. Fermer une porte de racine **retire** un producteur : c'est l'inverse, les faux positifs vivent là, et c'est la charge de la n° 8.

---

## 2 — Hors périmètre

- **Les portes de racine** — les quatre portes de `Revelation` sur un savoir, `charpente.jalons[].declencheur_expr` absent, l'atteignabilité du porteur d'un effet. → **n° 8**, et H2 leur lègue la liste exhaustive.
- **`savoirs[].revele_si.apres_indice_id`** — seconde arête `indice → indice` du schéma, **non saturée ici**. → **n° 8**, nommée en H2 et rendue mécanique par la garde G3.
- **Retirer le climat des racines** — ce serait le premier faux positif réel de la règle.
- **`canon-sans-objectif`, `objectif-sans-chemin`, la réécriture de l'invariant KR-226** (`controles.test.ts:393`) → **n° 7**. Aucune règle de cette tranche ne déclare `section: 'canon'`, donc l'invariant reste vert.
- **Tout export par `brain/index.ts`** — zéro consommateur hors `brain/dossier/`.
- **Un second `ControleId`** pour la boucle — même cause, KR-164.
- **Toute mémoïsation ou cache** de l'index — KR-013/113, mesure d'it5 contre le cache.
- **Toucher `dossier-reference.json` ou `dossier-minimal.json`** — fixtures lues par huit suites ; les témoins sont des clones mutés d'un seul champ.
- **Renommer `producteursParIndice`** — le nom est le contrat d'extraction.

---

## 3 — Contrat de design

Zéro composant neuf, zéro token neuf, zéro `NiveauControle` neuf. `PASTILLES.bloquant` / `PASTILLES.alerte` **inchangés**. La bascule ne fait qu'exposer le mot `BLOQUANT` (teinte `--bad`, déjà câblée) sur des lignes qui portaient `ALERTE`.

### Les quatre textes, mot pour mot — ils passent tels quels dans le code

**Mécanisme retenu : DEUX messages, UNE remédiation.** Motif mécanique, § 8 · C1.

| Cas | Colonne | Texte |
|---|---|---|
| `brut === 0` | message | **INCHANGÉ, mot pour mot** — « Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir. » |
| `brut >= 1 && compte === 0` | message | **NEUF**, constante nommée `MESSAGE_INDICE_EN_BOUCLE` — « Cet indice n'est relié qu'à des enchaînements qui bouclent sans jamais atteindre un personnage ou un effet : le joueur ne pourra jamais l'obtenir. » |
| `bloquant` (les deux cas) | remédiation | **RÉÉCRITE** — « Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas. » |
| `alerte` | message | **INCHANGÉ** — « Cet indice n'est accessible que par un seul chemin : si le joueur le manque, il devient inaccessible. » |
| `alerte` | remédiation | **RÉÉCRITE (dernier membre seulement)** — « Ouvrez-lui un second chemin — un autre personnage (Personnages → Savoirs), un effet « révèle l'indice », ou un enchaînement depuis un indice que le joueur peut lui-même obtenir (Indices → Mène à). » |

**Forme du porteur** : `MESSAGE_INDICE_EN_BOUCLE` est une **constante nommée à part**, jamais une troisième ligne de `PROSES_INDICE_SANS_SOURCE`. Le type `Record<SeuilIndice, ProseControle>`, la garde `estSeuilIndice` et le sélecteur de remédiation restent **intacts**.

**Registre vérifié par l'UX** : indicatif présent impersonnel sur les messages (sujet = l'indice, jamais « vous ») ; impératif 2e personne du pluriel sur les remédiations (« Ancrez », « confiez », « révélez », « Ouvrez-lui ») ; chemin d'écran entre parenthèses ; **zéro glyphe** ; **zéro terme interne** — « mene_a », « saturation », « point fixe », « Map », « cycle » sont absents des cinq textes. *(Corrigé après la vérification QA : la liste d'origine incluait « boucle », ce qui était **littéralement faux** — le texte mandaté par le comité lui-même dit « des enchaînements qui **bouclent** ». Le verbe reste retenu : c'est du français ordinaire qui décrit le phénomène à l'auteur, pas un terme interne au sens de `mene_a` ou `Map`. C'est l'affirmation qui était fausse, pas le texte.)* Les `TERMES_INTERDITS` de `controles.test.ts:1166-1215` sont tous absents (vérifié tech-lead).

### Deux docstrings à réécrire dans le même lot

- `controles.ts:249-258` — l'isomorphisme « trois familles comptées, trois familles offertes » **cesse d'être vrai**. Il devient : « trois comptées, **deux offertes sans condition et une sous condition explicitée dans la phrase** ». Sa propre docstring l'exigeait : « le texte se relit avec l'index, jamais seul ».
- `controles.ts:367-375` — le bloc « `mene_a` EST LU À PLAT, JAMAIS SATURÉ » voyage avec la fonction et doit décrire la saturation.

---

## 4 — Contrats `brain/` touchés

`atteignabilite.ts` est **neuf** et n'expose rien au baril. `controles.ts` change d'import et de proses. **Aucune signature publique de `brain/index.ts` ne bouge** — ni `controlerDossier`, ni `controleRemediation`, ni `RapportControles`, ni `Controle`, ni `ConstatControle`, ni `NiveauControle`.

**Le compteur SURVIT** — c'est l'arbitrage de l'objection 2 du tech-lead : la saturation ne rend pas un booléen, elle corrige un compte. Les trois seuils d'it3 sont intacts.

---

## 5 — Lot

### L1 — `atteignabilite-saturee` — **`contrat`** (touche `src/brain/`), s'exécute **seul et en premier**

**Pas d'essaim, pas de worktree, pas de fusion** — un lot, un agent, une exécution séquentielle. Précédents it3 et it4, tous deux à lot unique.

| | fichier | note |
|---|---|---|
| **N** | `src/brain/dossier/atteignabilite.ts` | le module neuf |
| **N** | `src/brain/dossier/atteignabilite.test.ts` | ses témoins + les trois gardes G1/G2/G3 |
| **R** | `src/brain/dossier/controles.ts` | import, proses, deux docstrings |
| **R** | `src/brain/dossier/controles.test.ts` | 3 `it` sur 46 |
| **R** | `src/features/dossier-controles/tests/panneauControles.test.tsx` | **possédé, attendu INCHANGÉ** — voir ci-dessous |

**Le fichier de feature est POSSÉDÉ par le lot mais ne doit PAS être modifié.** Il est déclaré ici parce que le mécanisme de prose retenu le rend **vert sans retouche**, et que toute modification serait le signal que le mécanisme a dérivé. Mesuré deux fois (QA + orchestrateur) : sa fixture `dossierOrphelin` (l.105-124) porte **un seul indice que ni savoir, ni effet, ni enchaînement ne produit** — cas `brut === 0`, dont le message reste littéralement inchangé. Ses trois ancres restent à 1 occurrence : `/aucun enchaînement/` (dans le message ; la nouvelle remédiation dit « **Un** enchaînement », qui ne matche pas), `/Une trace dans la cendre/`, `/Personnages → Savoirs/` (dans la nouvelle remédiation).

### Les DEUX TEMPS, dans le lot — la porte passée aux deux

C'est **l'unique instrument** de « déplacement, jamais réécriture » : un déplacement se relit en diff, une réécriture sous couvert de déplacement passe inaperçue.

- **T1 — déplacement seul.** `atteignabilite.ts` naît avec la fonction **copiée à l'identique** (corps, docstring, noms, types). `controles.ts` l'importe. `import type { Delta } from './deltas'` **disparaît de `controles.ts`** (relevé tech-lead : un seul usage réel, `controles.ts:389` ; `:225` est un commentaire). **Seule modification de test admise : `controles.test.ts:744`, `['controles.ts']` → `['atteignabilite.ts']`.** `tsc --noEmit` + `jest` verts. **Une autre assertion rouge ⇒ ce n'était pas un déplacement : on recommence T1.**
- **T2 — saturation, proses, témoins.**

---

## 6 — Critères d'acceptation

Tous observables par un instrument **qui existe déjà** (jest + Testing Library). Les valeurs attendues sont **mesurées**, pas prédites — relevé QA, tour 2, § 1 et § 2.

1. **Le déplacement est iso-comportement.** *Étant donné* le dépôt à l'état T1, *quand* `producteursParIndice` a migré vers `atteignabilite.ts` corps et docstring à l'identique, *alors* `tsc --noEmit` et `jest` sont verts sur les 8 suites (**324 tests**, baseline mesurée) avec **exactement une** assertion modifiée — `controles.test.ts:744`. — *unitaire.*

2. **C'est un point fixe, pas une passe.** *Étant donné* une chaîne `A(savoir) → B → C` avec `monde.indices` ordonné **`[C, B, A]`**, *quand* le compte saturé est calculé, *alors* A, B et C comptent **1** chacun ; *et*, dans le **même test**, la même chaîne privée de l'arête `B→C` laisse **C à 0** pendant que A et B restent à 1 ; *et* la carte est **identique** sur le dossier dont `monde.indices` est renversé. — *unitaire, `atteignabilite.test.ts`.*

3. **Le cycle bascule, et la bascule se discrimine.** *Étant donné* `A.mene_a=['B']`, `B.mene_a=['A']` sans savoir ni delta, *quand* `controlerDossier` s'exécute, *alors* les deux indices sont **`bloquant`** et `jouable` est **faux** ; *et*, dans le **même test**, un savoir posé sur A fait passer A à **silence** (compte 2) et B à **`alerte`** (compte 1). — *unitaire, `controles.test.ts:609-634` réécrit. KR-197/202.*

4. **L'auto-boucle bascule, et la bascule se discrimine.** *Étant donné* `A.mene_a=['A']` sans autre source, *quand* `controlerDossier` s'exécute, *alors* A est **`bloquant`** ; *et*, dans le **même test**, un savoir posé sur A le fait passer à **silence** (compte 2). — *unitaire, `controles.test.ts:657-685` réécrit. KR-197/202.*

5. **Le calme des fixtures ne bouge pas.** *Étant donné* `dossier-reference.json` et `dossier-minimal.json`, *quand* la saturation remplace la lecture à plat, *alors* le rapport est **identique** — référence : 0 constat `indice-sans-source`, les 4 indices à 2 producteurs ; minimal : `cendres-tiedes` en `alerte`, `sceau-brise` en silence — *et* `suffisance`, `couverture`, `validate`, `roundtrip`, `amorce`, `pastilles` restent vertes **sans qu'une seule assertion soit modifiée**. — *unitaire. Valeurs mesurées, QA § 1.*

6. **Les deux messages se distinguent, et celui du cas nu est intact.** *Étant donné* un dossier portant à la fois un indice en cycle et un indice sans aucune source, *quand* le rapport est produit, *alors* le constat du cycle **ne contient pas** « aucun enchaînement » et celui de l'orphelin **le contient** — les deux dans le **même test** ; *et* `panneauControles.test.tsx` reste vert **sans une seule modification**. — *unitaire + composant. KR-199/197/202.*

7. **Le porteur du littéral a déménagé, et il est unique.** *Étant donné* le balayage de source de `controles.test.ts:729-745`, *quand* la fonction a migré en entier, *alors* `atteignabilite.ts` est le **seul** fichier non-test de `brain/dossier/` portant le littéral `'reveler_indice'`, et `controles.ts` n'en porte **aucune** occurrence. — *unitaire, balayage existant réécrit.*

8. **Le recensement des racines reste borné, et la borne est dérivée des registres.** *Étant donné* les registres qui font foi, *quand* `atteignabilite.test.ts` s'exécute, *alors* **G1** `CHEMINS_DE_DELTAS` compte 4 sites et les clés sont construites **depuis la table** ; **G2** les seuls `DELTAS` dont `refKinds` contient `'indice'` sont exactement `['reveler_indice']` ; **G3** les `REFERENCES_SIMPLES` d'espace `'indice'` sont exactement les trois chemins d'aujourd'hui, chacun annoté **PRODUCTEUR** ou **PORTE**. — *unitaire. KR-199.*

---

## 7 — Tests nommés (KR cités → test qui les tient)

| KR | Test |
|---|---|
| **KR-199** (balayer depuis le registre, jamais N littéraux) | critère 8, G1/G2/G3 — chacune dérive sa liste d'un registre, aucune n'énumère à la main |
| **KR-197 / KR-202** (deux entités dans le MÊME test) | critères 3, 4, 6 — chacun porte sa moitié qui déclenche **et** sa moitié qui ne déclenche pas |
| **KR-217** (canal distinct, deux axes) | critère 5 — `validate.test.ts` reste vert sans modification : le rapport ne passe jamais par `errors`/`warnings` |
| **KR-224** (monde ouvert, hypothèse datée) | H1/H2 en tête de `atteignabilite.ts` — même forme, même domicile |
| **KR-225** (pas d'anomalie `error` sur un dossier persisté) | critère 5 — les deux fixtures passent `DossierService` et ne portent aucun `error` |
| **KR-164** (un code par cause) | § 8 · C1 — `REJETÉ` du second `ControleId`, et critère 6 qui prouve que la distinction vit dans le **message**, pas dans le code |
| **KR-226** (invariant anti-dérivation) | **non touché** — aucune règle de cette tranche ne déclare `section: 'canon'`. Sa réécriture est la charge de la n° 7 |
| **KR-013/113** (état dérivé) | § 2 — aucune mémoïsation, `controlerDossier` reste pure et se rappelle à chaque rendu |

---

## 8 — Registre des désaccords

> Tout `REJETÉ` d'annexe est recopié ici : un refus motivé resté en annexe n'existe pas pour l'essaim (BUG-082).

### C1 — une prose ou deux ? → **RETENU : DEUX messages, UNE remédiation** (porté par L1)

**J'ai tranché avec le Narratif (tour 2) contre PM, UX et Tech Lead (tour 2), et le motif est mécanique, pas esthétique.** Les trois avaient convergé sur « un seul texte » en s'appuyant sur la démonstration du Tech Lead que deux textes coûtent un champ sur `ConstatControle`. Cette démonstration est **vraie de la remédiation et fausse du message**, et personne ne l'avait séparée avant le tour 2 du Narratif :

- le **message** est gravé dans le constat **à l'émission** (`controles.ts:669-676`) — deux messages coûtent **zéro champ, zéro code, zéro type** ;
- la **remédiation** est résolue **plus tard**, depuis `constat.niveau` **seul** — deux consignes exigeraient un discriminant sur une interface **exportée et re-sortie par `brain/index.ts`**, donc posable sur les constats des cinq autres règles : **état illégal représentable**, famille BUG-082.

Trois confirmations indépendantes : le coût mesuré par la QA est de **0 assertion réécrite** pour cette forme contre **1** pour les variantes à texte unique ; la contrainte non négociable de l'UX (« le message ne nie jamais un enchaînement existant ») est tenue ; l'exigence du PM (« le geste est le même dans les deux cas ») est tenue par la remédiation unique.

**Ce que chaque rôle perd, écrit pour qu'on ne le redécouvre pas** : le PM perd la simplicité d'un texte unique — compensé, la remédiation, elle, est unique ; l'UX obtient ses deux messages mais **pas** ses deux remédiations ; le Narratif perd sa prose unique « Aucun chemin praticable », **retirée par lui-même** au tour 2 ; le Tech Lead voit sa prose de tour 1 tomber, et il l'avait lui-même retirée.

### C1 bis — le fragment `/aucun enchaînement/` → **SANS OBJET**

Le message du cas `brut === 0` restant littéralement inchangé, la garde de feature reste verte sans retouche. **Le principe reste acté** au cas où une tranche future rouvre le texte — `REJETÉ` du Tech Lead, maintenu : *conserver un fragment en contraignant la prose française de `brain/` inverse la règle d'encapsulation ; c'est la garde qui se réécrit, jamais le texte de l'auteur qui se contorsionne.* Ici, aucune des deux n'a eu à céder.

### C2 — la remédiation `alerte` → **RETENU, sans critère propre** (porté par L1)

Arbitrage PM : différence de **gravité**, pas de **nature** — elle ne mérite pas de gonfler la tranche d'un critère. Mais le coût chiffré par le Tech Lead et confirmé par la QA est de **1 littéral, 0 fichier, 0 assertion** : c'est une conséquence gratuite du même edit, pas un élargissement. **L'UX a reconnu une erreur d'audit de son tour 1** (elle n'avait vérifié que le message, pas l'opérabilité de la remédiation).

### C4 — point fixe ou une passe ? → **RETENU : le témoin consolidé** (critère 2)

La QA avait raison : les deux témoins annoncés (cycle, auto-boucle) **passent sous un simple filtre « racine seulement »** et ne prouvent donc pas le point fixe. Elle a ensuite **mesuré que son propre ordre `[A,B,C]` ne discriminait rien non plus** et l'a retiré au profit de l'ordre `[C,B,A]` du Tech Lead, tout en maintenant son pairage négatif.

> **CORRECTION portée après la vérification QA en mode B (2026-09-16) — deux affirmations de ce paragraphe étaient FAUSSES, et elles ont traversé deux tours de comité plus la porte mécanique parce qu'aucune de ces portes n'exécute une phrase.**
>
> 1. **« l'ordre `[C,B,A]` prouve le point fixe »** — faux. Une chaîne à **2 arêtes** se sature en une passe : la reconstruction ne vérifie que l'appartenance FINALE de l'amont à l'ensemble atteignable, décorrélée du nombre d'itérations. Mutant « relaxation gelée à une itération » posé sur le code livré : **les 7 tests restent verts**. Il faut une chaîne d'au moins **4 nœuds / 3 arêtes**.
> 2. **« le pairage négatif attrape la sur-propagation par composante connexe »** — faux. Dans la chaîne rompue, le dernier maillon est **totalement isolé** (aucune arête, ni entrante ni sortante) : une propagation non orientée n'a rien à lui propager. Mutant « relaxation en sens inverse » : **les 7 tests restent verts**. Il faut un nœud **relié** — `X.mene_a = ['A']` avec `A` raciné et `X` sans source propre, qui doit compter 0.
>
> Les deux témoins ont été renforcés dans le même lot. **Ce qui restait juste** : le témoin attrape bien le filtre « racine seulement » (mesuré), et le code livré ne porte aucun des deux défauts — c'est l'instrument qui était aveugle, pas l'implémentation.

### C5 — H1 / H2 → **RETENU** (porté par L1, docstring pure)

Deux clauses datées en tête de `atteignabilite.ts`, forme KR-224, **zéro signature, zéro champ, zéro test**. Rédaction finale : `tour2-narratif-ia.md`, annexe A. **H2 doit citer `savoirs[].revele_si.apres_indice_id` en toutes lettres** — c'est la seconde arête `indice → indice` du schéma, et sans ce nom la n° 8 la redécouvre.

### C6 — le garde-fou des racines → **RETENU : G1 + G2 + G3** (critère 8)

Le Narratif a reconnu que son garde-fou de tour 1 était **partiel** : `toHaveLength(4)` couvre 4 des 6 chemins lus et laisse passer deux trous réels — un producteur arrivant par `REFERENCES_SIMPLES` plutôt que par un delta (`Objet.revele_indice_id?`), et un **verbe** de delta neuf nommant un indice. G2 et G3 les ferment.

### `REJETÉ` — Tech Lead

1. **Deux lots `contrat`** (extraction, puis saturation) — *les deux nommeraient `controles.ts` et `controles.test.ts` : propriété non disjointe, et deux lots `contrat` ne tournent jamais en parallèle. La séparation est tenue par les deux TEMPS.*
2. **Exporter `producteursParIndice` par `brain/index.ts`** — *zéro consommateur hors `brain/dossier/`, même règle que `PREDICATES` et `DELTAS`.*
3. **Pré-exposer `indicesProduits(dossier): ReadonlySet<string>`** « pour la tranche suivante » — *abstraction à zéro appelant.*
4. **Remplacer le compteur par un booléen `atteignable`** — *supprimerait le seuil `1 → alerte` livré en it3 : régression de règle sous couvert de refactor.*
5. **Déplacer la règle `indice-sans-source` ou `PROSES_INDICE_SANS_SOURCE` vers `atteignabilite.ts`** — *ferait du module neuf un second registre de règles, et les balayages de source de `controles.ts` cesseraient de couvrir la moitié qui produit les constats.*
6. **Un marcheur de chemins générique pour relire les 4 sites de deltas** — *veto déjà tenu en it3 : `sitesDe` est privée à `validate.ts`, un second moteur de traversée dériverait en silence.*
7. **Mémoïser ou partager l'index entre les deux appels d'un rendu** — *KR-013/113, mesure d'it5 contre le cache.*
8. **Exhiber un cycle en mutant `dossier-reference.json` / `dossier-minimal.json`** — *fixtures lues par huit suites ; les témoins sont des clones mutés d'un seul champ.*
9. **Réécrire l'invariant KR-226 ici** — *aucune règle n'y déclare `section: 'canon'`. Charge de la n° 7.*
10. **Un champ discriminant sur `ConstatControle`** (`cause`, `brut`, `enBoucle`…) — *interface exportée et re-sortie par le baril : état illégal représentable pour une seule règle.*
11. **Dériver la remédiation en relisant `constat.message`** — *texte dérivé lu à distance ; la prose se reformule, la garde se tait.*
12. **Passer le `dossier` à `remediation(constat)`** — *change la signature de l'interface pour un seul appelant.*
13. **Exclure l'arête réflexive du compte quand l'indice a une racine** — *bascule le sens d'erreur vers le faux positif dans l'itération même qui sature.*
14. **Stocker le PORTEUR de l'arête dans `SourceIndice`** — *le point fixe recompte les arêtes depuis `dossier.monde.indices` ; un champ exporté à zéro lecteur externe est une dette.*
15. **Renommer `producteursParIndice`** — *le nom est le contrat d'extraction ; le renommer détruit l'unique instrument qui rend T1 relisible en diff.*
16. **Une sonde qui grep « H1 »/« H2 » dans la docstring** — *épingler un commentaire est un instrument que personne ne maintient.*

### `REJETÉ` — Narratif & IA

17. **Retirer le climat des racines** au motif qu'aucun moteur ne l'applique — *ce serait le premier faux positif réel de la règle, et il naîtrait dans l'itération même qui sature : on ne bascule pas un sens d'erreur dans les deux directions à la fois.*
18. **Saturer `savoirs[].revele_si.apres_indice_id` ici** — *c'est une porte de racine, charge n° 8 ; mais elle est nommée en H2 et rendue mécanique par G3.*
19. **Exporter le point fixe par `brain/index.ts` « pour la n° 9 »** — *motif distinct de celui du Tech Lead, les deux se gardent : les deux graphes ne coïncident pas, la n° 9 raisonnera sur un ÉTAT DE SESSION, pas sur la clôture statique du dossier.*
20. **Un second `ControleId` `indice-en-boucle`** — *même cause (« zéro producteur après saturation ») ; un code par cause, jamais par configuration. Ne vise pas la demande UX, qui était deux textes sous un code.*
21. **Deux remédiations sous le même `niveau`** — *`remediation(constat)` ne reçoit ni le dossier ni le compte brut.*

### `REJETÉ` — UX

22. **Garder le message bloquant actuel pour le cas boucle** — *il affirme « aucun enchaînement » en présence d'un enchaînement réel, et sa remédiation redemande le geste que l'auteur vient de faire : diagnostic auto-contradictoire.*
23. **Patcher la remédiation par une clause conditionnelle en laissant le message faux** — *maintenu contre cette configuration précise. Principe qui survit : **la remédiation ne peut jamais être seule à changer si le message reste littéralement faux**.*
24. **Nommer l'autre membre du cycle dans le message** (« …tourne en boucle avec l'indice X ») — *calculable seulement pour un cycle à 2, faux pour l'auto-boucle et les cycles à 3+ : une formulation à exceptions plutôt qu'une règle.*

### `REPORTÉ`

- **La seconde arête `indice → indice`** (`savoirs[].revele_si.apres_indice_id`) → **n° 8**, léguée par H2 et par la garde G3.
- **Le seuil `>= 2 → silence` sous la seconde lecture de `mene_a`** → **n° 9**. Si le moteur retient « liste de pistes servie au narrateur » plutôt que « octroi automatique », une arête satisfaite ne vaut pas un producteur plein et le seuil devient trop généreux. La correction se fait alors **sur le compte, dans `atteignabilite.ts`, en un seul endroit** — jamais sur le point fixe, qui n'utilise que la nécessité et reste valide sous les deux lectures.

---

## 10 — Définition de fini

- `tsc --noEmit` vert, `jest` vert, ESLint vert, Prettier passé.
- **T1 a été constaté vert avant T2**, avec `controles.test.ts:744` pour seule assertion touchée. *(Réserve unique du Tech Lead.)*
- Les 8 critères du § 6 sont verts.
- `panneauControles.test.tsx` est **inchangé** — `git diff` le prouve.
- H1 et H2 sont en tête de `atteignabilite.ts`, H2 citant `apres_indice_id` en toutes lettres.
- Les deux docstrings de `controles.ts` (§ 3) sont réécrites.
- Aucun nouvel export dans `brain/index.ts` — `git diff` le prouve.
- `npm run test:mutation` **n'est pas requis** : aucun des quatre fichiers mutés (`challenge`, `combat`, `xp`, `characteristics`) n'est touché.

---

## 11 — Signatures

**`atteignabilite.ts` expose** — au module `brain/dossier/` uniquement, **rien au baril** :

    export type FamilleDeSource = 'savoir' | 'delta' | 'mene_a'
    export interface SourceIndice { famille: FamilleDeSource }
    export function producteursParIndice(dossier: Dossier): Map<string, SourceIndice[]>

Nom, signature et forme de retour **inchangés**. `controles.ts` consomme `import { producteursParIndice } from './atteignabilite'` et ne lit que `.length` — il n'importe **ni** `SourceIndice` **ni** `FamilleDeSource`.

**Sémantique du point fixe** :

> `PRIMAIRE(y)` = nombre de sources de famille `savoir` ou `delta` visant `y`.
> `P` = plus petit ensemble tel que `{ y | PRIMAIRE(y) >= 1 }` soit inclus dans `P`, et que `x` dans `P` avec `y` dans `x.mene_a` implique `y` dans `P`.
> `compte(y)` = `PRIMAIRE(y)` + le nombre d'OCCURRENCES d'arêtes `x → y` dont `x` est dans `P`.
> Seuils **inchangés** : `0 → bloquant`, `1 → alerte`, `>= 2 → silence`.

**Algorithme prescrit — le porteur n'est jamais stocké** : (a) index brut par les six chemins, code d'aujourd'hui inchangé ; (b) `P` = les `y` dont l'index brut contient une source `famille !== 'mene_a'` ; (c) relaxation par liste de travail sur les arêtes relues dans `dossier.monde.indices`, jusqu'au point fixe ; (d) reconstruction — sources non-`mene_a` **plus une entrée `{ famille: 'mene_a' }` par OCCURRENCE d'arête survivante** (un `mene_a` qui cite deux fois la même cible comptait deux fois à plat ; l'iso-comportement l'exige quand tout est atteignable).

**Discrimination des deux messages, sans champ neuf** : `brut = producteurs.get(id)?.length ?? 0` à l'index **avant** saturation, `compte` **après**. `brut >= 1 && compte === 0` **équivaut** à « toutes les sources brutes sont des arêtes `mene_a` et aucune ne survit » — car une source primaire force `PRIMAIRE >= 1`, donc `compte >= 1`. Le second message est **vrai par construction**, et cette équivalence s'écrit dans la docstring : c'est elle qui empêche la phrase de dériver.

**Frontière de couture, non négociable** : `atteignabilite.ts` ne connaît **ni `SectionId`, ni `NiveauControle`, ni une seule phrase française**, et n'importe **jamais** `validate.ts` ni `sections.ts`. Imports admis : `type Delta from './deltas'`, `type Dossier from './types'`. Il dit qui produit quoi ; `controles.ts` dit ce qu'on en conclut et comment on le raconte.
