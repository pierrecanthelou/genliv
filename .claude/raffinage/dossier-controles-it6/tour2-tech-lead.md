# Tour 2 — tech-lead — dossier-controles it6

**Réponse nommée à UX (C1) — mécanique, mesurée.** `remediation` d'une règle est `(constat: ConstatControle) => string` (`controles.ts:681`) : elle reçoit le constat, **jamais le dossier**. Le MESSAGE se choisit librement dans `controler` — zéro champ. La REMÉDIATION, non : deux textes sous le même `niveau` exigent un discriminant sur `ConstatControle`, interface **exportée** et re-sortie par `brain/index.ts`, donc posable sur les constats des cinq autres règles — **état illégal représentable**, la forme exacte vetoée en it1 (BUG-082). **Ta variante coûte un champ de contrat ; celle du narratif n'en coûte aucun.** Narratif **confirmé** : `Record<SeuilIndice, ProseControle>` intact, sélecteur inchangé. Et tes deux `REJETÉ` ne le visent pas — il ne garde pas le texte actuel (a) et n'ajoute pas de clause en queue (b), il réécrit les deux lignes entières. **Je prends ses trois textes.**

**Le fragment `/aucun enchaînement/` : garde à réécrire, pas contrainte de conception.** Le commentaire `panneauControles.test.tsx:139-143` pose lui-même l'intention — « le reformuler ne doit pas faire rougir ce test, le SUPPRIMER doit ». Il a choisi un fragment qui ne survit pas à une reformulation *vraie*. Laisser un test de feature dicter la prose française de `brain/` inverse la règle d'encapsulation. → `/ne pourra jamais l'obtenir/`, invariant des trois formulations candidates.

**Mes trois objections.** **1 — maintenue** sur sa conclusion (le fichier de feature est POSSÉDÉ par le lot) ; son corollaire « conserver le fragment » est **retiré**, motif ci-dessus. **2 — retirée** : tranchée, le compteur survit. **3 — maintenue** : `controles.test.ts:676-684` perd sa discriminance, réécriture prescrite.

**C2** — UX a raison sur le message, narratif sur la remédiation : **deux lignes différentes, aucun conflit**. Coût : **1 littéral dans `controles.ts`, 0 fichier, 0 assertion**.

**C4** — un témoin unique, annexe § 4. **C5** — H1/H2 tiennent dans L1, **zéro effet sur la signature**.

**Découpage FINAL : 1 lot, 5 fichiers, inchangé.**

---

# ANNEXE (hors quota)

## 1. Découpage FINAL — UN SEUL LOT

| id | titre | marque | ordre | fichiers |
|---|---|---|---|---|
| **L1** | Atteignabilité : extraction, puis saturation | **`contrat`** | seul, premier — **pas d'essaim, pas de worktree** | **N** `src/brain/dossier/atteignabilite.ts` · **N** `src/brain/dossier/atteignabilite.test.ts` · **R** `src/brain/dossier/controles.ts` · **R** `src/brain/dossier/controles.test.ts` · **R** `src/features/dossier-controles/tests/panneauControles.test.tsx` |

**C1, C2 et C5 n'ajoutent aucun fichier** : les trois proses et les deux docstrings d'hypothèses vivent dans des fichiers déjà possédés par L1. Aucun toucher à `src/brain/index.ts`. Un lot = un agent = une exécution séquentielle.

**Les deux temps DANS le lot, la porte passée aux deux** — unique instrument de « déplacement, jamais réécriture » :

- **T1 — déplacement seul.** Fonction **copiée à l'identique**, `controles.ts` l'importe, `import type { Delta } from './deltas'` **disparaît de `controles.ts`** (relevé : `Delta` n'y a qu'un usage réel, `controles.ts:389` ; `:225` est un commentaire). **Seule** modification de test admise : `controles.test.ts:744` → `['atteignabilite.ts']`. `tsc` + `jest` verts. Une autre assertion rouge ⇒ ce n'était pas un déplacement.
- **T2 — saturation + prose + tests.**

## 2. Signature exacte exposée par `atteignabilite.ts`

Au module `brain/dossier/` uniquement — **rien au baril `brain/index.ts`** :

    export type FamilleDeSource = 'savoir' | 'delta' | 'mene_a'
    export interface SourceIndice { famille: FamilleDeSource }
    export function producteursParIndice(dossier: Dossier): Map<string, SourceIndice[]>

**Nom et forme de retour INCHANGÉS** (contrat d'extraction gelé par `controles.ts:346-348`). `controles.ts` consomme `import { producteursParIndice } from './atteignabilite'` et ne lit que `.length` — il n'importe **ni** `SourceIndice` **ni** `FamilleDeSource`.

**Le compteur SURVIT** (objection 2 close) :

> `PRIMAIRE(y)` = nombre de sources `savoir`/`delta` visant `y`.
> `P` = plus petit point fixe : `{ y | PRIMAIRE(y) >= 1 }` inclus dans `P`, et `x` dans `P` avec `y` dans `x.mene_a` implique `y` dans `P`.
> `compte(y) = PRIMAIRE(y) + nombre d'occurrences d'arêtes x → y avec x dans P`.
> Seuils inchangés : `0 → bloquant`, `1 → alerte`, `>= 2 → silence`.

**Algorithme prescrit — le PORTEUR n'est jamais stocké.** (a) index brut par les six chemins, code d'aujourd'hui inchangé ; (b) `P` = ensemble des `y` dont l'index brut contient une source `famille !== 'mene_a'` ; (c) relaxation par liste de travail sur les arêtes relues dans `dossier.monde.indices` jusqu'au point fixe ; (d) reconstruction : sources non-`mene_a` + **une entrée `{famille:'mene_a'}` par OCCURRENCE d'arête survivante** (un `mene_a` qui cite deux fois la même cible comptait deux fois à plat — l'iso-comportement l'exige quand tout est atteignable). `SourceIndice` reste `{ famille }`.

**Frontière de couture, non négociable** : `atteignabilite.ts` ne connaît **ni `SectionId`, ni `NiveauControle`, ni une seule phrase française**, et n'importe **jamais** `validate.ts` ni `sections.ts`. Imports admis : `type Delta from './deltas'`, `type Dossier from './types'`. Aucun cycle.

**H1/H2 (C5) — RETENU, coût nul.** Deux clauses datées en tête du fichier, forme KR-224, **docstring pure** — aucune signature, aucun champ, aucun test. H1 « le moteur inscrit au carnet les cibles de `mene_a[]` à l'acquisition de leur amont — hypothèse, `types.ts:1069` ne l'écrit pas » ; H2 « une RACINE est réputée amorçable ; `revele_si`, `apres_indice_id`, `declencheur_expr` ne sont pas évalués — charge n° 8 ». H2 **doit** citer `savoirs[].revele_si.apres_indice_id` en toutes lettres : seconde arête indice→indice du schéma.

Voyagent aussi vers `atteignabilite.test.ts` : `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` et la construction des clés depuis la table (`controles.test.ts:687-727`) — garde-fou du recensement des racines, que la saturation rend contagieux.

## 3. Prose — textes ADOPTÉS (narratif), contraintes UX tenues

| Seuil | Colonne | Texte |
|---|---|---|
| bloquant | message | « Aucun chemin praticable ne donne cet indice : le joueur ne pourra jamais l'obtenir. » |
| bloquant | remédiation | « Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas. » |
| alerte | message | **INCHANGÉ** (« un seul chemin » reste vrai post-saturation) |
| alerte | remédiation | « Ouvrez-lui un second chemin — un autre personnage (Personnages → Savoirs), un effet « révèle l'indice », ou un enchaînement **depuis un indice que le joueur peut lui-même obtenir** (Indices → Mène à). » |

**C2 chiffré** : la ligne `alerte` est **un littéral de `controles.ts:270`**. Aucun test n'épingle ce texte (relevé : zéro occurrence de ces phrases dans `src/**/*.test.*`). Les deux sondes qui le traversent restent vertes par construction — `controles.test.ts:893-895` n'exige que « non vide » et « distinctes », `controles.test.ts:1166-1215` interdit `TERMES_INTERDITS = ['↪','_texte','_expr','si_bloque','revele_si','réimport','bloquant','warning','error']`, dont **aucun** n'apparaît dans les quatre textes. **Coût : 0 fichier, 0 assertion.**

**Deux docstrings à réécrire dans le même lot** : `controles.ts:249-258` — l'isomorphisme « trois familles comptées, trois offertes » **cesse d'être vrai**, il devient « trois comptées, deux offertes sans condition et une **sous condition explicitée dans la phrase** » ; et le bloc « `mene_a` EST LU À PLAT » (`controles.ts:367-375`), qui voyage et doit décrire la saturation.

## 4. Le témoin DÉCISIF (C4) — UN seul test, deux assertions

QA a raison : mes témoins « cycle » et « auto-boucle » **passent sous un filtre racine mono-passe**. Ils ne prouvent pas le point fixe, seulement la sévérité. Et le témoin-chaîne de la QA, tel qu'écrit, **passe sous une passe unique en ordre document** : il ne fixe pas l'ordre de `monde.indices`.

Un clone, **un seul champ muté**, `monde.indices` ordonné **`[E, D, C, B, A]`** :

| indice | racine | `mene_a` | `compte` attendu |
|---|---|---|---|
| `A` | savoir | `['B']` | 1 |
| `B` | — | `['C']` | 1 |
| `C` | — | `[]` | 1 |
| `E` | — | `['D']` | 0 |
| `D` | — | `[]` | **0** |

1. **Assertion 1** — la carte vaut `{A:1, B:1, C:1, D:0, E:0}`.
2. **Assertion 2** — la **même** carte sur le **même** dossier dont `monde.indices` est *renversé*. L'indépendance à l'ordre **est** la définition du point fixe ; un exemple seul ne la donne pas.

**Ce qui échoue, précisément :** un filtre « racines seulement » rend `B:0` et `C:0` (rouge dès le 1er saut) ; **une passe unique en ordre document** visite `C` avant `B` avant `A`, `C` n'entre jamais dans `P` → `C:0` (rouge) ; une passe unique en ordre inverse passerait l'assertion 1 et **échoue sur l'assertion 2**. `E→D` porte la moitié négative (KR-197/202) **et** le discriminant « >= 1 producteur brut, 0 après saturation » sur lequel la prose du § 3 repose.

Les trois autres témoins restent, mais ils sont de **sévérité**, pas de point fixe : cycle `A↔B` → 0/0 ; auto-boucle nue → 0 ; auto-boucle + racine → 2 ; non-régression des six chemins ; plus les deux gardes de source (`SOURCE_ATTEIGNABILITE` ne contient ni `'.errors'` ni `validateDossier`).

## 5. Ce que les tests deviennent — MESURÉ vs DÉCLARÉ

| Site | État | Attendu | Statut de l'affirmation |
|---|---|---|---|
| `controles.test.ts:744` | `['controles.ts']` | `['atteignabilite.ts']` — **T1** | **MESURÉ par lecture** : les 3 occurrences de `reveler_indice` dans `controles.ts` (l. 354, 387, 391) sont **toutes dans le bloc déplacé** ; la seule qui matche la `MARQUE` est `:391` |
| `controles.test.ts:609-634` (cycle) | 2 alertes, `jouable: true` | 2 **bloquants**, `jouable: false`, **plus** une moitié discriminante dans le MÊME test : `monde.indices = [cuivre→fer, fer→cuivre, {id:'indice.sceau-brise'}]` → `sceau-brise` **silence** | **DÉCLARÉ** — à constater au run T2 |
| `controles.test.ts:657-685` (auto-boucle) | alerte / bloquant | ses deux moitiés rendent `bloquant` ⇒ **réécriture** : auto-boucle nue → **bloquant** ; auto-boucle + savoir sur `A` → **silence** (KR-197/202) | **DÉCLARÉ** |
| `controles.test.ts:590` + `:1139` (`dossier-minimal.json`) | 1 alerte `cendres-tiedes` | **inchangé** | **RELEVÉ SUR LA DONNÉE** : `cendres-tiedes` est produit par un delta de résolution — une racine, donc dans `P`, donc son arête vers `sceau-brise` survit ; `sceau-brise` = 3. **Reste à confirmer au run** |
| `controles.test.ts:1141-1155` (`dossier-reference.json`) | 0 constat | **inchangé** | **RELEVÉ SUR LA DONNÉE** : 4 indices ; `pas-dans-la-cendre` = savoir + effet de jalon (racine) ; ses deux arêtes survivent, chaque cible ayant par ailleurs un savoir → 2 ; `trace-du-guet` = savoir + delta → 2. **Aucune arête n'est portée par un indice hors `P`. Reste à confirmer au run** |
| `controles.test.ts:636-655` (`mene_a` compte) | inchangé | **inchangé** | **RELEVÉ SUR LA DONNÉE** |
| `panneauControles.test.tsx:145` | `/aucun enchaînement/` | `/ne pourra jamais l'obtenir/` | **DÉCLARÉ** — les gardes structurelles l.151-153 ne bougent pas |
| `controles.test.ts:393` (KR-226) | vert | **vert** — aucune règle `section: 'canon'` ici. Hors périmètre | inchangé |

**Relevé n° 3 de la QA — les suites voisines, MESURÉ.** Quatre balayages énumèrent `brain/dossier/` et verraient naître `atteignabilite.ts`. Aucun ne rougit : `deltas.test.ts:156-163` cherche `DELTAS[…]` (le code déplacé n'en contient aucun) ; `deltas.test.ts:201-206` **exclut** `MODULE_DOSSIER` ; `couverture.test.ts:563-568` cherche `function feuillesDeLaFixture` ; `amorce.test.ts:60-68` cherche `MARQUEUR_A_ECRIRE`. Le seul balayage sensible est `controles.test.ts:739-744`, celui qu'on bascule en T1. **Créer le fichier ne casse rien ailleurs ; c'est en déplaçant le littéral qu'on bascule une assertion, et une seule.**

## 6. REJETÉ NEUFS — à recopier au § 8 du plan

1. **REJETÉ — un champ discriminant sur `ConstatControle`** (`cause`, `configuration`, `sature`) pour porter deux remédiations bloquantes. *Motif : `ConstatControle` est exporté et re-sorti par `brain/index.ts` ; le champ serait posable sur les constats des cinq autres règles et sur un `niveau: 'alerte'` — état illégal représentable, pour un seul lecteur (BUG-082).*
2. **REJETÉ — dériver la remédiation en relisant `constat.message`** (`includes('boucle')`). *Motif : un sélecteur qui lit une prose possédée par une table voisine — violation d'encapsulation, et rien ne rougit si la phrase est reformulée.*
3. **REJETÉ — passer le `dossier` à `remediation(constat)`.** *Motif : change la signature de l'interface `Controle` et les six règles pour un seul appelant.*
4. **REJETÉ — conserver le fragment `/aucun enchaînement/` en contraignant la prose française** (ma propre proposition de tour 1). *Motif : un test de feature dicterait le texte d'un module `brain/` ; inversion exacte de la règle d'encapsulation.*
5. **REJETÉ — exclure l'arête réflexive du compte quand l'indice a une racine** (`A.mene_a=['A']` + savoir → `alerte` au lieu de `silence`). *Motif : bascule le sens d'erreur vers le faux positif dans l'itération même qui sature ; charge n° 8.*
6. **REJETÉ — stocker le PORTEUR de l'arête dans `SourceIndice`.** *Motif : le point fixe recompte les arêtes depuis `dossier.monde.indices` ; un champ exporté à zéro lecteur externe est une dette.*
7. **REJETÉ — renommer `producteursParIndice` en `producteursAtteignables`.** *Motif : le nom est le contrat d'extraction gelé par `controles.ts:346-348` ; le renommer détruit l'unique instrument qui rend T1 relisible en diff.*
8. **REJETÉ — une sonde qui grep « H1 »/« H2 » dans la docstring.** *Motif : épingler un commentaire est un instrument que personne ne maintient ; le garde-fou réel est `CHEMINS_DE_DELTAS.toHaveLength(4)`, qui voyage.*

**Les neuf `REJETÉ` de ma note de tour 1 sont MAINTENUS tels quels, sauf le corollaire du n° 4 ci-dessus.** Les quatre du narratif et les trois d'UX sont à recopier également — je n'en contredis aucun, sauf UX-(b) dont je constate qu'il **ne vise pas** la proposition finalement retenue.

## 7. Aucun veto de mon domaine

Pas d'import inter-features (le fichier de feature est possédé par le même lot, même feature) ; pas de contournement de contrat `brain/` ; pas de duplication de source de vérité — l'extraction la **réduit** ; pas de persistance brute ; pas de référence par nom ; **aucun fichier partagé entre lots**, il n'y a qu'un lot.

**VERDICT — recevable sous réserve** (réserve unique et mécanique : le lot exécute et fait constater **T1 vert avant T2**, avec `controles.test.ts:744` pour seule assertion touchée au premier temps).
